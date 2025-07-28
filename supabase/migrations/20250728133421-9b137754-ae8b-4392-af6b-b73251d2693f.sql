-- Fix infinite recursion in chat system RLS policies

-- Step 1: Create security definer functions to break circular dependencies

-- Function to get chat IDs that a user participates in
CREATE OR REPLACE FUNCTION public.get_user_chat_ids(user_uuid uuid DEFAULT NULL::uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT ARRAY_AGG(chat_id) 
  FROM chat_participants 
  WHERE user_id = COALESCE(user_uuid, auth.uid());
$function$;

-- Function to check if user can access a specific chat
CREATE OR REPLACE FUNCTION public.user_can_access_chat(chat_uuid uuid, user_uuid uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_user_id uuid := COALESCE(user_uuid, auth.uid());
  chat_info RECORD;
  user_locations text[];
BEGIN
  -- Get chat information
  SELECT * INTO chat_info FROM chats WHERE id = chat_uuid;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- For global and announcements chats, check location access
  IF chat_info.type IN ('global', 'announcements') THEN
    SELECT get_current_user_locations() INTO user_locations;
    RETURN chat_info.location = ANY(user_locations);
  END IF;
  
  -- For other chat types, check direct participation
  RETURN EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_id = chat_uuid AND user_id = target_user_id
  );
END;
$function$;

-- Step 2: Drop existing problematic policies
DROP POLICY IF EXISTS "view_chat_members" ON chat_participants;
DROP POLICY IF EXISTS "manage_own_participation" ON chat_participants;
DROP POLICY IF EXISTS "view_own_participation" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_select_simple" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_insert_simple" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_update_simple" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_delete_simple" ON chat_participants;

-- Step 3: Create new simplified policies for chat_participants
CREATE POLICY "users_can_view_accessible_chat_participants"
ON chat_participants FOR SELECT
USING (user_can_access_chat(chat_id, auth.uid()));

CREATE POLICY "users_can_manage_own_participation"
ON chat_participants FOR ALL
USING (user_id = auth.uid());

-- Step 4: Update chats policies to use security definer functions
DROP POLICY IF EXISTS "Users can view chats they participate in" ON chats;

CREATE POLICY "users_can_view_accessible_chats"
ON chats FOR SELECT
USING (
  user_can_access_chat(id, auth.uid()) OR
  (type IN ('global', 'announcements') AND location = ANY(get_current_user_locations()))
);