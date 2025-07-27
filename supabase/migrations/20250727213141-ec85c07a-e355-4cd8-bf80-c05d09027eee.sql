-- Recreate the profile for the new auth user since it was missing
INSERT INTO public.profiles (
  user_id,
  first_name,
  last_name,
  email,
  role,
  access_level,
  restaurant_role,
  location,
  locations,
  department,
  position,
  status,
  has_custom_permissions
) VALUES (
  '9fe42bf5-8c8e-4723-ab65-06c870fc4efb',
  'Utente',
  'Test',
  'tonellomatias@gmail.com',
  'super_admin',
  'general_manager',
  'general_director',
  'all_locations',
  ARRAY['menton', 'lyon'],
  'Management',
  'General Manager',
  'active',
  false
) ON CONFLICT (user_id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  access_level = EXCLUDED.access_level,
  restaurant_role = EXCLUDED.restaurant_role,
  location = EXCLUDED.location,
  locations = EXCLUDED.locations,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  status = EXCLUDED.status,
  has_custom_permissions = EXCLUDED.has_custom_permissions;

-- Auto-join user to all location chats
SELECT * FROM public.sync_user_chat_memberships('9fe42bf5-8c8e-4723-ab65-06c870fc4efb');

-- Final verification
SELECT 
  'Complete Reset Verification' as status,
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM profiles WHERE status = 'active') as active_profiles,
  (SELECT email FROM auth.users LIMIT 1) as auth_email,
  (SELECT first_name || ' ' || last_name FROM profiles LIMIT 1) as profile_name;