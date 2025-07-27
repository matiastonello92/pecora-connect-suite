-- Add backend validation function for user locations
CREATE OR REPLACE FUNCTION public.validate_user_locations()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure user always has at least one location
  IF NEW.locations IS NULL OR array_length(NEW.locations, 1) IS NULL OR array_length(NEW.locations, 1) = 0 THEN
    RAISE EXCEPTION 'User must have at least one location assigned';
  END IF;
  
  -- Validate that all locations exist in the locations table (if we have one)
  -- For now, just ensure they're not empty strings
  IF EXISTS (SELECT 1 FROM unnest(NEW.locations) AS loc WHERE loc = '' OR loc IS NULL) THEN
    RAISE EXCEPTION 'Location values cannot be empty';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for profiles table
DROP TRIGGER IF EXISTS validate_user_locations_trigger ON public.profiles;
CREATE TRIGGER validate_user_locations_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_locations();

-- Add similar validation for user_invitations
CREATE OR REPLACE FUNCTION public.validate_invitation_locations()
RETURNS TRIGGER AS $$
BEGIN
  -- For invitations, we can accept either location (old field) or locations (new field)
  -- But at least one must be set
  IF (NEW.location IS NULL OR NEW.location = '') AND 
     (NEW.locations IS NULL OR array_length(NEW.locations, 1) IS NULL OR array_length(NEW.locations, 1) = 0) THEN
    RAISE EXCEPTION 'Invitation must have at least one location assigned';
  END IF;
  
  -- If locations array is provided, validate it
  IF NEW.locations IS NOT NULL AND array_length(NEW.locations, 1) > 0 THEN
    IF EXISTS (SELECT 1 FROM unnest(NEW.locations) AS loc WHERE loc = '' OR loc IS NULL) THEN
      RAISE EXCEPTION 'Location values cannot be empty';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for user_invitations table  
DROP TRIGGER IF EXISTS validate_invitation_locations_trigger ON public.user_invitations;
CREATE TRIGGER validate_invitation_locations_trigger
  BEFORE INSERT OR UPDATE ON public.user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_invitation_locations();