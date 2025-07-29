-- Performance optimization for RLS policies
-- Replace auth.uid() with (select auth.uid()) to avoid re-evaluation per row

-- Drop existing policies and recreate them with performance optimizations

-- PROFILES TABLE
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "view_other_profiles" ON public.profiles;
DROP POLICY IF EXISTS "view_own_profile" ON public.profiles;

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "view_other_profiles" ON public.profiles
FOR SELECT USING ((select auth.role()) = 'authenticated'::text);

-- ALERT_CONFIGURATIONS TABLE
DROP POLICY IF EXISTS "Users can manage their own alert configurations" ON public.alert_configurations;

CREATE POLICY "Users can manage their own alert configurations" ON public.alert_configurations
FOR ALL USING ((select auth.uid()) = user_id);

-- ALERTS TABLE
DROP POLICY IF EXISTS "Users can update their own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can view their own alerts" ON public.alerts;

CREATE POLICY "Users can update their own alerts" ON public.alerts
FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can view their own alerts" ON public.alerts
FOR SELECT USING (((select auth.uid()) = user_id) OR (user_id IS NULL));

-- CASH_CLOSURES TABLE
DROP POLICY IF EXISTS "Users can create cash closures" ON public.cash_closures;
DROP POLICY IF EXISTS "Users can update their own cash closures" ON public.cash_closures;
DROP POLICY IF EXISTS "Users can view cash closures for accessible locations" ON public.cash_closures;

CREATE POLICY "Users can create cash closures" ON public.cash_closures
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own cash closures" ON public.cash_closures
FOR UPDATE USING ((user_id = (select auth.uid())) OR (get_current_user_role() = ANY (ARRAY['manager'::text, 'super_admin'::text])));

CREATE POLICY "Users can view cash closures for accessible locations" ON public.cash_closures
FOR SELECT USING (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = (select auth.uid())) AND (p.status = 'active'::text) AND (cash_closures.location = ANY (p.locations)))));

-- CHAT_MESSAGES TABLE
DROP POLICY IF EXISTS "Users can create messages in their chats" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.chat_messages;

