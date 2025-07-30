-- Phase 1: Clean up location database - keep only real locations
-- Delete all test locations and keep only menton and lyon

-- First, let's see what locations we have and clean them up
-- We'll keep only the real locations: menton and lyon

-- Delete all locations except menton and lyon
DELETE FROM public.locations 
WHERE code NOT IN ('menton', 'lyon');

-- Ensure menton and lyon exist with correct data
INSERT INTO public.locations (code, name, is_active) VALUES
  ('menton', 'Menton', true),
  ('lyon', 'Lyon', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;

-- Phase 2: Update matias@pecoranegra.fr user to have full access
-- Ensure the user has access to both locations and highest permissions
UPDATE public.profiles 
SET 
  locations = ARRAY['menton', 'lyon'],
  access_level = 'general_manager',
  role = 'super_admin',
  has_custom_permissions = false,
  status = 'active'
WHERE email = 'matias@pecoranegra.fr';

-- If the profile doesn't exist, create it
INSERT INTO public.profiles (
  user_id,
  email,
  first_name,
  last_name,
  locations,
  access_level,
  role,
  has_custom_permissions,
  status,
  department,
  position
)
SELECT 
  u.id,
  'matias@pecoranegra.fr',
  'Matias',
  'Admin',
  ARRAY['menton', 'lyon'],
  'general_manager'::access_level,
  'super_admin',
  false,
  'active',
  'management',
  'General Manager'
FROM auth.users u 
WHERE u.email = 'matias@pecoranegra.fr'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.email = 'matias@pecoranegra.fr'
  );

-- Phase 3: Update the create_profile_for_user function to only assign real locations
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
    locations,
    department,
    position,
    status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
    'super_admin',
    'general_manager',
    ARRAY['menton', 'lyon'], -- Always assign both real locations
    'general',
    'Staff',
    'active'
  ) ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';