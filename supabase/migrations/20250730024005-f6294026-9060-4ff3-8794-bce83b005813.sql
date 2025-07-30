-- Fix trigger issue and complete permission system removal

-- First, drop the problematic trigger and function
DROP TRIGGER IF EXISTS trigger_auto_join_federated_chats ON profiles;
DROP FUNCTION IF EXISTS trigger_auto_join_federated_chats() CASCADE;

-- Also drop any other triggers that might reference role/access_level columns
DROP TRIGGER IF EXISTS validate_user_locations_trigger ON profiles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Drop permission-related tables
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS role_audit_log CASCADE;

-- Drop permission-related functions
DROP FUNCTION IF EXISTS has_module_permission(app_module, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_access_level(uuid) CASCADE;
DROP FUNCTION IF EXISTS log_role_change() CASCADE;
DROP FUNCTION IF EXISTS get_current_user_role() CASCADE;

-- Drop custom enum types
DROP TYPE IF EXISTS access_level CASCADE;
DROP TYPE IF EXISTS restaurant_role CASCADE;
DROP TYPE IF EXISTS app_module CASCADE;

-- Simplify profiles table - remove all permission-related columns
ALTER TABLE profiles 
DROP COLUMN IF EXISTS role CASCADE,
DROP COLUMN IF EXISTS access_level CASCADE,
DROP COLUMN IF EXISTS restaurant_role CASCADE,
DROP COLUMN IF EXISTS has_custom_permissions CASCADE,
DROP COLUMN IF EXISTS department CASCADE,
DROP COLUMN IF EXISTS position CASCADE;

-- Recreate the updated_at trigger for profiles (without role references)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS policies to simple authenticated checks
-- First drop existing policies
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create simplified RLS policies for profiles
CREATE POLICY "Authenticated users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Simplify other table policies to remove role-based restrictions
-- Cash closures
DROP POLICY IF EXISTS "Users can view cash closures for accessible locations" ON cash_closures;
DROP POLICY IF EXISTS "Users can create cash closures" ON cash_closures;
DROP POLICY IF EXISTS "Users can update their own cash closures" ON cash_closures;

CREATE POLICY "Authenticated users can manage cash closures"
ON cash_closures FOR ALL
TO authenticated
USING (true)
WITH CHECK (user_id = auth.uid());

-- Equipment
DROP POLICY IF EXISTS "Equipment access control" ON equipment;
CREATE POLICY "Authenticated users can manage equipment"
ON equipment FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Suppliers
DROP POLICY IF EXISTS "Suppliers access control" ON suppliers;
CREATE POLICY "Authenticated users can manage suppliers"
ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Checklist templates
DROP POLICY IF EXISTS "Checklist templates access control" ON checklist_templates;
CREATE POLICY "Authenticated users can manage checklist templates"
ON checklist_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Checklist items
DROP POLICY IF EXISTS "Checklist items access control" ON checklist_items;
CREATE POLICY "Authenticated users can manage checklist items"
ON checklist_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Monthly inventories
DROP POLICY IF EXISTS "Users can view inventories for accessible locations" ON monthly_inventories;
DROP POLICY IF EXISTS "Users can create inventories" ON monthly_inventories;
DROP POLICY IF EXISTS "Users can update their own inventories" ON monthly_inventories;

CREATE POLICY "Authenticated users can manage inventories"
ON monthly_inventories FOR ALL TO authenticated USING (true) WITH CHECK (user_id = auth.uid());

-- Inventory items
DROP POLICY IF EXISTS "Inventory items access control" ON monthly_inventory_items;
CREATE POLICY "Authenticated users can manage inventory items"
ON monthly_inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Orders
DROP POLICY IF EXISTS "Users can view orders for accessible locations" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;

CREATE POLICY "Authenticated users can manage orders"
ON orders FOR ALL TO authenticated USING (true) WITH CHECK (user_id = auth.uid());

-- Messages
DROP POLICY IF EXISTS "Users can view messages for accessible locations" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Authenticated users can manage messages"
ON messages FOR ALL TO authenticated USING (true) WITH CHECK (from_user = auth.uid());

-- Clean up remaining policies
DROP POLICY IF EXISTS "Admins can view archived users" ON archived_users;
DROP POLICY IF EXISTS "Admins can create archived user records" ON archived_users;
DROP POLICY IF EXISTS "Admins can update archived users" ON archived_users;
CREATE POLICY "Authenticated users can manage archived users"
ON archived_users FOR ALL TO authenticated USING (true) WITH CHECK (true);