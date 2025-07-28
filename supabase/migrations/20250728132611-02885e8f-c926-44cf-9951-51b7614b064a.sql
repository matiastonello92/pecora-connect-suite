-- Make user matias@pecoranegra.fr fully active with password Asd123@@

-- Update the user to be confirmed and set password
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW(),
  encrypted_password = crypt('Asd123@@', gen_salt('bf'))
WHERE email = 'matias@pecoranegra.fr';

-- Ensure the user profile exists and is active
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
)
SELECT 
  id,
  email,
  'Matias',
  'Admin',
  'super_admin',
  'general_manager',
  'menton',
  ARRAY['menton'],
  'management',
  'Administrator',
  'active'
FROM auth.users 
WHERE email = 'matias@pecoranegra.fr'
ON CONFLICT (user_id) DO UPDATE SET
  status = 'active',
  role = 'super_admin',
  access_level = 'general_manager';

-- Sync user to location chats
SELECT public.sync_user_chat_memberships(
  (SELECT id FROM auth.users WHERE email = 'matias@pecoranegra.fr')
);