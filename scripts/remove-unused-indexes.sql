-- Script per rimuovere indici inutilizzati identificati nell'analisi
-- IMPORTANTE: Eseguire questi comandi UNO ALLA VOLTA in produzione
-- e monitorare le performance dopo ogni rimozione

-- BACKUP degli indici prima della rimozione (per ripristino rapido se necessario)
-- Salvare questi CREATE INDEX in caso di necessità di ripristino

-- 1. INDICI DUPLICATI O RIDONDANTI

-- Rimuovi idx_message_read_receipts_message se esiste (duplicato di idx_message_read_receipts_message_id)
DROP INDEX IF EXISTS public.idx_message_read_receipts_message;

-- Rimuovi idx_chat_messages_reply_to se esiste (duplicato di idx_chat_messages_reply_to_id)
DROP INDEX IF EXISTS public.idx_chat_messages_reply_to;

-- 2. INDICI SU COLONNE A BASSA CARDINALITÀ

-- Rimuovi indice su status nelle monthly_inventories (pochi valori distinti)
DROP INDEX IF EXISTS public.idx_monthly_inventories_status;

-- Rimuovi indice su categoria suppliers (bassa cardinalità)
DROP INDEX IF EXISTS public.idx_suppliers_category;

-- Rimuovi indice su equipment status (pochi valori: operational, maintenance, broken)
DROP INDEX IF EXISTS public.idx_equipment_status;

-- 3. INDICI SU COMBINAZIONI POCO UTILIZZATE

-- Rimuovi indice location+department su checklist_templates (query rare)
DROP INDEX IF EXISTS public.idx_checklists_location_department;
DROP INDEX IF EXISTS public.idx_checklist_templates_location_department;

-- Rimuovi indice location+status su equipment (combinazione poco usata)
DROP INDEX IF EXISTS public.idx_equipment_location_status;

-- 4. INDICI SU COLONNE NON-UNIQUE POCO INTERROGATE

-- Rimuovi indice su email in profiles (non è unique constraint primario)
DROP INDEX IF EXISTS public.idx_profiles_email;

-- Rimuovi indice su token+status nelle user_invitations (query molto rare)
DROP INDEX IF EXISTS public.idx_user_invitations_token_status;

-- 5. INDICI SU FOREIGN KEYS CON POCHE RELAZIONI

-- Rimuovi indice su parent_location_id se le query gerarchiche sono rare
DROP INDEX IF EXISTS public.idx_locations_parent_location_id;

-- Rimuovi indice su equipment_id in maintenance_records se ci sono pochi maintenance records
DROP INDEX IF EXISTS public.idx_maintenance_records_equipment;

-- 6. VERIFICA DEGLI INDICI RIMASTI
-- Eseguire questa query per verificare quali indici sono rimasti:
/*
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexname::regclass) DESC;
*/

-- 7. MONITORAGGIO POST-RIMOZIONE
-- Dopo aver rimosso gli indici, monitora le performance con:
/*
-- Query slow query log
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
WHERE query LIKE '%FROM table_name%'
ORDER BY mean_exec_time DESC;

-- Verifica scansioni sequenziali
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;
*/

-- 8. BACKUP PER RIPRISTINO RAPIDO (se necessario)
-- Se dopo la rimozione si verificano problemi di performance,
-- ricreare gli indici con questi comandi:

/*
-- Backup commands per ripristino:
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message ON public.message_read_receipts (message_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON public.chat_messages (reply_to_id);
CREATE INDEX IF NOT EXISTS idx_monthly_inventories_status ON public.monthly_inventories (status);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON public.suppliers (category);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON public.equipment (status);
CREATE INDEX IF NOT EXISTS idx_checklists_location_department ON public.checklist_templates (location, department);
CREATE INDEX IF NOT EXISTS idx_equipment_location_status ON public.equipment (location, status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token_status ON public.user_invitations (invitation_token, status);
*/

-- NOTA: Prima di rimuovere definitivamente, considera di disabilitare temporaneamente
-- gli indici invece di eliminarli, usando:
-- UPDATE pg_index SET indisvalid = false WHERE indexrelid = 'index_name'::regclass;
-- Questo permette di testarli disabilitati prima della rimozione definitiva.