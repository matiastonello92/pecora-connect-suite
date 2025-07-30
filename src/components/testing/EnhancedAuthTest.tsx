/**
 * Enhanced Auth System Test Component
 * Tests advanced session management, role-based caching, and permission optimizations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, Users, Shield, Zap } from 'lucide-react';
import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';
import { useEnhancedPermissions } from '@/providers/EnhancedPermissionProvider';
import { AppModule } from '@/types/users';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  duration?: number;
  result?: any;
  error?: string;
}

interface PerformanceMetrics {
  sessionValidation: number;
  permissionLookups: number;
  cacheHitRate: number;
  memoryUsage: number;
  sessionRefreshTime: number;
}

export const EnhancedAuthTest: React.FC = () => {
  const auth = useEnhancedAuth();
  const permissions = useEnhancedPermissions();
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    sessionValidation: 0,
    permissionLookups: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    sessionRefreshTime: 0
  });
  const [isRunning, setIsRunning] = useState(false);
  const [simulatedUsers, setSimulatedUsers] = useState(1000);

  const modules: AppModule[] = [
    'chat', 'inventory_sala', 'inventory_kitchen', 'checklists',
    'suppliers', 'equipment', 'financial', 'cash_closure',
    'reports', 'tasks', 'communication', 'announcements', 'user_management'
  ];

  const permissionTypes = ['can_read', 'can_write', 'can_validate', 'can_delete'] as const;

  const updateTestResult = (name: string, status: TestResult['status'], duration?: number, result?: any, error?: string) => {
    setTestResults(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { ...t, status, duration, result, error } : t);
      }
      return [...prev, { name, status, duration, result, error }];
    });
  };

  const runSessionManagementTest = async () => {
    updateTestResult('Session Management', 'running');
    const startTime = performance.now();

    try {
      // Test session health check
      const isHealthy = auth.checkSessionHealth();
      
      // Test session metrics
      const metrics = auth.getSessionMetrics();
      
      // Test session refresh (if applicable)
      let refreshResult = true;
      if (auth.isAuthenticated) {
        refreshResult = await auth.refreshSession();
      }

      const duration = performance.now() - startTime;
      
      updateTestResult('Session Management', 'success', duration, {
        isHealthy,
        metrics,
        refreshSuccess: refreshResult
      });

      // Update performance metrics
      setPerformanceMetrics(prev => ({
        ...prev,
        sessionValidation: duration,
        sessionRefreshTime: duration
      }));

    } catch (error) {
      const duration = performance.now() - startTime;
      updateTestResult('Session Management', 'error', duration, null, error.message);
    }
  };

  const runPermissionCacheTest = async () => {
    updateTestResult('Permission Cache', 'running');
    const startTime = performance.now();

    try {
      // Test individual permission checks
      const readPermissions = modules.map(module => 
        permissions.hasPermission(module, 'can_read')
      );

      // Test batch permission checks
      const batchChecks = modules.flatMap(module => 
        permissionTypes.map(perm => ({ module, permission: perm }))
      );
      
      const batchResults = await permissions.batchCheckPermissions(batchChecks);

      // Test cache stats
      const cacheStats = permissions.getCacheStats();

      const duration = performance.now() - startTime;
      
      updateTestResult('Permission Cache', 'success', duration, {
        readPermissions,
        batchResults: batchResults.slice(0, 10), // Show first 10
        cacheStats
      });

      // Update performance metrics
      setPerformanceMetrics(prev => ({
        ...prev,
        permissionLookups: duration,
        cacheHitRate: cacheStats.hitRate * 100,
        memoryUsage: cacheStats.memoryUsage
      }));

    } catch (error) {
      const duration = performance.now() - startTime;
      updateTestResult('Permission Cache', 'error', duration, null, error.message);
    }
  };

  const runScalabilityTest = async () => {
    updateTestResult('Scalability Test', 'running');
    const startTime = performance.now();

    try {
      const iterations = Math.min(simulatedUsers, 10000); // Cap for browser testing
      const batchSize = 100;
      const totalBatches = Math.ceil(iterations / batchSize);
      let completedOperations = 0;

      for (let batch = 0; batch < totalBatches; batch++) {
        const batchPromises = [];
        
        for (let i = 0; i < batchSize && completedOperations < iterations; i++) {
          // Simulate permission checks for different users
          const randomModule = modules[Math.floor(Math.random() * modules.length)];
          const randomPerm = permissionTypes[Math.floor(Math.random() * permissionTypes.length)];
          
          batchPromises.push(
            Promise.resolve(permissions.hasPermission(randomModule, randomPerm))
          );
          completedOperations++;
        }

        await Promise.all(batchPromises);
        
        // Update progress
        const progress = (completedOperations / iterations) * 100;
        updateTestResult('Scalability Test', 'running', undefined, { progress });
      }

      const duration = performance.now() - startTime;
      const operationsPerSecond = (iterations / duration) * 1000;
      
      updateTestResult('Scalability Test', 'success', duration, {
        iterations,
        operationsPerSecond: Math.round(operationsPerSecond),
        avgTimePerOperation: duration / iterations
      });

    } catch (error) {
      const duration = performance.now() - startTime;
      updateTestResult('Scalability Test', 'error', duration, null, error.message);
    }
  };

  const runMemoryEfficiencyTest = async () => {
    updateTestResult('Memory Efficiency', 'running');
    const startTime = performance.now();

    try {
      // Force garbage collection if available
      if (typeof window !== 'undefined' && 'gc' in window) {
        (window as any).gc();
      }

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Simulate creating many permission checks
      const checks = [];
      for (let i = 0; i < 1000; i++) {
        checks.push(permissions.hasPermission('chat', 'can_read'));
      }

      // Get cache stats
      const cacheStats = permissions.getCacheStats();
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryDiff = finalMemory - initialMemory;

      const duration = performance.now() - startTime;
      
      updateTestResult('Memory Efficiency', 'success', duration, {
        initialMemory: Math.round(initialMemory / 1024 / 1024), // MB
        finalMemory: Math.round(finalMemory / 1024 / 1024), // MB
        memoryDiff: Math.round(memoryDiff / 1024), // KB
        cacheMemory: cacheStats.memoryUsage
      });

    } catch (error) {
      const duration = performance.now() - startTime;
      updateTestResult('Memory Efficiency', 'error', duration, null, error.message);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      await runSessionManagementTest();
      await runPermissionCacheTest();
      await runScalabilityTest();
      await runMemoryEfficiencyTest();
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      success: 'success',
      error: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status] as any}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Enhanced Authentication System Test
          </CardTitle>
          <CardDescription>
            Test advanced session management, role-based permission caching, and scalability for 100K+ users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            
            <div className="flex items-center gap-2">
              <label htmlFor="userCount" className="text-sm font-medium">
                Simulated Users:
              </label>
              <input
                id="userCount"
                type="number"
                value={simulatedUsers}
                onChange={(e) => setSimulatedUsers(Number(e.target.value))}
                className="w-20 px-2 py-1 border rounded text-sm"
                min="100"
                max="100000"
                step="100"
              />
            </div>
          </div>

          <Tabs defaultValue="results" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="results">Test Results</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="metrics">Session Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="space-y-4">
              {testResults.map((test) => (
                <Card key={test.name}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getStatusIcon(test.status)}
                        {test.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {test.duration && (
                          <span className="text-sm text-muted-foreground">
                            {test.duration.toFixed(2)}ms
                          </span>
                        )}
                        {getStatusBadge(test.status)}
                      </div>
                    </div>
                  </CardHeader>
                  {(test.result || test.error) && (
                    <CardContent className="pt-0">
                      {test.error ? (
                        <div className="text-red-600 text-sm">
                          <strong>Error:</strong> {test.error}
                        </div>
                      ) : (
                        <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">
                          {JSON.stringify(test.result, null, 2)}
                        </pre>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Session Validation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceMetrics.sessionValidation.toFixed(2)}ms
                    </div>
                    <Progress 
                      value={Math.min((50 / performanceMetrics.sessionValidation) * 100, 100)} 
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: &lt;50ms
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Permission Lookups</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceMetrics.permissionLookups.toFixed(2)}ms
                    </div>
                    <Progress 
                      value={Math.min((5 / performanceMetrics.permissionLookups) * 100, 100)} 
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: &lt;5ms
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Cache Hit Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceMetrics.cacheHitRate.toFixed(1)}%
                    </div>
                    <Progress 
                      value={performanceMetrics.cacheHitRate} 
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: &gt;95%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Memory Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceMetrics.memoryUsage.toFixed(1)}KB
                    </div>
                    <Progress 
                      value={Math.min((performanceMetrics.memoryUsage / 100) * 100, 100)} 
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: &lt;100KB per 100K users
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current Session</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Authenticated:</strong> {auth.isAuthenticated ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <strong>Session Valid:</strong> {auth.checkSessionHealth() ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <strong>Last Activity:</strong> {auth.lastActivity?.toLocaleString() || 'N/A'}
                    </div>
                    <div>
                      <strong>Device Fingerprint:</strong> {auth.deviceFingerprint?.slice(0, 8) || 'N/A'}...
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Permission Cache Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                    {JSON.stringify(permissions.getCacheStats(), null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};