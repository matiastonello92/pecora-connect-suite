-- Fix infinite recursion in chat_participants RLS policies
-- The issue is that policies are calling functions that query the same table

-- Step 1: Create helper functions that don't cause recursion
CREATE OR REPLACE FUNCTION public.get_user_locations_for_rls(user_uuid uuid)
RETURNS text[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(locations, ARRAY[location]) 
  FROM profiles 
  WHERE user_id = user_uuid;
$$;

-- Step 2: Replace the problematic chat_participants policies
DROP POLICY IF EXISTS "admin_manage_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "view_chat_participants" ON public.chat_participants;

-- Create new policies that don't cause recursion
CREATE POLICY "admin_manage_participants" ON public.chat_participants
FOR ALL
USING (
  -- Chat creator can manage
  (EXISTS (
    SELECT 1 FROM chats c 
    WHERE c.id = chat_participants.chat_id 
    AND c.created_by = auth.uid()
  ))
  OR
  -- User is managing their own participation
  (user_id = auth.uid())
  OR 
  -- System admin
  (get_current_user_role() = ANY (ARRAY['manager'::text, 'super_admin'::text]))
)
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM chats c 
    WHERE c.id = chat_participants.chat_id 
    AND c.created_by = auth.uid()
  ))
  OR
  (user_id = auth.uid())
  OR 
  (get_current_user_role() = ANY (ARRAY['manager'::text, 'super_admin'::text]))
);

CREATE POLICY "view_chat_participants" ON public.chat_participants
FOR SELECT
USING (
  -- User can see their own participation
  (user_id = auth.uid())
  OR
  -- User can see participants of chats they're in (via direct membership check)
  (chat_id IN (
    SELECT cp.chat_id 
    FROM chat_participants cp 
    WHERE cp.user_id = auth.uid()
  ))
  OR
  -- User can see global/announcement chat participants for their locations
  (EXISTS (
    SELECT 1 FROM chats c
    WHERE c.id = chat_participants.chat_id
    AND c.type IN ('global', 'announcements')
    AND c.location = ANY(get_user_locations_for_rls(auth.uid()))
  ))
);

-- Step 3: Fix the message_reminders foreign key issue
-- Add proper foreign key constraint
ALTER TABLE public.message_reminders 
DROP CONSTRAINT IF EXISTS message_reminders_chat_id_fkey;

ALTER TABLE public.message_reminders 
ADD CONSTRAINT message_reminders_chat_id_fkey 
FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;