-- COMPREHENSIVE LOCATION MANAGEMENT REFACTOR
-- Convert from single location (string) to multiple locations (array)

-- Step 1: Create locations management table for dynamic location handling
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert current locations
INSERT INTO public.locations (code, name) VALUES 
  ('menton', 'Menton'),
  ('lyon', 'Lyon')
ON CONFLICT (code) DO NOTHING;

-- Step 2: Add new locations column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locations TEXT[] DEFAULT '{}';

-- Step 3: Migrate existing location data to locations array
UPDATE public.profiles 
SET locations = CASE 
  WHEN location = 'all_locations' THEN ARRAY['menton', 'lyon']
  WHEN location IN ('menton', 'lyon') THEN ARRAY[location]
  ELSE ARRAY['menton'] -- fallback for any unexpected values
END
WHERE locations = '{}' OR locations IS NULL;

-- Step 4: Ensure all users have at least one location
UPDATE public.profiles 
SET locations = ARRAY['menton'] 
WHERE locations = '{}' OR locations IS NULL OR array_length(locations, 1) IS NULL;

-- Step 5: Add constraint to ensure locations array is never empty
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_locations_not_empty 
CHECK (array_length(locations, 1) >= 1);

-- Step 6: Update user_invitations table to support multiple locations
ALTER TABLE public.user_invitations ADD COLUMN IF NOT EXISTS locations TEXT[] DEFAULT '{}';

-- Migrate existing invitation location data
UPDATE public.user_invitations 
SET locations = CASE 
  WHEN location = 'all_locations' THEN ARRAY['menton', 'lyon']
  WHEN location IN ('menton', 'lyon') THEN ARRAY[location]
  ELSE ARRAY['menton']
END
WHERE locations = '{}' OR locations IS NULL;

-- Step 7: Update archived_users table to support multiple locations
ALTER TABLE public.archived_users ADD COLUMN IF NOT EXISTS locations TEXT[] DEFAULT '{}';

-- Migrate existing archived user location data
UPDATE public.archived_users 
SET locations = CASE 
  WHEN location = 'all_locations' THEN ARRAY['menton', 'lyon']
  WHEN location IN ('menton', 'lyon') THEN ARRAY[location]
  ELSE ARRAY['menton']
END
WHERE locations = '{}' OR locations IS NULL;

