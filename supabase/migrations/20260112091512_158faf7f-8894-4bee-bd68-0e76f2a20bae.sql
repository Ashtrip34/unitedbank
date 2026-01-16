-- Create reversal_requests table for tracking payment reversals
CREATE TABLE public.reversal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id),
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.accounts(id),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reversal_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own reversal requests
CREATE POLICY "Users can view own reversal requests" 
ON public.reversal_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can insert reversal requests
CREATE POLICY "Users can insert reversal requests" 
ON public.reversal_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reversal requests
CREATE POLICY "Users can update own reversal requests" 
ON public.reversal_requests 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create a table to track privileged users (for deposit and reversal permissions)
CREATE TABLE public.privileged_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  can_deposit BOOLEAN NOT NULL DEFAULT true,
  can_request_reversal BOOLEAN NOT NULL DEFAULT true,
  instant_reversal BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on privileged_users
ALTER TABLE public.privileged_users ENABLE ROW LEVEL SECURITY;

-- Anyone can read privileged users to check permissions
CREATE POLICY "Privileged users are publicly readable" 
ON public.privileged_users 
FOR SELECT 
USING (true);

-- Insert the two privileged emails
INSERT INTO public.privileged_users (email, can_deposit, can_request_reversal, instant_reversal)
VALUES 
  ('ashamudaniel4161@gmail.com', true, true, true),
  ('bluephestechnology@gmail.com', true, true, true);

-- Create a function to process instant reversals
CREATE OR REPLACE FUNCTION public.process_reversal(
  p_transaction_id UUID,
  p_user_id UUID
) RETURNS JSON AS $$
DECLARE
  v_transaction RECORD;
  v_account RECORD;
  v_user_email TEXT;
  v_is_privileged BOOLEAN;
  v_new_balance NUMERIC;
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
  
  -- Get the account
  SELECT * INTO v_account FROM public.accounts WHERE id = v_transaction.account_id;
  
  IF v_account IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Account not found');
  END IF;
  
  -- Calculate new balance (add back the negative amount)
  v_new_balance := v_account.balance + ABS(v_transaction.amount);
  
  -- Update account balance
  UPDATE public.accounts SET balance = v_new_balance WHERE id = v_account.id;
  
  -- Create reversal transaction
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.process_reversal TO authenticated;