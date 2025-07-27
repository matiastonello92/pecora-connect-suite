-- Clean up mock location data - keep only menton and lyon

-- Delete chat participants for mock location chats first (to avoid foreign key issues)
DELETE FROM chat_participants 
WHERE chat_id IN (
  SELECT id FROM chats 
  WHERE location IN ('monaco', 'nice', 'cannes', 'antibes')
);

-- Delete chats for mock locations
DELETE FROM chats 
WHERE location IN ('monaco', 'nice', 'cannes', 'antibes');

-- Delete any other records with mock locations
DELETE FROM equipment WHERE location IN ('monaco', 'nice', 'cannes', 'antibes');
DELETE FROM suppliers WHERE location IN ('monaco', 'nice', 'cannes', 'antibes');
DELETE FROM cash_closures WHERE location IN ('monaco', 'nice', 'cannes', 'antibes');
DELETE FROM monthly_inventories WHERE location IN ('monaco', 'nice', 'cannes', 'antibes');
DELETE FROM checklist_templates WHERE location IN ('monaco', 'nice', 'cannes', 'antibes');
DELETE FROM checklist_sessions WHERE location IN ('monaco', 'nice', 'cannes', 'antibes');
DELETE FROM orders WHERE location IN ('monaco', 'nice', 'cannes', 'antibes');
DELETE FROM kitchen_products WHERE location IN ('monaco', 'nice', 'cannes', 'antibes');
DELETE FROM messages WHERE location IN ('monaco', 'nice', 'cannes', 'antibes');
DELETE FROM notifications WHERE location IN ('monaco', 'nice', 'cannes', 'antibes');

-- Update any users with mock locations to have valid locations
UPDATE profiles SET location = 'menton' WHERE location IN ('monaco', 'nice', 'cannes', 'antibes');
UPDATE user_invitations SET location = 'menton' WHERE location IN ('monaco', 'nice', 'cannes', 'antibes');
UPDATE archived_users SET location = 'menton' WHERE location IN ('monaco', 'nice', 'cannes', 'antibes');

-- Ensure default chats exist for both valid locations
INSERT INTO chats (type, name, location, created_by)
SELECT 'global', 'General Discussion - ' || loc, loc, null
FROM unnest(ARRAY['menton', 'lyon']) as loc
WHERE NOT EXISTS (
  SELECT 1 FROM chats 
  WHERE type = 'global' AND location = loc
);

INSERT INTO chats (type, name, location, created_by)
SELECT 'announcements', 'Announcements - ' || loc, loc, null
FROM unnest(ARRAY['menton', 'lyon']) as loc
WHERE NOT EXISTS (
  SELECT 1 FROM chats 
  WHERE type = 'announcements' AND location = loc
);