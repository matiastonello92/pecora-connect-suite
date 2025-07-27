-- Call ensure_default_chats() to create default chats and auto-join users
SELECT ensure_default_chats();

-- Also manually join existing users to all global and announcement chats based on their location access
DO $$
DECLARE
  user_rec RECORD;
BEGIN
  -- For each active user profile, ensure they're joined to appropriate chats
  FOR user_rec IN 
    SELECT user_id, location 
    FROM profiles 
    WHERE status = 'active'
  LOOP
    -- If user has all_locations access, join all global and announcement chats
    IF user_rec.location = 'all_locations' THEN
      INSERT INTO chat_participants (chat_id, user_id, role)
      SELECT c.id, user_rec.user_id, 'member'
      FROM chats c
      WHERE c.type IN ('global', 'announcements')
      ON CONFLICT (chat_id, user_id) DO NOTHING;
    ELSE
      -- For location-specific users, join only their location's chats
      INSERT INTO chat_participants (chat_id, user_id, role)
      SELECT c.id, user_rec.user_id, 'member'
      FROM chats c
      WHERE c.type IN ('global', 'announcements') AND c.location = user_rec.location
      ON CONFLICT (chat_id, user_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;