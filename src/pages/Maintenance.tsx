import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, AlertTriangle, FileText, Settings, Plus, Upload } from 'lucide-react';

export const Maintenance = () => {
  const { user, language } = useAuth();
  const { t } = useTranslation(language);
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Mock data for demonstration
  const [reports] = useState([
    {
      id: '1',
      title: 'Pizza oven temperature issue',
      description: 'Oven not reaching target temperature of 350°C',
      equipment: 'Pizza Oven #1',
      priority: 'high',
      status: 'open',
      reportedBy: user?.firstName + ' ' + user?.lastName,
      reportedAt: new Date('2024-01-15'),
      assignedTo: 'Maintenance Team',
      location: user?.location || 'menton'
    },
    {
      id: '2',
      title: 'Refrigerator door seal replacement',
      description: 'Door seal on walk-in cooler is damaged and needs replacement',
      equipment: 'Walk-in Cooler #2',
      priority: 'medium',
      status: 'in_progress',
      reportedBy: 'Kitchen Staff',
      reportedAt: new Date('2024-01-12'),
      assignedTo: 'John Technical',
      location: user?.location || 'menton'
    },
    {
      id: '3',
      title: 'Dishwasher maintenance complete',
      description: 'Routine maintenance and cleaning completed',
      equipment: 'Dishwasher #1',
      priority: 'low',
      status: 'completed',
      reportedBy: 'Manager',
      reportedAt: new Date('2024-01-10'),
      assignedTo: 'Maintenance Team',
      location: user?.location || 'menton'
    }
  ]);

  const [scheduledMaintenance] = useState([
    {
      id: '1',
      equipment: 'Pizza Oven #1',
      type: 'Deep Clean',
      nextDue: new Date('2024-01-25'),
      frequency: 'Monthly',
      priority: 'medium',
      responsible: 'Kitchen Team'
    },
    {
      id: '2',
      equipment: 'HVAC System',
      type: 'Filter Change',
      nextDue: new Date('2024-01-20'),
      frequency: 'Quarterly',
      priority: 'high',
      responsible: 'Maintenance Team'
    }
  ]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language, {
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
      case 'open': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="h-8 w-8" />
            Maintenance
          </h1>
          <p className="text-muted-foreground">
            Report and track equipment maintenance and repairs
          </p>
        </div>
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report Equipment Issue</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Equipment</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oven1">Pizza Oven #1</SelectItem>
                      <SelectItem value="oven2">Pizza Oven #2</SelectItem>
                      <SelectItem value="cooler1">Walk-in Cooler #1</SelectItem>
                      <SelectItem value="dishwasher">Dishwasher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High - Urgent</SelectItem>
                      <SelectItem value="medium">Medium - Normal</SelectItem>
                      <SelectItem value="low">Low - When Possible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Issue Title</label>
                <Input placeholder="Brief description of the issue" />
              </div>
              <div>
                <label className="text-sm font-medium">Detailed Description</label>
                <Textarea 
                  placeholder="Describe the issue in detail, including any error messages, symptoms, or circumstances"
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Attachments</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Click to upload photos or videos of the issue
                  </p>
                  <Input type="file" className="hidden" multiple accept="image/*,video/*" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">Submit Report</Button>
                <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold">
                  {reports.filter(r => r.status === 'open').length}
                </div>
                <div className="text-sm text-muted-foreground">Open Issues</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {reports.filter(r => r.status === 'in_progress').length}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{scheduledMaintenance.length}</div>
                <div className="text-sm text-muted-foreground">Scheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {reports.filter(r => r.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="report" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="report" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Report Issue
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Issue History
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Scheduled
          </TabsTrigger>
        </TabsList>

        <TabsContent value="report" className="space-y-4">
          <div className="grid gap-4">
            {reports.filter(r => r.status !== 'completed').map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant={getPriorityColor(report.priority)}>
                        {report.priority}
                      </Badge>
                      <Badge variant={getStatusColor(report.status)}>
                        {report.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{report.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-medium">Equipment</div>
                      <div className="text-sm text-muted-foreground">{report.equipment}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Reported By</div>
                      <div className="text-sm text-muted-foreground">{report.reportedBy}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Date Reported</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(report.reportedAt)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Assigned To</div>
                      <div className="text-sm text-muted-foreground">{report.assignedTo}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant={getPriorityColor(report.priority)}>
                        {report.priority}
                      </Badge>
                      <Badge variant={getStatusColor(report.status)}>
                        {report.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{report.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-medium">Equipment</div>
                      <div className="text-sm text-muted-foreground">{report.equipment}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Reported By</div>
                      <div className="text-sm text-muted-foreground">{report.reportedBy}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Date</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(report.reportedAt)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Technician</div>
                      <div className="text-sm text-muted-foreground">{report.assignedTo}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="grid gap-4">
            {scheduledMaintenance.map((maintenance) => (
              <Card key={maintenance.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{maintenance.equipment}</CardTitle>
                    <Badge variant={getPriorityColor(maintenance.priority)}>
                      {maintenance.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-medium">Maintenance Type</div>
                      <div className="text-sm text-muted-foreground">{maintenance.type}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Next Due</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(maintenance.nextDue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Frequency</div>
                      <div className="text-sm text-muted-foreground">{maintenance.frequency}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Responsible</div>
                      <div className="text-sm text-muted-foreground">{maintenance.responsible}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button size="sm" variant="outline">
                      Mark as Complete
                    </Button>
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