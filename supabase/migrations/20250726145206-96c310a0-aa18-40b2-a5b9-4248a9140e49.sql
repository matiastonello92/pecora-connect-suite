-- Update existing location values to use new standardized format
UPDATE profiles 
SET location = CASE 
  WHEN location = 'all_locations' THEN 'all_locations'
  WHEN location ILIKE '%menton%' THEN 'menton'
  WHEN location ILIKE '%lyon%' THEN 'lyon'
  ELSE 'menton' -- default fallback for any other values
END;

-- Add constraint to ensure valid location values for profiles
ALTER TABLE profiles 
ADD CONSTRAINT check_valid_location 
CHECK (location IN ('menton', 'lyon', 'all_locations'));

-- Update user_invitations location constraint to match new values
ALTER TABLE user_invitations 
DROP CONSTRAINT IF EXISTS check_valid_invitation_location;

ALTER TABLE user_invitations
ADD CONSTRAINT check_valid_invitation_location 
CHECK (location IN ('menton', 'lyon', 'all_locations'));