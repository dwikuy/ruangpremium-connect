import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { OrderWithItems, OrderItem, PaymentInfo } from '@/types/database';

interface OrderRow {
  id: string;
  guest_token: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  subtotal: number;
  discount_amount: number | null;
  points_used: number | null;
  points_discount: number | null;
  total_amount: number;
  status: string;
  paid_at: string | null;
  delivered_at: string | null;
  created_at: string;
  order_items: OrderItemRow[];
  payments: PaymentRow[];
}

interface OrderItemRow {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  input_data: Record<string, string> | null;
  delivery_data: Record<string, unknown> | null;
  delivered_at: string | null;
  products: {
    name: string;
    image_url: string | null;
  } | null;
}

interface PaymentRow {
  id: string;
  tokopay_trx_id: string | null;
  ref_id: string;
  amount: number;
  qr_link: string | null;
  pay_url: string | null;
  status: string;
  expires_at: string | null;
  paid_at: string | null;
}

// Fetch all orders for the current user
export function useUserOrders() {
  return useQuery({
    queryKey: ['user-orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, image_url)
          ),
          payments (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data as unknown as OrderRow[]).map(mapOrderToOrderWithItems);
    },
  });
}

// Fetch single order by ID
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) return null;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, image_url)
          ),
          payments (*)
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;

      return mapOrderToOrderWithItems(data as unknown as OrderRow);
    },
    enabled: !!orderId,
  });
}

// Fetch order by guest token (for tracking without login)
export function useOrderByToken(guestToken: string) {
  return useQuery({
    queryKey: ['order-token', guestToken],
    queryFn: async () => {
      if (!guestToken) return null;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, image_url)
          ),
          payments (*)
        `)
        .eq('guest_token', guestToken)
        .single();

      if (error) throw error;

      return mapOrderToOrderWithItems(data as unknown as OrderRow);
    },
    enabled: !!guestToken,
  });
}

// Helper function to map database rows to typed OrderWithItems
function mapOrderToOrderWithItems(order: OrderRow): OrderWithItems {
  const items: OrderItem[] = order.order_items.map((item) => ({
    id: item.id,
    product_id: item.product_id,
    product_name: item.products?.name || 'Unknown Product',
    product_image: item.products?.image_url || null,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
    input_data: item.input_data || {},
    delivery_data: item.delivery_data,
    delivered_at: item.delivered_at,
  }));

  const payment: PaymentInfo | null = order.payments?.[0]
    ? {
        id: order.payments[0].id,
        tokopay_trx_id: order.payments[0].tokopay_trx_id,
        ref_id: order.payments[0].ref_id,
        amount: order.payments[0].amount,
        qr_link: order.payments[0].qr_link,
        pay_url: order.payments[0].pay_url,
        status: order.payments[0].status as 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED',
        expires_at: order.payments[0].expires_at,
        paid_at: order.payments[0].paid_at,
      }
    : null;

  return {
    id: order.id,
    guest_token: order.guest_token,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone,
    subtotal: order.subtotal,
    discount_amount: order.discount_amount || 0,
    points_used: order.points_used || 0,
    points_discount: order.points_discount || 0,
    total_amount: order.total_amount,
    status: order.status as OrderWithItems['status'],
    paid_at: order.paid_at,
    delivered_at: order.delivered_at,
    created_at: order.created_at,
    items,
    payment,
  };
}
