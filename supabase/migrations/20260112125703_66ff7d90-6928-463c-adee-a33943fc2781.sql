-- Create admin IP whitelist table
CREATE TABLE public.admin_ip_whitelist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.admin_ip_whitelist ENABLE ROW LEVEL SECURITY;

-- Only super_admins can manage IP whitelist
CREATE POLICY "Super admins can view IP whitelist"
ON public.admin_ip_whitelist
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert IP whitelist"
ON public.admin_ip_whitelist
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update IP whitelist"
ON public.admin_ip_whitelist
FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete IP whitelist"
ON public.admin_ip_whitelist
FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Add some default IPs (these can be updated by admins)
-- Note: 0.0.0.0/0 is a temporary allow-all for initial setup
INSERT INTO public.admin_ip_whitelist (ip_address, description)
VALUES ('0.0.0.0/0', 'Allow all (initial setup - update this)');

-- Update the process_reversal function to also deduct from recipient
CREATE OR REPLACE FUNCTION public.process_reversal(p_transaction_id uuid, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_transaction RECORD;
  v_account RECORD;
  v_recipient_account RECORD;
  v_user_email TEXT;
  v_is_privileged BOOLEAN;
  v_new_balance NUMERIC;
  v_recipient_new_balance NUMERIC;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
  
  -- Check if user is privileged for instant reversal
  SELECT EXISTS(
    SELECT 1 FROM public.privileged_users 
    WHERE email = v_user_email AND instant_reversal = true
  ) INTO v_is_privileged;
  
  IF NOT v_is_privileged THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized for instant reversal');
  END IF;
  
  -- Get the transaction
  SELECT * INTO v_transaction FROM public.transactions WHERE id = p_transaction_id AND user_id = p_user_id;
  
  IF v_transaction IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Transaction not found');
  END IF;
  
  -- Only allow reversal of transfers (negative amounts)
  IF v_transaction.amount >= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Can only reverse outgoing transfers');
  END IF;
  
  -- Get the sender's account
  SELECT * INTO v_account FROM public.accounts WHERE id = v_transaction.account_id;
  
  IF v_account IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Account not found');
  END IF;
  
  -- Calculate new balance for sender (credit back)
  v_new_balance := v_account.balance + ABS(v_transaction.amount);
  
  -- Update sender's account balance
  UPDATE public.accounts SET balance = v_new_balance WHERE id = v_account.id;
  
  -- Try to find and deduct from recipient's account (for internal transfers)
  IF v_transaction.recipient_account IS NOT NULL THEN
    SELECT * INTO v_recipient_account 
    FROM public.accounts 
    WHERE account_number = v_transaction.recipient_account;
    
    IF v_recipient_account IS NOT NULL AND v_recipient_account.balance >= ABS(v_transaction.amount) THEN
      -- Deduct from recipient's account
      v_recipient_new_balance := v_recipient_account.balance - ABS(v_transaction.amount);
      UPDATE public.accounts SET balance = v_recipient_new_balance WHERE id = v_recipient_account.id;
      
      -- Create a debit transaction for recipient
      INSERT INTO public.transactions (
        account_id, user_id, type, amount, description, status, category
      ) VALUES (
        v_recipient_account.id, 
        v_recipient_account.user_id, 
        'reversal_debit', 
        -ABS(v_transaction.amount), 
        'Payment reversed by sender',
        'completed',
        'reversal'
      );
    END IF;
  END IF;
  
  -- Create reversal transaction for sender
  INSERT INTO public.transactions (
    account_id, user_id, type, amount, description, status, category
  ) VALUES (
    v_account.id, 
    p_user_id, 
    'reversal', 
    ABS(v_transaction.amount), 
    'Reversal of: ' || COALESCE(v_transaction.description, 'Transfer'),
    'completed',
    'reversal'
  );
  
  -- Create reversal request record
  INSERT INTO public.reversal_requests (
    transaction_id, user_id, account_id, amount, status, processed_at
  ) VALUES (
    p_transaction_id, p_user_id, v_account.id, ABS(v_transaction.amount), 'completed', now()
  );
  
  RETURN json_build_object('success', true, 'message', 'Payment reversed successfully', 'new_balance', v_new_balance);
END;
$function$;