import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings, Save } from 'lucide-react';
import { 
  UserProfile, 
  AppModule, 
  MODULE_LABELS,
  ACCESS_LEVEL_LABELS,
  ModulePermissions,
  UserPermission 
} from '@/types/users';
import { supabase } from '@/integrations/supabase/client';

interface UserPermissionsDialogProps {
  user: UserProfile;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionsUpdated: () => void;
}

export const UserPermissionsDialog = ({ user, isOpen, onOpenChange, onPermissionsUpdated }: UserPermissionsDialogProps) => {
  const [permissions, setPermissions] = useState<Partial<Record<AppModule, ModulePermissions>>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const modules: AppModule[] = [
    'chat', 'inventory_sala', 'inventory_kitchen', 'checklists', 
    'suppliers', 'equipment', 'financial', 'cash_closure', 
    'reports', 'tasks', 'communication', 'announcements', 'user_management'
  ];

  useEffect(() => {
    if (isOpen && user.id) {
      loadUserPermissions();
    }
  }, [isOpen, user.id]);

  const loadUserPermissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const permissionsMap: Partial<Record<AppModule, ModulePermissions>> = {};
      data?.forEach((perm: any) => {
        permissionsMap[perm.module as AppModule] = {
          can_read: perm.can_read,
          can_write: perm.can_write,
          can_validate: perm.can_validate,
          can_delete: perm.can_delete
        };
      });

      setPermissions(permissionsMap);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load permissions: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (module: AppModule, permission: keyof ModulePermissions, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [permission]: checked
      }
    }));
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      // First, delete existing permissions for this user
      const { error: deleteError } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Insert new permissions
      const permissionsToInsert = Object.entries(permissions)
        .filter(([_, perms]) => perms && Object.values(perms).some(Boolean))
        .map(([module, perms]) => ({
          user_id: user.id,
          module: module as AppModule,
          ...perms
        }));

      if (permissionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('user_permissions')
          .insert(permissionsToInsert);

        if (insertError) throw insertError;
      }

      // Update user's has_custom_permissions flag
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ has_custom_permissions: permissionsToInsert.length > 0 })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });

      onPermissionsUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save permissions: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Permissions: {user.firstName} {user.lastName}
            {user.hasCustomPermissions && (
              <Badge variant="secondary" className="ml-2">Custom</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading permissions...</span>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="bg-muted/50 p-4 rounded-lg">
               <h3 className="font-medium mb-2">Current Access Level: {ACCESS_LEVEL_LABELS[user.accessLevel]}</h3>
               <p className="text-sm text-muted-foreground">
                 Custom permissions override the default access level. Only set permissions that differ from the default.
               </p>
             </div>

            <div className="grid gap-6">
              {modules.map((module) => (
                <div key={module} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">{MODULE_LABELS[module]}</h4>
                    {permissions[module] && Object.values(permissions[module]!).some(Boolean) && (
                      <Badge variant="outline">Modified</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {(['can_read', 'can_write', 'can_validate', 'can_delete'] as const).map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${module}-${permission}`}
                          checked={permissions[module]?.[permission] || false}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(module, permission, checked as boolean)
                          }
                          disabled={saving}
                        />
                        <Label 
                          htmlFor={`${module}-${permission}`} 
                          className="text-sm font-normal capitalize"
                        >
                          {permission.replace('can_', '').replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={savePermissions}
                disabled={saving}
                className="bg-primary hover:bg-primary/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Permissions
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};