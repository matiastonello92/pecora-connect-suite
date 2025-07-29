-- Hierarchical Locations System Migration (Fixed)
-- Adds hierarchical structure support while maintaining backward compatibility

-- Step 1: Add hierarchical columns to locations table
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS parent_location_id UUID REFERENCES public.locations(id),
ADD COLUMN IF NOT EXISTS hierarchy JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS depth INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS path TEXT[] DEFAULT '{}';

-- Step 2: Create function to calculate and update hierarchy
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
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to automatically update hierarchy
CREATE TRIGGER update_location_hierarchy_trigger
  BEFORE INSERT OR UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_location_hierarchy();

-- Step 4: Create function to update child hierarchies when parent changes
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
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger for child updates
CREATE TRIGGER update_child_hierarchies_trigger
  AFTER UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_child_location_hierarchies();

-- Step 6: Create performance indexes (without CONCURRENTLY for migration)
-- GIN index for hierarchy JSONB column (fast querying of hierarchy properties)
CREATE INDEX IF NOT EXISTS idx_locations_hierarchy_gin 
ON public.locations USING GIN (hierarchy);

-- B-tree index for parent_location_id (fast parent-child queries)
CREATE INDEX IF NOT EXISTS idx_locations_parent_id 
ON public.locations (parent_location_id);

-- B-tree index for depth (fast level-based queries)
CREATE INDEX IF NOT EXISTS idx_locations_depth 
ON public.locations (depth);

-- GIN index for path array (fast path-based queries)
CREATE INDEX IF NOT EXISTS idx_locations_path_gin 
ON public.locations USING GIN (path);

-- Composite index for active locations with parent
CREATE INDEX IF NOT EXISTS idx_locations_active_parent 
ON public.locations (is_active, parent_location_id) 
WHERE is_active = true;

-- Step 7: Create materialized view for fast hierarchical queries
CREATE MATERIALIZED VIEW public.location_hierarchy_view AS
WITH RECURSIVE location_tree AS (
  -- Base case: root locations (no parent)
  SELECT 
    id,
    code,
    name,
    parent_location_id,
    hierarchy,
    depth,
    path,
    ARRAY[name] as ancestors,
    ARRAY[code] as ancestor_codes,
    0 as level
  FROM public.locations 
  WHERE parent_location_id IS NULL AND is_active = true
  
  UNION ALL
  
  -- Recursive case: child locations
  SELECT 
    l.id,
    l.code,
    l.name,
    l.parent_location_id,
    l.hierarchy,
    l.depth,
    l.path,
    lt.ancestors || l.name,
    lt.ancestor_codes || l.code,
    lt.level + 1
  FROM public.locations l
  INNER JOIN location_tree lt ON l.parent_location_id = lt.id
  WHERE l.is_active = true
),
location_children AS (
  -- Calculate children for each location
  SELECT 
    parent_location_id as location_id,
    array_agg(name ORDER BY name) as children_names,
    array_agg(code ORDER BY code) as children_codes,
    count(*) as children_count
  FROM public.locations 
  WHERE parent_location_id IS NOT NULL AND is_active = true
  GROUP BY parent_location_id
)
SELECT 
  lt.id,
  lt.code,
  lt.name,
  lt.parent_location_id,
  lt.hierarchy,
  lt.depth,
  lt.path,
  lt.ancestors,
  lt.ancestor_codes,
  lt.level,
  COALESCE(lc.children_names, '{}') as children_names,
  COALESCE(lc.children_codes, '{}') as children_codes,
  COALESCE(lc.children_count, 0) as children_count,
  -- Additional computed fields for easy querying
  (lt.hierarchy->>'country') as country,
  (lt.hierarchy->>'region') as region,
  (lt.hierarchy->>'city') as city,
  (lt.hierarchy->>'district') as district,
  -- Full path as string for easy display
  array_to_string(lt.ancestors, ' > ') as full_path,
  -- Root location ID
  CASE WHEN array_length(lt.ancestor_codes, 1) > 0 
       THEN (SELECT id FROM public.locations WHERE code = lt.ancestor_codes[1])
       ELSE lt.id 
  END as root_location_id
FROM location_tree lt
LEFT JOIN location_children lc ON lt.id = lc.location_id
ORDER BY lt.path;

-- Step 8: Create utility functions for hierarchy operations

-- Function to get all descendants of a location
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
$$ LANGUAGE plpgsql STABLE;

-- Function to get all ancestors of a location
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
$$ LANGUAGE plpgsql STABLE;

-- Function to get locations by hierarchy level
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
$$ LANGUAGE plpgsql STABLE;

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION public.refresh_location_hierarchy_view()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.location_hierarchy_view;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Initialize existing locations with hierarchy data
DO $$
DECLARE
  loc RECORD;
BEGIN
  -- Process locations in order (roots first, then children)
  FOR loc IN 
    SELECT id FROM public.locations 
    WHERE is_active = true 
    ORDER BY CASE WHEN parent_location_id IS NULL THEN 0 ELSE 1 END, name
  LOOP
    -- Trigger the hierarchy update by touching the record
    UPDATE public.locations 
    SET updated_at = NOW() 
    WHERE id = loc.id;
  END LOOP;
END $$;

-- Step 10: Refresh the materialized view initially
SELECT public.refresh_location_hierarchy_view();