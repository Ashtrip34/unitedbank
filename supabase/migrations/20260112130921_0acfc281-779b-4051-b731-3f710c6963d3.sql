-- Update internal_transfer function to include 10% transaction fee and 2M limit
CREATE OR REPLACE FUNCTION public.internal_transfer(
  sender_user_id uuid,
  recipient_account_number text,
  transfer_amount numeric,
  transfer_description text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_account record;
  recipient_account record;
  recipient_profile record;
  new_sender_balance numeric;
  new_recipient_balance numeric;
  fee_amount numeric;
  net_amount numeric;
BEGIN
  -- Get sender account
  SELECT * INTO sender_account FROM public.accounts WHERE user_id = sender_user_id AND (is_sub_account IS NULL OR is_sub_account = false);
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Sender account not found');
  END IF;

  -- Get recipient account
  SELECT * INTO recipient_account FROM public.accounts WHERE account_number = recipient_account_number;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Recipient account not found');
  END IF;

  -- Prevent self-transfer
  IF sender_account.id = recipient_account.id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot transfer to your own account');
  END IF;

  -- Check sufficient balance
  IF sender_account.balance < transfer_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient funds');
  END IF;

  -- Check transfer limit (2 million)
  IF transfer_amount > 2000000 THEN
    RETURN json_build_object('success', false, 'error', 'Transfer limit is $2,000,000 per transaction');
  END IF;

  -- Get recipient profile for name
  SELECT * INTO recipient_profile FROM public.profiles WHERE user_id = recipient_account.user_id;

  -- Calculate 10% transaction fee
  fee_amount := transfer_amount * 0.10;
  net_amount := transfer_amount - fee_amount;

  -- Calculate new balances
  new_sender_balance := sender_account.balance - transfer_amount;
  new_recipient_balance := recipient_account.balance + net_amount;

  -- Update sender balance
  UPDATE public.accounts SET balance = new_sender_balance WHERE id = sender_account.id;

  -- Update recipient balance (receives 90% after fee)
  UPDATE public.accounts SET balance = new_recipient_balance WHERE id = recipient_account.id;

  -- Create sender transaction (debit full amount)
  INSERT INTO public.transactions (
    account_id, user_id, type, amount, description, 
    recipient_name, recipient_account, recipient_routing, recipient_bank, status
  ) VALUES (
    sender_account.id, sender_user_id, 'transfer', -transfer_amount,
    COALESCE(transfer_description, 'Internal transfer to ' || COALESCE(recipient_profile.full_name, 'United Bank user')),
    COALESCE(recipient_profile.full_name, 'United Bank User'),
    recipient_account_number, '021000021', 'United Bank', 'completed'
  );

  -- Create recipient transaction (credit net amount after 10% fee)
  INSERT INTO public.transactions (
    account_id, user_id, type, amount, description,
    recipient_name, recipient_account, recipient_routing, recipient_bank, status
  ) VALUES (
    recipient_account.id, recipient_account.user_id, 'deposit', net_amount,
    'Internal transfer received (10% fee deducted)',
    NULL, NULL, NULL, 'United Bank', 'completed'
  );

  RETURN json_build_object(
    'success', true, 
    'recipient_name', COALESCE(recipient_profile.full_name, 'United Bank User'),
    'message', 'Transfer completed successfully',
    'fee', fee_amount,
    'net_amount', net_amount
  );
END;
$$;

-- Update process_reversal to force debit from recipient even if balance is insufficient
CREATE OR REPLACE FUNCTION public.process_reversal(
  p_transaction_id uuid,
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction RECORD;
  v_account RECORD;
  v_recipient_account RECORD;
  v_user_email TEXT;
  v_is_privileged BOOLEAN;
  v_new_balance NUMERIC;
  v_recipient_new_balance NUMERIC;
  v_reversal_amount NUMERIC;
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
  
  -- Calculate reversal amount
  v_reversal_amount := ABS(v_transaction.amount);
  
  -- Calculate new balance for sender (credit back the full amount they sent)
  v_new_balance := v_account.balance + v_reversal_amount;
  
  -- Update sender's account balance
  UPDATE public.accounts SET balance = v_new_balance WHERE id = v_account.id;
  
  -- Try to find and deduct from recipient's account (for internal transfers)
  IF v_transaction.recipient_account IS NOT NULL THEN
    SELECT * INTO v_recipient_account 
    FROM public.accounts 
    WHERE account_number = v_transaction.recipient_account;
    
    IF v_recipient_account IS NOT NULL THEN
      -- Force deduct from recipient's account regardless of balance (can go negative)
      v_recipient_new_balance := v_recipient_account.balance - v_reversal_amount;
      UPDATE public.accounts SET balance = v_recipient_new_balance WHERE id = v_recipient_account.id;
      
      -- Create a debit transaction for recipient
      INSERT INTO public.transactions (
        account_id, user_id, type, amount, description, status, category
      ) VALUES (
        v_recipient_account.id, 
        v_recipient_account.user_id, 
        'reversal_debit', 
        -v_reversal_amount, 
        'Payment reversed by sender - funds deducted',
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
    v_reversal_amount, 
    'Reversal of: ' || COALESCE(v_transaction.description, 'Transfer'),
    'completed',
    'reversal'
  );
  
  -- Create reversal request record
  INSERT INTO public.reversal_requests (
    transaction_id, user_id, account_id, amount, status, processed_at
  ) VALUES (
    p_transaction_id, p_user_id, v_account.id, v_reversal_amount, 'completed', now()
  );
  
  RETURN json_build_object('success', true, 'message', 'Payment reversed successfully', 'new_balance', v_new_balance);
END;
$$;