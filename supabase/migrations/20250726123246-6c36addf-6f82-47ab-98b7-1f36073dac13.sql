-- Enable RLS by default
ALTER DATABASE postgres SET row_level_security = on;

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'manager', 'base')),
  location TEXT NOT NULL CHECK (location IN ('menton', 'lyon', 'no_specific_location')),
  department TEXT,
  position TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user invitations table
CREATE TABLE public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'manager', 'base')),
  location TEXT NOT NULL CHECK (location IN ('menton', 'lyon', 'no_specific_location')),
  invitation_token UUID DEFAULT gen_random_uuid(),
  invited_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on invitations
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'manager')
  )
);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can create profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'manager')
  )
);

-- RLS Policies for invitations
CREATE POLICY "Admins can view all invitations" 
ON public.user_invitations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'manager')
  )
);

CREATE POLICY "Admins can create invitations" 
ON public.user_invitations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'manager')
  )
);

CREATE POLICY "Admins can update invitations" 
ON public.user_invitations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'manager')
  )
);

-- Function to handle new user registration from invitation
CREATE OR REPLACE FUNCTION public.handle_new_user_from_invitation()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  invitation_record public.user_invitations;
BEGIN
  -- Find the invitation by email
  SELECT * INTO invitation_record 
  FROM public.user_invitations 
  WHERE email = NEW.email 
  AND status = 'pending' 
  AND expires_at > now()
  LIMIT 1;

  -- If invitation exists, create profile and mark invitation as completed
  IF invitation_record.id IS NOT NULL THEN
    INSERT INTO public.profiles (
      user_id, 
      first_name, 
      last_name, 
      role, 
      location,
      department,
      position
    ) VALUES (
      NEW.id,
      invitation_record.first_name,
      invitation_record.last_name,
      invitation_record.role,
      invitation_record.location,
      invitation_record.location, -- Use location as department for now
      'Staff' -- Default position
    );

    -- Mark invitation as completed
    UPDATE public.user_invitations 
    SET status = 'completed', completed_at = now()
    WHERE id = invitation_record.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to automatically create profile from invitation
CREATE TRIGGER on_auth_user_created_from_invitation
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_invitation();

-- Function to expire old invitations
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.user_invitations 
  SET status = 'expired' 
  WHERE status = 'pending' 
  AND expires_at < now();
$$;