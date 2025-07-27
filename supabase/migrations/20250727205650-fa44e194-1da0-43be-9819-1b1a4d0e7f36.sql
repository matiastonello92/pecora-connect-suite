-- Fix infinite recursion in chat_participants policy by simplifying the logic

DROP POLICY IF EXISTS "view_chat_participants" ON chat_participants;

CREATE POLICY "view_chat_participants" ON chat_participants
FOR SELECT 
USING (
  -- User can view their own participation
  user_id = auth.uid() OR
  -- User can view participants in chats they are part of
  EXISTS (
    SELECT 1 FROM chat_participants cp2
    WHERE cp2.chat_id = chat_participants.chat_id 
    AND cp2.user_id = auth.uid()
  ) OR
  -- User can view participants in global/announcement chats for their locations
  (
    chat_id IN (
      SELECT c.id FROM chats c
      WHERE c.type IN ('global', 'announcements') 
      AND c.location = ANY(get_current_user_locations())
    )
  )
);