import React, { useState } from 'react';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useChecklist } from '@/context/ChecklistContext';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckSquare, Clock, Play, Plus, CheckCircle, AlertCircle } from 'lucide-react';

export const Checklists = () => {
  const { user } = useSimpleAuth();
  
  
  const {
    templates,
    sessions,
    loading,
    addTemplate,
    startChecklist,
    updateChecklistItem,
    completeChecklist,
    getActiveChecklists,
    getTemplatesByDepartment
  } = useChecklist();

  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const departments = ['all', ...Array.from(new Set(templates.map(t => t.department)))];
  const activeChecklists = getActiveChecklists();
  const departmentTemplates = selectedDepartment === 'all' 
    ? templates 
    : getTemplatesByDepartment(selectedDepartment);

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-primary';
      case 'weekly': return 'bg-green-600';
      case 'monthly': return 'bg-yellow-600';
      default: return 'bg-muted';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safety': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cleaning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'equipment': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'inventory': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'preparation': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'finance': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getProgressPercentage = (session: any) => {
    const completedItems = session.items.filter((item: any) => item.completed).length;
    return Math.round((completedItems / session.items.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Checklists</h1>
          <p className="text-muted-foreground">
            Manage operational checklists and quality control
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Checklist Template</DialogTitle>
            </DialogHeader>
            <div className="text-center py-4 text-muted-foreground">
              Template creation form would be implemented here
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{templates.length}</div>
                <div className="text-sm text-muted-foreground">Templates</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{activeChecklists.length}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {sessions.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeChecklists.length > 0 ? (
            <div className="grid gap-4">
              {activeChecklists.map((session) => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-yellow-600" />
                          {session.template.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Started: {formatDate(session.startedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {getProgressPercentage(session)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {session.items.filter((i: any) => i.completed).length} / {session.items.length} completed
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {session.items.map((item: any) => (
                        <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={(checked) => 
                              updateChecklistItem(session.id, item.id, checked as boolean)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {item.title}
                              {item.isRequired && <span className="text-destructive ml-1">*</span>}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.description}
                            </div>
                            <div className="mt-1">
                              <Badge variant="outline" className={getCategoryColor(item.category)}>
                                {item.category}
                              </Badge>
                            </div>
                          </div>
                          {item.completed && (
                            <div className="text-xs text-muted-foreground">
                              {item.completedAt && formatDate(item.completedAt)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-between">
                      <div className="text-sm text-muted-foreground">
                        Estimated time: {formatTime(session.template.estimatedTime)}
                      </div>
                      <Button
                        onClick={() => completeChecklist(session.id)}
                        disabled={session.items.filter((i: any) => i.isRequired && !i.completed).length > 0}
                      >
                        Complete Checklist
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-lg font-medium">No active checklists</p>
                  <p className="text-sm">Start a checklist from the templates below</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {departmentTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5" />
                        {template.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getFrequencyColor(template.frequency)}`} />
                      <Badge variant="outline">{template.frequency}</Badge>
                      <Button 
                        size="sm"
                        onClick={() => startChecklist(template.id)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium">Department</div>
                      <div className="text-sm text-muted-foreground">{template.department}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Items</div>
                      <div className="text-sm text-muted-foreground">{template.items.length} tasks</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Estimated Time</div>
                      <div className="text-sm text-muted-foreground">
                        {formatTime(template.estimatedTime)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Required Items</div>
                      <div className="text-sm text-muted-foreground">
                        {template.items.filter(item => item.isRequired).length} required
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Task Categories:</div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(template.items.map(item => item.category))).map((category, index) => (
                        <Badge key={index} variant="outline" className={getCategoryColor(category)}>
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {sessions.filter(s => s.status === 'completed').map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        {session.template.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Completed: {session.completedAt && formatDate(session.completedAt)}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                      Completed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-medium">Department</div>
                      <div className="text-sm text-muted-foreground">{session.template.department}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Assigned To</div>
                      <div className="text-sm text-muted-foreground">{session.assignedTo}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Duration</div>
                      <div className="text-sm text-muted-foreground">
                        {session.completedAt && formatTime(
                          Math.round((session.completedAt.getTime() - session.startedAt.getTime()) / (1000 * 60))
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Completion</div>
                      <div className="text-sm text-muted-foreground">
                        {session.items.filter((i: any) => i.completed).length} / {session.items.length} items
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Checklist history and analytics will be displayed here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};