import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  order_id: string;
  event_type: "order.paid" | "order.delivered" | "order.failed";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { order_id, event_type }: NotificationRequest = await req.json();

    if (!order_id || !event_type) {
      throw new Error("order_id and event_type are required");
    }

    // Get order with items and product details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (name, product_type)
        )
      `)
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Build notification content based on event type
    let subject = "";
    let body = "";
    const orderNumber = order.id.substring(0, 8).toUpperCase();

    switch (event_type) {
      case "order.paid":
        subject = `✅ Pembayaran Berhasil - Order #${orderNumber}`;
        body = buildPaidEmailBody(order, orderNumber);
        break;
      case "order.delivered":
        subject = `🎉 Pesanan Terkirim - Order #${orderNumber}`;
        body = buildDeliveredEmailBody(order, orderNumber);
        break;
      case "order.failed":
        subject = `⚠️ Pesanan Gagal - Order #${orderNumber}`;
        body = buildFailedEmailBody(order, orderNumber);
        break;
    }

    // Log the notification attempt
    console.log(`Sending ${event_type} notification for order ${order_id} to ${order.customer_email}`);

    // For now, we'll log the email content
    // In production, integrate with email service (Resend, SendGrid, etc.)
    console.log("Email subject:", subject);
    console.log("Email body preview:", body.substring(0, 200));

    // Store notification in database for tracking (optional)
    // TODO: Add notifications table if needed

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification ${event_type} prepared for ${order.customer_email}`,
        email: {
          to: order.customer_email,
          subject,
          body_preview: body.substring(0, 100),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Notification error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildPaidEmailBody(order: any, orderNumber: string): string {
  const items = order.order_items || [];
  const itemList = items
    .map((item: any) => `- ${item.products?.name || "Product"} x${item.quantity}`)
    .join("\n");

  return `
Halo ${order.customer_name},

Pembayaran untuk pesanan #${orderNumber} telah berhasil!

Detail Pesanan:
${itemList}

Total: Rp ${order.total_amount.toLocaleString("id-ID")}

Pesanan Anda sedang diproses dan akan segera dikirimkan.

${order.guest_token ? `Track pesanan: ${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app")}/track/${order.guest_token}` : ""}

Terima kasih telah berbelanja di RuangPremium!

---
RuangPremium
Produk Digital Premium
  `.trim();
}

function buildDeliveredEmailBody(order: any, orderNumber: string): string {
  const items = order.order_items || [];
  
  let deliveryDetails = "";
  for (const item of items) {
    const productName = item.products?.name || "Product";
    const deliveryData = item.delivery_data;
    
    if (deliveryData?.type === "STOCK") {
      deliveryDetails += `\n${productName}:\n`;
      const stockItems = deliveryData.items || [];
      for (const stockItem of stockItems) {
        // Format credential display
        if (typeof stockItem === "string") {
          deliveryDetails += `${stockItem}\n`;
        } else if (typeof stockItem === "object") {
          for (const [key, value] of Object.entries(stockItem)) {
            deliveryDetails += `${key}: ${value}\n`;
          }
        }
      }
    } else if (deliveryData?.type === "INVITE") {
      deliveryDetails += `\n${productName}:\n`;
      deliveryDetails += `Undangan telah dikirim ke email yang Anda daftarkan.\n`;
      deliveryDetails += `Silakan cek inbox/spam dan accept invitation.\n`;
    }
  }

  return `
Halo ${order.customer_name},

Pesanan #${orderNumber} telah berhasil dikirim! 🎉

Detail Pesanan:
${deliveryDetails}

${order.guest_token ? `Lihat detail lengkap: ${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app")}/track/${order.guest_token}` : ""}

Jika ada kendala, silakan hubungi kami melalui halaman Contact.

Terima kasih telah berbelanja di RuangPremium!

---
RuangPremium
Produk Digital Premium
  `.trim();
}

function buildFailedEmailBody(order: any, orderNumber: string): string {
  return `
Halo ${order.customer_name},

Mohon maaf, pesanan #${orderNumber} mengalami kendala dalam proses pengiriman.

Tim kami akan segera menghubungi Anda untuk menyelesaikan masalah ini.
Atau Anda dapat menghubungi kami melalui halaman Contact untuk bantuan lebih lanjut.

${order.guest_token ? `Track pesanan: ${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app")}/track/${order.guest_token}` : ""}

Mohon maaf atas ketidaknyamanan ini.

---
RuangPremium
Produk Digital Premium
  `.trim();
}
