-- Drop and recreate the INSERT policy for orders to allow guest checkout properly
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  -- Guest checkout: user_id is null
  (user_id IS NULL)
  OR 
  -- Logged in user: user_id matches auth.uid()
  (user_id = auth.uid())
  OR 
  -- Admin or Reseller can create orders for anyone
  is_reseller_or_admin()
);

-- Also need to allow guest users to view their orders by guest_token
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

CREATE POLICY "Users can view own orders" 
ON public.orders 
FOR SELECT 
USING (
  -- User can see their own orders
  (auth.uid() = user_id)
  OR 
  -- Guest can see order with their guest_token (handled in application)
  (user_id IS NULL AND guest_token IS NOT NULL)
  OR 
  -- Admin can see all
  is_admin()
  OR
  -- Reseller can see reseller orders
  is_reseller_or_admin()
);

-- Allow guests to view their order items too
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;

CREATE POLICY "Users can view own order items" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id 
    AND (
      o.user_id = auth.uid() 
      OR (o.user_id IS NULL AND o.guest_token IS NOT NULL)
      OR is_admin()
    )
  )
);