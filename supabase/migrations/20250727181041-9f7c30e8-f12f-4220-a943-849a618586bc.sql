-- Create system for tracking message reminders
CREATE TABLE IF NOT EXISTS public.message_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  chat_id UUID NOT NULL,
  message_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  UNIQUE(user_id, chat_id, message_id)
);

-- Enable RLS
ALTER TABLE public.message_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own reminders"
ON public.message_reminders
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can manage reminders"
ON public.message_reminders
FOR ALL
USING (true);

-- Function to schedule 12-hour reminders for unread private messages
CREATE OR REPLACE FUNCTION public.schedule_message_reminder()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  chat_record RECORD;
  recipient_id UUID;
  is_chat_muted BOOLEAN := FALSE;
  connection_status TEXT;
BEGIN
  -- Get chat information
  SELECT * INTO chat_record FROM chats WHERE id = NEW.chat_id;
  
  -- Only schedule reminders for private chats
  IF chat_record.type != 'private' THEN
    RETURN NEW;
  END IF;
  
  -- Find the recipient (the other participant in private chat)
  SELECT user_id INTO recipient_id 
  FROM chat_participants 
  WHERE chat_id = NEW.chat_id 
  AND user_id != NEW.sender_id 
  LIMIT 1;
  
  IF recipient_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if chat is muted for recipient
  SELECT is_muted INTO is_chat_muted
  FROM chat_participants 
  WHERE chat_id = NEW.chat_id 
  AND user_id = recipient_id;
  
  -- Don't schedule reminder if chat is muted
  IF is_chat_muted THEN
    RETURN NEW;
  END IF;
  
  -- Check connection status - only send reminders for accepted connections
  SELECT get_connection_status(NEW.sender_id, recipient_id) INTO connection_status;
  
  IF connection_status != 'accepted' THEN
    RETURN NEW;
  END IF;
  
  -- Schedule reminder for 12 hours from now
  INSERT INTO message_reminders (
    user_id,
    chat_id,
    message_id,
    scheduled_at
  ) VALUES (
    recipient_id,
    NEW.chat_id,
    NEW.id,
    NOW() + INTERVAL '12 hours'
  ) ON CONFLICT (user_id, chat_id, message_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for scheduling reminders
DROP TRIGGER IF EXISTS trigger_schedule_message_reminder ON chat_messages;
CREATE TRIGGER trigger_schedule_message_reminder
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.schedule_message_reminder();

-- Function to cancel reminders when messages are read
CREATE OR REPLACE FUNCTION public.cancel_message_reminders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Cancel pending reminders for this user and chat when last_read_at is updated
  UPDATE message_reminders 
  SET status = 'cancelled'
  WHERE user_id = NEW.user_id 
  AND chat_id = NEW.chat_id 
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM chat_messages 
    WHERE id = message_reminders.message_id 
    AND created_at <= NEW.last_read_at
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for cancelling reminders when messages are read
DROP TRIGGER IF EXISTS trigger_cancel_message_reminders ON chat_participants;
CREATE TRIGGER trigger_cancel_message_reminders
  AFTER UPDATE OF last_read_at ON chat_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.cancel_message_reminders();