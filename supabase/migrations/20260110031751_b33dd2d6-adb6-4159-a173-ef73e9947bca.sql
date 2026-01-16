-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view own and child accounts" ON public.accounts;

-- Create a security definer function to check parent account ownership
CREATE OR REPLACE FUNCTION public.is_parent_account_owner(parent_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.accounts
    WHERE id = parent_id AND user_id = auth.uid()
  )
$$;

-- Create simple non-recursive policy using the function
CREATE POLICY "Users can view own accounts"
ON public.accounts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view child accounts"
ON public.accounts
FOR SELECT
USING (
  parent_account_id IS NOT NULL 
  AND public.is_parent_account_owner(parent_account_id)
);