-- Scalable Location Management Test Data Population Script (Working Version)
-- This script generates 10,000 locations with hierarchical structure

-- Create user_locations table for many-to-many relationship (if not exists)
CREATE TABLE IF NOT EXISTS public.user_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role TEXT DEFAULT 'member',
    UNIQUE(user_id, location_id)
);

-- Enable RLS on user_locations
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- RLS policy for user_locations (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_locations' 
        AND policyname = 'Users can view their own location assignments'
    ) THEN
        CREATE POLICY "Users can view their own location assignments"
        ON public.user_locations
        FOR SELECT
        USING (user_id = auth.uid());
    END IF;
END $$;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON public.locations(parent_location_id);
CREATE INDEX IF NOT EXISTS idx_locations_hierarchy_gin ON public.locations USING GIN(hierarchy);
CREATE INDEX IF NOT EXISTS idx_locations_code ON public.locations(code);
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON public.locations(is_active);
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON public.user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_location_id ON public.user_locations(location_id);

-- Generate Countries (10 countries)
INSERT INTO public.locations (code, name, parent_location_id, hierarchy, depth, path, is_active)
SELECT 
    'test_country_' || i,
    CASE i
        WHEN 1 THEN 'Italy'
        WHEN 2 THEN 'France' 
        WHEN 3 THEN 'Germany'
        WHEN 4 THEN 'Spain'
        WHEN 5 THEN 'United Kingdom'
        WHEN 6 THEN 'Netherlands'
        WHEN 7 THEN 'Belgium'
        WHEN 8 THEN 'Switzerland'
        WHEN 9 THEN 'Austria'
        WHEN 10 THEN 'Portugal'
    END,
    NULL,
    jsonb_build_object('country', 
        CASE i
            WHEN 1 THEN 'Italy'
            WHEN 2 THEN 'France'
            WHEN 3 THEN 'Germany'
            WHEN 4 THEN 'Spain'
            WHEN 5 THEN 'United Kingdom'
            WHEN 6 THEN 'Netherlands'
            WHEN 7 THEN 'Belgium'
            WHEN 8 THEN 'Switzerland'
            WHEN 9 THEN 'Austria'
            WHEN 10 THEN 'Portugal'
        END
    ),
    1,
    ARRAY['test_country_' || i],
    true
FROM generate_series(1, 10) AS i
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE code = 'test_country_' || i);

-- Generate Regions (10 regions per country = 100 total)
INSERT INTO public.locations (code, name, parent_location_id, hierarchy, depth, path, is_active)
SELECT 
    'test_region_' || ((c.i - 1) * 10 + r.i),
    CASE 
        WHEN c.i = 1 THEN -- Italy regions
            CASE r.i
                WHEN 1 THEN 'Lombardy' WHEN 2 THEN 'Lazio' WHEN 3 THEN 'Veneto'
                WHEN 4 THEN 'Campania' WHEN 5 THEN 'Sicily' WHEN 6 THEN 'Piedmont'
                WHEN 7 THEN 'Tuscany' WHEN 8 THEN 'Emilia-Romagna' WHEN 9 THEN 'Puglia'
                WHEN 10 THEN 'Liguria'
            END
        WHEN c.i = 2 THEN -- France regions
            CASE r.i
                WHEN 1 THEN 'Île-de-France' WHEN 2 THEN 'Provence-Alpes-Côte d''Azur'
                WHEN 3 THEN 'Auvergne-Rhône-Alpes' WHEN 4 THEN 'Nouvelle-Aquitaine'
                WHEN 5 THEN 'Occitanie' WHEN 6 THEN 'Hauts-de-France'
                WHEN 7 THEN 'Grand Est' WHEN 8 THEN 'Pays de la Loire'
                WHEN 9 THEN 'Brittany' WHEN 10 THEN 'Normandy'
            END
        ELSE 'Region ' || r.i || ' of Country ' || c.i
    END,
    country_loc.id,
    country_loc.hierarchy || jsonb_build_object('region', 
        CASE 
            WHEN c.i = 1 THEN
                CASE r.i
                    WHEN 1 THEN 'Lombardy' WHEN 2 THEN 'Lazio' WHEN 3 THEN 'Veneto'
                    WHEN 4 THEN 'Campania' WHEN 5 THEN 'Sicily' WHEN 6 THEN 'Piedmont'
                    WHEN 7 THEN 'Tuscany' WHEN 8 THEN 'Emilia-Romagna' WHEN 9 THEN 'Puglia'
                    WHEN 10 THEN 'Liguria'
                END
            WHEN c.i = 2 THEN
                CASE r.i
                    WHEN 1 THEN 'Île-de-France' WHEN 2 THEN 'Provence-Alpes-Côte d''Azur'
                    WHEN 3 THEN 'Auvergne-Rhône-Alpes' WHEN 4 THEN 'Nouvelle-Aquitaine'
                    WHEN 5 THEN 'Occitanie' WHEN 6 THEN 'Hauts-de-France'
                    WHEN 7 THEN 'Grand Est' WHEN 8 THEN 'Pays de la Loire'
                    WHEN 9 THEN 'Brittany' WHEN 10 THEN 'Normandy'
                END
            ELSE 'Region ' || r.i || ' of Country ' || c.i
        END
    ),
    2,
    country_loc.path || ('test_region_' || ((c.i - 1) * 10 + r.i)),
    true
