-- Create optimized RPC function for paginated messages with cursor-based pagination
CREATE OR REPLACE FUNCTION public.get_paginated_messages(
  p_chat_id UUID,
  p_cursor TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_direction TEXT DEFAULT 'before' -- 'before' for older messages, 'after' for newer
)
RETURNS TABLE(
  id UUID,
  chat_id UUID,
  sender_id UUID,
  content TEXT,
  message_type TEXT,
  media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  is_edited BOOLEAN,
  is_deleted BOOLEAN,
  sender_info JSONB,
  read_receipts JSONB,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_messages BIGINT;
BEGIN
  -- Get total count for this chat
  SELECT COUNT(*) INTO total_messages 
  FROM chat_messages cm 
  WHERE cm.chat_id = p_chat_id AND cm.is_deleted = false;

  RETURN QUERY
  WITH paginated_messages AS (
    SELECT 
      cm.id,
      cm.chat_id,
      cm.sender_id,
      cm.content,
      cm.message_type::TEXT,
      cm.media_url,
      cm.created_at,
      cm.is_edited,
      cm.is_deleted
    FROM chat_messages cm
    WHERE cm.chat_id = p_chat_id 
      AND cm.is_deleted = false
      AND (
        p_cursor IS NULL OR 
        (p_direction = 'before' AND cm.created_at < p_cursor) OR
        (p_direction = 'after' AND cm.created_at > p_cursor)
      )
    ORDER BY 
      CASE WHEN p_direction = 'before' THEN cm.created_at END DESC,
      CASE WHEN p_direction = 'after' THEN cm.created_at END ASC
    LIMIT p_limit
  ),
  sender_profiles AS (
    SELECT 
      p.user_id,
      jsonb_build_object(
        'first_name', p.first_name,
        'last_name', p.last_name,
        'avatar_url', p.avatar_url,
        'position', p.position
      ) as sender_data
    FROM profiles p
    WHERE p.user_id IN (SELECT pm.sender_id FROM paginated_messages pm)
  ),
  message_receipts AS (
    SELECT 
      mrr.message_id,
      jsonb_agg(
        jsonb_build_object(
          'user_id', mrr.user_id,
          'read_at', mrr.read_at,
          'user_name', p.first_name || ' ' || p.last_name
        )
      ) as receipts
    FROM message_read_receipts mrr
    JOIN profiles p ON mrr.user_id = p.user_id
    WHERE mrr.message_id IN (SELECT pm.id FROM paginated_messages pm)
    GROUP BY mrr.message_id
  )
  SELECT 
    pm.id,
    pm.chat_id,
    pm.sender_id,
    pm.content,
    pm.message_type,
    pm.media_url,
    pm.created_at,
    pm.is_edited,
    pm.is_deleted,
    COALESCE(sp.sender_data, '{}'::jsonb) as sender_info,
    COALESCE(mr.receipts, '[]'::jsonb) as read_receipts,
    total_messages
  FROM paginated_messages pm
  LEFT JOIN sender_profiles sp ON pm.sender_id = sp.user_id
  LEFT JOIN message_receipts mr ON pm.id = mr.message_id
  ORDER BY pm.created_at DESC;
END;
$function$;

-- Create indexes for optimal pagination performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_pagination 
ON chat_messages (chat_id, created_at DESC, is_deleted) 
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_chat_messages_cursor_before 
ON chat_messages (chat_id, created_at DESC) 
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_chat_messages_cursor_after 
ON chat_messages (chat_id, created_at ASC) 
WHERE is_deleted = false;

-- Optimize message read receipts queries
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message_id 
ON message_read_receipts (message_id);

-- Create function for optimized unread count with pagination context
CREATE OR REPLACE FUNCTION public.get_chat_unread_count_optimized(
  p_chat_id UUID,
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  last_read_timestamp TIMESTAMP WITH TIME ZONE;
  unread_count INTEGER;
BEGIN
  -- Get user's last read timestamp for this chat
  SELECT last_read_at INTO last_read_timestamp
  FROM chat_participants 
  WHERE chat_id = p_chat_id AND user_id = p_user_id;
  
  -- Count unread messages
  SELECT COUNT(*)::INTEGER INTO unread_count
  FROM chat_messages cm
  WHERE cm.chat_id = p_chat_id
    AND cm.sender_id != p_user_id
    AND cm.is_deleted = false
    AND cm.created_at > COALESCE(last_read_timestamp, '1970-01-01'::timestamp with time zone);
    
  RETURN COALESCE(unread_count, 0);
END;
$function$;