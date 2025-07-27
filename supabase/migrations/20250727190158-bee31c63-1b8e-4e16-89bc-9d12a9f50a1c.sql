-- Auto-join existing users to their location's default chats
-- This ensures users see global and announcement chats

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

-- For users with all_locations access, join them to all global and announcement chats
INSERT INTO chat_participants (chat_id, user_id, role)
SELECT c.id, p.user_id, 'member'
FROM chats c
CROSS JOIN profiles p
WHERE c.type IN ('global', 'announcements')
  AND p.location = 'all_locations'
  AND NOT EXISTS (
    SELECT 1 FROM chat_participants cp 
    WHERE cp.chat_id = c.id AND cp.user_id = p.user_id
  );