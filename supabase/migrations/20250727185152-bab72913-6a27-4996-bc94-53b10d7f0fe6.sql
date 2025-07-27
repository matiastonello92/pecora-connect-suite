-- Fix the ensure_default_chats function to call auto_join properly for current user
SELECT ensure_default_chats();

-- Trigger auto_join for existing users to make sure they're connected to all default chats
SELECT auto_join_location_chats();