FROM generate_series(1, 10) AS c(i)
CROSS JOIN generate_series(1, 10) AS r(i)
JOIN public.locations country_loc ON country_loc.code = 'test_country_' || c.i
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE code = 'test_region_' || ((c.i - 1) * 10 + r.i));

-- Generate Cities efficiently (9,900 cities) - Using batched approach for better performance
DO $$
DECLARE
    region_rec RECORD;
    batch_size INTEGER := 100;
    start_city INTEGER;
    end_city INTEGER;
BEGIN
    FOR region_rec IN 
        SELECT 
            id, 
            hierarchy, 
            path,
            ROW_NUMBER() OVER (ORDER BY code) as region_num
        FROM public.locations 
        WHERE depth = 2 AND code LIKE 'test_region_%'
    LOOP
        start_city := 1;
        WHILE start_city <= 99 LOOP
            end_city := LEAST(start_city + batch_size - 1, 99);
            
            INSERT INTO public.locations (code, name, parent_location_id, hierarchy, depth, path, is_active)
            SELECT 
                'test_city_' || ((region_rec.region_num - 1) * 99 + i),
                CASE 
                    WHEN region_rec.region_num = 1 AND i <= 5 THEN 
                        CASE i WHEN 1 THEN 'Milan' WHEN 2 THEN 'Bergamo' WHEN 3 THEN 'Brescia' WHEN 4 THEN 'Monza' WHEN 5 THEN 'Como' END
                    WHEN region_rec.region_num = 11 AND i <= 5 THEN 
                        CASE i WHEN 1 THEN 'Paris' WHEN 2 THEN 'Boulogne-Billancourt' WHEN 3 THEN 'Saint-Denis' WHEN 4 THEN 'Argenteuil' WHEN 5 THEN 'Montreuil' END
                    ELSE 'City ' || i || ' in Region ' || region_rec.region_num
                END,
                region_rec.id,
                region_rec.hierarchy || jsonb_build_object('city', 
                    CASE 
                        WHEN region_rec.region_num = 1 AND i <= 5 THEN 
                            CASE i WHEN 1 THEN 'Milan' WHEN 2 THEN 'Bergamo' WHEN 3 THEN 'Brescia' WHEN 4 THEN 'Monza' WHEN 5 THEN 'Como' END
                        WHEN region_rec.region_num = 11 AND i <= 5 THEN 
                            CASE i WHEN 1 THEN 'Paris' WHEN 2 THEN 'Boulogne-Billancourt' WHEN 3 THEN 'Saint-Denis' WHEN 4 THEN 'Argenteuil' WHEN 5 THEN 'Montreuil' END
                        ELSE 'City ' || i || ' in Region ' || region_rec.region_num
                    END
                ),
                3,
                region_rec.path || ('test_city_' || ((region_rec.region_num - 1) * 99 + i)),
                true
            FROM generate_series(start_city, end_city) AS i
            WHERE NOT EXISTS (
                SELECT 1 FROM public.locations 
                WHERE code = 'test_city_' || ((region_rec.region_num - 1) * 99 + i)
            );
            
            start_city := end_city + 1;
        END LOOP;
    END LOOP;
END $$;

-- Update statistics for better query performance
ANALYZE public.locations;

-- Create performance test queries to verify scalability
-- Test 1: Hierarchy query performance
SELECT 
    'Hierarchy Query Test' as test_name,
    COUNT(*) as total_locations,
    COUNT(*) FILTER (WHERE depth = 1) as countries,
    COUNT(*) FILTER (WHERE depth = 2) as regions,
    COUNT(*) FILTER (WHERE depth = 3) as cities
FROM public.locations 
WHERE code LIKE 'test_%';

-- Test 2: Complex hierarchy query with JSONB
SELECT 
    'JSONB Query Test' as test_name,
    COUNT(*) as italy_locations
FROM public.locations 
WHERE hierarchy->>'country' = 'Italy' 
AND code LIKE 'test_%';

-- Test 3: Parent-child relationship query
SELECT 
    'Parent-Child Query Test' as test_name,
    COUNT(*) as lombardy_cities
FROM public.locations parent
JOIN public.locations child ON parent.id = child.parent_location_id
WHERE parent.name = 'Lombardy' 
AND parent.code LIKE 'test_%'
AND child.code LIKE 'test_%';

-- Final verification
SELECT 
    'Final Count Verification' as type,
    'Countries' as category, 
    COUNT(*) as count 
FROM public.locations 
WHERE depth = 1 AND code LIKE 'test_%'
UNION ALL
SELECT 
    'Final Count Verification' as type,
    'Regions' as category, 
    COUNT(*) as count 
FROM public.locations 
WHERE depth = 2 AND code LIKE 'test_%'
UNION ALL
SELECT 
    'Final Count Verification' as type,
    'Cities' as category, 
    COUNT(*) as count 
FROM public.locations 
WHERE depth = 3 AND code LIKE 'test_%';