// Database types for RuangPremium
// These complement the auto-generated Supabase types

export type ProductType = 'STOCK' | 'INVITE';
export type OrderStatus = 'AWAITING_PAYMENT' | 'PAID' | 'PROCESSING' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED';
export type FulfillmentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type StockStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';
export type DiscountType = 'PERCENTAGE' | 'FIXED';
export type PointTransactionType = 'EARNED' | 'REDEEMED' | 'ADJUSTMENT';
export type WalletTransactionType = 'TOPUP' | 'PURCHASE' | 'CASHBACK' | 'ADJUSTMENT';
export type AppRole = 'member' | 'reseller' | 'admin';

// Product with category info
export interface ProductWithCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  product_type: ProductType;
  retail_price: number;
  reseller_price: number | null;
  duration_days: number | null;
  benefits: string[];
  input_schema: InputField[];
  require_read_description: boolean;
  is_featured: boolean;
  is_active: boolean;
  total_sold: number;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
  provider: {
    id: string;
    name: string;
    slug: string;
  } | null;
  stock_count?: number;
}

// Input field schema for INVITE products
export interface InputField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select';
  placeholder?: string;
  required: boolean;
  options?: string[];
}

// Order with items
export interface OrderWithItems {
  id: string;
  guest_token: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  subtotal: number;
  discount_amount: number;
  points_used: number;
  points_discount: number;
  total_amount: number;
  status: OrderStatus;
  paid_at: string | null;
  delivered_at: string | null;
  created_at: string;
  items: OrderItem[];
  payment: PaymentInfo | null;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  input_data: Record<string, string>;
  delivery_data: Record<string, unknown> | null;
  delivered_at: string | null;
}

export interface PaymentInfo {
  id: string;
  tokopay_trx_id: string | null;
  ref_id: string;
  amount: number;
  qr_link: string | null;
  pay_url: string | null;
  status: PaymentStatus;
  expires_at: string | null;
  paid_at: string | null;
}

// Coupon validation result
export interface CouponValidation {
  valid: boolean;
  message: string;
  discount_type?: DiscountType;
  discount_value?: number;
  calculated_discount?: number;
}

// Checkout form data
export interface CheckoutFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  product_id: string;
  quantity: number;
  input_data: Record<string, string>;
  coupon_code?: string;
  points_to_use?: number;
}

// User profile with role
export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: AppRole;
  points_balance: number;
  wallet_balance?: number;
}

// Category with product count
export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  product_count: number;
}

// Provider info
export interface Provider {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

// System settings
export interface SystemSettings {
  points_earn_rate: { rate: number; per_amount: number };
  points_redeem_value: { value: number };
  points_max_redeem_percent: { percent: number };
  reseller_cashback_rate: { percent: number };
  min_topup_amount: { amount: number };
  tokopay_channel: { code: string };
}
