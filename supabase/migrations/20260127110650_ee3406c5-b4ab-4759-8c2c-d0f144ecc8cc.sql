-- =============================================
-- RUANGPREMIUM DATABASE SCHEMA
-- Phase 1: Foundation & Katalog (Fixed Order)
-- =============================================

-- 1. ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('member', 'reseller', 'admin');
CREATE TYPE public.product_type AS ENUM ('STOCK', 'INVITE');
CREATE TYPE public.order_status AS ENUM ('AWAITING_PAYMENT', 'PAID', 'PROCESSING', 'DELIVERED', 'FAILED', 'CANCELLED');
CREATE TYPE public.payment_status AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'FAILED');
CREATE TYPE public.fulfillment_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE public.stock_status AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD');
CREATE TYPE public.discount_type AS ENUM ('PERCENTAGE', 'FIXED');
CREATE TYPE public.point_transaction_type AS ENUM ('EARNED', 'REDEEMED', 'ADJUSTMENT');
CREATE TYPE public.wallet_transaction_type AS ENUM ('TOPUP', 'PURCHASE', 'CASHBACK', 'ADJUSTMENT');

-- 2. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. USER ROLES TABLE (Separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 4. HELPER FUNCTIONS (Security Definer) - After tables exist
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_reseller_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('reseller', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 5. PRODUCT CATEGORIES TABLE
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PROVIDERS TABLE (ChatGPT, Canva, etc.)
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PRODUCTS TABLE
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  product_type product_type NOT NULL DEFAULT 'STOCK',
  retail_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  reseller_price DECIMAL(12,2),
  duration_days INT,
  benefits JSONB DEFAULT '[]',
  input_schema JSONB DEFAULT '[]',
  require_read_description BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  total_sold INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. STOCK ITEMS TABLE (For STOCK products)
CREATE TABLE public.stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  secret_data TEXT NOT NULL,
  status stock_status NOT NULL DEFAULT 'AVAILABLE',
  order_id UUID,
  reserved_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. PROVIDER ACCOUNTS TABLE (Pool for INVITE)
CREATE TABLE public.provider_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  credentials JSONB NOT NULL DEFAULT '{}',
  max_daily_invites INT DEFAULT 5,
  current_daily_invites INT DEFAULT 0,
  last_invite_at TIMESTAMPTZ,
  cooldown_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. COUPONS TABLE
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type discount_type NOT NULL DEFAULT 'PERCENTAGE',
  discount_value DECIMAL(12,2) NOT NULL,
  min_purchase DECIMAL(12,2) DEFAULT 0,
  max_discount DECIMAL(12,2),
  usage_limit INT,
  usage_count INT DEFAULT 0,
  per_user_limit INT DEFAULT 1,
  product_ids UUID[] DEFAULT '{}',
  role_restriction app_role[],
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ORDERS TABLE
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_token TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  points_used INT DEFAULT 0,
  points_discount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'AWAITING_PAYMENT',
  paid_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  is_reseller_order BOOLEAN DEFAULT FALSE,
  reseller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ORDER ITEMS TABLE
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  input_data JSONB DEFAULT '{}',
  delivery_data JSONB,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. PAYMENTS TABLE
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  tokopay_trx_id TEXT,
  ref_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  fee DECIMAL(12,2) DEFAULT 0,
  net_amount DECIMAL(12,2) DEFAULT 0,
  qr_link TEXT,
  pay_url TEXT,
  status payment_status NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  webhook_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. FULFILLMENT JOBS TABLE
CREATE TABLE public.fulfillment_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE NOT NULL,
  provider_account_id UUID REFERENCES public.provider_accounts(id) ON DELETE SET NULL,
  job_type product_type NOT NULL,
  status fulfillment_status NOT NULL DEFAULT 'PENDING',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_error TEXT,
  result JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. POINTS TRANSACTIONS TABLE
CREATE TABLE public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  amount INT NOT NULL,
  balance_after INT NOT NULL DEFAULT 0,
  transaction_type point_transaction_type NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. USER POINTS (Current Balance)
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance INT NOT NULL DEFAULT 0,
  total_earned INT NOT NULL DEFAULT 0,
  total_redeemed INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. RESELLER WALLETS TABLE
CREATE TABLE public.reseller_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_topup DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_cashback DECIMAL(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. WALLET TRANSACTIONS TABLE
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL DEFAULT 0,
  transaction_type wallet_transaction_type NOT NULL,
  description TEXT,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. RESELLER API KEYS TABLE
CREATE TABLE public.reseller_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  rate_limit INT DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. SYSTEM SETTINGS TABLE
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. WEBHOOK LOGS TABLE
CREATE TABLE public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  event_type TEXT,
  payload JSONB NOT NULL,
  signature TEXT,
  is_valid BOOLEAN,
  processed BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_accounts_updated_at BEFORE UPDATE ON public.provider_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fulfillment_jobs_updated_at BEFORE UPDATE ON public.fulfillment_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  INSERT INTO public.user_points (user_id, balance)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillment_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- USER ROLES POLICIES (Admin only)
CREATE POLICY "Admin can manage roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- PRODUCT CATEGORIES POLICIES (Public read)
CREATE POLICY "Anyone can view active categories" ON public.product_categories
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admin can manage categories" ON public.product_categories
  FOR ALL USING (public.is_admin());

-- PROVIDERS POLICIES (Admin only)
CREATE POLICY "Admin can manage providers" ON public.providers
  FOR ALL USING (public.is_admin());

-- PRODUCTS POLICIES (Public read active)
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admin can manage products" ON public.products
  FOR ALL USING (public.is_admin());

-- STOCK ITEMS POLICIES (Admin only)
CREATE POLICY "Admin can manage stock" ON public.stock_items
  FOR ALL USING (public.is_admin());

-- PROVIDER ACCOUNTS POLICIES (Admin only)
CREATE POLICY "Admin can manage provider accounts" ON public.provider_accounts
  FOR ALL USING (public.is_admin());

-- COUPONS POLICIES
CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (
    (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()) AND (starts_at IS NULL OR starts_at <= NOW()))
    OR public.is_admin()
  );

CREATE POLICY "Admin can manage coupons" ON public.coupons
  FOR ALL USING (public.is_admin());

-- ORDERS POLICIES
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin() OR public.is_reseller_or_admin());

CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admin can manage orders" ON public.orders
  FOR ALL USING (public.is_admin());

-- ORDER ITEMS POLICIES
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Users can create order items" ON public.order_items
  FOR INSERT WITH CHECK (TRUE);

-- PAYMENTS POLICIES
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Admin can manage payments" ON public.payments
  FOR ALL USING (public.is_admin());

-- FULFILLMENT JOBS POLICIES (Admin only)
CREATE POLICY "Admin can manage fulfillment jobs" ON public.fulfillment_jobs
  FOR ALL USING (public.is_admin());

-- POINTS TRANSACTIONS POLICIES
CREATE POLICY "Users can view own points" ON public.points_transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- USER POINTS POLICIES
CREATE POLICY "Users can view own points balance" ON public.user_points
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- RESELLER WALLETS POLICIES
CREATE POLICY "Resellers can view own wallet" ON public.reseller_wallets
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- WALLET TRANSACTIONS POLICIES
CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- RESELLER API KEYS POLICIES
CREATE POLICY "Resellers can manage own API keys" ON public.reseller_api_keys
  FOR ALL USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'reseller'));

