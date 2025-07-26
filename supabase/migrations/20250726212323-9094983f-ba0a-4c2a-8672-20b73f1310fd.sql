-- Add missing foreign key constraints for chat system that don't exist yet
ALTER TABLE chat_messages 
ADD CONSTRAINT IF NOT EXISTS chat_messages_chat_id_fkey 
FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

ALTER TABLE chat_messages 
ADD CONSTRAINT IF NOT EXISTS chat_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE connection_requests 
ADD CONSTRAINT IF NOT EXISTS connection_requests_requester_id_fkey 
FOREIGN KEY (requester_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE connection_requests 
ADD CONSTRAINT IF NOT EXISTS connection_requests_recipient_id_fkey 
FOREIGN KEY (recipient_id) REFERENCES profiles(user_id) ON DELETE CASCADE;