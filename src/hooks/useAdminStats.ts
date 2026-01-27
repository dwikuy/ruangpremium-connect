import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      // Get orders stats
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, total_amount, created_at, paid_at');

      if (ordersError) throw ordersError;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = {
        totalOrders: orders?.length || 0,
        pendingOrders: orders?.filter(o => o.status === 'AWAITING_PAYMENT').length || 0,
        paidOrders: orders?.filter(o => o.status === 'PAID' || o.status === 'PROCESSING').length || 0,
        deliveredOrders: orders?.filter(o => o.status === 'DELIVERED').length || 0,
        totalRevenue: orders?.filter(o => o.paid_at).reduce((sum, o) => sum + o.total_amount, 0) || 0,
        todayRevenue: orders?.filter(o => o.paid_at && new Date(o.paid_at) >= today).reduce((sum, o) => sum + o.total_amount, 0) || 0,
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0,
      };

      // Get products stats
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, is_active, product_type');

      if (!productsError && products) {
        stats.totalProducts = products.length;
        stats.activeProducts = products.filter(p => p.is_active).length;

        // Get low stock count
        const stockProducts = products.filter(p => p.product_type === 'STOCK');
        if (stockProducts.length > 0) {
          const { data: stockData } = await supabase
            .from('stock_items')
            .select('product_id')
            .in('product_id', stockProducts.map(p => p.id))
            .eq('status', 'AVAILABLE');

          if (stockData) {
            const stockCounts: Record<string, number> = {};
            stockData.forEach(item => {
              stockCounts[item.product_id] = (stockCounts[item.product_id] || 0) + 1;
            });

            // Count products with less than 5 stock
            stats.lowStockProducts = stockProducts.filter(p => (stockCounts[p.id] || 0) < 5).length;
          }
        }
      }

      return stats;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useRecentOrders(limit = 5) {
  return useQuery({
    queryKey: ['admin-recent-orders', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          total_amount,
          status,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
  });
}
