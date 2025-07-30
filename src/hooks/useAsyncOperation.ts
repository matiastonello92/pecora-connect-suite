import { useState, useCallback } from 'react';
import { useLoadingState } from './useLoadingState';

interface AsyncOperationOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
  resetOnSuccess?: boolean;
}

/**
 * Hook for standardized async operations with consistent loading/error/success handling
 * Eliminates duplication of async operation patterns
 */
export function useAsyncOperation<T = any>(
  operation: (...args: any[]) => Promise<T>,
  options: AsyncOperationOptions = {}
) {
  const { executeAsync, isLoading, error, reset } = useLoadingState({
    successMessage: options.successMessage,
    errorMessage: options.errorMessage
  });

  const execute = useCallback(async (...args: any[]) => {
    const result = await executeAsync(async () => {
      return await operation(...args);
    });

    if (result !== null) {
      options.onSuccess?.(result);
      if (options.resetOnSuccess) {
        reset();
      }
    } else if (error) {
      options.onError?.(error);
    }

    return result;
  }, [executeAsync, operation, options, error, reset]);

  return {
    execute,
    isLoading,
    error,
    reset
  };
}