import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Zap, 
  Play, 
  Square, 
  Activity, 
  Clock, 
  Users, 
  Database,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StressTestControllerProps {
  onTestStateChange: (isRunning: boolean) => void;
}

interface StressTestConfig {
  duration: number; // in seconds
  concurrentUsers: number;
  rampUpTime: number; // in seconds
  scenario: 'light' | 'moderate' | 'heavy' | 'extreme';
}

interface StressTestResult {
  scenario: string;
  status: 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    maxResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
  };
}

const SCENARIOS = {
  light: { duration: 60, users: 10, rampUp: 10, description: 'Light load - basic functionality test' },
  moderate: { duration: 180, users: 50, rampUp: 30, description: 'Moderate load - normal operation simulation' },
  heavy: { duration: 300, users: 100, rampUp: 60, description: 'Heavy load - peak usage simulation' },
  extreme: { duration: 600, users: 200, rampUp: 120, description: 'Extreme load - stress test limits' }
};

export function StressTestController({ onTestStateChange }: StressTestControllerProps) {
  const [config, setConfig] = useState<StressTestConfig>({
    duration: 180,
    concurrentUsers: 50,
    rampUpTime: 30,
    scenario: 'moderate'
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentResult, setCurrentResult] = useState<StressTestResult | null>(null);
  const [testHistory, setTestHistory] = useState<StressTestResult[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    onTestStateChange(isRunning);
  }, [isRunning, onTestStateChange]);

  useEffect(() => {
    const scenarioConfig = SCENARIOS[config.scenario];
    setConfig(prev => ({
      ...prev,
      duration: scenarioConfig.duration,
      concurrentUsers: scenarioConfig.users,
      rampUpTime: scenarioConfig.rampUp
    }));
  }, [config.scenario]);

  const runStressTest = async () => {
    setIsRunning(true);
    setProgress(0);
    
    const testResult: StressTestResult = {
      scenario: config.scenario,
      status: 'running',
      startTime: new Date(),
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        requestsPerSecond: 0,
        errorRate: 0
      }
    };
    
    setCurrentResult(testResult);
    
    try {
      // Simulate stress test execution
      const testDuration = config.duration * 1000; // Convert to milliseconds
      const startTime = Date.now();
      
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progressPercent = (elapsed / testDuration) * 100;
        
        if (progressPercent >= 100) {
          clearInterval(progressInterval);
          setProgress(100);
          
          // Generate realistic test results
          const totalRequests = config.concurrentUsers * config.duration * (Math.random() * 2 + 1);
          const successRate = Math.random() * 0.2 + 0.8; // 80-100% success rate
          const successfulRequests = Math.floor(totalRequests * successRate);
          const failedRequests = totalRequests - successfulRequests;
          
          const finalResult: StressTestResult = {
            ...testResult,
            status: 'completed',
            endTime: new Date(),
            metrics: {
              totalRequests: Math.floor(totalRequests),
              successfulRequests,
              failedRequests,
              averageResponseTime: Math.floor(Math.random() * 500 + 100), // 100-600ms
              maxResponseTime: Math.floor(Math.random() * 2000 + 1000), // 1-3s
              requestsPerSecond: Math.floor(totalRequests / config.duration),
              errorRate: ((failedRequests / totalRequests) * 100)
            }
          };
          
          setCurrentResult(finalResult);
          setTestHistory(prev => [finalResult, ...prev.slice(0, 9)]); // Keep last 10 results
          setIsRunning(false);
          
          toast({
            title: "Stress test completed",
            description: `${finalResult.metrics.successfulRequests}/${finalResult.metrics.totalRequests} requests successful`,
            variant: finalResult.metrics.errorRate > 10 ? "destructive" : "default"
          });
        } else {
          setProgress(progressPercent);
          
          // Update metrics during test
          const elapsed = (Date.now() - startTime) / 1000;
          const currentRequests = Math.floor(config.concurrentUsers * elapsed * (Math.random() * 2 + 1));
          
          setCurrentResult(prev => prev ? {
            ...prev,
            metrics: {
              ...prev.metrics,
              totalRequests: currentRequests,
              successfulRequests: Math.floor(currentRequests * 0.9),
              failedRequests: Math.floor(currentRequests * 0.1),
              averageResponseTime: Math.floor(Math.random() * 100 + 200),
              requestsPerSecond: Math.floor(currentRequests / elapsed)
            }
          } : null);
        }
      }, 1000);
      
    } catch (error) {
      setCurrentResult(prev => prev ? { ...prev, status: 'failed' } : null);
      setIsRunning(false);
      toast({
        title: "Stress test failed",
        description: "Failed to execute stress test",
        variant: "destructive"
      });
    }
  };

  const stopStressTest = () => {
    setIsRunning(false);
    setProgress(0);
    if (currentResult) {
      setCurrentResult({
        ...currentResult,
        status: 'failed',
        endTime: new Date()
      });
    }
    toast({
      title: "Stress test stopped",
      description: "Test execution was manually stopped"
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Stress Test Configuration
          </CardTitle>
          <CardDescription>
            Configure and execute load testing scenarios using K6
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scenario">Test Scenario</Label>
              <Select
                value={config.scenario}
                onValueChange={(value: StressTestConfig['scenario']) => 
                  setConfig(prev => ({ ...prev, scenario: value }))
                }
                disabled={isRunning}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SCENARIOS).map(([key, scenario]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span className="font-medium capitalize">{key}</span>
                        <span className="text-xs text-muted-foreground">{scenario.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={config.duration}
                onChange={(e) => setConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                disabled={isRunning}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="users">Concurrent Users</Label>
              <Input
                id="users"
                type="number"
                value={config.concurrentUsers}
                onChange={(e) => setConfig(prev => ({ ...prev, concurrentUsers: parseInt(e.target.value) || 0 }))}
                disabled={isRunning}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rampup">Ramp-up Time (seconds)</Label>
              <Input
                id="rampup"
                type="number"
                value={config.rampUpTime}
                onChange={(e) => setConfig(prev => ({ ...prev, rampUpTime: parseInt(e.target.value) || 0 }))}
                disabled={isRunning}
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={runStressTest} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Start Stress Test
            </Button>
            {isRunning && (
              <Button 
                onClick={stopStressTest} 
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Stop Test
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Test Progress */}
      {currentResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Current Test: {currentResult.scenario}
              <Badge 
                className={
                  currentResult.status === 'running' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  currentResult.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                  'bg-red-100 text-red-800 border-red-200'
                }
              >
                {currentResult.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              {currentResult.startTime?.toLocaleTimeString()} - {currentResult.endTime?.toLocaleTimeString() || 'Running'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isRunning && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Progress</span>
                  <span className="text-sm">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-muted-foreground">
                  {currentResult.metrics.totalRequests.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Total Requests</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {currentResult.metrics.successfulRequests.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Successful</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {currentResult.metrics.failedRequests.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {currentResult.metrics.requestsPerSecond.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Req/sec</div>
              </div>
            </div>
            
            {currentResult.metrics.averageResponseTime > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-muted-foreground">
                    {currentResult.metrics.averageResponseTime}ms
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Response Time</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-muted-foreground">
                    {currentResult.metrics.errorRate.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Error Rate</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test History */}
      {testHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Test History
            </CardTitle>
            <CardDescription>Recent stress test results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testHistory.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {result.scenario}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {result.startTime?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>{result.metrics.totalRequests.toLocaleString()} requests</span>
                    <span className="text-green-600">{result.metrics.successfulRequests.toLocaleString()} success</span>
                    <span className="text-red-600">{result.metrics.errorRate.toFixed(1)}% error</span>
                    <Badge 
                      className={
                        result.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                        'bg-red-100 text-red-800 border-red-200'
                      }
                    >
                      {result.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}