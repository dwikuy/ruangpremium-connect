import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { DiscountType } from '@/types/database';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number | null;
  per_user_limit: number | null;
  product_ids: string[] | null;
  role_restriction: string[] | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponFormData {
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  per_user_limit: number | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}

export function useAdminCoupons() {
  const queryClient = useQueryClient();

  const { data: coupons, isLoading, error } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async (): Promise<Coupon[]> => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Coupon[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: CouponFormData) => {
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          ...formData,
          code: formData.code.toUpperCase(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast({
        title: 'Berhasil',
        description: 'Kupon berhasil ditambahkan',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to create coupon:', error);
      toast({
        title: 'Gagal',
        description: error.message.includes('duplicate') 
          ? 'Kode kupon sudah digunakan' 
          : 'Gagal menambahkan kupon',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: Partial<CouponFormData> }) => {
      const updateData = formData.code 
        ? { ...formData, code: formData.code.toUpperCase() }
        : formData;

      const { data, error } = await supabase
        .from('coupons')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast({
        title: 'Berhasil',
        description: 'Kupon berhasil diperbarui',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to update coupon:', error);
      toast({
        title: 'Gagal',
        description: error.message.includes('duplicate') 
          ? 'Kode kupon sudah digunakan' 
          : 'Gagal memperbarui kupon',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast({
        title: 'Berhasil',
        description: 'Kupon berhasil dihapus',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to delete coupon:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal menghapus kupon',
        variant: 'destructive',
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast({
        title: 'Berhasil',
        description: `Kupon berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      });
    },
    onError: (error: Error) => {
      console.error('Failed to toggle coupon:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal mengubah status kupon',
        variant: 'destructive',
      });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (couponsData: CouponFormData[]) => {
      const formattedData = couponsData.map(coupon => ({
        ...coupon,
        code: coupon.code.toUpperCase(),
      }));

      const { data, error } = await supabase
        .from('coupons')
        .insert(formattedData)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast({
        title: 'Berhasil',
        description: `${data.length} kupon berhasil diimport`,
      });
    },
    onError: (error: Error) => {
      console.error('Failed to import coupons:', error);
      toast({
        title: 'Gagal',
        description: error.message.includes('duplicate') 
          ? 'Beberapa kode kupon sudah ada' 
          : 'Gagal mengimport kupon',
        variant: 'destructive',
      });
    },
  });

  return {
    coupons,
    isLoading,
    error,
    createCoupon: createMutation.mutate,
    updateCoupon: updateMutation.mutate,
    deleteCoupon: deleteMutation.mutate,
    toggleActive: toggleActiveMutation.mutate,
    bulkImport: bulkImportMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isToggling: toggleActiveMutation.isPending,
    isImporting: bulkImportMutation.isPending,
  };
}
