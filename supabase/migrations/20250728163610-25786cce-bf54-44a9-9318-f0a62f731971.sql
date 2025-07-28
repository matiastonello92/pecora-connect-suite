-- Fix the user profile to have correct locations array
UPDATE profiles 
SET locations = ARRAY['menton', 'lyon']
WHERE email = 'matias@pecoranegra.fr';

-- Verify the update
SELECT user_id, email, first_name, last_name, role, access_level, location, locations, status 
FROM profiles 
WHERE email = 'matias@pecoranegra.fr';