-- Create enum types for communication system
CREATE TYPE chat_type AS ENUM ('private', 'group', 'global', 'announcements');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');
CREATE TYPE message_type AS ENUM ('text', 'image', 'voice', 'document', 'system');
CREATE TYPE notification_priority AS ENUM ('normal', 'urgent', 'forced');

-- Create storage buckets for media files
INSERT INTO storage.buckets (id, name, public) VALUES 
('chat-media', 'chat-media', false),
('chat-documents', 'chat-documents', false);

-- Connection requests table
CREATE TABLE connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status connection_status DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(requester_id, recipient_id)
);

-- Chats table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type chat_type NOT NULL,
  name TEXT, -- For group chats and announcements
  description TEXT,
  location TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_archived BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Chat participants table
CREATE TABLE chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_muted BOOLEAN DEFAULT false,
  muted_until TIMESTAMP WITH TIME ZONE,
  notification_settings JSONB DEFAULT '{}'::jsonb,
  UNIQUE(chat_id, user_id)
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  message_type message_type DEFAULT 'text',
  media_url TEXT,
  media_type TEXT,
  media_size INTEGER,
  reply_to_id UUID REFERENCES chat_messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Message read receipts table
CREATE TABLE message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Chat notifications table
CREATE TABLE chat_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'message', 'mention', 'urgent'
  priority notification_priority DEFAULT 'normal',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create storage policies for chat media (after tables are created)
CREATE POLICY "Users can upload their own media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view media in their chats" ON storage.objects
FOR SELECT USING (
  bucket_id = 'chat-media' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM chat_participants cp
      JOIN chats c ON cp.chat_id = c.id
      WHERE c.id::text = (storage.foldername(name))[2] AND cp.user_id = auth.uid()
    )
  )
);

-- Document storage policies
CREATE POLICY "Users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view documents in their chats" ON storage.objects
FOR SELECT USING (
  bucket_id = 'chat-documents' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM chat_participants cp
      JOIN chats c ON cp.chat_id = c.id
      WHERE c.id::text = (storage.foldername(name))[2] AND cp.user_id = auth.uid()
    )
  )
);

-- Enable RLS on all tables
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connection_requests
CREATE POLICY "Users can create connection requests" ON connection_requests
FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can view their connection requests" ON connection_requests
FOR SELECT USING (requester_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Recipients can update connection requests" ON connection_requests
FOR UPDATE USING (recipient_id = auth.uid());

-- RLS Policies for chats
CREATE POLICY "Users can create chats" ON chats
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view chats they participate in" ON chats
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_participants.chat_id = chats.id 
    AND chat_participants.user_id = auth.uid()
  ) OR 
  type = 'global' OR 
  type = 'announcements'
);

CREATE POLICY "Chat creators and admins can update chats" ON chats
FOR UPDATE USING (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_participants.chat_id = chats.id 
    AND chat_participants.user_id = auth.uid() 
    AND chat_participants.role = 'admin'
  ) OR
  get_current_user_role() IN ('manager', 'super_admin')
);

-- RLS Policies for chat_participants
CREATE POLICY "Users can view chat participants" ON chat_participants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants cp2 
    WHERE cp2.chat_id = chat_participants.chat_id 
    AND cp2.user_id = auth.uid()
  )
);

CREATE POLICY "Chat admins can manage participants" ON chat_participants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM chats 
    WHERE chats.id = chat_participants.chat_id 
    AND (
      chats.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM chat_participants cp2 
        WHERE cp2.chat_id = chat_participants.chat_id 
        AND cp2.user_id = auth.uid() 
        AND cp2.role = 'admin'
      )
    )
  ) OR user_id = auth.uid()
);

-- RLS Policies for chat_messages
CREATE POLICY "Users can create messages in their chats" ON chat_messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_participants.chat_id = chat_messages.chat_id 
      AND chat_participants.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = chat_messages.chat_id 
      AND chats.type = 'global'
    ) OR
    (
      EXISTS (
        SELECT 1 FROM chats 
        WHERE chats.id = chat_messages.chat_id 
        AND chats.type = 'announcements'
      ) AND
      get_current_user_role() IN ('manager', 'super_admin')
    )
  )
);

CREATE POLICY "Users can view messages in their chats" ON chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_participants.chat_id = chat_messages.chat_id 
    AND chat_participants.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM chats 
    WHERE chats.id = chat_messages.chat_id 
    AND (chats.type = 'global' OR chats.type = 'announcements')
  )
);

