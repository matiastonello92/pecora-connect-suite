-- Create super admin user directly in the database
-- First, we need to create the auth user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'matias@pecoranegra.fr',
  crypt('1234', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  ''
);

-- Create the corresponding profile
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
) SELECT 
  id,
  'Matias',
  'Tonello',
  'super_admin',
  'PecoraNegra',
  'management',
  'Direttore Generale',
  'active',
  now(),
  now()
FROM auth.users 
WHERE email = 'matias@pecoranegra.fr';