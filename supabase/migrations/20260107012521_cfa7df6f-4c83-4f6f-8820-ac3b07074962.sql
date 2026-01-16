-- Create function to initialize credit score for new users
CREATE OR REPLACE FUNCTION public.initialize_credit_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate a starting credit score between 650 and 750 for new users
  INSERT INTO public.credit_scores (user_id, score, score_date, factors)
  VALUES (
    NEW.id,
    650 + floor(random() * 100)::integer,
    CURRENT_DATE,
    '["New account established", "No negative marks on record", "Building credit history"]'::jsonb
  );
  RETURN NEW;
END;
$$;

-- Create trigger to auto-initialize credit score on user signup
DROP TRIGGER IF EXISTS on_auth_user_created_credit_score ON auth.users;
CREATE TRIGGER on_auth_user_created_credit_score
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_credit_score();

-- Create function for internal transfer between United Bank accounts
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
BEGIN
  -- Get sender account
  SELECT * INTO sender_account FROM public.accounts WHERE user_id = sender_user_id;
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

  -- Check transfer limit
  IF transfer_amount > 500000 THEN
    RETURN json_build_object('success', false, 'error', 'Transfer limit is $500,000 per transaction');
  END IF;

  -- Get recipient profile for name
  SELECT * INTO recipient_profile FROM public.profiles WHERE user_id = recipient_account.user_id;

  -- Calculate new balances
  new_sender_balance := sender_account.balance - transfer_amount;
  new_recipient_balance := recipient_account.balance + transfer_amount;

  -- Update sender balance
  UPDATE public.accounts SET balance = new_sender_balance WHERE id = sender_account.id;

  -- Update recipient balance
  UPDATE public.accounts SET balance = new_recipient_balance WHERE id = recipient_account.id;

  -- Create sender transaction (debit)
  INSERT INTO public.transactions (
    account_id, user_id, type, amount, description, 
    recipient_name, recipient_account, recipient_routing, recipient_bank, status
  ) VALUES (
    sender_account.id, sender_user_id, 'transfer', -transfer_amount,
    COALESCE(transfer_description, 'Internal transfer to ' || COALESCE(recipient_profile.full_name, 'United Bank user')),
    COALESCE(recipient_profile.full_name, 'United Bank User'),
    recipient_account_number, '021000021', 'United Bank', 'completed'
  );

  -- Create recipient transaction (credit)
  INSERT INTO public.transactions (
    account_id, user_id, type, amount, description,
    recipient_name, recipient_account, recipient_routing, recipient_bank, status
  ) VALUES (
    recipient_account.id, recipient_account.user_id, 'deposit', transfer_amount,
    'Internal transfer received',
    NULL, NULL, NULL, 'United Bank', 'completed'
  );

  RETURN json_build_object(
    'success', true, 
    'recipient_name', COALESCE(recipient_profile.full_name, 'United Bank User'),
    'message', 'Transfer completed successfully'
  );
END;
$$;