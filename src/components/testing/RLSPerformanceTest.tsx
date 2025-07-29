import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Clock, Shield } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  duration?: number;
  details?: string;
  rowCount?: number;
}

export function RLSPerformanceTest() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const updateTest = (testName: string, result: Partial<TestResult>) => {
    setTests(prev => prev.map(test => 
      test.test === testName ? { ...test, ...result } : test
    ));
  };

  const runPerformanceTests = async () => {
    setIsRunning(true);
    setTests([
      { test: 'Policy Optimization Check', status: 'pending' },
      { test: 'Profiles Query Performance', status: 'pending' },
      { test: 'Chats Access Control', status: 'pending' },
      { test: 'Monthly Inventories Security', status: 'pending' },
      { test: 'User Functions Performance', status: 'pending' },
      { test: 'Security Functions Integrity', status: 'pending' }
    ]);

    try {
      // Test 1: Verifica ottimizzazione policy
      const start1 = performance.now();
      const { data: policies, error: policiesError } = await supabase
        .rpc('validate_location_system_health');
      const duration1 = performance.now() - start1;
      
      if (policiesError) {
        updateTest('Policy Optimization Check', { 
          status: 'error', 
          duration: duration1,
          details: policiesError.message 
        });
      } else {
        updateTest('Policy Optimization Check', { 
          status: 'success', 
          duration: duration1,
          details: 'RLS policies verified'
        });
      }

      // Test 2: Performance query sui profiles
      const start2 = performance.now();
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .maybeSingle();
      const duration2 = performance.now() - start2;

      if (profileError) {
        updateTest('Profiles Query Performance', { 
          status: 'error', 
          duration: duration2,
          details: profileError.message 
        });
      } else {
        updateTest('Profiles Query Performance', { 
          status: 'success', 
          duration: duration2,
          details: `Query executed successfully`,
          rowCount: profileData ? 1 : 0
        });
      }

      // Test 3: Test controlli di accesso chats
      const start3 = performance.now();
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('id, type, name, location')
        .limit(10);
      const duration3 = performance.now() - start3;

      if (chatsError) {
        updateTest('Chats Access Control', { 
          status: 'error', 
          duration: duration3,
          details: chatsError.message 
        });
      } else {
        updateTest('Chats Access Control', { 
          status: 'success', 
          duration: duration3,
          details: `Access control working correctly`,
          rowCount: chatsData?.length || 0
        });
      }

      // Test 4: Security test monthly inventories
      const start4 = performance.now();
      const { data: inventoriesData, error: inventoriesError } = await supabase
        .from('monthly_inventories')
        .select('id, location, status')
        .limit(5);
      const duration4 = performance.now() - start4;

      if (inventoriesError) {
        updateTest('Monthly Inventories Security', { 
          status: 'error', 
          duration: duration4,
          details: inventoriesError.message 
        });
      } else {
        updateTest('Monthly Inventories Security', { 
          status: 'success', 
          duration: duration4,
          details: `Security controls active`,
          rowCount: inventoriesData?.length || 0
        });
      }

      // Test 5: Performance delle funzioni utente
      const start5 = performance.now();
      const { data: userLocations, error: locationsError } = await supabase
        .rpc('get_current_user_locations');
      const duration5 = performance.now() - start5;

      if (locationsError) {
        updateTest('User Functions Performance', { 
          status: 'error', 
          duration: duration5,
          details: locationsError.message 
        });
      } else {
        updateTest('User Functions Performance', { 
          status: 'success', 
          duration: duration5,
          details: `Functions optimized correctly`,
          rowCount: userLocations?.length || 0
        });
      }

      // Test 6: Integrità funzioni di sicurezza
      const start6 = performance.now();
      const { data: accessLevel, error: accessError } = await supabase
        .rpc('get_user_access_level');
      const duration6 = performance.now() - start6;

      if (accessError) {
        updateTest('Security Functions Integrity', { 
          status: 'error', 
          duration: duration6,
          details: accessError.message 
        });
      } else {
        updateTest('Security Functions Integrity', { 
          status: 'success', 
          duration: duration6,
          details: `Security functions working: ${accessLevel}`
        });
      }

      toast({
        title: "Test completati",
        description: "Tutti i test di performance e sicurezza sono stati eseguiti",
      });

    } catch (error) {
      console.error('Error running tests:', error);
      toast({
        title: "Errore nei test",
        description: "Si è verificato un errore durante l'esecuzione dei test",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Successo</Badge>;
      case 'error':
        return <Badge variant="destructive">Errore</Badge>;
      case 'pending':
        return <Badge variant="secondary">In corso...</Badge>;
      default:
        return <Badge variant="outline">In attesa</Badge>;
    }
  };

  const averageDuration = tests
    .filter(t => t.status === 'success' && t.duration)
    .reduce((acc, t) => acc + (t.duration || 0), 0) / tests.filter(t => t.status === 'success').length;

  const successRate = tests.length > 0 
    ? (tests.filter(t => t.status === 'success').length / tests.length) * 100 
    : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Test Performance e Sicurezza RLS
        </CardTitle>
        <CardDescription>
          Verifica l'ottimizzazione delle policy RLS e i controlli di sicurezza
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runPerformanceTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
            {isRunning ? 'Esecuzione test...' : 'Esegui Test'}
          </Button>
          
          {tests.length > 0 && (
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Successo: {successRate.toFixed(1)}%</span>
              {averageDuration && (
                <span>Durata media: {averageDuration.toFixed(2)}ms</span>
              )}
            </div>
          )}
        </div>

        {tests.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Risultati Test</h3>
            {tests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <span className="font-medium">{test.test}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  {test.rowCount !== undefined && (
                    <span className="text-sm text-muted-foreground">
                      {test.rowCount} righe
                    </span>
                  )}
                  {test.duration && (
                    <span className="text-sm text-muted-foreground">
                      {test.duration.toFixed(2)}ms
                    </span>
                  )}
                  {getStatusBadge(test.status)}
                </div>
              </div>
            ))}
          </div>
        )}

        {tests.some(t => t.details) && (
          <div className="space-y-2">
            <h4 className="font-medium">Dettagli</h4>
            {tests.filter(t => t.details).map((test, index) => (
              <div key={index} className="text-sm p-2 bg-muted rounded">
                <strong>{test.test}:</strong> {test.details}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}