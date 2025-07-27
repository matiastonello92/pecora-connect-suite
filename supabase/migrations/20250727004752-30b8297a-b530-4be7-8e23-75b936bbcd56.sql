-- Create archived_users table for maintaining records of deleted/archived users
CREATE TABLE public.archived_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_user_id UUID,
  original_invitation_id UUID,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT NOT NULL,
  department TEXT,
  position TEXT,
  previous_status TEXT NOT NULL, -- 'active' or 'pending'
  archived_by UUID REFERENCES auth.users(id),
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT DEFAULT 'manual_deletion',
  metadata JSONB DEFAULT '{}'::jsonb,
  can_reactivate BOOLEAN DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.archived_users ENABLE ROW LEVEL SECURITY;

-- Create policies for archived_users
CREATE POLICY "Admins can view archived users" 
ON public.archived_users 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['manager'::text, 'super_admin'::text]));

CREATE POLICY "Admins can create archived user records" 
ON public.archived_users 
FOR INSERT 
WITH CHECK (get_current_user_role() = ANY (ARRAY['manager'::text, 'super_admin'::text]));

CREATE POLICY "Admins can update archived users" 
ON public.archived_users 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['manager'::text, 'super_admin'::text]));

-- Create index for better performance
CREATE INDEX idx_archived_users_archived_at ON public.archived_users(archived_at DESC);
CREATE INDEX idx_archived_users_location ON public.archived_users(location);

-- Add archived_users to realtime publication
ALTER TABLE public.archived_users REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.archived_users;