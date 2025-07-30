import { useState, useCallback } from 'react';
import { showErrorToast, showSuccessToast } from '@/lib/errorHandling';

interface UseLoadingStateOptions {
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

/**
 * Centralized loading state management hook
 * Eliminates duplication of loading/error/success patterns across components
 */
export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    overrideOptions?: Partial<UseLoadingStateOptions>
  ): Promise<T | null> => {
    const opts = { ...options, ...overrideOptions };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      
      if (opts.showSuccessToast !== false && opts.successMessage) {
        showSuccessToast(opts.successMessage);
      }
      
      return result;
    } catch (err: any) {
      const errorMsg = err.message || opts.errorMessage || 'An error occurred';
      setError(errorMsg);
      
      if (opts.showErrorToast !== false) {
        showErrorToast(err, { operation: 'operation' });
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    executeAsync,
    reset,
    setError
  };
}