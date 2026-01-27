-- Allow admin to update reseller wallets
CREATE POLICY "Admin can manage wallets" 
ON public.reseller_wallets 
FOR ALL 
USING (is_admin());

-- Allow admin to insert wallet transactions
CREATE POLICY "Admin can manage wallet transactions" 
ON public.wallet_transactions 
FOR ALL 
USING (is_admin());