-- Fix function search path issues by setting search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_from_invitation()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record public.user_invitations;
BEGIN
  -- Find the invitation by email
  SELECT * INTO invitation_record 
  FROM public.user_invitations 
  WHERE email = NEW.email 
  AND status = 'pending' 
  AND expires_at > now()
  LIMIT 1;

  -- If invitation exists, create profile and mark invitation as completed
  IF invitation_record.id IS NOT NULL THEN
    INSERT INTO public.profiles (
      user_id, 
      first_name, 
      last_name, 
      role, 
      location,
      department,
      position
    ) VALUES (
      NEW.id,
      invitation_record.first_name,
      invitation_record.last_name,
      invitation_record.role,
      invitation_record.location,
      invitation_record.location, -- Use location as department for now
      'Staff' -- Default position
    );

    -- Mark invitation as completed
    UPDATE public.user_invitations 
    SET status = 'completed', completed_at = now()
    WHERE id = invitation_record.id;
  END IF;

  RETURN NEW;
END;
$$;