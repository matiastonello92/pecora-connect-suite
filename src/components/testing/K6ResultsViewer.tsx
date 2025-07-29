import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Zap, 
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Activity
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface K6TestResult {
  testId: string;
  timestamp: string;
  filename: string;
  testSuite: string;
  status: 'passed' | 'failed';
  duration: number;
  metrics: {
    http_req_duration?: {
      avg: number;
      min: number;
      max: number;
      p90: number;
      p95: number;
      p99: number;
    };
    http_req_failed?: number;
    http_reqs?: number;
    vus_max?: number;
  };
  thresholds: Array<{
    name: string;
    passed: boolean;
    fails: number;
    passes: number;
  }>;
  performance: number;
  errors: Array<{
    type: string;
    rate: number;
    description: string;
  }>;
}

interface K6ResultsViewerProps {
  onTestSelect?: (testId: string) => void;
}

export function K6ResultsViewer({ onTestSelect }: K6ResultsViewerProps) {
  const [results, setResults] = useState<K6TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<K6TestResult | null>(null);
  const [summary, setSummary] = useState({
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    averagePerformanceScore: 0,
    averageResponseTime: 0,
    averageErrorRate: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadResults();
    const interval = setInterval(loadResults, 30000); // Aggiorna ogni 30 secondi
    return () => clearInterval(interval);
  }, []);

  const loadResults = async () => {
    try {
      // Simula il caricamento dei risultati k6
      // In un'implementazione reale, questo caricherà i dati dal backend
      const mockResults: K6TestResult[] = [
        {
          testId: 'test_1',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          filename: 'auth-api-test.json',
          testSuite: 'auth-system',
          status: 'passed',
          duration: 180,
          metrics: {
            http_req_duration: { avg: 245, min: 89, max: 1200, p90: 450, p95: 680, p99: 950 },
            http_req_failed: 0.02,
            http_reqs: 15420,
            vus_max: 1000
          },
          thresholds: [
            { name: 'http_req_duration', passed: true, fails: 0, passes: 15420 },
            { name: 'http_req_failed', passed: true, fails: 0, passes: 15420 }
          ],
          performance: 85,
          errors: []
        },
        {
          testId: 'test_2',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          filename: 'chat-system-test.json',
          testSuite: 'chat-system',
          status: 'failed',
          duration: 240,
          metrics: {
            http_req_duration: { avg: 1850, min: 120, max: 5200, p90: 3200, p95: 4100, p99: 4800 },
            http_req_failed: 0.15,
            http_reqs: 8934,
            vus_max: 5000
          },
          thresholds: [
            { name: 'http_req_duration', passed: false, fails: 1256, passes: 7678 },
            { name: 'http_req_failed', passed: false, fails: 1340, passes: 7594 }
          ],
          performance: 45,
          errors: [
            { type: 'http_errors', rate: 0.15, description: '15.00% delle richieste HTTP sono fallite' },
            { type: 'timeout_errors', rate: 0.08, description: '8.00% timeout su connessioni' }
          ]
        },
        {
          testId: 'test_3',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          filename: 'inventory-system-test.json',
          testSuite: 'inventory-system',
          status: 'passed',
          duration: 320,
          metrics: {
            http_req_duration: { avg: 180, min: 45, max: 890, p90: 320, p95: 450, p99: 650 },
            http_req_failed: 0.003,
            http_reqs: 45670,
            vus_max: 10000
          },
          thresholds: [
            { name: 'http_req_duration', passed: true, fails: 0, passes: 45670 },
            { name: 'http_req_failed', passed: true, fails: 0, passes: 45670 }
          ],
          performance: 92,
          errors: []
        }
      ];

      setResults(mockResults);
      
      // Calcola statistiche riassuntive
      const newSummary = {
        totalTests: mockResults.length,
        passedTests: mockResults.filter(r => r.status === 'passed').length,
        failedTests: mockResults.filter(r => r.status === 'failed').length,
        averagePerformanceScore: mockResults.reduce((sum, r) => sum + r.performance, 0) / mockResults.length,
        averageResponseTime: mockResults.reduce((sum, r) => sum + (r.metrics.http_req_duration?.avg || 0), 0) / mockResults.length,
        averageErrorRate: mockResults.reduce((sum, r) => sum + (r.metrics.http_req_failed || 0), 0) / mockResults.length
      };
      
      setSummary(newSummary);
      
      if (!selectedResult && mockResults.length > 0) {
        setSelectedResult(mockResults[0]);
      }
      
    } catch (error) {
      toast({
        title: "Errore caricamento risultati",
        description: "Impossibile caricare i risultati dei test k6",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  const getStatusIcon = (status: string) => {
    return status === 'passed' ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge 
        className={
          status === 'passed' ? 
          'bg-green-100 text-green-800 border-green-200' :
          'bg-red-100 text-red-800 border-red-200'
        }
      >
        {status}
      </Badge>
    );
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const chartData = results.map(result => ({
    testSuite: result.testSuite,
    performance: result.performance,
    responseTime: result.metrics.http_req_duration?.avg || 0,
    errorRate: (result.metrics.http_req_failed || 0) * 100,
    timestamp: new Date(result.timestamp).toLocaleDateString()
  }));

  const chartConfig = {
    performance: {
      label: "Performance Score",
      color: "hsl(var(--chart-1))",
    },
    responseTime: {
      label: "Response Time (ms)",
      color: "hsl(var(--chart-2))",
    },
    errorRate: {
      label: "Error Rate (%)",
      color: "hsl(var(--chart-3))",
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Caricamento risultati k6...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{summary.totalTests}</div>
            <div className="text-xs text-muted-foreground">Test Totali</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{summary.passedTests}</div>
            <div className="text-xs text-muted-foreground">Superati</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{summary.failedTests}</div>
            <div className="text-xs text-muted-foreground">Falliti</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${getPerformanceColor(summary.averagePerformanceScore)}`}>
              {summary.averagePerformanceScore.toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">Score Medio</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{summary.averageResponseTime.toFixed(0)}ms</div>
            <div className="text-xs text-muted-foreground">Resp. Medio</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{(summary.averageErrorRate * 100).toFixed(2)}%</div>
            <div className="text-xs text-muted-foreground">Errori</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="details">Dettagli</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Test Results List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Risultati Test Recenti
              </CardTitle>
              <CardDescription>
                Ultimi risultati dei test di stress K6
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result) => (
                  <div 
                    key={result.testId}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedResult?.testId === result.testId ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => {
                      setSelectedResult(result);
                      onTestSelect?.(result.testId);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-medium">{result.testSuite}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(result.timestamp).toLocaleString()} • {formatDuration(result.duration)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getPerformanceColor(result.performance)}`}>
                            {result.performance}
                          </div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">
                            {result.metrics.http_req_duration?.avg?.toFixed(0) || 0}ms
                          </div>
                          <div className="text-xs text-muted-foreground">Avg Resp</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">
                            {result.metrics.http_reqs?.toLocaleString() || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Requests</div>
                        </div>
                        {getStatusBadge(result.status)}
                      </div>
                    </div>
                    
                    {result.errors.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">Errori rilevati:</span>
                        </div>
                        <div className="mt-1 space-y-1">
                          {result.errors.map((error, index) => (
                            <div key={index} className="text-sm text-red-600">
                              • {error.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Score Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="timestamp" />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="performance" 
                        stroke={chartConfig.performance.color}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Response Time Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="responseTime"
                        stroke={chartConfig.responseTime.color}
                        fill={chartConfig.responseTime.color}
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Dettagli Test: {selectedResult.testSuite}
                  <div className="flex gap-2">
                    {getStatusBadge(selectedResult.status)}
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Eseguito il {new Date(selectedResult.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold">{formatDuration(selectedResult.duration)}</div>
                    <div className="text-xs text-muted-foreground">Durata</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold">{selectedResult.metrics.vus_max?.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Max VUs</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold">{selectedResult.metrics.http_reqs?.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total Requests</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold">
                      {((selectedResult.metrics.http_req_failed || 0) * 100).toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Error Rate</div>
                  </div>
                </div>

                {/* Response Time Details */}
                {selectedResult.metrics.http_req_duration && (
                  <div>
                    <h4 className="font-medium mb-3">Response Time Distribution</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-lg font-bold">{selectedResult.metrics.http_req_duration.avg.toFixed(0)}ms</div>
                        <div className="text-xs text-muted-foreground">Average</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-lg font-bold">{selectedResult.metrics.http_req_duration.p90.toFixed(0)}ms</div>
                        <div className="text-xs text-muted-foreground">90th Percentile</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-lg font-bold">{selectedResult.metrics.http_req_duration.p95.toFixed(0)}ms</div>
                        <div className="text-xs text-muted-foreground">95th Percentile</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-lg font-bold">{selectedResult.metrics.http_req_duration.p99.toFixed(0)}ms</div>
                        <div className="text-xs text-muted-foreground">99th Percentile</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-lg font-bold">{selectedResult.metrics.http_req_duration.min.toFixed(0)}ms</div>
                        <div className="text-xs text-muted-foreground">Minimum</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-lg font-bold">{selectedResult.metrics.http_req_duration.max.toFixed(0)}ms</div>
                        <div className="text-xs text-muted-foreground">Maximum</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Thresholds */}
                <div>
                  <h4 className="font-medium mb-3">Threshold Results</h4>
                  <div className="space-y-2">
                    {selectedResult.thresholds.map((threshold, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {threshold.passed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">{threshold.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {threshold.passes.toLocaleString()} passed, {threshold.fails.toLocaleString()} failed
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Suite Comparison</CardTitle>
              <CardDescription>
                Confronto performance tra diverse suite di test
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="testSuite" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="performance" fill={chartConfig.performance.color} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}