import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreatePaymentRequest {
  order_id: string;
}

interface TokopayResponse {
  status: string;
  data: {
    trx_id: string;
    ref_id: string;
    nominal: number;
    total_bayar: number;
    pay_url: string;
    qr_link: string;
    // Some Tokopay endpoints don't return expiry timestamp.
    // Keep optional and fallback to a sane default.
    expired_at?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const tokopayMerchantId = Deno.env.get("TOKOPAY_MERCHANT_ID")!;
    const tokopaySecret = Deno.env.get("TOKOPAY_SECRET")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { order_id }: CreatePaymentRequest = await req.json();

    if (!order_id) {
      throw new Error("order_id is required");
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    if (order.status !== "AWAITING_PAYMENT") {
      throw new Error("Order is not awaiting payment");
    }

    // Check if payment already exists
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", order_id)
      .eq("status", "PENDING")
      .maybeSingle();

    if (existingPayment && existingPayment.expires_at) {
      const expiresAt = new Date(existingPayment.expires_at);
      if (expiresAt > new Date()) {
        // Return existing valid payment
        return new Response(
          JSON.stringify({
            success: true,
            payment: existingPayment,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create unique reference ID
    const refId = `RP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const amount = Math.ceil(order.total_amount);

    // Generate Tokopay signature using MD5
    const signatureString = `${tokopayMerchantId}:${tokopaySecret}:${refId}`;
    
    // Use crypto.subtle with MD5 from older deno std
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest("MD5", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Call Tokopay API to create QRIS payment (Simple Order GET)
    const tokopayUrl = new URL("https://api.tokopay.id/v1/order");
    tokopayUrl.searchParams.set("merchant", tokopayMerchantId);
    tokopayUrl.searchParams.set("secret", tokopaySecret);
    tokopayUrl.searchParams.set("ref_id", refId);
    tokopayUrl.searchParams.set("nominal", amount.toString());
    tokopayUrl.searchParams.set("metode", "QRIS"); // Simple Order uses "metode"

    console.log("Calling Tokopay API:", tokopayUrl.toString().replace(tokopaySecret, "***"));

    const tokopayResponse = await fetch(tokopayUrl.toString(), {
      method: "GET",
    });

    const tokopayData: TokopayResponse = await tokopayResponse.json();

    console.log("Tokopay response:", JSON.stringify(tokopayData, null, 2));

    if (tokopayData.status !== "Success") {
      throw new Error(`Tokopay error: ${JSON.stringify(tokopayData)}`);
    }

    // Calculate expiry
    // Tokopay docs vary by endpoint; sometimes `expired_at` is missing.
    // If it's missing/invalid, default to 24 hours from now.
    const expiresAt = (() => {
      const unixSeconds = tokopayData?.data?.expired_at;
      if (typeof unixSeconds === "number" && Number.isFinite(unixSeconds) && unixSeconds > 0) {
        return new Date(unixSeconds * 1000).toISOString();
      }
      return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    })();

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        order_id: order_id,
        ref_id: refId,
        tokopay_trx_id: tokopayData.data.trx_id,
        amount: amount,
        qr_link: tokopayData.data.qr_link,
        pay_url: tokopayData.data.pay_url,
        status: "PENDING",
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Payment insert error:", paymentError);
      throw new Error("Failed to create payment record");
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: payment,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in create-payment:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
