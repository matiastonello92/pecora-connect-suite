-- Create enhanced notification system for private messages and connection requests

-- Function to create notifications for private messages
CREATE OR REPLACE FUNCTION public.create_private_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  chat_record RECORD;
  sender_profile RECORD;
  recipient_id UUID;
  is_chat_muted BOOLEAN := FALSE;
BEGIN
  -- Get chat information
  SELECT * INTO chat_record FROM chats WHERE id = NEW.chat_id;
  
  -- Only create notifications for private chats
  IF chat_record.type != 'private' THEN
    RETURN NEW;
  END IF;
  
  -- Get sender profile
  SELECT * INTO sender_profile FROM profiles WHERE user_id = NEW.sender_id;
  
  -- Find the recipient (the other participant in private chat)
  SELECT user_id INTO recipient_id 
  FROM chat_participants 
  WHERE chat_id = NEW.chat_id 
  AND user_id != NEW.sender_id 
  LIMIT 1;
  
  -- Check if chat is muted for recipient
  SELECT is_muted INTO is_chat_muted
  FROM chat_participants 
  WHERE chat_id = NEW.chat_id 
  AND user_id = recipient_id;
  
  -- Don't create notification if chat is muted
  IF is_chat_muted THEN
    RETURN NEW;
  END IF;
  
  -- Create notification for recipient
  IF recipient_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      location,
      data
    ) VALUES (
      recipient_id,
      'private_message',
      'New message from ' || sender_profile.first_name || ' ' || sender_profile.last_name,
      COALESCE(LEFT(NEW.content, 30), 'New message'),
      chat_record.location,
      jsonb_build_object(
        'chat_id', NEW.chat_id,
        'message_id', NEW.id,
        'sender_id', NEW.sender_id,
        'sender_name', sender_profile.first_name || ' ' || sender_profile.last_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function to create notifications for connection requests
CREATE OR REPLACE FUNCTION public.create_connection_request_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requester_profile RECORD;
  recipient_profile RECORD;
  notification_type TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get profiles
  SELECT * INTO requester_profile FROM profiles WHERE user_id = NEW.requester_id;
  SELECT * INTO recipient_profile FROM profiles WHERE user_id = NEW.recipient_id;
  
  -- Determine notification type and content based on trigger operation
  IF TG_OP = 'INSERT' THEN
    -- New connection request
    notification_type := 'connection_request';
    notification_title := 'New connection request';
    notification_message := requester_profile.first_name || ' ' || requester_profile.last_name || ' wants to connect';
    
    -- Create notification for recipient
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      location,
      data
    ) VALUES (
      NEW.recipient_id,
      notification_type,
      notification_title,
      notification_message,
      recipient_profile.location,
      jsonb_build_object(
        'request_id', NEW.id,
        'requester_id', NEW.requester_id,
        'requester_name', requester_profile.first_name || ' ' || requester_profile.last_name
      )
    );
    
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Connection request accepted
    notification_type := 'connection_accepted';
    notification_title := 'Connection accepted';
    notification_message := recipient_profile.first_name || ' ' || recipient_profile.last_name || ' accepted your connection';
    
    -- Create notification for requester
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      location,
      data
    ) VALUES (
      NEW.requester_id,
      notification_type,
      notification_title,
      notification_message,
      requester_profile.location,
      jsonb_build_object(
        'request_id', NEW.id,
        'recipient_id', NEW.recipient_id,
        'recipient_name', recipient_profile.first_name || ' ' || recipient_profile.last_name
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create triggers for notifications
DROP TRIGGER IF EXISTS trigger_private_message_notification ON chat_messages;
CREATE TRIGGER trigger_private_message_notification
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_private_message_notification();

DROP TRIGGER IF EXISTS trigger_connection_request_notification ON connection_requests;
CREATE TRIGGER trigger_connection_request_notification
  AFTER INSERT OR UPDATE ON connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_connection_request_notification();