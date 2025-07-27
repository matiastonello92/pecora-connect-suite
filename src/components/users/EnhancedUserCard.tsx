import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DeleteUserDialog } from '@/components/ui/delete-user-dialog';
import { UserEditDialog } from './UserEditDialog';
import { UserPermissionsDialog } from './UserPermissionsDialog';
import { Users, MoreVertical, Edit, Settings, Trash2, Plus } from 'lucide-react';
import { 
  UserProfile, 
  RESTAURANT_ROLE_LABELS, 
  ACCESS_LEVEL_LABELS 
} from '@/types/users';

interface EnhancedUserCardProps {
  user: UserProfile;
  onDelete: (userId: string) => void;
  onUpdate: () => void;
  hasPermission: (permission: string) => boolean;
  showPermissions?: boolean;
}

export const EnhancedUserCard = ({ user, onDelete, onUpdate, hasPermission, showPermissions = false }: EnhancedUserCardProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-500';
      case 'manager': return 'bg-blue-500';
      case 'base': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'general_manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'manager_sala': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'manager_cucina': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'assistant_manager': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'financial_department': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'communication_department': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'observer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'base': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base truncate">
                  {user.firstName} {user.lastName}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {user.restaurantRole && (
                    <span className="text-sm text-muted-foreground">
                      {RESTAURANT_ROLE_LABELS[user.restaurantRole]}
                    </span>
                  )}
                  {!user.restaurantRole && user.position && (
                    <span className="text-sm text-muted-foreground">
                      {user.position}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-2 h-2 rounded-full ${getRoleColor(user.role)}`} />
              <Badge 
                variant="outline" 
                className={`text-xs ${getAccessLevelColor(user.accessLevel)}`}
              >
                {ACCESS_LEVEL_LABELS[user.accessLevel]}
              </Badge>
              {user.hasCustomPermissions && (
                <Badge variant="secondary" className="text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Custom
                </Badge>
              )}
              <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                {user.status}
              </Badge>
              {hasPermission('manager') && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPermissionsDialogOpen(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Permissions
                    </DropdownMenuItem>
                    <DeleteUserDialog user={user} onDelete={onDelete} />
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">Email</div>
              <div className="text-sm text-muted-foreground truncate">{user.email}</div>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">Department</div>
              <div className="text-sm text-muted-foreground">{user.department}</div>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">Location</div>
              <div className="text-sm text-muted-foreground">{user.location}</div>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">Last Login</div>
              <div className="text-sm text-muted-foreground">
                {user.lastLogin?.toLocaleDateString() || 'Never'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <UserEditDialog
        user={user}
        isOpen={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUserUpdated={onUpdate}
      />

      <UserPermissionsDialog
        user={user}
        isOpen={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
        onPermissionsUpdated={onUpdate}
      />
    </>
  );
};