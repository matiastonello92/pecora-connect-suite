import React, { useState } from 'react';
import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListTodo, Plus, CheckSquare, BarChart3, Clock, User, AlertTriangle } from 'lucide-react';

export const Tasks = () => {
  const { user } = useEnhancedAuth();
  
  const hasPermission = (permission: string) => true; // Temporarily allow all permissions
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Mock data for demonstration
  const [tasks] = useState([
    {
      id: '1',
      title: 'Check refrigerator temperature',
      description: 'Verify all refrigeration units are maintaining proper temperature',
      priority: 'high',
      status: 'pending',
      assignedTo: user?.email || 'Current User',
      dueDate: new Date('2024-01-20'),
      createdBy: 'Manager',
      department: 'kitchen',
      location: 'menton' // Default location - will need location context
    },
    {
      id: '2',
      title: 'Update inventory records',
      description: 'Complete monthly inventory update in system',
      priority: 'medium',
      status: 'in_progress',
      assignedTo: user?.email || 'Current User',
      dueDate: new Date('2024-01-18'),
      createdBy: 'Manager',
      department: 'kitchen',
      location: 'menton' // Default location - will need location context
    },
    {
      id: '3',
      title: 'Staff training session',
      description: 'Conduct food safety training for new employees',
      priority: 'low',
      status: 'completed',
      assignedTo: 'Training Manager',
      dueDate: new Date('2024-01-15'),
      createdBy: 'HR Manager',
      department: 'general',
      location: 'menton' // Default location - will need location context
    }
  ]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const assignedTasks = tasks.filter(task => 
    task.assignedTo === (user?.email || 'Current User')
  );

  const taskHistory = tasks.filter(task => task.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ListTodo className="h-8 w-8" />
            Tasks
          </h1>
          <p className="text-muted-foreground">
            Manage and track tasks for your department
          </p>
        </div>
        {hasPermission('manager') && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input placeholder="Task title" />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea placeholder="Task description" rows={3} />
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Assign To</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user1">John Doe</SelectItem>
                      <SelectItem value="user2">Jane Smith</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">Create Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ListTodo className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{assignedTasks.length}</div>
                <div className="text-sm text-muted-foreground">Assigned Tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">
                  {assignedTasks.filter(t => t.status === 'pending').length}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">
                  {assignedTasks.filter(t => t.status === 'in_progress').length}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{taskHistory.length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assigned" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="assigned" className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            Assigned Tasks
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Create Task
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Task History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4">
          <div className="grid gap-4">
            {assignedTasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge variant={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{task.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium">Due Date</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(task.dueDate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Created By</div>
                      <div className="text-sm text-muted-foreground">{task.createdBy}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Department</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {task.department}
                      </div>
                    </div>
                  </div>
                  {task.status !== 'completed' && (
                    <div className="flex gap-2 mt-4">
                      {task.status === 'pending' && (
                        <Button size="sm">Start Task</Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button size="sm" variant="default">Complete Task</Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Task</CardTitle>
            </CardHeader>
            <CardContent>
              {hasPermission('manager') ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Use the "Create Task" button in the header to create new tasks</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Only managers can create tasks. Contact your supervisor to request new tasks.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-4">
            {taskHistory.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <Badge variant="default">Completed</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{task.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium">Completed</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(task.dueDate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Assigned To</div>
                      <div className="text-sm text-muted-foreground">{task.assignedTo}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Department</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {task.department}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};