import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserManagement } from '@/context/UserManagementContext';
import { DeleteUserDialog } from '@/components/ui/delete-user-dialog';
import { DeleteInvitationDialog } from '@/components/ui/delete-invitation-dialog';
import { ReactivateUserDialog } from '@/components/ui/reactivate-user-dialog';
import { InviteUserDialog } from '@/components/auth/InviteUserDialog';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Mail, RefreshCw, Archive } from 'lucide-react';

export const UserManagement = () => {
  const { language, user, hasPermission } = useAuth();
  const { t } = useTranslation(language);
  const { users, pendingInvitations, archivedUsers, resendInvitation, deleteUser, deletePendingInvitation, reactivateUser } = useUserManagement();


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

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold">{users.length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Active Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold">{pendingInvitations.length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Pending Invites</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Archive className="h-6 w-6 sm:h-8 sm:w-8 text-gray-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold">{archivedUsers.length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Archived Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="text-sm">Users</TabsTrigger>
          <TabsTrigger value="archived" className="text-sm">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-3 sm:gap-4">
            {/* Pending Invitations */}
            {pendingInvitations.map((invitation) => (
              <Card key={invitation.id} className="border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/50">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center shrink-0">
                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm sm:text-base truncate">
                          {invitation.first_name} {invitation.last_name}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">Invitation Pending</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`w-2 h-2 rounded-full ${getRoleColor(invitation.role)}`} />
                      <Badge variant="outline" className="text-xs">{invitation.role}</Badge>
                      <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        pending
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resendInvitation(invitation)}
                        className="text-xs h-7 px-2"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Resend
                      </Button>
                      {hasPermission('manager') && (
                        <DeleteInvitationDialog invitation={invitation} onDelete={deletePendingInvitation} />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium">Email</div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">{invitation.email}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium">Location</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">{invitation.location}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium">Invited</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium">Expires</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Active Users */}
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
                      {hasPermission('manager') && (
                        <DeleteUserDialog user={user} onDelete={deleteUser} />
                      )}
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

        <TabsContent value="archived" className="space-y-4">
          <div className="grid gap-3 sm:gap-4">
            {archivedUsers.map((user) => (
              <Card key={user.id} className="border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950/50">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center shrink-0">
                        <Archive className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm sm:text-base truncate">
                          {user.firstName} {user.lastName}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">Archived User</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`w-2 h-2 rounded-full ${getRoleColor(user.role)}`} />
                      <Badge variant="outline" className="text-xs">{user.role}</Badge>
                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                        {user.previousStatus}
                      </Badge>
                      {hasPermission('manager') && user.canReactivate && (
                        <ReactivateUserDialog user={user} onReactivate={reactivateUser} />
                      )}
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
                      <div className="text-xs sm:text-sm font-medium">Location</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">{user.location}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium">Last Login</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {user.metadata && typeof user.metadata === 'object' && (user.metadata as any)?.lastLogin 
                          ? new Date((user.metadata as any).lastLogin).toLocaleDateString() 
                          : 'Never'}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium">Archived</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {user.archivedAt.toLocaleDateString()}
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