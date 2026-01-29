-- Expose aggregated remaining slots for INVITE products without revealing provider account details
-- (client-side cannot read provider_accounts due to RLS)

CREATE OR REPLACE FUNCTION public.get_provider_remaining_slots(p_provider_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    SUM(GREATEST(0, COALESCE(max_daily_invites, 0) - COALESCE(current_daily_invites, 0))),
    0
  )::int
  FROM public.provider_accounts
  WHERE provider_id = p_provider_id
    AND COALESCE(is_active, false) = true;
$$;

REVOKE ALL ON FUNCTION public.get_provider_remaining_slots(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_provider_remaining_slots(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_provider_remaining_slots(uuid) TO authenticated;