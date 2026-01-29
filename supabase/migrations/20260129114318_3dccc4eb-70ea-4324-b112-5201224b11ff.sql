-- Atomic stock reservation function to prevent race conditions
-- This function checks AND reserves stock in a single atomic transaction

CREATE OR REPLACE FUNCTION public.reserve_stock_for_order(
  p_product_id uuid,
  p_quantity integer,
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_type text;
  v_provider_id uuid;
  v_reserved_items uuid[];
  v_item_id uuid;
  v_remaining_qty integer;
  v_account_id uuid;
  v_account_slots integer;
  v_slots_to_reserve integer;
BEGIN
  -- Get product info
  SELECT product_type, provider_id INTO v_product_type, v_provider_id
  FROM products
  WHERE id = p_product_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Produk tidak ditemukan');
  END IF;
  
  v_reserved_items := ARRAY[]::uuid[];
  v_remaining_qty := p_quantity;
  
  IF v_product_type = 'STOCK' THEN
    -- For STOCK products: reserve specific items with row-level locking
    FOR v_item_id IN
      SELECT id FROM stock_items
      WHERE product_id = p_product_id
        AND status = 'AVAILABLE'
      ORDER BY created_at
      LIMIT p_quantity
      FOR UPDATE SKIP LOCKED  -- Skip already-locked rows to prevent deadlocks
    LOOP
      -- Mark as reserved
      UPDATE stock_items
      SET status = 'RESERVED',
          reserved_at = NOW(),
          order_id = p_order_id
      WHERE id = v_item_id
        AND status = 'AVAILABLE';
      
      IF FOUND THEN
        v_reserved_items := array_append(v_reserved_items, v_item_id);
        v_remaining_qty := v_remaining_qty - 1;
      END IF;
      
      EXIT WHEN v_remaining_qty <= 0;
    END LOOP;
    
    -- Check if we got enough items
    IF v_remaining_qty > 0 THEN
      -- Rollback: release any reserved items
      UPDATE stock_items
      SET status = 'AVAILABLE',
          reserved_at = NULL,
          order_id = NULL
      WHERE id = ANY(v_reserved_items);
      
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Stok tidak mencukupi. Tersedia: ' || (p_quantity - v_remaining_qty) || ', dibutuhkan: ' || p_quantity
      );
    END IF;
    
    RETURN jsonb_build_object(
      'success', true,
      'reserved_count', array_length(v_reserved_items, 1),
      'reserved_items', v_reserved_items
    );
    
  ELSIF v_product_type = 'INVITE' THEN
    -- For INVITE products: reserve slots from provider accounts
    IF v_provider_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Provider tidak ditemukan');
    END IF;
    
    -- Try to reserve slots from active accounts with available capacity
    FOR v_account_id, v_account_slots IN
      SELECT id, GREATEST(0, COALESCE(max_daily_invites, 0) - COALESCE(current_daily_invites, 0))
      FROM provider_accounts
      WHERE provider_id = v_provider_id
        AND is_active = true
        AND COALESCE(max_daily_invites, 0) - COALESCE(current_daily_invites, 0) > 0
      ORDER BY current_daily_invites ASC  -- Prefer accounts with fewer used slots
      FOR UPDATE SKIP LOCKED
    LOOP
      v_slots_to_reserve := LEAST(v_account_slots, v_remaining_qty);
      
      -- Increment current_daily_invites to reserve slots
      UPDATE provider_accounts
      SET current_daily_invites = COALESCE(current_daily_invites, 0) + v_slots_to_reserve,
          last_invite_at = NOW()
      WHERE id = v_account_id;
      
      v_remaining_qty := v_remaining_qty - v_slots_to_reserve;
      
      EXIT WHEN v_remaining_qty <= 0;
    END LOOP;
    
    -- Check if we got enough slots
    IF v_remaining_qty > 0 THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Slot invite tidak mencukupi. Tersedia: ' || (p_quantity - v_remaining_qty) || ', dibutuhkan: ' || p_quantity
      );
    END IF;
    
    RETURN jsonb_build_object(
      'success', true,
      'reserved_count', p_quantity
    );
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Tipe produk tidak valid');
  END IF;
END;
$$;

-- Function to release reserved stock (e.g., when payment expires or order cancelled)
CREATE OR REPLACE FUNCTION public.release_stock_reservation(
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_released_count integer := 0;
BEGIN
  -- Release STOCK items
  UPDATE stock_items
  SET status = 'AVAILABLE',
      reserved_at = NULL,
      order_id = NULL
  WHERE order_id = p_order_id
    AND status = 'RESERVED';
  
  GET DIAGNOSTICS v_released_count = ROW_COUNT;
  
  -- Note: INVITE slots are harder to release since we don't track per-order
  -- In production, you might want a separate reservation table for INVITE
  
  RETURN jsonb_build_object(
    'success', true,
    'released_count', v_released_count
  );
END;
$$;

-- Grant permissions
REVOKE ALL ON FUNCTION public.reserve_stock_for_order(uuid, integer, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_stock_for_order(uuid, integer, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.reserve_stock_for_order(uuid, integer, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.release_stock_reservation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_stock_reservation(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.release_stock_reservation(uuid) TO authenticated;