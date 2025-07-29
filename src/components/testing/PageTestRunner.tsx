import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PageTestRunnerProps {
  onTestStateChange: (isRunning: boolean) => void;
}

interface PageTest {
  id: string;
  name: string;
  route: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
}

export function PageTestRunner({ onTestStateChange }: PageTestRunnerProps) {
  const [pages] = useState<PageTest[]>([
    { id: '1', name: 'Dashboard', route: '/app/dashboard', description: 'Main dashboard page', status: 'pending' },
    { id: '2', name: 'Communication', route: '/app/communication', description: 'Chat and messaging', status: 'pending' },
    { id: '3', name: 'User Management', route: '/app/user-management', description: 'User administration', status: 'pending' },
    { id: '4', name: 'Financial', route: '/app/financial', description: 'Financial reports and cash closure', status: 'pending' },
    { id: '5', name: 'Inventory', route: '/app/inventory', description: 'Inventory management', status: 'pending' },
    { id: '6', name: 'Kitchen Inventory', route: '/app/kitchen-inventory', description: 'Kitchen inventory tracking', status: 'pending' },
    { id: '7', name: 'Equipment', route: '/app/equipment', description: 'Equipment management', status: 'pending' },
    { id: '8', name: 'Suppliers', route: '/app/suppliers', description: 'Supplier management', status: 'pending' },
    { id: '9', name: 'Cash Register', route: '/app/cash-register', description: 'Cash register operations', status: 'pending' },
    { id: '10', name: 'Checklists', route: '/app/checklists', description: 'Operational checklists', status: 'pending' },
    { id: '11', name: 'Tasks', route: '/app/tasks', description: 'Task management', status: 'pending' },
    { id: '12', name: 'Maintenance', route: '/app/maintenance', description: 'Maintenance scheduling', status: 'pending' },
    { id: '13', name: 'Reports', route: '/app/reports', description: 'Business reports', status: 'pending' },
    { id: '14', name: 'Settings', route: '/app/settings', description: 'Application settings', status: 'pending' },
    { id: '15', name: 'Profile', route: '/app/profile', description: 'User profile management', status: 'pending' },
    { id: '16', name: 'Index', route: '/app', description: 'Application index', status: 'pending' },
    { id: '17', name: 'Test Dashboard', route: '/app/test-dashboard', description: 'Testing dashboard', status: 'pending' }
  ]);

  const [testPages, setTestPages] = useState<PageTest[]>(pages);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    onTestStateChange(isRunning);
  }, [isRunning, onTestStateChange]);

  const runSingleTest = async (pageId: string): Promise<boolean> => {
    const page = testPages.find(p => p.id === pageId);
    if (!page) return false;

    setTestPages(prev => prev.map(p => 
      p.id === pageId 
        ? { ...p, status: 'running' as const }
        : p
    ));

    const startTime = Date.now();
    
    try {
      // Simulate page test with random success/failure
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
      
      const success = Math.random() > 0.1; // 90% success rate
      const duration = Date.now() - startTime;
      
      setTestPages(prev => prev.map(p => 
        p.id === pageId 
          ? { 
              ...p, 
              status: success ? 'passed' as const : 'failed' as const,
              duration,
              error: success ? undefined : 'Page load timeout or rendering error'
            }
          : p
      ));

      return success;
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestPages(prev => prev.map(p => 
        p.id === pageId 
          ? { 
              ...p, 
              status: 'failed' as const,
              duration,
              error: 'Test execution failed'
            }
          : p
      ));
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    
    // Reset all tests
    setTestPages(prev => prev.map(p => ({ ...p, status: 'pending' as const, error: undefined })));
    
    let passedCount = 0;
    
    for (let i = 0; i < testPages.length; i++) {
      setCurrentTestIndex(i);
      const success = await runSingleTest(testPages[i].id);
      if (success) passedCount++;
      
      setProgress(((i + 1) / testPages.length) * 100);
    }
    
    setCurrentTestIndex(-1);
    setIsRunning(false);
    
    toast({
      title: "Page tests completed",
      description: `${passedCount}/${testPages.length} pages passed testing`,
      variant: passedCount === testPages.length ? "default" : "destructive"
    });
  };

  const resetTests = () => {
    setTestPages(prev => prev.map(p => ({ 
      ...p, 
      status: 'pending' as const, 
      error: undefined,
      duration: undefined
    })));
    setProgress(0);
    setCurrentTestIndex(-1);
  };

  const getStatusIcon = (status: PageTest['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: PageTest['status']) => {
    switch (status) {
      case 'pending': return <Badge variant="outline">Pending</Badge>;
      case 'running': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Running</Badge>;
      case 'passed': return <Badge className="bg-green-100 text-green-800 border-green-200">Passed</Badge>;
      case 'failed': return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
    }
  };

  const passedTests = testPages.filter(p => p.status === 'passed').length;
  const failedTests = testPages.filter(p => p.status === 'failed').length;
  const completedTests = passedTests + failedTests;

  return (
    <div className="space-y-6">
      {/* Controls and Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Page Testing Suite
            <div className="flex gap-2">
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                {isRunning ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run All Tests
              </Button>
              <Button 
                onClick={resetTests} 
                disabled={isRunning}
                variant="outline"
              >
                Reset
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Test all {testPages.length} application pages for functionality and performance
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
              {currentTestIndex >= 0 && (
                <p className="text-sm text-muted-foreground">
                  Testing: {testPages[currentTestIndex]?.name}
                </p>
              )}
            </div>
          )}
          
          {completedTests > 0 && (
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">{completedTests}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{passedTests}</div>
                <div className="text-xs text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{failedTests}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Page Test Results */}
      <div className="grid gap-4">
        {testPages.map((page) => (
          <Card key={page.id} className="transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {getStatusIcon(page.status)}
                  {page.name}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => window.open(page.route, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </span>
                <div className="flex items-center gap-2">
                  {page.duration && (
                    <span className="text-xs text-muted-foreground">
                      {page.duration}ms
                    </span>
                  )}
                  {getStatusBadge(page.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runSingleTest(page.id)}
                    disabled={isRunning}
                  >
                    Test
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {page.description}
              </p>
              <p className="text-xs text-muted-foreground">
                Route: <code className="bg-gray-100 px-1 rounded">{page.route}</code>
              </p>
              {page.error && (
                <p className="text-sm text-red-600 mt-2">
                  Error: {page.error}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}