import { useCallback } from 'react';
import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';
import { useEnhancedPermissions } from '@/providers/EnhancedPermissionProvider';
import { AppModule, AccessLevel } from '@/types/users';

interface UsePermissionGuardOptions {
  redirectOnFail?: boolean;
  showError?: boolean;
  fallbackComponent?: React.ComponentType;
}

/**
 * Enhanced permission checking hook with caching
 * Uses EnhancedPermissions for better performance
 */
export function usePermissionGuard(options: UsePermissionGuardOptions = {}) {
  const { profile, user } = useEnhancedAuth();
  const { hasPermission } = useEnhancedPermissions();

  const checkPermission = useCallback((
    module: AppModule, 
    permission: 'can_read' | 'can_write' | 'can_validate' | 'can_delete'
  ): boolean => {
    if (!user || !profile) return false;
    return hasPermission(module, permission);
  }, [user, profile, hasPermission]);

  const checkModuleAccess = useCallback((module: AppModule): boolean => {
    return checkPermission(module, 'can_read');
  }, [checkPermission]);

  const requirePermission = useCallback((
    module: AppModule,
    permission: 'can_read' | 'can_write' | 'can_validate' | 'can_delete'
  ): boolean => {
    const hasAccess = checkPermission(module, permission);
    
    if (!hasAccess && options.showError) {
      console.warn(`Permission denied: ${module}.${permission}`);
    }
    
    return hasAccess;
  }, [checkPermission, options.showError]);

  const isAdmin = useCallback((): boolean => {
    return profile?.role === 'super_admin' || profile?.role === 'manager';
  }, [profile?.role]);

  return {
    checkPermission,
    checkModuleAccess,
    requirePermission,
    isAdmin,
    isAuthenticated: !!user,
    profile,
    user
  };
}