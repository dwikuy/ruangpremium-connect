import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import type { ProductWithCategory } from '@/types/database';

export type PaymentMethod = 'wallet' | 'qris';

interface ResellerCheckoutFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  quantity: number;
  input_data: Record<string, string>;
  payment_method: PaymentMethod;
}

interface ResellerWallet {
  balance: number;
  total_topup: number;
  total_spent: number;
  total_cashback: number;
}

export function useResellerCheckout(product: ProductWithCategory | null) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createOrder = async (
    formData: ResellerCheckoutFormData,
    userId: string,
    wallet: ResellerWallet
  ) => {
    if (!product) {
      toast({
        title: 'Error',
        description: 'Produk tidak ditemukan',
        variant: 'destructive',
      });
      return null;
    }

    // Use reseller price, fallback to retail price if not set
    const unitPrice = product.reseller_price || product.retail_price;
    const subtotal = unitPrice * formData.quantity;

    setLoading(true);

    try {
      // Check stock for STOCK products
      if (product.product_type === 'STOCK') {
        const { count } = await supabase
          .from('stock_items')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', product.id)
          .eq('status', 'AVAILABLE');

        if ((count || 0) < formData.quantity) {
          throw new Error('Stok tidak mencukupi');
        }
      }

      // Validate wallet balance if paying with wallet
      if (formData.payment_method === 'wallet') {
        if (wallet.balance < subtotal) {
          throw new Error('Saldo wallet tidak mencukupi');
        }
      }

      // Create order with reseller flag
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          reseller_id: userId,
          is_reseller_order: true,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          subtotal: subtotal,
          discount_amount: 0,
          points_used: 0,
          points_discount: 0,
          total_amount: subtotal,
          status: formData.payment_method === 'wallet' ? 'PAID' : 'AWAITING_PAYMENT',
          paid_at: formData.payment_method === 'wallet' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error('Gagal membuat pesanan');
      }

      // Create order item with reseller price
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: product.id,
          quantity: formData.quantity,
          unit_price: unitPrice,
          total_price: subtotal,
          input_data: formData.input_data || {},
        });

      if (itemError) {
        console.error('Order item creation error:', itemError);
        throw new Error('Gagal membuat item pesanan');
      }

      // If wallet payment, deduct balance and record transaction
      if (formData.payment_method === 'wallet') {
        // Deduct wallet balance
        const newBalance = wallet.balance - subtotal;
        const { error: walletError } = await supabase
          .from('reseller_wallets')
          .update({
            balance: newBalance,
            total_spent: wallet.total_spent + subtotal,
          })
          .eq('user_id', userId);

        if (walletError) {
          console.error('Wallet update error:', walletError);
          throw new Error('Gagal memotong saldo wallet');
        }

        // Record wallet transaction
        const { error: txError } = await supabase
          .from('wallet_transactions')
          .insert({
            user_id: userId,
            order_id: order.id,
            transaction_type: 'PURCHASE',
            amount: -subtotal,
            balance_after: newBalance,
            description: `Pembelian ${product.name} x${formData.quantity}`,
          });

        if (txError) {
          console.error('Wallet transaction error:', txError);
        }

        // Invalidate wallet queries
        queryClient.invalidateQueries({ queryKey: ['reseller-wallet'] });

        toast({
          title: 'Pesanan Berhasil!',
          description: 'Pembayaran via wallet berhasil. Order sedang diproses.',
        });

        // Navigate to reseller orders
        navigate('/reseller/orders');
        return order;
      }

      // For QRIS payment, navigate to invoice page
      toast({
        title: 'Pesanan Dibuat!',
        description: 'Silakan lanjutkan ke pembayaran QRIS',
      });

      navigate(`/invoice/${order.id}`);
      return order;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
      toast({
        title: 'Gagal Membuat Pesanan',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createOrder,
  };
}
