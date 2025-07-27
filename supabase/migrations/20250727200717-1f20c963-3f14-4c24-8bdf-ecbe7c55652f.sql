-- Fix search path warnings for the new validation functions
CREATE OR REPLACE FUNCTION public.validate_user_locations()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix search path warnings for invitation validation function
CREATE OR REPLACE FUNCTION public.validate_invitation_locations()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;