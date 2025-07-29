-- Create location_dashboard_configs table
CREATE TABLE public.location_dashboard_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id TEXT NOT NULL,
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  layout JSONB NOT NULL DEFAULT '{}'::jsonb,
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(location_id)
);

-- Enable Row Level Security
ALTER TABLE public.location_dashboard_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for location_dashboard_configs
CREATE POLICY "Users can view dashboard configs for their locations"
ON public.location_dashboard_configs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.status = 'active'
    AND location_dashboard_configs.location_id = ANY(p.locations)
  )
);

CREATE POLICY "Users can create dashboard configs for their locations"
ON public.location_dashboard_configs
FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.status = 'active'
    AND location_dashboard_configs.location_id = ANY(p.locations)
  )
);

CREATE POLICY "Users can update dashboard configs for their locations"
ON public.location_dashboard_configs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.status = 'active'
    AND location_dashboard_configs.location_id = ANY(p.locations)
  )
);

CREATE POLICY "Managers can manage all dashboard configs"
ON public.location_dashboard_configs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = ANY(ARRAY['manager', 'super_admin'])
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_dashboard_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dashboard_configs_updated_at
BEFORE UPDATE ON public.location_dashboard_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_dashboard_config_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_location_dashboard_configs_location_id ON public.location_dashboard_configs(location_id);
CREATE INDEX idx_location_dashboard_configs_created_by ON public.location_dashboard_configs(created_by);