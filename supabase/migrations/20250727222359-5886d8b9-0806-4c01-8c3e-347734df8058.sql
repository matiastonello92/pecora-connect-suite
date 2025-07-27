-- Temporarily disable the trigger that auto-creates profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Clean up existing test user
DELETE FROM profiles WHERE email = 'tonellomatias@gmail.com';
DELETE FROM auth.users WHERE email = 'tonellomatias@gmail.com';

-- Create the test user manually
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- Insert the auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'tonellomatias@gmail.com',
    crypt('Asd123@@', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Utente","last_name":"Test"}',
    now(),
    now()
  );
  
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
    'super_admin',
    'general_manager',
    'menton',
    ARRAY['menton', 'lyon'],
    'management',
    'General Manager',
    'active',
    false
  );
END $$;

-- Re-create the trigger with better error handling
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    email,
    first_name,
    last_name,
    role,
    access_level,
    location,
    locations,
    department,
    position,
    status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
    'super_admin', -- Default to super_admin instead of staff
    'base',
    'menton',
    ARRAY['menton'],
    'general',
    'Staff',
    'active'
  ) ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_user();