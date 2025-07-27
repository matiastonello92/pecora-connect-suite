import { toast } from '@/hooks/use-toast';

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Standard error interface
export interface AppError {
  message: string;
  severity: ErrorSeverity;
  code?: string;
  originalError?: Error;
  context?: Record<string, any>;
}

// Error reporting function
export const reportError = (error: AppError) => {
  console.error('App Error:', {
    message: error.message,
    severity: error.severity,
    code: error.code,
    context: error.context,
    originalError: error.originalError
  });

  // In production, send to error monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error reporting service
    // errorMonitoringService.captureException(error);
  }
};

// User-friendly error display
export const showErrorToUser = (error: AppError) => {
  const getErrorMessage = () => {
    switch (error.severity) {
      case 'critical':
        return 'A critical error occurred. Please refresh the page or contact support.';
      case 'high':
        return error.message || 'An important operation failed. Please try again.';
      case 'medium':
        return error.message || 'Something went wrong. Please try again.';
      case 'low':
        return error.message || 'A minor issue occurred.';
      default:
        return 'An unexpected error occurred.';
    }
  };

  toast({
    title: 'Error',
    description: getErrorMessage(),
    variant: error.severity === 'critical' || error.severity === 'high' ? 'destructive' : 'default'
  });

  // Report the error for monitoring
  reportError(error);
};

// Helper function to create standardized errors
export const createError = (
  message: string,
  severity: ErrorSeverity = 'medium',
  options?: {
    code?: string;
    originalError?: Error;
    context?: Record<string, any>;
  }
): AppError => ({
  message,
  severity,
  code: options?.code,
  originalError: options?.originalError,
  context: options?.context
});

// Async operation wrapper with error handling
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorContext: {
    message: string;
    severity?: ErrorSeverity;
    showToUser?: boolean;
  }
): Promise<T | null> => {
  try {
    return await operation();
  } catch (originalError) {
    const error = createError(
      errorContext.message,
      errorContext.severity || 'medium',
      {
        originalError: originalError instanceof Error ? originalError : new Error(String(originalError)),
        context: { timestamp: new Date().toISOString() }
      }
    );

    if (errorContext.showToUser !== false) {
      showErrorToUser(error);
    } else {
      reportError(error);
    }

    return null;
  }
};

// Network error handler
export const handleNetworkError = (error: any, context: string) => {
  const isNetworkError = !navigator.onLine || error?.message?.includes('fetch');
  
  if (isNetworkError) {
    showErrorToUser(createError(
      'Network connection issue. Please check your internet connection.',
      'medium',
      { context: { operation: context } }
    ));
  } else {
    showErrorToUser(createError(
      `Failed to ${context}. Please try again.`,
      'medium',
      { originalError: error, context: { operation: context } }
    ));
  }
};