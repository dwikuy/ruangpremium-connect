-- Fix overly permissive RLS policies for orders and order_items

-- Drop the permissive policies
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;

-- Create more restrictive insert policies
-- Orders: Allow guests (no auth) and authenticated users to create orders
-- But they must set their own user_id if authenticated
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT WITH CHECK (
    -- Either guest order (no user_id) or authenticated user creating own order
    user_id IS NULL OR user_id = auth.uid() OR public.is_reseller_or_admin()
  );

-- Order items: Only allow insert if the order belongs to the user or is a guest order
CREATE POLICY "Anyone can create order items for own orders" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id 
      AND (o.user_id IS NULL OR o.user_id = auth.uid() OR public.is_admin())
    )
  );