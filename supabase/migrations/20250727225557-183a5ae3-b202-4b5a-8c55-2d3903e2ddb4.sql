-- Fix NULL confirmation_token values in auth.users table
-- This resolves the "converting NULL to string is unsupported" error during login

UPDATE auth.users 
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE confirmation_token IS NULL OR email_confirmed_at IS NULL;

-- Add a function to prevent future NULL confirmation_token issues
CREATE OR REPLACE FUNCTION auth.ensure_confirmation_token()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure confirmation_token is never NULL
  IF NEW.confirmation_token IS NULL THEN
    NEW.confirmation_token = '';
  END IF;
  
  -- Ensure email_confirmed_at is set for confirmed users
  IF NEW.email_confirmed_at IS NULL AND NEW.confirmation_token = '' THEN
    NEW.email_confirmed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically handle future inserts/updates
DROP TRIGGER IF EXISTS ensure_confirmation_token_trigger ON auth.users;
CREATE TRIGGER ensure_confirmation_token_trigger
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.ensure_confirmation_token();