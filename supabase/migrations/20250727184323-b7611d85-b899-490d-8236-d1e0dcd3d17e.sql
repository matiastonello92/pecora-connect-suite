-- Fix ensure_default_chats function to work with all_locations users
CREATE OR REPLACE FUNCTION ensure_default_chats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  loc TEXT;
  current_user_location TEXT;
BEGIN
  -- Get current user's location
  SELECT location INTO current_user_location FROM profiles WHERE user_id = auth.uid();
  
  -- If user has all_locations access, ensure chats exist for all locations
  IF current_user_location = 'all_locations' THEN
    FOR loc IN VALUES ('menton'), ('lyon'), ('monaco'), ('nice'), ('cannes'), ('antibes')
    LOOP
      -- Create global chat if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM chats 
        WHERE type = 'global' AND location = loc
      ) THEN
        INSERT INTO chats (type, name, location, created_by)
        VALUES ('global', 'General Discussion - ' || loc, loc, null);
      END IF;
      
      -- Create announcements chat if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM chats 
        WHERE type = 'announcements' AND location = loc
      ) THEN
        INSERT INTO chats (type, name, location, created_by)
        VALUES ('announcements', 'Announcements - ' || loc, loc, null);
      END IF;
    END LOOP;
    
    -- Auto-join user to all global and announcement chats
    INSERT INTO chat_participants (chat_id, user_id, role)
    SELECT c.id, auth.uid(), 'member'
    FROM chats c
    WHERE c.type IN ('global', 'announcements')
    ON CONFLICT (chat_id, user_id) DO NOTHING;
    
  ELSE
    -- For location-specific users, create chats for their location only
    FOR loc IN SELECT DISTINCT location FROM profiles WHERE location != 'all_locations' AND location = current_user_location
    LOOP
      -- Create global chat if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM chats 
        WHERE type = 'global' AND location = loc
      ) THEN
        INSERT INTO chats (type, name, location, created_by)
        VALUES ('global', 'General Discussion - ' || loc, loc, null);
      END IF;
      
      -- Create announcements chat if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM chats 
        WHERE type = 'announcements' AND location = loc
      ) THEN
        INSERT INTO chats (type, name, location, created_by)
        VALUES ('announcements', 'Announcements - ' || loc, loc, null);
      END IF;
      
      -- Auto-join user to their location's chats
      INSERT INTO chat_participants (chat_id, user_id, role)
      SELECT c.id, auth.uid(), 'member'
      FROM chats c
      WHERE c.type IN ('global', 'announcements') AND c.location = loc
      ON CONFLICT (chat_id, user_id) DO NOTHING;
    END LOOP;
  END IF;
END;
$$;

-- Fix auto_join_location_chats function
CREATE OR REPLACE FUNCTION auto_join_location_chats()
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
    ON CONFLICT (chat_id, user_id) DO NOTHING;
  ELSE
    -- For location-specific users, join only their location's chats
    INSERT INTO chat_participants (chat_id, user_id, role)
    SELECT c.id, NEW.user_id, 'member'
    FROM chats c
    WHERE c.type IN ('global', 'announcements') AND c.location = NEW.location
    ON CONFLICT (chat_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;