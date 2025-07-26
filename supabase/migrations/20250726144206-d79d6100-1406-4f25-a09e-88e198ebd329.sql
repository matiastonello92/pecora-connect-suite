-- Create the super admin user in Supabase Auth with proper identity

-- First create the user in auth.users
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
) ON CONFLICT (id) DO UPDATE SET
  email = 'matias@pecoranegra.fr',
  encrypted_password = crypt('1234', gen_salt('bf')),
  email_confirmed_at = now(),
  updated_at = now();

-- Create the corresponding identity for the user
INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  created_at,
  updated_at
) VALUES (
  'matias@pecoranegra.fr',
  '11111111-1111-1111-1111-111111111111',
  format('{"sub":"%s","email":"%s"}', '11111111-1111-1111-1111-111111111111', 'matias@pecoranegra.fr')::jsonb,
  'email',
  now(),
  now()
) ON CONFLICT (provider, provider_id) DO UPDATE SET
  user_id = '11111111-1111-1111-1111-111111111111',
  identity_data = format('{"sub":"%s","email":"%s"}', '11111111-1111-1111-1111-111111111111', 'matias@pecoranegra.fr')::jsonb,
  updated_at = now();

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