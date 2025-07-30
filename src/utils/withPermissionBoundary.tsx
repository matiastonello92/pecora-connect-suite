import React, { ReactNode } from 'react';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { AppModule } from '@/types/users';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface PermissionBoundaryProps {
  children: ReactNode;
  module: AppModule;
  permission: 'can_read' | 'can_write' | 'can_validate' | 'can_delete';
  fallback?: ReactNode;
  showError?: boolean;
}

/**
 * Component-level permission boundary
 * Eliminates duplication of permission checking in components
 */
function PermissionBoundary({
  children,
  module,
  permission,
  fallback,
  showError = true
}: PermissionBoundaryProps) {
  const { requirePermission, isAuthenticated } = usePermissionGuard();

  if (!isAuthenticated) {
    return showError ? (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          Please log in to access this feature.
        </AlertDescription>
      </Alert>
    ) : null;
  }

  const hasPermission = requirePermission(module, permission);

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return showError ? (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access this feature.
        </AlertDescription>
      </Alert>
    ) : null;
  }

  return <>{children}</>;
}

/**
 * HOC for adding permission boundaries to components
 * Eliminates duplication of permission wrapper logic
 */
export function withPermissionBoundary<P extends object>(
  Component: React.ComponentType<P>,
  module: AppModule,
  permission: 'can_read' | 'can_write' | 'can_validate' | 'can_delete',
  options?: {
    fallback?: ReactNode;
    showError?: boolean;
  }
) {
  function WrappedComponent(props: P) {
    return (
      <PermissionBoundary
        module={module}
        permission={permission}
        fallback={options?.fallback}
        showError={options?.showError}
      >
        <Component {...props} />
      </PermissionBoundary>
    );
  }

  WrappedComponent.displayName = `withPermissionBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export { PermissionBoundary };