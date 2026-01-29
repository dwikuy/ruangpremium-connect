import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WalletPurchaseRequest {
  order_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body: WalletPurchaseRequest = await req.json().catch(() => ({}));
    const { order_id } = body;
    if (!order_id) {
      return new Response(
        JSON.stringify({ success: false, error: "order_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify caller identity using user token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const userId = userData.user.id;

    // Use service role for all DB writes (avoids RLS issues), but keep authorization checks above.
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Load order + items
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        id,
        reseller_id,
        is_reseller_order,
        status,
        total_amount,
        paid_at,
        order_items (
          id,
          product_id,
          quantity,
          products ( product_type )
        )
      `,
      )
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ success: false, error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!order.is_reseller_order || order.reseller_id !== userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Idempotency: if already paid, just ensure fulfillment exists/triggered.
    const isAlreadyPaid = String(order.status) === "PAID";

    const chargeAmount = Number(order.total_amount ?? 0);
    if (!Number.isFinite(chargeAmount) || chargeAmount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid order amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!isAlreadyPaid) {
      // Get wallet
      const { data: wallet, error: walletError } = await supabase
        .from("reseller_wallets")
        .select("user_id, balance, total_spent")
        .eq("user_id", userId)
        .maybeSingle();

      if (walletError) {
        throw walletError;
      }

      const currentBalance = Number(wallet?.balance ?? 0);
      if (currentBalance < chargeAmount) {
        return new Response(
          JSON.stringify({ success: false, error: "Saldo wallet tidak mencukupi" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const newBalance = currentBalance - chargeAmount;
      const now = new Date().toISOString();

      // Update wallet
      await supabase
        .from("reseller_wallets")
        .update({
          balance: newBalance,
          total_spent: Number(wallet?.total_spent ?? 0) + chargeAmount,
          updated_at: now,
        })
        .eq("user_id", userId);

      // Record wallet transaction
      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        order_id: order.id,
        transaction_type: "PURCHASE",
        amount: -chargeAmount,
        balance_after: newBalance,
        description: `Pembelian via wallet #${String(order.id).slice(0, 8)}`,
      });

      // Mark order paid
      await supabase
        .from("orders")
        .update({ status: "PAID", paid_at: now, updated_at: now })
        .eq("id", order.id);
    }

    // Ensure fulfillment jobs exist for this order
    const items = (order as any).order_items as Array<
      { id: string; products: { product_type: string } | null }
    > | null;

    if (items && items.length > 0) {
      const orderItemIds = items.map((i) => i.id);

      const { data: existingJobs } = await supabase
        .from("fulfillment_jobs")
        .select("order_item_id")
        .in("order_item_id", orderItemIds);

      const existingSet = new Set((existingJobs || []).map((j: any) => j.order_item_id));
      const jobsToCreate = items
        .filter((i) => !existingSet.has(i.id))
        .map((i) => ({
          order_item_id: i.id,
          job_type: (i.products?.product_type as "STOCK" | "INVITE") || "STOCK",
          status: "PENDING",
        }));

      if (jobsToCreate.length > 0) {
        await supabase.from("fulfillment_jobs").insert(jobsToCreate);
      }
    }

    // Trigger fulfillment processing
    try {
      const triggerUrl = `${supabaseUrl}/functions/v1/trigger-fulfillment`;
      await fetch(triggerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ order_id: order.id }),
      });
    } catch (e) {
      console.error("Failed to trigger fulfillment:", e);
    }

    return new Response(
      JSON.stringify({ success: true, order_id: order.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("wallet-purchase error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
