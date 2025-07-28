import { toast } from 'sonner';

export interface ErrorContext {
  operation?: string;
  component?: string;
  userId?: string;
  details?: Record<string, any>;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', context: ErrorContext = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
  }
}

export function handleError(error: unknown, context: ErrorContext = {}): AppError {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new AppError(error.message, 'GENERIC_ERROR', context);
  } else {
    appError = new AppError(String(error), 'UNKNOWN_ERROR', context);
  }

  // Log error for debugging
  console.error('Application Error:', {
    message: appError.message,
    code: appError.code,
    context: appError.context,
    timestamp: appError.timestamp,
    stack: appError.stack
  });

  return appError;
}

export function showErrorToast(error: unknown, context: ErrorContext = {}) {
  const appError = handleError(error, context);
  
  toast.error(appError.message, {
    description: context.operation ? `Failed to ${context.operation}` : undefined,
  });
}

export function showSuccessToast(message: string, description?: string) {
  toast.success(message, { description });
}

// Common error types
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  SERVER_ERROR: 'SERVER_ERROR'
} as const;