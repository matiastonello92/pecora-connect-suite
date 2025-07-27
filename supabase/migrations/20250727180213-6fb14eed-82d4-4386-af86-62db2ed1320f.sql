-- Allow privileged roles to bypass location restrictions for private chats

-- Update the create_private_chat function to allow privileged roles to connect cross-location
CREATE OR REPLACE FUNCTION public.create_private_chat(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  chat_id UUID;
  current_user_location TEXT;
  other_user_location TEXT;
  connection_status TEXT;
  current_user_profile RECORD;
  other_user_profile RECORD;
  can_cross_location BOOLEAN := FALSE;
BEGIN
  -- Get current user's profile
  SELECT * INTO current_user_profile
  FROM profiles WHERE user_id = auth.uid();
  
  -- Get other user's profile
  SELECT * INTO other_user_profile
  FROM profiles WHERE user_id = other_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Check if current user has privileged role that can bypass location restrictions
  can_cross_location := (
    current_user_profile.role = 'super_admin' OR
    current_user_profile.role = 'manager' OR
    current_user_profile.access_level = 'general_manager' OR
    current_user_profile.restaurant_role = 'human_resources'
  );
  
  -- Validate location restriction for non-privileged users
  IF NOT can_cross_location AND current_user_profile.location != other_user_profile.location THEN
    RAISE EXCEPTION 'Cannot create private chat with users from different locations without proper privileges';
  END IF;
  
  -- Check connection status
  SELECT get_connection_status(auth.uid(), other_user_id) INTO connection_status;
  
  -- Only allow chat creation if connection is accepted
  IF connection_status != 'accepted' THEN
    RAISE EXCEPTION 'Connection must be accepted before creating private chat. Current status: %', connection_status;
  END IF;
  
  -- Check if private chat already exists
  SELECT c.id INTO chat_id
  FROM chats c
  JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = auth.uid()
  JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = other_user_id
  WHERE c.type = 'private'
  LIMIT 1;
  
  IF chat_id IS NOT NULL THEN
    RETURN chat_id;
  END IF;
  
  -- Create new private chat (use current user's location as chat location)
  INSERT INTO chats (type, location, created_by)
  VALUES ('private', current_user_profile.location, auth.uid())
  RETURNING id INTO chat_id;
  
  -- Add participants
  INSERT INTO chat_participants (chat_id, user_id, role)
  VALUES 
    (chat_id, auth.uid(), 'admin'),
    (chat_id, other_user_id, 'member');
  
  RETURN chat_id;
END;
$function$;

-- Update the can_send_connection_request function to consider cross-location permissions
CREATE OR REPLACE FUNCTION public.can_send_connection_request(requester_user_id uuid, recipient_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requester_profile RECORD;
  recipient_profile RECORD;
  can_cross_location BOOLEAN := FALSE;
BEGIN
  -- Get requester's profile
  SELECT * INTO requester_profile
  FROM profiles WHERE user_id = requester_user_id;
  
  -- Get recipient's profile
  SELECT * INTO recipient_profile
  FROM profiles WHERE user_id = recipient_user_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if requester has privileged role that can bypass location restrictions
  can_cross_location := (
    requester_profile.role = 'super_admin' OR
    requester_profile.role = 'manager' OR
    requester_profile.access_level = 'general_manager' OR
    requester_profile.restaurant_role = 'human_resources'
  );
  
  -- Validate location restriction for non-privileged users
  IF NOT can_cross_location AND requester_profile.location != recipient_profile.location THEN
    RETURN FALSE;
  END IF;
  
  -- Check if there's a recent declined request (within 30 days)
  IF EXISTS (
    SELECT 1 FROM connection_requests 
    WHERE requester_id = requester_user_id 
    AND recipient_id = recipient_user_id 
    AND status = 'declined' 
    AND updated_at > NOW() - INTERVAL '30 days'
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if there's already a pending request
  IF EXISTS (
    SELECT 1 FROM connection_requests 
    WHERE requester_id = requester_user_id 
    AND recipient_id = recipient_user_id 
    AND status = 'pending'
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if they're already connected
  IF EXISTS (
    SELECT 1 FROM connection_requests 
    WHERE ((requester_id = requester_user_id AND recipient_id = recipient_user_id) OR
           (requester_id = recipient_user_id AND recipient_id = requester_user_id))
    AND status = 'accepted'
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;