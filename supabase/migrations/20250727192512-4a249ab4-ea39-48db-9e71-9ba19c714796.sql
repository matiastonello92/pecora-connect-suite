-- PART 4: Enhanced system health check
CREATE OR REPLACE FUNCTION public.validate_chat_system_health()
RETURNS TABLE(
  check_name text,
  status text,
  details text,
  user_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check 1: Required chats exist
  RETURN QUERY
  SELECT 
    'Required chats exist'::text,
    CASE WHEN COUNT(*) = 4 THEN 'PASS' ELSE 'FAIL' END::text,
    format('Found %s of 4 required chats. Missing: %s', 
      COUNT(*),
      string_agg(
        CASE WHEN NOT EXISTS (
          SELECT 1 FROM chats c 
          WHERE c.type = required.chat_type::chat_type 
          AND c.location = required.location
        ) THEN required.chat_type || '-' || required.location ELSE NULL END, 
        ', '
      )
    )::text,
    COUNT(*)::integer
  FROM (
    SELECT 'global' as chat_type, 'menton' as location
    UNION SELECT 'announcements', 'menton'
    UNION SELECT 'global', 'lyon'
    UNION SELECT 'announcements', 'lyon'
  ) required
  WHERE EXISTS (
    SELECT 1 FROM chats c 
    WHERE c.type = required.chat_type::chat_type 
    AND c.location = required.location
  );
  
  -- Check 2: Users without any chat memberships
  RETURN QUERY
  SELECT 
    'Users without chat memberships'::text,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
    format('%s users found without any chat memberships: %s', 
      COUNT(*),
      string_agg(p.first_name || ' ' || p.last_name || ' (' || p.location || ')', ', ')
    )::text,
    COUNT(*)::integer
  FROM profiles p
  WHERE p.status = 'active' 
  AND p.user_id IS NOT NULL
  AND p.location IN ('menton', 'lyon', 'all_locations')
  AND NOT EXISTS (
    SELECT 1 FROM chat_participants cp 
    WHERE cp.user_id = p.user_id
  );
  
  -- Check 3: List all chats with participant counts
  RETURN QUERY
  SELECT 
    'Chat inventory'::text,
    'INFO'::text,
    format('Chat: %s-%s (ID: %s) has %s participants', 
      c.type, c.location, c.id, COALESCE(participant_count, 0)
    )::text,
    COALESCE(participant_count, 0)::integer
  FROM chats c
  LEFT JOIN (
    SELECT chat_id, COUNT(*) as participant_count
    FROM chat_participants 
    GROUP BY chat_id
  ) pc ON c.id = pc.chat_id
  ORDER BY c.location, c.type;
  
  -- Check 4: User membership summary
  RETURN QUERY
  SELECT 
    'User memberships'::text,
    'INFO'::text,
    format('User: %s %s (%s) is in %s chats: %s', 
      p.first_name, p.last_name, p.location,
      COALESCE(membership_count, 0),
      COALESCE(chat_list, 'none')
    )::text,
    COALESCE(membership_count, 0)::integer
  FROM profiles p
  LEFT JOIN (
    SELECT 
      cp.user_id,
      COUNT(*) as membership_count,
      string_agg(c.type::text || '-' || c.location, ', ') as chat_list
    FROM chat_participants cp
    JOIN chats c ON cp.chat_id = c.id
    GROUP BY cp.user_id
  ) mc ON p.user_id = mc.user_id
  WHERE p.status = 'active' AND p.user_id IS NOT NULL
  ORDER BY p.first_name, p.last_name;
END;
$$;

-- Execute initial setup: Create default chats
SELECT * FROM public.force_create_default_chats();

-- Join all existing users to appropriate chats
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT user_id FROM profiles WHERE status = 'active' AND user_id IS NOT NULL
  LOOP
    PERFORM public.force_join_user_to_chats(user_record.user_id);
  END LOOP;
END $$;

-- Run system health check to verify everything is working
SELECT * FROM public.validate_chat_system_health() ORDER BY check_name, details;