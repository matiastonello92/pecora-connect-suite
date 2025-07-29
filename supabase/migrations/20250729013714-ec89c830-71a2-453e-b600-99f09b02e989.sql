-- Scalable Location Management Test Data Population Script
-- This script generates 10,000 locations with hierarchical structure and 100,000 users

-- First, create user_locations table for many-to-many relationship
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON public.locations(parent_location_id);
CREATE INDEX IF NOT EXISTS idx_locations_hierarchy_gin ON public.locations USING GIN(hierarchy);
CREATE INDEX IF NOT EXISTS idx_locations_code ON public.locations(code);
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON public.locations(is_active);
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON public.user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_location_id ON public.user_locations(location_id);

-- Clear existing test data (be careful in production!)
-- DELETE FROM public.user_locations WHERE TRUE;
-- DELETE FROM public.locations WHERE code LIKE 'test_%';

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
FROM generate_series(1, 10) AS i;

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
            WHEN c.i = 2 THEN
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
        END
    ),
    2,
    country_loc.path || ('test_region_' || ((c.i - 1) * 10 + r.i)),
    true
FROM generate_series(1, 10) AS c(i)
CROSS JOIN generate_series(1, 10) AS r(i)
JOIN public.locations country_loc ON country_loc.code = 'test_country_' || c.i;

-- Generate Cities (99 cities per region = 9,900 total)
INSERT INTO public.locations (code, name, parent_location_id, hierarchy, depth, path, is_active)
SELECT 
    'test_city_' || ((r.region_num - 1) * 99 + city.i),
    CASE 
        WHEN r.region_num = 1 THEN -- Lombardy cities
            CASE city.i
                WHEN 1 THEN 'Milan'
                WHEN 2 THEN 'Bergamo'
                WHEN 3 THEN 'Brescia'
                WHEN 4 THEN 'Monza'
                WHEN 5 THEN 'Como'
                ELSE 'City ' || city.i || ' in Lombardy'
            END
        WHEN r.region_num = 11 THEN -- Île-de-France cities  
            CASE city.i
                WHEN 1 THEN 'Paris'
                WHEN 2 THEN 'Boulogne-Billancourt'
                WHEN 3 THEN 'Saint-Denis'
                WHEN 4 THEN 'Argenteuil'
                WHEN 5 THEN 'Montreuil'
                ELSE 'City ' || city.i || ' in Île-de-France'
            END
        ELSE 'City ' || city.i || ' in Region ' || r.region_num
    END,
    r.id,
    r.hierarchy || jsonb_build_object('city', 
        CASE 
            WHEN r.region_num = 1 THEN
                CASE city.i
                    WHEN 1 THEN 'Milan'
                    WHEN 2 THEN 'Bergamo'
                    WHEN 3 THEN 'Brescia'
                    WHEN 4 THEN 'Monza'
                    WHEN 5 THEN 'Como'
                    ELSE 'City ' || city.i || ' in Lombardy'
                END
            WHEN r.region_num = 11 THEN
                CASE city.i
                    WHEN 1 THEN 'Paris'
                    WHEN 2 THEN 'Boulogne-Billancourt'
                    WHEN 3 THEN 'Saint-Denis'
                    WHEN 4 THEN 'Argenteuil'
                    WHEN 5 THEN 'Montreuil'
                    ELSE 'City ' || city.i || ' in Île-de-France'
                END
            ELSE 'City ' || city.i || ' in Region ' || r.region_num
        END
    ),
    3,
    r.path || ('test_city_' || ((r.region_num - 1) * 99 + city.i)),
    true
FROM (
    SELECT 
        id, 
        hierarchy, 
        path,
        ROW_NUMBER() OVER (ORDER BY code) as region_num
    FROM public.locations 
    WHERE depth = 2 AND code LIKE 'test_region_%'
) r
CROSS JOIN generate_series(1, 99) AS city(i);

