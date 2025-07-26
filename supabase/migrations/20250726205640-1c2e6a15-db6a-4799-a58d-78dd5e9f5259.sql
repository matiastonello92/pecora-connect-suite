-- Fix foreign key relationships for chat system
-- Add foreign key constraints to ensure proper relationships

-- Add foreign key from chat_participants to profiles
ALTER TABLE chat_participants 
ADD CONSTRAINT chat_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key from chat_messages to profiles
ALTER TABLE chat_messages 
ADD CONSTRAINT chat_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key from connection_requests to profiles  
ALTER TABLE connection_requests 
ADD CONSTRAINT connection_requests_requester_id_fkey 
FOREIGN KEY (requester_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE connection_requests 
ADD CONSTRAINT connection_requests_recipient_id_fkey 
FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key from chats to profiles
ALTER TABLE chats 
ADD CONSTRAINT chats_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add foreign keys for message relationships
ALTER TABLE chat_messages 
ADD CONSTRAINT chat_messages_chat_id_fkey 
FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

ALTER TABLE chat_messages 
ADD CONSTRAINT chat_messages_reply_to_id_fkey 
FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id) ON DELETE SET NULL;

-- Add foreign keys for participant relationships  
ALTER TABLE chat_participants 
ADD CONSTRAINT chat_participants_chat_id_fkey 
FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

-- Add foreign keys for read receipts
ALTER TABLE message_read_receipts 
ADD CONSTRAINT message_read_receipts_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE;

ALTER TABLE message_read_receipts 
ADD CONSTRAINT message_read_receipts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign keys for notifications
ALTER TABLE chat_notifications 
ADD CONSTRAINT chat_notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE chat_notifications 
ADD CONSTRAINT chat_notifications_chat_id_fkey 
FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

ALTER TABLE chat_notifications 
ADD CONSTRAINT chat_notifications_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE;