-- Create function to handle user registration from invitation
CREATE OR REPLACE FUNCTION public.handle_user_signup_from_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  invitation_record public.user_invitations;
  custom_perms jsonb;
BEGIN
  -- Find the invitation by email
  SELECT * INTO invitation_record 
  FROM public.user_invitations 
  WHERE email = NEW.email 
  AND status = 'pending' 
  AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  -- If invitation exists, create profile with invitation data
  IF invitation_record.id IS NOT NULL THEN
    INSERT INTO public.profiles (
      user_id, 
      first_name, 
      last_name, 
      role, 
      restaurant_role,
      access_level,
      location,
      department,
      position,
      has_custom_permissions
    ) VALUES (
      NEW.id,
      invitation_record.first_name,
      invitation_record.last_name,
      invitation_record.role,
      invitation_record.restaurant_role,
      invitation_record.access_level,
      invitation_record.location,
      invitation_record.location, -- Use location as department for now
      'Staff', -- Default position
      CASE WHEN invitation_record.metadata IS NOT NULL 
           AND invitation_record.metadata != '{}' 
           THEN true 
           ELSE false END
    );

    -- If there are custom permissions in metadata, create them
    IF invitation_record.metadata IS NOT NULL AND invitation_record.metadata != '{}' THEN
      -- Parse the metadata to extract custom permissions
      custom_perms := invitation_record.metadata::jsonb;
      
      -- Insert custom permissions if they exist
      IF custom_perms ? 'customPermissions' THEN
        -- This would require additional logic to parse and insert permissions
        -- For now, we'll mark that custom permissions exist
        UPDATE public.profiles 
        SET has_custom_permissions = true
        WHERE user_id = NEW.id;
      END IF;
    END IF;

    -- Mark invitation as completed
    UPDATE public.user_invitations 
    SET status = 'completed', completed_at = now()
    WHERE id = invitation_record.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_signup_from_invitation();