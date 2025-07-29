-- Performance optimization: Eliminate N+1 patterns and scale for thousands of locations

-- 1. Create bulk fetching functions to replace N+1 patterns
CREATE OR REPLACE FUNCTION public.get_user_location_data(target_user_id UUID, location_codes TEXT[] DEFAULT NULL)
RETURNS TABLE(
  location_code TEXT,
  has_access BOOLEAN,
  role TEXT,
  permissions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.code,
    l.code = ANY(p.locations) as has_access,
    p.role,
    jsonb_build_object(
      'access_level', p.access_level,
      'has_custom_permissions', p.has_custom_permissions
    ) as permissions
  FROM locations l
  CROSS JOIN profiles p
  WHERE p.user_id = target_user_id
    AND l.is_active = true
    AND (location_codes IS NULL OR l.code = ANY(location_codes));
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public';

-- 2. Bulk fetch location-aware data with single query
CREATE OR REPLACE FUNCTION public.get_location_aware_data(
  target_user_id UUID,
  table_name TEXT,
  location_codes TEXT[] DEFAULT NULL,
  date_filter DATE DEFAULT NULL,
  status_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  location_code TEXT,
  data_count BIGINT,
  latest_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Build dynamic query based on table name
  CASE table_name
    WHEN 'cash_closures' THEN
      RETURN QUERY
      SELECT 
        cc.location,
        COUNT(*)::BIGINT,
        MAX(cc.created_at)
      FROM cash_closures cc
      JOIN profiles p ON p.user_id = target_user_id
      WHERE cc.location = ANY(p.locations)
        AND (location_codes IS NULL OR cc.location = ANY(location_codes))
        AND (date_filter IS NULL OR cc.date >= date_filter)
        AND (status_filter IS NULL OR cc.status = status_filter)
      GROUP BY cc.location;
      
    WHEN 'monthly_inventories' THEN
      RETURN QUERY
      SELECT 
        mi.location,
        COUNT(*)::BIGINT,
        MAX(mi.created_at)
      FROM monthly_inventories mi
      JOIN profiles p ON p.user_id = target_user_id
      WHERE mi.location = ANY(p.locations)
        AND (location_codes IS NULL OR mi.location = ANY(location_codes))
        AND (status_filter IS NULL OR mi.status = status_filter)
      GROUP BY mi.location;
      
    WHEN 'equipment' THEN
      RETURN QUERY
      SELECT 
        e.location,
        COUNT(*)::BIGINT,
        MAX(e.created_at)
      FROM equipment e
      JOIN profiles p ON p.user_id = target_user_id
      WHERE e.location = ANY(p.locations)
        AND (location_codes IS NULL OR e.location = ANY(location_codes))
        AND (status_filter IS NULL OR e.status = status_filter)
      GROUP BY e.location;
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public';

-- 3. Optimized chat functions with bulk operations
CREATE OR REPLACE FUNCTION public.get_user_chats_bulk(target_user_id UUID)
RETURNS TABLE(
  chat_id UUID,
  chat_type chat_type,
  chat_name TEXT,
  location_code TEXT,
  unread_count BIGINT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  user_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_locations AS (
    SELECT unnest(locations) as location_code
    FROM profiles 
    WHERE user_id = target_user_id
  ),
  user_chats AS (
    -- Global and announcement chats for user's locations
    SELECT DISTINCT 
      c.id as chat_id,
      c.type as chat_type,
      c.name as chat_name,
      c.location as location_code,
      c.last_message_at,
      'member'::TEXT as user_role
    FROM chats c
    INNER JOIN user_locations ul ON c.location = ul.location_code
    WHERE c.type IN ('global', 'announcements')
    
    UNION ALL
    
    -- Private and group chats where user is participant
    SELECT DISTINCT
      c.id as chat_id,
      c.type as chat_type,
      c.name as chat_name,
      c.location as location_code,
      c.last_message_at,
      cp.role as user_role
    FROM chats c
    INNER JOIN chat_participants cp ON c.id = cp.chat_id
    WHERE cp.user_id = target_user_id
      AND c.type IN ('private', 'group')
  ),
  unread_counts AS (
    SELECT 
      uc.chat_id,
      COUNT(cm.id)::BIGINT as unread_count
    FROM user_chats uc
    LEFT JOIN chat_participants cp ON uc.chat_id = cp.chat_id AND cp.user_id = target_user_id
    LEFT JOIN chat_messages cm ON uc.chat_id = cm.chat_id
      AND cm.sender_id != target_user_id
      AND cm.is_deleted = false
      AND cm.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamp with time zone)
    GROUP BY uc.chat_id
  )
  SELECT 
    uc.chat_id,
    uc.chat_type,
    uc.chat_name,
    uc.location_code,
    COALESCE(unr.unread_count, 0) as unread_count,
    uc.last_message_at,
    uc.user_role
  FROM user_chats uc
  LEFT JOIN unread_counts unr ON uc.chat_id = unr.chat_id
  ORDER BY uc.last_message_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public';

-- 4. Optimized user location access function
CREATE OR REPLACE FUNCTION public.user_has_location_access_optimized(
  target_user_id UUID, 
  location_code TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = target_user_id 
      AND p.status = 'active'
      AND location_code = ANY(p.locations)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public';

-- 5. Batch location validation function
CREATE OR REPLACE FUNCTION public.validate_user_locations_batch(
  target_user_id UUID,
  location_codes TEXT[]
)
RETURNS TABLE(
  location_code TEXT,
  has_access BOOLEAN,
  location_exists BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH user_locations AS (
    SELECT p.locations 
    FROM profiles p 
    WHERE p.user_id = target_user_id AND p.status = 'active'
  ),
  location_checks AS (
    SELECT 
      unnest(location_codes) as check_location,
      ul.locations as user_locations
    FROM user_locations ul
  )
  SELECT 
    lc.check_location,
    lc.check_location = ANY(lc.user_locations) as has_access,
    EXISTS(SELECT 1 FROM locations l WHERE l.code = lc.check_location AND l.is_active = true) as location_exists
  FROM location_checks lc;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public';