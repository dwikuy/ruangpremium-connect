import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TokopayCallback =
  | {
      // Common JSON webhook payload observed from Tokopay
      reference?: string; // trx id
      reff_id?: string; // ref id
      signature?: string;
      status?: string; // "Success", "Pending", "Failed", "Expired"
      data?: {
        total_dibayar?: number;
        total_diterima?: number;
        payment_channel?: string;
        created_at?: string;
        updated_at?: string;
        [k: string]: unknown;
      };
      [k: string]: unknown;
    }
  | {
      // Legacy / form-data style
      trx_id?: string;
      ref_id?: string;
      status?: string;
      nominal?: number;
      total_bayar?: number;
      via?: string;
      signature?: string;
      [k: string]: unknown;
    };

function normalizeCallback(raw: TokopayCallback) {
  const trx_id = (raw as any).trx_id ?? (raw as any).reference ?? "";
  const ref_id = (raw as any).ref_id ?? (raw as any).reff_id ?? "";
  const status = (raw as any).status ?? "";
  const signature = (raw as any).signature ?? "";
  // Extract merchant_id from data object (used for signature verification)
  const merchant_id = (raw as any).data?.merchant_id ?? "";

  const nominal = Number((raw as any).nominal ?? (raw as any).data?.total_diterima ?? 0);
  const total_bayar = Number((raw as any).total_bayar ?? (raw as any).data?.total_dibayar ?? 0);
  const total_diterima = Number((raw as any).data?.total_diterima ?? (Number.isFinite(nominal) ? nominal : 0));

  return {
    trx_id: String(trx_id || ""),
    ref_id: String(ref_id || ""),
    merchant_id: String(merchant_id || ""),
    status: String(status || ""),
    signature: String(signature || ""),
    nominal: Number.isFinite(nominal) ? nominal : 0,
    total_bayar: Number.isFinite(total_bayar) ? total_bayar : 0,
    total_diterima: Number.isFinite(total_diterima) ? total_diterima : 0,
  };
}

