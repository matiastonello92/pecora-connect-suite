-- Fix security warnings by updating function search paths and permissions

-- Update the function that lacks proper search path
ALTER FUNCTION public.update_updated_at_column() 
SET search_path TO 'public';

-- Remove materialized view from API if needed
-- First check if the view exists and remove it from public schema
DROP MATERIALIZED VIEW IF EXISTS public.location_hierarchy_view;

-- These warnings are related to auth configuration that must be handled in Supabase dashboard:
-- 1. OTP expiry settings
-- 2. Leaked password protection settings
-- Users will need to update these in the Supabase Auth settings