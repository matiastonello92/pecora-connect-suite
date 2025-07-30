import React, { useEffect, useState } from 'react';
import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserManagement } from '@/context/UserManagementContext';
import { DeleteUserDialog } from '@/components/ui/delete-user-dialog';
import { DeleteInvitationDialog } from '@/components/ui/delete-invitation-dialog';
import { ReactivateUserDialog } from '@/components/ui/reactivate-user-dialog';
import { SimpleInviteUserDialog } from '@/components/auth/SimpleInviteUserDialog';
import { SimpleUserCard } from '@/components/users/SimpleUserCard';

import { useUserDeletionValidation } from '@/hooks/useUserDeletionValidation';
import { SimpleUserList } from '@/components/management/SimpleUserList';
import { UserValidationPanel } from '@/components/management/UserValidationPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Mail, RefreshCw, Archive, AlertTriangle, Shield } from 'lucide-react';

export const UserManagement = () => {
  const { user } = useEnhancedAuth();
  
  const hasPermission = (permission: string) => true; // Temporarily allow all permissions
  
  const location = useLocation();
  const navigate = useNavigate();
  const { users, pendingInvitations, archivedUsers, resendInvitation, deleteUser, deletePendingInvitation, reactivateUser } = useUserManagement();
  const { hasIssues, errors, warnings, isValidating, runValidation } = useUserDeletionValidation();

  // Determine active tab based on route
  const getActiveTab = () => {
    if (location.pathname === '/users/invitations') return 'invitations';
    if (location.pathname === '/users/roles') return 'roles';
    return 'users';
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  // Update tab when route changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  // Handle tab change and navigate
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case 'invitations':
        navigate('/users/invitations');
        break;
      case 'roles':
        navigate('/users/roles');
        break;
      default:
        navigate('/users');
        break;
    }
  };


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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
            {hasIssues && (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">Manage users, roles, and permissions</p>
          {hasIssues && (
            <div className="mt-2 text-sm text-destructive">
              {errors.length > 0 && `${errors.length} critical issues detected`}
              {warnings.length > 0 && ` • ${warnings.length} warnings`}
            </div>
          )}
        </div>
        <div className="shrink-0 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runValidation}
            disabled={isValidating}
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            {isValidating ? 'Validating...' : 'System Check'}
          </Button>
          <SimpleInviteUserDialog />
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
                <div className="text-lg sm:text-2xl font-bold">{archivedUsers.filter(user => user.previousStatus === 'active').length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Archived Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="text-sm">Users</TabsTrigger>
          <TabsTrigger value="invitations" className="text-sm">Invitations</TabsTrigger>
          <TabsTrigger value="roles" className="text-sm">Roles & Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <SimpleUserList
            users={users}
            onDelete={deleteUser}
          />
            
          {/* Archived Users Section - Only show if users had completed registration */}
          {archivedUsers.filter(user => user.previousStatus === 'active').length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Archived Users</h3>
              <div className="grid gap-3 sm:gap-4">
                {archivedUsers
                  .filter(user => user.previousStatus === 'active')
                  .map((user) => (
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
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                          {user.previousStatus}
                        </Badge>
                        {user.canReactivate && (
                          <ReactivateUserDialog user={user} onReactivate={() => reactivateUser(user)} />
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
                        <div className="text-xs sm:text-sm text-muted-foreground">{user.locations?.join(', ') || 'No locations'}</div>
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
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
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
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
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
                      <DeleteInvitationDialog invitation={invitation} onDelete={deletePendingInvitation} />
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
                      <div className="text-xs sm:text-sm font-medium">Status</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {invitation.status}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium">Location</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">{invitation.locations?.join(', ') || 'No locations'}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3">
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
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-3 sm:gap-4">
            {/* All Users */}
            {users.map((user) => (
              <SimpleUserCard
                key={user.user_id}
                user={user}
                onDelete={deleteUser}
              />
            ))}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};