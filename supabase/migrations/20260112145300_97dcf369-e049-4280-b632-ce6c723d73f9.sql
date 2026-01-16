
-- Update internal_transfer function with 1.5% fee and 2,000,000 limit
CREATE OR REPLACE FUNCTION public.internal_transfer(sender_user_id uuid, recipient_account_number text, transfer_amount numeric, transfer_description text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Calculate 1.5% transaction fee
  fee_amount := transfer_amount * 0.015;
  net_amount := transfer_amount - fee_amount;

  -- Calculate new balances (can go negative)
  new_sender_balance := sender_account.balance - transfer_amount;
  new_recipient_balance := recipient_account.balance + net_amount;

  -- Update sender balance (can go negative)
  UPDATE public.accounts SET balance = new_sender_balance WHERE id = sender_account.id;

  -- Update recipient balance (receives 98.5% after fee)
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
    'Transaction fee (1.5%) for transfer to ' || COALESCE(recipient_profile.full_name, 'United Bank user'),
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

  -- Create fee deduction record for recipient (shows the 1.5% that was deducted)
  INSERT INTO public.transactions (
    account_id, user_id, type, amount, description, status, category
  ) VALUES (
    recipient_account.id, recipient_account.user_id, 'fee', -fee_amount,
    'Transaction fee (1.5%) deducted from incoming transfer',
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
$function$;

-- Update process_reversal function to prevent duplicate reversals
CREATE OR REPLACE FUNCTION public.process_reversal(p_transaction_id uuid, p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_transaction RECORD;
  v_sender_account RECORD;
  v_recipient_account RECORD;
  v_privileged_user RECORD;
  v_existing_reversal RECORD;
  v_reversal_amount NUMERIC;
  v_net_amount_to_deduct NUMERIC;
  v_new_reversal_id UUID;
  v_recipient_found BOOLEAN := false;
BEGIN
  -- Check if user has instant reversal privilege
  SELECT * INTO v_privileged_user
  FROM public.privileged_users
  WHERE email = (SELECT email FROM auth.users WHERE id = p_user_id)
    AND instant_reversal = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User does not have instant reversal privileges');
  END IF;

  -- Check if this transaction has already been reversed
  SELECT * INTO v_existing_reversal
  FROM public.reversal_requests
  WHERE transaction_id = p_transaction_id
    AND status = 'approved';
  
  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'This transaction has already been reversed');
  END IF;

  -- Get the original transaction
  SELECT * INTO v_transaction
  FROM public.transactions
  WHERE id = p_transaction_id
    AND user_id = p_user_id
    AND type = 'transfer'
    AND status = 'completed';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Transaction not found or not eligible for reversal');
  END IF;

  -- Get sender's account (the one who initiated the transfer)
  SELECT * INTO v_sender_account
  FROM public.accounts
  WHERE id = v_transaction.account_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Sender account not found');
  END IF;

  -- The original transaction amount is the full transfer (negative value for sender)
  -- We reverse the full amount to the sender
  v_reversal_amount := ABS(v_transaction.amount);
  
  -- The recipient received 98.5% (after 1.5% fee), so we deduct 98.5% from them
  v_net_amount_to_deduct := v_reversal_amount * 0.985;

  -- Credit the full amount back to sender
  UPDATE public.accounts
  SET balance = balance + v_reversal_amount,
      updated_at = NOW()
  WHERE id = v_sender_account.id;

  -- Find the recipient's account by account number from the transaction
  SELECT * INTO v_recipient_account
  FROM public.accounts
  WHERE account_number = v_transaction.recipient_account;
  
  -- Store the found status BEFORE doing any other operations
  v_recipient_found := FOUND;
  
  IF v_recipient_found THEN
    -- Forcefully deduct the net amount from recipient (can go negative)
    UPDATE public.accounts
    SET balance = balance - v_net_amount_to_deduct,
        updated_at = NOW()
    WHERE id = v_recipient_account.id;

    -- Create reversal debit transaction for recipient
    INSERT INTO public.transactions (
      account_id, user_id, type, amount, description, status, category,
      recipient_name, recipient_account
    ) VALUES (
      v_recipient_account.id, 
      v_recipient_account.user_id, 
      'reversal_debit', 
      -v_net_amount_to_deduct,
      'Forceful reversal - funds deducted by sender request',
      'completed', 
      'reversal',
      (SELECT full_name FROM public.profiles WHERE user_id = v_sender_account.user_id),
      v_sender_account.account_number
    );
  END IF;

  -- Create reversal credit transaction for sender
  INSERT INTO public.transactions (
    account_id, user_id, type, amount, description, status, category,
    recipient_name, recipient_account
  ) VALUES (
    v_sender_account.id, 
    p_user_id, 
    'reversal', 
    v_reversal_amount,
    'Instant reversal of transfer to ' || COALESCE(v_transaction.recipient_name, 'Unknown'),
    'completed', 
    'reversal',
    v_transaction.recipient_name,
    v_transaction.recipient_account
  )
  RETURNING id INTO v_new_reversal_id;

  -- Create reversal request record
  INSERT INTO public.reversal_requests (
    transaction_id, user_id, account_id, amount, status, reason, processed_at
  ) VALUES (
    p_transaction_id, p_user_id, v_sender_account.id, v_reversal_amount, 
    'approved', 'Instant reversal by privileged user', NOW()
  );

  RETURN json_build_object(
    'success', true, 
    'reversal_id', v_new_reversal_id,
    'amount_credited', v_reversal_amount,
    'amount_deducted_from_recipient', v_net_amount_to_deduct,
    'recipient_found', v_recipient_found
  );
END;
$function$;
