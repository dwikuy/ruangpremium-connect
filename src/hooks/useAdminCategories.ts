import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryFormData {
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

export function useAdminCategories() {
  const queryClient = useQueryClient();

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: CategoryFormData) => {
      const { data, error } = await supabase
        .from('product_categories')
        .insert(formData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast({
        title: 'Berhasil',
        description: 'Kategori berhasil ditambahkan',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to create category:', error);
      toast({
        title: 'Gagal',
        description: error.message.includes('duplicate') 
          ? 'Slug sudah digunakan' 
          : 'Gagal menambahkan kategori',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: Partial<CategoryFormData> }) => {
      const { data, error } = await supabase
        .from('product_categories')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast({
        title: 'Berhasil',
        description: 'Kategori berhasil diperbarui',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to update category:', error);
      toast({
        title: 'Gagal',
        description: error.message.includes('duplicate') 
          ? 'Slug sudah digunakan' 
          : 'Gagal memperbarui kategori',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast({
        title: 'Berhasil',
        description: 'Kategori berhasil dihapus',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to delete category:', error);
      toast({
        title: 'Gagal',
        description: error.message.includes('foreign') 
          ? 'Kategori masih digunakan oleh produk' 
          : 'Gagal menghapus kategori',
        variant: 'destructive',
      });
    },
  });

  return {
    categories,
    isLoading,
    error,
    createCategory: createMutation.mutate,
    updateCategory: updateMutation.mutate,
    deleteCategory: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
