-- Add missing DELETE policy for user_invitations table
-- This was preventing actual deletion of invitation records
CREATE POLICY "Admins can delete invitations" 
ON public.user_invitations 
FOR DELETE 
USING (get_current_user_role() = ANY (ARRAY['manager'::text, 'super_admin'::text]));

-- Add function to handle email reuse for invitations
CREATE OR REPLACE FUNCTION public.handle_invitation_email_reuse()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Delete any existing pending invitation for the same email
  -- This allows email reuse after deletion or expiration
  DELETE FROM public.user_invitations 
  WHERE email = NEW.email 
  AND status = 'pending' 
  AND id != NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically handle email reuse
CREATE TRIGGER handle_invitation_email_reuse_trigger
  BEFORE INSERT ON public.user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invitation_email_reuse();