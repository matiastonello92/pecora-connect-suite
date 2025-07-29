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
import { usePermissions } from '@/hooks/usePermissions';

export default function TestDashboard() {
  const { hasPermission } = usePermissions();
  const [activeTests, setActiveTests] = useState(0);
  
  // Only allow admins and managers to access the test dashboard
  if (!hasPermission('manager') && !hasPermission('super_admin')) {
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Overview
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

        <TabsContent value="pages">
          <PageTestRunner onTestStateChange={(running) => setActiveTests(prev => running ? prev + 1 : prev - 1)} />
        </TabsContent>

        <TabsContent value="api">
          <APITestRunner onTestStateChange={(running) => setActiveTests(prev => running ? prev + 1 : prev - 1)} />
        </TabsContent>

        <TabsContent value="stress">
          <StressTestController onTestStateChange={(running) => setActiveTests(prev => running ? prev + 1 : prev - 1)} />
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