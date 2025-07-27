-- Create new user roles and permissions system for PecoraNegra

-- Restaurant roles (descriptive job functions)
CREATE TYPE public.restaurant_role AS ENUM (
  'waiter',
  'runner', 
  'bartender',
  'floor_manager',
  'location_director',
  'general_director',
  'cook',
  'kitchen_assistant',
  'pizza_chef',
  'dishwasher',
  'stock_manager',
  'cleaning_staff',
  'accountant',
  'procurement_manager',
  'social_media_manager',
  'maintenance_manager',
  'human_resources'
);

-- Access levels (define actual app permissions)
CREATE TYPE public.access_level AS ENUM (
  'base',
  'manager_sala',
  'manager_cucina', 
  'general_manager',
  'assistant_manager',
  'financial_department',
  'communication_department',
  'observer'
);

-- App modules for permission system
CREATE TYPE public.app_module AS ENUM (
  'chat',
  'inventory_sala',
  'inventory_kitchen', 
  'checklists',
  'suppliers',
  'equipment',
  'financial',
  'cash_closure',
  'reports',
  'tasks',
  'communication',
  'announcements',
  'user_management'
);

-- User permissions table for custom overrides
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module app_module NOT NULL,
  can_read BOOLEAN NOT NULL DEFAULT false,
  can_write BOOLEAN NOT NULL DEFAULT false,
  can_validate BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module)
);

-- Audit log for tracking changes to roles and permissions
CREATE TABLE public.role_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  changed_user_id UUID NOT NULL, 
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN restaurant_role restaurant_role,
ADD COLUMN access_level access_level NOT NULL DEFAULT 'base',
ADD COLUMN has_custom_permissions BOOLEAN NOT NULL DEFAULT false;

-- Add new columns to user_invitations table
ALTER TABLE public.user_invitations
ADD COLUMN restaurant_role restaurant_role,
ADD COLUMN access_level access_level NOT NULL DEFAULT 'base';

-- Add new columns to archived_users table  
ALTER TABLE public.archived_users
ADD COLUMN restaurant_role restaurant_role,
ADD COLUMN access_level access_level;

-- Enable RLS on new tables
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_permissions
CREATE POLICY "Admins can manage all permissions" 
ON public.user_permissions
FOR ALL
USING (get_current_user_role() = ANY (ARRAY['super_admin'::text, 'manager'::text]));

CREATE POLICY "Users can view their own permissions"
ON public.user_permissions
FOR SELECT
USING (user_id = auth.uid());

-- RLS policies for role_audit_log
CREATE POLICY "Admins can view all audit logs"
ON public.role_audit_log
FOR SELECT
USING (get_current_user_role() = ANY (ARRAY['super_admin'::text, 'manager'::text]));

CREATE POLICY "System can insert audit logs"
ON public.role_audit_log
FOR INSERT
WITH CHECK (true);

-- Function to get user access level
CREATE OR REPLACE FUNCTION public.get_user_access_level(user_uuid UUID DEFAULT NULL)
RETURNS access_level
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT access_level FROM public.profiles 
  WHERE user_id = COALESCE(user_uuid, auth.uid())
  LIMIT 1;
$$;

