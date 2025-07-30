/**
 * Enhanced Permission Provider
 * Role-based caching with intelligent prefetching and batch operations
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { PermissionCache } from '@/core/auth/PermissionCache';
import { useEnhancedAuth } from './EnhancedAuthProvider';
import { AppModule, AccessLevel, UserPermission } from '@/types/users';

export interface PermissionContextType {
  hasPermission: (module: AppModule, permission: 'can_read' | 'can_write' | 'can_validate' | 'can_delete') => boolean;
  batchCheckPermissions: (checks: Array<{ module: AppModule; permission: 'can_read' | 'can_write' | 'can_validate' | 'can_delete' }>) => Promise<boolean[]>;
  getUserPermissions: () => UserPermission[];
  canAccessModule: (module: AppModule) => boolean;
  preloadModulePermissions: (modules: AppModule[]) => void;
  invalidateCache: () => void;
  getCacheStats: () => any;
  isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const EnhancedPermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isAuthenticated } = useEnhancedAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [permissionCache] = useState(() => PermissionCache.getInstance());
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);

  // Load user permissions when auth state changes
  useEffect(() => {
    if (isAuthenticated && user && profile) {
      loadUserPermissions();
      // Prefetch permissions for common modules
      preloadCommonPermissions();
    } else {
      setUserPermissions([]);
    }
  }, [isAuthenticated, user, profile]);

  const loadUserPermissions = useCallback(async () => {
    if (!user || !profile) return;

    setIsLoading(true);
    try {
      const permissions = await permissionCache.getPermissions(user.id, profile.accessLevel);
      setUserPermissions(permissions);
      
      console.log('✅ Enhanced Permissions: Loaded permissions for user:', {
        userId: user.id,
        accessLevel: profile.accessLevel,
        customPermissions: permissions.length
      });
    } catch (error) {
      console.error('❌ Enhanced Permissions: Failed to load permissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, permissionCache]);

  const preloadCommonPermissions = useCallback(() => {
    if (!user || !profile) return;

    // Prefetch permissions for commonly used modules
    const commonModules: AppModule[] = [
      'chat', 'inventory_sala', 'inventory_kitchen', 'checklists'
    ];

    permissionCache.prefetchUserPermissions(user.id, profile.accessLevel);
    
    console.log('🔄 Enhanced Permissions: Prefetching common module permissions');
  }, [user, profile, permissionCache]);

  const hasPermission = useCallback((
    module: AppModule,
    permission: 'can_read' | 'can_write' | 'can_validate' | 'can_delete'
  ): boolean => {
    if (!user || !profile) return false;

    return permissionCache.hasPermissionFast(
      user.id,
      profile.accessLevel,
      module,
      permission
    );
  }, [user, profile, permissionCache]);

  const batchCheckPermissions = useCallback(async (
    checks: Array<{ module: AppModule; permission: 'can_read' | 'can_write' | 'can_validate' | 'can_delete' }>
  ): Promise<boolean[]> => {
    if (!user || !profile) return checks.map(() => false);

    return await permissionCache.batchCheckPermissions(
      user.id,
      profile.accessLevel,
      checks
    );
  }, [user, profile, permissionCache]);

  const canAccessModule = useCallback((module: AppModule): boolean => {
    return hasPermission(module, 'can_read');
  }, [hasPermission]);

  const preloadModulePermissions = useCallback((modules: AppModule[]) => {
    if (!user || !profile) return;

    modules.forEach(module => {
      // Pre-check permissions to warm cache
      ['can_read', 'can_write', 'can_validate', 'can_delete'].forEach(perm => {
        permissionCache.hasPermissionFast(
          user.id,
          profile.accessLevel,
          module,
          perm as any
        );
      });
    });

    console.log('🔄 Enhanced Permissions: Preloaded permissions for modules:', modules);
  }, [user, profile, permissionCache]);

  const invalidateCache = useCallback(() => {
    if (user) {
      permissionCache.invalidateUser(user.id);
      loadUserPermissions(); // Reload after invalidation
      console.log('♻️ Enhanced Permissions: Cache invalidated for user:', user.id);
    }
  }, [user, permissionCache, loadUserPermissions]);

  const getCacheStats = useCallback(() => {
    return permissionCache.getCacheStats();
  }, [permissionCache]);

  const getUserPermissions = useCallback(() => {
    return userPermissions;
  }, [userPermissions]);

  const contextValue = useMemo((): PermissionContextType => ({
    hasPermission,
    batchCheckPermissions,
    getUserPermissions,
    canAccessModule,
    preloadModulePermissions,
    invalidateCache,
    getCacheStats,
    isLoading,
  }), [
    hasPermission,
    batchCheckPermissions,
    getUserPermissions,
    canAccessModule,
    preloadModulePermissions,
    invalidateCache,
    getCacheStats,
    isLoading,
  ]);

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
};

export const useEnhancedPermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('useEnhancedPermissions must be used within an EnhancedPermissionProvider');
  }
  return context;
};