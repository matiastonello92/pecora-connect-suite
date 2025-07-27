import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useFinancial } from '@/context/FinancialContext';
import { useLocation } from '@/context/LocationContext';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Filter, TrendingUp, AlertTriangle, BarChart3, PieChart, Search, Save, Star, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ClosureStatus } from '@/types/financial';
import { LocationAwareReportWrapper } from '../reports/LocationAwareReportWrapper';

export const FinancialReports = () => {
  const { user } = useSimpleAuth();
  const language = 'en'; // Temporarily hardcode language
  const hasPermission = (permission: string) => true; // Temporarily allow all permissions
  const { activeLocation, availableLocations } = useLocation();
  const { t } = useTranslation(language);
  const {
    closures,
    reports,
    filterPresets,
    anomalies,
    generateReport,
    saveFilterPreset,
    exportData,
    detectAnomalies,
    updateClosureStatus,
    unlockClosure
  } = useFinancial();

  // Check URL parameters for location preselection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const locationParam = urlParams.get('location');
    
    if (locationParam && availableLocations.some(loc => loc.value === locationParam)) {
      console.log(`Financial reports: URL location parameter detected: ${locationParam}`);
    }
  }, [availableLocations]);

  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({
    start: undefined,
    end: undefined
  });
  
  const [filters, setFilters] = useState({
    submitter: '',
    status: 'all' as ClosureStatus | 'all' | ''
  });
  
  const [selectedPreset, setSelectedPreset] = useState('');
  const [presetName, setPresetName] = useState('');
  const [showChart, setShowChart] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');
  const [viewType, setViewType] = useState<'totals' | 'percentages'>('totals');

  const canManageStatus = ['director', 'super_admin'].includes(user?.role || '');
  const currentLocationName = availableLocations.find(loc => loc.value === activeLocation)?.label || activeLocation;

  const handleGenerateReport = () => {
    const reportFilters = {
      dateRange: dateRange.start && dateRange.end ? dateRange : undefined,
      location: activeLocation, // Always filter by active location
      ...filters
    };
    generateReport(reportFilters);
    detectAnomalies();
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    // Filter by active location only - strict single location enforcement
    const filteredData = closures.filter(closure => {
      // First apply active location filter
      if (closure.restaurantLocation !== activeLocation) {
        return false;
      }
      
      if (dateRange.start && dateRange.end) {
        const closureDate = new Date(closure.date);
        if (closureDate < dateRange.start || closureDate > dateRange.end) {
          return false;
        }
      }
      if (filters.submitter && closure.submittedBy !== filters.submitter) {
        return false;
      }
      if (filters.status && filters.status !== 'all' && closure.status !== filters.status) {
        return false;
      }
      return true;
    });

    exportData(format, filteredData);
  };

  const handleSavePreset = () => {
    if (presetName.trim()) {
      saveFilterPreset(presetName, { dateRange, ...filters });
      setPresetName('');
    }
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = filterPresets.find(p => p.id === presetId);
    if (preset) {
      setDateRange(preset.filters.dateRange || { start: undefined, end: undefined });
      setFilters({
        submitter: preset.filters.submitter || '',
        status: preset.filters.status || 'all'
      });
    }
  };

  const getStatusColor = (status: ClosureStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'submitted': return 'bg-blue-500';
      case 'under_review': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <LocationAwareReportWrapper reportType="Financial Reports">
      <div className="space-y-6">
        {/* Header with Active Location */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Financial Reports</h2>
            <div className="flex items-center space-x-2 mt-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Active Location:</span>
              <Badge variant="secondary" className="font-medium">
                {currentLocationName}
              </Badge>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Report Generation - {currentLocationName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{/* Removed location column */}
            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.start && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.start ? format(dateRange.start, "PPP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.start}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.end && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.end ? format(dateRange.end, "PPP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.end}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Submitter Filter */}
            <div>
              <Label htmlFor="submitter">Submitter</Label>
              <Input
                id="submitter"
                placeholder="Filter by submitter..."
                value={filters.submitter}
                onChange={(e) => setFilters(prev => ({ ...prev, submitter: e.target.value }))}
              />
            </div>

            {/* Status Filter */}
            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value as ClosureStatus }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Presets */}
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={selectedPreset} onValueChange={(value) => {
              setSelectedPreset(value);
              handleLoadPreset(value);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Load saved preset..." />
              </SelectTrigger>
              <SelectContent>
                {filterPresets.map(preset => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="w-48"
            />
            <Button variant="outline" onClick={handleSavePreset}>
              <Save className="h-4 w-4 mr-2" />
              Save Preset
            </Button>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleGenerateReport}>
              <Search className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={() => setShowChart(!showChart)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              {showChart ? 'Hide' : 'Show'} Charts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Anomalies Alert */}
      {(anomalies.unusualCash.length > 0 || anomalies.missingCovers.length > 0 || anomalies.lowSatisfaction.length > 0) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Anomalies Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {anomalies.unusualCash.length > 0 && (
                <p>• {anomalies.unusualCash.length} closures with unusual cash amounts</p>
              )}
              {anomalies.missingCovers.length > 0 && (
                <p>• {anomalies.missingCovers.length} closures with missing cover counts</p>
              )}
              {anomalies.lowSatisfaction.length > 0 && (
                <p>• {anomalies.lowSatisfaction.length} closures with low satisfaction ratings</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {showChart && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Data Visualization
              </CardTitle>
              <div className="flex gap-2">
                <Select value={chartType} onValueChange={(value) => setChartType(value as any)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="pie">Pie Chart</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={viewType} onValueChange={(value) => setViewType(value as any)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="totals">Totals</SelectItem>
                    <SelectItem value="percentages">Percentages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Chart visualization would be implemented here</p>
                <p className="text-sm">Using libraries like Recharts or Chart.js</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Closure Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Cash</TableHead>
                  <TableHead>Total Payments</TableHead>
                  <TableHead>Covers</TableHead>
                  <TableHead>Satisfaction</TableHead>
                  <TableHead>Status</TableHead>
                  {canManageStatus && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {closures.length > 0 ? (
                  closures.map((closure) => {
                    const totalPayments = closure.cashCollected + closure.lightspeedPayments + 
                      closure.satispayPayments + closure.carteBleueManual + 
                      closure.customerCredit + closure.giftVouchers + closure.otherPayments;

                    return (
                      <TableRow key={closure.id}>
                        <TableCell>{new Date(closure.date).toLocaleDateString(language)}</TableCell>
                        <TableCell>{closure.submitterName}</TableCell>
                        <TableCell>{formatCurrency(closure.cashCollected)}</TableCell>
                        <TableCell>{formatCurrency(totalPayments)}</TableCell>
                        <TableCell>{closure.totalCovers}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: closure.satisfactionRating }, (_, i) => (
                              <Star key={i} className="h-3 w-3 fill-current text-yellow-500" />
                            ))}
                            <span className="ml-1 text-sm">{closure.satisfactionRating}/5</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(closure.status)}>
                            {closure.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        {canManageStatus && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Select
                                value={closure.status}
                                onValueChange={(value) => updateClosureStatus(closure.id, value as ClosureStatus)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="submitted">Submitted</SelectItem>
                                  <SelectItem value="under_review">Under Review</SelectItem>
                                  <SelectItem value="approved">Approved</SelectItem>
                                  <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                              </Select>
                              {closure.isLocked && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => unlockClosure(closure.id)}
                                >
                                  Unlock
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={canManageStatus ? 8 : 7} className="text-center text-muted-foreground py-8">
                      No cash closure records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </div>
    </LocationAwareReportWrapper>
  );
};