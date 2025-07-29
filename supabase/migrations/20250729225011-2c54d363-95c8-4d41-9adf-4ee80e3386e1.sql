-- Creazione indici di copertura per foreign keys non indicizzate
-- Nota: Gli indici vengono creati senza CONCURRENTLY poiché siamo in una transazione di migrazione

-- 1. ARCHIVED_USERS - Foreign keys senza indici
CREATE INDEX IF NOT EXISTS idx_archived_users_archived_by 
ON public.archived_users (archived_by)
WHERE archived_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_archived_users_original_user_id 
ON public.archived_users (original_user_id)
WHERE original_user_id IS NOT NULL;

-- 2. CASH_CLOSURES - Foreign key user_id
CREATE INDEX IF NOT EXISTS idx_cash_closures_user_id 
ON public.cash_closures (user_id);

-- Indice composto per query frequenti su location e data
CREATE INDEX IF NOT EXISTS idx_cash_closures_location_date 
ON public.cash_closures (location, date DESC);

-- 3. CHAT_MESSAGES - Foreign keys per performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to_id 
ON public.chat_messages (reply_to_id)
WHERE reply_to_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id 
ON public.chat_messages (sender_id);

-- Indice composto per query comuni chat + timestamp
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created 
ON public.chat_messages (chat_id, created_at DESC);

-- 4. CHAT_PARTICIPANTS - Foreign keys 
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id 
ON public.chat_participants (user_id);

CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id 
ON public.chat_participants (chat_id);

-- Indice composto per lookup di partecipazione
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_user 
ON public.chat_participants (chat_id, user_id);

-- 5. CHECKLIST_SESSIONS - Foreign keys
CREATE INDEX IF NOT EXISTS idx_checklist_sessions_user_id 
ON public.checklist_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_checklist_sessions_template_id 
ON public.checklist_sessions (template_id)
WHERE template_id IS NOT NULL;

-- 6. CHECKLIST_ITEMS - Foreign key template_id
CREATE INDEX IF NOT EXISTS idx_checklist_items_template_id 
ON public.checklist_items (template_id)
WHERE template_id IS NOT NULL;

-- 7. CHECKLIST_TEMPLATES - Foreign key created_by
CREATE INDEX IF NOT EXISTS idx_checklist_templates_created_by 
ON public.checklist_templates (created_by)
WHERE created_by IS NOT NULL;

-- Indice per query su location e department
CREATE INDEX IF NOT EXISTS idx_checklist_templates_location_dept 
ON public.checklist_templates (location, department);

-- 8. CONNECTION_REQUESTS - Foreign keys
CREATE INDEX IF NOT EXISTS idx_connection_requests_requester_id 
ON public.connection_requests (requester_id);

CREATE INDEX IF NOT EXISTS idx_connection_requests_recipient_id 
ON public.connection_requests (recipient_id);

-- 9. LOCATION_DASHBOARD_CONFIGS - Foreign key created_by
CREATE INDEX IF NOT EXISTS idx_location_dashboard_configs_created_by 
ON public.location_dashboard_configs (created_by)
WHERE created_by IS NOT NULL;

-- 10. MAINTENANCE_RECORDS - Foreign keys
CREATE INDEX IF NOT EXISTS idx_maintenance_records_equipment_id 
ON public.maintenance_records (equipment_id)
WHERE equipment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_maintenance_records_performed_by 
ON public.maintenance_records (performed_by)
WHERE performed_by IS NOT NULL;