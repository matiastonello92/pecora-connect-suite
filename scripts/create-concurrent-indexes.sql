-- Script per creazione indici CONCORRENTI (per uso in produzione)
-- Questi comandi devono essere eseguiti FUORI da una transazione, direttamente nel database

-- IMPORTANTE: Eseguire questi comandi UNO ALLA VOLTA in produzione
-- per minimizzare l'impatto sulle performance

-- 1. ARCHIVED_USERS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_archived_users_archived_by 
ON public.archived_users (archived_by)
WHERE archived_by IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_archived_users_original_user_id 
ON public.archived_users (original_user_id)
WHERE original_user_id IS NOT NULL;

-- 2. CASH_CLOSURES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cash_closures_user_id 
ON public.cash_closures (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cash_closures_location_date 
ON public.cash_closures (location, date DESC);

-- 3. CHAT_MESSAGES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_reply_to_id 
ON public.chat_messages (reply_to_id)
WHERE reply_to_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_sender_id 
ON public.chat_messages (sender_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_chat_created 
ON public.chat_messages (chat_id, created_at DESC);

-- 4. CHAT_PARTICIPANTS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_participants_user_id 
ON public.chat_participants (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_participants_chat_id 
ON public.chat_participants (chat_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_participants_chat_user 
ON public.chat_participants (chat_id, user_id);

-- 5. CHECKLIST_SESSIONS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checklist_sessions_user_id 
ON public.checklist_sessions (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checklist_sessions_template_id 
ON public.checklist_sessions (template_id)
WHERE template_id IS NOT NULL;

-- 6. CONNECTION_REQUESTS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connection_requests_requester_id 
ON public.connection_requests (requester_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connection_requests_recipient_id 
ON public.connection_requests (recipient_id);

-- 7. MAINTENANCE_RECORDS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_records_equipment_id 
ON public.maintenance_records (equipment_id)
WHERE equipment_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_records_performed_by 
ON public.maintenance_records (performed_by)
WHERE performed_by IS NOT NULL;

-- 8. MESSAGE_READ_RECEIPTS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_read_receipts_message_id 
ON public.message_read_receipts (message_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_read_receipts_user_id 
ON public.message_read_receipts (user_id);

-- 9. MESSAGE_REMINDERS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_reminders_user_id 
ON public.message_reminders (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_reminders_chat_id 
ON public.message_reminders (chat_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_reminders_message_id 
ON public.message_reminders (message_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_reminders_status_scheduled 
ON public.message_reminders (status, scheduled_at)
WHERE status = 'pending';

-- 10. MESSAGES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_from_user 
ON public.messages (from_user);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_to_user 
ON public.messages (to_user)
WHERE to_user IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_location_created 
ON public.messages (location, created_at DESC);

-- 11. MONTHLY_INVENTORIES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monthly_inventories_user_id 
ON public.monthly_inventories (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monthly_inventories_approved_by 
ON public.monthly_inventories (approved_by)
WHERE approved_by IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monthly_inventories_location_dept_status 
ON public.monthly_inventories (location, department, status);

-- 12. MONTHLY_INVENTORY_ITEMS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monthly_inventory_items_inventory_id 
ON public.monthly_inventory_items (inventory_id)
WHERE inventory_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monthly_inventory_items_product_id 
ON public.monthly_inventory_items (product_id)
WHERE product_id IS NOT NULL;

-- 13. ORDERS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id 
ON public.orders (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_supplier_id 
ON public.orders (supplier_id)
WHERE supplier_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_location_status_date 
ON public.orders (location, status, order_date DESC);

-- 14. NOTIFICATIONS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id 
ON public.notifications (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read_created 
ON public.notifications (user_id, read, created_at DESC);

-- 15. CHAT_NOTIFICATIONS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_notifications_user_id 
ON public.chat_notifications (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_notifications_chat_id 
ON public.chat_notifications (chat_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_notifications_message_id 
ON public.chat_notifications (message_id)
WHERE message_id IS NOT NULL;

-- 16. ALERT_CONFIGURATIONS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_configurations_user_id 
ON public.alert_configurations (user_id);

-- 17. ALERTS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_user_id 
ON public.alerts (user_id)
WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_location_created 
ON public.alerts (location_code, created_at DESC)
WHERE location_code IS NOT NULL;

-- Per verificare l'utilizzo degli indici:
-- SELECT schemaname, tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%' ORDER BY tablename, indexname;