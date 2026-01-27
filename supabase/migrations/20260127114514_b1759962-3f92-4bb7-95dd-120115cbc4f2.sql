-- Function to award points after order delivery
CREATE OR REPLACE FUNCTION public.award_points_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_points_to_award integer;
  v_earn_rate numeric;
  v_per_amount numeric;
  v_current_balance integer;
  v_settings_earn jsonb;
BEGIN
  -- Only process when status changes to DELIVERED
  IF NEW.status = 'DELIVERED' AND (OLD.status IS NULL OR OLD.status != 'DELIVERED') THEN
    -- Get user_id from the order
    v_user_id := NEW.user_id;
    
    -- Only award points to registered users
    IF v_user_id IS NOT NULL THEN
      -- Get points earn rate from system settings
      SELECT value INTO v_settings_earn
      FROM system_settings
      WHERE key = 'points_earn_rate';
      
      -- Default: 1000 points per 100000 (1% rate)
      v_earn_rate := COALESCE((v_settings_earn->>'rate')::numeric, 1000);
      v_per_amount := COALESCE((v_settings_earn->>'per_amount')::numeric, 100000);
      
      -- Calculate points: (total_amount / per_amount) * rate
      v_points_to_award := FLOOR((NEW.total_amount / v_per_amount) * v_earn_rate)::integer;
      
      IF v_points_to_award > 0 THEN
        -- Get current balance
        SELECT balance INTO v_current_balance
        FROM user_points
        WHERE user_id = v_user_id;
        
        IF NOT FOUND THEN
          v_current_balance := 0;
          -- Create user_points record if not exists
          INSERT INTO user_points (user_id, balance, total_earned, total_redeemed)
          VALUES (v_user_id, 0, 0, 0);
        END IF;
        
        -- Update user_points balance
        UPDATE user_points
        SET 
          balance = balance + v_points_to_award,
          total_earned = total_earned + v_points_to_award,
          updated_at = NOW()
        WHERE user_id = v_user_id;
        
        -- Create points transaction record
        INSERT INTO points_transactions (
          user_id,
          order_id,
          transaction_type,
          amount,
          balance_after,
          description
        ) VALUES (
          v_user_id,
          NEW.id,
          'EARNED',
          v_points_to_award,
          v_current_balance + v_points_to_award,
          'Poin dari pesanan #' || LEFT(NEW.id::text, 8)
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-awarding points
DROP TRIGGER IF EXISTS trigger_award_points_on_delivery ON orders;
CREATE TRIGGER trigger_award_points_on_delivery
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION award_points_on_delivery();

-- Function to redeem points (called during checkout)
CREATE OR REPLACE FUNCTION public.redeem_points(
  p_user_id uuid,
  p_order_id uuid,
  p_points_to_redeem integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance integer;
  v_redeem_value numeric;
  v_settings_redeem jsonb;
  v_discount_amount numeric;
BEGIN
  -- Validate input
  IF p_points_to_redeem <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Points must be greater than 0');
  END IF;
  
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM user_points
  WHERE user_id = p_user_id;
  
  IF NOT FOUND OR v_current_balance < p_points_to_redeem THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient points balance');
  END IF;
  
  -- Get redeem value from system settings (default: 1 point = Rp 1)
  SELECT value INTO v_settings_redeem
  FROM system_settings
  WHERE key = 'points_redeem_value';
  
  v_redeem_value := COALESCE((v_settings_redeem->>'value')::numeric, 1);
  v_discount_amount := p_points_to_redeem * v_redeem_value;
  
  -- Deduct points from balance
  UPDATE user_points
  SET 
    balance = balance - p_points_to_redeem,
    total_redeemed = total_redeemed + p_points_to_redeem,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Create points transaction record
  INSERT INTO points_transactions (
    user_id,
    order_id,
    transaction_type,
    amount,
    balance_after,
    description
  ) VALUES (
    p_user_id,
    p_order_id,
    'REDEEMED',
    -p_points_to_redeem,
    v_current_balance - p_points_to_redeem,
    'Penukaran poin untuk pesanan #' || LEFT(p_order_id::text, 8)
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'points_redeemed', p_points_to_redeem,
    'discount_amount', v_discount_amount,
    'new_balance', v_current_balance - p_points_to_redeem
  );
END;
$$;

-- Function to validate points redemption before checkout
CREATE OR REPLACE FUNCTION public.validate_points_redemption(
  p_user_id uuid,
  p_points_to_redeem integer,
  p_subtotal numeric
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance integer;
  v_max_redeem_percent numeric;
  v_max_points integer;
  v_settings_max jsonb;
  v_redeem_value numeric;
  v_settings_redeem jsonb;
BEGIN
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM user_points
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    v_current_balance := 0;
  END IF;
  
  -- Get max redeem percentage from settings (default: 30%)
  SELECT value INTO v_settings_max
  FROM system_settings
  WHERE key = 'points_max_redeem_percent';
  
  v_max_redeem_percent := COALESCE((v_settings_max->>'percent')::numeric, 30);
  
  -- Get redeem value (default: 1 point = Rp 1)
  SELECT value INTO v_settings_redeem
  FROM system_settings
  WHERE key = 'points_redeem_value';
  
  v_redeem_value := COALESCE((v_settings_redeem->>'value')::numeric, 1);
  
  -- Calculate max points that can be redeemed based on subtotal
  v_max_points := FLOOR((p_subtotal * v_max_redeem_percent / 100) / v_redeem_value)::integer;
  
  -- Cap by available balance
  IF v_max_points > v_current_balance THEN
    v_max_points := v_current_balance;
  END IF;
  
  -- Validate requested points
  IF p_points_to_redeem > v_current_balance THEN
    RETURN jsonb_build_object(
      'valid', false, 
      'error', 'Saldo poin tidak mencukupi',
      'available_balance', v_current_balance,
      'max_redeemable', v_max_points
    );
  END IF;
  
  IF p_points_to_redeem > v_max_points THEN
    RETURN jsonb_build_object(
      'valid', false, 
      'error', 'Maksimal penukaran ' || v_max_redeem_percent || '% dari subtotal',
      'available_balance', v_current_balance,
      'max_redeemable', v_max_points
    );
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'points_to_redeem', p_points_to_redeem,
    'discount_amount', p_points_to_redeem * v_redeem_value,
    'available_balance', v_current_balance,
    'max_redeemable', v_max_points
  );
END;
$$;

-- Insert default system settings for points if not exists
INSERT INTO system_settings (key, value, description)
VALUES 
  ('points_earn_rate', '{"rate": 1000, "per_amount": 100000}', 'Points earned per purchase amount (1000 pts per Rp100k = 1%)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description)
VALUES 
  ('points_redeem_value', '{"value": 1}', 'Value of 1 point in Rupiah (1 point = Rp 1)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description)
VALUES 
  ('points_max_redeem_percent', '{"percent": 30}', 'Maximum percentage of subtotal that can be paid with points')
ON CONFLICT (key) DO NOTHING;