-- Create mock users (100,000 users)
DO $$
DECLARE
    batch_size INTEGER := 1000;
    total_users INTEGER := 100000;
    current_batch INTEGER := 0;
    first_names TEXT[] := ARRAY['Alessandro', 'Giulia', 'Marco', 'Sofia', 'Lorenzo', 'Emma', 'Matteo', 'Alice', 'Riccardo', 'Giorgia', 'Francesco', 'Martina', 'Andrea', 'Chiara', 'Luca', 'Francesca', 'Davide', 'Anna', 'Gabriele', 'Sara'];
    last_names TEXT[] := ARRAY['Rossi', 'Romano', 'Ferrari', 'Esposito', 'Bianchi', 'Russo', 'Galli', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Ricci', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi'];
    departments TEXT[] := ARRAY['general', 'kitchen', 'service', 'management', 'administration'];
    positions TEXT[] := ARRAY['Staff', 'Senior Staff', 'Supervisor', 'Manager', 'Director'];
    roles TEXT[] := ARRAY['user', 'manager', 'admin'];
    access_levels TEXT[] := ARRAY['base', 'manager_sala', 'manager_cucina', 'general_manager'];
    restaurant_roles TEXT[] := ARRAY['server', 'chef', 'bartender', 'host', 'manager'];
BEGIN
    WHILE current_batch * batch_size < total_users LOOP
        INSERT INTO public.profiles (
            user_id,
            first_name,
            last_name,
            email,
            role,
            access_level,
            restaurant_role,
            department,
            position,
            status,
            locations,
            phone,
            created_at,
            updated_at
        )
        SELECT 
            gen_random_uuid(),
            first_names[((current_batch * batch_size + i - 1) % array_length(first_names, 1)) + 1],
            last_names[((current_batch * batch_size + i - 1) % array_length(last_names, 1)) + 1],
            'test_user_' || (current_batch * batch_size + i) || '@example.com',
            roles[((current_batch * batch_size + i - 1) % array_length(roles, 1)) + 1],
            access_levels[((current_batch * batch_size + i - 1) % array_length(access_levels, 1)) + 1]::access_level,
            restaurant_roles[((current_batch * batch_size + i - 1) % array_length(restaurant_roles, 1)) + 1]::restaurant_role,
            departments[((current_batch * batch_size + i - 1) % array_length(departments, 1)) + 1],
            positions[((current_batch * batch_size + i - 1) % array_length(positions, 1)) + 1],
            'active',
            ARRAY['test_city_' || ((current_batch * batch_size + i - 1) % 9900 + 1)], -- Assign to random cities
            '+39 ' || LPAD((current_batch * batch_size + i)::TEXT, 10, '0'),
            NOW() - INTERVAL '1 day' * (random() * 365),
            NOW() - INTERVAL '1 hour' * (random() * 24)
        FROM generate_series(1, LEAST(batch_size, total_users - current_batch * batch_size)) AS i;
        
        current_batch := current_batch + 1;
        
        -- Commit every batch for better performance
        COMMIT;
    END LOOP;
END $$;

-- Populate user_locations with many-to-many relationships
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
CROSS JOIN LATERAL (
    SELECT id 
    FROM public.locations l2 
    WHERE l2.code = ANY(p.locations) 
    AND l2.is_active = true
    LIMIT 1
) l
WHERE p.email LIKE 'test_user_%@example.com';

-- Add additional random location assignments (users can belong to multiple locations)
INSERT INTO public.user_locations (user_id, location_id, role)
SELECT DISTINCT
    p.user_id,
    l.id,
    'member'
FROM public.profiles p
CROSS JOIN LATERAL (
    SELECT id 
    FROM public.locations l2 
    WHERE l2.is_active = true 
    AND l2.depth = 3 -- Cities only
    ORDER BY random() 
    LIMIT CASE WHEN random() < 0.3 THEN 2 ELSE 1 END -- 30% chance of additional location
) l
WHERE p.email LIKE 'test_user_%@example.com'
AND NOT EXISTS (
    SELECT 1 FROM public.user_locations ul 
    WHERE ul.user_id = p.user_id AND ul.location_id = l.id
)
LIMIT 50000; -- Add up to 50k additional relationships

-- Update statistics for better query performance
ANALYZE public.locations;
ANALYZE public.profiles;
ANALYZE public.user_locations;

-- Verify data creation
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