-- Function to check if user has module permission
CREATE OR REPLACE FUNCTION public.has_module_permission(
  module_name app_module,
  permission_type TEXT DEFAULT 'read',
  user_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_level access_level;
  custom_perm RECORD;
  has_custom BOOLEAN;
BEGIN
  -- Get user's access level and custom permissions flag
  SELECT access_level, has_custom_permissions 
  INTO user_level, has_custom
  FROM profiles 
  WHERE user_id = COALESCE(user_uuid, auth.uid());
  
  -- If user has custom permissions, check those first
  IF has_custom THEN
    SELECT * INTO custom_perm 
    FROM user_permissions 
    WHERE user_id = COALESCE(user_uuid, auth.uid()) AND module = module_name;
    
    IF FOUND THEN
      CASE permission_type
        WHEN 'read' THEN RETURN custom_perm.can_read;
        WHEN 'write' THEN RETURN custom_perm.can_write;
        WHEN 'validate' THEN RETURN custom_perm.can_validate;
        WHEN 'delete' THEN RETURN custom_perm.can_delete;
        ELSE RETURN false;
      END CASE;
    END IF;
  END IF;
  
  -- Default permissions based on access level
  CASE user_level
    WHEN 'base' THEN
      CASE module_name
        WHEN 'chat', 'equipment' THEN RETURN permission_type = 'read';
        WHEN 'inventory_sala', 'inventory_kitchen' THEN RETURN permission_type IN ('read', 'write');
        WHEN 'checklists', 'suppliers', 'communication', 'tasks' THEN RETURN permission_type = 'read';
        ELSE RETURN false;
      END CASE;
    
    WHEN 'manager_sala' THEN
      CASE module_name
        WHEN 'inventory_sala', 'checklists', 'chat', 'equipment', 'suppliers', 'communication', 'tasks' 
          THEN RETURN permission_type IN ('read', 'write', 'validate');
        WHEN 'inventory_kitchen' THEN RETURN permission_type = 'read';
        ELSE RETURN false;
      END CASE;
    
    WHEN 'manager_cucina' THEN
      CASE module_name  
        WHEN 'inventory_kitchen', 'checklists', 'chat', 'equipment', 'suppliers', 'communication', 'tasks'
          THEN RETURN permission_type IN ('read', 'write', 'validate');
        WHEN 'inventory_sala' THEN RETURN permission_type = 'read';
        ELSE RETURN false;
      END CASE;
    
    WHEN 'general_manager' THEN
      RETURN permission_type IN ('read', 'write', 'validate', 'delete');
    
    WHEN 'assistant_manager' THEN
      CASE module_name
        WHEN 'financial', 'cash_closure' THEN RETURN permission_type = 'read';
        ELSE RETURN permission_type IN ('read', 'write', 'validate');
      END CASE;
    
    WHEN 'financial_department' THEN
      CASE module_name
        WHEN 'financial', 'cash_closure', 'reports' THEN RETURN permission_type IN ('read', 'write', 'validate');
        ELSE RETURN false;
      END CASE;
    
    WHEN 'communication_department' THEN
      CASE module_name
        WHEN 'chat', 'communication', 'announcements' THEN RETURN permission_type IN ('read', 'write', 'validate');
        ELSE RETURN false;
      END CASE;
    
    WHEN 'observer' THEN
      RETURN permission_type = 'read';
    
    ELSE RETURN false;
  END CASE;
END;
$$;

-- Function to log role/permission changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO role_audit_log (
    user_id,
    changed_user_id,
    action,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    COALESCE(NEW.user_id, OLD.user_id),
    TG_OP,
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers for audit logging
CREATE TRIGGER audit_profiles_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (
    OLD.restaurant_role IS DISTINCT FROM NEW.restaurant_role OR
    OLD.access_level IS DISTINCT FROM NEW.access_level OR  
    OLD.has_custom_permissions IS DISTINCT FROM NEW.has_custom_permissions
  )
  EXECUTE FUNCTION log_role_change();

CREATE TRIGGER audit_permissions_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION log_role_change();

-- Update existing records with default values
UPDATE public.profiles SET access_level = 'general_manager' WHERE role = 'super_admin';
UPDATE public.profiles SET access_level = 'manager_sala' WHERE role = 'manager';  
UPDATE public.profiles SET access_level = 'base' WHERE role = 'base';

UPDATE public.user_invitations SET access_level = 'general_manager' WHERE role = 'super_admin';
UPDATE public.user_invitations SET access_level = 'manager_sala' WHERE role = 'manager';
UPDATE public.user_invitations SET access_level = 'base' WHERE role = 'base';

UPDATE public.archived_users SET access_level = 'general_manager' WHERE role = 'super_admin';
UPDATE public.archived_users SET access_level = 'manager_sala' WHERE role = 'manager';
UPDATE public.archived_users SET access_level = 'base' WHERE role = 'base';