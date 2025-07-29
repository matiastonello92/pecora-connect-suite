-- Seconda parte: Indici rimanenti per foreign keys

-- 11. MESSAGE_READ_RECEIPTS - Foreign keys
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message_id 
ON public.message_read_receipts (message_id);

CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_id 
ON public.message_read_receipts (user_id);

-- 12. MESSAGE_REMINDERS - Foreign keys
CREATE INDEX IF NOT EXISTS idx_message_reminders_user_id 
ON public.message_reminders (user_id);

CREATE INDEX IF NOT EXISTS idx_message_reminders_chat_id 
ON public.message_reminders (chat_id);

CREATE INDEX IF NOT EXISTS idx_message_reminders_message_id 
ON public.message_reminders (message_id);

-- Indice per query su stato e scheduling
CREATE INDEX IF NOT EXISTS idx_message_reminders_status_scheduled 
ON public.message_reminders (status, scheduled_at)
WHERE status = 'pending';

-- 13. MESSAGES - Foreign keys
CREATE INDEX IF NOT EXISTS idx_messages_from_user 
ON public.messages (from_user);

CREATE INDEX IF NOT EXISTS idx_messages_to_user 
ON public.messages (to_user)
WHERE to_user IS NOT NULL;

-- Indice per query su location e timestamp
CREATE INDEX IF NOT EXISTS idx_messages_location_created 
ON public.messages (location, created_at DESC);

-- 14. MONTHLY_INVENTORIES - Foreign keys
CREATE INDEX IF NOT EXISTS idx_monthly_inventories_user_id 
ON public.monthly_inventories (user_id);

CREATE INDEX IF NOT EXISTS idx_monthly_inventories_approved_by 
ON public.monthly_inventories (approved_by)
WHERE approved_by IS NOT NULL;

-- Indice per query su location, department, stato
CREATE INDEX IF NOT EXISTS idx_monthly_inventories_location_dept_status 
ON public.monthly_inventories (location, department, status);

-- 15. MONTHLY_INVENTORY_ITEMS - Foreign keys
CREATE INDEX IF NOT EXISTS idx_monthly_inventory_items_inventory_id 
ON public.monthly_inventory_items (inventory_id)
WHERE inventory_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_monthly_inventory_items_product_id 
ON public.monthly_inventory_items (product_id)
WHERE product_id IS NOT NULL;

-- 16. ORDERS - Foreign keys
CREATE INDEX IF NOT EXISTS idx_orders_user_id 
ON public.orders (user_id);

CREATE INDEX IF NOT EXISTS idx_orders_supplier_id 
ON public.orders (supplier_id)
WHERE supplier_id IS NOT NULL;

-- Indice per query su location, stato, data
CREATE INDEX IF NOT EXISTS idx_orders_location_status_date 
ON public.orders (location, status, order_date DESC);

-- 17. NOTIFICATIONS - Foreign key user_id
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON public.notifications (user_id);

-- Indice per query su read status e timestamp
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
ON public.notifications (user_id, read, created_at DESC);

-- 18. CHAT_NOTIFICATIONS - Foreign keys
CREATE INDEX IF NOT EXISTS idx_chat_notifications_user_id 
ON public.chat_notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_chat_notifications_chat_id 
ON public.chat_notifications (chat_id);

CREATE INDEX IF NOT EXISTS idx_chat_notifications_message_id 
ON public.chat_notifications (message_id)
WHERE message_id IS NOT NULL;

-- 19. ALERT_CONFIGURATIONS - Foreign key user_id
CREATE INDEX IF NOT EXISTS idx_alert_configurations_user_id 
ON public.alert_configurations (user_id);

-- 20. ALERTS - Foreign key user_id
CREATE INDEX IF NOT EXISTS idx_alerts_user_id 
ON public.alerts (user_id)
WHERE user_id IS NOT NULL;

-- Indice per query su location e timestamp
CREATE INDEX IF NOT EXISTS idx_alerts_location_created 
ON public.alerts (location_code, created_at DESC)
WHERE location_code IS NOT NULL;