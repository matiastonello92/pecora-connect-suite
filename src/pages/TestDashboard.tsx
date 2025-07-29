import React, { useState } from 'react';
import { PageLayout } from '@/components/ui/layouts/PageLayout';
import { Beaker, Activity, Database, Shield, Monitor, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SystemOverview } from '@/components/testing/SystemOverview';
import { PageTestRunner } from '@/components/testing/PageTestRunner';
import { APITestRunner } from '@/components/testing/APITestRunner';
import { StressTestController } from '@/components/testing/StressTestController';
import { SecurityTestSuite } from '@/components/testing/SecurityTestSuite';
import { PerformanceMonitor } from '@/components/testing/PerformanceMonitor';
import { TestThreeFunctions } from '@/components/testing/TestThreeFunctions';
import { AlertConfigurationPanel } from '@/components/testing/AlertConfigurationPanel';
import { FunctionDetectionSystem } from '@/components/testing/FunctionDetectionSystem';
import { TestingSimulator } from '@/components/testing/TestingSimulator';
import { AppAnalysisDashboard } from '@/components/testing/AppAnalysisDashboard';
import { RLSPerformanceTest } from '@/components/testing/RLSPerformanceTest';
import { PolicyValidationTest } from '@/components/testing/PolicyValidationTest';
import { usePermissions } from '@/hooks/usePermissions';
import { useSimpleAuth } from '@/context/SimpleAuthContext';

export default function TestDashboard() {
  console.log('🧪 TestDashboard component loaded successfully');
  const { profile } = useSimpleAuth();
  const { hasPermission } = usePermissions({
    userId: profile?.user_id,
    accessLevel: profile?.accessLevel
  });
  const [activeTests, setActiveTests] = useState(0);
  
  // Allow super_admin role OR general_manager access level to access test dashboard
  const isSuperAdmin = profile?.role === 'super_admin';
  const isGeneralManager = profile?.accessLevel === 'general_manager';
  const hasManagerPermission = hasPermission('user_management', 'can_validate');
  
  if (!isSuperAdmin && !isGeneralManager && !hasManagerPermission) {
    return (
      <PageLayout 
        title="Access Denied" 
        icon={Shield}
        subtitle="You don't have permission to access the test dashboard"
      >
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-muted-foreground">
              Test dashboard access is restricted to administrators and managers only.
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Test Dashboard"
      subtitle="Comprehensive testing suite for the restaurant management platform"
      icon={Beaker}
      headerActions={
        <div className="flex items-center gap-2">
          <Badge variant={activeTests > 0 ? "default" : "secondary"}>
            {activeTests} Active Tests
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Test Environment
          </Badge>
        </div>
      }
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-11">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Analisi App
          </TabsTrigger>
          <TabsTrigger value="rls-performance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            RLS Performance
          </TabsTrigger>
          <TabsTrigger value="policy-validation" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Policy Validation
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            API
          </TabsTrigger>
          <TabsTrigger value="stress" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Stress
          </TabsTrigger>
          <TabsTrigger value="concurrent" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Concorrenti
          </TabsTrigger>
          <TabsTrigger value="detection" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Rilevamento
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Alert
          </TabsTrigger>
          <TabsTrigger value="simulator" className="flex items-center gap-2">
            <Beaker className="h-4 w-4" />
            Simulatore
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Beaker className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SystemOverview onActiveTestsChange={setActiveTests} />
        </TabsContent>
        
        <TabsContent value="analysis">
          <AppAnalysisDashboard />
        </TabsContent>
        
        <TabsContent value="rls-performance">
          <RLSPerformanceTest />
        </TabsContent>
        
        <TabsContent value="policy-validation">
          <PolicyValidationTest />
        </TabsContent>
        
        <TabsContent value="pages">
          <PageTestRunner onTestStateChange={(running) => setActiveTests(prev => running ? prev + 1 : prev - 1)} />
        </TabsContent>

        <TabsContent value="api">
          <APITestRunner onTestStateChange={(running) => setActiveTests(prev => running ? prev + 1 : prev - 1)} />
        </TabsContent>

        <TabsContent value="stress">
          <StressTestController onTestStateChange={(running) => setActiveTests(prev => running ? prev + 1 : prev - 1)} />
        </TabsContent>

        <TabsContent value="concurrent">
          <TestThreeFunctions />
        </TabsContent>

          <TabsContent value="detection">
            <FunctionDetectionSystem />
          </TabsContent>
          
          <TabsContent value="simulator">
            <TestingSimulator />
          </TabsContent>
          
          <TabsContent value="alerts">
            <AlertConfigurationPanel />
          </TabsContent>

        <TabsContent value="security">
          <SecurityTestSuite onTestStateChange={(running) => setActiveTests(prev => running ? prev + 1 : prev - 1)} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceMonitor />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}