import React from 'react';
import { useSimpleAuth } from '@/context/SimpleAuthContext';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Calculator, TrendingUp } from 'lucide-react';
import { CashClosureForm } from '@/components/financial/CashClosureForm';
import { FinancialReports } from '@/components/financial/FinancialReports';

export const Financial = () => {
  const { user } = useSimpleAuth();
  const language = 'en'; // Temporarily hardcode language
  const hasPermission = (permission: string) => true; // Temporarily allow all permissions
  

  // Check if user has access to financial section
  const hasFinancialAccess = ['manager', 'director', 'finance', 'super_admin'].includes(user?.role || '');

  if (!hasFinancialAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
            <CardTitle>Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              You don't have permission to access the financial section. 
              Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calculator className="h-8 w-8" />
            Financial Management
          </h1>
          <p className="text-muted-foreground">
            Daily cash closure and financial reporting
          </p>
        </div>
      </div>

      <Tabs defaultValue="closure" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="closure" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Cash Closure
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Reports & Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="closure">
          <CashClosureForm />
        </TabsContent>

        <TabsContent value="reports">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};