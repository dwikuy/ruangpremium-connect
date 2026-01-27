import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type StockStatus = Database['public']['Enums']['stock_status'];

export interface StockItem {
  id: string;
  product_id: string;
  secret_data: string;
  status: StockStatus;
  order_id: string | null;
  reserved_at: string | null;
  sold_at: string | null;
  expires_at: string | null;
  created_at: string;
  product?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface StockFormData {
  product_id: string;
  secret_data: string;
  expires_at: string | null;
}

export function useAdminStock() {
  const queryClient = useQueryClient();

  const { data: stockItems, isLoading, error } = useQuery({
    queryKey: ['admin-stock'],
    queryFn: async (): Promise<StockItem[]> => {
      const { data, error } = await supabase
        .from('stock_items')
        .select(`
          *,
          product:products(id, name, slug)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as StockItem[];
    },
  });

  const { data: products } = useQuery({
    queryKey: ['admin-stock-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug')
        .eq('product_type', 'STOCK')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: StockFormData) => {
      const { data, error } = await supabase
        .from('stock_items')
        .insert({
          product_id: formData.product_id,
          secret_data: formData.secret_data,
          expires_at: formData.expires_at,
          status: 'AVAILABLE',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stock'] });
      toast({
        title: 'Berhasil',
        description: 'Stok berhasil ditambahkan',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to create stock:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal menambahkan stok',
        variant: 'destructive',
      });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (items: StockFormData[]) => {
      const formattedItems = items.map(item => ({
        product_id: item.product_id,
        secret_data: item.secret_data,
        expires_at: item.expires_at,
        status: 'AVAILABLE' as StockStatus,
      }));

      const { data, error } = await supabase
        .from('stock_items')
        .insert(formattedItems)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-stock'] });
      toast({
        title: 'Berhasil',
        description: `${data.length} stok berhasil diimport`,
      });
    },
    onError: (error: Error) => {
      console.error('Failed to import stock:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal mengimport stok',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stock_items')
        .delete()
        .eq('id', id)
        .eq('status', 'AVAILABLE');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stock'] });
      toast({
        title: 'Berhasil',
        description: 'Stok berhasil dihapus',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to delete stock:', error);
      toast({
        title: 'Gagal',
        description: 'Hanya stok AVAILABLE yang bisa dihapus',
        variant: 'destructive',
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('stock_items')
        .delete()
        .in('id', ids)
        .eq('status', 'AVAILABLE');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stock'] });
      toast({
        title: 'Berhasil',
        description: 'Stok berhasil dihapus',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to bulk delete stock:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal menghapus stok',
        variant: 'destructive',
      });
    },
  });

  // Stats
  const stats = {
    total: stockItems?.length || 0,
    available: stockItems?.filter(s => s.status === 'AVAILABLE').length || 0,
    reserved: stockItems?.filter(s => s.status === 'RESERVED').length || 0,
    sold: stockItems?.filter(s => s.status === 'SOLD').length || 0,
  };

  return {
    stockItems,
    products,
    stats,
    isLoading,
    error,
    createStock: createMutation.mutate,
    bulkImport: bulkImportMutation.mutateAsync,
    deleteStock: deleteMutation.mutate,
    bulkDelete: bulkDeleteMutation.mutate,
    isCreating: createMutation.isPending,
    isImporting: bulkImportMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
