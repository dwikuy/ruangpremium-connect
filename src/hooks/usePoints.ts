import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PointsSettings {
  earnRate: number;
  perAmount: number;
  redeemValue: number;
  maxRedeemPercent: number;
}

interface PointsValidation {
  valid: boolean;
  error?: string;
  points_to_redeem?: number;
  discount_amount?: number;
  available_balance?: number;
  max_redeemable?: number;
}

export function usePointsSettings() {
  return useQuery({
    queryKey: ['points-settings'],
    queryFn: async (): Promise<PointsSettings> => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['points_earn_rate', 'points_redeem_value', 'points_max_redeem_percent']);

      if (error) throw error;

      const settings: PointsSettings = {
        earnRate: 1000,
        perAmount: 100000,
        redeemValue: 1,
        maxRedeemPercent: 30,
      };

      data?.forEach((item) => {
        const value = item.value as Record<string, number>;
        switch (item.key) {
          case 'points_earn_rate':
            settings.earnRate = value.rate || 1000;
            settings.perAmount = value.per_amount || 100000;
            break;
          case 'points_redeem_value':
            settings.redeemValue = value.value || 1;
            break;
          case 'points_max_redeem_percent':
            settings.maxRedeemPercent = value.percent || 30;
            break;
        }
      });

      return settings;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useUserPointsBalance(userId?: string) {
  return useQuery({
    queryKey: ['user-points-balance', userId],
    queryFn: async () => {
      if (!userId) return { balance: 0, total_earned: 0, total_redeemed: 0 };

      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      return data || { balance: 0, total_earned: 0, total_redeemed: 0 };
    },
    enabled: !!userId,
  });
}

export async function validatePointsRedemption(
  userId: string,
  pointsToRedeem: number,
  subtotal: number
): Promise<PointsValidation> {
  const { data, error } = await supabase.rpc('validate_points_redemption', {
    p_user_id: userId,
    p_points_to_redeem: pointsToRedeem,
    p_subtotal: subtotal,
  });

  if (error) {
    console.error('Points validation error:', error);
    return { valid: false, error: 'Gagal memvalidasi poin' };
  }

  return data as unknown as PointsValidation;
}

export async function redeemPoints(
  userId: string,
  orderId: string,
  pointsToRedeem: number
): Promise<{ success: boolean; error?: string; discount_amount?: number }> {
  const { data, error } = await supabase.rpc('redeem_points', {
    p_user_id: userId,
    p_order_id: orderId,
    p_points_to_redeem: pointsToRedeem,
  });

  if (error) {
    console.error('Points redemption error:', error);
    return { success: false, error: 'Gagal menukarkan poin' };
  }

  const result = data as unknown as { success: boolean; error?: string; discount_amount?: number };
  return result;
}

// Calculate how many points will be earned for a given amount
export function calculatePointsEarned(
  amount: number,
  settings: PointsSettings
): number {
  return Math.floor((amount / settings.perAmount) * settings.earnRate);
}

// Calculate max redeemable points based on subtotal and settings
export function calculateMaxRedeemable(
  subtotal: number,
  availablePoints: number,
  settings: PointsSettings
): number {
  const maxByPercent = Math.floor(
    (subtotal * settings.maxRedeemPercent / 100) / settings.redeemValue
  );
  return Math.min(maxByPercent, availablePoints);
}
