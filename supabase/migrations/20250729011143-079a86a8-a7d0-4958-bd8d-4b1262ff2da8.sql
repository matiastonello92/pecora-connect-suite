-- Redesign chat system with federated location hierarchy approach

-- Create enum for federated chat types
CREATE TYPE public.federated_chat_type AS ENUM (
  'regional',
  'city_wide', 
  'district',
  'department',
  'role_based',
  'emergency'
);

-- Create location chat groups table for federated approach
CREATE TABLE public.location_chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location_pattern TEXT[] NOT NULL, -- Array of location codes/patterns that match this group
  chat_type federated_chat_type NOT NULL,
  hierarchy_level INTEGER NOT NULL DEFAULT 0, -- 0=global, 1=country, 2=region, 3=city, etc.
  required_roles TEXT[] DEFAULT '{}', -- Roles required to auto-join this group
  auto_join_enabled BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 1000,
  archive_after_days INTEGER DEFAULT 90,
  priority INTEGER DEFAULT 0, -- Higher priority groups shown first
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_location_chat_groups_type_level ON location_chat_groups(chat_type, hierarchy_level);
CREATE INDEX idx_location_chat_groups_pattern_gin ON location_chat_groups USING GIN(location_pattern);
CREATE INDEX idx_location_chat_groups_active ON location_chat_groups(is_active, priority DESC);

-- Update chats table to reference location chat groups
ALTER TABLE public.chats ADD COLUMN location_group_id UUID REFERENCES location_chat_groups(id);
ALTER TABLE public.chats ADD COLUMN is_federated BOOLEAN DEFAULT false;
ALTER TABLE public.chats ADD COLUMN participant_count INTEGER DEFAULT 0;

-- Create chat message archives table
CREATE TABLE public.chat_message_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  original_message_id UUID NOT NULL,
  content TEXT,
  sender_id UUID NOT NULL,
  message_type message_type DEFAULT 'text',
  media_url TEXT,
  media_type TEXT,
  media_size INTEGER,
  reply_to_id UUID,
  metadata JSONB DEFAULT '{}',
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  original_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  archive_reason TEXT DEFAULT 'auto_archive'
);

-- Indexes for archive table
CREATE INDEX idx_chat_message_archives_chat_date ON chat_message_archives(chat_id, original_created_at DESC);
CREATE INDEX idx_chat_message_archives_sender ON chat_message_archives(sender_id, original_created_at DESC);

-- Create function to check if user matches location group patterns
CREATE OR REPLACE FUNCTION public.user_matches_location_group(
  target_user_id UUID,
  group_location_patterns TEXT[]
)
RETURNS BOOLEAN AS $$
DECLARE
  user_locations TEXT[];
  pattern TEXT;
BEGIN
  -- Get user's locations
  SELECT locations INTO user_locations 
  FROM profiles 
  WHERE user_id = target_user_id;
  
  IF user_locations IS NULL OR array_length(user_locations, 1) IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if any user location matches any pattern
  FOREACH pattern IN ARRAY group_location_patterns
  LOOP
    -- Support wildcard patterns like 'france_*', 'lyon_*', etc.
    IF pattern LIKE '%*' THEN
      IF EXISTS (
        SELECT 1 FROM unnest(user_locations) AS user_loc 
        WHERE user_loc LIKE replace(pattern, '*', '%')
      ) THEN
        RETURN true;
      END IF;
    ELSE
      -- Exact match
      IF pattern = ANY(user_locations) THEN
        RETURN true;
      END IF;
    END IF;
  END LOOP;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public';

