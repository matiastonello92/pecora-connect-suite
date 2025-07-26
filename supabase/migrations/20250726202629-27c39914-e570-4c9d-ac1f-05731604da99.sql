-- Fix security warnings by setting search path for functions
CREATE OR REPLACE FUNCTION create_private_chat(other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  chat_id UUID;
  current_user_location TEXT;
BEGIN
  -- Get current user's location
  SELECT location INTO current_user_location
  FROM profiles WHERE user_id = auth.uid();
  
  -- Check if connection exists and is accepted
  IF NOT EXISTS (
    SELECT 1 FROM connection_requests 
    WHERE ((requester_id = auth.uid() AND recipient_id = other_user_id) OR
           (requester_id = other_user_id AND recipient_id = auth.uid()))
    AND status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'Connection not established';
  END IF;
  
  -- Check if private chat already exists
  SELECT c.id INTO chat_id
  FROM chats c
  JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = auth.uid()
  JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = other_user_id
  WHERE c.type = 'private'
  LIMIT 1;
  
  IF chat_id IS NOT NULL THEN
    RETURN chat_id;
  END IF;
  
  -- Create new private chat
  INSERT INTO chats (type, location, created_by)
  VALUES ('private', current_user_location, auth.uid())
  RETURNING id INTO chat_id;
  
  -- Add participants
  INSERT INTO chat_participants (chat_id, user_id, role)
  VALUES 
    (chat_id, auth.uid(), 'admin'),
    (chat_id, other_user_id, 'member');
  
  RETURN chat_id;
END;
$$;

CREATE OR REPLACE FUNCTION ensure_default_chats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  loc TEXT;
  global_chat_id UUID;
  announcement_chat_id UUID;
BEGIN
  FOR loc IN SELECT DISTINCT location FROM profiles WHERE location != 'all_locations'
  LOOP
    -- Create global chat if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM chats 
      WHERE type = 'global' AND location = loc
    ) THEN
      INSERT INTO chats (type, name, location, created_by)
      VALUES ('global', 'General Discussion - ' || loc, loc, null)
      RETURNING id INTO global_chat_id;
    END IF;
    
    -- Create announcements chat if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM chats 
      WHERE type = 'announcements' AND location = loc
    ) THEN
      INSERT INTO chats (type, name, location, created_by)
      VALUES ('announcements', 'Announcements - ' || loc, loc, null)
      RETURNING id INTO announcement_chat_id;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION auto_join_location_chats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  global_chat_id UUID;
  announcement_chat_id UUID;
BEGIN
  -- Get global chat for user's location
  SELECT id INTO global_chat_id
  FROM chats 
  WHERE type = 'global' AND location = NEW.location;
  
  -- Get announcement chat for user's location
  SELECT id INTO announcement_chat_id
  FROM chats 
  WHERE type = 'announcements' AND location = NEW.location;
  
  -- Add user to global chat
  IF global_chat_id IS NOT NULL THEN
    INSERT INTO chat_participants (chat_id, user_id)
    VALUES (global_chat_id, NEW.user_id)
    ON CONFLICT (chat_id, user_id) DO NOTHING;
  END IF;
  
  -- Add user to announcements chat
  IF announcement_chat_id IS NOT NULL THEN
    INSERT INTO chat_participants (chat_id, user_id)
    VALUES (announcement_chat_id, NEW.user_id)
    ON CONFLICT (chat_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE chats 
  SET last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  
  RETURN NEW;
END;
$$;