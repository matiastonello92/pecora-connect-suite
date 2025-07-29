-- Scalable Location Management Test Data Population Script (Final Fixed Version)
-- This script generates 10,000 locations with hierarchical structure and 100,000 users

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

-- RLS policy for user_locations
CREATE POLICY "Users can view their own location assignments"
ON public.user_locations
FOR SELECT
USING (user_id = auth.uid());

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
                WHEN 1 THEN 'Lombardy'
                WHEN 2 THEN 'Lazio'
                WHEN 3 THEN 'Veneto'
                WHEN 4 THEN 'Campania'
                WHEN 5 THEN 'Sicily'
                WHEN 6 THEN 'Piedmont'
                WHEN 7 THEN 'Tuscany'
                WHEN 8 THEN 'Emilia-Romagna'
                WHEN 9 THEN 'Puglia'
                WHEN 10 THEN 'Liguria'
            END
        WHEN c.i = 2 THEN -- France regions
            CASE r.i
                WHEN 1 THEN 'Île-de-France'
                WHEN 2 THEN 'Provence-Alpes-Côte d''Azur'
                WHEN 3 THEN 'Auvergne-Rhône-Alpes'
                WHEN 4 THEN 'Nouvelle-Aquitaine'
                WHEN 5 THEN 'Occitanie'
                WHEN 6 THEN 'Hauts-de-France'
                WHEN 7 THEN 'Grand Est'
                WHEN 8 THEN 'Pays de la Loire'
                WHEN 9 THEN 'Brittany'
                WHEN 10 THEN 'Normandy'
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

-- Generate Cities efficiently (9,900 cities)
WITH region_data AS (
    SELECT 
        id, 
        hierarchy, 
        path,
        ROW_NUMBER() OVER (ORDER BY code) as region_num
    FROM public.locations 
    WHERE depth = 2 AND code LIKE 'test_region_%'
),
city_data AS (
    SELECT 
        'test_city_' || ((r.region_num - 1) * 99 + c.city_num) as code,
        CASE 
            WHEN r.region_num = 1 AND c.city_num <= 5 THEN 
                CASE c.city_num WHEN 1 THEN 'Milan' WHEN 2 THEN 'Bergamo' WHEN 3 THEN 'Brescia' WHEN 4 THEN 'Monza' WHEN 5 THEN 'Como' END
            WHEN r.region_num = 11 AND c.city_num <= 5 THEN 
                CASE c.city_num WHEN 1 THEN 'Paris' WHEN 2 THEN 'Boulogne-Billancourt' WHEN 3 THEN 'Saint-Denis' WHEN 4 THEN 'Argenteuil' WHEN 5 THEN 'Montreuil' END
            ELSE 'City ' || c.city_num || ' in Region ' || r.region_num
        END as name,
        r.id as parent_id,
        r.hierarchy || jsonb_build_object('city', 
            CASE 
                WHEN r.region_num = 1 AND c.city_num <= 5 THEN 
                    CASE c.city_num WHEN 1 THEN 'Milan' WHEN 2 THEN 'Bergamo' WHEN 3 THEN 'Brescia' WHEN 4 THEN 'Monza' WHEN 5 THEN 'Como' END
                WHEN r.region_num = 11 AND c.city_num <= 5 THEN 
                    CASE c.city_num WHEN 1 THEN 'Paris' WHEN 2 THEN 'Boulogne-Billancourt' WHEN 3 THEN 'Saint-Denis' WHEN 4 THEN 'Argenteuil' WHEN 5 THEN 'Montreuil' END
                ELSE 'City ' || c.city_num || ' in Region ' || r.region_num
            END
        ) as hierarchy,
        r.path || ('test_city_' || ((r.region_num - 1) * 99 + c.city_num)) as path
    FROM region_data r
    CROSS JOIN generate_series(1, 99) AS c(city_num)
)
INSERT INTO public.locations (code, name, parent_location_id, hierarchy, depth, path, is_active)
SELECT 
    cd.code,
    cd.name,
    cd.parent_id,
    cd.hierarchy,
    3,
    cd.path,
    true
FROM city_data cd
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE code = cd.code);

-- Create mock users efficiently (10,000 users for testing - can be increased)
WITH user_data AS (
    SELECT 
        gen_random_uuid() as user_id,
        (ARRAY['Alessandro', 'Giulia', 'Marco', 'Sofia', 'Lorenzo', 'Emma', 'Matteo', 'Alice', 'Riccardo', 'Giorgia'])[(i % 10) + 1] as first_name,
        (ARRAY['Rossi', 'Romano', 'Ferrari', 'Esposito', 'Bianchi', 'Russo', 'Galli', 'Conti', 'De Luca', 'Mancini'])[(i % 10) + 1] as last_name,
        'test_user_' || i || '@example.com' as email,
        (ARRAY['super_admin', 'manager', 'base'])[(i % 3) + 1] as role,
        (ARRAY['base', 'manager_sala', 'manager_cucina', 'general_manager'])[(i % 4) + 1]::access_level as access_level,
        (ARRAY['waiter', 'runner', 'bartender', 'floor_manager', 'cook', 'kitchen_assistant'])[(i % 6) + 1]::restaurant_role as restaurant_role,
        (ARRAY['general', 'kitchen', 'service', 'management'])[(i % 4) + 1] as department,
        (ARRAY['Staff', 'Senior Staff', 'Supervisor', 'Manager'])[(i % 4) + 1] as position,
        ARRAY['test_city_' || ((i % 9900) + 1)] as locations,
        '+39 ' || LPAD(i::TEXT, 10, '0') as phone
    FROM generate_series(1, 10000) AS i
)
INSERT INTO public.profiles (
    user_id, first_name, last_name, email, role, access_level, restaurant_role,
    department, position, status, locations, phone, created_at, updated_at
)
SELECT 
    ud.user_id, ud.first_name, ud.last_name, ud.email, ud.role, ud.access_level, ud.restaurant_role,
    ud.department, ud.position, 'active', ud.locations, ud.phone,
    NOW() - INTERVAL '1 day' * (random() * 365),
    NOW() - INTERVAL '1 hour' * (random() * 24)
FROM user_data ud
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = ud.email);

-- Create user-location relationships
INSERT INTO public.user_locations (user_id, location_id, role)
SELECT 
    p.user_id,
    l.id,
    CASE 
        WHEN random() < 0.1 THEN 'admin'
        WHEN random() < 0.3 THEN 'manager'
        ELSE 'member'
    END
FROM public.profiles p
JOIN public.locations l ON l.code = ANY(p.locations) AND l.is_active = true
WHERE p.email LIKE 'test_user_%@example.com'
ON CONFLICT (user_id, location_id) DO NOTHING;

-- Update statistics for better query performance
ANALYZE public.locations;
ANALYZE public.profiles;
ANALYZE public.user_locations;

-- Final verification and performance test query
SELECT 
    'Countries' as type, COUNT(*) as count 
FROM public.locations WHERE depth = 1 AND code LIKE 'test_%'
UNION ALL
SELECT 
    'Regions' as type, COUNT(*) as count 
FROM public.locations WHERE depth = 2 AND code LIKE 'test_%'
UNION ALL
SELECT 
    'Cities' as type, COUNT(*) as count 
FROM public.locations WHERE depth = 3 AND code LIKE 'test_%'
UNION ALL
SELECT 
    'Users' as type, COUNT(*) as count 
FROM public.profiles WHERE email LIKE 'test_user_%@example.com'
UNION ALL
SELECT 
    'User-Location Relationships' as type, COUNT(*) as count 
FROM public.user_locations;