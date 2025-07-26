-- Fix remaining chat_participants policy issue completely
DROP POLICY IF EXISTS "Chat admins can manage participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view chat participants" ON public.chat_participants;

-- Create simplified, non-recursive policies
CREATE POLICY "Users can view participants in their chats"
ON public.chat_participants
FOR SELECT
USING (
  -- User can see participants in chats they're part of
  EXISTS (
    SELECT 1 FROM public.chat_participants cp 
    WHERE cp.chat_id = chat_participants.chat_id 
    AND cp.user_id = auth.uid()
  )
  OR
  -- Or in global/announcement chats for their location
  EXISTS (
    SELECT 1 FROM public.chats c
    WHERE c.id = chat_participants.chat_id
    AND c.type IN ('global', 'announcements')
    AND c.location = (SELECT location FROM public.profiles WHERE user_id = auth.uid())
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

CREATE POLICY "Chat admins can manage participants"
ON public.chat_participants
FOR ALL
USING (
  -- Chat creator can manage all participants
  EXISTS (
    SELECT 1 FROM public.chats c
    WHERE c.id = chat_participants.chat_id
    AND c.created_by = auth.uid()
  )
  OR
  -- Chat admins can manage participants
  EXISTS (
    SELECT 1 FROM public.chat_participants cp
    WHERE cp.chat_id = chat_participants.chat_id
    AND cp.user_id = auth.uid()
    AND cp.role = 'admin'
  )
  OR
  -- Managers can manage all participants
  get_current_user_role() IN ('manager', 'super_admin')
);

-- Ensure default chats exist for all locations
SELECT public.ensure_default_chats();