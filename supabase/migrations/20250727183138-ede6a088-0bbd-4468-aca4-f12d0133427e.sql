-- Fix infinite recursion in chat_participants RLS policies

-- First, drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view chat participants" ON chat_participants;
DROP POLICY IF EXISTS "view_participants_in_chats" ON chat_participants;
DROP POLICY IF EXISTS "chat_admins_manage_participants" ON chat_participants;
DROP POLICY IF EXISTS "delete_self_as_participant" ON chat_participants;
DROP POLICY IF EXISTS "insert_self_as_participant" ON chat_participants;
DROP POLICY IF EXISTS "update_own_participant_status" ON chat_participants;

-- Create simplified, non-recursive policies

-- Allow users to view their own participant records
CREATE POLICY "view_own_participation" ON chat_participants
FOR SELECT USING (user_id = auth.uid());

-- Allow users to view other participants in chats they're part of
CREATE POLICY "view_chat_participants" ON chat_participants
FOR SELECT USING (
  chat_id IN (
    SELECT cp.chat_id FROM chat_participants cp WHERE cp.user_id = auth.uid()
  )
  OR
  chat_id IN (
    SELECT c.id FROM chats c 
    WHERE c.type IN ('global', 'announcements') 
    AND c.location = (
      SELECT p.location FROM profiles p WHERE p.user_id = auth.uid()
    )
  )
);

-- Allow users to insert themselves as participants
CREATE POLICY "insert_self_participation" ON chat_participants
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow users to update their own participation settings
CREATE POLICY "update_own_participation" ON chat_participants
FOR UPDATE USING (user_id = auth.uid());

-- Allow users to remove themselves from chats
CREATE POLICY "delete_own_participation" ON chat_participants
FOR DELETE USING (user_id = auth.uid());

-- Allow chat admins and managers to manage participants
CREATE POLICY "admin_manage_participants" ON chat_participants
FOR ALL USING (
  -- Chat creator can manage
  chat_id IN (
    SELECT c.id FROM chats c WHERE c.created_by = auth.uid()
  )
  OR
  -- Chat admin can manage  
  chat_id IN (
    SELECT cp.chat_id FROM chat_participants cp 
    WHERE cp.user_id = auth.uid() AND cp.role = 'admin'
  )
  OR
  -- System managers can manage
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('manager', 'super_admin')
);