import { supabase } from '@/integrations/supabase/client';

export interface AlertServiceConfig {
  alertType: 'new_function_detected' | 'stress_test_failure' | 'performance_bottleneck';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: any;
  userId?: string;
  locationCode?: string;
}

export class AlertService {
  /**
   * Crea un nuovo alert nel sistema
   */
  static async createAlert(config: AlertServiceConfig): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = config.userId || user?.id;

      if (!targetUserId) {
        throw new Error('User ID is required for alert creation');
      }

      // Crea l'alert nel database
      const { data: alertId, error } = await supabase.rpc('create_alert', {
        p_alert_type: config.alertType,
        p_title: config.title,
        p_message: config.message,
        p_severity: config.severity,
        p_metadata: config.metadata || {},
        p_user_id: targetUserId,
        p_location_code: config.locationCode
      });

      if (error) {
        console.error('Error creating alert:', error);
        throw error;
      }

      console.log('Alert created successfully:', alertId);
      return alertId;

    } catch (error: any) {
      console.error('AlertService.createAlert error:', error);
      throw new Error(`Failed to create alert: ${error.message}`);
    }
  }

  /**
   * Invia un alert via email utilizzando l'edge function
   */
  static async sendEmailAlert(
    email: string, 
    title: string, 
    message: string, 
    severity: string,
    alertType: string,
    metadata?: any
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-alert-email', {
        body: {
          email,
          title,
          message,
          severity,
          alertType,
          metadata
        }
      });

      if (error) {
        console.error('Error sending email alert:', error);
        return false;
      }

      console.log('Email alert sent successfully:', data);
      return data?.success || true;

    } catch (error: any) {
      console.error('AlertService.sendEmailAlert error:', error);
      return false;
    }
  }

  /**
   * Crea e invia un alert completo (database + email se configurato)
   */
  static async triggerAlert(config: AlertServiceConfig): Promise<string | null> {
    try {
      // Crea l'alert nel database
      const alertId = await this.createAlert(config);

      // Verifica se l'utente ha configurato le notifiche email
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = config.userId || user?.id;

      if (targetUserId) {
        const { data: alertConfig, error } = await supabase
          .from('alert_configurations')
          .select('email_enabled, email_address')
          .eq('user_id', targetUserId)
          .eq('alert_type', config.alertType)
          .eq('is_enabled', true)
          .single();

        // Invia email se configurato (ignora errori per non bloccare il flusso)
        if (!error && alertConfig?.email_enabled && alertConfig?.email_address) {
          this.sendEmailAlert(
            alertConfig.email_address,
            config.title,
            config.message,
            config.severity,
            config.alertType,
            config.metadata
          ).catch(emailError => {
            console.warn('Email alert failed but alert was created:', emailError);
          });
        }
      }

      return alertId;

    } catch (error: any) {
      console.error('AlertService.triggerAlert error:', error);
      throw error;
    }
  }

  /**
   * Ottiene tutti gli alert per l'utente corrente
   */
  static async getUserAlerts(limit: number = 50): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];

    } catch (error: any) {
      console.error('AlertService.getUserAlerts error:', error);
      return [];
    }
  }

  /**
   * Marca un alert come letto
   */
  static async markAsRead(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;
      return true;

    } catch (error: any) {
      console.error('AlertService.markAsRead error:', error);
      return false;
    }
  }

  /**
   * Ottiene le configurazioni alert per l'utente corrente
   */
  static async getUserAlertConfigurations(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_user_alert_configurations', {
        target_user_id: user.id
      });

      if (error) throw error;
      return data || [];

    } catch (error: any) {
      console.error('AlertService.getUserAlertConfigurations error:', error);
      return [];
    }
  }

  /**
   * Helper per creare alert di rilevamento nuova funzione
   */
  static async alertNewFunctionDetected(
    functionName: string, 
    filePath: string, 
    metadata?: any
  ): Promise<string | null> {
    return this.triggerAlert({
      alertType: 'new_function_detected',
      title: `Nuova funzione rilevata: ${functionName}`,
      message: `È stata rilevata una nuova funzione "${functionName}" in ${filePath} che richiede test di performance.`,
      severity: 'medium',
      metadata: {
        function_name: functionName,
        file_path: filePath,
        ...metadata
      }
    });
  }

  /**
   * Helper per creare alert di test fallito
   */
  static async alertStressTestFailure(
    testName: string, 
    reason: string, 
    metrics?: any
  ): Promise<string | null> {
    return this.triggerAlert({
      alertType: 'stress_test_failure',
      title: `Test di stress fallito: ${testName}`,
      message: `Il test "${testName}" è fallito. Motivo: ${reason}`,
      severity: 'high',
      metadata: {
        test_name: testName,
        failure_reason: reason,
        metrics
      }
    });
  }

  /**
   * Helper per creare alert di bottleneck di performance
   */
  static async alertPerformanceBottleneck(
    functionName: string, 
    responseTime: number, 
    threshold: number = 200,
    additionalMetrics?: any
  ): Promise<string | null> {
    const severity = responseTime > 500 ? 'critical' : responseTime > 300 ? 'high' : 'medium';
    
    return this.triggerAlert({
      alertType: 'performance_bottleneck',
      title: `Bottleneck rilevato: ${functionName}`,
      message: `La funzione "${functionName}" ha un tempo di risposta di ${responseTime.toFixed(0)}ms (soglia: ${threshold}ms)`,
      severity,
      metadata: {
        function_name: functionName,
        response_time: responseTime,
        threshold,
        performance_ratio: responseTime / threshold,
        ...additionalMetrics
      }
    });
  }
}