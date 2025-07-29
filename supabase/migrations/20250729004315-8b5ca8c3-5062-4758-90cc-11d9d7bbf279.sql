-- Phase 1: Database Schema Cleanup - Remove dual-column location system

-- Step 1: Ensure all profiles have proper locations array data
-- Backfill any missing locations arrays with the single location value
UPDATE profiles 
SET locations = ARRAY[location]
WHERE (locations IS NULL OR locations = '{}') 
AND location IS NOT NULL 
AND location != '';

-- Step 2: Update user_invitations table to ensure locations array is populated
UPDATE user_invitations 
SET locations = ARRAY[location]
WHERE (locations IS NULL OR locations = '{}') 
AND location IS NOT NULL 
AND location != '';

-- Step 3: Update archived_users table to ensure locations array is populated
UPDATE archived_users 
SET locations = ARRAY[location]
WHERE (locations IS NULL OR locations = '{}') 
AND location IS NOT NULL 
AND location != '';

-- Step 4: Remove legacy single location columns
ALTER TABLE profiles DROP COLUMN IF EXISTS location;
ALTER TABLE user_invitations DROP COLUMN IF EXISTS location;
ALTER TABLE archived_users DROP COLUMN IF EXISTS location;

-- Step 5: Update functions to use only locations array
-- Drop legacy functions that rely on single location
DROP FUNCTION IF EXISTS public.get_current_user_location();
DROP FUNCTION IF EXISTS public.get_user_locations_for_rls(uuid);

-- Update get_current_user_locations to be the primary function
CREATE OR REPLACE FUNCTION public.get_user_locations(user_uuid uuid DEFAULT NULL::uuid)
RETURNS text[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(locations, ARRAY['menton']) FROM profiles WHERE user_id = COALESCE(user_uuid, auth.uid());
$function$;

-- Alias for backward compatibility during transition
CREATE OR REPLACE FUNCTION public.get_current_user_locations()
RETURNS text[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT get_user_locations();
$function$;

-- Update user_has_access_to_location to use only locations array
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

-- Step 6: Update validation triggers to only check locations array
CREATE OR REPLACE FUNCTION public.validate_user_locations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Ensure user always has at least one location in the array
  IF NEW.locations IS NULL OR array_length(NEW.locations, 1) IS NULL OR array_length(NEW.locations, 1) = 0 THEN
    RAISE EXCEPTION 'User must have at least one location assigned in locations array';
  END IF;
  
  -- Validate that all locations exist and are not empty strings
  IF EXISTS (SELECT 1 FROM unnest(NEW.locations) AS loc WHERE loc = '' OR loc IS NULL) THEN
    RAISE EXCEPTION 'Location values cannot be empty';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update invitation validation trigger
CREATE OR REPLACE FUNCTION public.validate_invitation_locations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- For invitations, locations array must be set
  IF NEW.locations IS NULL OR array_length(NEW.locations, 1) IS NULL OR array_length(NEW.locations, 1) = 0 THEN
    RAISE EXCEPTION 'Invitation must have at least one location assigned in locations array';
  END IF;
  
  -- Validate that all locations exist and are not empty strings
  IF EXISTS (SELECT 1 FROM unnest(NEW.locations) AS loc WHERE loc = '' OR loc IS NULL) THEN
    RAISE EXCEPTION 'Location values cannot be empty';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Step 7: Update auto-join trigger to use only locations array
CREATE OR REPLACE FUNCTION public.auto_join_location_chats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  loc TEXT;
  error_context TEXT;
BEGIN
  -- Skip if locations array is empty or null
  IF NEW.locations IS NULL OR array_length(NEW.locations, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Ensure chats exist for all locations first
  PERFORM public.ensure_chats_for_all_locations();
  
  -- Loop through each of user's locations
  FOREACH loc IN ARRAY NEW.locations
  LOOP
    BEGIN
      -- Auto-join user to chats for this location
      INSERT INTO chat_participants (chat_id, user_id, role, joined_at)
      SELECT c.id, NEW.user_id, 'member', now()
      FROM chats c
      WHERE c.type IN ('global', 'announcements') 
      AND c.location = loc
      ON CONFLICT (chat_id, user_id) DO NOTHING;
      
    EXCEPTION WHEN OTHERS THEN
      error_context := format('Error auto-joining user %s to location %s chats: %s', NEW.user_id, loc, SQLERRM);
      RAISE WARNING '%', error_context;
    END;
  END LOOP;
  
  RETURN NEW;
END;
$function$;