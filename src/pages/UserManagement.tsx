import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserManagement } from '@/context/UserManagementContext';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Clock, Calendar, UserPlus, Shield } from 'lucide-react';

export const UserManagement = () => {
  const { language } = useAuth();
  const { t } = useTranslation(language);
  const { users, shifts, getActiveShifts, getTodayTimeEntries } = useUserManagement();

  const activeShifts = getActiveShifts();
  const todayEntries = getTodayTimeEntries();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-500';
      case 'manager': return 'bg-blue-500';
      case 'base': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('userManagement')}</h1>
          <p className="text-muted-foreground">Staff and user administration</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{users.length}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{activeShifts.length}</div>
                <div className="text-sm text-muted-foreground">Active Shifts</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{todayEntries.length}</div>
                <div className="text-sm text-muted-foreground">Clock-ins Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'manager' || u.role === 'super_admin').length}
                </div>
                <div className="text-sm text-muted-foreground">Managers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {user.firstName} {user.lastName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{user.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getRoleColor(user.role)}`} />
                      <Badge variant="outline">{user.role}</Badge>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-medium">Email</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Department</div>
                      <div className="text-sm text-muted-foreground">{user.department}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Employment</div>
                      <div className="text-sm text-muted-foreground">{user.employmentType}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Last Login</div>
                      <div className="text-sm text-muted-foreground">
                        {user.lastLogin?.toLocaleDateString() || 'Never'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shifts">
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Shift management interface</p>
          </div>
        </TabsContent>

        <TabsContent value="timesheet">
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Timesheet tracking interface</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};