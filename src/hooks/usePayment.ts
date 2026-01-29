import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Prevent repeated trigger calls while the invoice page is open
  const fulfillmentTriggeredRef = useRef(false);

  // Fetch order and payment details
  const fetchOrderDetails = useCallback(async (forceRefresh = false) => {
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

      const orderStatus = order.status as string;
      const paymentStatus = payment?.status as string | undefined;
      
      // isPaid is true when order status indicates payment confirmed OR payment record says PAID
      const isPaymentConfirmed =
        orderStatus === 'PAID' || 
        orderStatus === 'PROCESSING' || 
        orderStatus === 'DELIVERED' ||
        paymentStatus === 'PAID';
      
      const isFulfillmentDone =
        orderStatus === 'DELIVERED' || orderStatus === 'FAILED' || orderStatus === 'CANCELLED';

      // If payment confirmed but fulfillment not finished, try to trigger fulfillment once
      if (isPaymentConfirmed && !isFulfillmentDone && !fulfillmentTriggeredRef.current) {
        fulfillmentTriggeredRef.current = true;
        try {
          await supabase.functions.invoke('trigger-fulfillment', {
            body: { order_id: orderId },
          });
        } catch (e) {
          // Don't block UI; job can be triggered later by admin or retry
          console.warn('Failed to trigger fulfillment from invoice:', e);
        }
      }

      // NOTE: In some setups, reading `payments` from the client can be blocked by access rules,
      // so `transformedOrder.payment` may be null even though a payment exists.
      // Preserve any existing payment already obtained from backend function responses.
      setState((prev) => {
        const mergedPayment = transformedOrder.payment ?? prev.payment;
        
        // Double-check isPaid from previous state too (in case webhook updated faster)
        const wasPreviouslyPaid = prev.isPaid;
        
        return {
          loading: false,
          error: null,
          order: {
            ...transformedOrder,
            payment: mergedPayment,
          },
          payment: mergedPayment,
          // isPaid means payment is confirmed (success page), not necessarily delivered
          // Keep it true if it was already true (prevents flickering back to QR)
          isPaid: wasPreviouslyPaid || isPaymentConfirmed,
          isExpired,
        };
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

      // Update UI immediately with payment returned by backend function
      // so QR can render even if client-side `payments` read is restricted.
      if (data.payment) {
        const p = data.payment as any;
        const paymentFromFn: PaymentInfo = {
          id: p.id,
          tokopay_trx_id: p.tokopay_trx_id,
          ref_id: p.ref_id,
          amount: p.amount,
          qr_link: p.qr_link,
          pay_url: p.pay_url,
          status: p.status,
          expires_at: p.expires_at,
          paid_at: p.paid_at,
        };

        setState((prev) => {
          const isExpiredLocal = paymentFromFn.expires_at
            ? new Date(paymentFromFn.expires_at) < new Date()
            : prev.isExpired;

          return {
            ...prev,
            loading: false,
            error: null,
            payment: paymentFromFn,
            order: prev.order ? { ...prev.order, payment: paymentFromFn } : prev.order,
            isExpired: isExpiredLocal,
          };
        });
      }

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
      const status = state.order?.status as string | undefined;
      const isFulfillmentDone =
        status === 'DELIVERED' || status === 'FAILED' || status === 'CANCELLED';

      // Stop polling only when fulfillment is done (or payment expired)
      if (isFulfillmentDone || state.isExpired) {
        clearInterval(pollInterval);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('check-payment-status', {
          body: { order_id: orderId },
        });

        if (error) throw error;

        const latestStatus = data.order?.status as string | undefined;

        // Merge latest payment info from backend (works even if client-side payments read is restricted)
        if (data.payment) {
          const p = data.payment as any;
          const paymentFromFn: PaymentInfo = {
            id: p.id,
            tokopay_trx_id: p.tokopay_trx_id ?? null,
            ref_id: p.ref_id,
            amount: p.amount,
            qr_link: p.qr_link,
            pay_url: p.pay_url,
            status: p.status,
            expires_at: p.expires_at,
            paid_at: p.paid_at,
          };

          setState((prev) => {
            const isExpiredLocal = paymentFromFn.expires_at
              ? new Date(paymentFromFn.expires_at) < new Date()
              : prev.isExpired;
            const isPaidLocal =
              latestStatus === 'PAID' || latestStatus === 'PROCESSING' || latestStatus === 'DELIVERED';
            return {
              ...prev,
              payment: paymentFromFn,
              order: prev.order ? { ...prev.order, payment: paymentFromFn, status: (latestStatus as any) ?? prev.order.status } : prev.order,
              isExpired: isExpiredLocal,
              isPaid: isPaidLocal,
            };
          });
        }

        // If payment confirmed, trigger fulfillment once (especially useful for manual/edge cases)
        if ((latestStatus === 'PAID' || latestStatus === 'PROCESSING') && !fulfillmentTriggeredRef.current) {
          fulfillmentTriggeredRef.current = true;
          try {
            await supabase.functions.invoke('trigger-fulfillment', {
              body: { order_id: orderId },
            });
          } catch (e) {
            console.warn('Failed to trigger fulfillment from payment poll:', e);
          }
        }

        // Always refresh full details to reflect fulfillment progress
        await fetchOrderDetails();
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [orderId, state.order?.status, state.isExpired, fetchOrderDetails]);

  return {
    ...state,
    createPayment,
    refresh: fetchOrderDetails,
  };
}
