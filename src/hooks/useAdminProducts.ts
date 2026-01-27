import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database, Json } from '@/integrations/supabase/types';

type ProductType = Database['public']['Enums']['product_type'];

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  retail_price: number;
  reseller_price: number | null;
  product_type: ProductType;
  is_active: boolean | null;
  is_featured: boolean | null;
  category_id: string | null;
  category_name?: string;
  total_sold: number | null;
  stock_count?: number;
  created_at: string;
}

export interface ProductFormData {
  name: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  retail_price: number;
  reseller_price?: number | null;
  product_type: ProductType;
  is_active?: boolean;
  is_featured?: boolean;
  category_id?: string | null;
  provider_id?: string | null;
  duration_days?: number | null;
  benefits?: Json;
  input_schema?: Json;
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ['admin-products'],
    queryFn: async (): Promise<AdminProduct[]> => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_categories (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get stock counts for STOCK products
      const stockProducts = (data || []).filter(p => p.product_type === 'STOCK');
      const stockCounts: Record<string, number> = {};

      if (stockProducts.length > 0) {
        const { data: stockData } = await supabase
          .from('stock_items')
          .select('product_id')
          .in('product_id', stockProducts.map(p => p.id))
          .eq('status', 'AVAILABLE');

        if (stockData) {
          stockData.forEach((item) => {
            stockCounts[item.product_id] = (stockCounts[item.product_id] || 0) + 1;
          });
        }
      }

      return (data || []).map((product) => ({
        ...product,
        category_name: (product.product_categories as { name: string })?.name || null,
        stock_count: stockCounts[product.id] || 0,
      }));
    },
  });
}

export function useAdminProduct(productId: string) {
  return useQuery({
    queryKey: ['admin-product', productId],
    queryFn: async (): Promise<AdminProduct & { provider_id?: string | null } | null> => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_categories (name)
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;

      return {
        ...data,
        category_name: (data.product_categories as { name: string })?.name || null,
      };
    },
    enabled: !!productId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ProductFormData) => {
      const { error } = await supabase
        .from('products')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({
        title: 'Berhasil',
        description: 'Produk berhasil ditambahkan',
      });
    },
    onError: (error) => {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Gagal menambahkan produk',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormData> }) => {
      const { error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product'] });
      toast({
        title: 'Berhasil',
        description: 'Produk berhasil diperbarui',
      });
    },
    onError: (error) => {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Gagal memperbarui produk',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({
        title: 'Berhasil',
        description: 'Produk berhasil dihapus',
      });
    },
    onError: (error) => {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Gagal menghapus produk',
        variant: 'destructive',
      });
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}
