-- STEP 1: COMPLETE USER RESET
-- Phase 1A: Clear all user-related data from tables with user references

-- Clear chat-related tables
DELETE FROM chat_participants;
DELETE FROM chat_messages;
DELETE FROM chat_notifications;
DELETE FROM message_read_receipts;
DELETE FROM message_reminders;

-- Clear connection and user activity tables
DELETE FROM connection_requests;
DELETE FROM cash_closures;
DELETE FROM checklist_sessions;
DELETE FROM monthly_inventories;
DELETE FROM monthly_inventory_items;
DELETE FROM orders;
DELETE FROM notifications;
DELETE FROM maintenance_records;
DELETE FROM messages;

-- Clear user permissions and audit logs
DELETE FROM user_permissions;
DELETE FROM role_audit_log;

-- Phase 1B: Clear user tables
DELETE FROM user_invitations;
DELETE FROM archived_users;
DELETE FROM profiles;

-- Phase 1C: Clear Supabase Auth users (this will cascade to profiles due to foreign key)
-- Note: We'll handle auth.users deletion through the auth admin API in the next step

-- Verify all user-related tables are empty
SELECT 'chat_participants' as table_name, COUNT(*) as remaining_records FROM chat_participants
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM chat_messages
UNION ALL
SELECT 'user_invitations', COUNT(*) FROM user_invitations
UNION ALL
SELECT 'archived_users', COUNT(*) FROM archived_users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'user_permissions', COUNT(*) FROM user_permissions;