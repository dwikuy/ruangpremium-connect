import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ResellerData {
  user_id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'member' | 'reseller' | 'admin';
  created_at: string;
  wallet_balance: number;
  total_topup: number;
  total_spent: number;
  total_cashback: number;
  total_orders: number;
  total_revenue: number;
  api_keys_count: number;
}

// Get all resellers with stats
export function useResellers() {
  return useQuery({
    queryKey: ['admin-resellers'],
    queryFn: async () => {
      // Get all users with reseller role
      const { data: resellers, error: resellersError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'reseller');

      if (resellersError) throw resellersError;

      if (!resellers || resellers.length === 0) return [];

      const resellerIds = resellers.map(r => r.user_id);

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, name, phone, created_at')
        .in('user_id', resellerIds);

      // Fetch wallets
      const { data: wallets } = await supabase
        .from('reseller_wallets')
        .select('user_id, balance, total_topup, total_spent, total_cashback')
        .in('user_id', resellerIds);

      // Fetch orders stats
      const { data: orders } = await supabase
        .from('orders')
        .select('reseller_id, total_amount, status')
        .in('reseller_id', resellerIds);

      // Fetch API keys count
      const { data: apiKeys } = await supabase
        .from('reseller_api_keys')
        .select('user_id, id')
        .in('user_id', resellerIds);

      // Combine data
      const result: ResellerData[] = resellers.map(r => {
        const profile = profiles?.find(p => p.user_id === r.user_id);
        const wallet = wallets?.find(w => w.user_id === r.user_id);
        const resellerOrders = orders?.filter(o => o.reseller_id === r.user_id) || [];
        const paidOrders = resellerOrders.filter(o => o.status !== 'AWAITING_PAYMENT' && o.status !== 'CANCELLED');
        const apiKeysCount = apiKeys?.filter(k => k.user_id === r.user_id).length || 0;

        return {
          user_id: r.user_id,
          email: profile?.email || '',
          name: profile?.name || '',
          phone: profile?.phone || null,
          role: r.role as 'member' | 'reseller' | 'admin',
          created_at: profile?.created_at || '',
          wallet_balance: wallet?.balance || 0,
          total_topup: wallet?.total_topup || 0,
          total_spent: wallet?.total_spent || 0,
          total_cashback: wallet?.total_cashback || 0,
          total_orders: resellerOrders.length,
          total_revenue: paidOrders.reduce((sum, o) => sum + o.total_amount, 0),
          api_keys_count: apiKeysCount,
        };
      });

      return result;
    },
  });
}

// Get members that can be upgraded to reseller
export function useMembers() {
  return useQuery({
    queryKey: ['admin-members'],
    queryFn: async () => {
      // Get all users with member role
      const { data: members, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'member');

      if (error) throw error;

      if (!members || members.length === 0) return [];

      const memberIds = members.map(m => m.user_id);

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, name, phone, created_at')
        .in('user_id', memberIds);

      return members.map(m => {
        const profile = profiles?.find(p => p.user_id === m.user_id);
        return {
          user_id: m.user_id,
          email: profile?.email || '',
          name: profile?.name || '',
          phone: profile?.phone || null,
          created_at: profile?.created_at || '',
        };
      });
    },
  });
}

// Upgrade member to reseller
export function useUpgradeToReseller() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Update role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'reseller' })
        .eq('user_id', userId);

      if (roleError) throw roleError;

      // Create wallet if not exists
      const { error: walletError } = await supabase
        .from('reseller_wallets')
        .upsert({
          user_id: userId,
          balance: 0,
          total_topup: 0,
          total_spent: 0,
          total_cashback: 0,
        }, { onConflict: 'user_id' });

      if (walletError) throw walletError;
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Member berhasil dijadikan Reseller.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-resellers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Downgrade reseller to member
export function useDowngradeToMember() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'member' })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Reseller berhasil diturunkan menjadi Member.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-resellers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Add balance to reseller wallet (admin topup)
export function useAddResellerBalance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, amount, description }: { userId: string; amount: number; description?: string }) => {
      // Get current wallet
      const { data: wallet, error: walletError } = await supabase
        .from('reseller_wallets')
        .select('balance, total_topup')
        .eq('user_id', userId)
        .single();

      if (walletError) throw walletError;

      const newBalance = (wallet?.balance || 0) + amount;
      const newTotalTopup = (wallet?.total_topup || 0) + amount;

      // Update wallet balance and total_topup
      const { error: updateError } = await supabase
        .from('reseller_wallets')
        .update({ 
          balance: newBalance,
          total_topup: newTotalTopup,
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'TOPUP',
          amount: amount,
          balance_after: newBalance,
          description: description || 'Admin topup',
        });

      if (txError) throw txError;

      return { newBalance };
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Saldo berhasil ditambahkan.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-resellers'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Get reseller API keys (for admin)
export function useResellerApiKeys(userId?: string) {
  return useQuery({
    queryKey: ['admin-reseller-api-keys', userId],
    queryFn: async () => {
      let query = supabase
        .from('reseller_api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!userId || userId === undefined,
  });
}

// Update API key rate limit
export function useUpdateApiKeyRateLimit() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ keyId, rateLimit }: { keyId: string; rateLimit: number }) => {
      const { error } = await supabase
        .from('reseller_api_keys')
        .update({ rate_limit: rateLimit })
        .eq('id', keyId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Rate limit berhasil diperbarui.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-reseller-api-keys'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Toggle API key active status
export function useToggleApiKeyStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ keyId, isActive }: { keyId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('reseller_api_keys')
        .update({ is_active: isActive })
        .eq('id', keyId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Berhasil',
        description: `API key ${variables.isActive ? 'diaktifkan' : 'dinonaktifkan'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-reseller-api-keys'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Get all webhook deliveries (for admin)
export function useWebhookDeliveries(filters?: { status?: 'success' | 'failed' | 'all' }) {
  return useQuery({
    queryKey: ['admin-webhook-deliveries', filters],
    queryFn: async () => {
      let query = supabase
        .from('webhook_deliveries')
        .select(`
          *,
          api_key:reseller_api_keys (
            id,
            name,
            user_id,
            webhook_url
          ),
          order:orders (
            id,
            customer_name,
            status,
            total_amount
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.status === 'success') {
        query = query.not('delivered_at', 'is', null);
      } else if (filters?.status === 'failed') {
        query = query.is('delivered_at', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// Retry webhook delivery
export function useRetryWebhook() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deliveryId: string) => {
      // Get the delivery details
      const { data: delivery, error: deliveryError } = await supabase
        .from('webhook_deliveries')
        .select('order_id, event_type')
        .eq('id', deliveryId)
        .single();

      if (deliveryError) throw deliveryError;

      // Call send-webhook function
      const { data, error } = await supabase.functions.invoke('send-webhook', {
        body: {
          order_id: delivery.order_id,
          event_type: delivery.event_type,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Webhook berhasil dikirim ulang.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-webhook-deliveries'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
