-- Fix the security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION public.is_email_permanently_deleted(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.archived_users 
    WHERE email = check_email 
    AND metadata->>'permanently_deleted' = 'true'
  );
$$;