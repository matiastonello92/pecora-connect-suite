-- COMPREHENSIVE LOCATION MANAGEMENT REFACTOR (CORRECTED)
-- Convert from single location (string) to multiple locations (array)

-- Step 1: Create locations management table for dynamic location handling
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert current locations
INSERT INTO public.locations (code, name) VALUES 
  ('menton', 'Menton'),
  ('lyon', 'Lyon')
ON CONFLICT (code) DO NOTHING;

-- Step 2: Add new locations column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locations TEXT[] DEFAULT '{}';

-- Step 3: Migrate existing location data to locations array
UPDATE public.profiles 
SET locations = CASE 
  WHEN location = 'all_locations' THEN ARRAY['menton', 'lyon']
  WHEN location IN ('menton', 'lyon') THEN ARRAY[location]
  ELSE ARRAY['menton'] -- fallback for any unexpected values
END
WHERE locations = '{}' OR locations IS NULL;

-- Step 4: Ensure all users have at least one location
UPDATE public.profiles 
SET locations = ARRAY['menton'] 
WHERE locations = '{}' OR locations IS NULL OR array_length(locations, 1) IS NULL;

-- Step 5: Add constraint to ensure locations array is never empty
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_locations_not_empty 
CHECK (array_length(locations, 1) >= 1);

-- Step 6: Update user_invitations table to support multiple locations
ALTER TABLE public.user_invitations ADD COLUMN IF NOT EXISTS locations TEXT[] DEFAULT '{}';

-- Migrate existing invitation location data
UPDATE public.user_invitations 
SET locations = CASE 
  WHEN location = 'all_locations' THEN ARRAY['menton', 'lyon']
  WHEN location IN ('menton', 'lyon') THEN ARRAY[location]
  ELSE ARRAY['menton']
END
WHERE locations = '{}' OR locations IS NULL;

-- Step 7: Update archived_users table to support multiple locations
ALTER TABLE public.archived_users ADD COLUMN IF NOT EXISTS locations TEXT[] DEFAULT '{}';

-- Migrate existing archived user location data
UPDATE public.archived_users 
SET locations = CASE 
  WHEN location = 'all_locations' THEN ARRAY['menton', 'lyon']
  WHEN location IN ('menton', 'lyon') THEN ARRAY[location]
  ELSE ARRAY['menton']
END
WHERE locations = '{}' OR locations IS NULL;

-- Step 8: Create function to get all active locations dynamically
CREATE OR REPLACE FUNCTION public.get_active_locations()
RETURNS TABLE(code TEXT, name TEXT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT l.code, l.name FROM public.locations l WHERE l.is_active = true ORDER BY l.name;
$$;

-- Step 9: Create function to get user's locations
CREATE OR REPLACE FUNCTION public.get_current_user_locations()
RETURNS TEXT[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(locations, ARRAY['menton']) FROM profiles WHERE user_id = auth.uid();
$$;

-- Step 10: Update get_current_user_location to return first location for compatibility
CREATE OR REPLACE FUNCTION public.get_current_user_location()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(locations[1], 'menton') FROM profiles WHERE user_id = auth.uid();
$$;

-- Step 11: Create function to check if user has access to location (CORRECTED)
CREATE OR REPLACE FUNCTION public.user_has_access_to_location(check_location TEXT, user_uuid UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_locations TEXT[];
BEGIN
  SELECT COALESCE(locations, ARRAY['menton']) INTO user_locations
  FROM profiles 
  WHERE user_id = COALESCE(user_uuid, auth.uid());
  
  RETURN check_location = ANY(user_locations);
END;
$$;

-- Enable RLS on locations table
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for locations
CREATE POLICY "Anyone can view active locations" ON public.locations
FOR SELECT USING (is_active = true);