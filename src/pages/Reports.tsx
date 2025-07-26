import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useReports } from '@/context/ReportsContext';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, FileText, Download, Calendar, TrendingUp } from 'lucide-react';
import { ReportType, TimeRange } from '@/types/reports';

export const Reports = () => {
  const { language } = useAuth();
  const { t } = useTranslation(language);
  const { reports, loading, generateReport } = useReports();
  const [selectedType, setSelectedType] = useState<ReportType>('sales');
  const [selectedPeriod, setSelectedPeriod] = useState<TimeRange>('week');

  const handleGenerateReport = () => {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (selectedPeriod) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
    }
    
    generateReport(selectedType, selectedPeriod, startDate, endDate);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('reports')}</h1>
          <p className="text-muted-foreground">Analytics and business intelligence</p>
        </div>
        <Button onClick={handleGenerateReport} disabled={loading}>
          <BarChart3 className="h-4 w-4 mr-2" />
          {loading ? 'Generating...' : 'Generate Report'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Select value={selectedType} onValueChange={(value: ReportType) => setSelectedType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sales">Sales Report</SelectItem>
            <SelectItem value="inventory">Inventory Report</SelectItem>
            <SelectItem value="staff">Staff Report</SelectItem>
            <SelectItem value="financial">Financial Report</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedPeriod} onValueChange={(value: TimeRange) => setSelectedPeriod(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {report.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Generated on {report.generatedAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{report.type}</Badge>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">€18,650</div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">298</div>
                  <div className="text-sm text-muted-foreground">Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">€62.58</div>
                  <div className="text-sm text-muted-foreground">Avg Order</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};