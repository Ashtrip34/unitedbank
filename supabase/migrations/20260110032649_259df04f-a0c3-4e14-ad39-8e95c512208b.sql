-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'viewer');

-- Create user_roles table for admin access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is any admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'admin', 'viewer')
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Create admin-accessible views via RLS policies
-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can view all accounts  
CREATE POLICY "Admins can view all accounts"
ON public.accounts
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Super admins can update any account (for balance management)
CREATE POLICY "Super admins can update all accounts"
ON public.accounts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add recipient_country to transactions for international transfers
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS recipient_country TEXT;

-- Add more exchange rates for world currencies
INSERT INTO public.exchange_rates (from_currency, to_currency, rate) VALUES
-- From USD
('USD', 'JPY', 149.50),
('USD', 'CNY', 7.24),
('USD', 'INR', 83.12),
('USD', 'AUD', 1.53),
('USD', 'CHF', 0.88),
('USD', 'SGD', 1.34),
('USD', 'HKD', 7.82),
('USD', 'KRW', 1325.00),
('USD', 'ZAR', 18.75),
('USD', 'AED', 3.67),
('USD', 'SAR', 3.75),
('USD', 'NGN', 1550.00),
('USD', 'GHS', 14.50),
('USD', 'KES', 153.00),
('USD', 'EGP', 48.50),
('USD', 'BRL', 4.97),
('USD', 'ARS', 875.00),
('USD', 'CLP', 925.00),
('USD', 'COP', 3950.00),
('USD', 'PEN', 3.72),
('USD', 'THB', 35.50),
('USD', 'MYR', 4.72),
('USD', 'PHP', 56.25),
('USD', 'IDR', 15750.00),
('USD', 'VND', 24500.00),
('USD', 'PLN', 4.02),
('USD', 'CZK', 23.25),
('USD', 'HUF', 358.00),
('USD', 'RON', 4.62),
('USD', 'SEK', 10.45),
('USD', 'NOK', 10.68),
('USD', 'DKK', 6.92),
('USD', 'NZD', 1.64),
('USD', 'TRY', 32.50),
('USD', 'ILS', 3.68),
('USD', 'PKR', 278.50),
('USD', 'BDT', 110.00),
('USD', 'LKR', 312.00),
('USD', 'NPR', 133.00),
('USD', 'MMK', 2100.00),
('USD', 'KHR', 4100.00),
('USD', 'LAK', 20500.00),
('USD', 'TWD', 31.50),
('USD', 'RUB', 92.00),
('USD', 'UAH', 41.50),
('USD', 'TZS', 2520.00),
('USD', 'UGX', 3780.00),
('USD', 'ZMW', 26.50),
('USD', 'BWP', 13.65),
('USD', 'MAD', 10.05),
('USD', 'TND', 3.12),
('USD', 'DZD', 135.00),
('USD', 'XOF', 610.00),
('USD', 'XAF', 610.00)
ON CONFLICT DO NOTHING;