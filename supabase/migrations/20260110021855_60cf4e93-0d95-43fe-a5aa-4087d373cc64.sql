-- Update handle_new_user to set balance to 0 for new accounts
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_account_number TEXT;
  is_international BOOLEAN;
  user_phone TEXT;
  user_country TEXT;
BEGIN
  -- Check if this is an international signup (phone-based)
  user_phone := NEW.phone;
  user_country := NEW.raw_user_meta_data ->> 'country_code';
  is_international := user_phone IS NOT NULL AND user_country IS NOT NULL AND user_country != 'US';
  
  -- Generate unique 10-digit account number
  new_account_number := LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0');
  
  -- Insert profile with international flag
  INSERT INTO public.profiles (user_id, email, full_name, phone, country_code, is_international)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data ->> 'full_name',
    user_phone,
    user_country,
    is_international
  );
  
  -- Insert account with $0 balance
  INSERT INTO public.accounts (user_id, account_number, balance, tier, category, transfer_limit)
  VALUES (NEW.id, new_account_number, 0.00, 'free', 'personal', 10000);
  
  RETURN NEW;
END;
$function$;