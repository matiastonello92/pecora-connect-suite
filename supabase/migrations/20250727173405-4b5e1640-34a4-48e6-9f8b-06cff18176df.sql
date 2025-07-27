-- Fix invitation system issues and ensure proper token management

-- 1. Add trigger to ensure unique invitation tokens on every insert/update
CREATE OR REPLACE FUNCTION public.generate_unique_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
  -- Always generate a new unique token
  NEW.invitation_token = gen_random_uuid();
  
  -- Ensure fresh expiry date (7 days from now)
  NEW.expires_at = NOW() + INTERVAL '7 days';
  
  -- Update created_at if this is an update (for resends)
  IF TG_OP = 'UPDATE' THEN
    NEW.created_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS ensure_unique_invitation_token ON public.user_invitations;

-- Create trigger for both INSERT and UPDATE
CREATE TRIGGER ensure_unique_invitation_token
  BEFORE INSERT OR UPDATE ON public.user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_unique_invitation_token();

-- 2. Add improved validation function for invitation tokens
CREATE OR REPLACE FUNCTION public.validate_invitation_comprehensive(token_to_check uuid)
RETURNS TABLE(
  is_valid boolean,
  error_code text,
  error_message text,
  invitation_data jsonb
) AS $$
DECLARE
  invitation_record public.user_invitations;
  existing_user_count integer;
BEGIN
  -- First check if token exists at all
  SELECT * INTO invitation_record
  FROM public.user_invitations 
  WHERE invitation_token = token_to_check;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'TOKEN_NOT_FOUND'::text, 
      'Invalid invitation token. Please check your email for the correct link.'::text, 
      NULL::jsonb;
    RETURN;
  END IF;
  
  -- Check if already completed
  IF invitation_record.status = 'completed' THEN
    RETURN QUERY SELECT false, 'ALREADY_USED'::text, 
      'This invitation has already been used. Contact support for a new invitation.'::text,
      row_to_json(invitation_record)::jsonb;
    RETURN;
  END IF;
  
  -- Check if expired
  IF invitation_record.expires_at < NOW() THEN
    -- Mark as expired
    UPDATE public.user_invitations 
    SET status = 'expired'
    WHERE id = invitation_record.id;
    
    RETURN QUERY SELECT false, 'EXPIRED'::text, 
      'This invitation has expired. Please request a new invitation.'::text,
      row_to_json(invitation_record)::jsonb;
    RETURN;
  END IF;
  
  -- Check if user already exists with this email
  SELECT COUNT(*) INTO existing_user_count
  FROM public.profiles 
  WHERE email = invitation_record.email;
  
  IF existing_user_count > 0 THEN
    RETURN QUERY SELECT false, 'USER_EXISTS'::text,
      'A user with this email already exists. Please contact support.'::text,
      row_to_json(invitation_record)::jsonb;
    RETURN;
  END IF;
  
  -- Check if not pending
  IF invitation_record.status != 'pending' THEN
    RETURN QUERY SELECT false, 'INVALID_STATUS'::text, 
      format('Invitation status is %s, expected pending', invitation_record.status)::text,
      row_to_json(invitation_record)::jsonb;
    RETURN;
  END IF;
  
  -- All checks passed
  RETURN QUERY SELECT true, 'VALID'::text, 
    'Invitation is valid'::text,
    row_to_json(invitation_record)::jsonb;
END;
$$ LANGUAGE plpgsql;

-- 3. Add function to handle invitation completion properly
CREATE OR REPLACE FUNCTION public.complete_invitation_signup(
  token_to_complete uuid,
  user_email text,
  new_user_id uuid
)
RETURNS TABLE(
  success boolean,
  error_code text,
  error_message text
) AS $$
DECLARE
  invitation_record public.user_invitations;
BEGIN
  -- Validate the invitation first
  SELECT * INTO invitation_record
  FROM public.user_invitations 
  WHERE invitation_token = token_to_complete
    AND status = 'pending'
    AND expires_at > NOW()
    AND email = user_email;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'INVALID_INVITATION'::text,
      'Invalid or expired invitation'::text;
    RETURN;
  END IF;
  
  -- Mark invitation as completed
  UPDATE public.user_invitations 
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE id = invitation_record.id;
  
  -- Create profile if it doesn't exist
  INSERT INTO public.profiles (
    user_id, 
    first_name, 
    last_name, 
    email,
    role, 
    restaurant_role,
    access_level,
    location,
    department,
    position,
    has_custom_permissions,
    status
  ) VALUES (
    new_user_id,
    invitation_record.first_name,
    invitation_record.last_name,
    invitation_record.email,
    invitation_record.role,
    invitation_record.restaurant_role,
    invitation_record.access_level,
    invitation_record.location,
    invitation_record.location, -- Use location as department for now
    'Staff', -- Default position
    CASE WHEN invitation_record.metadata IS NOT NULL 
         AND invitation_record.metadata != '{}' 
         THEN true 
         ELSE false END,
    'active' -- Set status to active immediately
  ) ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    restaurant_role = EXCLUDED.restaurant_role,
    access_level = EXCLUDED.access_level,
    location = EXCLUDED.location,
    status = 'active';
  
  -- Clean up any other pending invitations for this email
  UPDATE public.user_invitations 
  SET status = 'superseded'
  WHERE email = user_email 
    AND status = 'pending' 
    AND id != invitation_record.id;
  
  RETURN QUERY SELECT true, 'SUCCESS'::text, 'Invitation completed successfully'::text;
END;
$$ LANGUAGE plpgsql;

-- 4. Improve the cleanup function to be more thorough
CREATE OR REPLACE FUNCTION public.cleanup_invitation_system()
RETURNS void AS $$
BEGIN
  -- Mark expired invitations
  UPDATE public.user_invitations 
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW();
  
  -- Mark invitations as superseded if user already exists
  UPDATE public.user_invitations 
  SET status = 'superseded'
  WHERE status = 'pending'
    AND email IN (
      SELECT email FROM public.profiles WHERE email IS NOT NULL
    );
  
  -- Clean up old expired invitations (older than 30 days)
  DELETE FROM public.user_invitations 
  WHERE status IN ('expired', 'superseded')
    AND expires_at < NOW() - INTERVAL '30 days';
    
END;
$$ LANGUAGE plpgsql;