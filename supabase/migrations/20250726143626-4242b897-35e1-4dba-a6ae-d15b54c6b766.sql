-- Create a function to get all available locations for super admins
CREATE OR REPLACE FUNCTION public.get_available_locations(user_role text DEFAULT NULL)
RETURNS TABLE(location text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- If user is super_admin, return all possible locations
  -- Otherwise return only their assigned location
  SELECT CASE 
    WHEN COALESCE(user_role, get_current_user_role()) = 'super_admin' THEN 
      unnest(ARRAY['menton', 'monaco', 'nice', 'cannes', 'antibes', 'all_locations'])
    ELSE 
      (SELECT p.location FROM profiles p WHERE p.user_id = auth.uid())
  END;
$function$;

-- Create a function to check if user can access all locations
CREATE OR REPLACE FUNCTION public.can_access_all_locations()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT get_current_user_role() = 'super_admin';
$function$;

-- Update the profile for our super admin to have 'all_locations' as location
UPDATE profiles 
SET location = 'all_locations' 
WHERE user_id = '00000000-0000-0000-0000-000000000001' 
  AND role = 'super_admin';