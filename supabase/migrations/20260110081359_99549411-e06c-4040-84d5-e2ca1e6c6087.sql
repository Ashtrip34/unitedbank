-- Update the default transfer limit to 2,000,000
ALTER TABLE public.accounts ALTER COLUMN transfer_limit SET DEFAULT 2000000;

-- Update existing accounts to have the new limit
UPDATE public.accounts SET transfer_limit = 2000000 WHERE transfer_limit = 500000;

-- Update the get_tier_transfer_limit function to reflect new limits
CREATE OR REPLACE FUNCTION public.get_tier_transfer_limit(
  category account_category,
  tier account_tier
) RETURNS numeric AS $$
BEGIN
  IF category = 'business' THEN
    CASE tier
      WHEN 'enterprise' THEN RETURN 2000000;
      WHEN 'pro' THEN RETURN 1500000;
      WHEN 'plus' THEN RETURN 1000000;
      ELSE RETURN 500000;
    END CASE;
  ELSE
    CASE tier
      WHEN 'enterprise' THEN RETURN 1000000;
      WHEN 'pro' THEN RETURN 750000;
      WHEN 'plus' THEN RETURN 500000;
      ELSE RETURN 250000;
    END CASE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;