-- Step 8: Create function to get all active locations dynamically
CREATE OR REPLACE FUNCTION public.get_active_locations()
RETURNS TABLE(code TEXT, name TEXT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT l.code, l.name FROM public.locations l WHERE l.is_active = true ORDER BY l.name;
$$;

-- Step 9: Create function to get user's locations
CREATE OR REPLACE FUNCTION public.get_current_user_locations()
RETURNS TEXT[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(locations, ARRAY['menton']) FROM profiles WHERE user_id = auth.uid();
$$;

-- Step 10: Update get_current_user_location to return first location for compatibility
CREATE OR REPLACE FUNCTION public.get_current_user_location()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(locations[1], 'menton') FROM profiles WHERE user_id = auth.uid();
$$;

-- Step 11: Create function to check if user has access to location
CREATE OR REPLACE FUNCTION public.user_has_access_to_location(check_location TEXT, user_uuid UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT check_location = ANY(
    SELECT COALESCE(locations, ARRAY['menton']) 
    FROM profiles 
    WHERE user_id = COALESCE(user_uuid, auth.uid())
  );
$$;

-- Step 12: Create function to ensure chats exist for all active locations
CREATE OR REPLACE FUNCTION public.ensure_chats_for_all_locations()
RETURNS TABLE(action TEXT, location_code TEXT, chat_type TEXT, chat_id UUID, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  loc RECORD;
  existing_chat RECORD;
  new_chat_id UUID;
BEGIN
  -- Loop through all active locations
  FOR loc IN SELECT code, name FROM public.get_active_locations()
  LOOP
    -- Check/create global chat
    SELECT * INTO existing_chat
    FROM chats c
    WHERE c.type = 'global'::chat_type AND c.location = loc.code;
    
    IF FOUND THEN
      RETURN QUERY SELECT 
        'EXISTS'::TEXT,
        loc.code,
        'global'::TEXT,
        existing_chat.id,
        format('Global chat exists for %s', loc.name)::TEXT;
    ELSE
      INSERT INTO chats (type, name, location, created_by)
      VALUES (
        'global'::chat_type,
        format('Global Chat — %s', loc.name),
        loc.code,
        null
      )
      RETURNING id INTO new_chat_id;
      
      RETURN QUERY SELECT 
        'CREATED'::TEXT,
        loc.code,
        'global'::TEXT,
        new_chat_id,
        format('Created global chat for %s', loc.name)::TEXT;
    END IF;
    
    -- Check/create announcements chat
    SELECT * INTO existing_chat
    FROM chats c
    WHERE c.type = 'announcements'::chat_type AND c.location = loc.code;
    
    IF FOUND THEN
      RETURN QUERY SELECT 
        'EXISTS'::TEXT,
        loc.code,
        'announcements'::TEXT,
        existing_chat.id,
        format('Announcements chat exists for %s', loc.name)::TEXT;
    ELSE
      INSERT INTO chats (type, name, location, created_by)
      VALUES (
        'announcements'::chat_type,
        format('Announcements — %s', loc.name),
        loc.code,
        null
      )
      RETURNING id INTO new_chat_id;
      
      RETURN QUERY SELECT 
        'CREATED'::TEXT,
        loc.code,
        'announcements'::TEXT,
        new_chat_id,
        format('Created announcements chat for %s', loc.name)::TEXT;
    END IF;
  END LOOP;
END;
$$;

-- Step 13: Create function to sync user chat memberships based on their locations
CREATE OR REPLACE FUNCTION public.sync_user_chat_memberships(target_user_id UUID)
RETURNS TABLE(action TEXT, location_code TEXT, chat_type TEXT, chat_id UUID, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_locations TEXT[];
  loc TEXT;
  chat_record RECORD;
  existing_participant RECORD;
BEGIN
  -- Get user's locations
  SELECT locations INTO user_locations 
  FROM profiles 
  WHERE user_id = target_user_id;
  
  IF user_locations IS NULL OR array_length(user_locations, 1) IS NULL THEN
    RETURN QUERY SELECT 
      'ERROR'::TEXT,
      ''::TEXT,
      ''::TEXT,
      null::UUID,
      format('User %s has no locations assigned', target_user_id)::TEXT;
    RETURN;
  END IF;
  
  -- Loop through each of user's locations
  FOREACH loc IN ARRAY user_locations
  LOOP
    -- Find all global and announcement chats for this location
    FOR chat_record IN
      SELECT c.*
      FROM chats c
      WHERE c.type IN ('global', 'announcements')
      AND c.location = loc
    LOOP
      -- Check if user is already a participant
      SELECT * INTO existing_participant
      FROM chat_participants cp
      WHERE cp.chat_id = chat_record.id 
      AND cp.user_id = target_user_id;
      
      IF FOUND THEN
        RETURN QUERY SELECT 
          'EXISTS'::TEXT,
          loc,
          chat_record.type::TEXT,
          chat_record.id,
          format('Already member of %s', COALESCE(chat_record.name, chat_record.type || '-' || loc))::TEXT;
      ELSE
        -- Add user to chat
        INSERT INTO chat_participants (chat_id, user_id, role, joined_at)
        VALUES (chat_record.id, target_user_id, 'member', now())
        ON CONFLICT (chat_id, user_id) DO NOTHING;
        
        RETURN QUERY SELECT 
          'JOINED'::TEXT,
          loc,
          chat_record.type::TEXT,
          chat_record.id,
          format('Joined %s', COALESCE(chat_record.name, chat_record.type || '-' || loc))::TEXT;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Step 14: Update auto_join_location_chats trigger function for multiple locations
CREATE OR REPLACE FUNCTION public.auto_join_location_chats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  loc TEXT;
  error_context TEXT;
BEGIN
  -- Ensure chats exist for all locations first
  PERFORM public.ensure_chats_for_all_locations();
  
  -- Loop through each of user's locations
  FOREACH loc IN ARRAY NEW.locations
  LOOP
    BEGIN
      -- Auto-join user to chats for this location
      INSERT INTO chat_participants (chat_id, user_id, role)
      SELECT c.id, NEW.user_id, 'member'
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
$$;

-- Step 15: Create comprehensive system health check
CREATE OR REPLACE FUNCTION public.validate_location_system_health()
RETURNS TABLE(check_name TEXT, status TEXT, details TEXT, count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  loc RECORD;
  expected_chats INTEGER;
  actual_chats INTEGER;
BEGIN
  -- Check 1: All active locations have required chats
  SELECT COUNT(*) * 2 INTO expected_chats FROM public.get_active_locations(); -- 2 chats per location
  
  SELECT COUNT(*) INTO actual_chats
  FROM chats c
  JOIN locations l ON c.location = l.code
  WHERE c.type IN ('global', 'announcements')
  AND l.is_active = true;
  
  RETURN QUERY SELECT 
    'Required chats for all locations'::TEXT,
    CASE WHEN actual_chats = expected_chats THEN 'PASS' ELSE 'FAIL' END::TEXT,
    format('Found %s of %s required chats', actual_chats, expected_chats)::TEXT,
    actual_chats;
  
  -- Check 2: Users without any locations
  RETURN QUERY
  SELECT 
    'Users without locations'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    format('%s users found without locations', COUNT(*))::TEXT,
    COUNT(*)::INTEGER
  FROM profiles p
  WHERE p.status = 'active' 
  AND p.user_id IS NOT NULL
  AND (p.locations IS NULL OR p.locations = '{}' OR array_length(p.locations, 1) IS NULL);
  
  -- Check 3: Users without chat memberships for their locations
  RETURN QUERY
  SELECT 
    'Users missing chat memberships'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    format('%s users missing expected chat memberships', COUNT(*))::TEXT,
    COUNT(*)::INTEGER
  FROM profiles p
  WHERE p.status = 'active' 
  AND p.user_id IS NOT NULL
  AND EXISTS (
    -- User has locations but missing chat memberships for those locations
    SELECT 1 FROM unnest(p.locations) AS user_loc
    WHERE NOT EXISTS (
      SELECT 1 FROM chat_participants cp
      JOIN chats c ON cp.chat_id = c.id
      WHERE cp.user_id = p.user_id
      AND c.location = user_loc
      AND c.type IN ('global', 'announcements')
    )
  );
END;
$$;

-- Step 16: Run initial setup
SELECT public.ensure_chats_for_all_locations();

-- Enable RLS on locations table
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for locations
CREATE POLICY "Anyone can view active locations" ON public.locations
FOR SELECT USING (is_active = true);