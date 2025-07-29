import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Code, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Play,
  Settings,
  Eye,
  Zap,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DetectedFunction {
  id: string;
  function_name: string;
  file_path: string;
  function_signature: string | null;
  detection_method: string;
  is_test_ready: boolean;
  last_detected_at: string;
  metadata: any;
}

interface PerformanceTestResult {
  id: string;
  test_suite: string;
  test_function: string;
  status: string;
  metrics: any;
  start_time: string;
  end_time: string | null;
  alerts_generated: number;
}

export function FunctionDetectionSystem() {
  const [detectedFunctions, setDetectedFunctions] = useState<DetectedFunction[]>([]);
  const [testResults, setTestResults] = useState<PerformanceTestResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDetectedFunctions();
    loadTestResults();
  }, []);

  const loadDetectedFunctions = async () => {
    try {
      const { data, error } = await supabase
        .from('detected_functions')
        .select('*')
        .order('last_detected_at', { ascending: false });

      if (error) throw error;
      setDetectedFunctions(data || []);
    } catch (error: any) {
      console.error('Error loading detected functions:', error);
      toast({
        title: "Errore caricamento funzioni",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadTestResults = async () => {
    try {
      const { data, error } = await supabase
        .from('performance_test_results')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTestResults(data || []);
    } catch (error: any) {
      console.error('Error loading test results:', error);
    } finally {
      setLoading(false);
    }
  };

  const simulateFunctionDetection = async () => {
    setIsScanning(true);
    setScanProgress(0);

    try {
      // Simula la scansione delle funzioni
      const mockFunctions = [
        {
          function_name: 'validateUserAuth',
          file_path: 'src/auth/validation.ts',
          function_signature: 'validateUserAuth(userId: string, token: string): Promise<boolean>',
          detection_method: 'ast_parsing',
          metadata: {
            complexity: 'medium',
            dependencies: ['jwt', 'bcrypt'],
            estimated_test_time: '45s'
          }
        },
        {
          function_name: 'processPaymentData',
          file_path: 'src/payments/processor.ts',
          function_signature: 'processPaymentData(paymentInfo: PaymentData): Promise<PaymentResult>',
          detection_method: 'ast_parsing',
          metadata: {
            complexity: 'high',
            dependencies: ['stripe', 'validator'],
            estimated_test_time: '120s'
          }
        },
        {
          function_name: 'generateReportChart',
          file_path: 'src/reports/charts.ts',
          function_signature: 'generateReportChart(data: ChartData[]): Chart',
          detection_method: 'regex_matching',
          metadata: {
            complexity: 'low',
            dependencies: ['chartjs'],
            estimated_test_time: '30s'
          }
        }
      ];

      for (let i = 0; i < mockFunctions.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setScanProgress(((i + 1) / mockFunctions.length) * 100);

        const funcData = mockFunctions[i];
        const { error } = await supabase
          .from('detected_functions')
          .upsert({
            function_name: funcData.function_name,
            file_path: funcData.file_path,
            function_signature: funcData.function_signature,
            detection_method: funcData.detection_method,
            is_test_ready: false,
            metadata: funcData.metadata
          }, {
            onConflict: 'function_name, file_path'
          });

        if (error) throw error;

        // Crea alert per nuova funzione rilevata
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.rpc('create_alert', {
            p_alert_type: 'new_function_detected',
            p_title: `Nuova funzione rilevata: ${funcData.function_name}`,
            p_message: `È stata rilevata una nuova funzione in ${funcData.file_path} che richiede test di performance.`,
            p_severity: 'medium',
            p_metadata: {
              function_name: funcData.function_name,
              file_path: funcData.file_path,
              complexity: funcData.metadata.complexity,
              detection_method: funcData.detection_method
            },
            p_user_id: user.id
          });
        }
      }

      toast({
        title: "Scansione completata",
        description: `Rilevate ${mockFunctions.length} nuove funzioni`,
      });

      await loadDetectedFunctions();
    } catch (error: any) {
      console.error('Error during function detection:', error);
      toast({
        title: "Errore scansione",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const runPerformanceTest = async (func: DetectedFunction) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Inserisci record di test
      const { data: testResult, error } = await supabase
        .from('performance_test_results')
        .insert({
          test_suite: 'function_performance',
          test_function: func.function_name,
          status: 'running',
          start_time: new Date().toISOString(),
          metrics: {
            function_name: func.function_name,
            file_path: func.file_path,
            complexity: func.metadata?.complexity || 'unknown'
          }
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Test avviato",
        description: `Test di performance per ${func.function_name} in corso...`,
      });

      // Simula test di performance
      setTimeout(async () => {
        const responseTime = Math.random() * 300 + 50; // 50-350ms
        const isBottleneck = responseTime > 200;
        
        const finalMetrics = {
          function_name: func.function_name,
          file_path: func.file_path,
          complexity: func.metadata?.complexity || 'unknown',
          response_time_avg: responseTime,
          response_time_p95: responseTime * 1.2,
          requests_per_second: Math.floor(1000 / responseTime),
          cpu_usage: Math.random() * 40 + 30,
          memory_usage: Math.random() * 30 + 40,
          is_bottleneck: isBottleneck
        };

        await supabase
          .from('performance_test_results')
          .update({
            status: isBottleneck ? 'failed' : 'completed',
            end_time: new Date().toISOString(),
            metrics: finalMetrics,
            alerts_generated: isBottleneck ? 1 : 0
          })
          .eq('id', testResult.id);

        // Crea alert se è stato rilevato un bottleneck
        if (isBottleneck) {
          await supabase.rpc('create_alert', {
            p_alert_type: 'performance_bottleneck',
            p_title: `Bottleneck rilevato: ${func.function_name}`,
            p_message: `La funzione ${func.function_name} ha un tempo di risposta di ${responseTime.toFixed(0)}ms (soglia: 200ms)`,
            p_severity: responseTime > 300 ? 'high' : 'medium',
            p_metadata: {
              function_name: func.function_name,
              response_time: responseTime,
              threshold: 200,
              test_id: testResult.id
            },
            p_user_id: user.id
          });
        }

        await loadTestResults();
        
        toast({
          title: "Test completato",
          description: isBottleneck 
            ? `Bottleneck rilevato! Tempo di risposta: ${responseTime.toFixed(0)}ms`
            : `Test superato. Tempo di risposta: ${responseTime.toFixed(0)}ms`,
          variant: isBottleneck ? "destructive" : "default"
        });
      }, 3000);

    } catch (error: any) {
      console.error('Error running performance test:', error);
      toast({
        title: "Errore test",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'running': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'failed': 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Caricamento sistema di rilevamento...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Scan Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistema di Rilevamento Funzioni</h2>
          <p className="text-muted-foreground">
            Rileva automaticamente nuove funzioni e monitora le performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={simulateFunctionDetection}
            disabled={isScanning}
            className="flex items-center gap-2"
          >
            {isScanning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {isScanning ? 'Scansione...' : 'Scansiona Codice'}
          </Button>
        </div>
      </div>

      {/* Scan Progress */}
      {isScanning && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Scansione in corso...</span>
                <span className="text-sm text-muted-foreground">{Math.round(scanProgress)}%</span>
              </div>
              <Progress value={scanProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{detectedFunctions.length}</div>
            <div className="text-xs text-muted-foreground">Funzioni Rilevate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {detectedFunctions.filter(f => f.is_test_ready).length}
            </div>
            <div className="text-xs text-muted-foreground">Pronte per Test</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {testResults.filter(r => r.status === 'running').length}
            </div>
            <div className="text-xs text-muted-foreground">Test Attivi</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {testResults.filter(r => r.status === 'failed').length}
            </div>
            <div className="text-xs text-muted-foreground">Bottleneck Rilevati</div>
          </CardContent>
        </Card>
      </div>

      {/* Detected Functions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Funzioni Rilevate
          </CardTitle>
          <CardDescription>
            Funzioni automaticamente rilevate dal sistema di scansione
          </CardDescription>
        </CardHeader>
        <CardContent>
          {detectedFunctions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Nessuna funzione rilevata</h3>
              <p className="text-muted-foreground">
                Avvia una scansione per rilevare funzioni nel codice
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {detectedFunctions.map((func) => (
                <div key={func.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{func.function_name}</h4>
                        <Badge variant="outline">
                          {func.detection_method}
                        </Badge>
                        {func.metadata?.complexity && (
                          <Badge 
                            variant="outline" 
                            className={getComplexityColor(func.metadata.complexity)}
                          >
                            {func.metadata.complexity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {func.file_path}
                      </p>
                      {func.function_signature && (
                        <code className="text-xs bg-muted p-1 rounded">
                          {func.function_signature}
                        </code>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground">
                        Rilevata: {new Date(func.last_detected_at).toLocaleString('it-IT')}
                        {func.metadata?.estimated_test_time && (
                          <span className="ml-4">
                            Tempo stimato test: {func.metadata.estimated_test_time}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => runPerformanceTest(func)}
                        className="flex items-center gap-1"
                      >
                        <Zap className="h-3 w-3" />
                        Test
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Risultati Test Recenti
            </CardTitle>
            <CardDescription>
              Ultimi test di performance eseguiti sulle funzioni
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.slice(0, 10).map((result) => (
                <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="font-medium">{result.test_function}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(result.start_time).toLocaleString('it-IT')}
                        {result.end_time && (
                          <span className="ml-2">
                            - {new Date(result.end_time).toLocaleString('it-IT')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {result.metrics?.response_time_avg && (
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {result.metrics.response_time_avg.toFixed(0)}ms
                        </div>
                        <div className="text-xs text-muted-foreground">Resp. Time</div>
                      </div>
                    )}
                    {result.alerts_generated > 0 && (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        {result.alerts_generated} Alert
                      </Badge>
                    )}
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}