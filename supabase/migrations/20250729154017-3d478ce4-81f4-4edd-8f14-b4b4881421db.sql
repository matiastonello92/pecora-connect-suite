-- Create table for storing app analysis history
CREATE TABLE public.app_analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  version TEXT NOT NULL,
  data JSONB NOT NULL,
  summary JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_analysis_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view analysis history" 
ON public.app_analysis_history 
FOR SELECT 
USING (true);

CREATE POLICY "System can create analysis records" 
ON public.app_analysis_history 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_app_analysis_timestamp ON public.app_analysis_history(timestamp DESC);
CREATE INDEX idx_app_analysis_version ON public.app_analysis_history(version);