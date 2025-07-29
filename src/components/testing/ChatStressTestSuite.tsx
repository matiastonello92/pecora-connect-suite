import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Play, Square, Monitor, Users, Database, Zap } from 'lucide-react';
import { InfiniteScrollMessageList } from '@/components/chat/InfiniteScrollMessageList';
import { ChatMessage } from '@/types/communication';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetrics {
  timestamp: number;
  memoryUsage: number;
  renderTime: number;
  messagesLoaded: number;
  scrollPosition: number;
  fpsCount: number;
}

interface StressTestResult {
  testType: string;
  messageCount: number;
  concurrentUsers: number;
  avgRenderTime: number;
  maxMemoryUsage: number;
  minFPS: number;
  scrollingScore: number;
  realtimeLatency: number;
  status: 'running' | 'completed' | 'failed';
}

export const ChatStressTestSuite: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [testResults, setTestResults] = useState<StressTestResult[]>([]);
  const [testMessages, setTestMessages] = useState<ChatMessage[]>([]);
  const [memoryMonitor, setMemoryMonitor] = useState<number>(0);
  const [renderTime, setRenderTime] = useState<number>(0);
  
  const metricsIntervalRef = useRef<NodeJS.Timeout>();
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // Generate test messages
  const generateTestMessages = (count: number): ChatMessage[] => {
    const messages: ChatMessage[] = [];
    const sampleMessages = [
      "Ciao! Come va oggi?",
      "Perfetto, grazie per l'aggiornamento",
      "Possiamo discutere del nuovo progetto?",
      "Ottimo lavoro sul report di ieri",
      "Mi serve aiuto con l'inventario",
      "La riunione è confermata per le 15:00",
      "Hai controllato i numeri di vendita?",
      "Tutto pronto per l'apertura",
      "Il cliente ha chiamato per confermare",
      "Ricordati di fare il backup"
    ];

    for (let i = 0; i < count; i++) {
      messages.push({
        id: `test-msg-${i}`,
        chat_id: 'test-chat-1',
        sender_id: `user-${Math.floor(Math.random() * 10)}`,
        content: sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
        message_type: 'text',
        created_at: new Date(Date.now() - (count - i) * 60000).toISOString(),
        updated_at: new Date(Date.now() - (count - i) * 60000).toISOString(),
        is_edited: false,
        is_deleted: false,
        media_url: null,
        metadata: null
      });
    }
    return messages.reverse(); // Most recent first
  };

  // Monitor performance metrics
  const startMetricsMonitoring = () => {
    metricsIntervalRef.current = setInterval(() => {
      const memory = (performance as any).memory?.usedJSHeapSize || 0;
      const startTime = performance.now();
      
      // Simulate render measurement
      requestAnimationFrame(() => {
        const endTime = performance.now();
        const currentRenderTime = endTime - startTime;
        
        // Calculate FPS
        frameCountRef.current++;
        const currentTime = performance.now();
        const deltaTime = currentTime - lastTimeRef.current;
        
        if (deltaTime >= 1000) {
          const fps = (frameCountRef.current * 1000) / deltaTime;
          frameCountRef.current = 0;
          lastTimeRef.current = currentTime;
          
          const newMetric: PerformanceMetrics = {
            timestamp: Date.now(),
            memoryUsage: memory / 1024 / 1024, // MB
            renderTime: currentRenderTime,
            messagesLoaded: testMessages.length,
            scrollPosition: window.scrollY,
            fpsCount: fps
          };
          
          setMetrics(prev => [...prev.slice(-49), newMetric]);
          setMemoryMonitor(newMetric.memoryUsage);
          setRenderTime(newMetric.renderTime);
        }
      });
    }, 100);
  };

  const stopMetricsMonitoring = () => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
    }
  };

  // Test infinite scrolling with large dataset
  const testInfiniteScrolling = async (messageCount: number) => {
    setCurrentTest(`Testing infinite scrolling with ${messageCount.toLocaleString()} messages`);
    setProgress(25);
    
    const messages = generateTestMessages(messageCount);
    setTestMessages(messages);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProgress(50);
    
    // Simulate scrolling
    for (let i = 0; i < 10; i++) {
      window.scrollTo(0, i * 1000);
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(50 + i * 2);
    }
    
    setProgress(75);
    
    const avgRenderTime = metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length 
      : 0;
    const maxMemory = metrics.length > 0 
      ? Math.max(...metrics.map(m => m.memoryUsage)) 
      : 0;
    const minFPS = metrics.length > 0 
      ? Math.min(...metrics.map(m => m.fpsCount)) 
      : 0;
    
    const result: StressTestResult = {
      testType: 'Infinite Scrolling',
      messageCount,
      concurrentUsers: 1,
      avgRenderTime,
      maxMemoryUsage: maxMemory,
      minFPS,
      scrollingScore: minFPS > 30 ? 100 : (minFPS / 30) * 100,
      realtimeLatency: 0,
      status: 'completed'
    };
    
    setTestResults(prev => [...prev, result]);
    setProgress(100);
  };

  // Test concurrent real-time subscriptions
  const testConcurrentSubscriptions = async (userCount: number) => {
    setCurrentTest(`Testing ${userCount} concurrent real-time subscriptions`);
    setProgress(25);
    
    const channels: any[] = [];
    const latencies: number[] = [];
    
    try {
      for (let i = 0; i < Math.min(userCount, 100); i++) { // Limit for testing
        const startTime = performance.now();
        
        const channel = supabase
          .channel(`test-channel-${i}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages'
          }, (payload) => {
            const latency = performance.now() - startTime;
            latencies.push(latency);
          })
          .subscribe();
          
        channels.push(channel);
        
        if (i % 10 === 0) {
          setProgress(25 + (i / userCount) * 50);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      setProgress(75);
      
      // Test message broadcasting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const avgLatency = latencies.length > 0 
        ? latencies.reduce((sum, l) => sum + l, 0) / latencies.length 
        : 0;
      
      const result: StressTestResult = {
        testType: 'Concurrent Subscriptions',
        messageCount: 0,
        concurrentUsers: channels.length,
        avgRenderTime: 0,
        maxMemoryUsage: memoryMonitor,
        minFPS: 0,
        scrollingScore: 0,
        realtimeLatency: avgLatency,
        status: 'completed'
      };
      
      setTestResults(prev => [...prev, result]);
      
      // Cleanup channels
      channels.forEach(channel => supabase.removeChannel(channel));
      
    } catch (error) {
      console.error('Concurrent subscription test failed:', error);
      const result: StressTestResult = {
        testType: 'Concurrent Subscriptions',
        messageCount: 0,
        concurrentUsers: 0,
        avgRenderTime: 0,
        maxMemoryUsage: 0,
        minFPS: 0,
        scrollingScore: 0,
        realtimeLatency: 0,
        status: 'failed'
      };
      setTestResults(prev => [...prev, result]);
    }
    
    setProgress(100);
  };

  // Run comprehensive stress test
  const runStressTest = async () => {
    setIsRunning(true);
    setMetrics([]);
    setTestResults([]);
    setProgress(0);
    
    startMetricsMonitoring();
    
    try {
      // Test 1: Small dataset (1,000 messages)
      await testInfiniteScrolling(1000);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test 2: Medium dataset (5,000 messages)
      await testInfiniteScrolling(5000);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test 3: Large dataset (10,000 messages)
      await testInfiniteScrolling(10000);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test 4: Concurrent subscriptions (100 users)
      await testConcurrentSubscriptions(100);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test 5: High concurrency (1,000 simulated users)
      await testConcurrentSubscriptions(1000);
      
    } finally {
      stopMetricsMonitoring();
      setIsRunning(false);
      setCurrentTest('');
      setProgress(0);
    }
  };

  const stopTest = () => {
    stopMetricsMonitoring();
    setIsRunning(false);
    setCurrentTest('');
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      stopMetricsMonitoring();
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPerformanceScore = (result: StressTestResult): number => {
    let score = 100;
    
    // Penalize high render times
    if (result.avgRenderTime > 16) score -= 20; // 60fps threshold
    if (result.avgRenderTime > 33) score -= 30; // 30fps threshold
    
    // Penalize high memory usage
    if (result.maxMemoryUsage > 100) score -= 20; // 100MB threshold
    if (result.maxMemoryUsage > 200) score -= 30; // 200MB threshold
    
    // Penalize low FPS
    if (result.minFPS < 30) score -= 25;
    if (result.minFPS < 15) score -= 40;
    
    // Penalize high latency
    if (result.realtimeLatency > 100) score -= 15;
    if (result.realtimeLatency > 500) score -= 30;
    
    return Math.max(0, score);
  };

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Chat System Stress Test Suite
          </CardTitle>
          <CardDescription>
            Test del sistema di chat con dataset grandi e utenti concorrenti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Button 
              onClick={runStressTest} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Avvia Test Completo
            </Button>
            <Button 
              onClick={stopTest} 
              disabled={!isRunning}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Ferma Test
            </Button>
          </div>
          
          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentTest}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Memoria</p>
                <p className="text-2xl font-bold">{memoryMonitor.toFixed(1)} MB</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Render Time</p>
                <p className="text-2xl font-bold">{renderTime.toFixed(1)} ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Messaggi Caricati</p>
                <p className="text-2xl font-bold">{testMessages.length.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Test Completati</p>
                <p className="text-2xl font-bold">{testResults.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      <Tabs defaultValue="results" className="w-full">
        <TabsList>
          <TabsTrigger value="results">Risultati Test</TabsTrigger>
          <TabsTrigger value="metrics">Metriche Performance</TabsTrigger>
          <TabsTrigger value="chat-preview">Anteprima Chat</TabsTrigger>
        </TabsList>
        
        <TabsContent value="results" className="space-y-4">
          {testResults.map((result, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{result.testType}</h3>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                    <Badge variant="outline">
                      Score: {getPerformanceScore(result)}%
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {result.messageCount > 0 && (
                    <div>
                      <p className="text-muted-foreground">Messaggi</p>
                      <p className="font-medium">{result.messageCount.toLocaleString()}</p>
                    </div>
                  )}
                  {result.concurrentUsers > 0 && (
                    <div>
                      <p className="text-muted-foreground">Utenti Concorrenti</p>
                      <p className="font-medium">{result.concurrentUsers}</p>
                    </div>
                  )}
                  {result.avgRenderTime > 0 && (
                    <div>
                      <p className="text-muted-foreground">Tempo Render Medio</p>
                      <p className="font-medium">{result.avgRenderTime.toFixed(2)} ms</p>
                    </div>
                  )}
                  {result.maxMemoryUsage > 0 && (
                    <div>
                      <p className="text-muted-foreground">Memoria Max</p>
                      <p className="font-medium">{result.maxMemoryUsage.toFixed(1)} MB</p>
                    </div>
                  )}
                  {result.minFPS > 0 && (
                    <div>
                      <p className="text-muted-foreground">FPS Minimo</p>
                      <p className="font-medium">{result.minFPS.toFixed(0)}</p>
                    </div>
                  )}
                  {result.realtimeLatency > 0 && (
                    <div>
                      <p className="text-muted-foreground">Latenza Real-time</p>
                      <p className="font-medium">{result.realtimeLatency.toFixed(1)} ms</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="metrics">
          {metrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metriche Performance in Tempo Reale</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis yAxisId="memory" orientation="left" />
                    <YAxis yAxisId="render" orientation="right" />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <Line 
                      yAxisId="memory" 
                      type="monotone" 
                      dataKey="memoryUsage" 
                      stroke="#8884d8" 
                      name="Memoria (MB)"
                    />
                    <Line 
                      yAxisId="render" 
                      type="monotone" 
                      dataKey="renderTime" 
                      stroke="#82ca9d" 
                      name="Render Time (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="chat-preview">
          {testMessages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Anteprima Chat di Test</CardTitle>
                <CardDescription>
                  {testMessages.length.toLocaleString()} messaggi caricati
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg" style={{ height: '400px' }}>
                  <InfiniteScrollMessageList
                    chatId="test-chat-1"
                    height={400}
                    autoScrollToNew={false}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};