-- Fix security warnings by setting proper search paths for functions

-- Fix the hierarchy functions with proper search paths
CREATE OR REPLACE FUNCTION public.update_location_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  parent_rec RECORD;
  new_hierarchy JSONB := '{}';
  new_depth INTEGER := 0;
  new_path TEXT[] := '{}';
BEGIN
  -- If this location has a parent, get parent's hierarchy info
  IF NEW.parent_location_id IS NOT NULL THEN
    SELECT hierarchy, depth, path 
    INTO parent_rec 
    FROM public.locations 
    WHERE id = NEW.parent_location_id;
    
    IF FOUND THEN
      -- Inherit parent's hierarchy and add current location
      new_hierarchy := parent_rec.hierarchy;
      new_depth := parent_rec.depth + 1;
      new_path := parent_rec.path || NEW.code;
      
      -- Add current location to hierarchy based on depth
      CASE new_depth
        WHEN 1 THEN 
          new_hierarchy := new_hierarchy || jsonb_build_object('country', NEW.name);
        WHEN 2 THEN 
          new_hierarchy := new_hierarchy || jsonb_build_object('region', NEW.name);
        WHEN 3 THEN 
          new_hierarchy := new_hierarchy || jsonb_build_object('city', NEW.name);
        WHEN 4 THEN 
          new_hierarchy := new_hierarchy || jsonb_build_object('district', NEW.name);
        ELSE 
          new_hierarchy := new_hierarchy || jsonb_build_object('location_' || new_depth::text, NEW.name);
      END CASE;
    END IF;
  ELSE
    -- Root location (no parent)
    new_hierarchy := jsonb_build_object('country', NEW.name);
    new_depth := 1;
    new_path := ARRAY[NEW.code];
  END IF;
  
  -- Update the current record
  NEW.hierarchy := new_hierarchy;
  NEW.depth := new_depth;
  NEW.path := new_path;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.update_child_location_hierarchies()
RETURNS TRIGGER AS $$
BEGIN
  -- If hierarchy changed, update all children recursively
  IF OLD.hierarchy IS DISTINCT FROM NEW.hierarchy OR 
     OLD.depth IS DISTINCT FROM NEW.depth OR 
     OLD.path IS DISTINCT FROM NEW.path THEN
    
    -- Update all direct children
    UPDATE public.locations 
    SET updated_at = NOW()
    WHERE parent_location_id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.get_location_descendants(location_id UUID)
RETURNS TABLE(
  id UUID,
  code TEXT,
  name TEXT,
  depth INTEGER,
  full_path TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lhv.id,
    lhv.code,
    lhv.name,
    lhv.depth,
    lhv.full_path
  FROM public.location_hierarchy_view lhv
  WHERE location_id = ANY(lhv.ancestor_codes::TEXT[])
     OR lhv.id = get_location_descendants.location_id
  ORDER BY lhv.depth, lhv.name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.get_location_ancestors(location_id UUID)
RETURNS TABLE(
  id UUID,
  code TEXT,
  name TEXT,
  depth INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE ancestors AS (
    SELECT l.id, l.code, l.name, l.depth, l.parent_location_id
    FROM public.locations l
    WHERE l.id = location_id
    
    UNION ALL
    
    SELECT l.id, l.code, l.name, l.depth, l.parent_location_id
    FROM public.locations l
    INNER JOIN ancestors a ON l.id = a.parent_location_id
  )
  SELECT a.id, a.code, a.name, a.depth
  FROM ancestors a
  WHERE a.id != location_id
  ORDER BY a.depth;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.get_locations_by_level(level_name TEXT DEFAULT 'city')
RETURNS TABLE(
  id UUID,
  code TEXT,
  name TEXT,
  hierarchy JSONB,
  full_path TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lhv.id,
    lhv.code,
    lhv.name,
    lhv.hierarchy,
    lhv.full_path
  FROM public.location_hierarchy_view lhv
  WHERE lhv.hierarchy ? level_name
  ORDER BY lhv.hierarchy->>level_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public';

-- Fix the refresh function
CREATE OR REPLACE FUNCTION public.refresh_hierarchy_view_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh the materialized view when locations change
  PERFORM public.refresh_location_hierarchy_view();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';