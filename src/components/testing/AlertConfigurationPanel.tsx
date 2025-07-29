import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Mail, 
  Monitor, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Save,
  TestTube,
  Zap,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AlertConfiguration {
  alert_type: string;
  is_enabled: boolean;
  email_enabled: boolean;
  dashboard_enabled: boolean;
  email_address: string | null;
  threshold_settings: any;
}

interface Alert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: string;
  metadata: any;
  is_read: boolean;
  created_at: string;
}

const ALERT_TYPES = {
  'new_function_detected': {
    label: 'Nuova Funzione Rilevata',
    description: 'Notifica quando viene rilevata una nuova funzione da testare',
    icon: TestTube,
    defaultThresholds: {}
  },
  'stress_test_failure': {
    label: 'Test di Stress Fallito',
    description: 'Notifica quando un test di stress fallisce',
    icon: AlertTriangle,
    defaultThresholds: {
      max_error_rate: 10,
      min_success_rate: 90
    }
  },
  'performance_bottleneck': {
    label: 'Bottleneck di Performance',
    description: 'Notifica quando viene rilevato un bottleneck di performance',
    icon: Zap,
    defaultThresholds: {
      max_response_time: 200,
      max_cpu_usage: 80,
      max_memory_usage: 85
    }
  }
};

export function AlertConfigurationPanel() {
  const [configurations, setConfigurations] = useState<AlertConfiguration[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfigurations();
    loadAlerts();
  }, []);

  const loadConfigurations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_user_alert_configurations', {
        target_user_id: user.id
      });

      if (error) throw error;

      // Crea configurazioni di default se non esistono
      const existingTypes = (data || []).map((config: any) => config.alert_type);
      const defaultConfigs: AlertConfiguration[] = [];

      Object.keys(ALERT_TYPES).forEach(alertType => {
        if (!existingTypes.includes(alertType)) {
          defaultConfigs.push({
            alert_type: alertType,
            is_enabled: true,
            email_enabled: false,
            dashboard_enabled: true,
            email_address: user.email || null,
            threshold_settings: ALERT_TYPES[alertType as keyof typeof ALERT_TYPES].defaultThresholds
          });
        }
      });

      setConfigurations([...(data || []), ...defaultConfigs]);
    } catch (error: any) {
      console.error('Error loading configurations:', error);
      toast({
        title: "Errore caricamento configurazioni",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error: any) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async (alertType: string, config: Partial<AlertConfiguration>) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('alert_configurations')
        .upsert({
          user_id: user.id,
          alert_type: alertType,
          ...config
        }, {
          onConflict: 'user_id, alert_type'
        });

      if (error) throw error;

      toast({
        title: "Configurazione salvata",
        description: "Le impostazioni di alert sono state aggiornate con successo"
      });

      await loadConfigurations();
    } catch (error: any) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Errore salvataggio",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
    } catch (error: any) {
      console.error('Error marking alert as read:', error);
    }
  };

  const testAlert = async (alertType: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const alertInfo = ALERT_TYPES[alertType as keyof typeof ALERT_TYPES];
      
      const { error } = await supabase.rpc('create_alert', {
        p_alert_type: alertType,
        p_title: `Test Alert - ${alertInfo.label}`,
        p_message: 'Questo è un alert di test per verificare il funzionamento del sistema di notifiche',
        p_severity: 'medium',
        p_metadata: { test: true, timestamp: new Date().toISOString() },
        p_user_id: user.id
      });

      if (error) throw error;

      toast({
        title: "Alert di test inviato",
        description: "Controlla la dashboard e la tua email per verificare la ricezione"
      });

      await loadAlerts();
    } catch (error: any) {
      console.error('Error sending test alert:', error);
      toast({
        title: "Errore invio test",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return AlertTriangle;
      case 'high': return AlertTriangle;
      case 'medium': return Clock;
      case 'low': return CheckCircle;
      default: return Bell;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Activity className="h-6 w-6 animate-spin mr-2" />
        <span>Caricamento configurazioni alert...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistema di Alert</h2>
          <p className="text-muted-foreground">
            Configura le notifiche per eventi del sistema di test
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Bell className="h-3 w-3 mr-1" />
          {alerts.filter(a => !a.is_read).length} Non letti
        </Badge>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurazione
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Alert Recenti
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          {Object.entries(ALERT_TYPES).map(([alertType, alertInfo]) => {
            const config = configurations.find(c => c.alert_type === alertType);
            const IconComponent = alertInfo.icon;

            return (
              <Card key={alertType}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5" />
                    {alertInfo.label}
                  </CardTitle>
                  <CardDescription>{alertInfo.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id={`${alertType}-enabled`}
                        checked={config?.is_enabled || false}
                        onCheckedChange={(checked) => 
                          saveConfiguration(alertType, { 
                            ...config, 
                            is_enabled: checked 
                          })
                        }
                      />
                      <Label htmlFor={`${alertType}-enabled`}>Attivo</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch 
                        id={`${alertType}-dashboard`}
                        checked={config?.dashboard_enabled || false}
                        onCheckedChange={(checked) => 
                          saveConfiguration(alertType, { 
                            ...config, 
                            dashboard_enabled: checked 
                          })
                        }
                      />
                      <Label htmlFor={`${alertType}-dashboard`}>Dashboard</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch 
                        id={`${alertType}-email`}
                        checked={config?.email_enabled || false}
                        onCheckedChange={(checked) => 
                          saveConfiguration(alertType, { 
                            ...config, 
                            email_enabled: checked 
                          })
                        }
                      />
                      <Label htmlFor={`${alertType}-email`}>Email</Label>
                    </div>
                  </div>

                  {config?.email_enabled && (
                    <div className="space-y-2">
                      <Label htmlFor={`${alertType}-email-address`}>Indirizzo Email</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`${alertType}-email-address`}
                          type="email"
                          placeholder="example@email.com"
                          value={config?.email_address || ''}
                          onChange={(e) => {
                            const updatedConfig = configurations.map(c => 
                              c.alert_type === alertType 
                                ? { ...c, email_address: e.target.value }
                                : c
                            );
                            setConfigurations(updatedConfig);
                          }}
                        />
                        <Button 
                          onClick={() => saveConfiguration(alertType, {
                            ...config,
                            email_address: config?.email_address
                          })}
                          disabled={saving}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Soglie configurate: {Object.keys(config?.threshold_settings || {}).length}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => testAlert(alertType)}
                      disabled={!config?.is_enabled}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Alert
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Nessun alert presente</h3>
                <p className="text-muted-foreground">
                  Gli alert appariranno qui quando vengono generati dal sistema
                </p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => {
              const alertInfo = ALERT_TYPES[alert.alert_type as keyof typeof ALERT_TYPES];
              const SeverityIcon = getSeverityIcon(alert.severity);
              
              return (
                <Card 
                  key={alert.id} 
                  className={`cursor-pointer transition-colors ${
                    !alert.is_read ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => !alert.is_read && markAsRead(alert.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <SeverityIcon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{alert.title}</h4>
                            {!alert.is_read && (
                              <Badge variant="secondary" className="text-xs">
                                Nuovo
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{alertInfo?.label || alert.alert_type}</span>
                            <span>{new Date(alert.created_at).toLocaleString('it-IT')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}