-- Fix infinite recursion in chat_participants policy
DROP POLICY IF EXISTS "Users can view participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Participants can insert themselves" ON public.chat_participants;
DROP POLICY IF EXISTS "Participants can update their status" ON public.chat_participants;
DROP POLICY IF EXISTS "Participants can leave chats" ON public.chat_participants;

-- Create corrected policies for chat_participants
CREATE POLICY "Users can view participants in their chats"
ON public.chat_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants cp 
    WHERE cp.chat_id = chat_participants.chat_id 
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert themselves as participants"
ON public.chat_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participant status"
ON public.chat_participants
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete themselves as participants"
ON public.chat_participants
FOR DELETE
USING (auth.uid() = user_id);