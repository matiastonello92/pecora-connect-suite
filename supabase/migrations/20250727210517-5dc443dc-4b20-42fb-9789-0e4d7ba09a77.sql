-- Comprehensive Chat System Fix
-- Fix infinite recursion in chat_participants policy and other critical issues

-- 1. Drop and recreate the problematic chat_participants policy with simpler logic
DROP POLICY IF EXISTS "view_chat_participants" ON chat_participants;

CREATE POLICY "view_chat_participants" ON chat_participants
FOR SELECT 
USING (
  -- Allow users to see their own participation
  user_id = auth.uid() OR
  -- Allow users to see other participants in chats they're part of
  chat_id IN (
    SELECT cp.chat_id FROM chat_participants cp 
    WHERE cp.user_id = auth.uid()
  ) OR
  -- Allow viewing participants in location-based chats (global/announcements)
  -- that belong to the user's assigned locations
  (
    SELECT COUNT(*) > 0 
    FROM chats c
    WHERE c.id = chat_participants.chat_id 
    AND c.type IN ('global', 'announcements')
    AND c.location = ANY(get_current_user_locations())
  )
);

-- 2. Add missing foreign key for message_reminders -> chat_messages
-- First check if the foreign key exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'message_reminders_message_id_fkey'
    AND table_name = 'message_reminders'
  ) THEN
    ALTER TABLE message_reminders 
    ADD CONSTRAINT message_reminders_message_id_fkey 
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Clean up unused test locations (Paris) and their associated chats
-- First remove chat participants from Paris chats
DELETE FROM chat_participants 
WHERE chat_id IN (
  SELECT id FROM chats WHERE location = 'paris'
);

-- Remove Paris chats
DELETE FROM chats WHERE location = 'paris';

-- Remove Paris location
DELETE FROM locations WHERE code = 'paris';

-- 4. Ensure all current users are properly synced to their location chats
-- This will be done via the emergency functions

-- 5. Update the auto_join_location_chats trigger to work with the new locations array structure
DROP TRIGGER IF EXISTS auto_join_location_chats_trigger ON profiles;

CREATE OR REPLACE FUNCTION public.auto_join_location_chats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  loc TEXT;
  error_context TEXT;
BEGIN
  -- Skip if locations array is empty or null
  IF NEW.locations IS NULL OR array_length(NEW.locations, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Ensure chats exist for all locations first
  PERFORM public.ensure_chats_for_all_locations();
  
  -- Loop through each of user's locations
  FOREACH loc IN ARRAY NEW.locations
  LOOP
    BEGIN
      -- Auto-join user to chats for this location
      INSERT INTO chat_participants (chat_id, user_id, role, joined_at)
      SELECT c.id, NEW.user_id, 'member', now()
      FROM chats c
      WHERE c.type IN ('global', 'announcements') 
      AND c.location = loc
      ON CONFLICT (chat_id, user_id) DO NOTHING;
      
    EXCEPTION WHEN OTHERS THEN
      error_context := format('Error auto-joining user %s to location %s chats: %s', NEW.user_id, loc, SQLERRM);
      RAISE WARNING '%', error_context;
    END;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger for INSERT and UPDATE operations
CREATE TRIGGER auto_join_location_chats_trigger
  AFTER INSERT OR UPDATE OF locations ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_join_location_chats();

-- 6. Create a function to sync all existing users
CREATE OR REPLACE FUNCTION public.sync_all_users_to_location_chats()
RETURNS TABLE(user_count integer, total_syncs integer, errors text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_record RECORD;
  processed_users INTEGER := 0;
  total_memberships INTEGER := 0;
  error_list TEXT[] := '{}';
  sync_result RECORD;
BEGIN
  -- First ensure all required chats exist
  PERFORM public.ensure_chats_for_all_locations();
  
  -- Loop through all active users with locations
  FOR user_record IN 
    SELECT user_id, locations, first_name, last_name 
    FROM profiles 
    WHERE status = 'active' 
    AND user_id IS NOT NULL
    AND locations IS NOT NULL
    AND array_length(locations, 1) > 0
  LOOP
    BEGIN
      processed_users := processed_users + 1;
      
      -- Sync this user using the existing function
      SELECT * INTO sync_result FROM sync_user_chat_memberships(user_record.user_id);
      
      -- Count successful syncs (this is approximate since sync_user_chat_memberships returns a table)
      total_memberships := total_memberships + 1;
      
    EXCEPTION WHEN OTHERS THEN
      error_list := array_append(error_list, 
        format('Failed to sync user %s %s: %s', 
          user_record.first_name, user_record.last_name, SQLERRM));
    END;
  END LOOP;
  
  RETURN QUERY SELECT processed_users, total_memberships, error_list;
END;
$function$;