CREATE POLICY "Admin can view all API keys" ON public.reseller_api_keys
  FOR SELECT USING (public.is_admin());

-- SYSTEM SETTINGS POLICIES (Admin only)
CREATE POLICY "Admin can manage settings" ON public.system_settings
  FOR ALL USING (public.is_admin());

-- WEBHOOK LOGS POLICIES (Admin only)
CREATE POLICY "Admin can view webhook logs" ON public.webhook_logs
  FOR ALL USING (public.is_admin());

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_stock_items_product ON public.stock_items(product_id);
CREATE INDEX idx_stock_items_status ON public.stock_items(status);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_guest_token ON public.orders(guest_token);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_payments_ref ON public.payments(ref_id);
CREATE INDEX idx_fulfillment_jobs_status ON public.fulfillment_jobs(status);
CREATE INDEX idx_coupons_code ON public.coupons(code);

-- =============================================
-- INSERT DEFAULT SYSTEM SETTINGS
-- =============================================

INSERT INTO public.system_settings (key, value, description) VALUES
  ('points_earn_rate', '{"rate": 1, "per_amount": 100}', 'Earn 1 point per Rp 100'),
  ('points_redeem_value', '{"value": 1}', '1 point = Rp 1'),
  ('points_max_redeem_percent', '{"percent": 30}', 'Max 30% of order can be paid with points'),
  ('reseller_cashback_rate', '{"percent": 5}', '5% cashback for reseller'),
  ('min_topup_amount', '{"amount": 50000}', 'Minimum topup Rp 50,000'),
  ('tokopay_channel', '{"code": "QRIS"}', 'Default payment channel')
ON CONFLICT (key) DO NOTHING;