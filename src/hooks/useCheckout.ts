import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ProductWithCategory, CheckoutFormData, CouponValidation } from '@/types/database';

export function useCheckout(product: ProductWithCategory | null) {
  const [loading, setLoading] = useState(false);
  const [couponValidation, setCouponValidation] = useState<CouponValidation | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateCoupon = async (code: string, subtotal: number) => {
    if (!code.trim()) {
      setCouponValidation(null);
      return null;
    }

    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !coupon) {
        const validation: CouponValidation = { valid: false, message: 'Kupon tidak valid' };
        setCouponValidation(validation);
        return validation;
      }

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        const validation: CouponValidation = { valid: false, message: 'Kupon sudah kadaluarsa' };
        setCouponValidation(validation);
        return validation;
      }

      // Check start date
      if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
        const validation: CouponValidation = { valid: false, message: 'Kupon belum aktif' };
        setCouponValidation(validation);
        return validation;
      }

      // Check usage limit
      if (coupon.usage_limit && (coupon.usage_count || 0) >= coupon.usage_limit) {
        const validation: CouponValidation = { valid: false, message: 'Kupon sudah mencapai batas penggunaan' };
        setCouponValidation(validation);
        return validation;
      }

      // Check minimum purchase
      if (coupon.min_purchase && subtotal < coupon.min_purchase) {
        const validation: CouponValidation = { 
          valid: false, 
          message: `Minimum pembelian Rp ${coupon.min_purchase.toLocaleString('id-ID')}` 
        };
        setCouponValidation(validation);
        return validation;
      }

      // Check product restriction
      if (coupon.product_ids && coupon.product_ids.length > 0 && product) {
        if (!coupon.product_ids.includes(product.id)) {
          const validation: CouponValidation = { valid: false, message: 'Kupon tidak berlaku untuk produk ini' };
          setCouponValidation(validation);
          return validation;
        }
      }

      // Calculate discount
      let calculatedDiscount = 0;
      if (coupon.discount_type === 'PERCENTAGE') {
        calculatedDiscount = (subtotal * coupon.discount_value) / 100;
        if (coupon.max_discount && calculatedDiscount > coupon.max_discount) {
          calculatedDiscount = coupon.max_discount;
        }
      } else {
        calculatedDiscount = coupon.discount_value;
      }

      const validation: CouponValidation = {
        valid: true,
        message: `Kupon berhasil! Diskon Rp ${calculatedDiscount.toLocaleString('id-ID')}`,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        calculated_discount: calculatedDiscount,
      };
      setCouponValidation(validation);
      return validation;
    } catch (error) {
      console.error('Error validating coupon:', error);
      const validation: CouponValidation = { valid: false, message: 'Gagal memvalidasi kupon' };
      setCouponValidation(validation);
      return validation;
    }
  };

  const createOrder = async (formData: CheckoutFormData, userId?: string) => {
    if (!product) {
      toast({
        title: 'Error',
        description: 'Produk tidak ditemukan',
        variant: 'destructive',
      });
      return null;
    }

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

      const subtotal = product.retail_price * formData.quantity;
      const discountAmount = couponValidation?.calculated_discount || 0;
      const pointsDiscount = formData.points_to_use ? formData.points_to_use : 0;
      const totalAmount = Math.max(0, subtotal - discountAmount - pointsDiscount);

      // Generate guest token if not logged in
      const guestToken = !userId 
        ? `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
        : null;

      // Get coupon ID if valid
      let couponId = null;
      if (formData.coupon_code && couponValidation?.valid) {
        const { data: coupon } = await supabase
          .from('coupons')
          .select('id')
          .eq('code', formData.coupon_code.toUpperCase())
          .single();
        couponId = coupon?.id;
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId || null,
          guest_token: guestToken,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          subtotal,
          discount_amount: discountAmount,
          points_used: formData.points_to_use || 0,
          points_discount: pointsDiscount,
          total_amount: totalAmount,
          coupon_id: couponId,
          status: 'AWAITING_PAYMENT',
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error('Gagal membuat pesanan');
      }

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: product.id,
          quantity: formData.quantity,
          unit_price: product.retail_price,
          total_price: subtotal,
          input_data: formData.input_data || {},
        });

      if (itemError) {
        console.error('Order item creation error:', itemError);
        throw new Error('Gagal membuat item pesanan');
      }

      // Update coupon usage if used
      if (couponId) {
        // Increment usage count directly
        await supabase
          .from('coupons')
          .update({ usage_count: (await supabase.from('coupons').select('usage_count').eq('id', couponId).single()).data?.usage_count ?? 0 + 1 })
          .eq('id', couponId);
      }

      toast({
        title: 'Pesanan Dibuat!',
        description: 'Silakan lanjutkan ke pembayaran',
      });

      // Navigate to invoice page
      if (guestToken) {
        navigate(`/invoice/${order.id}?token=${guestToken}`);
      } else {
        navigate(`/invoice/${order.id}`);
      }

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
    couponValidation,
    validateCoupon,
    createOrder,
  };
}
