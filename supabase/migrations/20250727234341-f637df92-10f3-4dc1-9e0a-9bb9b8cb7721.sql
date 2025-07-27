-- Complete authentication system reset
-- Delete all user-related data and start fresh

-- Step 1: Delete all chat participants
DELETE FROM public.chat_participants;

-- Step 2: Delete all user profiles
DELETE FROM public.profiles;

-- Step 3: Delete all user invitations
DELETE FROM public.user_invitations;

-- Step 4: Delete all archived users
DELETE FROM public.archived_users;

-- Step 5: Delete all user permissions
DELETE FROM public.user_permissions;

-- Step 6: Delete all connection requests
DELETE FROM public.connection_requests;

-- Step 7: Delete all notifications
DELETE FROM public.notifications;

-- Step 8: Delete all message reminders
DELETE FROM public.message_reminders;

-- Step 9: Delete all chat messages
DELETE FROM public.chat_messages;

-- Step 10: Delete all message read receipts
DELETE FROM public.message_read_receipts;

-- Step 11: Delete all role audit logs
DELETE FROM public.role_audit_log;

-- Step 12: Delete all cash closures
DELETE FROM public.cash_closures;

-- Step 13: Delete all orders
DELETE FROM public.orders;

-- Step 14: Delete all monthly inventories and items
DELETE FROM public.monthly_inventory_items;
DELETE FROM public.monthly_inventories;

-- Step 15: Delete all maintenance records
DELETE FROM public.maintenance_records;

-- Step 16: Delete all checklist sessions
DELETE FROM public.checklist_sessions;

-- Step 17: Delete all messages
DELETE FROM public.messages;

-- Step 18: Delete all authentication users (this will cascade to auth-related tables)
DELETE FROM auth.users;

-- Step 19: Reset chat system to clean state
DELETE FROM public.chats;

-- Recreate essential chats for the system
SELECT public.ensure_chats_for_all_locations();