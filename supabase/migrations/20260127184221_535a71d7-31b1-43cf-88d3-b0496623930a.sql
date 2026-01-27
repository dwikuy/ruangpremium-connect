-- Add webhook_url column to reseller_api_keys
ALTER TABLE public.reseller_api_keys 
ADD COLUMN webhook_url text,
ADD COLUMN webhook_secret text,
ADD COLUMN webhook_enabled boolean DEFAULT false;

-- Create table to log webhook deliveries
CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES public.reseller_api_keys(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  attempts integer DEFAULT 1,
  delivered_at timestamp with time zone,
  failed_at timestamp with time zone,
  error text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on webhook_deliveries
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS: Resellers can view own webhook deliveries
CREATE POLICY "Resellers can view own webhook deliveries"
ON public.webhook_deliveries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM reseller_api_keys ak 
    WHERE ak.id = webhook_deliveries.api_key_id 
    AND ak.user_id = auth.uid()
  )
);

-- RLS: Admin can manage all webhook deliveries
CREATE POLICY "Admin can manage webhook deliveries"
ON public.webhook_deliveries
FOR ALL
USING (is_admin());