
-- Update internal_transfer to show fee breakdown on receiver's end
CREATE OR REPLACE FUNCTION public.internal_transfer(
  recipient_account_number text,
  sender_user_id uuid,
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
  sender_profile record;
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

  -- Get sender profile for name
  SELECT * INTO sender_profile FROM public.profiles WHERE user_id = sender_user_id;

  -- Get recipient account
  SELECT * INTO recipient_account FROM public.accounts WHERE account_number = recipient_account_number;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Recipient account not found');
  END IF;

  -- Prevent self-transfer
  IF sender_account.id = recipient_account.id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot transfer to your own account');
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

  -- Calculate new balances (can go negative)
  new_sender_balance := sender_account.balance - transfer_amount;
  new_recipient_balance := recipient_account.balance + net_amount;

  -- Update sender balance (can go negative)
  UPDATE public.accounts SET balance = new_sender_balance WHERE id = sender_account.id;

  -- Update recipient balance (receives 90% after fee)
  UPDATE public.accounts SET balance = new_recipient_balance WHERE id = recipient_account.id;

  -- Create sender transaction (debit full amount)
  INSERT INTO public.transactions (
    account_id, user_id, type, amount, description, 
    recipient_name, recipient_account, recipient_routing, recipient_bank, status, category
  ) VALUES (
    sender_account.id, sender_user_id, 'transfer', -transfer_amount,
    COALESCE(transfer_description, 'Internal transfer to ' || COALESCE(recipient_profile.full_name, 'United Bank user')),
    COALESCE(recipient_profile.full_name, 'United Bank User'),
    recipient_account_number, '021000021', 'United Bank', 'completed', 'transfer'
  );

  -- Create fee transaction for sender (shows as negative in history)
  INSERT INTO public.transactions (
    account_id, user_id, type, amount, description, status, category
  ) VALUES (
    sender_account.id, sender_user_id, 'fee', -fee_amount,
    'Transaction fee (10%) for transfer to ' || COALESCE(recipient_profile.full_name, 'United Bank user'),
    'completed', 'fee'
  );

  -- Create recipient transaction (credit net amount)
  INSERT INTO public.transactions (
    account_id, user_id, type, amount, description,
    recipient_name, recipient_account, recipient_routing, recipient_bank, status, category
  ) VALUES (
    recipient_account.id, recipient_account.user_id, 'deposit', net_amount,
    'Transfer received from ' || COALESCE(sender_profile.full_name, 'United Bank'),
    COALESCE(sender_profile.full_name, 'United Bank'), sender_account.account_number, '021000021', 'United Bank', 'completed', 'transfer'
  );

  -- Create fee deduction record for recipient (shows the 10% that was deducted)
  INSERT INTO public.transactions (
    account_id, user_id, type, amount, description, status, category
  ) VALUES (
    recipient_account.id, recipient_account.user_id, 'fee', -fee_amount,
    'Transaction fee (10%) deducted from incoming transfer',
    'completed', 'fee'
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
