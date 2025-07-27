-- Ensure the super_admin user exists in auth.users and can log in
-- First, let's insert the user in auth.users if not exists
DO $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    -- Check if user already exists in auth.users
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'matias@pecoranegra.fr') INTO user_exists;
    
    IF NOT user_exists THEN
        -- Insert the user into auth.users with a default password hash
        -- The user will need to reset their password to log in
        INSERT INTO auth.users (
            id,
            email,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmed_at,
            instance_id
        ) VALUES (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'matias@pecoranegra.fr',
            now(),
            now(),
            now(),
            now(),
            '00000000-0000-0000-0000-000000000000'::uuid
        );
    END IF;
    
    -- Ensure the profile exists and is correctly configured
    INSERT INTO public.profiles (
        user_id,
        first_name,
        last_name,
        role,
        location,
        department,
        position,
        status
    ) VALUES (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'Matias',
        'Tonello',
        'super_admin',
        'all_locations',
        'management',
        'Super Administrator',
        'active'
    ) ON CONFLICT (user_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        location = EXCLUDED.location,
        department = EXCLUDED.department,
        position = EXCLUDED.position,
        status = EXCLUDED.status,
        updated_at = now();
END $$;