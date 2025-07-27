-- STEP 1 & 2: Emergency Database Functions for Chat System Recovery

-- Function to debug current user authentication state
CREATE OR REPLACE FUNCTION public.debug_user_auth_state()
RETURNS TABLE(
  auth_user_id uuid,
  profile_exists boolean,
  profile_data jsonb,
  expected_chats text[],
  actual_chat_memberships text[],
  issues text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_auth_id uuid;
  user_profile RECORD;
  user_location TEXT;
  expected_chat_list text[] := '{}';
  actual_chat_list text[] := '{}';
  issue_list text[] := '{}';
  chat_record RECORD;
BEGIN
  -- Get current auth user ID
  current_auth_id := auth.uid();
  
  IF current_auth_id IS NULL THEN
    issue_list := array_append(issue_list, 'No authenticated user (auth.uid() is null)');
    RETURN QUERY SELECT null::uuid, false, null::jsonb, '{}'::text[], '{}'::text[], issue_list;
    RETURN;
  END IF;
  
  -- Check if profile exists
  SELECT * INTO user_profile FROM profiles WHERE user_id = current_auth_id;
  
  IF NOT FOUND THEN
    issue_list := array_append(issue_list, 'User profile not found in profiles table');
    RETURN QUERY SELECT current_auth_id, false, null::jsonb, '{}'::text[], '{}'::text[], issue_list;
    RETURN;
  END IF;
  
  user_location := user_profile.location;
  
  -- Determine expected chats based on location
  IF user_location = 'all_locations' THEN
    expected_chat_list := ARRAY['global-menton', 'announcements-menton', 'global-lyon', 'announcements-lyon'];
  ELSIF user_location IN ('menton', 'lyon') THEN
    expected_chat_list := ARRAY['global-' || user_location, 'announcements-' || user_location];
  ELSE
    issue_list := array_append(issue_list, 'Unknown user location: ' || COALESCE(user_location, 'null'));
  END IF;
  
  -- Get actual chat memberships
  FOR chat_record IN 
    SELECT c.type::text || '-' || c.location as chat_identifier
    FROM chats c
    JOIN chat_participants cp ON c.id = cp.chat_id
    WHERE cp.user_id = current_auth_id
  LOOP
    actual_chat_list := array_append(actual_chat_list, chat_record.chat_identifier);
  END LOOP;
  
  -- Check for missing expected chats
  FOR i IN 1..array_length(expected_chat_list, 1)
  LOOP
    IF NOT (expected_chat_list[i] = ANY(actual_chat_list)) THEN
      issue_list := array_append(issue_list, 'Missing expected chat: ' || expected_chat_list[i]);
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT 
    current_auth_id,
    true,
    row_to_json(user_profile)::jsonb,
    expected_chat_list,
    actual_chat_list,
    issue_list;
END;
$function$;

-- Function to emergency create user profile if missing
CREATE OR REPLACE FUNCTION public.emergency_create_user_profile(
  target_user_id uuid,
  user_email text DEFAULT NULL,
  user_location text DEFAULT 'menton'
)
RETURNS TABLE(success boolean, message text, profile_data jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_profile RECORD;
  new_profile RECORD;
BEGIN
  -- Check if profile already exists
  SELECT * INTO existing_profile FROM profiles WHERE user_id = target_user_id;
  
  IF FOUND THEN
    RETURN QUERY SELECT false, 'Profile already exists', row_to_json(existing_profile)::jsonb;
    RETURN;
  END IF;
  
  -- Create emergency profile with defaults
  INSERT INTO profiles (
    user_id,
    email,
    first_name,
    last_name,
    role,
    access_level,
    location,
    department,
    position,
    status,
    has_custom_permissions
  ) VALUES (
    target_user_id,
    COALESCE(user_email, 'emergency-' || target_user_id::text || '@example.com'),
    'Emergency',
    'User',
    'staff',
    'base',
    user_location,
    user_location,
    'Staff',
    'active',
    false
  ) RETURNING * INTO new_profile;
  
  RETURN QUERY SELECT true, 'Emergency profile created successfully', row_to_json(new_profile)::jsonb;
END;
$function$;

-- Enhanced function to ensure and create all default chats
CREATE OR REPLACE FUNCTION public.emergency_ensure_all_default_chats()
RETURNS TABLE(action text, chat_type text, location text, chat_id uuid, chat_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  required_chat RECORD;
  existing_chat RECORD;
  new_chat_id UUID;
  chat_name TEXT;
BEGIN
  -- Define all required chats with proper names
  FOR required_chat IN 
    SELECT 'global'::text as type, 'menton'::text as location, 'Global Chat — Menton'::text as name
    UNION SELECT 'announcements'::text, 'menton'::text, 'Announcements — Menton'::text
    UNION SELECT 'global'::text, 'lyon'::text, 'Global Chat — Lyon'::text
    UNION SELECT 'announcements'::text, 'lyon'::text, 'Announcements — Lyon'::text
  LOOP
    -- Check if chat exists
    SELECT * INTO existing_chat
    FROM chats c
    WHERE c.type = required_chat.type::chat_type 
    AND c.location = required_chat.location;
    
    IF FOUND THEN
      -- Chat exists, but update name if needed
      UPDATE chats 
      SET name = required_chat.name,
          updated_at = now()
      WHERE id = existing_chat.id
      AND (name IS NULL OR name != required_chat.name);
      
      RETURN QUERY SELECT 
        'EXISTS'::text,
        required_chat.type,
        required_chat.location,
        existing_chat.id,
        required_chat.name;
    ELSE
      -- Create missing chat
      INSERT INTO chats (type, name, location, created_by)
      VALUES (
        required_chat.type::chat_type,
        required_chat.name,
        required_chat.location,
        null
      )
      RETURNING id INTO new_chat_id;
      
      RETURN QUERY SELECT 
        'CREATED'::text,
        required_chat.type,
        required_chat.location,
        new_chat_id,
        required_chat.name;
    END IF;
  END LOOP;
END;
$function$;

-- Enhanced function to emergency join current user to appropriate chats
CREATE OR REPLACE FUNCTION public.emergency_join_current_user_to_chats()
RETURNS TABLE(action text, chat_type text, location text, chat_id uuid, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  user_location_val TEXT;
  user_profile RECORD;
  chat_record RECORD;
  existing_participant RECORD;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN QUERY SELECT 
      'ERROR'::text,
      ''::text,
      ''::text,
      null::uuid,
      'No authenticated user found'::text;
    RETURN;
  END IF;
  
  -- Get user profile
  SELECT * INTO user_profile FROM profiles WHERE user_id = current_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      'ERROR'::text,
      ''::text,
      ''::text,
      null::uuid,
      format('User profile not found for user %s', current_user_id)::text;
    RETURN;
  END IF;
  
  user_location_val := user_profile.location;
  
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
    AND cp.user_id = current_user_id;
    
    IF FOUND THEN
      -- Already a participant
      RETURN QUERY SELECT 
        'EXISTS'::text,
        chat_record.type::text,
        chat_record.location,
        chat_record.id,
        format('Already member of: %s', COALESCE(chat_record.name, chat_record.type || '-' || chat_record.location))::text;
    ELSE
      -- Add user to chat
      INSERT INTO chat_participants (chat_id, user_id, role, joined_at)
      VALUES (chat_record.id, current_user_id, 'member', now())
      ON CONFLICT (chat_id, user_id) DO NOTHING;
      
      RETURN QUERY SELECT 
        'JOINED'::text,
        chat_record.type::text,
        chat_record.location,
        chat_record.id,
        format('Joined: %s', COALESCE(chat_record.name, chat_record.type || '-' || chat_record.location))::text;
    END IF;
  END LOOP;
  
  -- If no chats were found/joined, that's an issue
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      'ERROR'::text,
      ''::text,
      ''::text,
      null::uuid,
      format('No appropriate chats found for user location: %s', user_location_val)::text;
  END IF;
END;
$function$;

-- Function to get comprehensive chat system status
CREATE OR REPLACE FUNCTION public.get_comprehensive_chat_status()
RETURNS TABLE(
  total_chats integer,
  total_users integer,
  total_memberships integer,
  chats_detail jsonb,
  users_without_chats jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  chat_details jsonb;
  users_without_chats_detail jsonb;
BEGIN
  -- Get comprehensive chat details
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'type', c.type,
      'location', c.location,
      'name', c.name,
      'participant_count', COALESCE(pc.participant_count, 0),
      'participants', COALESCE(pc.participants, '[]'::jsonb)
    )
  ) INTO chat_details
  FROM chats c
  LEFT JOIN (
    SELECT 
      cp.chat_id,
      COUNT(*) as participant_count,
      jsonb_agg(
        jsonb_build_object(
          'user_id', cp.user_id,
          'role', cp.role,
          'joined_at', cp.joined_at,
          'user_name', p.first_name || ' ' || p.last_name
        )
      ) as participants
    FROM chat_participants cp
    LEFT JOIN profiles p ON cp.user_id = p.user_id
    GROUP BY cp.chat_id
  ) pc ON c.id = pc.chat_id;
  
  -- Get users without any chat memberships
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', p.user_id,
      'name', p.first_name || ' ' || p.last_name,
      'location', p.location,
      'status', p.status
    )
  ) INTO users_without_chats_detail
  FROM profiles p
  WHERE p.status = 'active' 
  AND p.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM chat_participants cp 
    WHERE cp.user_id = p.user_id
  );
  
  RETURN QUERY SELECT 
    (SELECT COUNT(*)::integer FROM chats),
    (SELECT COUNT(*)::integer FROM profiles WHERE status = 'active'),
    (SELECT COUNT(*)::integer FROM chat_participants),
    COALESCE(chat_details, '[]'::jsonb),
    COALESCE(users_without_chats_detail, '[]'::jsonb);
END;
$function$;