async function safeParseBody(req: Request): Promise<unknown> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await req.json();
  }

  // If Tokopay sends POST without content-type header, req.formData() will throw.
  // We'll try text->json first, then fallback to urlencoded.
  const rawText = await req.text();
  const trimmed = rawText.trim();
  if (!trimmed) return {};

  try {
    return JSON.parse(trimmed);
  } catch {
    // try urlencoded
    try {
      const params = new URLSearchParams(trimmed);
      const obj: Record<string, string> = {};
      for (const [k, v] of params.entries()) obj[k] = v;
      return obj;
    } catch {
      return { raw: trimmed };
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const tokopaySecret = Deno.env.get("TOKOPAY_SECRET")!;
  const tokopayMerchantId = Deno.env.get("TOKOPAY_MERCHANT_ID")!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get callback data - Tokopay may send JSON without content-type, urlencoded, or query params
    let rawCallback: TokopayCallback;
    if (req.method === "POST") {
      rawCallback = (await safeParseBody(req)) as TokopayCallback;
    } else {
      const url = new URL(req.url);
      rawCallback = Object.fromEntries(url.searchParams.entries()) as TokopayCallback;
    }

    const callbackData = normalizeCallback(rawCallback);
    console.log("Received Tokopay callback:", JSON.stringify(rawCallback, null, 2));

    // Verify signature
    // Per Tokopay docs: signature = MD5(merchant_id:secret:ref_id)
    // We use merchant_id from env or from callback data
    const expectedSignature = await generateTokopaySignature(
      tokopayMerchantId,
      tokopaySecret,
      callbackData.ref_id
    );
    const receivedSig = String(callbackData.signature || "").trim().toLowerCase();
    const signatureValid = receivedSig === expectedSignature;

    console.log("Signature verification:", {
      received: receivedSig,
      expected: expectedSignature,
      ref_id: callbackData.ref_id,
      valid: signatureValid
    });

    // Log webhook
    await supabase.from("webhook_logs").insert({
      source: "tokopay",
      payload: rawCallback,
      signature: callbackData.signature,
      is_valid: signatureValid,
      event_type: callbackData.status,
    });

    if (!signatureValid) {
      console.error("Invalid signature:", {
        received: callbackData.signature,
        expected: expectedSignature,
      });
      throw new Error("Invalid signature");
    }

    // Find payment by ref_id
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*, orders(*)")
      .eq("ref_id", callbackData.ref_id)
      .single();

    if (paymentError || !payment) {
      console.error("Payment not found:", callbackData.ref_id);
      throw new Error("Payment not found");
    }

    // Map Tokopay status to our status
    let paymentStatus: "PENDING" | "PAID" | "EXPIRED" | "FAILED" = "PENDING";
    let orderStatus: "AWAITING_PAYMENT" | "PAID" | "CANCELLED" = "AWAITING_PAYMENT";

    switch (callbackData.status.toLowerCase()) {
      case "success":
      case "paid":
        paymentStatus = "PAID";
        orderStatus = "PAID";
        break;
      case "expired":
        paymentStatus = "EXPIRED";
        orderStatus = "CANCELLED";
        break;
      case "failed":
        paymentStatus = "FAILED";
        orderStatus = "CANCELLED";
        break;
    }

    // Update payment
    const now = new Date().toISOString();

    // Tokopay amounts:
    // - total_dibayar: paid by customer (includes fee)
    // - total_diterima: received by merchant (net)
    const fee =
      callbackData.total_bayar > 0 && callbackData.total_diterima > 0
        ? Math.max(0, callbackData.total_bayar - callbackData.total_diterima)
        : null;

    await supabase
      .from("payments")
      .update({
        status: paymentStatus,
        paid_at: paymentStatus === "PAID" ? now : null,
        amount: callbackData.total_bayar || undefined,
        net_amount: callbackData.total_diterima || undefined,
        fee,
        webhook_data: rawCallback,
      })
      .eq("id", payment.id);

    // Update order
    await supabase
      .from("orders")
      .update({
        status: orderStatus,
        paid_at: orderStatus === "PAID" ? now : null,
      })
      .eq("id", payment.order_id);

    // Mark webhook as processed
    await supabase
      .from("webhook_logs")
      .update({ processed: true })
      .eq("source", "tokopay")
      .or(`payload->>ref_id.eq.${callbackData.ref_id},payload->>reff_id.eq.${callbackData.ref_id}`);

    // If paid, trigger fulfillment job creation
    if (paymentStatus === "PAID") {
      const order = payment.orders;
      
      // Check if this is a wallet topup order
      if (order?.notes === "WALLET_TOPUP" && order?.reseller_id) {
        try {
          await processWalletTopup(supabase, order, payment);
          console.log(`Processed wallet topup for order ${payment.order_id}`);
        } catch (topupError) {
          console.error("Failed to process wallet topup:", topupError);
          // Don't throw - can be processed manually
        }
        
        // Return early - no fulfillment needed for topup
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Get order items and create fulfillment jobs
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("*, products(*)")
        .eq("order_id", payment.order_id);

      if (orderItems) {
        for (const item of orderItems) {
          // Create fulfillment job for each order item
          await supabase.from("fulfillment_jobs").insert({
            order_item_id: item.id,
            job_type: item.products?.product_type || "STOCK",
            status: "PENDING",
          });
        }
      }

      // Process reseller cashback if this is a reseller order paid via QRIS (not wallet)
      if (order?.reseller_id && order?.is_reseller_order) {
        try {
          await processResellerCashback(supabase, order, orderItems || []);
          console.log(`Processed cashback for reseller order ${payment.order_id}`);
        } catch (cashbackError) {
          console.error("Failed to process reseller cashback:", cashbackError);
          // Don't throw - cashback can be processed manually
        }
      }

      // Trigger fulfillment processing immediately
      try {
        const triggerUrl = `${supabaseUrl}/functions/v1/trigger-fulfillment`;
        await fetch(triggerUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ order_id: payment.order_id }),
        });
        console.log(`Triggered fulfillment for order ${payment.order_id}`);
      } catch (triggerError) {
        console.error("Failed to trigger fulfillment:", triggerError);
        // Don't throw - fulfillment can be retried later
      }

      // Send webhook notification for PAID status (for reseller API)
      try {
        const webhookUrl = `${supabaseUrl}/functions/v1/send-webhook`;
        await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ 
            order_id: payment.order_id,
            event_type: "order.paid"
          }),
        });
        console.log(`Sent webhook for paid order ${payment.order_id}`);
      } catch (webhookError) {
        console.error("Failed to send webhook:", webhookError);
        // Don't throw - webhook can be retried
      }

      // Send email notification for PAID status
      try {
        const notificationUrl = `${supabaseUrl}/functions/v1/send-notification`;
        await fetch(notificationUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ 
            order_id: payment.order_id,
            event_type: "order.paid"
          }),
        });
        console.log(`Sent paid notification for order ${payment.order_id}`);
      } catch (notifError) {
        console.error("Failed to send notification:", notifError);
        // Don't throw - notification can be retried
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    
    // Still return 200 to prevent Tokopay from retrying
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function md5Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  // Use std crypto polyfill to support MD5 in Deno
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate Tokopay signature per official docs:
 * signature = MD5(merchant_id:secret:ref_id)
 */
async function generateTokopaySignature(
  merchantId: string,
  secret: string,
  refId: string
): Promise<string> {
  const input = `${merchantId}:${secret}:${refId}`;
  return await md5Hex(input);
}

// Process reseller cashback when order is paid via QRIS
// Cashback = margin (retail - reseller price) * cashback_rate%
async function processResellerCashback(
  supabaseClient: any,
  order: { reseller_id: string; id: string },
  orderItems: Array<{ unit_price: number; quantity: number; products: { reseller_price: number | null } | null }>
) {
  // Get cashback rate from system settings (default 100% of margin)
  const { data: cashbackSetting } = await supabaseClient
    .from("system_settings")
    .select("value")
    .eq("key", "reseller_cashback_rate")
    .maybeSingle();

  // Cashback rate is a percentage (0-100) of the margin
  const cashbackRate = (cashbackSetting?.value as { percent?: number })?.percent ?? 100;
  
  if (cashbackRate <= 0) {
    console.log("Cashback rate is 0%, skipping cashback processing");
    return;
  }

  // Calculate total margin (retail price - reseller price) from base amounts
  let totalMargin = 0;

  for (const item of orderItems) {
    const retailPrice = item.unit_price;
    const resellerPrice = item.products?.reseller_price || retailPrice;
    const margin = (retailPrice - resellerPrice) * item.quantity;
    
    if (margin > 0) {
      totalMargin += margin;
    }
  }

  if (totalMargin <= 0) {
    console.log("No margin to process - no cashback");
    return;
  }

  // Apply cashback rate (percentage of margin)
  const totalCashback = Math.floor(totalMargin * (cashbackRate / 100));

  if (totalCashback <= 0) {
    console.log(`Cashback amount is 0 after applying rate ${cashbackRate}%`);
    return;
  }

  console.log(`Processing cashback: margin=${totalMargin}, rate=${cashbackRate}%, cashback=${totalCashback}`);

  // Get or create reseller wallet
  const { data: wallet, error: walletError } = await supabaseClient
    .from("reseller_wallets")
    .select("*")
    .eq("user_id", order.reseller_id)
    .maybeSingle();

  if (walletError) throw walletError;

  const currentBalance = wallet?.balance || 0;
  const newBalance = currentBalance + totalCashback;

  if (wallet) {
    // Update existing wallet
    await supabaseClient
      .from("reseller_wallets")
      .update({
        balance: newBalance,
        total_cashback: (wallet.total_cashback || 0) + totalCashback,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", order.reseller_id);
  } else {
    // Create new wallet
    await supabaseClient.from("reseller_wallets").insert({
      user_id: order.reseller_id,
      balance: totalCashback,
      total_cashback: totalCashback,
    });
  }

  // Record transaction
  await supabaseClient.from("wallet_transactions").insert({
    user_id: order.reseller_id,
    amount: totalCashback,
    balance_after: newBalance,
    transaction_type: "CASHBACK",
    order_id: order.id,
    description: `Cashback order #${order.id.substring(0, 8)}`,
  });

  console.log(`Added cashback ${totalCashback} to reseller ${order.reseller_id}`);
}

// Process wallet topup when payment is successful
// Saldo yang masuk = total yang dibayar (termasuk fee)
async function processWalletTopup(
  supabaseClient: any,
  order: { reseller_id: string; id: string; subtotal: number },
  payment: { id: string; amount: number | null; net_amount: number | null }
) {
  // Use the actual amount paid (including fee), not just the base amount
  const topupAmount = payment.amount || order.subtotal;
  const resellerId = order.reseller_id;

  // Get or create reseller wallet
  const { data: wallet, error: walletError } = await supabaseClient
    .from("reseller_wallets")
    .select("*")
    .eq("user_id", resellerId)
    .maybeSingle();

  if (walletError) throw walletError;

  const currentBalance = wallet?.balance || 0;
  const newBalance = currentBalance + topupAmount;

  if (wallet) {
    // Update existing wallet
    await supabaseClient
      .from("reseller_wallets")
      .update({
        balance: newBalance,
        total_topup: (wallet.total_topup || 0) + topupAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", resellerId);
  } else {
    // Create new wallet
    await supabaseClient.from("reseller_wallets").insert({
      user_id: resellerId,
      balance: topupAmount,
      total_topup: topupAmount,
    });
  }

  // Record transaction
  await supabaseClient.from("wallet_transactions").insert({
    user_id: resellerId,
    amount: topupAmount,
    balance_after: newBalance,
    transaction_type: "TOPUP",
    order_id: order.id,
    payment_id: payment.id,
    description: `Topup saldo wallet`,
  });

  // Mark the topup order as DELIVERED since topup is complete
  await supabaseClient
    .from("orders")
    .update({
      status: "DELIVERED",
      delivered_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  console.log(`Wallet topup ${topupAmount} added for reseller ${resellerId}, new balance: ${newBalance}`);
}
