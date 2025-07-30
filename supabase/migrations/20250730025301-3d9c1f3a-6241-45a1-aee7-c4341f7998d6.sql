-- Fix security issues from the linter

-- Add missing RLS policies for tables that had RLS enabled but no policies
CREATE POLICY "Authenticated users can view location dashboard configs" ON location_dashboard_configs
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage location dashboard configs" ON location_dashboard_configs
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view location chat groups" ON location_chat_groups
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage location chat groups" ON location_chat_groups
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_location_hierarchy_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.location_hierarchy_view;
END;
$$;