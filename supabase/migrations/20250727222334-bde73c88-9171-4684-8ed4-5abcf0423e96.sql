-- First, let's check what role values are allowed
SELECT DISTINCT role FROM profiles;

-- Clean up and create the test user properly
DELETE FROM profiles WHERE email = 'tonellomatias@gmail.com';
DELETE FROM auth.users WHERE email = 'tonellomatias@gmail.com';

-- Create the user using the signup process
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert the auth user directly with confirmed email
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'tonellomatias@gmail.com',
    crypt('Asd123@@', gen_salt('bf')),
    now(),
    null,
    null,
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Utente","last_name":"Test"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  -- Get the new user ID
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'tonellomatias@gmail.com';
  
  -- Insert profile with correct role value
  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    email,
    role,
    access_level,
    location,
    locations,
    department,
    position,
    status,
    has_custom_permissions
  ) VALUES (
    new_user_id,
    'Utente',
    'Test',
    'tonellomatias@gmail.com',
    'super_admin',  -- Use valid role value
    'general_manager',
    'menton',
    ARRAY['menton', 'lyon'],
    'management',
    'General Manager',
    'active',
    false
  );
END $$;