import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Trash2,
  Users,
  Database,
  Settings
} from 'lucide-react';
import { useUserDeletionValidation } from '@/hooks/useUserDeletionValidation';
import { useToast } from '@/hooks/use-toast';

interface ValidationIssue {
  id: string;
  type: 'error' | 'warning';
  category: 'user_data' | 'permissions' | 'database' | 'security';
  title: string;
  description: string;
  affectedCount: number;
  fixable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const UserValidationPanel = () => {
  const { hasIssues, errors, warnings, isValidating, runValidation } = useUserDeletionValidation();
  const [fixingIssues, setFixingIssues] = useState<string[]>([]);
  const { toast } = useToast();

  // Mock additional validation issues for demonstration
  const mockIssues: ValidationIssue[] = [
    {
      id: 'orphaned_permissions',
      type: 'warning',
      category: 'permissions',
      title: 'Orphaned Permissions',
      description: 'User permissions exist for deleted users',
      affectedCount: 3,
      fixable: true,
      severity: 'medium'
    },
    {
      id: 'duplicate_emails',
      type: 'error',
      category: 'user_data',
      title: 'Duplicate Email Addresses',
      description: 'Multiple users with same email found',
      affectedCount: 1,
      fixable: true,
      severity: 'high'
    },
    {
      id: 'missing_profiles',
      type: 'error',
      category: 'database',
      title: 'Missing Profile Data',
      description: 'Auth users without corresponding profiles',
      affectedCount: 2,
      fixable: true,
      severity: 'critical'
    },
    {
      id: 'weak_permissions',
      type: 'warning',
      category: 'security',
      title: 'Overly Permissive Access',
      description: 'Users with excessive permissions for their role',
      affectedCount: 5,
      fixable: false,
      severity: 'medium'
    }
  ];

  const allIssues = [
    ...errors.map((error, index) => ({
      id: `error_${index}`,
      type: 'error' as const,
      category: 'database' as const,
      title: 'Database Integrity Error',
      description: error,
      affectedCount: 1,
      fixable: false,
      severity: 'critical' as const
    })),
    ...warnings.map((warning, index) => ({
      id: `warning_${index}`,
      type: 'warning' as const,
      category: 'user_data' as const,
      title: 'Data Validation Warning',
      description: warning,
      affectedCount: 1,
      fixable: true,
      severity: 'medium' as const
    })),
    ...mockIssues
  ];

  const criticalIssues = allIssues.filter(issue => issue.severity === 'critical');
  const highIssues = allIssues.filter(issue => issue.severity === 'high');
  const mediumIssues = allIssues.filter(issue => issue.severity === 'medium');
  const lowIssues = allIssues.filter(issue => issue.severity === 'low');

  const fixableIssues = allIssues.filter(issue => issue.fixable);

  const handleFixIssue = async (issueId: string) => {
    setFixingIssues(prev => [...prev, issueId]);
    
    try {
      // Simulate fixing the issue
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Issue Fixed",
        description: "The validation issue has been resolved.",
      });
    } catch (error) {
      toast({
        title: "Fix Failed",
        description: "Failed to fix the validation issue.",
        variant: "destructive",
      });
    } finally {
      setFixingIssues(prev => prev.filter(id => id !== issueId));
    }
  };

  const handleFixAllFixable = async () => {
    const fixableIds = fixableIssues.map(issue => issue.id);
    setFixingIssues(fixableIds);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "All Issues Fixed",
        description: `Fixed ${fixableIssues.length} validation issues.`,
      });
    } catch (error) {
      toast({
        title: "Fix Failed",
        description: "Failed to fix some validation issues.",
        variant: "destructive",
      });
    } finally {
      setFixingIssues([]);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      case 'high': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
      case 'low': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user_data': return <Users className="h-4 w-4" />;
      case 'permissions': return <Shield className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'security': return <Settings className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const healthScore = Math.max(0, 100 - (criticalIssues.length * 25 + highIssues.length * 15 + mediumIssues.length * 10 + lowIssues.length * 5));

  return (
    <div className="space-y-6">
      {/* Health Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Management Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {healthScore}%
              </div>
              <Button
                onClick={runValidation}
                disabled={isValidating}
                variant="outline"
                size="sm"
              >
                {isValidating ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isValidating ? 'Validating...' : 'Run Validation'}
              </Button>
            </div>
            
            <Progress value={healthScore} className="h-2" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">{criticalIssues.length}</div>
                <div className="text-muted-foreground">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">{highIssues.length}</div>
                <div className="text-muted-foreground">High</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-yellow-600">{mediumIssues.length}</div>
                <div className="text-muted-foreground">Medium</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{lowIssues.length}</div>
                <div className="text-muted-foreground">Low</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {fixableIssues.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{fixableIssues.length} issues can be automatically fixed.</span>
            <Button
              onClick={handleFixAllFixable}
              disabled={fixingIssues.length > 0}
              size="sm"
            >
              {fixingIssues.length > 0 ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Fix All
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Issues by Category */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({allIssues.length})</TabsTrigger>
          <TabsTrigger value="user_data">Users ({allIssues.filter(i => i.category === 'user_data').length})</TabsTrigger>
          <TabsTrigger value="permissions">Permissions ({allIssues.filter(i => i.category === 'permissions').length})</TabsTrigger>
          <TabsTrigger value="database">Database ({allIssues.filter(i => i.category === 'database').length})</TabsTrigger>
          <TabsTrigger value="security">Security ({allIssues.filter(i => i.category === 'security').length})</TabsTrigger>
        </TabsList>

        {['all', 'user_data', 'permissions', 'database', 'security'].map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            {(category === 'all' ? allIssues : allIssues.filter(issue => issue.category === category))
              .sort((a, b) => {
                const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                return severityOrder[b.severity] - severityOrder[a.severity];
              })
              .map((issue) => (
                <Card key={issue.id} className={`border-l-4 ${
                  issue.severity === 'critical' ? 'border-l-red-500' :
                  issue.severity === 'high' ? 'border-l-orange-500' :
                  issue.severity === 'medium' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          {issue.type === 'error' ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{issue.title}</h4>
                            <Badge className={`text-xs ${getSeverityColor(issue.severity)}`}>
                              {issue.severity}
                            </Badge>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              {getCategoryIcon(issue.category)}
                              <span className="text-xs">{issue.category.replace('_', ' ')}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{issue.description}</p>
                          <div className="text-xs text-muted-foreground mt-1">
                            Affects {issue.affectedCount} {issue.affectedCount === 1 ? 'item' : 'items'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {issue.fixable ? (
                          <Button
                            onClick={() => handleFixIssue(issue.id)}
                            disabled={fixingIssues.includes(issue.id)}
                            size="sm"
                            variant="outline"
                          >
                            {fixingIssues.includes(issue.id) ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Manual Fix Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};