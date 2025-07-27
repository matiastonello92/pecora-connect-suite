-- Enable real-time updates for profiles and user_invitations tables
-- This will ensure immediate UI updates when users are deleted or modified

-- Set replica identity to full for profiles table to capture all changes
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Set replica identity to full for user_invitations table to capture all changes  
ALTER TABLE public.user_invitations REPLICA IDENTITY FULL;

-- Add profiles table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Add user_invitations table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_invitations;