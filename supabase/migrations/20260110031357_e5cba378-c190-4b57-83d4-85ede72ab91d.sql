-- Drop the problematic duplicate and recursive policies
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can view sub-accounts" ON public.accounts;

-- Create a single, non-recursive policy using is_account_owner function
CREATE POLICY "Users can view own and child accounts"
ON public.accounts
FOR SELECT
USING (
  auth.uid() = user_id 
  OR parent_account_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.accounts parent 
    WHERE parent.id = accounts.parent_account_id 
    AND parent.user_id = auth.uid()
  )
);