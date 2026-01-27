import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

export interface AdminOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  subtotal: number;
  discount_amount: number | null;
  points_discount: number | null;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
  user_id: string | null;
  items: {
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    delivery_data: Record<string, unknown> | null;
    delivered_at: string | null;
  }[];
  payment: {
    id: string;
    ref_id: string;
    amount: number;
    status: string;
    paid_at: string | null;
    tokopay_trx_id: string | null;
  } | null;
}

interface OrdersFilter {
  status?: OrderStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface OrderItemFromDB {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  delivery_data: Record<string, unknown> | null;
  delivered_at: string | null;
  products: { name: string } | null;
}

export function useAdminOrders(filter?: OrdersFilter) {
  return useQuery({
    queryKey: ['admin-orders', filter],
    queryFn: async (): Promise<AdminOrder[]> => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            unit_price,
            total_price,
            delivery_data,
            delivered_at,
            products (name)
          ),
          payments (
            id,
            ref_id,
            amount,
            status,
            paid_at,
            tokopay_trx_id
          )
        `)
        .order('created_at', { ascending: false });

      if (filter?.status) {
        query = query.eq('status', filter.status);
      }

      if (filter?.search) {
        query = query.or(`customer_name.ilike.%${filter.search}%,customer_email.ilike.%${filter.search}%,id.ilike.%${filter.search}%`);
      }

      if (filter?.dateFrom) {
        query = query.gte('created_at', filter.dateFrom);
      }

      if (filter?.dateTo) {
        query = query.lte('created_at', filter.dateTo);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      return (data || []).map((order) => ({
        ...order,
        items: ((order.order_items || []) as OrderItemFromDB[]).map((item) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.products?.name || 'Unknown',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          delivery_data: item.delivery_data,
          delivered_at: item.delivered_at,
        })),
        payment: order.payments?.[0] || null,
      }));
    },
  });
}

export function useAdminOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: async (): Promise<AdminOrder | null> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            unit_price,
            total_price,
            input_data,
            delivery_data,
            delivered_at,
            products (name, image_url)
          ),
          payments (
            id,
            ref_id,
            amount,
            status,
            paid_at,
            tokopay_trx_id,
            webhook_data
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;

      return {
        ...data,
        items: ((data.order_items || []) as OrderItemFromDB[]).map((item) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.products?.name || 'Unknown',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          delivery_data: item.delivery_data,
          delivered_at: item.delivered_at,
        })),
        payment: data.payments?.[0] || null,
      };
    },
    enabled: !!orderId,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (status === 'DELIVERED') {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === 'PAID') {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order'] });
      toast({
        title: 'Berhasil',
        description: 'Status pesanan berhasil diperbarui',
      });
    },
    onError: (error) => {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Gagal memperbarui status',
        variant: 'destructive',
      });
    },
  });
}
