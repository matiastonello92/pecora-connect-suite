-- Update RLS policies to enforce single location access instead of 'all_locations'
-- Remove references to 'all_locations' from RLS policies

-- Update cash_closures policy
DROP POLICY IF EXISTS "Users can view cash closures for their location" ON cash_closures;

CREATE POLICY "Users can view cash closures for their location" ON cash_closures
FOR SELECT 
USING (
  -- User must have access to this specific location
  location = ANY(get_current_user_locations())
);

-- Update checklist_templates policy  
DROP POLICY IF EXISTS "Users can view checklist templates for their location" ON checklist_templates;

CREATE POLICY "Users can view checklist templates for their location" ON checklist_templates
FOR SELECT 
USING (
  location = ANY(get_current_user_locations())
);

-- Update checklist_sessions policy
DROP POLICY IF EXISTS "Users can view checklist sessions for their location" ON checklist_sessions;

CREATE POLICY "Users can view checklist sessions for their location" ON checklist_sessions
FOR SELECT 
USING (
  location = ANY(get_current_user_locations())
);

-- Update equipment policy
DROP POLICY IF EXISTS "Users can view equipment for their location" ON equipment;
DROP POLICY IF EXISTS "Users can manage equipment for their location" ON equipment;

CREATE POLICY "Users can view equipment for their location" ON equipment
FOR SELECT 
USING (
  location = ANY(get_current_user_locations())
);

CREATE POLICY "Users can manage equipment for their location" ON equipment
FOR ALL 
USING (
  location = ANY(get_current_user_locations())
);

-- Update kitchen_products policy
DROP POLICY IF EXISTS "Users can view kitchen products for their location" ON kitchen_products;

CREATE POLICY "Users can view kitchen products for their location" ON kitchen_products
FOR SELECT 
USING (
  location = ANY(get_current_user_locations())
);

-- Update monthly_inventories policy
DROP POLICY IF EXISTS "Users can view inventories for their location" ON monthly_inventories;

CREATE POLICY "Users can view inventories for their location" ON monthly_inventories
FOR SELECT 
USING (
  location = ANY(get_current_user_locations())
);

-- Update monthly_inventory_items policy  
DROP POLICY IF EXISTS "Users can view inventory items for their location" ON monthly_inventory_items;

CREATE POLICY "Users can view inventory items for their location" ON monthly_inventory_items
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM monthly_inventories mi
    WHERE mi.id = monthly_inventory_items.inventory_id 
    AND mi.location = ANY(get_current_user_locations())
  )
);

-- Update orders policy
DROP POLICY IF EXISTS "Users can view orders for their location" ON orders;

CREATE POLICY "Users can view orders for their location" ON orders
FOR SELECT 
USING (
  location = ANY(get_current_user_locations())
);

-- Update suppliers policy
DROP POLICY IF EXISTS "Users can view suppliers for their location" ON suppliers;

CREATE POLICY "Users can view suppliers for their location" ON suppliers
FOR SELECT 
USING (
  location = ANY(get_current_user_locations())
);

-- Update messages policy
DROP POLICY IF EXISTS "Users can view messages for their location" ON messages;

CREATE POLICY "Users can view messages for their location" ON messages
FOR SELECT 
USING (
  location = ANY(get_current_user_locations()) OR 
  from_user = auth.uid() OR 
  to_user = auth.uid()
);

-- Update maintenance_records policy
DROP POLICY IF EXISTS "Users can view maintenance records for their location" ON maintenance_records;

CREATE POLICY "Users can view maintenance records for their location" ON maintenance_records
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM equipment e
    WHERE e.id = maintenance_records.equipment_id 
    AND e.location = ANY(get_current_user_locations())
  )
);

-- Update chats policy to allow multi-location for chats only
DROP POLICY IF EXISTS "Users can view chats they participate in" ON chats;

CREATE POLICY "Users can view chats they participate in" ON chats
FOR SELECT 
USING (
  -- User is a participant
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.chat_id = chats.id 
    AND chat_participants.user_id = auth.uid()
  ) OR
  -- OR user has access to this location for global/announcement chats
  (
    type IN ('global', 'announcements') AND 
    location = ANY(get_current_user_locations())
  )
);

-- Update chat_participants policy
DROP POLICY IF EXISTS "view_chat_participants" ON chat_participants;

CREATE POLICY "view_chat_participants" ON chat_participants
FOR SELECT 
USING (
  user_id = auth.uid() OR
  chat_id IN (
    SELECT cp.chat_id
    FROM chat_participants cp
    WHERE cp.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM chats c
    WHERE c.id = chat_participants.chat_id 
    AND c.type IN ('global', 'announcements') 
    AND c.location = ANY(get_current_user_locations())
  )
);