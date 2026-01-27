import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface SystemSetting {
  id: string;
  key: string;
  value: Json;
  description: string | null;
  updated_at: string;
}

export interface SettingsFormData {
  points_earn_rate: number;
  points_earn_per_amount: number;
  points_redeem_value: number;
  points_max_redeem_percent: number;
  reseller_cashback_rate: number;
  min_topup_amount: number;
  tokopay_channel: string;
}

export function useAdminSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async (): Promise<SystemSetting[]> => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('key', { ascending: true });

      if (error) throw error;
      return (data || []) as SystemSetting[];
    },
  });

  const getSettingValue = <T extends Record<string, unknown>>(key: string, defaultValue: T): T => {
    const setting = settings?.find(s => s.key === key);
    if (!setting || typeof setting.value !== 'object' || setting.value === null || Array.isArray(setting.value)) {
      return defaultValue;
    }
    return setting.value as T;
  };

  const formData: SettingsFormData = {
    points_earn_rate: (getSettingValue('points_earn_rate', { rate: 1000 })).rate || 1000,
    points_earn_per_amount: (getSettingValue('points_earn_rate', { per_amount: 100000 })).per_amount || 100000,
    points_redeem_value: (getSettingValue('points_redeem_value', { value: 1 })).value || 1,
    points_max_redeem_percent: (getSettingValue('points_max_redeem_percent', { percent: 30 })).percent || 30,
    reseller_cashback_rate: (getSettingValue('reseller_cashback_rate', { percent: 5 })).percent || 5,
    min_topup_amount: (getSettingValue('min_topup_amount', { amount: 50000 })).amount || 50000,
    tokopay_channel: (getSettingValue('tokopay_channel', { code: 'QRIS' })).code || 'QRIS',
  };

  const updateMutation = useMutation({
    mutationFn: async (updates: { key: string; value: Json; description?: string }[]) => {
      for (const update of updates) {
        // Check if setting exists
        const { data: existing } = await supabase
          .from('system_settings')
          .select('id')
          .eq('key', update.key)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('system_settings')
            .update({ 
              value: update.value,
              updated_at: new Date().toISOString() 
            })
            .eq('key', update.key);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('system_settings')
            .insert([{ 
              key: update.key, 
              value: update.value,
              description: update.description 
            }]);

          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({
        title: 'Berhasil',
        description: 'Pengaturan berhasil disimpan',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to update settings:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal menyimpan pengaturan',
        variant: 'destructive',
      });
    },
  });

  return {
    settings,
    formData,
    isLoading,
    error,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
