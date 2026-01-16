-- Fix the get_tier_transfer_limit function to have proper search_path
CREATE OR REPLACE FUNCTION public.get_tier_transfer_limit(tier public.account_tier, category public.account_category)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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