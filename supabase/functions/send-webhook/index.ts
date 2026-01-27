import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  event: string;
  order_id: string;
  order_status: string;
  customer_email: string;
  customer_name: string;
  total_amount: number;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
  delivered_at?: string;
  paid_at?: string;
  created_at: string;
}

async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { order_id, event_type } = await req.json();

    if (!order_id || !event_type) {
      return new Response(
        JSON.stringify({ error: 'order_id and event_type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
          product:products (id, name, slug)
        )
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this is a reseller order
    if (!order.reseller_id) {
      return new Response(
        JSON.stringify({ message: 'Not a reseller order, no webhook to send' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get reseller's API keys with webhook enabled
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('reseller_api_keys')
      .select('*')
      .eq('user_id', order.reseller_id)
      .eq('is_active', true)
      .eq('webhook_enabled', true)
      .not('webhook_url', 'is', null);

    if (apiKeysError) {
      console.error('Error fetching API keys:', apiKeysError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch API keys' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!apiKeys || apiKeys.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No webhooks configured for this reseller' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build webhook payload
    const payload: WebhookPayload = {
      event: event_type,
      order_id: order.id,
      order_status: order.status,
      customer_email: order.customer_email,
      customer_name: order.customer_name,
      total_amount: order.total_amount,
      items: order.order_items.map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product?.name || 'Unknown',
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
      delivered_at: order.delivered_at,
      paid_at: order.paid_at,
      created_at: order.created_at,
    };

    const payloadString = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);
    const results: any[] = [];

    // Send webhook to all configured URLs
    for (const apiKey of apiKeys) {
      const webhookUrl = apiKey.webhook_url;
      const webhookSecret = apiKey.webhook_secret || 'default-secret';

      try {
        // Generate signature
        const signaturePayload = `${timestamp}.${payloadString}`;
        const signature = await generateSignature(signaturePayload, webhookSecret);

        // Send webhook
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Timestamp': timestamp.toString(),
            'X-Webhook-Signature': `sha256=${signature}`,
          },
          body: payloadString,
        });

        const responseBody = await response.text();

        // Log delivery
        await supabase.from('webhook_deliveries').insert({
          api_key_id: apiKey.id,
          order_id: order_id,
          event_type: event_type,
          payload: payload,
          response_status: response.status,
          response_body: responseBody.substring(0, 1000),
          delivered_at: response.ok ? new Date().toISOString() : null,
          failed_at: !response.ok ? new Date().toISOString() : null,
          error: !response.ok ? `HTTP ${response.status}` : null,
        });

        results.push({
          api_key_id: apiKey.id,
          success: response.ok,
          status: response.status,
        });

      } catch (error) {
        console.error(`Webhook delivery failed for ${webhookUrl}:`, error);

        // Log failed delivery
        await supabase.from('webhook_deliveries').insert({
          api_key_id: apiKey.id,
          order_id: order_id,
          event_type: event_type,
          payload: payload,
          failed_at: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        results.push({
          api_key_id: apiKey.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Webhooks processed', 
        results,
        webhooks_sent: results.filter(r => r.success).length,
        webhooks_failed: results.filter(r => !r.success).length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
