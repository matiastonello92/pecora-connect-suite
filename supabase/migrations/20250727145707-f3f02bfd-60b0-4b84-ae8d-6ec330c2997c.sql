-- IMMEDIATE FIX: Hard delete the problematic user completely
-- Remove Mat Toni from all tables permanently

-- 1. Delete from profiles first
DELETE FROM public.profiles 
WHERE user_id = '9fe42bf5-8c8e-4723-ab65-06c870fc4efb' 
OR (first_name = 'Mat' AND last_name = 'Toni');

-- 2. Delete any auth record if it exists (this might fail if user doesn't exist in auth)
-- Note: We can't directly delete from auth.users but we need to revoke the session

-- 3. Delete any pending invitations for this email
DELETE FROM public.user_invitations 
WHERE email = 'mat.toni@company.com';

-- 4. Keep the archived records for audit trail but mark them as permanently deleted
UPDATE public.archived_users 
SET can_reactivate = false, 
    metadata = jsonb_set(
      COALESCE(metadata, '{}'), 
      '{permanently_deleted}', 
      'true'
    ),
    reason = 'permanent_deletion'
WHERE email = 'mat.toni@company.com';

-- 5. Add email column to profiles table for proper email tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 6. Create index on email for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 7. Update RLS policy to prevent auto-recreation
CREATE OR REPLACE FUNCTION public.is_email_permanently_deleted(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.archived_users 
    WHERE email = check_email 
    AND metadata->>'permanently_deleted' = 'true'
  );
$$;

-- 8. Update the signup function to prevent recreation of permanently deleted users
CREATE OR REPLACE FUNCTION public.handle_user_signup_from_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  invitation_record public.user_invitations;
  custom_perms jsonb;
BEGIN
  -- Check if this email has been permanently deleted
  IF public.is_email_permanently_deleted(NEW.email) THEN
    RAISE EXCEPTION 'Cannot create profile for permanently deleted user: %', NEW.email;
  END IF;

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
      email,
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