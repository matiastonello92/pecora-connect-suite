-- First, let's create the user using Supabase's auth system
-- We'll create the profile manually after

-- Create the profile for the super admin user
-- Using 'Pecora Negra' as location since 'PecoraNegra' might not be in allowed values
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
  '00000000-0000-0000-0000-000000000001', -- Temporary UUID, will be updated
  'Matias',
  'Tonello', 
  'super_admin',
  'Pecora Negra',
  'management',
  'Direttore Generale',
  'active',
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  first_name = 'Matias',
  last_name = 'Tonello',
  role = 'super_admin',
  location = 'Pecora Negra',
  department = 'management',
  position = 'Direttore Generale',
  status = 'active',
  updated_at = now();