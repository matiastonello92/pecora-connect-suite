import React, { ReactNode } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useAsyncData } from '@/hooks/useAsyncData';

interface AsyncOperationProps<T> {
  operation: () => Promise<T>;
  children: (data: T, refetch: () => Promise<void>) => ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: (error: string, retry: () => Promise<void>) => ReactNode;
  dependencies?: any[];
  immediate?: boolean;
}

/**
 * Render prop component for consistent async operation handling
 * Eliminates duplication of async data loading patterns
 */
export function AsyncOperation<T>({
  operation,
  children,
  loadingComponent,
  errorComponent,
  dependencies = [],
  immediate = true
}: AsyncOperationProps<T>) {
  const { data, loading, error, refetch } = useAsyncData(operation, {
    immediate,
    dependencies
  });

  if (loading) {
    return loadingComponent || <LoadingSpinner text="Loading..." />;
  }

  if (error) {
    if (errorComponent) {
      return errorComponent(error, refetch);
    }
    
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  return <>{children(data, refetch)}</>;
}