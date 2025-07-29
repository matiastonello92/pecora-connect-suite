import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  Database, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Monitor
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

export function PerformanceMonitor() {
  const { 
    config, 
    getStats, 
    getAlerts, 
    isHealthy, 
    healthScore,
    recordMetric,
    startMeasurement,
    endMeasurement
  } = usePerformanceMonitoring();

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [realtimeData, setRealtimeData] = useState<Array<{
    timestamp: string;
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  }>>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMonitoring) {
      interval = setInterval(() => {
        // Simulate real-time performance data
        const now = new Date();
        const newDataPoint = {
          timestamp: now.toLocaleTimeString(),
          responseTime: Math.random() * 200 + 100, // 100-300ms
          memoryUsage: Math.random() * 40 + 30, // 30-70%
          cpuUsage: Math.random() * 60 + 20 // 20-80%
        };
        
        setRealtimeData(prev => {
          const updated = [...prev, newDataPoint];
          return updated.slice(-20); // Keep last 20 data points
        });

        // Record metrics
        recordMetric('response_time', newDataPoint.responseTime, 'performance_monitor');
        recordMetric('memory_usage', newDataPoint.memoryUsage, 'performance_monitor');
        recordMetric('cpu_usage', newDataPoint.cpuUsage, 'performance_monitor');
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, recordMetric]);

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      setRealtimeData([]);
    }
  };

  const runPerformanceTest = async () => {
    const testId = startMeasurement('performance_test', 'test_suite');
    
    // Simulate various operations
    for (let i = 0; i < 10; i++) {
      const operationId = startMeasurement(`operation_${i}`, 'performance_test');
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
      endMeasurement(operationId);
    }
    
    endMeasurement(testId);
  };

  const alerts = getAlerts();
  const responseTimeStats = getStats('response_time');
  const memoryStats = getStats('memory_usage');
  const cpuStats = getStats('cpu_usage');

  const chartConfig = {
    responseTime: {
      label: "Response Time",
      color: "hsl(var(--chart-1))",
    },
    memoryUsage: {
      label: "Memory Usage",
      color: "hsl(var(--chart-2))",
    },
    cpuUsage: {
      label: "CPU Usage",
      color: "hsl(var(--chart-3))",
    },
  };

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Health Score
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-center">
              {(healthScore * 100).toFixed(0)}%
            </div>
            <Badge 
              className={
                isHealthy ? 'bg-green-100 text-green-800 border-green-200 w-full justify-center' :
                'bg-red-100 text-red-800 border-red-200 w-full justify-center'
              }
            >
              {isHealthy ? 'Healthy' : 'Issues Detected'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg Response
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-center">
              {responseTimeStats?.average.toFixed(0) || 0}ms
            </div>
            <div className="text-xs text-center text-muted-foreground">
              {responseTimeStats && (
                <span className="flex items-center justify-center gap-1">
                  {responseTimeStats.average < 200 ? (
                    <TrendingDown className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingUp className="h-3 w-3 text-red-500" />
                  )}
                  {responseTimeStats.samples} samples
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Memory
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-center">
              {memoryStats?.average.toFixed(0) || 0}%
            </div>
            <Progress 
              value={memoryStats?.average || 0} 
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                CPU Usage
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-center">
              {cpuStats?.average.toFixed(0) || 0}%
            </div>
            <Progress 
              value={cpuStats?.average || 0} 
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Performance Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Activity className="h-5 w-5" />
              Performance Alerts ({alerts.length})
            </CardTitle>
            <CardDescription>
              Current performance issues requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <div className="font-medium text-red-800">{alert.metric}</div>
                    <div className="text-sm text-red-600">{alert.message}</div>
                  </div>
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Real-time Performance Monitoring
            </span>
            <div className="flex gap-2">
              <Button 
                onClick={runPerformanceTest} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Run Test
              </Button>
              <Button 
                onClick={toggleMonitoring}
                className="flex items-center gap-2"
              >
                {isMonitoring ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Activity className="h-4 w-4" />
                )}
                {isMonitoring ? 'Stop' : 'Start'} Monitoring
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Real-time system performance metrics and historical data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {realtimeData.length > 0 ? (
            <div className="space-y-6">
              {/* Response Time Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">Response Time (ms)</h4>
                <ChartContainer config={chartConfig} className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={realtimeData}>
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="responseTime" 
                        stroke={chartConfig.responseTime.color}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>

              {/* Memory and CPU Usage */}
              <div>
                <h4 className="text-sm font-medium mb-2">System Resources (%)</h4>
                <ChartContainer config={chartConfig} className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={realtimeData}>
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="memoryUsage"
                        stackId="1"
                        stroke={chartConfig.memoryUsage.color}
                        fill={chartConfig.memoryUsage.color}
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="cpuUsage"
                        stackId="2"
                        stroke={chartConfig.cpuUsage.color}
                        fill={chartConfig.cpuUsage.color}
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {isMonitoring ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Collecting performance data...
                </div>
              ) : (
                'Start monitoring to see real-time performance data'
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Monitoring Configuration</CardTitle>
          <CardDescription>
            Current thresholds and sampling settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Response Time Thresholds</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Warning: {config.thresholds.response_time.warning}ms</div>
                <div>Critical: {config.thresholds.response_time.critical}ms</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Memory Usage Thresholds</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Warning: {config.thresholds.memory_usage.warning}%</div>
                <div>Critical: {config.thresholds.memory_usage.critical}%</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Sampling Configuration</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Window Size: {config.sampling.windowSize} samples</div>
                <div>Max Samples: {config.sampling.maxSamples}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Data Retention</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Stats TTL: {config.retention.statsTtl}ms</div>
                <div>Alerts TTL: {config.retention.alertsTtl}ms</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}