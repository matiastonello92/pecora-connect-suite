-- Remove old location constraints that have outdated values
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_location_check;

-- Remove outdated user_invitations constraint
ALTER TABLE user_invitations DROP CONSTRAINT IF EXISTS user_invitations_location_check;

-- Verify our new constraints are in place and working
-- The check_valid_location and check_valid_invitation_location should remain