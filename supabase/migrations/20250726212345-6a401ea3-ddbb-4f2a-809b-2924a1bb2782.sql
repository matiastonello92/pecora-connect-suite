-- Drop and recreate foreign key constraints to ensure they're properly set
DO $$
BEGIN
    -- Drop existing constraints if they exist
    BEGIN
        ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_chat_id_fkey;
        ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;
        ALTER TABLE connection_requests DROP CONSTRAINT IF EXISTS connection_requests_requester_id_fkey;
        ALTER TABLE connection_requests DROP CONSTRAINT IF EXISTS connection_requests_recipient_id_fkey;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore errors if constraints don't exist
        NULL;
    END;
    
    -- Add the constraints
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
END $$;