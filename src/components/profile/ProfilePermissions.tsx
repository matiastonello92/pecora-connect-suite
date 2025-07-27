import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Save, RotateCcw } from 'lucide-react';
import { UserProfile, AppModule, MODULE_LABELS, ModulePermissions } from '@/types/users';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProfilePermissionsProps {
  user: UserProfile;
}

export const ProfilePermissions = ({ user }: ProfilePermissionsProps) => {
  const { t } = useTranslation('en');
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Partial<Record<AppModule, ModulePermissions>>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAdmin = currentUser && ['manager', 'super_admin'].includes(currentUser.role || '');
  const canEdit = isAdmin && currentUser?.id !== user.id;

  const modules: AppModule[] = [
    'chat', 'inventory_sala', 'inventory_kitchen', 'checklists', 
    'suppliers', 'equipment', 'financial', 'cash_closure', 
    'reports', 'tasks', 'communication', 'announcements', 'user_management'
  ];

  useEffect(() => {
    loadUserPermissions();
  }, [user.id]);

  const loadUserPermissions = async () => {
    if (!user.id) return;
    
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
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
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
    if (!user.id) return;
    
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
        title: t('common.success'),
        description: t('profile.messages.permissionsUpdated'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setPermissions({});
    toast({
      title: t('profile.messages.permissionsReset'),
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('profile.messages.loadingPermissions')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Access Level */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('profile.sections.currentAccess')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-base">
              {t(`access_levels.${user.accessLevel}`)}
            </Badge>
            {user.hasCustomPermissions && (
              <Badge variant="secondary">
                {t('profile.badges.customPermissions')}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {t('profile.descriptions.customPermissions')}
          </p>
        </CardContent>
      </Card>

      {/* Module Permissions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('profile.sections.modulePermissions')}</CardTitle>
          {canEdit && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefaults}
                disabled={saving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('profile.actions.resetToDefaults')}
              </Button>
              <Button
                onClick={savePermissions}
                disabled={saving}
                size="sm"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {t('profile.actions.savePermissions')}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {modules.map((module) => (
              <div key={module} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">{MODULE_LABELS[module]}</h4>
                  {permissions[module] && Object.values(permissions[module]!).some(Boolean) && (
                    <Badge variant="outline" className="text-xs">
                      {t('profile.badges.modified')}
                    </Badge>
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
                        disabled={!canEdit || saving}
                      />
                      <Label 
                        htmlFor={`${module}-${permission}`} 
                        className="text-sm font-normal capitalize cursor-pointer"
                      >
                        {t(`profile.permissions.${permission.replace('can_', '')}`)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {!canEdit && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                {currentUser?.id === user.id 
                  ? t('profile.messages.cannotEditOwnPermissions')
                  : t('profile.messages.noPermissionToEdit')
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};