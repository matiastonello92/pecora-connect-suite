import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Code,
  Activity,
  TestTube
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertService } from '@/services/alertService';

export function TestingSimulator() {
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const simulateNewFunctionDetection = async () => {
    setIsRunning(true);
    try {
      // Simulate detecting critical payment function
      await AlertService.alertNewFunctionDetected(
        'validateCreditCardPayment',
        'src/payments/creditcard.ts',
        {
          function_signature: 'validateCreditCardPayment(cardData: CardData, amount: number): Promise<PaymentResult>',
          detection_method: 'AST_ANALYSIS',
          dependencies: ['stripe', 'luhn-algorithm', 'pci-validator'],
          security_level: 'critical',
          estimated_complexity: 'high',
          requires_pci_compliance: true,
          estimated_test_time: '240s',
          risk_factors: ['handles_sensitive_data', 'financial_transaction', 'external_api_dependency']
        }
      );

      toast({
        title: "✅ Simulazione Rilevamento Funzione",
        description: "Alert 'Nuova Funzione' generato per validateCreditCardPayment"
      });
    } catch (error) {
      console.error('Error simulating function detection:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const simulatePerformanceBottleneck = async () => {
    setIsRunning(true);
    try {
      // Simulate critical performance issue
      await AlertService.alertPerformanceBottleneck(
        'generateMonthlyReport',
        'src/reports/monthly.ts',
        2850,
        {
          complexity: 'high',
          threshold_exceeded: '1325%',
          memory_usage_mb: 450,
          cpu_usage_percent: 95,
          database_queries: 847,
          cache_miss_rate: 78,
          concurrent_executions: 23,
          affected_users: 156,
          business_impact: 'severe',
          suspected_causes: ['n+1_queries', 'missing_indexes', 'memory_leak', 'inefficient_algorithms'],
          recommended_actions: ['immediate_optimization', 'add_caching', 'query_optimization', 'pagination']
        }
      );

      toast({
        title: "🔥 Simulazione Bottleneck Critico",
        description: "Alert 'Performance Bottleneck' generato per generateMonthlyReport"
      });
    } catch (error) {
      console.error('Error simulating performance bottleneck:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const simulateStressTestFailure = async () => {
    setIsRunning(true);
    try {
      // Simulate catastrophic test failure
      await AlertService.alertStressTestFailure(
        'Real-time Chat System',
        '/websocket/chat/messages',
        {
          test_duration: 300,
          max_users: 2500,
          total_requests: 89650,
          failed_requests: 40982,
          avg_response_time: 8500,
          max_response_time: 45000,
          timeout_count: 15670,
          connection_drops: 8945,
          memory_leaks_detected: 12,
          cpu_spikes: 67,
          database_deadlocks: 23,
          failure_cascade: true,
          affected_features: ['message_delivery', 'user_presence', 'file_upload', 'notifications'],
          system_recovery_time: '12 minutes',
          business_impact: 'critical',
          recommended_actions: ['emergency_scaling', 'hotfix_deployment', 'service_isolation', 'incident_response']
        }
      );

      toast({
        title: "💥 Simulazione Fallimento Critico",
        description: "Alert 'Stress Test Failure' generato per sistema chat real-time"
      });
    } catch (error) {
      console.error('Error simulating stress test failure:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runComprehensiveSimulation = async () => {
    setIsRunning(true);
    toast({
      title: "🎯 Avvio Simulazione Completa",
      description: "Generando scenari realistici per tutti i tipi di alert..."
    });

    try {
      // Sequence of events simulating a real production incident
      await simulateNewFunctionDetection();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await simulatePerformanceBottleneck();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await simulateStressTestFailure();

      toast({
        title: "✅ Simulazione Completa Terminata",
        description: "Tutti gli scenari di test sono stati generati. Controlla dashboard ed email!"
      });
    } catch (error) {
      console.error('Error in comprehensive simulation:', error);
      toast({
        title: "Errore Simulazione",
        description: "Alcuni scenari potrebbero non essere stati completati",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Simulatore di Test Realistici</h2>
          <p className="text-muted-foreground">
            Genera scenari realistici per testare il sistema di alert
          </p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <TestTube className="h-3 w-3 mr-1" />
          Piano di Test Implementato
        </Badge>
      </div>

      <Tabs defaultValue="scenarios" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scenarios">Scenari Individuali</TabsTrigger>
          <TabsTrigger value="comprehensive">Test Completo</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-500" />
                  Nuova Funzione Critica
                </CardTitle>
                <CardDescription>
                  Simula il rilevamento di una funzione di pagamento critica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm space-y-1">
                    <div><strong>Funzione:</strong> validateCreditCardPayment</div>
                    <div><strong>Rischio:</strong> Alto (PCI Compliance)</div>
                    <div><strong>Dipendenze:</strong> Stripe, Algoritmi crittografici</div>
                  </div>
                  <Button 
                    onClick={simulateNewFunctionDetection}
                    disabled={isRunning}
                    className="w-full"
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Simula Rilevamento
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Bottleneck Critico
                </CardTitle>
                <CardDescription>
                  Simula un grave problema di performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm space-y-1">
                    <div><strong>Funzione:</strong> generateMonthlyReport</div>
                    <div><strong>Tempo:</strong> 2.85s (soglia: 200ms)</div>
                    <div><strong>Impatto:</strong> 156 utenti affetti</div>
                  </div>
                  <Button 
                    onClick={simulatePerformanceBottleneck}
                    disabled={isRunning}
                    className="w-full"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Simula Bottleneck
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Fallimento Catastrofico
                </CardTitle>
                <CardDescription>
                  Simula il collasso del sistema chat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm space-y-1">
                    <div><strong>Sistema:</strong> Chat Real-time</div>
                    <div><strong>Errori:</strong> 45.7% (40,982 falliti)</div>
                    <div><strong>Impatto:</strong> Servizio degradato</div>
                  </div>
                  <Button 
                    onClick={simulateStressTestFailure}
                    disabled={isRunning}
                    className="w-full"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Simula Fallimento
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comprehensive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Simulazione Completa del Piano di Test
              </CardTitle>
              <CardDescription>
                Esegue una sequenza realistica di eventi che simulano un incidente in produzione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Scenario: Incidente di Produzione Simulato</h4>
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span><strong>T+0s:</strong> Rilevamento nuova funzione critica di pagamento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span><strong>T+2s:</strong> Bottleneck critico nel sistema di report</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span><strong>T+4s:</strong> Fallimento catastrofico del sistema chat</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Verifica Contenuti Alert:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                  <li>• Email HTML con styling appropriato per severità</li>
                  <li>• Metadata dettagliati per debugging</li>
                  <li>• Link diretti alla dashboard di test</li>
                  <li>• Informazioni actionable per il team</li>
                  <li>• Severity dinamica basata sui valori</li>
                </ul>
              </div>

              <Button 
                onClick={runComprehensiveSimulation}
                disabled={isRunning}
                size="lg"
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Simulazione in corso...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Avvia Simulazione Completa
                  </>
                )}
              </Button>

              {isRunning && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Activity className="h-4 w-4 animate-spin" />
                    <span className="text-sm">
                      Generando scenari realistici... Controlla la tab "Alert Recenti" per vedere i risultati
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}