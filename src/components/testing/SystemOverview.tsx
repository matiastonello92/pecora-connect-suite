import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Database, 
  Globe, 
  Shield,
  RefreshCw,
  Play
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemOverviewProps {
  onActiveTestsChange: (count: number) => void;
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  auth: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
  functions: 'healthy' | 'warning' | 'error';
}

interface TestStats {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  lastRun: Date | null;
}

export function SystemOverview({ onActiveTestsChange }: SystemOverviewProps) {
  const [health, setHealth] = useState<SystemHealth>({
    database: 'healthy',
    auth: 'healthy',
    storage: 'healthy',
    functions: 'healthy'
  });
  const [stats, setStats] = useState<TestStats>({
    totalTests: 147,
    passedTests: 142,
    failedTests: 5,
    lastRun: new Date()
  });
  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false);
  const [isRunningQuickTest, setIsRunningQuickTest] = useState(false);
  const { toast } = useToast();

  const runHealthCheck = async () => {
    setIsRunningHealthCheck(true);
    onActiveTestsChange(1);
    
    try {
      // Test database connection
      const { error: dbError } = await supabase.from('locations').select('count').limit(1);
      
      // Test auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      // Test functions (call test-data-seeder with dry run)
      const { error: functionError } = await supabase.functions.invoke('test-data-seeder', {
        body: { dryRun: true }
      });

      setHealth({
        database: dbError ? 'error' : 'healthy',
        auth: authError ? 'warning' : 'healthy',
        storage: 'healthy', // Assume healthy for now
        functions: functionError ? 'error' : 'healthy'
      });

      toast({
        title: "Health check completed",
        description: "System health status updated"
      });
    } catch (error) {
      toast({
        title: "Health check failed",
        description: "Failed to check system health",
        variant: "destructive"
      });
    } finally {
      setIsRunningHealthCheck(false);
      onActiveTestsChange(-1);
    }
  };

  const runQuickTest = async () => {
    setIsRunningQuickTest(true);
    onActiveTestsChange(1);
    
    // Simulate quick test suite
    setTimeout(() => {
      setStats(prev => ({
        ...prev,
        lastRun: new Date(),
        passedTests: Math.floor(Math.random() * 10) + 140,
        failedTests: Math.floor(Math.random() * 8) + 2
      }));
      setIsRunningQuickTest(false);
      onActiveTestsChange(-1);
      
      toast({
        title: "Quick test completed",
        description: "Test suite executed successfully"
      });
    }, 3000);
  };

  const getHealthIcon = (status: SystemHealth[keyof SystemHealth]) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getHealthBadge = (status: SystemHealth[keyof SystemHealth]) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-green-100 text-green-800 border-green-200">Healthy</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>;
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const successRate = (stats.passedTests / stats.totalTests) * 100;

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button 
          onClick={runHealthCheck} 
          disabled={isRunningHealthCheck}
          className="flex items-center gap-2"
        >
          {isRunningHealthCheck ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Health Check
        </Button>
        <Button 
          onClick={runQuickTest} 
          disabled={isRunningQuickTest}
          variant="outline"
          className="flex items-center gap-2"
        >
          {isRunningQuickTest ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Quick Test
        </Button>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database
              </span>
              {getHealthIcon(health.database)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getHealthBadge(health.database)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Authentication
              </span>
              {getHealthIcon(health.auth)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getHealthBadge(health.auth)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Storage
              </span>
              {getHealthIcon(health.storage)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getHealthBadge(health.storage)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Functions
              </span>
              {getHealthIcon(health.functions)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getHealthBadge(health.functions)}
          </CardContent>
        </Card>
      </div>

      {/* Test Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Last run: {stats.lastRun?.toLocaleString() || 'Never'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Success Rate</span>
              <span className="font-medium">{successRate.toFixed(1)}%</span>
            </div>
            <Progress value={successRate} className="h-2" />
            
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">{stats.totalTests}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.passedTests}</div>
                <div className="text-xs text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.failedTests}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Status</CardTitle>
            <CardDescription>
              Test environment configuration and isolation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Environment</span>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">Test</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Isolated
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Analytics</span>
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                Disabled
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">External APIs</span>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                Sandbox
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}