-- Create the super admin user in Supabase Auth
-- We need to use admin functions to create a user with a specific password

-- First create the user in auth.users with a specific user_id
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'matias@pecoranegra.fr',
  crypt('1234', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Create the corresponding identity for the user
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  format('{"sub":"%s","email":"%s"}', '11111111-1111-1111-1111-111111111111', 'matias@pecoranegra.fr')::jsonb,
  'email',
  now(),
  now()
);

-- Create the profile for the super admin user
INSERT INTO profiles (
  user_id,
  first_name,
  last_name,
  role,
  location,
  department,
  position,
  status,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Matias',
  'Tonello',
  'super_admin',
  'all_locations',
  'management',
  'Direttore Generale',
  'active',
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  first_name = 'Matias',
  last_name = 'Tonello',
  role = 'super_admin',
  location = 'all_locations',
  department = 'management',
  position = 'Direttore Generale',
  status = 'active',
  updated_at = now();