CREATE POLICY "Users can create messages in their chats" ON public.chat_messages
FOR INSERT WITH CHECK ((sender_id = (select auth.uid())) AND ((EXISTS ( SELECT 1
   FROM chat_participants
  WHERE ((chat_participants.chat_id = chat_messages.chat_id) AND (chat_participants.user_id = (select auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM chats
  WHERE ((chats.id = chat_messages.chat_id) AND (chats.type = 'global'::chat_type)))) OR ((EXISTS ( SELECT 1
   FROM chats
  WHERE ((chats.id = chat_messages.chat_id) AND (chats.type = 'announcements'::chat_type)))) AND (get_current_user_role() = ANY (ARRAY['manager'::text, 'super_admin'::text])))));

CREATE POLICY "Users can update their own messages" ON public.chat_messages
FOR UPDATE USING (sender_id = (select auth.uid()));

CREATE POLICY "Users can view messages in their chats" ON public.chat_messages
FOR SELECT USING ((EXISTS ( SELECT 1
   FROM chat_participants
  WHERE ((chat_participants.chat_id = chat_messages.chat_id) AND (chat_participants.user_id = (select auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM chats
  WHERE ((chats.id = chat_messages.chat_id) AND ((chats.type = 'global'::chat_type) OR (chats.type = 'announcements'::chat_type))))));

-- CHAT_NOTIFICATIONS TABLE
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.chat_notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.chat_notifications;

CREATE POLICY "Users can update their own notifications" ON public.chat_notifications
FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "Users can view their own notifications" ON public.chat_notifications
FOR SELECT USING (user_id = (select auth.uid()));

-- CHAT_PARTICIPANTS TABLE
DROP POLICY IF EXISTS "users_can_manage_own_participation" ON public.chat_participants;
DROP POLICY IF EXISTS "users_can_view_accessible_chat_participants" ON public.chat_participants;

CREATE POLICY "users_can_manage_own_participation" ON public.chat_participants
FOR ALL USING (user_id = (select auth.uid()));

CREATE POLICY "users_can_view_accessible_chat_participants" ON public.chat_participants
FOR SELECT USING (user_can_access_chat(chat_id, (select auth.uid())));

-- CHATS TABLE
DROP POLICY IF EXISTS "Chat creators and admins can update chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "users_can_view_accessible_chats" ON public.chats;

CREATE POLICY "Chat creators and admins can update chats" ON public.chats
FOR UPDATE USING ((created_by = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM chat_participants
  WHERE ((chat_participants.chat_id = chats.id) AND (chat_participants.user_id = (select auth.uid())) AND (chat_participants.role = 'admin'::text)))) OR (get_current_user_role() = ANY (ARRAY['manager'::text, 'super_admin'::text])));

CREATE POLICY "Users can create chats" ON public.chats
FOR INSERT WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "users_can_view_accessible_chats" ON public.chats
FOR SELECT USING (user_can_access_chat(id, (select auth.uid())) OR ((type = ANY (ARRAY['global'::chat_type, 'announcements'::chat_type])) AND (location = ANY (get_current_user_locations()))));

-- CHECKLIST_SESSIONS TABLE
DROP POLICY IF EXISTS "Users can create checklist sessions" ON public.checklist_sessions;
DROP POLICY IF EXISTS "Users can update their own checklist sessions" ON public.checklist_sessions;
DROP POLICY IF EXISTS "Users can view checklist sessions for accessible locations" ON public.checklist_sessions;

CREATE POLICY "Users can create checklist sessions" ON public.checklist_sessions
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own checklist sessions" ON public.checklist_sessions
FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "Users can view checklist sessions for accessible locations" ON public.checklist_sessions
FOR SELECT USING (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = (select auth.uid())) AND (p.status = 'active'::text) AND (checklist_sessions.location = ANY (p.locations)))));

-- CONNECTION_REQUESTS TABLE
DROP POLICY IF EXISTS "Recipients can update connection requests" ON public.connection_requests;
DROP POLICY IF EXISTS "Users can create connection requests" ON public.connection_requests;
DROP POLICY IF EXISTS "Users can view their connection requests" ON public.connection_requests;

CREATE POLICY "Recipients can update connection requests" ON public.connection_requests
FOR UPDATE USING (recipient_id = (select auth.uid()));

CREATE POLICY "Users can create connection requests" ON public.connection_requests
FOR INSERT WITH CHECK ((requester_id = (select auth.uid())) AND can_send_connection_request(requester_id, recipient_id));

CREATE POLICY "Users can view their connection requests" ON public.connection_requests
FOR SELECT USING ((requester_id = (select auth.uid())) OR (recipient_id = (select auth.uid())));

-- EQUIPMENT TABLE
DROP POLICY IF EXISTS "Users can view equipment for accessible locations" ON public.equipment;

CREATE POLICY "Users can view equipment for accessible locations" ON public.equipment
FOR SELECT USING (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = (select auth.uid())) AND (p.status = 'active'::text) AND (equipment.location = ANY (p.locations)))));

-- MAINTENANCE_RECORDS TABLE
DROP POLICY IF EXISTS "Users can create maintenance records" ON public.maintenance_records;

CREATE POLICY "Users can create maintenance records" ON public.maintenance_records
FOR INSERT WITH CHECK (performed_by = (select auth.uid()));

-- MESSAGE_READ_RECEIPTS TABLE
DROP POLICY IF EXISTS "Users can create their own read receipts" ON public.message_read_receipts;
DROP POLICY IF EXISTS "Users can view read receipts for their chats" ON public.message_read_receipts;

CREATE POLICY "Users can create their own read receipts" ON public.message_read_receipts
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can view read receipts for their chats" ON public.message_read_receipts
FOR SELECT USING (EXISTS ( SELECT 1
   FROM (chat_messages cm
     JOIN chat_participants cp ON ((cm.chat_id = cp.chat_id)))
  WHERE ((cm.id = message_read_receipts.message_id) AND (cp.user_id = (select auth.uid())))));

