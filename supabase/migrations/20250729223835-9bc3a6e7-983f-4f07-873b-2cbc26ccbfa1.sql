-- Consolidamento delle policy RLS permissive multiple
-- Rimuovi ridondanze e crea policy singole più efficienti

-- PROFILES TABLE - Consolida le 2 policy SELECT in una sola
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "view_other_profiles" ON public.profiles;

-- Policy consolidata per profiles SELECT che copre entrambi i casi
CREATE POLICY "Users can view profiles" ON public.profiles
FOR SELECT USING (
    -- Users can view their own profile OR any authenticated user can view other profiles
    ((select auth.uid()) = user_id) OR 
    ((select auth.role()) = 'authenticated'::text)
);

-- CHAT_PARTICIPANTS - Consolida gestione partecipanti
DROP POLICY IF EXISTS "users_can_manage_own_participation" ON public.chat_participants;
DROP POLICY IF EXISTS "users_can_view_accessible_chat_participants" ON public.chat_participants;

-- Policy consolidata per chat_participants che copre tutti i casi
CREATE POLICY "Users can manage chat participation" ON public.chat_participants
FOR ALL USING (
    -- Users can manage their own participation OR view participants of accessible chats
    (user_id = (select auth.uid())) OR 
    user_can_access_chat(chat_id, (select auth.uid()))
);

-- CHECKLIST_ITEMS - Consolida accesso per templates
DROP POLICY IF EXISTS "Managers can manage checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Users can view checklist items for accessible templates" ON public.checklist_items;

-- Policy consolidata per checklist_items
CREATE POLICY "Checklist items access control" ON public.checklist_items
FOR ALL USING (
    -- Managers can manage all OR users can view items for their location templates
    (get_current_user_role() = ANY (ARRAY['manager'::text, 'super_admin'::text])) OR
    (EXISTS (
        SELECT 1 FROM checklist_templates ct
        WHERE ct.id = checklist_items.template_id 
        AND ct.location = ANY (get_current_user_locations())
    ))
);

-- LOCATION_DASHBOARD_CONFIGS - Consolida gestione configurazioni
DROP POLICY IF EXISTS "Managers can manage all dashboard configs" ON public.location_dashboard_configs;
DROP POLICY IF EXISTS "Users can create dashboard configs for their locations" ON public.location_dashboard_configs;
DROP POLICY IF EXISTS "Users can update dashboard configs for their locations" ON public.location_dashboard_configs;
DROP POLICY IF EXISTS "Users can view dashboard configs for their locations" ON public.location_dashboard_configs;

-- Policy consolidata per location_dashboard_configs
CREATE POLICY "Dashboard configs access control" ON public.location_dashboard_configs
FOR ALL USING (
    -- Managers can manage all configs OR users can manage configs for their locations
    (EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (select auth.uid()) 
        AND p.role = ANY (ARRAY['manager'::text, 'super_admin'::text])
    )) OR
    (EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (select auth.uid()) 
        AND p.status = 'active'
        AND location_dashboard_configs.location_id = ANY (p.locations)
    ))
)
WITH CHECK (
    -- For inserts, ensure created_by is set and user has access to location
    (created_by = (select auth.uid())) AND
    (EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (select auth.uid()) 
        AND p.status = 'active'
        AND (
            p.role = ANY (ARRAY['manager'::text, 'super_admin'::text]) OR
            location_dashboard_configs.location_id = ANY (p.locations)
        )
    ))
);

-- CHECKLIST_TEMPLATES - Consolida gestione templates
DROP POLICY IF EXISTS "Managers can manage checklist templates" ON public.checklist_templates;
DROP POLICY IF EXISTS "Users can view checklist templates for their location" ON public.checklist_templates;

-- Policy consolidata per checklist_templates
CREATE POLICY "Checklist templates access control" ON public.checklist_templates
FOR ALL USING (
    -- Managers can manage all OR users can view templates for their locations
    (get_current_user_role() = ANY (ARRAY['manager'::text, 'super_admin'::text])) OR
    (location = ANY (get_current_user_locations()))
);

-- SUPPLIERS - Consolida gestione fornitori
DROP POLICY IF EXISTS "Managers can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can view suppliers for accessible locations" ON public.suppliers;

-- Policy consolidata per suppliers
CREATE POLICY "Suppliers access control" ON public.suppliers
FOR ALL USING (
    -- Managers can manage all OR users can view suppliers for their locations
    (get_current_user_role() = ANY (ARRAY['manager'::text, 'super_admin'::text])) OR
    (EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (select auth.uid()) 
        AND p.status = 'active'
        AND suppliers.location = ANY (p.locations)
    ))
);

-- EQUIPMENT - Consolida gestione attrezzature
DROP POLICY IF EXISTS "Users can manage equipment for their location" ON public.equipment;
DROP POLICY IF EXISTS "Users can view equipment for accessible locations" ON public.equipment;

-- Policy consolidata per equipment
CREATE POLICY "Equipment access control" ON public.equipment
FOR ALL USING (
    -- Users can manage equipment for their accessible locations
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = (select auth.uid()) 
        AND p.status = 'active'
        AND equipment.location = ANY (p.locations)
    )
);

-- MONTHLY_INVENTORY_ITEMS - Consolida gestione items inventario
DROP POLICY IF EXISTS "Users can manage inventory items for their inventories" ON public.monthly_inventory_items;
DROP POLICY IF EXISTS "Users can view inventory items for their location" ON public.monthly_inventory_items;

-- Policy consolidata per monthly_inventory_items
CREATE POLICY "Inventory items access control" ON public.monthly_inventory_items
FOR ALL USING (
    -- Users can manage items for their inventories OR view items for their locations
    EXISTS (
        SELECT 1 FROM monthly_inventories mi
        WHERE mi.id = monthly_inventory_items.inventory_id 
        AND (
            (mi.user_id = (select auth.uid())) OR
            (get_current_user_role() = ANY (ARRAY['manager'::text, 'super_admin'::text])) OR
            (mi.location = ANY (get_current_user_locations()))
        )
    )
);