-- Phase 1: Complete Permission System Removal Migration

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
-- Cash closures - allow all authenticated users
DROP POLICY IF EXISTS "Users can view cash closures for accessible locations" ON cash_closures;
DROP POLICY IF EXISTS "Users can create cash closures" ON cash_closures;
DROP POLICY IF EXISTS "Users can update their own cash closures" ON cash_closures;

CREATE POLICY "Authenticated users can manage cash closures"
ON cash_closures FOR ALL
TO authenticated
USING (true)
WITH CHECK (user_id = auth.uid());

-- Equipment - allow all authenticated users
DROP POLICY IF EXISTS "Equipment access control" ON equipment;

CREATE POLICY "Authenticated users can manage equipment"
ON equipment FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Suppliers - allow all authenticated users
DROP POLICY IF EXISTS "Suppliers access control" ON suppliers;

CREATE POLICY "Authenticated users can manage suppliers"
ON suppliers FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Checklist templates - allow all authenticated users
DROP POLICY IF EXISTS "Checklist templates access control" ON checklist_templates;

CREATE POLICY "Authenticated users can manage checklist templates"
ON checklist_templates FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Checklist items - allow all authenticated users
DROP POLICY IF EXISTS "Checklist items access control" ON checklist_items;

CREATE POLICY "Authenticated users can manage checklist items"
ON checklist_items FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Monthly inventories - allow all authenticated users
DROP POLICY IF EXISTS "Users can view inventories for accessible locations" ON monthly_inventories;
DROP POLICY IF EXISTS "Users can create inventories" ON monthly_inventories;
DROP POLICY IF EXISTS "Users can update their own inventories" ON monthly_inventories;

CREATE POLICY "Authenticated users can manage inventories"
ON monthly_inventories FOR ALL
TO authenticated
USING (true)
WITH CHECK (user_id = auth.uid());

-- Inventory items - allow all authenticated users
DROP POLICY IF EXISTS "Inventory items access control" ON monthly_inventory_items;

CREATE POLICY "Authenticated users can manage inventory items"
ON monthly_inventory_items FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Orders - allow all authenticated users
DROP POLICY IF EXISTS "Users can view orders for accessible locations" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;

CREATE POLICY "Authenticated users can manage orders"
ON orders FOR ALL
TO authenticated
USING (true)
WITH CHECK (user_id = auth.uid());

-- Checklist sessions - allow all authenticated users
DROP POLICY IF EXISTS "Users can view checklist sessions for accessible locations" ON checklist_sessions;
DROP POLICY IF EXISTS "Users can create checklist sessions" ON checklist_sessions;
DROP POLICY IF EXISTS "Users can update their own checklist sessions" ON checklist_sessions;

CREATE POLICY "Authenticated users can manage checklist sessions"
ON checklist_sessions FOR ALL
TO authenticated
USING (true)
WITH CHECK (user_id = auth.uid());

-- Messages - allow all authenticated users
DROP POLICY IF EXISTS "Users can view messages for accessible locations" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

CREATE POLICY "Authenticated users can manage messages"
ON messages FOR ALL
TO authenticated
USING (true)
WITH CHECK (from_user = auth.uid());

-- Maintenance records - allow all authenticated users
DROP POLICY IF EXISTS "Users can view maintenance records for their location" ON maintenance_records;
DROP POLICY IF EXISTS "Users can create maintenance records" ON maintenance_records;

CREATE POLICY "Authenticated users can manage maintenance records"
ON maintenance_records FOR ALL
TO authenticated
USING (true)
WITH CHECK (performed_by = auth.uid());

-- Chat messages - remove complex role checks
DROP POLICY IF EXISTS "Users can create messages in their chats" ON chat_messages;

CREATE POLICY "Users can create messages in their chats"
ON chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_id = chat_messages.chat_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM chats
      WHERE id = chat_messages.chat_id AND type IN ('global', 'announcements')
    )
  )
);

-- Remove archived users policies that check roles
DROP POLICY IF EXISTS "Admins can view archived users" ON archived_users;
DROP POLICY IF EXISTS "Admins can create archived user records" ON archived_users;
DROP POLICY IF EXISTS "Admins can update archived users" ON archived_users;

CREATE POLICY "Authenticated users can manage archived users"
ON archived_users FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Remove location chat groups admin restrictions
DROP POLICY IF EXISTS "Admins can manage location chat groups" ON location_chat_groups;
DROP POLICY IF EXISTS "Users can view location chat groups they have access to" ON location_chat_groups;

CREATE POLICY "Authenticated users can manage location chat groups"
ON location_chat_groups FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Dashboard configs - remove role restrictions
DROP POLICY IF EXISTS "Dashboard configs access control" ON location_dashboard_configs;

CREATE POLICY "Authenticated users can manage dashboard configs"
ON location_dashboard_configs FOR ALL
TO authenticated
USING (true)
WITH CHECK (created_by = auth.uid());

-- Clean up any remaining user data to remove deprecated fields
UPDATE profiles 
SET updated_at = now()
WHERE user_id IS NOT NULL;