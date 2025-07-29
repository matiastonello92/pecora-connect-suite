-- Add composite indexes for optimal performance (non-concurrent for transaction compatibility)
CREATE INDEX IF NOT EXISTS idx_cash_closures_location_date_status 
ON cash_closures(location, date DESC, status) 
WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_monthly_inventories_location_created_status 
ON monthly_inventories(location, created_at DESC, status) 
WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_location_status_created 
ON equipment(location, status, created_at DESC) 
WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_checklist_sessions_location_created_status 
ON checklist_sessions(location, created_at DESC, status) 
WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_location_created_status 
ON orders(location, created_at DESC, status) 
WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_suppliers_location_status_created 
ON suppliers(location, status, created_at DESC) 
WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_location_created_status 
ON messages(location, created_at DESC, status) 
WHERE status IS NOT NULL;

-- Chat-specific optimized indexes
CREATE INDEX IF NOT EXISTS idx_chats_type_location_last_message 
ON chats(type, location, last_message_at DESC) 
WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS idx_chat_participants_user_chat_joined 
ON chat_participants(user_id, chat_id, joined_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created_sender 
ON chat_messages(chat_id, created_at DESC, sender_id) 
WHERE is_deleted = false;

-- Profile optimization for location lookups
CREATE INDEX IF NOT EXISTS idx_profiles_locations_gin 
ON profiles USING GIN(locations) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_profiles_user_status_role 
ON profiles(user_id, status, role) 
WHERE status = 'active';

-- Optimized RLS policies using indexed fields instead of array operations

-- Drop existing policies that use inefficient array operations
DROP POLICY IF EXISTS "Users can view cash closures for their location" ON cash_closures;
DROP POLICY IF EXISTS "Users can view inventories for their location" ON monthly_inventories;
DROP POLICY IF EXISTS "Users can view equipment for their location" ON equipment;
DROP POLICY IF EXISTS "Users can view checklist sessions for their location" ON checklist_sessions;
DROP POLICY IF EXISTS "Users can view orders for their location" ON orders;
DROP POLICY IF EXISTS "Users can view suppliers for their location" ON suppliers;
DROP POLICY IF EXISTS "Users can view messages for their location" ON messages;

-- Create optimized RLS policies using EXISTS with indexed joins
CREATE POLICY "Users can view cash closures for accessible locations" ON cash_closures
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
      AND p.status = 'active'
      AND cash_closures.location = ANY(p.locations)
  )
);

CREATE POLICY "Users can view inventories for accessible locations" ON monthly_inventories
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
      AND p.status = 'active'
      AND monthly_inventories.location = ANY(p.locations)
  )
);

CREATE POLICY "Users can view equipment for accessible locations" ON equipment
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
      AND p.status = 'active'
      AND equipment.location = ANY(p.locations)
  )
);

CREATE POLICY "Users can view checklist sessions for accessible locations" ON checklist_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
      AND p.status = 'active'
      AND checklist_sessions.location = ANY(p.locations)
  )
);

CREATE POLICY "Users can view orders for accessible locations" ON orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
      AND p.status = 'active'
      AND orders.location = ANY(p.locations)
  )
);

CREATE POLICY "Users can view suppliers for accessible locations" ON suppliers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
      AND p.status = 'active'
      AND suppliers.location = ANY(p.locations)
  )
);

CREATE POLICY "Users can view messages for accessible locations" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
      AND p.status = 'active'
      AND (
        messages.location = ANY(p.locations) OR 
        messages.from_user = auth.uid() OR 
        messages.to_user = auth.uid()
      )
  )
);