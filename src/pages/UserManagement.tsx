import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserManagement } from '@/context/UserManagementContext';
import { InviteUserDialog } from '@/components/auth/InviteUserDialog';
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">{t('userManagement')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Staff and user administration</p>
        </div>
        <div className="shrink-0">
          <InviteUserDialog />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold">{users.length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold">{activeShifts.length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Active Shifts</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold">{todayEntries.length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Clock-ins Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold">
                  {users.filter(u => u.role === 'manager' || u.role === 'super_admin').length}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Managers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="text-sm">Users</TabsTrigger>
          <TabsTrigger value="shifts" className="text-sm">Shifts</TabsTrigger>
          <TabsTrigger value="timesheet" className="text-sm">Timesheet</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-3 sm:gap-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm sm:text-base truncate">
                          {user.firstName} {user.lastName}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`w-2 h-2 rounded-full ${getRoleColor(user.role)}`} />
                      <Badge variant="outline" className="text-xs">{user.role}</Badge>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium">Email</div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium">Department</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">{user.department}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium">Employment</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">{user.employmentType}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium">Last Login</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
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
            <p className="text-sm sm:text-base">Shift management interface</p>
          </div>
        </TabsContent>

        <TabsContent value="timesheet">
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm sm:text-base">Timesheet tracking interface</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};