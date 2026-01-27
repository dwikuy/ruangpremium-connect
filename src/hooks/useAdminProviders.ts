import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface Provider {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  config: Json;
  created_at: string;
  updated_at: string;
}

export interface ProviderAccount {
  id: string;
  provider_id: string;
  name: string;
  credentials: Json;
  is_active: boolean;
  max_daily_invites: number | null;
  current_daily_invites: number | null;
  last_invite_at: string | null;
  cooldown_until: string | null;
  created_at: string;
  updated_at: string;
  provider?: Provider;
}

export interface ProviderFormData {
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

export interface ProviderAccountFormData {
  provider_id: string;
  name: string;
  credentials: Record<string, string>;
  is_active: boolean;
  max_daily_invites: number | null;
}

export function useAdminProviders() {
  const queryClient = useQueryClient();

  // Fetch Providers
  const { data: providers, isLoading: isLoadingProviders } = useQuery({
    queryKey: ['admin-providers'],
    queryFn: async (): Promise<Provider[]> => {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .order('name');

      if (error) throw error;
      return (data || []) as Provider[];
    },
  });

  // Fetch Provider Accounts
  const { data: accounts, isLoading: isLoadingAccounts, error } = useQuery({
    queryKey: ['admin-provider-accounts'],
    queryFn: async (): Promise<ProviderAccount[]> => {
      const { data, error } = await supabase
        .from('provider_accounts')
        .select(`
          *,
          provider:providers(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ProviderAccount[];
    },
  });

  // Create Provider
  const createProviderMutation = useMutation({
    mutationFn: async (formData: ProviderFormData) => {
      const { data, error } = await supabase
        .from('providers')
        .insert({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          is_active: formData.is_active,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
      toast({
        title: 'Berhasil',
        description: 'Provider berhasil ditambahkan',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to create provider:', error);
      toast({
        title: 'Gagal',
        description: error.message.includes('duplicate') 
          ? 'Slug provider sudah digunakan' 
          : 'Gagal menambahkan provider',
        variant: 'destructive',
      });
    },
  });

  // Create Provider Account
  const createAccountMutation = useMutation({
    mutationFn: async (formData: ProviderAccountFormData) => {
      const { data, error } = await supabase
        .from('provider_accounts')
        .insert({
          provider_id: formData.provider_id,
          name: formData.name,
          credentials: formData.credentials as unknown as Json,
          is_active: formData.is_active,
          max_daily_invites: formData.max_daily_invites,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-provider-accounts'] });
      toast({
        title: 'Berhasil',
        description: 'Akun provider berhasil ditambahkan',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to create account:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal menambahkan akun provider',
        variant: 'destructive',
      });
    },
  });

  // Update Provider Account
  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: Partial<ProviderAccountFormData> }) => {
      const updateData: Record<string, unknown> = {};
      if (formData.name !== undefined) updateData.name = formData.name;
      if (formData.credentials !== undefined) updateData.credentials = formData.credentials;
      if (formData.is_active !== undefined) updateData.is_active = formData.is_active;
      if (formData.max_daily_invites !== undefined) updateData.max_daily_invites = formData.max_daily_invites;

      const { data, error } = await supabase
        .from('provider_accounts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-provider-accounts'] });
      toast({
        title: 'Berhasil',
        description: 'Akun provider berhasil diperbarui',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to update account:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal memperbarui akun provider',
        variant: 'destructive',
      });
    },
  });

  // Toggle Account Active
  const toggleAccountMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('provider_accounts')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-provider-accounts'] });
      toast({
        title: 'Berhasil',
        description: `Akun berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      });
    },
    onError: (error: Error) => {
      console.error('Failed to toggle account:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal mengubah status akun',
        variant: 'destructive',
      });
    },
  });

  // Delete Provider Account
  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('provider_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-provider-accounts'] });
      toast({
        title: 'Berhasil',
        description: 'Akun provider berhasil dihapus',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to delete account:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal menghapus akun provider',
        variant: 'destructive',
      });
    },
  });

  // Reset Daily Invites
  const resetDailyInvitesMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('provider_accounts')
        .update({ 
          current_daily_invites: 0,
          cooldown_until: null 
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-provider-accounts'] });
      toast({
        title: 'Berhasil',
        description: 'Counter harian berhasil direset',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to reset invites:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal mereset counter',
        variant: 'destructive',
      });
    },
  });

  // Stats
  const stats = {
    totalProviders: providers?.length || 0,
    totalAccounts: accounts?.length || 0,
    activeAccounts: accounts?.filter(a => a.is_active).length || 0,
    cooldownAccounts: accounts?.filter(a => a.cooldown_until && new Date(a.cooldown_until) > new Date()).length || 0,
  };

  return {
    providers,
    accounts,
    stats,
    isLoading: isLoadingProviders || isLoadingAccounts,
    error,
    createProvider: createProviderMutation.mutate,
    createAccount: createAccountMutation.mutate,
    updateAccount: updateAccountMutation.mutate,
    toggleAccount: toggleAccountMutation.mutate,
    deleteAccount: deleteAccountMutation.mutate,
    resetDailyInvites: resetDailyInvitesMutation.mutate,
    isCreatingProvider: createProviderMutation.isPending,
    isCreatingAccount: createAccountMutation.isPending,
    isUpdating: updateAccountMutation.isPending,
    isDeleting: deleteAccountMutation.isPending,
  };
}
