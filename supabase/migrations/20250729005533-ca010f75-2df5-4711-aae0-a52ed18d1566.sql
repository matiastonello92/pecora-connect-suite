-- Fix remaining security warning by setting search path for the refresh function
CREATE OR REPLACE FUNCTION public.refresh_location_hierarchy_view()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.location_hierarchy_view;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';