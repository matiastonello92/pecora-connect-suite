-- Ensure default chats are created and users are added to them
SELECT ensure_default_chats();

-- Add current users to their location chats
INSERT INTO chat_participants (chat_id, user_id, role)
SELECT 
    c.id,
    p.user_id,
    'member'
FROM chats c
CROSS JOIN profiles p
WHERE c.type IN ('global', 'announcements') 
AND c.location = p.location
AND NOT EXISTS (
    SELECT 1 FROM chat_participants cp 
    WHERE cp.chat_id = c.id AND cp.user_id = p.user_id
);