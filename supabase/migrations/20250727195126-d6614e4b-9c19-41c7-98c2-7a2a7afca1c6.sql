-- Sync all users to their location-based chats with new locations system
-- This ensures all existing users are joined to the correct chats after the refactor

-- First, ensure all default chats exist for all locations
SELECT public.ensure_chats_for_all_locations();

-- Sync all active users to their appropriate chats based on their new locations array
DO $$
DECLARE
    user_record RECORD;
    sync_result RECORD;
BEGIN
    -- Loop through all active users
    FOR user_record IN 
        SELECT user_id, first_name, last_name, locations 
        FROM profiles 
        WHERE status = 'active' AND user_id IS NOT NULL
    LOOP
        -- Sync each user to their location-based chats
        FOR sync_result IN 
            SELECT * FROM public.sync_user_chat_memberships(user_record.user_id)
        LOOP
            RAISE NOTICE 'User % %: % - % (%)', 
                user_record.first_name, 
                user_record.last_name,
                sync_result.action,
                sync_result.message,
                sync_result.location_code;
        END LOOP;
    END LOOP;
END $$;

-- Validate the system health
SELECT * FROM public.validate_location_system_health();