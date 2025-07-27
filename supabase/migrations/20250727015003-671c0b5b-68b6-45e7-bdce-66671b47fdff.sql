-- Add function to clean up expired invitations
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Mark expired invitations as expired (but keep records for audit)
  UPDATE public.user_invitations 
  SET status = 'expired'
  WHERE status = 'pending' 
  AND expires_at < now();
END;
$$;

-- Add function to validate invitation token with detailed checking
CREATE OR REPLACE FUNCTION public.validate_invitation_token(token_to_check UUID)
RETURNS TABLE(
  is_valid BOOLEAN,
  error_code TEXT,
  error_message TEXT,
  invitation_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  invitation_record public.user_invitations;
BEGIN
  -- First check if token exists at all
  SELECT * INTO invitation_record
  FROM public.user_invitations 
  WHERE invitation_token = token_to_check;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'TOKEN_NOT_FOUND'::TEXT, 'Invalid invitation token'::TEXT, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Check if already completed
  IF invitation_record.status = 'completed' THEN
    RETURN QUERY SELECT false, 'ALREADY_USED'::TEXT, 'This invitation has already been used'::TEXT, 
                  row_to_json(invitation_record)::JSONB;
    RETURN;
  END IF;
  
  -- Check if expired
  IF invitation_record.expires_at < now() THEN
    -- Mark as expired
    UPDATE public.user_invitations 
    SET status = 'expired'
    WHERE id = invitation_record.id;
    
    RETURN QUERY SELECT false, 'EXPIRED'::TEXT, 'This invitation has expired'::TEXT, 
                  row_to_json(invitation_record)::JSONB;
    RETURN;
  END IF;
  
  -- Check if not pending
  IF invitation_record.status != 'pending' THEN
    RETURN QUERY SELECT false, 'INVALID_STATUS'::TEXT, 
                  format('Invitation status is %s, expected pending', invitation_record.status)::TEXT,
                  row_to_json(invitation_record)::JSONB;
    RETURN;
  END IF;
  
  -- All checks passed
  RETURN QUERY SELECT true, 'VALID'::TEXT, 'Invitation is valid'::TEXT, 
                row_to_json(invitation_record)::JSONB;
END;
$$;

-- Add trigger to automatically clean up expired invitations daily
-- This would normally be a cron job, but we'll create a function that can be called
CREATE OR REPLACE FUNCTION public.auto_cleanup_expired_invitations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Clean up expired invitations when any invitation is accessed
  PERFORM public.cleanup_expired_invitations();
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create indexes for better performance on invitation queries
CREATE INDEX IF NOT EXISTS idx_user_invitations_token_status 
ON public.user_invitations(invitation_token, status) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_user_invitations_expires_status 
ON public.user_invitations(expires_at, status) 
WHERE status = 'pending';

-- Add comment to document the 72-hour expiry requirement
COMMENT ON COLUMN public.user_invitations.expires_at IS 'Invitation expiry timestamp. Default is 7 days from creation. Can be reduced to 72 hours for enhanced security.';