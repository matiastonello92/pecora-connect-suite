-- PART 1: Backfill existing users to ensure they're in appropriate chats
-- PART 2: Improve auto-assign functions for new users

-- Create comprehensive backfill function (fixed syntax)
CREATE OR REPLACE FUNCTION public.backfill_user_chat_memberships()
RETURNS TABLE(user_count integer, memberships_added integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
  location_to_process TEXT;
  total_users INTEGER := 0;
  total_memberships INTEGER := 0;
  memberships_this_iteration INTEGER;
  locations_array TEXT[] := ARRAY['menton', 'lyon'];
BEGIN
  -- Loop through all active users
  FOR user_record IN 
    SELECT user_id, location, first_name, last_name 
    FROM profiles 
    WHERE status = 'active' AND user_id IS NOT NULL
  LOOP
    total_users := total_users + 1;
    
    -- Determine which locations to process for this user
    IF user_record.location = 'all_locations' THEN
      -- Process all locations for all_locations users
      FOR location_to_process IN SELECT unnest(locations_array)
      LOOP
        -- Ensure global chat exists for this location
        INSERT INTO chats (type, name, location, created_by)
        SELECT 'global', 'General Discussion - ' || location_to_process, location_to_process, null
        WHERE NOT EXISTS (
          SELECT 1 FROM chats 
          WHERE type = 'global' AND location = location_to_process
        );
        
        -- Ensure announcements chat exists for this location  
        INSERT INTO chats (type, name, location, created_by)
        SELECT 'announcements', 'Announcements - ' || location_to_process, location_to_process, null
        WHERE NOT EXISTS (
          SELECT 1 FROM chats 
          WHERE type = 'announcements' AND location = location_to_process
        );
        
        -- Auto-join user to global and announcement chats for this location
        INSERT INTO chat_participants (chat_id, user_id, role)
        SELECT c.id, user_record.user_id, 'member'
        FROM chats c
        WHERE c.type IN ('global', 'announcements')
        AND c.location = location_to_process
        ON CONFLICT (chat_id, user_id) DO NOTHING;
        
        GET DIAGNOSTICS memberships_this_iteration = ROW_COUNT;
        total_memberships := total_memberships + memberships_this_iteration;
      END LOOP;
      
    ELSIF user_record.location IN ('menton', 'lyon') THEN
      -- Process only the user's specific location
      location_to_process := user_record.location;
      
      -- Ensure global chat exists for user's location
      INSERT INTO chats (type, name, location, created_by)
      SELECT 'global', 'General Discussion - ' || location_to_process, location_to_process, null
      WHERE NOT EXISTS (
        SELECT 1 FROM chats 
        WHERE type = 'global' AND location = location_to_process
      );
      
      -- Ensure announcements chat exists for user's location
      INSERT INTO chats (type, name, location, created_by)
      SELECT 'announcements', 'Announcements - ' || location_to_process, location_to_process, null
      WHERE NOT EXISTS (
        SELECT 1 FROM chats 
        WHERE type = 'announcements' AND location = location_to_process
      );
      
      -- Auto-join user to global and announcement chats for their location
      INSERT INTO chat_participants (chat_id, user_id, role)
      SELECT c.id, user_record.user_id, 'member'
      FROM chats c
      WHERE c.type IN ('global', 'announcements')
      AND c.location = location_to_process
      ON CONFLICT (chat_id, user_id) DO NOTHING;
      
      GET DIAGNOSTICS memberships_this_iteration = ROW_COUNT;
      total_memberships := total_memberships + memberships_this_iteration;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT total_users, total_memberships;
END;
$$;

-- Improve the ensure_default_chats function with better error handling
CREATE OR REPLACE FUNCTION public.ensure_default_chats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_location TEXT;
  loc TEXT;
  error_context TEXT;
BEGIN
  -- Get current user's location
  SELECT location INTO current_user_location FROM profiles WHERE user_id = auth.uid();
  
  IF current_user_location IS NULL THEN
    RAISE WARNING 'User % has no location set', auth.uid();
    RETURN;
  END IF;
  
  -- If user has all_locations access, ensure chats exist for both locations
  IF current_user_location = 'all_locations' THEN
    FOR loc IN VALUES ('menton'), ('lyon')
    LOOP
      BEGIN
        -- Create global chat if it doesn't exist
        INSERT INTO chats (type, name, location, created_by)
        SELECT 'global', 'General Discussion - ' || loc, loc, null
        WHERE NOT EXISTS (
          SELECT 1 FROM chats 
          WHERE type = 'global' AND location = loc
        );
        
        -- Create announcements chat if it doesn't exist
        INSERT INTO chats (type, name, location, created_by)
        SELECT 'announcements', 'Announcements - ' || loc, loc, null
        WHERE NOT EXISTS (
          SELECT 1 FROM chats 
          WHERE type = 'announcements' AND location = loc
        );
      EXCEPTION WHEN OTHERS THEN
        error_context := format('Error creating chats for location %s: %s', loc, SQLERRM);
        RAISE WARNING '%', error_context;
      END;
    END LOOP;
    
    -- Auto-join user to all global and announcement chats
    BEGIN
      INSERT INTO chat_participants (chat_id, user_id, role)
      SELECT c.id, auth.uid(), 'member'
      FROM chats c
      WHERE c.type IN ('global', 'announcements')
      AND c.location IN ('menton', 'lyon')
      ON CONFLICT (chat_id, user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error auto-joining user % to all_locations chats: %', auth.uid(), SQLERRM;
    END;
    
  ELSIF current_user_location IN ('menton', 'lyon') THEN
    -- For location-specific users, create chats for their location only
    BEGIN
      -- Create global chat if it doesn't exist
      INSERT INTO chats (type, name, location, created_by)
      SELECT 'global', 'General Discussion - ' || current_user_location, current_user_location, null
      WHERE NOT EXISTS (
        SELECT 1 FROM chats 
        WHERE type = 'global' AND location = current_user_location
      );
      
      -- Create announcements chat if it doesn't exist
      INSERT INTO chats (type, name, location, created_by)
      SELECT 'announcements', 'Announcements - ' || current_user_location, current_user_location, null
      WHERE NOT EXISTS (
        SELECT 1 FROM chats 
        WHERE type = 'announcements' AND location = current_user_location
      );
    EXCEPTION WHEN OTHERS THEN
      error_context := format('Error creating chats for user location %s: %s', current_user_location, SQLERRM);
      RAISE WARNING '%', error_context;
    END;
    
    -- Auto-join user to their location's chats
    BEGIN
      INSERT INTO chat_participants (chat_id, user_id, role)
      SELECT c.id, auth.uid(), 'member'
      FROM chats c
      WHERE c.type IN ('global', 'announcements') 
      AND c.location = current_user_location
      ON CONFLICT (chat_id, user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error auto-joining user % to location %s chats: %s', auth.uid(), current_user_location, SQLERRM;
    END;
  END IF;
END;
$$;

-- Improve the auto_join_location_chats trigger function with better error handling
CREATE OR REPLACE FUNCTION public.auto_join_location_chats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  locations_to_join TEXT[];
  loc TEXT;
  error_context TEXT;
BEGIN
  -- Determine locations to join based on user's location
  IF NEW.location = 'all_locations' THEN
    locations_to_join := ARRAY['menton', 'lyon'];
  ELSIF NEW.location IN ('menton', 'lyon') THEN
    locations_to_join := ARRAY[NEW.location];
  ELSE
    -- Unknown location, log warning and skip
    RAISE WARNING 'Unknown location % for user %', NEW.location, NEW.user_id;
    RETURN NEW;
  END IF;
  
  -- Loop through each location to join
  FOREACH loc IN ARRAY locations_to_join
  LOOP
    BEGIN
      -- Ensure chats exist for this location first
      INSERT INTO chats (type, name, location, created_by)
      SELECT 'global', 'General Discussion - ' || loc, loc, null
      WHERE NOT EXISTS (
        SELECT 1 FROM chats 
        WHERE type = 'global' AND location = loc
      );
      
      INSERT INTO chats (type, name, location, created_by)
      SELECT 'announcements', 'Announcements - ' || loc, loc, null
      WHERE NOT EXISTS (
        SELECT 1 FROM chats 
        WHERE type = 'announcements' AND location = loc
      );
      
      -- Auto-join user to chats for this location
      INSERT INTO chat_participants (chat_id, user_id, role)
      SELECT c.id, NEW.user_id, 'member'
      FROM chats c
      WHERE c.type IN ('global', 'announcements') 
      AND c.location = loc
      ON CONFLICT (chat_id, user_id) DO NOTHING;
      
    EXCEPTION WHEN OTHERS THEN
      error_context := format('Error auto-joining user % to location %s chats: %s', NEW.user_id, loc, SQLERRM);
      RAISE WARNING '%', error_context;
    END;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Execute the backfill function to fix existing users
SELECT * FROM public.backfill_user_chat_memberships();

-- Create validation function to check system health
CREATE OR REPLACE FUNCTION public.validate_chat_system_health()
RETURNS TABLE(
  check_name text,
  status text,
  details text,
  user_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check 1: Users without any chat memberships
  RETURN QUERY
  SELECT 
    'Users without chat memberships'::text,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
    format('%s users found without any chat memberships', COUNT(*))::text,
    COUNT(*)::integer
  FROM profiles p
  WHERE p.status = 'active' 
  AND p.user_id IS NOT NULL
  AND p.location IN ('menton', 'lyon', 'all_locations')
  AND NOT EXISTS (
    SELECT 1 FROM chat_participants cp 
    WHERE cp.user_id = p.user_id
  );
  
  -- Check 2: Users missing global chat memberships for their location
  RETURN QUERY
  SELECT 
    'Users missing global chats'::text,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
    format('%s users missing global chat memberships for their location', COUNT(*))::text,
    COUNT(*)::integer
  FROM profiles p
  WHERE p.status = 'active' 
  AND p.user_id IS NOT NULL
  AND p.location IN ('menton', 'lyon')
  AND NOT EXISTS (
    SELECT 1 FROM chat_participants cp 
    JOIN chats c ON cp.chat_id = c.id
    WHERE cp.user_id = p.user_id 
    AND c.type = 'global' 
    AND c.location = p.location
  );
  
  -- Check 3: Users missing announcement chat memberships for their location
  RETURN QUERY
  SELECT 
    'Users missing announcement chats'::text,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
    format('%s users missing announcement chat memberships for their location', COUNT(*))::text,
    COUNT(*)::integer
  FROM profiles p
  WHERE p.status = 'active' 
  AND p.user_id IS NOT NULL
  AND p.location IN ('menton', 'lyon')
  AND NOT EXISTS (
    SELECT 1 FROM chat_participants cp 
    JOIN chats c ON cp.chat_id = c.id
    WHERE cp.user_id = p.user_id 
    AND c.type = 'announcements' 
    AND c.location = p.location
  );
  
  -- Check 4: all_locations users missing any location chats
  RETURN QUERY
  SELECT 
    'All-locations users missing chats'::text,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
    format('%s all_locations users missing some location chats', COUNT(*))::text,
    COUNT(*)::integer
  FROM profiles p
  WHERE p.status = 'active' 
  AND p.user_id IS NOT NULL
  AND p.location = 'all_locations'
  AND (
    NOT EXISTS (
      SELECT 1 FROM chat_participants cp 
      JOIN chats c ON cp.chat_id = c.id
      WHERE cp.user_id = p.user_id 
      AND c.type = 'global' 
      AND c.location = 'menton'
    )
    OR NOT EXISTS (
      SELECT 1 FROM chat_participants cp 
      JOIN chats c ON cp.chat_id = c.id
      WHERE cp.user_id = p.user_id 
      AND c.type = 'global' 
      AND c.location = 'lyon'
    )
    OR NOT EXISTS (
      SELECT 1 FROM chat_participants cp 
      JOIN chats c ON cp.chat_id = c.id
      WHERE cp.user_id = p.user_id 
      AND c.type = 'announcements' 
      AND c.location = 'menton'
    )
    OR NOT EXISTS (
      SELECT 1 FROM chat_participants cp 
      JOIN chats c ON cp.chat_id = c.id
      WHERE cp.user_id = p.user_id 
      AND c.type = 'announcements' 
      AND c.location = 'lyon'
    )
  );
  
  -- Check 5: Missing global or announcement chats for locations
  RETURN QUERY
  SELECT 
    'Missing required chats'::text,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
    format('%s required chats missing', COUNT(*))::text,
    COUNT(*)::integer
  FROM (
    SELECT 'global' as chat_type, 'menton' as location
    UNION SELECT 'global', 'lyon'
    UNION SELECT 'announcements', 'menton'  
    UNION SELECT 'announcements', 'lyon'
  ) required_chats
  WHERE NOT EXISTS (
    SELECT 1 FROM chats c
    WHERE c.type = required_chats.chat_type::chat_type 
    AND c.location = required_chats.location
  );
END;
$$;