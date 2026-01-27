import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TokopayCallback {
  trx_id: string;
  ref_id: string;
  status: string; // "Success", "Pending", "Failed", "Expired"
  nominal: number;
  total_bayar: number;
  via: string;
  signature: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const tokopaySecret = Deno.env.get("TOKOPAY_SECRET")!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get callback data - Tokopay sends as form data or query params
    let callbackData: TokopayCallback;
    
    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        callbackData = await req.json();
      } else {
        const formData = await req.formData();
        callbackData = {
          trx_id: formData.get("trx_id") as string,
          ref_id: formData.get("ref_id") as string,
          status: formData.get("status") as string,
          nominal: Number(formData.get("nominal")),
          total_bayar: Number(formData.get("total_bayar")),
          via: formData.get("via") as string,
          signature: formData.get("signature") as string,
        };
      }
    } else {
      // GET request with query params
      const url = new URL(req.url);
      callbackData = {
        trx_id: url.searchParams.get("trx_id") || "",
        ref_id: url.searchParams.get("ref_id") || "",
        status: url.searchParams.get("status") || "",
        nominal: Number(url.searchParams.get("nominal")),
        total_bayar: Number(url.searchParams.get("total_bayar")),
        via: url.searchParams.get("via") || "",
        signature: url.searchParams.get("signature") || "",
      };
    }

    console.log("Received Tokopay callback:", JSON.stringify(callbackData, null, 2));

    // Verify signature
    const expectedSignature = await generateSignature(
      callbackData.trx_id,
      callbackData.ref_id,
      tokopaySecret
    );
    const signatureValid = callbackData.signature === expectedSignature;

    // Log webhook
    await supabase.from("webhook_logs").insert({
      source: "tokopay",
      payload: callbackData,
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
    await supabase
      .from("payments")
      .update({
        status: paymentStatus,
        paid_at: paymentStatus === "PAID" ? now : null,
        net_amount: callbackData.total_bayar,
        fee: callbackData.nominal - callbackData.total_bayar,
        webhook_data: callbackData,
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
      .eq("payload->>ref_id", callbackData.ref_id);

    // If paid, trigger fulfillment job creation
    if (paymentStatus === "PAID") {
      const order = payment.orders;
      
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

      // Send webhook notification for PAID status
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

async function generateSignature(trxId: string, refId: string, secret: string): Promise<string> {
  // Tokopay signature: md5(trx_id:ref_id:secret)
  const signatureString = `${trxId}:${refId}:${secret}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureString);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Process reseller cashback when order is paid via QRIS
async function processResellerCashback(
  supabaseClient: any,
  order: { reseller_id: string; id: string },
  orderItems: Array<{ unit_price: number; quantity: number; products: { reseller_price: number | null } | null }>
) {
  // Calculate cashback based on difference between retail and reseller price
  let totalCashback = 0;

  for (const item of orderItems) {
    const retailPrice = item.unit_price;
    const resellerPrice = item.products?.reseller_price || retailPrice;
    const margin = (retailPrice - resellerPrice) * item.quantity;
    
    if (margin > 0) {
      totalCashback += margin;
    }
  }

  if (totalCashback <= 0) {
    console.log("No cashback to process - no margin or negative margin");
    return;
  }

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
