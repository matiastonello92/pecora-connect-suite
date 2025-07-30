import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppModule, AccessLevel, UserPermission } from '@/types/users';

interface UsePermissionsProps {
  userId?: string;
  accessLevel?: AccessLevel;
}

export const usePermissions = ({ userId, accessLevel }: UsePermissionsProps = {}) => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(false);

  // Default permissions based on access level
  const getDefaultPermissions = (level: AccessLevel): Partial<Record<AppModule, { can_read: boolean; can_write: boolean; can_validate: boolean; can_delete: boolean }>> => {
    switch (level) {
      case 'base':
        return {
          chat: { can_read: true, can_write: true, can_validate: false, can_delete: false },
          equipment: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          inventory_sala: { can_read: true, can_write: true, can_validate: false, can_delete: false },
          inventory_kitchen: { can_read: true, can_write: true, can_validate: false, can_delete: false },
          checklists: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          suppliers: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          communication: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          tasks: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          financial: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          cash_closure: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          reports: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          announcements: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          user_management: { can_read: false, can_write: false, can_validate: false, can_delete: false }
        };
        
      case 'manager_sala':
        return {
          chat: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          equipment: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          inventory_sala: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          inventory_kitchen: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          checklists: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          suppliers: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          communication: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          tasks: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          financial: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          cash_closure: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          reports: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          announcements: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          user_management: { can_read: false, can_write: false, can_validate: false, can_delete: false }
        };
        
      case 'manager_cucina':
        return {
          chat: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          equipment: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          inventory_sala: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          inventory_kitchen: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          checklists: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          suppliers: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          communication: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          tasks: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          financial: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          cash_closure: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          reports: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          announcements: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          user_management: { can_read: false, can_write: false, can_validate: false, can_delete: false }
        };
        
      case 'general_manager':
        const fullAccess = { can_read: true, can_write: true, can_validate: true, can_delete: true };
        return {
          chat: fullAccess,
          inventory_sala: fullAccess,
          inventory_kitchen: fullAccess,
          checklists: fullAccess,
          suppliers: fullAccess,
          equipment: fullAccess,
          financial: fullAccess,
          cash_closure: fullAccess,
          reports: fullAccess,
          tasks: fullAccess,
          communication: fullAccess,
          announcements: fullAccess,
          user_management: fullAccess
        };
        
      case 'assistant_manager':
        return {
          chat: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          equipment: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          inventory_sala: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          inventory_kitchen: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          checklists: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          suppliers: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          communication: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          tasks: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          financial: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          cash_closure: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          reports: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          announcements: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          user_management: { can_read: true, can_write: true, can_validate: true, can_delete: false }
        };
        
      case 'financial_department':
        return {
          chat: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          equipment: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          inventory_sala: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          inventory_kitchen: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          checklists: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          suppliers: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          communication: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          tasks: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          financial: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          cash_closure: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          reports: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          announcements: { can_read: true, can_write: false, can_validate: false, can_delete: false },
          user_management: { can_read: false, can_write: false, can_validate: false, can_delete: false }
        };
        
      case 'communication_department':
        return {
          chat: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          equipment: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          inventory_sala: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          inventory_kitchen: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          checklists: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          suppliers: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          communication: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          tasks: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          financial: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          cash_closure: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          reports: { can_read: false, can_write: false, can_validate: false, can_delete: false },
          announcements: { can_read: true, can_write: true, can_validate: true, can_delete: false },
          user_management: { can_read: false, can_write: false, can_validate: false, can_delete: false }
        };
        
      case 'observer':
        const readOnly = { can_read: true, can_write: false, can_validate: false, can_delete: false };
        return {
          chat: readOnly,
          inventory_sala: readOnly,
          inventory_kitchen: readOnly,
          checklists: readOnly,
          suppliers: readOnly,
          equipment: readOnly,
          financial: readOnly,
          cash_closure: readOnly,
          reports: readOnly,
          tasks: readOnly,
          communication: readOnly,
          announcements: readOnly,
          user_management: readOnly
        };
        
      default:
        return {} as any;
    }
  };

  const loadPermissions = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      
      const transformedPermissions = (data || []).map(perm => ({
        ...perm,
        created_at: new Date(perm.created_at),
        updated_at: new Date(perm.updated_at)
      }));
      
      setPermissions(transformedPermissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (module: AppModule, permission: 'can_read' | 'can_write' | 'can_validate' | 'can_delete'): boolean => {
    console.log('🔍 usePermissions.hasPermission called:', {
      module,
      permission,
      accessLevel,
      userId,
      permissionsCount: permissions.length
    });
    
    if (!accessLevel) {
      console.log('❌ No accessLevel provided to hasPermission');
      return false;
    }
    
    // Check custom permissions first
    const customPerm = permissions.find(p => p.module === module);
    if (customPerm) {
      console.log('✅ Found custom permission:', customPerm);
      return customPerm[permission];
    }
    
    // Fall back to default permissions
    const defaults = getDefaultPermissions(accessLevel);
    const result = defaults[module]?.[permission] || false;
    
    console.log('🔍 Default permission result:', {
      defaults: defaults[module],
      result
    });
    
    return result;
  };

  useEffect(() => {
    if (userId) {
      loadPermissions();
    }
  }, [userId]);

  return {
    permissions,
    loading,
    hasPermission,
    getDefaultPermissions,
    refetch: loadPermissions
  };
};