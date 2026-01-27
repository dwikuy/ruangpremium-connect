import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PaymentInfo, OrderWithItems, OrderItem } from '@/types/database';

interface PaymentState {
  loading: boolean;
  error: string | null;
  order: OrderWithItems | null;
  payment: PaymentInfo | null;
  isPaid: boolean;
  isExpired: boolean;
}

export function usePayment(orderId: string, guestToken?: string | null) {
  const [state, setState] = useState<PaymentState>({
    loading: true,
    error: null,
    order: null,
    payment: null,
    isPaid: false,
    isExpired: false,
  });

  // Fetch order and payment details
  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;

    try {
      // Build query based on guest token or authenticated user
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(
            *,
            product:products(name, image_url)
          ),
          payments(*)
        `)
        .eq('id', orderId);

      if (guestToken) {
        query = query.eq('guest_token', guestToken);
      }

      const { data: order, error: orderError } = await query.maybeSingle();

      if (orderError) throw orderError;
      if (!order) throw new Error('Pesanan tidak ditemukan');

      // Transform to typed interface
      const orderItems: OrderItem[] = (order.order_items || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product?.name || 'Unknown Product',
        product_image: item.product?.image_url || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        input_data: item.input_data || {},
        delivery_data: item.delivery_data,
        delivered_at: item.delivered_at,
      }));

      const payment = order.payments?.[0] || null;

      const transformedOrder: OrderWithItems = {
        id: order.id,
        guest_token: order.guest_token,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        subtotal: order.subtotal,
        discount_amount: order.discount_amount || 0,
        points_used: order.points_used || 0,
        points_discount: order.points_discount || 0,
        total_amount: order.total_amount,
        status: order.status,
        paid_at: order.paid_at,
        delivered_at: order.delivered_at,
        created_at: order.created_at,
        items: orderItems,
        payment: payment ? {
          id: payment.id,
          tokopay_trx_id: payment.tokopay_trx_id,
          ref_id: payment.ref_id,
          amount: payment.amount,
          qr_link: payment.qr_link,
          pay_url: payment.pay_url,
          status: payment.status,
          expires_at: payment.expires_at,
          paid_at: payment.paid_at,
        } : null,
      };

      // Check if payment is expired
      let isExpired = false;
      if (payment?.expires_at) {
        isExpired = new Date(payment.expires_at) < new Date();
      }

      setState({
        loading: false,
        error: null,
        order: transformedOrder,
        payment: transformedOrder.payment,
        isPaid: order.status === 'PAID' || order.status === 'PROCESSING' || order.status === 'DELIVERED',
        isExpired,
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan',
      }));
    }
  }, [orderId, guestToken]);

  // Create payment (call edge function)
  const createPayment = useCallback(async () => {
    if (!orderId) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { order_id: orderId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Refresh order details to get updated payment
      await fetchOrderDetails();
    } catch (error) {
      console.error('Error creating payment:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Gagal membuat pembayaran',
      }));
    }
  }, [orderId, fetchOrderDetails]);

  // Poll for payment status
  useEffect(() => {
    if (!orderId) return;

    // Initial fetch
    fetchOrderDetails();

    // Set up polling every 5 seconds
    const pollInterval = setInterval(async () => {
      if (state.isPaid || state.isExpired) {
        clearInterval(pollInterval);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('check-payment-status', {
          body: { order_id: orderId },
        });

        if (error) throw error;

        if (data.order?.status === 'PAID') {
          // Payment confirmed, refresh full details
          await fetchOrderDetails();
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [orderId, state.isPaid, state.isExpired, fetchOrderDetails]);

  return {
    ...state,
    createPayment,
    refresh: fetchOrderDetails,
  };
}
