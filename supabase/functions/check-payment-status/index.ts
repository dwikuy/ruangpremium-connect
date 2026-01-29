import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { order_id } = await req.json();

    if (!order_id) {
      throw new Error("order_id is required");
    }

    // Get order with payment info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        payments(*)
      `)
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Get latest payment
    const payment = order.payments?.[0];

    // If already confirmed on our side, just return
    if (order.status === "PAID" || order.status === "PROCESSING" || order.status === "DELIVERED") {
      return new Response(
        JSON.stringify({
          success: true,
          order: {
            id: order.id,
            status: order.status,
            total_amount: order.total_amount,
            paid_at: order.paid_at,
          },
          payment: payment
            ? {
                id: payment.id,
                ref_id: payment.ref_id,
                tokopay_trx_id: payment.tokopay_trx_id,
                status: payment.status,
                amount: payment.amount,
                fee: payment.fee,
                net_amount: payment.net_amount,
                qr_link: payment.qr_link,
                pay_url: payment.pay_url,
                expires_at: payment.expires_at,
                paid_at: payment.paid_at,
              }
            : null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: actively check status to Tokopay by ref_id
    if (payment?.ref_id) {
      const tokopayUrl = new URL("https://api.tokopay.id/v1/order");
      tokopayUrl.searchParams.set("merchant", tokopayMerchantId);
      tokopayUrl.searchParams.set("secret", tokopaySecret);
      tokopayUrl.searchParams.set("ref_id", payment.ref_id);

      const resp = await fetch(tokopayUrl.toString(), { method: "GET" });
      const tokopayData = await resp.json();

      const tpStatus = String(tokopayData?.status ?? "");
      const tpTrxId = tokopayData?.data?.trx_id ?? payment.tokopay_trx_id ?? null;
      const tpTotalBayar = Number(tokopayData?.data?.total_bayar ?? NaN);
      const tpTotalDiterima = Number(tokopayData?.data?.total_diterima ?? tokopayData?.data?.nominal ?? NaN);
      const fee =
        Number.isFinite(tpTotalBayar) && Number.isFinite(tpTotalDiterima)
          ? Math.max(0, tpTotalBayar - tpTotalDiterima)
          : null;

      // Map Tokopay status
      let paymentStatus: "PENDING" | "PAID" | "EXPIRED" | "FAILED" = "PENDING";
      let orderStatus: "AWAITING_PAYMENT" | "PAID" | "CANCELLED" = "AWAITING_PAYMENT";
      switch (tpStatus.toLowerCase()) {
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
        default:
          paymentStatus = "PENDING";
          orderStatus = "AWAITING_PAYMENT";
      }

      if (paymentStatus !== payment.status || orderStatus !== order.status) {
        const now = new Date().toISOString();
        await supabase
          .from("payments")
          .update({
            status: paymentStatus,
            tokopay_trx_id: tpTrxId,
            paid_at: paymentStatus === "PAID" ? now : payment.paid_at,
            amount: Number.isFinite(tpTotalBayar) && tpTotalBayar > 0 ? tpTotalBayar : payment.amount,
            net_amount: Number.isFinite(tpTotalDiterima) && tpTotalDiterima > 0 ? tpTotalDiterima : payment.net_amount,
            fee,
          })
          .eq("id", payment.id);

        await supabase
          .from("orders")
          .update({
            status: orderStatus,
            paid_at: orderStatus === "PAID" ? now : order.paid_at,
          })
          .eq("id", order.id);
      }
    }

    // Re-read for latest values
    const { data: order2 } = await supabase
      .from("orders")
      .select(`*, payments(*)`)
      .eq("id", order_id)
      .single();

    const latestOrder = order2 ?? order;
    const latestPayment = latestOrder.payments?.[0];

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: latestOrder.id,
          status: latestOrder.status,
          total_amount: latestOrder.total_amount,
          paid_at: latestOrder.paid_at,
        },
        payment: latestPayment ? {
          id: latestPayment.id,
          ref_id: latestPayment.ref_id,
          tokopay_trx_id: latestPayment.tokopay_trx_id,
          status: latestPayment.status,
          amount: latestPayment.amount,
          fee: latestPayment.fee,
          net_amount: latestPayment.net_amount,
          qr_link: latestPayment.qr_link,
          pay_url: latestPayment.pay_url,
          expires_at: latestPayment.expires_at,
          paid_at: latestPayment.paid_at,
        } : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error checking payment status:", error);
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
