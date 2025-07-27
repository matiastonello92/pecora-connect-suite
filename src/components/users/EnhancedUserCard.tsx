import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeleteUserDialog } from '@/components/ui/delete-user-dialog';
import { UserEditDialog } from './UserEditDialog';
import { UserPermissionsDialog } from './UserPermissionsDialog';
import { UserProfile, RESTAURANT_ROLE_LABELS, ACCESS_LEVEL_LABELS } from '@/types/users';
import { User, Edit, Settings, Trash2, Plus } from 'lucide-react';

interface EnhancedUserCardProps {
  user: UserProfile;
  onDelete: (user: UserProfile) => void;
  onUpdate: () => void;
  hasPermission: (role: string) => boolean;
  showPermissions?: boolean;
}

export const EnhancedUserCard = ({ user, onDelete, onUpdate, hasPermission, showPermissions = false }: EnhancedUserCardProps) => {
  const [showEdit, setShowEdit] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-500';
      case 'manager': return 'bg-blue-500';
      case 'base': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/50">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center shrink-0">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm sm:text-base truncate">
                {user.firstName} {user.lastName}
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {user.department} • {user.position}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className={`w-2 h-2 rounded-full ${getRoleColor(user.role)}`} />
            <Badge variant="outline" className="text-xs">{user.role}</Badge>
            <Badge variant="outline" className="text-xs">
              {ACCESS_LEVEL_LABELS[user.accessLevel]}
            </Badge>
            {user.hasCustomPermissions && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowPermissionsDialog(true)}
                className="h-6 w-6 p-0 text-purple-600 hover:text-purple-800 hover:bg-purple-100 dark:text-purple-400 dark:hover:text-purple-200 dark:hover:bg-purple-900"
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {user.status}
            </Badge>
            {hasPermission('manager') && (
              <>
                <UserEditDialog
                  user={user}
                  isOpen={showEdit}
                  onOpenChange={setShowEdit}
                  onUserUpdated={onUpdate}
                />
                {!showPermissions && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowEdit(true)}
                    className="text-xs h-7 px-2"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
                <UserPermissionsDialog
                  user={user}
                  isOpen={showPermissionsDialog}
                  onOpenChange={setShowPermissionsDialog}
                  onPermissionsUpdated={onUpdate}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPermissionsDialog(true)}
                  className="text-xs h-7 px-2"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Permissions
                </Button>
                {!showPermissions && <DeleteUserDialog user={user} onDelete={onDelete} />}
              </>
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
            <div className="text-xs sm:text-sm font-medium">Role</div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {user.restaurantRole ? RESTAURANT_ROLE_LABELS[user.restaurantRole] : 'Not assigned'}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-medium">Location</div>
            <div className="text-xs sm:text-sm text-muted-foreground">{(user.locations || [user.location]).join(', ')}</div>
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-medium">Last Login</div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'}
            </div>
          </div>
        </div>
        
        {(showPermissions || user.hasCustomPermissions) && user.customPermissions && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs sm:text-sm font-medium mb-2">Custom Permissions Override</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {user.customPermissions.map((perm) => (
                <div key={perm.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                  <span className="font-medium">{perm.module}</span>
                  <div className="flex gap-1">
                    {perm.can_read && <Badge variant="outline" className="text-xs">R</Badge>}
                    {perm.can_write && <Badge variant="outline" className="text-xs">W</Badge>}
                    {perm.can_validate && <Badge variant="outline" className="text-xs">V</Badge>}
                    {perm.can_delete && <Badge variant="outline" className="text-xs">D</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};