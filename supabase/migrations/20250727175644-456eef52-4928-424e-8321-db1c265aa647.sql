-- Add a constraint to prevent spam requests after decline
-- Update the connection request policy to include the 30-day cooling period

-- First, let's add a function to check if a user can send a connection request
CREATE OR REPLACE FUNCTION public.can_send_connection_request(requester_user_id UUID, recipient_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

-- Update the RLS policy for inserting connection requests to use this function
DROP POLICY IF EXISTS "Users can create connection requests" ON connection_requests;

CREATE POLICY "Users can create connection requests"
ON connection_requests
FOR INSERT
WITH CHECK (
  requester_id = auth.uid() 
  AND can_send_connection_request(requester_id, recipient_id)
);

-- Add a function to get connection status between two users
CREATE OR REPLACE FUNCTION public.get_connection_status(user1_id UUID, user2_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_status TEXT;
BEGIN
  -- Look for any connection request between the two users
  SELECT status INTO request_status
  FROM connection_requests 
  WHERE (
    (requester_id = user1_id AND recipient_id = user2_id) OR
    (requester_id = user2_id AND recipient_id = user1_id)
  )
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- Return the status or 'none' if no request exists
  RETURN COALESCE(request_status, 'none');
END;
$$;

-- Update the create_private_chat function to be more explicit about connection requirements
CREATE OR REPLACE FUNCTION public.create_private_chat(other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chat_id UUID;
  current_user_location TEXT;
  connection_status TEXT;
BEGIN
  -- Get current user's location
  SELECT location INTO current_user_location
  FROM profiles WHERE user_id = auth.uid();
  
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
  
  -- Create new private chat
  INSERT INTO chats (type, location, created_by)
  VALUES ('private', current_user_location, auth.uid())
  RETURNING id INTO chat_id;
  
  -- Add participants
  INSERT INTO chat_participants (chat_id, user_id, role)
  VALUES 
    (chat_id, auth.uid(), 'admin'),
    (chat_id, other_user_id, 'member');
  
  RETURN chat_id;
END;
$$;