-- Fix infinite recursion in chat_participants policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "view_chat_participants" ON chat_participants;
DROP POLICY IF EXISTS "view_own_participation" ON chat_participants;

-- Create new secure policies using security definer functions
CREATE POLICY "view_chat_participants" ON chat_participants
FOR SELECT USING (
  -- User is a participant in the chat
  user_id = auth.uid() OR
  -- User can see participants in chats they're part of
  chat_id IN (
    SELECT cp.chat_id 
    FROM chat_participants cp 
    WHERE cp.user_id = auth.uid()
  ) OR
  -- User can see global/announcement chat participants for their location
  chat_id IN (
    SELECT c.id 
    FROM chats c 
    WHERE c.type IN ('global', 'announcements') 
    AND (
      c.location = get_current_user_location() OR 
      get_current_user_location() = 'all_locations'
    )
  )
);

-- Create function to get current user's location safely
CREATE OR REPLACE FUNCTION get_current_user_location()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(location, 'unknown') FROM profiles WHERE user_id = auth.uid();
$$;

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
  global_chat_id UUID;
  announcement_chat_id UUID;
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

-- Create missing message_reminders table with proper foreign keys
CREATE TABLE IF NOT EXISTS message_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, chat_id, message_id)
);

-- Enable RLS on message_reminders
ALTER TABLE message_reminders ENABLE ROW LEVEL SECURITY;

-- Add policies for message_reminders
CREATE POLICY "Users can view their own reminders" ON message_reminders
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage reminders" ON message_reminders
FOR ALL USING (true);

-- Update chats visibility policy for all_locations users
DROP POLICY IF EXISTS "Users can view chats they participate in" ON chats;
CREATE POLICY "Users can view chats they participate in" ON chats
FOR SELECT USING (
  -- User is a participant in the chat
  EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_id = chats.id AND user_id = auth.uid()
  ) OR
  -- Global and announcement chats are visible to users in same location or all_locations users
  (
    type IN ('global', 'announcements') AND (
      location = get_current_user_location() OR 
      get_current_user_location() = 'all_locations'
    )
  )
);