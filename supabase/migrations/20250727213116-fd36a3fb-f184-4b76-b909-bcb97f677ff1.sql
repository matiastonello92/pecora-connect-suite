-- Complete User Reset - Phase 3: Fix Auth Table Issue
-- WARNING: This will delete ALL users from auth.users and recreate only the new user

-- Step 1: Clear all existing auth users and sessions
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.identities;
DELETE FROM auth.users;

-- Step 2: Create the new auth user with the exact UUID we used in profiles
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
) VALUES (
  '9fe42bf5-8c8e-4723-ab65-06c870fc4efb',
  '00000000-0000-0000-0000-000000000000',
  'tonellomatias@gmail.com',
  crypt('Asd123@@', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  '',
  'authenticated',
  'authenticated',
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Utente", "last_name": "Test"}',
  false,
  null,
  null,
  '',
  '',
  '',
  0,
  null,
  '',
  null,
  false,
  null,
  false
);

-- Step 3: Create the corresponding auth identity
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9fe42bf5-8c8e-4723-ab65-06c870fc4efb',
  json_build_object(
    'sub', '9fe42bf5-8c8e-4723-ab65-06c870fc4efb',
    'email', 'tonellomatias@gmail.com',
    'email_verified', true
  ),
  'email',
  '9fe42bf5-8c8e-4723-ab65-06c870fc4efb',
  now(),
  now(),
  now()
);

-- Step 4: Verification - Check that only one user exists in auth.users
SELECT 
  'Auth Users Count' as check_type,
  COUNT(*) as count,
  string_agg(email, ', ') as emails
FROM auth.users;

-- Step 5: Verification - Check that the profile is properly linked
SELECT 
  'Profile Link Check' as check_type,
  p.first_name,
  p.last_name,
  p.email,
  p.access_level,
  CASE WHEN au.id IS NOT NULL THEN 'LINKED' ELSE 'NOT LINKED' END as auth_status
FROM profiles p
LEFT JOIN auth.users au ON p.user_id = au.id
WHERE p.user_id = '9fe42bf5-8c8e-4723-ab65-06c870fc4efb';

-- Step 6: Final system health check
SELECT 
  'System Status' as check_type,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM profiles WHERE status = 'active') as active_profiles_count,
  (SELECT COUNT(*) FROM archived_users) as archived_users_count,
  (SELECT COUNT(*) FROM chat_participants) as chat_participants_count;