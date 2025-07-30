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
import { ForeignKeyIndexTest } from '@/components/testing/ForeignKeyIndexTest';
import { UnusedIndexAnalyzer } from '@/components/testing/UnusedIndexAnalyzer';
import { CodeDuplicationAnalyzer } from '@/components/testing/CodeDuplicationAnalyzer';
import { ChatPerformanceMonitor } from '@/components/testing/ChatPerformanceMonitor';
import { ChatStressTestSuite } from '@/components/testing/ChatStressTestSuite';
import { CoreInfrastructureTest } from '@/components/testing/CoreInfrastructureTest';
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
      {/* Tab Categories */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                System Overview
              </CardTitle>
              <CardDescription>Health checks and system status</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-secondary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-secondary" />
                Database Analysis
              </CardTitle>
              <CardDescription>Performance, RLS, and optimization</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-accent/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                Performance Tests
              </CardTitle>
              <CardDescription>Load testing and stress analysis</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="border-b">
          <TabsList className="h-auto p-2 bg-transparent justify-start w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2 w-full">
              {/* Row 1: Core System Tests */}
              <TabsTrigger value="overview" className="test-tab-trigger flex items-center justify-center gap-2">
                <Monitor className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              
              <TabsTrigger value="core-infrastructure" className="test-tab-trigger flex items-center justify-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Core Infra</span>
              </TabsTrigger>
              
              <TabsTrigger value="analysis" className="test-tab-trigger flex items-center justify-center gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Analysis</span>
              </TabsTrigger>
              
              <TabsTrigger value="duplication" className="test-tab-trigger flex items-center justify-center gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Duplication</span>
              </TabsTrigger>
              
              <TabsTrigger value="rls-performance" className="test-tab-trigger flex items-center justify-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">RLS Perf</span>
              </TabsTrigger>
              
              <TabsTrigger value="policy-validation" className="test-tab-trigger flex items-center justify-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Policies</span>
              </TabsTrigger>
              
              <TabsTrigger value="index-performance" className="test-tab-trigger flex items-center justify-center gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Indexes</span>
              </TabsTrigger>
              
              <TabsTrigger value="unused-indexes" className="test-tab-trigger flex items-center justify-center gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Unused</span>
              </TabsTrigger>
              
              {/* Row 2: Performance & Load Tests */}
              <TabsTrigger value="pages" className="test-tab-trigger flex items-center justify-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Pages</span>
              </TabsTrigger>
              
              <TabsTrigger value="api" className="test-tab-trigger flex items-center justify-center gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">API</span>
              </TabsTrigger>
              
              <TabsTrigger value="stress" className="test-tab-trigger flex items-center justify-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Stress</span>
              </TabsTrigger>
              
              <TabsTrigger value="chat-stress" className="test-tab-trigger flex items-center justify-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
              
              <TabsTrigger value="concurrent" className="test-tab-trigger flex items-center justify-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Concurrent</span>
              </TabsTrigger>
              
              <TabsTrigger value="security" className="test-tab-trigger flex items-center justify-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
            </div>
          </TabsList>
        </div>

        <div className="min-h-[60vh] w-full">
          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              <SystemOverview onActiveTestsChange={setActiveTests} />
            </div>
          </TabsContent>
          
          <TabsContent value="core-infrastructure" className="mt-6">
            <div className="space-y-6">
              <CoreInfrastructureTest />
            </div>
          </TabsContent>
          
          <TabsContent value="analysis" className="mt-6">
            <div className="space-y-6">
              <AppAnalysisDashboard />
            </div>
          </TabsContent>
          
          <TabsContent value="rls-performance" className="mt-6">
            <div className="space-y-6">
              <RLSPerformanceTest />
            </div>
          </TabsContent>
          
          <TabsContent value="policy-validation" className="mt-6">
            <div className="space-y-6">
              <PolicyValidationTest />
            </div>
          </TabsContent>
          
          <TabsContent value="index-performance" className="mt-6">
            <div className="space-y-6">
              <ForeignKeyIndexTest />
            </div>
          </TabsContent>
          
          <TabsContent value="unused-indexes" className="mt-6">
            <div className="space-y-6">
              <UnusedIndexAnalyzer />
            </div>
          </TabsContent>
          
          <TabsContent value="duplication" className="mt-6">
            <div className="space-y-6">
              <CodeDuplicationAnalyzer />
            </div>
          </TabsContent>
          
          <TabsContent value="chat-stress" className="mt-6">
            <div className="space-y-6">
              <ChatStressTestSuite />
            </div>
          </TabsContent>
          
          <TabsContent value="pages" className="mt-6">
            <div className="space-y-6">
              <PageTestRunner onTestStateChange={(running) => setActiveTests(prev => running ? prev + 1 : prev - 1)} />
            </div>
          </TabsContent>

          <TabsContent value="api" className="mt-6">
            <div className="space-y-6">
              <APITestRunner onTestStateChange={(running) => setActiveTests(prev => running ? prev + 1 : prev - 1)} />
            </div>
          </TabsContent>

          <TabsContent value="stress" className="mt-6">
            <div className="space-y-6">
              <StressTestController onTestStateChange={(running) => setActiveTests(prev => running ? prev + 1 : prev - 1)} />
            </div>
          </TabsContent>

          <TabsContent value="concurrent" className="mt-6">
            <div className="space-y-6">
              <TestThreeFunctions />
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <div className="space-y-6">
              <SecurityTestSuite onTestStateChange={(running) => setActiveTests(prev => running ? prev + 1 : prev - 1)} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </PageLayout>
  );
}