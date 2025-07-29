-- Tabella per la configurazione degli alert
CREATE TABLE public.alert_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('new_function_detected', 'stress_test_failure', 'performance_bottleneck')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  dashboard_enabled BOOLEAN NOT NULL DEFAULT true,
  email_address TEXT,
  threshold_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, alert_type)
);

-- Tabella per memorizzare gli alert generati
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('new_function_detected', 'stress_test_failure', 'performance_bottleneck')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabella per il tracking delle funzioni rilevate
CREATE TABLE public.detected_functions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  function_signature TEXT,
  detection_method TEXT NOT NULL CHECK (detection_method IN ('ast_parsing', 'regex_matching', 'manual')),
  is_test_ready BOOLEAN NOT NULL DEFAULT false,
  last_detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(function_name, file_path)
);

-- Tabella per lo storico dei test di performance
CREATE TABLE public.performance_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_suite TEXT NOT NULL,
  test_function TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'timeout')) DEFAULT 'running',
  metrics JSONB DEFAULT '{}',
  alerts_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own alert configurations" 
ON public.alert_configurations 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own alerts" 
ON public.alerts 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can create alerts" 
ON public.alerts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own alerts" 
ON public.alerts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view detected functions" 
ON public.detected_functions 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "System can manage detected functions" 
ON public.detected_functions 
FOR ALL 
USING (true);

CREATE POLICY "Authenticated users can view performance test results" 
ON public.performance_test_results 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "System can manage performance test results" 
ON public.performance_test_results 
FOR ALL 
USING (true);

-- Indexes for better performance
CREATE INDEX idx_alerts_user_id_created_at ON public.alerts (user_id, created_at DESC);
CREATE INDEX idx_alerts_alert_type ON public.alerts (alert_type);
CREATE INDEX idx_alert_configurations_user_id ON public.alert_configurations (user_id);
CREATE INDEX idx_detected_functions_name ON public.detected_functions (function_name);
CREATE INDEX idx_performance_test_results_suite ON public.performance_test_results (test_suite, created_at DESC);

-- Functions
CREATE OR REPLACE FUNCTION public.create_alert(
  p_alert_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_severity TEXT DEFAULT 'medium',
  p_metadata JSONB DEFAULT '{}',
  p_user_id UUID DEFAULT NULL,
  p_location_code TEXT DEFAULT NULL
) 
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  alert_id UUID;
  config_record RECORD;
BEGIN
  -- Insert the alert
  INSERT INTO public.alerts (
    alert_type, title, message, severity, metadata, user_id, location_code
  ) VALUES (
    p_alert_type, p_title, p_message, p_severity, p_metadata, p_user_id, p_location_code
  ) RETURNING id INTO alert_id;
  
  -- If user_id is provided, check if email notification should be sent
  IF p_user_id IS NOT NULL THEN
    SELECT * INTO config_record 
    FROM public.alert_configurations 
    WHERE user_id = p_user_id 
    AND alert_type = p_alert_type 
    AND is_enabled = true 
    AND email_enabled = true;
    
    IF FOUND AND config_record.email_address IS NOT NULL THEN
      -- Trigger email notification (this would be handled by an edge function)
      PERFORM pg_notify('alert_email_notification', 
        json_build_object(
          'alert_id', alert_id,
          'email_address', config_record.email_address,
          'title', p_title,
          'message', p_message,
          'severity', p_severity
        )::text
      );
    END IF;
  END IF;
  
  RETURN alert_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_alert_configurations(target_user_id UUID)
RETURNS TABLE(
  alert_type TEXT,
  is_enabled BOOLEAN,
  email_enabled BOOLEAN,
  dashboard_enabled BOOLEAN,
  email_address TEXT,
  threshold_settings JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.alert_type,
    ac.is_enabled,
    ac.email_enabled,
    ac.dashboard_enabled,
    ac.email_address,
    ac.threshold_settings
  FROM public.alert_configurations ac
  WHERE ac.user_id = target_user_id;
END;
$$;

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_alert_configurations_updated_at
  BEFORE UPDATE ON public.alert_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_detected_functions_updated_at
  BEFORE UPDATE ON public.detected_functions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_test_results_updated_at
  BEFORE UPDATE ON public.performance_test_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();