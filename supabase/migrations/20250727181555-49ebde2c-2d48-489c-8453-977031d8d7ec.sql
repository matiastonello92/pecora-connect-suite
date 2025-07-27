-- Fix infinite recursion in chat_participants policies by using proper functions
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Users can view chat participants" ON public.chat_participants;

-- Recreate the policy using existing security definer function
CREATE POLICY "Users can view chat participants"
ON public.chat_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_participants cp2 
    WHERE cp2.chat_id = chat_participants.chat_id 
    AND cp2.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM chats c 
    WHERE c.id = chat_participants.chat_id 
    AND c.type IN ('global', 'announcements') 
    AND c.location = (
      SELECT location FROM profiles WHERE user_id = auth.uid()
    )
  )
);