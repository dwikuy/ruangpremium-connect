import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function validateApiKey(supabaseAdmin: any, authHeader: string) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or invalid Authorization header" };
  }

  const apiKey = authHeader.replace("Bearer ", "");
  if (!apiKey.startsWith("rp_")) {
    return { valid: false, error: "Invalid API key format" };
  }

  const keyHash = await hashApiKey(apiKey);
  const keyPrefix = apiKey.substring(0, 10);

  const { data: keyData, error } = await supabaseAdmin
    .from("reseller_api_keys")
    .select("id, user_id, is_active, rate_limit")
    .eq("key_hash", keyHash)
    .eq("key_prefix", keyPrefix)
    .single();

  if (error || !keyData) {
    return { valid: false, error: "Invalid API key" };
  }

  if (!keyData.is_active) {
    return { valid: false, error: "API key has been revoked" };
  }

  // Update last_used_at
  await supabaseAdmin
    .from("reseller_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyData.id);

  return { valid: true, userId: keyData.user_id, rateLimit: keyData.rate_limit };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // Remove 'reseller-api' from path
    if (pathParts[0] === "reseller-api") {
      pathParts.shift();
    }

    const resource = pathParts[0];
    const resourceId = pathParts[1];

    // Validate API key
    const authHeader = req.headers.get("Authorization") || "";
    const authResult = await validateApiKey(supabaseAdmin, authHeader);
    
    if (!authResult.valid) {
      return new Response(
        JSON.stringify({ success: false, error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resellerId = authResult.userId;

    // Route handling
    switch (resource) {
      case "products": {
        if (req.method === "GET") {
          if (resourceId) {
            // Get single product
            const { data, error } = await supabaseAdmin
              .from("products")
              .select(`
                id, name, slug, description, short_description, image_url,
                product_type, retail_price, reseller_price, duration_days,
                benefits, input_schema, category:product_categories(id, name, slug)
              `)
              .eq("id", resourceId)
              .eq("is_active", true)
              .single();

            if (error || !data) {
              return new Response(
                JSON.stringify({ success: false, error: "Product not found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            // Get stock count for STOCK products
            let stockAvailable = null;
            if (data.product_type === "STOCK") {
              const { count } = await supabaseAdmin
                .from("stock_items")
                .select("id", { count: "exact", head: true })
                .eq("product_id", data.id)
                .eq("status", "AVAILABLE");
              stockAvailable = count || 0;
            }

            return new Response(
              JSON.stringify({ success: true, data: { ...data, stock_available: stockAvailable } }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else {
            // List products
            const { data, error } = await supabaseAdmin
              .from("products")
              .select(`
                id, name, slug, short_description, image_url,
                product_type, retail_price, reseller_price,
                category:product_categories(id, name, slug)
              `)
              .eq("is_active", true)
              .order("sort_order", { ascending: true });

            if (error) throw error;

            // Get stock counts
            const productsWithStock = await Promise.all(
              data.map(async (product: any) => {
                if (product.product_type === "STOCK") {
                  const { count } = await supabaseAdmin
                    .from("stock_items")
                    .select("id", { count: "exact", head: true })
                    .eq("product_id", product.id)
                    .eq("status", "AVAILABLE");
                  return { ...product, stock_available: count || 0 };
                }
                return { ...product, stock_available: null };
              })
            );

            return new Response(
              JSON.stringify({ success: true, data: productsWithStock }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
        break;
      }

      case "orders": {
        if (req.method === "POST") {
          // Create order
          const body = await req.json();
          const { 
            product_id, 
            customer_name, 
            customer_email, 
            customer_phone,
            quantity = 1,
            input_data = {},
            payment_method = "QRIS" // WALLET or QRIS
          } = body;

          // Validate required fields
          if (!product_id || !customer_name || !customer_email) {
            return new Response(
              JSON.stringify({ success: false, error: "Missing required fields" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Get product
          const { data: product, error: productError } = await supabaseAdmin
            .from("products")
            .select("*")
            .eq("id", product_id)
            .eq("is_active", true)
            .single();

          if (productError || !product) {
            return new Response(
              JSON.stringify({ success: false, error: "Product not found" }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Check stock for STOCK products
          if (product.product_type === "STOCK") {
            const { count } = await supabaseAdmin
              .from("stock_items")
              .select("id", { count: "exact", head: true })
              .eq("product_id", product_id)
              .eq("status", "AVAILABLE");

            if ((count || 0) < quantity) {
              return new Response(
                JSON.stringify({ success: false, error: "Insufficient stock" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }

          // Calculate price (use reseller price)
          const unitPrice = product.reseller_price || product.retail_price;
          const totalAmount = unitPrice * quantity;

          // Handle WALLET payment
          if (payment_method === "WALLET") {
            // Get reseller wallet
            const { data: wallet, error: walletError } = await supabaseAdmin
              .from("reseller_wallets")
              .select("*")
              .eq("user_id", resellerId)
              .single();

            if (walletError || !wallet || wallet.balance < totalAmount) {
              return new Response(
                JSON.stringify({ success: false, error: "Insufficient wallet balance" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            // Create order as PAID
            const { data: order, error: orderError } = await supabaseAdmin
              .from("orders")
              .insert({
                customer_name,
                customer_email,
                customer_phone,
                subtotal: totalAmount,
                total_amount: totalAmount,
                status: "PAID",
                paid_at: new Date().toISOString(),
                is_reseller_order: true,
                reseller_id: resellerId,
              })
              .select()
              .single();

            if (orderError) throw orderError;

            // Create order item
            await supabaseAdmin.from("order_items").insert({
              order_id: order.id,
              product_id,
              quantity,
              unit_price: unitPrice,
              total_price: totalAmount,
              input_data,
            });

            // Deduct wallet balance
            const newBalance = wallet.balance - totalAmount;
            await supabaseAdmin
              .from("reseller_wallets")
              .update({
                balance: newBalance,
                total_spent: wallet.total_spent + totalAmount,
              })
              .eq("user_id", resellerId);

            // Create wallet transaction
            await supabaseAdmin.from("wallet_transactions").insert({
              user_id: resellerId,
              order_id: order.id,
              transaction_type: "PURCHASE",
              amount: -totalAmount,
              balance_after: newBalance,
              description: `Pembelian order #${order.id.slice(0, 8)}`,
            });

            // Trigger fulfillment
            await supabaseAdmin.functions.invoke("trigger-fulfillment", {
              body: { orderId: order.id },
            });

            return new Response(
              JSON.stringify({
                success: true,
                data: {
                  order_id: order.id,
                  status: "PAID",
                  total_amount: totalAmount,
                },
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else {
            // QRIS payment - create order with AWAITING_PAYMENT
            const { data: order, error: orderError } = await supabaseAdmin
              .from("orders")
              .insert({
                customer_name,
                customer_email,
                customer_phone,
                subtotal: totalAmount,
                total_amount: totalAmount,
                status: "AWAITING_PAYMENT",
                is_reseller_order: true,
                reseller_id: resellerId,
              })
              .select()
              .single();

            if (orderError) throw orderError;

            // Create order item
            await supabaseAdmin.from("order_items").insert({
              order_id: order.id,
              product_id,
              quantity,
              unit_price: unitPrice,
              total_price: totalAmount,
              input_data,
            });

            // Create payment via existing edge function
            const paymentResult = await supabaseAdmin.functions.invoke("create-payment", {
              body: { orderId: order.id },
            });

            if (paymentResult.error) {
              throw new Error(paymentResult.error.message);
            }

            return new Response(
              JSON.stringify({
                success: true,
                data: {
                  order_id: order.id,
                  status: "AWAITING_PAYMENT",
                  total_amount: totalAmount,
                  payment: paymentResult.data,
                },
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else if (req.method === "GET") {
          if (resourceId) {
            // Get single order
            const { data, error } = await supabaseAdmin
              .from("orders")
              .select(`
                *,
                order_items (
                  id, quantity, unit_price, total_price, input_data, delivery_data, delivered_at,
                  product:products(id, name, slug, image_url)
                )
              `)
              .eq("id", resourceId)
              .eq("reseller_id", resellerId)
              .single();

            if (error || !data) {
              return new Response(
                JSON.stringify({ success: false, error: "Order not found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            return new Response(
              JSON.stringify({ success: true, data }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else {
            // List orders
            const limit = parseInt(url.searchParams.get("limit") || "50");
            const offset = parseInt(url.searchParams.get("offset") || "0");
            const status = url.searchParams.get("status");

            let query = supabaseAdmin
              .from("orders")
              .select(`
                id, customer_name, customer_email, status, total_amount, created_at,
                order_items (
                  id, quantity,
                  product:products(id, name, slug)
                )
              `)
              .eq("reseller_id", resellerId)
              .order("created_at", { ascending: false })
              .range(offset, offset + limit - 1);

            if (status) {
              query = query.eq("status", status);
            }

            const { data, error } = await query;
            if (error) throw error;

            return new Response(
              JSON.stringify({ success: true, data }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
        break;
      }

      case "payments": {
        if (req.method === "GET" && resourceId) {
          // Check payment status
          const { data: order, error } = await supabaseAdmin
            .from("orders")
            .select("id, status, paid_at")
            .eq("id", resourceId)
            .eq("reseller_id", resellerId)
            .single();

          if (error || !order) {
            return new Response(
              JSON.stringify({ success: false, error: "Order not found" }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const { data: payment } = await supabaseAdmin
            .from("payments")
            .select("status, paid_at")
            .eq("order_id", resourceId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return new Response(
            JSON.stringify({
              success: true,
              data: {
                order_id: order.id,
                order_status: order.status,
                payment_status: payment?.status || "UNKNOWN",
                paid_at: order.paid_at,
              },
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        break;
      }

      case "wallet": {
        if (req.method === "GET") {
          // Get wallet balance
          const { data, error } = await supabaseAdmin
            .from("reseller_wallets")
            .select("balance, total_topup, total_spent, total_cashback")
            .eq("user_id", resellerId)
            .single();

          if (error) {
            // Create wallet if not exists
            const { data: newWallet, error: createError } = await supabaseAdmin
              .from("reseller_wallets")
              .insert({ user_id: resellerId })
              .select()
              .single();

            if (createError) throw createError;
            return new Response(
              JSON.stringify({ success: true, data: newWallet }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, data }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        break;
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Unknown endpoint" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Reseller API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
