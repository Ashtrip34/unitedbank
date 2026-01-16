CREATE OR REPLACE FUNCTION public.process_reversal(
  p_transaction_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction RECORD;
  v_sender_account RECORD;
  v_recipient_account RECORD;
  v_privileged_user RECORD;
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
  
  -- The recipient received 90% (after 10% fee), so we deduct 90% from them
  v_net_amount_to_deduct := v_reversal_amount * 0.9;

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
$$;