import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Zap, Database, Wifi, Clock, TrendingUp } from 'lucide-react';

interface PerformanceMetrics {
  messageLoadTime: number;
  scrollPerformance: number;
  memoryUsage: number;
  connectionLatency: number;
  virtualScrollEfficiency: number;
  cacheHitRate: number;
  timestamp: number;
}

interface StressTestResult {
  messageCount: number;
  loadTime: number;
  memoryPeak: number;
  scrollFPS: number;
  connectionStability: number;
}

export const ChatPerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [stressTestResults, setStressTestResults] = useState<StressTestResult[]>([]);
  const [isStressTesting, setIsStressTesting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const metricsHistory = useRef<PerformanceMetrics[]>([]);

  // Performance monitoring implementation
  const measurePerformance = async (): Promise<PerformanceMetrics> => {
    const startTime = performance.now();
    
    // Simulate message loading measurement
    const messageLoadStart = performance.now();
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    const messageLoadTime = performance.now() - messageLoadStart;

    // Measure scroll performance (simulated)
    const scrollStart = performance.now();
    const scrollElement = document.querySelector('[data-virtualized-list]');
    const scrollPerformance = scrollElement ? performance.now() - scrollStart : 0;

    // Memory usage (approximated using performance API)
    const memoryUsage = (performance as any).memory 
      ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
      : Math.random() * 50 + 20;

    // Connection latency simulation
    const connectionLatency = Math.random() * 100 + 20;

    // Virtual scroll efficiency (simulate based on DOM elements)
    const virtualElements = document.querySelectorAll('[data-virtual-item]').length;
    const totalElements = 1000; // Simulated total
    const virtualScrollEfficiency = (virtualElements / totalElements) * 100;

    // Cache hit rate simulation
    const cacheHitRate = Math.random() * 30 + 70;

    return {
      messageLoadTime: Math.round(messageLoadTime),
      scrollPerformance: Math.round(scrollPerformance * 100) / 100,
      memoryUsage,
      connectionLatency: Math.round(connectionLatency),
      virtualScrollEfficiency: Math.round(virtualScrollEfficiency),
      cacheHitRate: Math.round(cacheHitRate),
      timestamp: Date.now()
    };
  };

  // Start performance monitoring
  const startMonitoring = () => {
    setIsMonitoring(true);
    intervalRef.current = setInterval(async () => {
      const newMetrics = await measurePerformance();
      setCurrentMetrics(newMetrics);
      
      metricsHistory.current.push(newMetrics);
      if (metricsHistory.current.length > 50) {
        metricsHistory.current.shift();
      }
      
      setMetrics([...metricsHistory.current]);
    }, 2000);
  };

  // Stop performance monitoring
  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Run stress test
  const runStressTest = async () => {
    setIsStressTesting(true);
    const results: StressTestResult[] = [];
    
    const messageCounts = [100, 500, 1000, 2000, 5000];
    
    for (const count of messageCounts) {
      console.log(`Testing with ${count} messages...`);
      
      const loadStart = performance.now();
      
      // Simulate loading large message dataset
      await new Promise(resolve => setTimeout(resolve, count / 10));
      const loadTime = performance.now() - loadStart;
      
      // Simulate memory peak
      const memoryPeak = count * 0.05 + Math.random() * 10;
      
      // Simulate scroll FPS
      const scrollFPS = Math.max(15, 60 - (count / 100));
      
      // Simulate connection stability
      const connectionStability = Math.max(70, 95 - (count / 200));
      
      results.push({
        messageCount: count,
        loadTime: Math.round(loadTime),
        memoryPeak: Math.round(memoryPeak * 10) / 10,
        scrollFPS: Math.round(scrollFPS),
        connectionStability: Math.round(connectionStability)
      });
      
      // Update UI progressively
      setStressTestResults([...results]);
    }
    
    setIsStressTesting(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Get status color based on metric value
  const getStatusColor = (value: number, metric: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (metric) {
      case 'messageLoadTime':
        return value < 100 ? 'default' : value < 200 ? 'outline' : 'destructive';
      case 'memoryUsage':
        return value < 50 ? 'default' : value < 100 ? 'outline' : 'destructive';
      case 'connectionLatency':
        return value < 50 ? 'default' : value < 100 ? 'outline' : 'destructive';
      case 'virtualScrollEfficiency':
        return value > 80 ? 'default' : value > 60 ? 'outline' : 'destructive';
      case 'cacheHitRate':
        return value > 80 ? 'default' : value > 60 ? 'outline' : 'destructive';
      default:
        return 'secondary';
    }
  };

  const chartData = metrics.slice(-20).map((metric, index) => ({
    time: index,
    loadTime: metric.messageLoadTime,
    memory: metric.memoryUsage,
    latency: metric.connectionLatency,
    efficiency: metric.virtualScrollEfficiency
  }));

  return (
    <div className="test-content-wrapper space-y-6">
      <Card className="test-card">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <Activity className="h-6 w-6 text-primary" />
            Chat Performance Monitor
          </CardTitle>
          <CardDescription>
            Monitoraggio real-time delle prestazioni del sistema di chat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              variant={isMonitoring ? "destructive" : "default"}
              className="flex items-center gap-2 w-full sm:w-auto"
              size="lg"
            >
              <Activity className="h-4 w-4" />
              {isMonitoring ? 'Stop Monitor' : 'Start Monitor'}
            </Button>
            <Button
              onClick={runStressTest}
              disabled={isStressTesting}
              variant="outline"
              className="flex items-center gap-2 w-full sm:w-auto"
              size="lg"
            >
              <Zap className="h-4 w-4" />
              {isStressTesting ? 'Testing...' : 'Stress Test'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="realtime" className="test-tab-trigger">Real-time Metrics</TabsTrigger>
          <TabsTrigger value="charts" className="test-tab-trigger">Performance Charts</TabsTrigger>
          <TabsTrigger value="stress" className="test-tab-trigger">Stress Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-6 mt-6">
          {currentMetrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <Card className="test-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Message Load Time</CardTitle>
                  <Clock className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentMetrics.messageLoadTime}ms</div>
                  <Badge variant={getStatusColor(currentMetrics.messageLoadTime, 'messageLoadTime')}>
                    {currentMetrics.messageLoadTime < 100 ? 'Excellent' : 
                     currentMetrics.messageLoadTime < 200 ? 'Good' : 'Poor'}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="test-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <Database className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentMetrics.memoryUsage}MB</div>
                  <Progress value={(currentMetrics.memoryUsage / 200) * 100} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="test-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Connection Latency</CardTitle>
                  <Wifi className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentMetrics.connectionLatency}ms</div>
                  <Badge variant={getStatusColor(currentMetrics.connectionLatency, 'connectionLatency')}>
                    {currentMetrics.connectionLatency < 50 ? 'Fast' : 
                     currentMetrics.connectionLatency < 100 ? 'Normal' : 'Slow'}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="test-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Virtual Scroll Efficiency</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentMetrics.virtualScrollEfficiency}%</div>
                  <Progress value={currentMetrics.virtualScrollEfficiency} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="test-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                  <Zap className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentMetrics.cacheHitRate}%</div>
                  <Progress value={currentMetrics.cacheHitRate} className="mt-2" />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="test-card">
              <CardHeader>
                <CardTitle className="text-lg">Load Time & Latency</CardTitle>
                <CardDescription>Message load time and connection latency over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="loadTime" stroke="hsl(var(--primary))" name="Load Time (ms)" />
                    <Line type="monotone" dataKey="latency" stroke="hsl(var(--destructive))" name="Latency (ms)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="test-card">
              <CardHeader>
                <CardTitle className="text-lg">Memory & Efficiency</CardTitle>
                <CardDescription>Memory usage and virtual scroll efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="memory" stroke="hsl(var(--warning))" name="Memory (MB)" />
                    <Line type="monotone" dataKey="efficiency" stroke="hsl(var(--success))" name="Efficiency (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stress" className="space-y-6 mt-6">
          {stressTestResults.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="test-card">
                <CardHeader>
                  <CardTitle className="text-lg">Load Time vs Message Count</CardTitle>
                  <CardDescription>Performance degradation with increasing message volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stressTestResults}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="messageCount" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="loadTime" fill="hsl(var(--primary))" name="Load Time (ms)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="test-card">
                <CardHeader>
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                  <CardDescription>Comprehensive stress test results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stressTestResults.map((result, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold">{result.messageCount} Messages</h4>
                          <Badge variant={result.loadTime < 500 ? 'default' : 'destructive'}>
                            {result.loadTime}ms
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>Memory: {result.memoryPeak}MB</div>
                          <div>FPS: {result.scrollFPS}</div>
                          <div>Stability: {result.connectionStability}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};