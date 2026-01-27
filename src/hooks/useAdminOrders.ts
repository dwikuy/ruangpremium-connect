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

      // If status changed to PAID, create fulfillment jobs and trigger processing
      if (status === 'PAID') {
        // Get order items with product info
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('id, product_id, products(product_type)')
          .eq('order_id', orderId);

        if (itemsError) {
          console.error('Failed to fetch order items:', itemsError);
          throw new Error('Gagal mengambil item pesanan untuk fulfillment');
        }

        if (orderItems && orderItems.length > 0) {
          // Check if fulfillment jobs already exist for this order
          const orderItemIds = orderItems.map(item => item.id);
          const { data: existingJobs } = await supabase
            .from('fulfillment_jobs')
            .select('order_item_id')
            .in('order_item_id', orderItemIds);

          const existingItemIds = new Set((existingJobs || []).map(j => j.order_item_id));

          // Create fulfillment jobs only for items that don't have jobs yet
          type ProductType = 'STOCK' | 'INVITE';
          const newJobs = orderItems
            .filter(item => !existingItemIds.has(item.id))
            .map(item => {
              const productType = (item.products as { product_type: string } | null)?.product_type;
              const jobType: ProductType = (productType === 'INVITE' || productType === 'STOCK') ? productType : 'STOCK';
              return {
                order_item_id: item.id,
                job_type: jobType,
                status: 'PENDING' as const,
              };
            });

          if (newJobs.length > 0) {
            const { error: jobsError } = await supabase
              .from('fulfillment_jobs')
              .insert(newJobs);

            if (jobsError) {
              console.error('Failed to create fulfillment jobs:', jobsError);
              throw new Error('Gagal membuat fulfillment job');
            }

          }

          // Also trigger even when no new jobs were inserted (jobs may already exist but still pending)
          try {
            await supabase.functions.invoke('trigger-fulfillment', {
              body: { order_id: orderId },
            });
          } catch (triggerError) {
            console.error('Failed to trigger fulfillment:', triggerError);
            // Don't throw - existing jobs can be processed later
          }
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order'] });
      queryClient.invalidateQueries({ queryKey: ['admin-fulfillment'] });
      
      const message = variables.status === 'PAID' 
        ? 'Status pesanan diperbarui & fulfillment job dibuat'
        : 'Status pesanan berhasil diperbarui';
      
      toast({
        title: 'Berhasil',
        description: message,
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