CREATE POLICY "Users can update their own messages" ON chat_messages
FOR UPDATE USING (sender_id = auth.uid());

-- RLS Policies for message_read_receipts
CREATE POLICY "Users can create their own read receipts" ON message_read_receipts
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view read receipts for their chats" ON message_read_receipts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_messages cm
    JOIN chat_participants cp ON cm.chat_id = cp.chat_id
    WHERE cm.id = message_read_receipts.message_id 
    AND cp.user_id = auth.uid()
  )
);

-- RLS Policies for chat_notifications
CREATE POLICY "Users can view their own notifications" ON chat_notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON chat_notifications
FOR UPDATE USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_connection_requests_recipient ON connection_requests(recipient_id);
CREATE INDEX idx_connection_requests_requester ON connection_requests(requester_id);
CREATE INDEX idx_chats_location ON chats(location);
CREATE INDEX idx_chats_type ON chats(type);
CREATE INDEX idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX idx_chat_participants_chat ON chat_participants(chat_id);
CREATE INDEX idx_chat_messages_chat_created ON chat_messages(chat_id, created_at DESC);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_message_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX idx_chat_notifications_user_created ON chat_notifications(user_id, created_at DESC);

-- Functions for chat management
CREATE OR REPLACE FUNCTION create_private_chat(other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  chat_id UUID;
  current_user_location TEXT;
BEGIN
  -- Get current user's location
  SELECT location INTO current_user_location
  FROM profiles WHERE user_id = auth.uid();
  
  -- Check if connection exists and is accepted
  IF NOT EXISTS (
    SELECT 1 FROM connection_requests 
    WHERE ((requester_id = auth.uid() AND recipient_id = other_user_id) OR
           (requester_id = other_user_id AND recipient_id = auth.uid()))
    AND status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'Connection not established';
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

-- Function to create global and announcement chats for each location
CREATE OR REPLACE FUNCTION ensure_default_chats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  loc TEXT;
  global_chat_id UUID;
  announcement_chat_id UUID;
BEGIN
  FOR loc IN SELECT DISTINCT location FROM profiles WHERE location != 'all_locations'
  LOOP
    -- Create global chat if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM chats 
      WHERE type = 'global' AND location = loc
    ) THEN
      INSERT INTO chats (type, name, location, created_by)
      VALUES ('global', 'General Discussion - ' || loc, loc, null)
      RETURNING id INTO global_chat_id;
    END IF;
    
    -- Create announcements chat if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM chats 
      WHERE type = 'announcements' AND location = loc
    ) THEN
      INSERT INTO chats (type, name, location, created_by)
      VALUES ('announcements', 'Announcements - ' || loc, loc, null)
      RETURNING id INTO announcement_chat_id;
    END IF;
  END LOOP;
END;
$$;

-- Function to automatically add users to global chats based on their location
CREATE OR REPLACE FUNCTION auto_join_location_chats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  global_chat_id UUID;
  announcement_chat_id UUID;
BEGIN
  -- Get global chat for user's location
  SELECT id INTO global_chat_id
  FROM chats 
  WHERE type = 'global' AND location = NEW.location;
  
  -- Get announcement chat for user's location
  SELECT id INTO announcement_chat_id
  FROM chats 
  WHERE type = 'announcements' AND location = NEW.location;
  
  -- Add user to global chat
  IF global_chat_id IS NOT NULL THEN
    INSERT INTO chat_participants (chat_id, user_id)
    VALUES (global_chat_id, NEW.user_id)
    ON CONFLICT (chat_id, user_id) DO NOTHING;
  END IF;
  
  -- Add user to announcements chat
  IF announcement_chat_id IS NOT NULL THEN
    INSERT INTO chat_participants (chat_id, user_id)
    VALUES (announcement_chat_id, NEW.user_id)
    ON CONFLICT (chat_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-join users to location chats
CREATE TRIGGER auto_join_location_chats_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_join_location_chats();

-- Function to update chat last_message_at
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE chats 
  SET last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update chat last_message_at
CREATE TRIGGER update_chat_last_message_trigger
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_last_message();

-- Enable realtime for all chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE connection_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_read_receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_notifications;

-- Set replica identity for realtime
ALTER TABLE connection_requests REPLICA IDENTITY FULL;
ALTER TABLE chats REPLICA IDENTITY FULL;
ALTER TABLE chat_participants REPLICA IDENTITY FULL;
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE message_read_receipts REPLICA IDENTITY FULL;
ALTER TABLE chat_notifications REPLICA IDENTITY FULL;

-- Create default chats
SELECT ensure_default_chats();