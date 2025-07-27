-- Create profile for the existing auth user with correct enum values
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
);

-- Phase 2C: Auto-join user to all location chats
-- First ensure all required chats exist
SELECT * FROM public.ensure_chats_for_all_locations();

-- Then sync the user to all their location chats
SELECT * FROM public.sync_user_chat_memberships('9fe42bf5-8c8e-4723-ab65-06c870fc4efb');

-- Phase 2D: Validation - Check the results
SELECT 
  'User Profile Created' as status,
  p.first_name,
  p.last_name,
  p.email,
  p.access_level,
  p.locations,
  p.status
FROM profiles p 
WHERE p.user_id = '9fe42bf5-8c8e-4723-ab65-06c870fc4efb';

-- Check chat memberships
SELECT 
  'Chat Memberships' as status,
  c.name,
  c.type,
  c.location,
  cp.role
FROM chat_participants cp
JOIN chats c ON cp.chat_id = c.id
WHERE cp.user_id = '9fe42bf5-8c8e-4723-ab65-06c870fc4efb'
ORDER BY c.location, c.type;