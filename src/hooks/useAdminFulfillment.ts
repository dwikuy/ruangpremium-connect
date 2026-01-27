import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface FulfillmentJob {
  id: string;
  order_item_id: string;
  job_type: 'STOCK' | 'INVITE';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  provider_account_id: string | null;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  result: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
  next_retry_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  order_item?: {
    id: string;
    order_id: string;
    product_id: string;
    input_data: Record<string, string>;
    order?: {
      id: string;
      customer_name: string;
      customer_email: string;
      status: string;
    };
    product?: {
      id: string;
      name: string;
      product_type: string;
    };
  };
  provider_account?: {
    id: string;
    name: string;
    provider?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export type FulfillmentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export function useAdminFulfillment(statusFilter?: FulfillmentStatus) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['admin-fulfillment-jobs', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('fulfillment_jobs')
        .select(`
          *,
          order_item:order_items(
            id,
            order_id,
            product_id,
            input_data,
            order:orders(id, customer_name, customer_email, status),
            product:products(id, name, product_type)
          ),
          provider_account:provider_accounts(
            id,
            name,
            provider:providers(id, name, slug)
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FulfillmentJob[];
    },
  });

  const retryJob = useMutation({
    mutationFn: async (jobId: string) => {
      // Reset job to PENDING for retry
      const { error } = await supabase
        .from('fulfillment_jobs')
        .update({
          status: 'PENDING',
          attempts: 0,
          last_error: null,
          next_retry_at: null,
          started_at: null,
          completed_at: null,
        })
        .eq('id', jobId);

      if (error) throw error;

      // Trigger fulfillment processing
      const { error: fnError } = await supabase.functions.invoke('trigger-fulfillment');
      if (fnError) {
        console.warn('Failed to trigger fulfillment:', fnError);
      }
    },
    onSuccess: () => {
      toast({ title: 'Job di-reset untuk retry' });
      queryClient.invalidateQueries({ queryKey: ['admin-fulfillment-jobs'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Gagal retry job', description: error.message, variant: 'destructive' });
    },
  });

  const cancelJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('fulfillment_jobs')
        .update({
          status: 'FAILED',
          last_error: 'Cancelled by admin',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Job dibatalkan' });
      queryClient.invalidateQueries({ queryKey: ['admin-fulfillment-jobs'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Gagal membatalkan job', description: error.message, variant: 'destructive' });
    },
  });

  const markCompleted = useMutation({
    mutationFn: async ({ jobId, result }: { jobId: string; result?: Json }) => {
      const { error } = await supabase
        .from('fulfillment_jobs')
        .update({
          status: 'COMPLETED',
          result: result || { manual: true, completed_by: 'admin' },
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Job ditandai selesai' });
      queryClient.invalidateQueries({ queryKey: ['admin-fulfillment-jobs'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Gagal menandai selesai', description: error.message, variant: 'destructive' });
    },
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['admin-fulfillment-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fulfillment_jobs')
        .select('status');

      if (error) throw error;

      const counts = {
        PENDING: 0,
        PROCESSING: 0,
        COMPLETED: 0,
        FAILED: 0,
        total: data.length,
      };

      data.forEach((job) => {
        counts[job.status as FulfillmentStatus]++;
      });

      return counts;
    },
  });

  return {
    jobs: jobs || [],
    stats,
    isLoading,
    error,
    retryJob,
    cancelJob,
    markCompleted,
  };
}
