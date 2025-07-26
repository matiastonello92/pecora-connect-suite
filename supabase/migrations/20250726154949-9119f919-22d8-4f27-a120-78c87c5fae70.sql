-- Add missing RLS policies for tables without complete policy coverage

-- Policies for monthly_inventories
CREATE POLICY "Users can view inventories for their location"
ON public.monthly_inventories FOR SELECT
USING (
  location = (SELECT location FROM public.profiles WHERE user_id = auth.uid())
  OR (SELECT location FROM public.profiles WHERE user_id = auth.uid()) = 'all_locations'
);

CREATE POLICY "Users can create inventories"
ON public.monthly_inventories FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own inventories"
ON public.monthly_inventories FOR UPDATE
USING (user_id = auth.uid() OR get_current_user_role() = ANY(ARRAY['manager', 'super_admin']));

-- Policies for monthly_inventory_items
CREATE POLICY "Users can view inventory items for their location"
ON public.monthly_inventory_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.monthly_inventories mi 
    WHERE mi.id = inventory_id 
    AND (mi.location = (SELECT location FROM public.profiles WHERE user_id = auth.uid())
         OR (SELECT location FROM public.profiles WHERE user_id = auth.uid()) = 'all_locations')
  )
);

CREATE POLICY "Users can manage inventory items for their inventories"
ON public.monthly_inventory_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.monthly_inventories mi 
    WHERE mi.id = inventory_id 
    AND (mi.user_id = auth.uid() OR get_current_user_role() = ANY(ARRAY['manager', 'super_admin']))
  )
);

-- Policies for maintenance_records
CREATE POLICY "Users can view maintenance records for their location"
ON public.maintenance_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.equipment e 
    WHERE e.id = equipment_id 
    AND (e.location = (SELECT location FROM public.profiles WHERE user_id = auth.uid())
         OR (SELECT location FROM public.profiles WHERE user_id = auth.uid()) = 'all_locations')
  )
);

CREATE POLICY "Users can create maintenance records"
ON public.maintenance_records FOR INSERT
WITH CHECK (performed_by = auth.uid());

-- Policies for suppliers
CREATE POLICY "Users can view suppliers for their location"
ON public.suppliers FOR SELECT
USING (
  location = (SELECT location FROM public.profiles WHERE user_id = auth.uid())
  OR (SELECT location FROM public.profiles WHERE user_id = auth.uid()) = 'all_locations'
);

CREATE POLICY "Managers can manage suppliers"
ON public.suppliers FOR ALL
USING (get_current_user_role() = ANY(ARRAY['manager', 'super_admin']));

-- Policies for orders
CREATE POLICY "Users can view orders for their location"
ON public.orders FOR SELECT
USING (
  location = (SELECT location FROM public.profiles WHERE user_id = auth.uid())
  OR (SELECT location FROM public.profiles WHERE user_id = auth.uid()) = 'all_locations'
);

CREATE POLICY "Users can create orders"
ON public.orders FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own orders"
ON public.orders FOR UPDATE
USING (user_id = auth.uid() OR get_current_user_role() = ANY(ARRAY['manager', 'super_admin']));

-- Policies for checklist_templates
CREATE POLICY "Users can view checklist templates for their location"
ON public.checklist_templates FOR SELECT
USING (
  location = (SELECT location FROM public.profiles WHERE user_id = auth.uid())
  OR (SELECT location FROM public.profiles WHERE user_id = auth.uid()) = 'all_locations'
);

CREATE POLICY "Managers can manage checklist templates"
ON public.checklist_templates FOR ALL
USING (get_current_user_role() = ANY(ARRAY['manager', 'super_admin']));

-- Policies for checklist_items
CREATE POLICY "Users can view checklist items for accessible templates"
ON public.checklist_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.checklist_templates ct 
    WHERE ct.id = template_id 
    AND (ct.location = (SELECT location FROM public.profiles WHERE user_id = auth.uid())
         OR (SELECT location FROM public.profiles WHERE user_id = auth.uid()) = 'all_locations')
  )
);

CREATE POLICY "Managers can manage checklist items"
ON public.checklist_items FOR ALL
USING (get_current_user_role() = ANY(ARRAY['manager', 'super_admin']));

-- Policies for checklist_sessions
CREATE POLICY "Users can view checklist sessions for their location"
ON public.checklist_sessions FOR SELECT
USING (
  location = (SELECT location FROM public.profiles WHERE user_id = auth.uid())
  OR (SELECT location FROM public.profiles WHERE user_id = auth.uid()) = 'all_locations'
);

CREATE POLICY "Users can create checklist sessions"
ON public.checklist_sessions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own checklist sessions"
ON public.checklist_sessions FOR UPDATE
USING (user_id = auth.uid());