-- Create account tier enum
CREATE TYPE public.account_tier AS ENUM ('free', 'plus', 'pro', 'enterprise');

-- Create account type enum for business vs personal
CREATE TYPE public.account_category AS ENUM ('personal', 'business');

-- Add new columns to accounts table
ALTER TABLE public.accounts 
ADD COLUMN tier public.account_tier DEFAULT 'free',
ADD COLUMN category public.account_category DEFAULT 'personal',
ADD COLUMN parent_account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
ADD COLUMN is_sub_account boolean DEFAULT false,
ADD COLUMN sub_account_name text,
ADD COLUMN sub_account_has_login boolean DEFAULT false,
ADD COLUMN transfer_limit numeric DEFAULT 500000;

-- Add phone number to profiles
ALTER TABLE public.profiles
ADD COLUMN country_code text,
ADD COLUMN is_international boolean DEFAULT false;

-- Create business_profiles table for business account verification
CREATE TABLE public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_name text NOT NULL,
  ein text,
  business_type text NOT NULL,
  business_address text,
  verification_status text DEFAULT 'pending',
  verification_documents jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on business_profiles
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for business_profiles
CREATE POLICY "Users can view own business profile"
ON public.business_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business profile"
ON public.business_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business profile"
ON public.business_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Create authorized_users table for business accounts with multiple users
CREATE TABLE public.authorized_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  permission_level text DEFAULT 'viewer',
  invited_email text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on authorized_users
ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check account ownership
CREATE OR REPLACE FUNCTION public.is_account_owner(check_account_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.accounts
    WHERE id = check_account_id AND user_id = auth.uid()
  )
$$;

-- RLS policies for authorized_users
CREATE POLICY "Account owners can view authorized users"
ON public.authorized_users FOR SELECT
USING (public.is_account_owner(account_id) OR user_id = auth.uid());

CREATE POLICY "Account owners can insert authorized users"
ON public.authorized_users FOR INSERT
WITH CHECK (public.is_account_owner(account_id));

CREATE POLICY "Account owners can update authorized users"
ON public.authorized_users FOR UPDATE
USING (public.is_account_owner(account_id));

CREATE POLICY "Account owners can delete authorized users"
ON public.authorized_users FOR DELETE
USING (public.is_account_owner(account_id));

-- Create invoices table for business accounts
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  invoice_number text NOT NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'draft',
  due_date date NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoices
CREATE POLICY "Users can view own invoices"
ON public.invoices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices"
ON public.invoices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
ON public.invoices FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
ON public.invoices FOR DELETE
USING (auth.uid() = user_id);

-- Update transfer limits based on tier
CREATE OR REPLACE FUNCTION public.get_tier_transfer_limit(tier public.account_tier, category public.account_category)
RETURNS numeric
LANGUAGE plpgsql
AS $$
BEGIN
  IF category = 'business' THEN
    CASE tier
      WHEN 'free' THEN RETURN 100000;
      WHEN 'plus' THEN RETURN 500000;
      WHEN 'pro' THEN RETURN 1000000;
      WHEN 'enterprise' THEN RETURN 5000000;
    END CASE;
  ELSE
    CASE tier
      WHEN 'free' THEN RETURN 10000;
      WHEN 'plus' THEN RETURN 50000;
      WHEN 'pro' THEN RETURN 200000;
      WHEN 'enterprise' THEN RETURN 500000;
    END CASE;
  END IF;
  RETURN 10000;
END;
$$;

-- Update handle_new_user to set initial tier
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Insert account with default tier
  INSERT INTO public.accounts (user_id, account_number, balance, tier, category, transfer_limit)
  VALUES (NEW.id, new_account_number, 1000.00, 'free', 'personal', 10000);
  
  RETURN NEW;
END;
$$;

-- RLS policy for sub-accounts: parent can view their sub-accounts
CREATE POLICY "Users can view sub-accounts"
ON public.accounts FOR SELECT
USING (
  auth.uid() = user_id OR 
  parent_account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
);

-- Drop old select policy and recreate to avoid conflict
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;

CREATE POLICY "Users can view own accounts"
ON public.accounts FOR SELECT
USING (
  auth.uid() = user_id OR 
  parent_account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
);

-- Add trigger for business_profiles updated_at
CREATE TRIGGER update_business_profiles_updated_at
BEFORE UPDATE ON public.business_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for invoices updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();