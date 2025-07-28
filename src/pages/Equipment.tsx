import React from 'react';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useEquipment } from '@/context/EquipmentContext';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wrench, AlertTriangle, Calendar, CheckCircle, Plus } from 'lucide-react';

export const Equipment = () => {
  const language = 'en'; // Temporarily hardcode language
  
  const { equipment, getOverdueMaintenance, getUpcomingMaintenance } = useEquipment();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-600';
      case 'maintenance': return 'bg-yellow-600';
      case 'broken': return 'bg-destructive';
      case 'retired': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Equipment</h1>
          <p className="text-muted-foreground">Equipment and maintenance management</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Equipment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {equipment.filter(e => e.status === 'operational').length}
                </div>
                <div className="text-sm text-muted-foreground">Operational</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">
                  {equipment.filter(e => e.status === 'maintenance').length}
                </div>
                <div className="text-sm text-muted-foreground">Maintenance</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <div className="text-2xl font-bold">
                  {equipment.filter(e => e.status === 'broken').length}
                </div>
                <div className="text-sm text-muted-foreground">Broken</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">
                  {getUpcomingMaintenance(7).length}
                </div>
                <div className="text-sm text-muted-foreground">Due Soon</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="equipment" className="space-y-6">
        <TabsList>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-4">
          {equipment.length > 0 ? (
            <div className="grid gap-4">
              {equipment.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`} />
                        <CardTitle>{item.name}</CardTitle>
                        <Badge variant="outline">{item.category}</Badge>
                      </div>
                      <Badge variant={item.status === 'operational' ? 'default' : 'destructive'}>
                        {item.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm font-medium">Location</div>
                        <div className="text-sm text-muted-foreground">{item.location}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Department</div>
                        <div className="text-sm text-muted-foreground">{item.department}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Model</div>
                        <div className="text-sm text-muted-foreground">{item.model || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Next Maintenance</div>
                        <div className="text-sm text-muted-foreground">
                          {item.nextMaintenance?.toLocaleDateString() || 'Not scheduled'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No equipment registered</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="maintenance">
          <div className="text-center py-8 text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Maintenance records will be displayed here</p>
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Maintenance schedule will be displayed here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};