-- Add metadata column to user_invitations table
ALTER TABLE public.user_invitations 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;