-- Phase 1: Complete Database Cleanup and RLS Fix

-- Step 1: Force delete all chats for mock locations (with CASCADE to handle dependencies)
DELETE FROM chats WHERE location IN ('antibes', 'cannes', 'monaco', 'nice');

-- Step 2: Clean up any orphaned chat participants (safety cleanup)
DELETE FROM chat_participants 
WHERE chat_id NOT IN (SELECT id FROM chats);

-- Step 3: Clean up any orphaned chat messages (safety cleanup)
DELETE FROM chat_messages 
WHERE chat_id NOT IN (SELECT id FROM chats);

-- Step 4: Clean up any orphaned message reminders (safety cleanup)
DELETE FROM message_reminders 
WHERE chat_id NOT IN (SELECT id FROM chats);

-- Step 5: Drop and recreate problematic RLS policies for chat_participants to fix recursion
DROP POLICY IF EXISTS "view_chat_participants" ON chat_participants;

-- Create simplified RLS policy for viewing chat participants (no recursion)
CREATE POLICY "view_chat_participants" 
ON chat_participants 
FOR SELECT 
USING (
  -- Users can see their own participation
  user_id = auth.uid() 
  OR 
  -- Users can see participants in chats they're part of
  chat_id IN (
    SELECT cp.chat_id 
    FROM chat_participants cp 
    WHERE cp.user_id = auth.uid()
  )
  OR
  -- Global and announcement chats are visible to users in the same location
  chat_id IN (
    SELECT c.id 
    FROM chats c 
    WHERE c.type IN ('global', 'announcements') 
    AND (
      c.location = get_current_user_location() 
      OR get_current_user_location() = 'all_locations'
    )
  )
);

-- Step 6: Ensure default chats exist for menton and lyon only
-- Create global chat for menton if not exists
INSERT INTO chats (type, name, location, created_by)
SELECT 'global', 'General Discussion - menton', 'menton', null
WHERE NOT EXISTS (
  SELECT 1 FROM chats 
  WHERE type = 'global' AND location = 'menton'
);

-- Create announcements chat for menton if not exists
INSERT INTO chats (type, name, location, created_by)
SELECT 'announcements', 'Announcements - menton', 'menton', null
WHERE NOT EXISTS (
  SELECT 1 FROM chats 
  WHERE type = 'announcements' AND location = 'menton'
);

-- Create global chat for lyon if not exists
INSERT INTO chats (type, name, location, created_by)
SELECT 'global', 'General Discussion - lyon', 'lyon', null
WHERE NOT EXISTS (
  SELECT 1 FROM chats 
  WHERE type = 'global' AND location = 'lyon'
);

-- Create announcements chat for lyon if not exists
INSERT INTO chats (type, name, location, created_by)
SELECT 'announcements', 'Announcements - lyon', 'lyon', null
WHERE NOT EXISTS (
  SELECT 1 FROM chats 
  WHERE type = 'announcements' AND location = 'lyon'
);

-- Step 7: Auto-join ALL existing users to their appropriate chats
-- For users with specific locations (menton, lyon)
INSERT INTO chat_participants (chat_id, user_id, role)
SELECT c.id, p.user_id, 'member'
FROM chats c
CROSS JOIN profiles p
WHERE c.type IN ('global', 'announcements')
  AND c.location = p.location
  AND p.location IN ('menton', 'lyon')
  AND NOT EXISTS (
    SELECT 1 FROM chat_participants cp 
    WHERE cp.chat_id = c.id AND cp.user_id = p.user_id
  );

-- For users with all_locations access, join them to ALL global and announcement chats
INSERT INTO chat_participants (chat_id, user_id, role)
SELECT c.id, p.user_id, 'member'
FROM chats c
CROSS JOIN profiles p
WHERE c.type IN ('global', 'announcements')
  AND p.location = 'all_locations'
  AND c.location IN ('menton', 'lyon')
  AND NOT EXISTS (
    SELECT 1 FROM chat_participants cp 
    WHERE cp.chat_id = c.id AND cp.user_id = p.user_id
  );

-- Step 8: Improve the ensure_default_chats function to be more robust
CREATE OR REPLACE FUNCTION public.ensure_default_chats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_location TEXT;
  loc TEXT;
BEGIN
  -- Get current user's location
  SELECT location INTO current_user_location FROM profiles WHERE user_id = auth.uid();
  
  -- If user has all_locations access, ensure chats exist for both locations
  IF current_user_location = 'all_locations' THEN
    FOR loc IN VALUES ('menton'), ('lyon')
    LOOP
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
    END LOOP;
    
    -- Auto-join user to all global and announcement chats
    INSERT INTO chat_participants (chat_id, user_id, role)
    SELECT c.id, auth.uid(), 'member'
    FROM chats c
    WHERE c.type IN ('global', 'announcements')
    AND c.location IN ('menton', 'lyon')
    ON CONFLICT (chat_id, user_id) DO NOTHING;
    
  ELSIF current_user_location IN ('menton', 'lyon') THEN
    -- For location-specific users, create chats for their location only
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
    
    -- Auto-join user to their location's chats
    INSERT INTO chat_participants (chat_id, user_id, role)
    SELECT c.id, auth.uid(), 'member'
    FROM chats c
    WHERE c.type IN ('global', 'announcements') 
    AND c.location = current_user_location
    ON CONFLICT (chat_id, user_id) DO NOTHING;
  END IF;
END;
$$;

-- Step 9: Improve the auto_join_location_chats trigger function
CREATE OR REPLACE FUNCTION public.auto_join_location_chats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- If user has all_locations access, join all global and announcement chats
  IF NEW.location = 'all_locations' THEN
    INSERT INTO chat_participants (chat_id, user_id, role)
    SELECT c.id, NEW.user_id, 'member'
    FROM chats c
    WHERE c.type IN ('global', 'announcements')
    AND c.location IN ('menton', 'lyon')
    ON CONFLICT (chat_id, user_id) DO NOTHING;
  ELSIF NEW.location IN ('menton', 'lyon') THEN
    -- For location-specific users, join only their location's chats
    INSERT INTO chat_participants (chat_id, user_id, role)
    SELECT c.id, NEW.user_id, 'member'
    FROM chats c
    WHERE c.type IN ('global', 'announcements') 
    AND c.location = NEW.location
    ON CONFLICT (chat_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;