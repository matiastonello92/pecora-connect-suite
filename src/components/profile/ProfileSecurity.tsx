import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Shield, UserX, RotateCcw, History, Download } from 'lucide-react';
import { UserProfile, UserRole, AccessLevel, LocationType, RESTAURANT_ROLE_LABELS, ACCESS_LEVEL_LABELS } from '@/types/users';

import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProfileSecurityProps {
  user: UserProfile;
}

export const ProfileSecurity = ({ user }: ProfileSecurityProps) => {
  
  const { profile: currentProfile } = useSimpleAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if current user is admin/super_admin
  const isAdmin = currentProfile && ['manager', 'super_admin'].includes(currentProfile.role || '');
  
  // Don't show admin controls if not admin or if viewing own profile
  if (!isAdmin || currentProfile?.user_id === user.user_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Access restricted. Only administrators can manage security settings.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleRoleChange = async (field: string, value: string) => {
    if (!user.user_id) return;
    
    setIsUpdating(true);
    try {
      const updateData: any = { updated_at: new Date().toISOString() };
      
      if (field === 'role') {
        updateData.role = value;
      } else if (field === 'restaurant_role') {
        updateData.restaurant_role = value === 'none' ? null : value;
      } else if (field === 'access_level') {
        updateData.access_level = value;
      } else if (field === 'location') {
        updateData.location = value;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUserAction = async (action: 'suspend' | 'reactivate' | 'delete') => {
    if (!user.user_id) return;
    
    setIsUpdating(true);
    try {
      if (action === 'delete') {
        // Archive the user instead of deleting
        const { error } = await supabase
          .from('archived_users')
          .insert({
            original_user_id: user.user_id,
            first_name: user.firstName,
            last_name: user.lastName,
            email: user.email,
            role: user.role,
            restaurant_role: user.restaurantRole,
            access_level: user.accessLevel,
            locations: user.locations || ['menton'],
            department: user.department,
            position: user.position,
            previous_status: user.status,
            reason: 'admin_deletion',
            archived_by: currentProfile?.user_id,
          });

        if (error) throw error;

        // Delete the profile
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('user_id', user.user_id);

        if (deleteError) throw deleteError;
      } else {
        const status = action === 'suspend' ? 'suspended' : 'active';
        const { error } = await supabase
          .from('profiles')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('user_id', user.user_id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `User ${action}d successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Password reset email sent to user",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertTriangle className="h-5 w-5" />
            Administrator Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            These actions require administrator privileges and will affect user access and security.
          </p>
        </CardContent>
      </Card>

      {/* Role Management */}
      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">System Role</label>
              <Select
                value={user.role}
                onValueChange={(value) => handleRoleChange('role', value)}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">Base User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Restaurant Role</label>
              <Select
                value={user.restaurantRole || 'none'}
                onValueChange={(value) => handleRoleChange('restaurant_role', value)}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select restaurant role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific role</SelectItem>
                  {Object.entries(RESTAURANT_ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Access Level</label>
              <Select
                value={user.accessLevel}
                onValueChange={(value) => handleRoleChange('access_level', value)}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCESS_LEVEL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <div className="text-sm text-muted-foreground">
                Current locations: {user.locations?.join(', ') || 'No locations'}
              </div>
              <p className="text-xs text-muted-foreground">
                Contact an administrator to change location assignments.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handlePasswordReset}
              disabled={isUpdating}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Password
            </Button>

            {user.status === 'active' ? (
              <Button
                variant="outline"
                onClick={() => handleUserAction('suspend')}
                disabled={isUpdating}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                  <UserX className="h-4 w-4 mr-2" />
                  Suspend User
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => handleUserAction('reactivate')}
                disabled={isUpdating}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reactivate User
              </Button>
            )}
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              onClick={() => handleUserAction('delete')}
              disabled={isUpdating}
              className="w-full"
            >
              <UserX className="h-4 w-4 mr-2" />
              Delete User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <History className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Activity log will be displayed here when implemented
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Export Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export User Data
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Export functionality will be available soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
};