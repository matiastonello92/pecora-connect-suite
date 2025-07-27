-- Add trigger to invalidate invitation tokens when invitation is deleted
CREATE OR REPLACE FUNCTION public.invalidate_deleted_invitation_tokens()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- The deletion itself removes the record, making the token invalid
  -- This trigger is for any additional cleanup if needed
  RETURN OLD;
END;
$$;

-- Create trigger for invitation deletion
DROP TRIGGER IF EXISTS on_invitation_deleted ON public.user_invitations;
CREATE TRIGGER on_invitation_deleted
  AFTER DELETE ON public.user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.invalidate_deleted_invitation_tokens();