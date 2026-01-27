import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Trigger Fulfillment Worker
 * 
 * This function can be called:
 * 1. Manually via API to process pending jobs
 * 2. By a cron job (pg_cron) to process jobs periodically
 * 3. After payment success from the webhook
 * 
 * It fetches pending fulfillment jobs and calls the process-fulfillment function
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const { order_id, job_id, batch_size = 10 } = body;

    // Get pending jobs based on filters
    let query = supabase
      .from("fulfillment_jobs")
      .select("id, job_type, status, attempts, order_item_id")
      .in("status", ["PENDING"])
      .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
      .order("created_at", { ascending: true })
      .limit(batch_size);

    if (job_id) {
      query = supabase
        .from("fulfillment_jobs")
        .select("id, job_type, status, attempts, order_item_id")
        .eq("id", job_id);
    }

    if (order_id) {
      // Get all jobs for a specific order
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("id")
        .eq("order_id", order_id);
      
      if (orderItems && orderItems.length > 0) {
        const orderItemIds = orderItems.map((item: { id: string }) => item.id);
        query = supabase
          .from("fulfillment_jobs")
          .select("id, job_type, status, attempts, order_item_id")
          .in("order_item_id", orderItemIds)
          .in("status", ["PENDING", "PROCESSING"]);
      }
    }

    const { data: pendingJobs, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch pending jobs: ${fetchError.message}`);
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pending jobs to process",
          jobs_found: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${pendingJobs.length} pending jobs to process`);

    // Call the process-fulfillment function for each job
    const processUrl = `${supabaseUrl}/functions/v1/process-fulfillment`;
    const results: { job_id: string; success: boolean; message: string }[] = [];

    for (const job of pendingJobs) {
      try {
        const response = await fetch(processUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ job_id: job.id }),
        });

        const result = await response.json();
        
        results.push({
          job_id: job.id,
          success: result.success,
          message: result.message || (result.results?.[0]?.message || "Processed"),
        });
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        results.push({
          job_id: job.id,
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${pendingJobs.length} jobs`,
        summary: {
          total: pendingJobs.length,
          success: successCount,
          failed: failCount,
        },
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Trigger fulfillment error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
