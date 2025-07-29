import { useContext, createContext, ReactNode } from 'react';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { AppModule, AccessLevel, UserProfile } from '@/types/users';

interface PermissionContextType {
  hasModulePermission: (module: AppModule, permission: 'can_read' | 'can_write' | 'can_validate' | 'can_delete') => boolean;
  getUserPermissions: (userId: string) => any;
  canAccessModule: (module: AppModule) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useSimpleAuth();
  const { hasPermission: hasModulePermission } = usePermissions({
    userId: profile?.user_id,
    accessLevel: profile?.accessLevel as AccessLevel || 'base'
  });

  const getUserPermissions = (userId: string) => {
    const { permissions } = usePermissions({ userId });
    return permissions;
  };

  const canAccessModule = (module: AppModule): boolean => {
    return hasModulePermission(module, 'can_read');
  };

  const value = {
    hasModulePermission,
    getUserPermissions,
    canAccessModule
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const useUserPermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('useUserPermissions must be used within a PermissionProvider');
  }
  return context;
};