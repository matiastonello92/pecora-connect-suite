-- Create function to get chats with unread counts efficiently
CREATE OR REPLACE FUNCTION get_chats_with_unread_counts(
  user_id uuid,
  user_locations text[]
)
RETURNS TABLE(
  id uuid,
  type chat_type,
  name text,
  location text,
  description text,
  is_archived boolean,
  metadata jsonb,
  last_message_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  created_by uuid,
  participants jsonb,
  last_message jsonb,
  unread_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_chats AS (
    SELECT DISTINCT c.*
    FROM chats c
    LEFT JOIN chat_participants cp ON c.id = cp.chat_id
    WHERE (
      -- Global and announcements chats for user's locations
      (c.type IN ('global', 'announcements') AND c.location = ANY(user_locations))
      OR
      -- Private chats where user is a participant
      (c.type = 'private' AND cp.user_id = get_chats_with_unread_counts.user_id)
      OR
      -- Group chats where user is a participant
      (c.type = 'group' AND cp.user_id = get_chats_with_unread_counts.user_id)
    )
  ),
  chat_participants_agg AS (
    SELECT 
      cp.chat_id,
      jsonb_agg(
        jsonb_build_object(
          'user_id', cp.user_id,
          'role', cp.role,
          'joined_at', cp.joined_at,
          'last_read_at', cp.last_read_at,
          'is_muted', cp.is_muted,
          'muted_until', cp.muted_until,
          'user', jsonb_build_object(
            'first_name', p.first_name,
            'last_name', p.last_name,
            'position', p.position,
            'department', p.department,
            'role', p.role
          )
        )
      ) as participants
    FROM chat_participants cp
    JOIN profiles p ON cp.user_id = p.user_id
    WHERE cp.chat_id IN (SELECT uc.id FROM user_chats uc)
    GROUP BY cp.chat_id
  ),
  last_messages AS (
    SELECT DISTINCT ON (chat_id)
      chat_id,
      jsonb_build_object(
        'id', id,
        'content', content,
        'message_type', message_type,
        'sender_id', sender_id,
        'created_at', created_at,
        'media_url', media_url,
        'is_edited', is_edited,
        'sender', jsonb_build_object(
          'first_name', p.first_name,
          'last_name', p.last_name
        )
      ) as last_message
    FROM chat_messages cm
    LEFT JOIN profiles p ON cm.sender_id = p.user_id
    WHERE cm.chat_id IN (SELECT uc.id FROM user_chats uc)
      AND cm.is_deleted = false
    ORDER BY chat_id, created_at DESC
  ),
  unread_counts AS (
    SELECT 
      cm.chat_id,
      COUNT(*) as unread_count
    FROM chat_messages cm
    JOIN chat_participants cp ON cm.chat_id = cp.chat_id
    WHERE cp.user_id = get_chats_with_unread_counts.user_id
      AND cm.sender_id != get_chats_with_unread_counts.user_id
      AND cm.is_deleted = false
      AND cm.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamp with time zone)
    GROUP BY cm.chat_id
  )
  SELECT 
    uc.id,
    uc.type,
    uc.name,
    uc.location,
    uc.description,
    uc.is_archived,
    uc.metadata,
    uc.last_message_at,
    uc.created_at,
    uc.updated_at,
    uc.created_by,
    COALESCE(cpa.participants, '[]'::jsonb) as participants,
    COALESCE(lm.last_message, 'null'::jsonb) as last_message,
    COALESCE(uc_counts.unread_count, 0) as unread_count
  FROM user_chats uc
  LEFT JOIN chat_participants_agg cpa ON uc.id = cpa.chat_id
  LEFT JOIN last_messages lm ON uc.id = lm.chat_id
  LEFT JOIN unread_counts uc_counts ON uc.id = uc_counts.chat_id
  ORDER BY uc.last_message_at DESC;
END;
$$;

-- Create function to get user unread counts efficiently
CREATE OR REPLACE FUNCTION get_user_unread_counts(user_id uuid)
RETURNS TABLE(
  total bigint,
  byChat jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count bigint := 0;
  chat_counts jsonb := '{}';
BEGIN
  -- Get unread counts for each chat
  WITH unread_by_chat AS (
    SELECT 
      cm.chat_id,
      COUNT(*) as count
    FROM chat_messages cm
    JOIN chat_participants cp ON cm.chat_id = cp.chat_id
    WHERE cp.user_id = get_user_unread_counts.user_id
      AND cm.sender_id != get_user_unread_counts.user_id
      AND cm.is_deleted = false
      AND cm.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamp with time zone)
    GROUP BY cm.chat_id
  )
  SELECT 
    COALESCE(SUM(count), 0),
    COALESCE(jsonb_object_agg(chat_id::text, count), '{}')
  INTO total_count, chat_counts
  FROM unread_by_chat;

  RETURN QUERY SELECT total_count, chat_counts;
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created 
ON chat_messages(chat_id, created_at DESC) 
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_chat_participants_user_chat 
ON chat_participants(user_id, chat_id);

CREATE INDEX IF NOT EXISTS idx_chats_location_type 
ON chats(location, type) 
WHERE is_archived = false;