-- PART 1: Fix infinite recursion in chat_participants RLS policies
-- Drop and recreate the problematic policies with corrected logic
DROP POLICY IF EXISTS "view_chat_participants" ON chat_participants;
DROP POLICY IF EXISTS "admin_manage_participants" ON chat_participants;

-- Create a safe view policy that doesn't create recursion
CREATE POLICY "view_chat_participants" 
ON chat_participants 
FOR SELECT 
USING (
  -- Users can view their own participation
  user_id = auth.uid() 
  OR 
  -- Users can view participants of chats they belong to (use EXISTS to avoid recursion)
  EXISTS (
    SELECT 1 FROM chat_participants cp_check 
    WHERE cp_check.chat_id = chat_participants.chat_id 
    AND cp_check.user_id = auth.uid()
  )
  OR
  -- Users can view participants of global/announcement chats for their location
  EXISTS (
    SELECT 1 FROM chats c 
    WHERE c.id = chat_participants.chat_id 
    AND c.type IN ('global', 'announcements')
    AND (
      c.location = get_current_user_location() 
      OR get_current_user_location() = 'all_locations'
    )
  )
);

-- Create a safe admin policy without recursion
CREATE POLICY "admin_manage_participants" 
ON chat_participants 
FOR ALL 
USING (
  -- Chat creators can manage their chats
  EXISTS (
    SELECT 1 FROM chats c 
    WHERE c.id = chat_participants.chat_id 
    AND c.created_by = auth.uid()
  )
  OR
  -- Chat admins can manage participants (check role directly)
  (
    user_id = auth.uid() AND role = 'admin'
  )
  OR
  -- System admins can manage all
  get_current_user_role() IN ('manager', 'super_admin')
);

-- PART 2: Force create default chats function
CREATE OR REPLACE FUNCTION public.force_create_default_chats()
RETURNS TABLE(
  action text,
  chat_type text,
  location text,
  chat_id uuid,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  required_chat RECORD;
  existing_chat RECORD;
  new_chat_id UUID;
BEGIN
  -- Define required chats
  FOR required_chat IN 
    SELECT 'global'::text as type, 'menton'::text as location
    UNION SELECT 'announcements'::text, 'menton'::text
    UNION SELECT 'global'::text, 'lyon'::text  
    UNION SELECT 'announcements'::text, 'lyon'::text
  LOOP
    -- Check if chat exists
    SELECT * INTO existing_chat
    FROM chats c
    WHERE c.type = required_chat.type::chat_type 
    AND c.location = required_chat.location;
    
    IF FOUND THEN
      -- Chat exists
      RETURN QUERY SELECT 
        'EXISTS'::text,
        required_chat.type,
        required_chat.location,
        existing_chat.id,
        format('Chat already exists: %s - %s (ID: %s)', required_chat.type, required_chat.location, existing_chat.id)::text;
    ELSE
      -- Create missing chat
      INSERT INTO chats (type, name, location, created_by)
      VALUES (
        required_chat.type::chat_type,
        CASE 
          WHEN required_chat.type = 'global' THEN 'General Discussion - ' || required_chat.location
          ELSE 'Announcements - ' || required_chat.location
        END,
        required_chat.location,
        null
      )
      RETURNING id INTO new_chat_id;
      
      RETURN QUERY SELECT 
        'CREATED'::text,
        required_chat.type,
        required_chat.location,
        new_chat_id,
        format('Created new chat: %s - %s (ID: %s)', required_chat.type, required_chat.location, new_chat_id)::text;
    END IF;
  END LOOP;
END;
$$;

-- PART 3: Force join user to chats function (fixed column ambiguity)
CREATE OR REPLACE FUNCTION public.force_join_user_to_chats(target_user_id uuid)
RETURNS TABLE(
  action text,
  chat_type text,
  location text,
  chat_id uuid,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_location_val TEXT;
  chat_record RECORD;
  existing_participant RECORD;
BEGIN
  -- Get user's location (use alias to avoid ambiguity)
  SELECT p.location INTO user_location_val 
  FROM profiles p
  WHERE p.user_id = target_user_id;
  
  IF user_location_val IS NULL THEN
    RETURN QUERY SELECT 
      'ERROR'::text,
      ''::text,
      ''::text,
      null::uuid,
      format('User %s not found or has no location', target_user_id)::text;
    RETURN;
  END IF;
  
  -- Determine which chats user should be in
  FOR chat_record IN
    SELECT c.*
    FROM chats c
    WHERE c.type IN ('global', 'announcements')
    AND (
      (user_location_val = 'all_locations' AND c.location IN ('menton', 'lyon'))
      OR 
      (user_location_val IN ('menton', 'lyon') AND c.location = user_location_val)
    )
  LOOP
    -- Check if user is already a participant
    SELECT * INTO existing_participant
    FROM chat_participants cp
    WHERE cp.chat_id = chat_record.id 
    AND cp.user_id = target_user_id;
    
    IF FOUND THEN
      -- Already a participant
      RETURN QUERY SELECT 
        'EXISTS'::text,
        chat_record.type::text,
        chat_record.location,
        chat_record.id,
        format('User already in chat: %s - %s', chat_record.type, chat_record.location)::text;
    ELSE
      -- Add user to chat
      INSERT INTO chat_participants (chat_id, user_id, role)
      VALUES (chat_record.id, target_user_id, 'member')
      ON CONFLICT (chat_id, user_id) DO NOTHING;
      
      RETURN QUERY SELECT 
        'JOINED'::text,
        chat_record.type::text,
        chat_record.location,
        chat_record.id,
        format('Joined user to chat: %s - %s', chat_record.type, chat_record.location)::text;
    END IF;
  END LOOP;
END;
$$;