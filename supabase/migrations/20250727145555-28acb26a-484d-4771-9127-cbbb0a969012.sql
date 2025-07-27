-- First, let's check what triggers exist that might be recreating users
SELECT trigger_name, event_manipulation, event_object_table, action_statement 
FROM information_schema.triggers 
WHERE event_object_schema = 'public' 
AND (event_object_table = 'profiles' OR event_object_table = 'user_invitations' OR event_object_table = 'archived_users');

-- Check if there are any functions that auto-create users
SELECT proname, prosrc 
FROM pg_proc 
WHERE prosrc LIKE '%profiles%' OR prosrc LIKE '%invitation%';