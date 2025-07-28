import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useLocation } from '@/context/LocationContext';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Filter, BarChart3, AlertTriangle, MapPin, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LocationAwareReportWrapper } from './LocationAwareReportWrapper';

interface LocationComparisonData {
  location: string;
  sales: number;
  covers: number;
  avgPerCover: number;
  satisfaction: number;
}

export const LocationAwareReports = () => {
  const { profile } = useSimpleAuth();
  const language = 'en'; // Temporary hardcode
  const { activeLocation, availableLocations, allActiveLocations } = useLocation();
  const { t } = useTranslation(language);
  
  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({
    start: undefined,
    end: undefined
  });
  
  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'staff'>('sales');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonData, setComparisonData] = useState<LocationComparisonData[]>([]);
  const [loading, setLoading] = useState(false);

  // Check URL parameters for location preselection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const locationParam = urlParams.get('location');
    
    if (locationParam && availableLocations.some(loc => loc.value === locationParam)) {
      // Location parameter is handled by LocationContext
      console.log(`URL location parameter detected: ${locationParam}`);
    }
  }, [availableLocations]);

  const isBackofficeUser = ['super_admin', 'manager', 'director'].includes(profile?.role || '');
  const currentLocationName = availableLocations.find(loc => loc.value === activeLocation)?.label || activeLocation;

  const generateLocationReport = async () => {
    setLoading(true);
    try {
      // Simulate API call for single location report
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for the active location only
      console.log(`Generating ${reportType} report for location: ${activeLocation}`);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateComparisonReport = async () => {
    if (!isBackofficeUser) return;
    
    setLoading(true);
    try {
      // Simulate API call for comparison data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock comparison data - row-by-row, NOT aggregated
      const mockData: LocationComparisonData[] = allActiveLocations
        .filter(location => profile?.locations?.includes(location.code))
        .map(location => ({
          location: location.name,
          sales: Math.floor(Math.random() * 5000) + 2000,
          covers: Math.floor(Math.random() * 200) + 100,
          avgPerCover: 0,
          satisfaction: Math.floor(Math.random() * 2) + 4
        }));
      
      // Calculate avg per cover
      mockData.forEach(data => {
        data.avgPerCover = data.sales / data.covers;
      });
      
      setComparisonData(mockData);
    } catch (error) {
      console.error('Error generating comparison report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <LocationAwareReportWrapper reportType="Reports">
      <div className="space-y-6">
        {/* Header with Active Location */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <div className="flex items-center space-x-2 mt-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Active Location:</span>
              <Badge variant="secondary" className="font-medium">
                {currentLocationName}
              </Badge>
            </div>
          </div>
          
          {isBackofficeUser && (
            <Button
              variant="outline"
              onClick={() => setComparisonMode(!comparisonMode)}
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>{comparisonMode ? 'Single Location' : 'Compare Locations'}</span>
            </Button>
          )}
        </div>

        <Tabs value={comparisonMode ? 'comparison' : 'single'} className="w-full">
          <TabsList>
            <TabsTrigger value="single" onClick={() => setComparisonMode(false)}>
              Single Location Report
            </TabsTrigger>
            {isBackofficeUser && (
              <TabsTrigger value="comparison" onClick={() => setComparisonMode(true)}>
                Location Comparison
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="single" className="space-y-6">
            {/* Single Location Reporting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Report Configuration - {currentLocationName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Report Type */}
                  <div>
                    <label className="text-sm font-medium">Report Type</label>
                    <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Sales Report</SelectItem>
                        <SelectItem value="inventory">Inventory Report</SelectItem>
                        <SelectItem value="staff">Staff Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="text-sm font-medium">Start Date</label>
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
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.start}
                          onSelect={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="text-sm font-medium">End Date</label>
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
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.end}
                          onSelect={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={generateLocationReport} disabled={loading}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {loading ? 'Generating...' : 'Generate Report'}
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Single Location Results */}
            <Card>
              <CardHeader>
                <CardTitle>Report Results - {currentLocationName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-primary">€2,847</div>
                    <div className="text-sm text-muted-foreground">Total Sales</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold">156</div>
                    <div className="text-sm text-muted-foreground">Covers</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold">€18.25</div>
                    <div className="text-sm text-muted-foreground">Avg per Cover</div>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground text-center">
                  Data filtered for {currentLocationName} only. 
                  {isBackofficeUser && ' Switch to comparison mode to view other locations.'}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isBackofficeUser && (
            <TabsContent value="comparison" className="space-y-6">
              {/* Comparison Mode */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Location Comparison (Backoffice View)
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Comparing data row-by-row. No aggregated totals provided.
                  </div>
                </CardHeader>
                <CardContent>
                  <Button onClick={generateComparisonReport} disabled={loading} className="mb-4">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {loading ? 'Loading...' : 'Load Comparison Data'}
                  </Button>

                  {comparisonData.length > 0 && (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right">Sales</TableHead>
                            <TableHead className="text-right">Covers</TableHead>
                            <TableHead className="text-right">Avg € per Cover</TableHead>
                            <TableHead className="text-right">Satisfaction</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comparisonData.map((row) => (
                            <TableRow key={row.location}>
                              <TableCell className="font-medium">{row.location}</TableCell>
                              <TableCell className="text-right">{formatCurrency(row.sales)}</TableCell>
                              <TableCell className="text-right">{row.covers}</TableCell>
                              <TableCell className="text-right">{formatCurrency(row.avgPerCover)}</TableCell>
                              <TableCell className="text-right">{row.satisfaction}/5</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Note:</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                          This comparison shows individual location performance. 
                          No aggregated totals are calculated to maintain location-specific data integrity.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </LocationAwareReportWrapper>
  );
};