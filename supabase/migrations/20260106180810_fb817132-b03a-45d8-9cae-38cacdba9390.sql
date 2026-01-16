-- Create scheduled payments table for recurring bills
CREATE TABLE public.scheduled_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_account TEXT NOT NULL,
  recipient_routing TEXT NOT NULL,
  recipient_bank TEXT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT,
  frequency TEXT NOT NULL DEFAULT 'monthly', -- 'once', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
  next_payment_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'completed', 'cancelled'
  category TEXT DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for scheduled_payments
CREATE POLICY "Users can view own scheduled payments"
  ON public.scheduled_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scheduled payments"
  ON public.scheduled_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled payments"
  ON public.scheduled_payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled payments"
  ON public.scheduled_payments FOR DELETE
  USING (auth.uid() = user_id);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_transactions BOOLEAN NOT NULL DEFAULT true,
  email_low_balance BOOLEAN NOT NULL DEFAULT true,
  email_scheduled_payments BOOLEAN NOT NULL DEFAULT true,
  sms_transactions BOOLEAN NOT NULL DEFAULT false,
  sms_low_balance BOOLEAN NOT NULL DEFAULT false,
  low_balance_threshold NUMERIC NOT NULL DEFAULT 100.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_preferences
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create notifications log table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'transaction', 'low_balance', 'scheduled_payment', 'security'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Add currency support columns to accounts
ALTER TABLE public.accounts 
  ADD COLUMN IF NOT EXISTS secondary_currency TEXT,
  ADD COLUMN IF NOT EXISTS secondary_balance NUMERIC DEFAULT 0;

-- Create exchange rates table (for multi-currency)
CREATE TABLE public.exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_currency, to_currency)
);

-- Insert some default exchange rates
INSERT INTO public.exchange_rates (from_currency, to_currency, rate) VALUES
  ('USD', 'EUR', 0.92),
  ('USD', 'GBP', 0.79),
  ('USD', 'CAD', 1.36),
  ('USD', 'MXN', 17.15),
  ('EUR', 'USD', 1.09),
  ('GBP', 'USD', 1.27),
  ('CAD', 'USD', 0.74),
  ('MXN', 'USD', 0.058);

-- Create triggers for updated_at
CREATE TRIGGER update_scheduled_payments_updated_at
  BEFORE UPDATE ON public.scheduled_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;