-- Function to auto-join users to appropriate federated chats
CREATE OR REPLACE FUNCTION public.auto_join_federated_chats(target_user_id UUID)
RETURNS TABLE(
  action TEXT,
  group_name TEXT,
  chat_id UUID,
  message TEXT
) AS $$
DECLARE
  user_profile RECORD;
  chat_group RECORD;
  existing_chat RECORD;
  new_chat_id UUID;
  matches_location BOOLEAN;
  matches_role BOOLEAN;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile
  FROM profiles
  WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      'ERROR'::TEXT,
      'User not found'::TEXT,
      NULL::UUID,
      format('User %s not found in profiles', target_user_id)::TEXT;
    RETURN;
  END IF;
  
  -- Loop through all active location chat groups
  FOR chat_group IN
    SELECT * FROM location_chat_groups
    WHERE is_active = true AND auto_join_enabled = true
    ORDER BY hierarchy_level, priority DESC
  LOOP
    -- Check location pattern match
    SELECT user_matches_location_group(target_user_id, chat_group.location_pattern)
    INTO matches_location;
    
    -- Check role requirements
    matches_role := (
      chat_group.required_roles IS NULL OR 
      array_length(chat_group.required_roles, 1) IS NULL OR
      user_profile.role = ANY(chat_group.required_roles)
    );
    
    IF matches_location AND matches_role THEN
      -- Find or create chat for this group
      SELECT * INTO existing_chat
      FROM chats c
      WHERE c.location_group_id = chat_group.id
      AND c.is_federated = true;
      
      IF FOUND THEN
        -- Check if user is already a participant
        IF NOT EXISTS (
          SELECT 1 FROM chat_participants cp
          WHERE cp.chat_id = existing_chat.id AND cp.user_id = target_user_id
        ) THEN
          -- Add user to existing chat
          INSERT INTO chat_participants (chat_id, user_id, role, joined_at)
          VALUES (existing_chat.id, target_user_id, 'member', now());
          
          -- Update participant count
          UPDATE chats 
          SET participant_count = participant_count + 1
          WHERE id = existing_chat.id;
          
          RETURN QUERY SELECT 
            'JOINED'::TEXT,
            chat_group.name,
            existing_chat.id,
            format('Joined federated chat: %s', chat_group.name)::TEXT;
        ELSE
          RETURN QUERY SELECT 
            'ALREADY_MEMBER'::TEXT,
            chat_group.name,
            existing_chat.id,
            format('Already member of: %s', chat_group.name)::TEXT;
        END IF;
      ELSE
        -- Create new federated chat for this group
        INSERT INTO chats (
          type, name, description, location_group_id, is_federated, 
          created_by, metadata
        )
        VALUES (
          'group'::chat_type,
          chat_group.name,
          chat_group.description,
          chat_group.id,
          true,
          target_user_id,
          jsonb_build_object(
            'federated', true,
            'hierarchy_level', chat_group.hierarchy_level,
            'chat_type', chat_group.chat_type
          )
        )
        RETURNING id INTO new_chat_id;
        
        -- Add user as first participant
        INSERT INTO chat_participants (chat_id, user_id, role, joined_at)
        VALUES (new_chat_id, target_user_id, 'admin', now());
        
        -- Update participant count
        UPDATE chats 
        SET participant_count = 1
        WHERE id = new_chat_id;
        
        RETURN QUERY SELECT 
          'CREATED_AND_JOINED'::TEXT,
          chat_group.name,
          new_chat_id,
          format('Created and joined federated chat: %s', chat_group.name)::TEXT;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Function to archive old messages
