-- Add RLS policies for super_admin to manage privileged_users
CREATE POLICY "Super admins can insert privileged users" 
ON public.privileged_users 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update privileged users" 
ON public.privileged_users 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete privileged users" 
ON public.privileged_users 
FOR DELETE 
USING (has_role(auth.uid(), 'super_admin'::app_role));