-- MESSAGE_REMINDERS TABLE
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.message_reminders;

CREATE POLICY "Users can view their own reminders" ON public.message_reminders
FOR SELECT USING (user_id = (select auth.uid()));

-- MESSAGES TABLE
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages for accessible locations" ON public.messages;

CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT WITH CHECK (from_user = (select auth.uid()));

CREATE POLICY "Users can view messages for accessible locations" ON public.messages
FOR SELECT USING (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = (select auth.uid())) AND (p.status = 'active'::text) AND ((messages.location = ANY (p.locations)) OR (messages.from_user = (select auth.uid())) OR (messages.to_user = (select auth.uid()))))));

-- MONTHLY_INVENTORIES TABLE
DROP POLICY IF EXISTS "Users can create inventories" ON public.monthly_inventories;
DROP POLICY IF EXISTS "Users can update their own inventories" ON public.monthly_inventories;
DROP POLICY IF EXISTS "Users can view inventories for accessible locations" ON public.monthly_inventories;

CREATE POLICY "Users can create inventories" ON public.monthly_inventories
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own inventories" ON public.monthly_inventories
FOR UPDATE USING ((user_id = (select auth.uid())) OR (get_current_user_role() = ANY (ARRAY['manager'::text, 'super_admin'::text])));

CREATE POLICY "Users can view inventories for accessible locations" ON public.monthly_inventories
FOR SELECT USING (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = (select auth.uid())) AND (p.status = 'active'::text) AND (monthly_inventories.location = ANY (p.locations)))));

-- MONTHLY_INVENTORY_ITEMS TABLE
DROP POLICY IF EXISTS "Users can manage inventory items for their inventories" ON public.monthly_inventory_items;
DROP POLICY IF EXISTS "Users can view inventory items for their location" ON public.monthly_inventory_items;

CREATE POLICY "Users can manage inventory items for their inventories" ON public.monthly_inventory_items
FOR ALL USING (EXISTS ( SELECT 1
   FROM monthly_inventories mi
  WHERE ((mi.id = monthly_inventory_items.inventory_id) AND ((mi.user_id = (select auth.uid())) OR (get_current_user_role() = ANY (ARRAY['manager'::text, 'super_admin'::text]))))));

CREATE POLICY "Users can view inventory items for their location" ON public.monthly_inventory_items
FOR SELECT USING (EXISTS ( SELECT 1
   FROM monthly_inventories mi
  WHERE ((mi.id = monthly_inventory_items.inventory_id) AND (mi.location = ANY (get_current_user_locations())))));

-- NOTIFICATIONS TABLE
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (user_id = (select auth.uid()));

-- ORDERS TABLE
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view orders for accessible locations" ON public.orders;

CREATE POLICY "Users can create orders" ON public.orders
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own orders" ON public.orders
FOR UPDATE USING ((user_id = (select auth.uid())) OR (get_current_user_role() = ANY (ARRAY['manager'::text, 'super_admin'::text])));

CREATE POLICY "Users can view orders for accessible locations" ON public.orders
FOR SELECT USING (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = (select auth.uid())) AND (p.status = 'active'::text) AND (orders.location = ANY (p.locations)))));

-- SUPPLIERS TABLE
DROP POLICY IF EXISTS "Users can view suppliers for accessible locations" ON public.suppliers;

CREATE POLICY "Users can view suppliers for accessible locations" ON public.suppliers
FOR SELECT USING (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = (select auth.uid())) AND (p.status = 'active'::text) AND (suppliers.location = ANY (p.locations)))));

-- Also optimize the user functions that are frequently called
-- Update get_current_user_locations function to be more efficient
CREATE OR REPLACE FUNCTION public.get_current_user_locations()
RETURNS text[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT get_user_locations((select auth.uid()));
$function$;