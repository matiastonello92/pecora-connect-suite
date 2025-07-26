-- Add proper foreign key constraints for chat system
ALTER TABLE chat_participants 
ADD CONSTRAINT chat_participants_chat_id_fkey 
FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

ALTER TABLE chat_participants 
ADD CONSTRAINT chat_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE chat_messages 
ADD CONSTRAINT chat_messages_chat_id_fkey 
FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

ALTER TABLE chat_messages 
ADD CONSTRAINT chat_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE connection_requests 
ADD CONSTRAINT connection_requests_requester_id_fkey 
FOREIGN KEY (requester_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE connection_requests 
ADD CONSTRAINT connection_requests_recipient_id_fkey 
FOREIGN KEY (recipient_id) REFERENCES profiles(user_id) ON DELETE CASCADE;