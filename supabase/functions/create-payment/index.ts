import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreatePaymentRequest {
  order_id?: string;
  type?: "order" | "wallet_topup";
  amount?: number;
  userId?: string;
}

interface TokopayResponse {
  status: string;
  data: {
    trx_id: string;
    ref_id: string;
    nominal: number;
    total_bayar: number;
    total_diterima?: number;
    pay_url: string;
    qr_link: string;
    expired_at?: number;
  };
}

async function createTokopayPayment(
  tokopayMerchantId: string,
  tokopaySecret: string,
  amount: number,
  refId: string
): Promise<TokopayResponse> {
  const tokopayUrl = new URL("https://api.tokopay.id/v1/order");
  tokopayUrl.searchParams.set("merchant", tokopayMerchantId);
  tokopayUrl.searchParams.set("secret", tokopaySecret);
  tokopayUrl.searchParams.set("ref_id", refId);
  tokopayUrl.searchParams.set("nominal", amount.toString());
  tokopayUrl.searchParams.set("metode", "QRIS");

  console.log("Calling Tokopay API:", tokopayUrl.toString().replace(tokopaySecret, "***"));

  const tokopayResponse = await fetch(tokopayUrl.toString(), {
    method: "GET",
  });

  return await tokopayResponse.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const tokopayMerchantId = Deno.env.get("TOKOPAY_MERCHANT_ID")!;
    const tokopaySecret = Deno.env.get("TOKOPAY_SECRET")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CreatePaymentRequest = await req.json();
    const { type = "order", order_id, amount, userId } = body;

    // Handle wallet topup
    if (type === "wallet_topup") {
      if (!amount || amount < 10000) {
        throw new Error("Minimum topup amount is Rp 10.000");
      }
      if (!userId) {
        throw new Error("User ID is required for wallet topup");
      }

      // Check if user is a reseller
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (!userRole || userRole.role !== "reseller") {
        throw new Error("Only resellers can topup wallet");
      }

      // Create unique reference ID for topup
      const refId = `TOPUP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const topupAmount = Math.ceil(amount);

      // Call Tokopay API
      const tokopayData = await createTokopayPayment(
        tokopayMerchantId,
        tokopaySecret,
        topupAmount,
        refId
      );

      console.log("Tokopay response:", JSON.stringify(tokopayData, null, 2));

      if (tokopayData.status !== "Success") {
        throw new Error(`Tokopay error: ${JSON.stringify(tokopayData)}`);
      }

      const payableAmount = Number(tokopayData.data.total_bayar);
      const nominalAmount = Number(tokopayData.data.nominal ?? topupAmount);
      const feeAmount = Number.isFinite(payableAmount) ? Math.max(0, payableAmount - nominalAmount) : null;

      const expiresAt = (() => {
        const unixSeconds = tokopayData?.data?.expired_at;
        if (typeof unixSeconds === "number" && Number.isFinite(unixSeconds) && unixSeconds > 0) {
          return new Date(unixSeconds * 1000).toISOString();
        }
        return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      })();

      // Create a wallet topup order record
      const { data: topupOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          customer_name: "Wallet Topup",
          customer_email: "topup@internal",
          subtotal: topupAmount,
          total_amount: topupAmount,
          status: "AWAITING_PAYMENT",
          notes: "WALLET_TOPUP",
          is_reseller_order: true,
          reseller_id: userId,
        })
        .select()
        .single();

      if (orderError) {
        console.error("Topup order error:", orderError);
        throw new Error("Failed to create topup order");
      }

      // Create payment record linked to topup order
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          order_id: topupOrder.id,
          ref_id: refId,
          tokopay_trx_id: tokopayData.data.trx_id,
          amount: Number.isFinite(payableAmount) && payableAmount > 0 ? payableAmount : topupAmount,
          fee: feeAmount,
          net_amount: nominalAmount,
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
          payUrl: tokopayData.data.pay_url,
          qrLink: tokopayData.data.qr_link,
          topupOrderId: topupOrder.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle regular order payment
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
    const orderAmount = Math.ceil(order.total_amount);

    // Call Tokopay API
    const tokopayData = await createTokopayPayment(
      tokopayMerchantId,
      tokopaySecret,
      orderAmount,
      refId
    );

    console.log("Tokopay response:", JSON.stringify(tokopayData, null, 2));

    if (tokopayData.status !== "Success") {
      throw new Error(`Tokopay error: ${JSON.stringify(tokopayData)}`);
    }

    const payableAmount = Number(tokopayData.data.total_bayar);
    const nominalAmount = Number(tokopayData.data.nominal ?? orderAmount);
    const feeAmount = Number.isFinite(payableAmount) ? Math.max(0, payableAmount - nominalAmount) : null;

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
        amount: Number.isFinite(payableAmount) && payableAmount > 0 ? payableAmount : orderAmount,
        fee: feeAmount,
        net_amount: nominalAmount,
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