CREATE OR REPLACE FUNCTION public.archive_old_messages(
  chat_id_param UUID,
  days_old INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER := 0;
  cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  cutoff_date := NOW() - (days_old || ' days')::INTERVAL;
  
  -- Move old messages to archive
  INSERT INTO chat_message_archives (
    chat_id, original_message_id, content, sender_id, message_type,
    media_url, media_type, media_size, reply_to_id, metadata,
    original_created_at, archive_reason
  )
  SELECT 
    cm.chat_id, cm.id, cm.content, cm.sender_id, cm.message_type,
    cm.media_url, cm.media_type, cm.media_size, cm.reply_to_id, cm.metadata,
    cm.created_at, 'auto_archive'
  FROM chat_messages cm
  WHERE cm.chat_id = chat_id_param
    AND cm.created_at < cutoff_date
    AND cm.is_deleted = false;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  -- Delete archived messages from main table
  DELETE FROM chat_messages
  WHERE chat_id = chat_id_param
    AND created_at < cutoff_date
    AND is_deleted = false;
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Function to get paginated messages with archive support
CREATE OR REPLACE FUNCTION public.get_chat_messages_paginated(
  chat_id_param UUID,
  page_size INTEGER DEFAULT 50,
  before_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  include_archived BOOLEAN DEFAULT false
)
RETURNS TABLE(
  message_id UUID,
  content TEXT,
  sender_id UUID,
  sender_name TEXT,
  message_type message_type,
  media_url TEXT,
  media_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  is_edited BOOLEAN,
  is_archived BOOLEAN,
  reply_to_id UUID
) AS $$
BEGIN
  IF include_archived THEN
    -- Return messages from both active and archived tables
    RETURN QUERY
    (
      SELECT 
        cm.id,
        cm.content,
        cm.sender_id,
        p.first_name || ' ' || p.last_name,
        cm.message_type,
        cm.media_url,
        cm.media_type,
        cm.created_at,
        cm.is_edited,
        false as is_archived,
        cm.reply_to_id
      FROM chat_messages cm
      LEFT JOIN profiles p ON cm.sender_id = p.user_id
      WHERE cm.chat_id = chat_id_param
        AND cm.is_deleted = false
        AND (before_timestamp IS NULL OR cm.created_at < before_timestamp)
      
      UNION ALL
      
      SELECT 
        cma.original_message_id,
        cma.content,
        cma.sender_id,
        p.first_name || ' ' || p.last_name,
        cma.message_type,
        cma.media_url,
        cma.media_type,
        cma.original_created_at,
        false as is_edited,
        true as is_archived,
        cma.reply_to_id
      FROM chat_message_archives cma
      LEFT JOIN profiles p ON cma.sender_id = p.user_id
      WHERE cma.chat_id = chat_id_param
        AND (before_timestamp IS NULL OR cma.original_created_at < before_timestamp)
    )
    ORDER BY created_at DESC
    LIMIT page_size;
  ELSE
    -- Return only active messages
    RETURN QUERY
    SELECT 
      cm.id,
      cm.content,
      cm.sender_id,
      p.first_name || ' ' || p.last_name,
      cm.message_type,
      cm.media_url,
      cm.media_type,
      cm.created_at,
      cm.is_edited,
      false as is_archived,
      cm.reply_to_id
    FROM chat_messages cm
    LEFT JOIN profiles p ON cm.sender_id = p.user_id
    WHERE cm.chat_id = chat_id_param
      AND cm.is_deleted = false
      AND (before_timestamp IS NULL OR cm.created_at < before_timestamp)
    ORDER BY cm.created_at DESC
    LIMIT page_size;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public';

-- Insert some example federated chat groups
INSERT INTO location_chat_groups (name, description, location_pattern, chat_type, hierarchy_level, required_roles) VALUES
('France Regional', 'All locations in France', ARRAY['france_*', 'menton', 'lyon', 'paris'], 'regional', 1, ARRAY['manager', 'super_admin']),
('Mediterranean Coast', 'Coastal locations discussion', ARRAY['menton', 'nice', 'cannes', 'antibes'], 'regional', 2, NULL),
('Lyon Metro Area', 'Greater Lyon area coordination', ARRAY['lyon*'], 'city_wide', 3, NULL),
('Emergency Coordination', 'Emergency response network', ARRAY['*'], 'emergency', 0, ARRAY['manager', 'super_admin']),
('Department Managers', 'Cross-location management chat', ARRAY['*'], 'role_based', 0, ARRAY['manager', 'super_admin']);

-- Enable RLS on new tables
ALTER TABLE public.location_chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_archives ENABLE ROW LEVEL SECURITY;

-- RLS policies for location chat groups
CREATE POLICY "Users can view location chat groups they have access to" ON location_chat_groups
FOR SELECT USING (
  user_matches_location_group(auth.uid(), location_pattern) AND
  (required_roles IS NULL OR 
   array_length(required_roles, 1) IS NULL OR
   (SELECT role FROM profiles WHERE user_id = auth.uid()) = ANY(required_roles))
);

CREATE POLICY "Admins can manage location chat groups" ON location_chat_groups
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY(ARRAY['manager', 'super_admin'])
  )
);

-- RLS policies for message archives
CREATE POLICY "Users can view archived messages from their chats" ON chat_message_archives
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants cp
    WHERE cp.chat_id = chat_message_archives.chat_id 
    AND cp.user_id = auth.uid()
  )
);

-- Trigger to auto-join users when their profile changes
CREATE OR REPLACE FUNCTION public.trigger_auto_join_federated_chats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on location or role changes
  IF OLD.locations IS DISTINCT FROM NEW.locations OR OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM public.auto_join_federated_chats(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE TRIGGER trigger_profile_federated_chat_sync
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_join_federated_chats();