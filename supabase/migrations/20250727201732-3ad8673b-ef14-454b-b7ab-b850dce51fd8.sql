-- Add a test location "paris" to demonstrate dynamic location support
INSERT INTO locations (code, name, is_active) 
VALUES ('paris', 'Paris', true)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, is_active = EXCLUDED.is_active;

-- Ensure default chats exist for all locations including the new one
SELECT * FROM ensure_chats_for_all_locations();