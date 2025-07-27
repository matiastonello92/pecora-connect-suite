-- Fix infinite recursion in chat_participants RLS policies
DROP POLICY IF EXISTS "chat_participants_select_simple" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_insert_simple" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_update_simple" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_delete_simple" ON public.chat_participants;
DROP POLICY IF EXISTS "manage_own_participation" ON public.chat_participants;
DROP POLICY IF EXISTS "view_chat_members" ON public.chat_participants;
DROP POLICY IF EXISTS "view_own_participation" ON public.chat_participants;

-- Create simplified policies that avoid recursion
CREATE POLICY "Users can manage their own participation" ON public.chat_participants
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view members in chats they participate in" ON public.chat_participants
FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM chat_participants cp2 
    WHERE cp2.chat_id = chat_participants.chat_id 
    AND cp2.user_id = auth.uid()
  )
);

-- Clean up any existing test users and create the specified test user
DELETE FROM auth.users WHERE email = 'tonellomatias@gmail.com';

-- Create the test user with proper profile
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'tonellomatias@gmail.com',
  crypt('Asd123@@', gen_salt('bf')),
  now(),
  null,
  null,
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Utente","last_name":"Test"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Get the created user ID and create profile
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'tonellomatias@gmail.com';
  
  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    email,
    role,
    access_level,
    location,
    locations,
    department,
    position,
    status,
    has_custom_permissions
  ) VALUES (
    new_user_id,
    'Utente',
    'Test',
    'tonellomatias@gmail.com',
    'super_admin',
    'general_manager',
    'menton',
    ARRAY['menton', 'lyon'],
    'management',
    'General Manager',
    'active',
    false
  );
END $$;