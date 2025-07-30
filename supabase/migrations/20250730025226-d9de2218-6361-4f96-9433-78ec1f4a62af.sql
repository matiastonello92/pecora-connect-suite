-- Phase 1: Complete database cleanup - Remove ALL permission-related columns and policies

-- Remove any remaining role/permission columns from profiles table
DO $$ 
BEGIN
    -- Remove role column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles DROP COLUMN role;
    END IF;
    
    -- Remove access_level column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'access_level') THEN
        ALTER TABLE profiles DROP COLUMN access_level;
    END IF;
    
    -- Remove department column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department') THEN
        ALTER TABLE profiles DROP COLUMN department;
    END IF;
    
    -- Remove position column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'position') THEN
        ALTER TABLE profiles DROP COLUMN position;
    END IF;
    
    -- Remove restaurant_role column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'restaurant_role') THEN
        ALTER TABLE profiles DROP COLUMN restaurant_role;
    END IF;
    
    -- Remove has_custom_permissions column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'has_custom_permissions') THEN
        ALTER TABLE profiles DROP COLUMN has_custom_permissions;
    END IF;
END $$;

-- Remove role column from user_invitations if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_invitations' AND column_name = 'role') THEN
        ALTER TABLE user_invitations DROP COLUMN role;
    END IF;
    
    -- Remove old location column (we use locations array now)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_invitations' AND column_name = 'location') THEN
        ALTER TABLE user_invitations DROP COLUMN location;
    END IF;
END $$;

-- Clean up any remaining permission-related functions
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.user_has_permission(uuid, text);
DROP FUNCTION IF EXISTS public.validate_user_permissions();

-- Drop any custom role types
DROP TYPE IF EXISTS app_role CASCADE;
DROP TYPE IF EXISTS permission_level CASCADE;

-- Update all RLS policies to simple authenticated user checks
-- For profiles table
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Authenticated users can view all profiles" ON profiles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- For user_invitations table - allow all authenticated users to manage
DROP POLICY IF EXISTS "Authenticated users can manage invitations" ON user_invitations;
CREATE POLICY "Authenticated users can manage invitations" ON user_invitations
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Verify all tables have simple authenticated policies
-- Cash closures
DROP POLICY IF EXISTS "Authenticated users can manage cash closures" ON cash_closures;
CREATE POLICY "Authenticated users can manage cash closures" ON cash_closures
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Equipment
DROP POLICY IF EXISTS "Authenticated users can manage equipment" ON equipment;
CREATE POLICY "Authenticated users can manage equipment" ON equipment
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Monthly inventories
DROP POLICY IF EXISTS "Authenticated users can manage inventories" ON monthly_inventories;
CREATE POLICY "Authenticated users can manage inventories" ON monthly_inventories
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Monthly inventory items
DROP POLICY IF EXISTS "Authenticated users can manage inventory items" ON monthly_inventory_items;
CREATE POLICY "Authenticated users can manage inventory items" ON monthly_inventory_items
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Orders
DROP POLICY IF EXISTS "Authenticated users can manage orders" ON orders;
CREATE POLICY "Authenticated users can manage orders" ON orders
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Suppliers
DROP POLICY IF EXISTS "Authenticated users can manage suppliers" ON suppliers;
CREATE POLICY "Authenticated users can manage suppliers" ON suppliers
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Messages
DROP POLICY IF EXISTS "Authenticated users can manage messages" ON messages;
CREATE POLICY "Authenticated users can manage messages" ON messages
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Checklist templates
DROP POLICY IF EXISTS "Authenticated users can manage checklist templates" ON checklist_templates;
CREATE POLICY "Authenticated users can manage checklist templates" ON checklist_templates
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Checklist items
DROP POLICY IF EXISTS "Authenticated users can manage checklist items" ON checklist_items;
CREATE POLICY "Authenticated users can manage checklist items" ON checklist_items
FOR ALL TO authenticated USING (true) WITH CHECK (true);