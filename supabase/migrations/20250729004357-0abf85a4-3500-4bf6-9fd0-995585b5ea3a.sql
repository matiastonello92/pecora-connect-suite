-- Phase 1: Fix RLS policies and remove dual-column location system

-- Step 1: Update all RLS policies that depend on single location column
-- First, drop and recreate policies that reference profiles.location

-- Update checklist_items policy that's causing the error
DROP POLICY IF EXISTS "Users can view checklist items for accessible templates" ON checklist_items;
CREATE POLICY "Users can view checklist items for accessible templates" 
ON checklist_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM checklist_templates ct
    WHERE ct.id = checklist_items.template_id 
    AND ct.location = ANY(get_current_user_locations())
  )
);

-- Update other policies that might reference single location
-- Check and update any other policies that use profiles.location

-- Update profiles policies to remove location references if any
DROP POLICY IF EXISTS "Users can view profiles in same location" ON profiles;

-- Step 2: Ensure all profiles have proper locations array data
UPDATE profiles 
SET locations = ARRAY[location]
WHERE (locations IS NULL OR locations = '{}') 
AND location IS NOT NULL 
AND location != '';

-- Step 3: Update user_invitations table
UPDATE user_invitations 
SET locations = ARRAY[location]
WHERE (locations IS NULL OR locations = '{}') 
AND location IS NOT NULL 
AND location != '';

-- Step 4: Update archived_users table
UPDATE archived_users 
SET locations = ARRAY[location]
WHERE (locations IS NULL OR locations = '{}') 
AND location IS NOT NULL 
AND location != '';

-- Step 5: Now safely drop the location columns
ALTER TABLE profiles DROP COLUMN IF EXISTS location;
ALTER TABLE user_invitations DROP COLUMN IF EXISTS location;
ALTER TABLE archived_users DROP COLUMN IF EXISTS location;

-- Step 6: Update database functions
DROP FUNCTION IF EXISTS public.get_current_user_location();
DROP FUNCTION IF EXISTS public.get_user_locations_for_rls(uuid);

-- Create new primary function
CREATE OR REPLACE FUNCTION public.get_user_locations(user_uuid uuid DEFAULT NULL::uuid)
RETURNS text[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(locations, ARRAY['menton']) FROM profiles WHERE user_id = COALESCE(user_uuid, auth.uid());
$function$;

-- Keep backward compatibility alias
CREATE OR REPLACE FUNCTION public.get_current_user_locations()
RETURNS text[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT get_user_locations();
$function$;

-- Update user_has_access_to_location
CREATE OR REPLACE FUNCTION public.user_has_access_to_location(check_location text, user_uuid uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_locations TEXT[];
BEGIN
  SELECT get_user_locations(COALESCE(user_uuid, auth.uid())) INTO user_locations;
  RETURN check_location = ANY(user_locations);
END;
$function$;