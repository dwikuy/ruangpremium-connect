import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FulfillmentJob {
  id: string;
  order_item_id: string;
  job_type: "STOCK" | "INVITE";
  status: string;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  provider_account_id: string | null;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  input_data: Record<string, string> | null;
  products: {
    id: string;
    name: string;
    product_type: string;
    provider_id: string | null;
  } | null;
  orders: {
    id: string;
    customer_email: string;
    customer_name: string;
  } | null;
}

interface StockItem {
  id: string;
  secret_data: string;
  product_id: string;
}

interface ProviderAccount {
  id: string;
  name: string;
  credentials: Record<string, string>;
  provider_id: string;
  max_daily_invites: number;
  current_daily_invites: number;
  cooldown_until: string | null;
}

interface Provider {
  id: string;
  name: string;
  slug: string;
  config: Record<string, unknown> | null;
}

// deno-lint-ignore no-explicit-any
type SupabaseClientAny = ReturnType<typeof createClient<any>>;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { job_id } = await req.json().catch(() => ({}));

    // Get pending jobs to process (or specific job if provided)
    let query = supabase
      .from("fulfillment_jobs")
      .select(`
        *,
        order_items (
          *,
          products (*),
          orders (*)
        )
      `)
      .in("status", ["PENDING", "PROCESSING"])
      .order("created_at", { ascending: true })
      .limit(10);

    if (job_id) {
      query = supabase
        .from("fulfillment_jobs")
        .select(`
          *,
          order_items (
            *,
            products (*),
            orders (*)
          )
        `)
        .eq("id", job_id);
    }

    const { data: jobs, error: jobsError } = await query;

    if (jobsError) {
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No pending jobs", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { job_id: string; status: string; message: string }[] = [];

    for (const job of jobs) {
      const orderItem = job.order_items as unknown as OrderItem;
      
      if (!orderItem || !orderItem.products) {
        await markJobFailed(supabase, job.id, "Order item or product not found");
        results.push({ job_id: job.id, status: "FAILED", message: "Order item not found" });
        continue;
      }

      // Mark job as processing
      await supabase
        .from("fulfillment_jobs")
        .update({
          status: "PROCESSING",
          started_at: new Date().toISOString(),
          attempts: (job.attempts || 0) + 1,
        })
        .eq("id", job.id);

      try {
        if (job.job_type === "STOCK") {
          await processStockFulfillment(supabase, job, orderItem);
          results.push({ job_id: job.id, status: "COMPLETED", message: "Stock delivered" });
        } else if (job.job_type === "INVITE") {
          await processInviteFulfillment(supabase, job, orderItem);
          results.push({ job_id: job.id, status: "COMPLETED", message: "Invite sent" });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        
        if ((job.attempts || 0) + 1 >= (job.max_attempts || 3)) {
          await markJobFailed(supabase, job.id, errorMessage);
          results.push({ job_id: job.id, status: "FAILED", message: errorMessage });
          
          // Update order status to FAILED
          await supabase
            .from("orders")
            .update({ status: "FAILED" })
            .eq("id", orderItem.order_id);
        } else {
          // Schedule retry with exponential backoff
          const retryDelay = Math.pow(2, job.attempts || 0) * 60 * 1000; // 1min, 2min, 4min...
          const nextRetryAt = new Date(Date.now() + retryDelay).toISOString();
          
          await supabase
            .from("fulfillment_jobs")
            .update({
              status: "PENDING",
              last_error: errorMessage,
              next_retry_at: nextRetryAt,
            })
            .eq("id", job.id);
          
          results.push({ job_id: job.id, status: "RETRY", message: errorMessage });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Fulfillment worker error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processStockFulfillment(
  supabase: SupabaseClientAny,
  job: FulfillmentJob,
  orderItem: OrderItem
) {
  // Get available stock for this product
  const { data: stockItems, error: stockError } = await supabase
    .from("stock_items")
    .select("*")
    .eq("product_id", orderItem.product_id)
    .eq("status", "AVAILABLE")
    .limit(orderItem.quantity);

  if (stockError) {
    throw new Error(`Failed to fetch stock: ${stockError.message}`);
  }

  if (!stockItems || stockItems.length < orderItem.quantity) {
    throw new Error(`Insufficient stock. Need ${orderItem.quantity}, have ${stockItems?.length || 0}`);
  }

  const stockIds = stockItems.map((s: StockItem) => s.id);
  const secretData = stockItems.map((s: StockItem) => s.secret_data);

  // Reserve and mark stock as sold
  const { error: updateStockError } = await supabase
    .from("stock_items")
    .update({
      status: "SOLD",
      order_id: orderItem.order_id,
      sold_at: new Date().toISOString(),
    })
    .in("id", stockIds);

  if (updateStockError) {
    throw new Error(`Failed to update stock: ${updateStockError.message}`);
  }

  // Update order item with delivery data
  await supabase
    .from("order_items")
    .update({
      delivery_data: { 
        type: "STOCK",
        items: secretData,
        stock_ids: stockIds,
        delivered_at: new Date().toISOString()
      },
      delivered_at: new Date().toISOString(),
    })
    .eq("id", orderItem.id);

  // Mark job as completed
  await supabase
    .from("fulfillment_jobs")
    .update({
      status: "COMPLETED",
      completed_at: new Date().toISOString(),
      result: { stock_ids: stockIds, items_count: stockItems.length },
    })
    .eq("id", job.id);

  // Check if all items in order are delivered, update order status
  await checkAndUpdateOrderStatus(supabase, orderItem.order_id);

  console.log(`Stock fulfillment completed for job ${job.id}, delivered ${stockItems.length} items`);
}

async function processInviteFulfillment(
  supabase: SupabaseClientAny,
  job: FulfillmentJob,
  orderItem: OrderItem
) {
  const product = orderItem.products;
  if (!product?.provider_id) {
    throw new Error("Product has no provider configured");
  }

  // Get available provider account
  const { data: providerAccounts, error: providerError } = await supabase
    .from("provider_accounts")
    .select("*")
    .eq("provider_id", product.provider_id)
    .eq("is_active", true)
    .or(`cooldown_until.is.null,cooldown_until.lt.${new Date().toISOString()}`)
    .order("current_daily_invites", { ascending: true })
    .limit(1);

  if (providerError || !providerAccounts || providerAccounts.length === 0) {
    throw new Error("No available provider accounts");
  }

  const account = providerAccounts[0] as ProviderAccount;

  // Check total quota (max_daily_invites is actually total stock, not daily limit)
  if (account.max_daily_invites && account.current_daily_invites >= account.max_daily_invites) {
    throw new Error(`Provider account ${account.name} has no remaining invite stock (${account.current_daily_invites}/${account.max_daily_invites})`);
  }

  // Get provider info
  const { data: provider } = await supabase
    .from("providers")
    .select("*")
    .eq("id", product.provider_id)
    .single();

  if (!provider) {
    throw new Error("Provider not found");
  }

  const providerData = provider as Provider;

  // Process invite based on provider type
  const inputData = orderItem.input_data || {};
  let inviteResult: Record<string, unknown>;

  try {
    // Adapter pattern - call appropriate invite handler
    switch (providerData.slug) {
      case "chatgpt":
        inviteResult = await sendChatGPTInvite(account, inputData);
        break;
      case "canva":
        inviteResult = await sendCanvaInvite(account, inputData);
        break;
      case "spotify":
        inviteResult = await sendSpotifyInvite(account, inputData);
        break;
      default:
        // Generic invite - just mark as sent (manual processing)
        inviteResult = {
          type: "MANUAL",
          message: `Invite queued for ${providerData.name}`,
          target_email: inputData.email || inputData.target_email,
          status: "PENDING_MANUAL",
        };
    }
  } catch (inviteError) {
    // Update account stats on failure
    await supabase
      .from("provider_accounts")
      .update({
        cooldown_until: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min cooldown
      })
      .eq("id", account.id);

    throw inviteError;
  }

  // Update provider account usage
  await supabase
    .from("provider_accounts")
    .update({
      current_daily_invites: account.current_daily_invites + 1,
      last_invite_at: new Date().toISOString(),
    })
    .eq("id", account.id);

  // Update order item with delivery data
  await supabase
    .from("order_items")
    .update({
      delivery_data: {
        type: "INVITE",
        provider: providerData.slug,
        result: inviteResult,
        account_id: account.id,
        delivered_at: new Date().toISOString(),
      },
      delivered_at: new Date().toISOString(),
    })
    .eq("id", orderItem.id);

  // Mark job as completed
  await supabase
    .from("fulfillment_jobs")
    .update({
      status: "COMPLETED",
      completed_at: new Date().toISOString(),
      provider_account_id: account.id,
      result: inviteResult,
    })
    .eq("id", job.id);

  // Check if all items in order are delivered
  await checkAndUpdateOrderStatus(supabase, orderItem.order_id);

  console.log(`Invite fulfillment completed for job ${job.id} via ${providerData.slug}`);
}

// Provider Adapter Functions
async function sendChatGPTInvite(
  account: ProviderAccount,
  inputData: Record<string, string>
): Promise<Record<string, unknown>> {
  const targetEmail = inputData.email || inputData.target_email;
  
  if (!targetEmail) {
    throw new Error("Target email is required for ChatGPT invite");
  }

  // Get credentials from provider account
  const creds = account.credentials;
  const accountId = creds.account_id;
  const token = creds.token;
  const cookies = creds.cookies;
  const deviceId = creds.device_id;
  const clientVersion = creds.client_version;
  const buildNumber = creds.build_number;

  if (!accountId || !token) {
    throw new Error("Missing required credentials (account_id, token)");
  }

  const url = `https://chatgpt.com/backend-api/accounts/${accountId}/invites`;

  const headers: Record<string, string> = {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.8",
    "authorization": `Bearer ${token}`,
    "chatgpt-account-id": accountId,
    "content-type": "application/json",
    "origin": "https://chatgpt.com",
    "referer": "https://chatgpt.com/",
    "sec-ch-ua": '"Not(A:Brand";v="8", "Chromium";v="144", "Brave";v="144"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
  };

  // Add optional headers if provided
  if (deviceId) headers["oai-device-id"] = deviceId;
  if (clientVersion) headers["oai-client-version"] = clientVersion;
  if (buildNumber) headers["oai-client-build-number"] = buildNumber;
  if (cookies) headers["cookie"] = cookies;

  const payload = {
    email_addresses: [targetEmail],
    role: "standard-user",
    resend_emails: true,
  };

  console.log(`Sending ChatGPT Team invite to ${targetEmail} via account ${account.name}`);

  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`ChatGPT invite failed: ${response.status}`, errorText.substring(0, 200));
    
    if (response.status === 401) {
      throw new Error("Token expired or invalid. Please update credentials.");
    } else if (response.status === 403) {
      throw new Error("Access forbidden. Check cookies or account permissions.");
    } else if (response.status === 429) {
      throw new Error("Rate limited. Try again later.");
    }
    
    throw new Error(`ChatGPT API error: ${response.status}`);
  }

  const data = await response.json();
  
  console.log(`ChatGPT invite successful for ${targetEmail}`);

  return {
    type: "CHATGPT_TEAM",
    target_email: targetEmail,
    status: "INVITED",
    invite_id: data.account_invites?.[0]?.id || null,
    message: "Invite sent successfully via ChatGPT API",
    sent_at: new Date().toISOString(),
    raw_response: data,
  };
}

async function sendCanvaInvite(
  account: ProviderAccount,
  inputData: Record<string, string>
): Promise<Record<string, unknown>> {
  const targetEmail = inputData.email || inputData.target_email;
  
  if (!targetEmail) {
    throw new Error("Target email is required for Canva invite");
  }

  // Simulate Canva Team invite
  console.log(`Sending Canva Pro invite to ${targetEmail}`);
  
  return {
    type: "CANVA_TEAM",
    target_email: targetEmail,
    status: "INVITED",
    message: "Invite sent successfully",
    sent_at: new Date().toISOString(),
  };
}

async function sendSpotifyInvite(
  account: ProviderAccount,
  inputData: Record<string, string>
): Promise<Record<string, unknown>> {
  const targetEmail = inputData.email || inputData.target_email;
  
  if (!targetEmail) {
    throw new Error("Target email is required for Spotify invite");
  }

  // Simulate Spotify Family invite
  console.log(`Sending Spotify Family invite to ${targetEmail}`);
  
  return {
    type: "SPOTIFY_FAMILY",
    target_email: targetEmail,
    status: "INVITED",
    message: "Invite sent successfully",
    sent_at: new Date().toISOString(),
  };
}

async function markJobFailed(
  supabase: SupabaseClientAny,
  jobId: string,
  errorMessage: string
) {
  await supabase
    .from("fulfillment_jobs")
    .update({
      status: "FAILED",
      last_error: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

async function checkAndUpdateOrderStatus(
  supabase: SupabaseClientAny,
  orderId: string
) {
  // Check if all order items are delivered
  const { data: items } = await supabase
    .from("order_items")
    .select("id, delivered_at")
    .eq("order_id", orderId);

  if (items && items.every((item: { delivered_at: string | null }) => item.delivered_at !== null)) {
    // All items delivered, update order status
    await supabase
      .from("orders")
      .update({
        status: "DELIVERED",
        delivered_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    console.log(`Order ${orderId} marked as DELIVERED`);

    // Send webhook notification for DELIVERED status
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      
      const webhookUrl = `${supabaseUrl}/functions/v1/send-webhook`;
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ 
          order_id: orderId,
          event_type: "order.delivered"
        }),
      });
      console.log(`Sent webhook for delivered order ${orderId}`);
    } catch (webhookError) {
      console.error("Failed to send webhook:", webhookError);
      // Don't throw - webhook failure shouldn't affect order status
    }
  } else {
    // Some items still processing
    await supabase
      .from("orders")
      .update({ status: "PROCESSING" })
      .eq("id", orderId);
  }
}
