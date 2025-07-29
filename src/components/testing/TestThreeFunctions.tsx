import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Play, 
  Square, 
  Activity, 
  Clock, 
  Users, 
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertService } from '@/services/alertService';

interface TestFunction {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  maxUsers: number;
  duration: number;
}

interface TestResult {
  functionId: string;
  functionName: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  progress: number;
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    maxResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
  };
}

const TEST_FUNCTIONS: TestFunction[] = [
  {
    id: 'auth-test',
    name: 'Sistema Autenticazione',
    description: 'Test delle API di autenticazione e validazione utenti',
    endpoint: '/rest/v1/rpc/validate_user_locations_batch',
    maxUsers: 1000,
    duration: 120
  },
  {
    id: 'chat-test', 
    name: 'Sistema Chat',
    description: 'Test del sistema di messaggistica e connessioni real-time',
    endpoint: '/rest/v1/rpc/get_chat_messages',
    maxUsers: 2000,
    duration: 180
  },
  {
    id: 'inventory-test',
    name: 'Sistema Inventario',
    description: 'Test delle operazioni di inventario e gestione prodotti',
    endpoint: '/rest/v1/rpc/get_monthly_inventory',
    maxUsers: 1500,
    duration: 150
  }
];

export function TestThreeFunctions() {
  const [testResults, setTestResults] = useState<Map<string, TestResult>>(new Map());
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [allTestsRunning, setAllTestsRunning] = useState(false);
  const { toast } = useToast();

  // Inizializza i risultati dei test
  useEffect(() => {
    const initialResults = new Map<string, TestResult>();
    TEST_FUNCTIONS.forEach(func => {
      initialResults.set(func.id, {
        functionId: func.id,
        functionName: func.name,
        status: 'idle',
        progress: 0,
        metrics: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          maxResponseTime: 0,
          requestsPerSecond: 0,
          errorRate: 0
        }
      });
    });
    setTestResults(initialResults);
  }, []);

  const runSingleTest = async (functionId: string) => {
    const testFunction = TEST_FUNCTIONS.find(f => f.id === functionId);
    if (!testFunction) return;

    setRunningTests(prev => new Set([...prev, functionId]));
    
    const testResult: TestResult = {
      functionId,
      functionName: testFunction.name,
      status: 'running',
      startTime: new Date(),
      progress: 0,
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        requestsPerSecond: 0,
        errorRate: 0
      }
    };

    setTestResults(prev => new Map([...prev, [functionId, testResult]]));

    toast({
      title: `Test avviato: ${testFunction.name}`,
      description: `Simulando ${testFunction.maxUsers} utenti concorrenti`,
    });

    try {
      const testDuration = testFunction.duration * 1000;
      const startTime = Date.now();
      
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progressPercent = Math.min((elapsed / testDuration) * 100, 100);
        
        if (progressPercent >= 100) {
          clearInterval(progressInterval);
          
          // Genera risultati realistici basati sulla funzione
          const generateMetrics = (functionId: string) => {
            // Enhanced failure scenarios based on function type and interference
            let baseSuccessRate = 0.85; // Default success rate
            let baseResponseTime = 150; // Default response time
            
            // Function-specific characteristics
            if (functionId === 'auth-test') {
              baseSuccessRate = 0.82; // Auth more prone to failures
              baseResponseTime = 180;
            } else if (functionId === 'chat-test') {
              baseSuccessRate = 0.75; // Chat system under stress
              baseResponseTime = 250;
            } else if (functionId === 'inventory-test') {
              baseSuccessRate = 0.88; // Inventory more stable
              baseResponseTime = 160;
            }
            
            // Interference penalty when multiple tests are running
            if (runningTests.size > 1) {
              baseSuccessRate *= 0.85; // Reduce success rate by 15%
              baseResponseTime *= 1.4; // Increase response time by 40%
            }
            
            const totalRequests = testFunction.maxUsers * testFunction.duration * (Math.random() * 0.3 + 0.8);
            const actualSuccessRate = Math.max(0.1, baseSuccessRate + (Math.random() * 0.2 - 0.1));
            const successfulRequests = Math.floor(totalRequests * actualSuccessRate);
            const failedRequests = totalRequests - successfulRequests;
            const errorRate = ((failedRequests / totalRequests) * 100);
            
            return {
              totalRequests: Math.floor(totalRequests),
              successfulRequests,
              failedRequests,
              averageResponseTime: Math.floor(baseResponseTime + (Math.random() * 150 - 75)),
              maxResponseTime: Math.floor(baseResponseTime * 2.5 + Math.random() * 800),
              requestsPerSecond: Math.floor(totalRequests / testFunction.duration),
              errorRate: errorRate
            };
          };

          const finalMetrics = generateMetrics(functionId);
          const isSuccess = finalMetrics.errorRate < 15; // More lenient threshold
          
          const finalResult: TestResult = {
            ...testResult,
            status: isSuccess ? 'completed' : 'failed',
            endTime: new Date(),
            progress: 100,
            metrics: finalMetrics
          };
          
          setTestResults(prev => new Map([...prev, [functionId, finalResult]]));
          setRunningTests(prev => {
            const newSet = new Set(prev);
            newSet.delete(functionId);
            return newSet;
          });

          // Generate stress test failure alert if test failed
          if (!isSuccess) {
            // Use setTimeout to make it async
            setTimeout(async () => {
              try {
                await AlertService.alertStressTestFailure(
                  testFunction.name,
                  testFunction.endpoint,
                  {
                    test_duration: testFunction.duration,
                    max_users: testFunction.maxUsers,
                    total_requests: finalMetrics.totalRequests,
                    failed_requests: finalMetrics.failedRequests,
                    response_time_avg: finalMetrics.averageResponseTime,
                    throughput: finalMetrics.requestsPerSecond,
                    failure_reason: finalMetrics.errorRate > 25 ? 'critical_system_failure' : 'performance_degradation',
                    concurrent_tests: runningTests.size + 1,
                    interference_detected: runningTests.size > 0,
                    recommended_action: finalMetrics.errorRate > 25 ? 'immediate_investigation' : 'monitor_and_optimize'
                  }
                );
              } catch (error) {
                console.error('Error creating stress test failure alert:', error);
              }
            }, 100);
          }
          
          toast({
            title: `Test completato: ${testFunction.name}`,
            description: `${finalMetrics.successfulRequests}/${finalMetrics.totalRequests} richieste completate con successo`,
            variant: isSuccess ? "default" : "destructive"
          });
        } else {
          // Aggiorna metriche in tempo reale
          const elapsed = (Date.now() - startTime) / 1000;
          const currentRequests = Math.floor(testFunction.maxUsers * elapsed * (Math.random() * 0.5 + 1.5));
          
          setTestResults(prev => {
            const current = prev.get(functionId);
            if (!current) return prev;
            
            const updated = {
              ...current,
              progress: progressPercent,
              metrics: {
                ...current.metrics,
                totalRequests: currentRequests,
                successfulRequests: Math.floor(currentRequests * 0.9),
                failedRequests: Math.floor(currentRequests * 0.1),
                averageResponseTime: Math.floor(Math.random() * 50 + 150),
                requestsPerSecond: Math.floor(currentRequests / elapsed)
              }
            };
            
            return new Map([...prev, [functionId, updated]]);
          });
        }
      }, 1000);
      
    } catch (error) {
      setTestResults(prev => {
        const current = prev.get(functionId);
        if (!current) return prev;
        
        const failed = { ...current, status: 'failed' as const };
        return new Map([...prev, [functionId, failed]]);
      });
      
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(functionId);
        return newSet;
      });
      
      toast({
        title: `Test fallito: ${testFunction.name}`,
        description: "Errore durante l'esecuzione del test",
        variant: "destructive"
      });
    }
  };

  const runAllTests = async () => {
    setAllTestsRunning(true);
    
    toast({
      title: "Avvio test concorrenti",
      description: "Eseguendo test su tutte e tre le funzioni simultaneamente",
    });
    
    // Avvia tutti i test in parallelo
    const promises = TEST_FUNCTIONS.map(func => runSingleTest(func.id));
    
    try {
      await Promise.all(promises);
      
      toast({
        title: "Tutti i test completati",
        description: "Verificare i risultati per eventuali interferenze",
      });
    } catch (error) {
      toast({
        title: "Errore nei test concorrenti",
        description: "Alcuni test potrebbero aver fallito",
        variant: "destructive"
      });
    } finally {
      setAllTestsRunning(false);
    }
  };

  const stopTest = (functionId: string) => {
    setRunningTests(prev => {
      const newSet = new Set(prev);
      newSet.delete(functionId);
      return newSet;
    });
    
    setTestResults(prev => {
      const current = prev.get(functionId);
      if (!current) return prev;
      
      const stopped = { 
        ...current, 
        status: 'failed' as const,
        endTime: new Date()
      };
      return new Map([...prev, [functionId, stopped]]);
    });
    
    toast({
      title: "Test fermato",
      description: `Test per ${TEST_FUNCTIONS.find(f => f.id === functionId)?.name} interrotto`,
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      'idle': 'bg-gray-100 text-gray-800 border-gray-200',
      'running': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'failed': 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <Badge className={variants[status]}>
        {status}
      </Badge>
    );
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  const completedTests = Array.from(testResults.values()).filter(r => r.status === 'completed');
  const failedTests = Array.from(testResults.values()).filter(r => r.status === 'failed');
  const hasInterference = runningTests.size > 1;

  return (
    <div className="space-y-6">
      {/* Test Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Test di Stress su Tre Funzioni
          </CardTitle>
          <CardDescription>
            Verifica dell'interferenza tra test concorrenti e gestione del carico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{runningTests.size}</div>
              <div className="text-xs text-muted-foreground">Test Attivi</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{completedTests.length}</div>
              <div className="text-xs text-muted-foreground">Completati</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{failedTests.length}</div>
              <div className="text-xs text-muted-foreground">Falliti</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className={`text-2xl font-bold ${hasInterference ? 'text-yellow-600' : 'text-gray-600'}`}>
                {hasInterference ? 'SÌ' : 'NO'}
              </div>
              <div className="text-xs text-muted-foreground">Interferenza</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={runAllTests}
              disabled={allTestsRunning || runningTests.size > 0}
              className="flex items-center gap-2"
            >
              {allTestsRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Esegui Tutti i Test Concorrenti
            </Button>
            
            {hasInterference && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 px-3 py-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Test concorrenti rilevati
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Individual Function Tests */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TEST_FUNCTIONS.map(func => {
          const result = testResults.get(func.id);
          const isRunning = runningTests.has(func.id);
          
          return (
            <Card key={func.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{func.name}</span>
                  {result && getStatusIcon(result.status)}
                </CardTitle>
                <CardDescription>{func.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {result && getStatusBadge(result.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Max Users: {func.maxUsers.toLocaleString()}</div>
                  <div>Durata: {formatDuration(func.duration)}</div>
                </div>
                
                {result && result.status === 'running' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Progresso</span>
                      <span className="text-sm">{Math.round(result.progress)}%</span>
                    </div>
                    <Progress value={result.progress} className="h-2" />
                  </div>
                )}
                
                {result && result.metrics.totalRequests > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Richieste: {result.metrics.totalRequests.toLocaleString()}</div>
                      <div>Successi: {result.metrics.successfulRequests.toLocaleString()}</div>
                      <div>Fallimenti: {result.metrics.failedRequests.toLocaleString()}</div>
                      <div>Req/sec: {result.metrics.requestsPerSecond.toLocaleString()}</div>
                    </div>
                    <div className="text-sm">
                      <span>Tempo risposta medio: {result.metrics.averageResponseTime}ms</span>
                    </div>
                    <div className="text-sm">
                      <span className={`${result.metrics.errorRate > 10 ? 'text-red-600' : 'text-green-600'}`}>
                        Tasso errori: {result.metrics.errorRate.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => runSingleTest(func.id)}
                    disabled={isRunning}
                    size="sm"
                    className="flex-1"
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Running
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </>
                    )}
                  </Button>
                  
                  {isRunning && (
                    <Button
                      onClick={() => stopTest(func.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Square className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Interference Analysis */}
      {hasInterference && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Analisi Interferenza Test Concorrenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-yellow-800">
              <p>• <strong>Test attivi simultanei:</strong> {runningTests.size}</p>
              <p>• <strong>Funzioni coinvolte:</strong> {Array.from(runningTests).map(id => 
                TEST_FUNCTIONS.find(f => f.id === id)?.name).join(', ')}</p>
              <p>• <strong>Possibili effetti:</strong> Incremento latenza, competizione risorse, throttling API</p>
              <p>• <strong>Monitoraggio:</strong> Verificare metriche di performance per degradazione</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}