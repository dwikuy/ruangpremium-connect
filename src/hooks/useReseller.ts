import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Reseller stats
export function useResellerStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['reseller-stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      // Get orders created by this reseller
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .eq('reseller_id', user.id);
      
      if (ordersError) throw ordersError;
      
      // Get wallet data
      const { data: wallet, error: walletError } = await supabase
        .from('reseller_wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (walletError) throw walletError;
      
      // Calculate stats
      const totalOrders = orders?.length || 0;
      const paidOrders = orders?.filter(o => o.status !== 'AWAITING_PAYMENT' && o.status !== 'CANCELLED') || [];
      const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
      
      // Today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders?.filter(o => new Date(o.created_at) >= today) || [];
      const todayRevenue = todayOrders
        .filter(o => o.status !== 'AWAITING_PAYMENT' && o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + o.total_amount, 0);
      
      return {
        totalOrders,
        totalRevenue,
        todayOrders: todayOrders.length,
        todayRevenue,
        walletBalance: wallet?.balance || 0,
        totalTopup: wallet?.total_topup || 0,
        totalSpent: wallet?.total_spent || 0,
        totalCashback: wallet?.total_cashback || 0,
      };
    },
    enabled: !!user,
  });
}

// Reseller orders
export function useResellerOrders() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['reseller-orders', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            product:products (id, name, slug, image_url)
          )
        `)
        .eq('reseller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Reseller wallet balance
export function useResellerWallet() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['reseller-wallet', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('reseller_wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      // Return default wallet if not exists
      if (!data) {
        return {
          balance: 0,
          total_topup: 0,
          total_spent: 0,
          total_cashback: 0,
        };
      }
      
      return data;
    },
    enabled: !!user,
  });
}

// Wallet transactions
export function useWalletTransactions() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['wallet-transactions', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Create topup request
export function useCreateTopup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (amount: number) => {
      if (!user) throw new Error('Not authenticated');
      
      // Call edge function to create payment for topup
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          type: 'wallet_topup',
          amount,
          userId: user.id,
        },
      });
      
      if (error) throw error;
      
      // Check for application-level error in response
      if (data && !data.success) {
        throw new Error(data.error || 'Gagal membuat invoice topup');
      }
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Invoice Topup Dibuat',
        description: 'Silakan lakukan pembayaran QRIS.',
      });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Membuat Invoice',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// API Keys
export function useResellerApiKeys() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['reseller-api-keys', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('reseller_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Generate API Key
export function useGenerateApiKey() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Not authenticated');
      
      // Generate a random API key
      const rawKey = 'rp_' + crypto.randomUUID().replace(/-/g, '');
      const keyPrefix = rawKey.substring(0, 10);
      
      // Hash the key for storage
      const encoder = new TextEncoder();
      const data = encoder.encode(rawKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const { error } = await supabase
        .from('reseller_api_keys')
        .insert({
          user_id: user.id,
          name,
          key_prefix: keyPrefix,
          key_hash: keyHash,
        });
      
      if (error) throw error;
      
      // Return the raw key (only shown once)
      return { rawKey, keyPrefix };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller-api-keys'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Membuat API Key',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Revoke API Key
export function useRevokeApiKey() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('reseller_api_keys')
        .update({ is_active: false })
        .eq('id', keyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'API Key Dicabut',
        description: 'API key tidak dapat digunakan lagi.',
      });
      queryClient.invalidateQueries({ queryKey: ['reseller-api-keys'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Mencabut API Key',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Delete API Key
export function useDeleteApiKey() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('reseller_api_keys')
        .delete()
        .eq('id', keyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'API Key Dihapus',
        description: 'API key telah dihapus permanen.',
      });
      queryClient.invalidateQueries({ queryKey: ['reseller-api-keys'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Menghapus API Key',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update webhook settings
export function useUpdateWebhook() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      keyId, 
      webhookUrl, 
      webhookSecret, 
      webhookEnabled 
    }: { 
      keyId: string; 
      webhookUrl?: string; 
      webhookSecret?: string; 
      webhookEnabled?: boolean;
    }) => {
      const updateData: Record<string, unknown> = {};
      if (webhookUrl !== undefined) updateData.webhook_url = webhookUrl;
      if (webhookSecret !== undefined) updateData.webhook_secret = webhookSecret;
      if (webhookEnabled !== undefined) updateData.webhook_enabled = webhookEnabled;
      
      const { error } = await supabase
        .from('reseller_api_keys')
        .update(updateData)
        .eq('id', keyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Webhook Diperbarui',
        description: 'Pengaturan webhook berhasil disimpan.',
      });
      queryClient.invalidateQueries({ queryKey: ['reseller-api-keys'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Memperbarui Webhook',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Get webhook deliveries
export function useWebhookDeliveries(apiKeyId?: string) {
  return useQuery({
    queryKey: ['webhook-deliveries', apiKeyId],
    queryFn: async () => {
      let query = supabase
        .from('webhook_deliveries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (apiKeyId) {
        query = query.eq('api_key_id', apiKeyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!apiKeyId,
  });
}
