-- Enable RLS on exchange_rates table
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Exchange rates should be publicly readable (no auth required)
CREATE POLICY "Exchange rates are publicly readable"
  ON public.exchange_rates FOR SELECT
  USING (true);