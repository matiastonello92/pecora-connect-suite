/**
 * Error Handling Utilities
 * Migrated from /lib/errorHandling.ts
 */

import React from 'react';
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
    appError = new AppError('An unknown error occurred', 'UNKNOWN_ERROR', context);
  }

  // Log error with context
  console.error('Application error:', {
    message: appError.message,
    code: appError.code,
    context: appError.context,
    timestamp: appError.timestamp,
    stack: appError.stack,
  });

  return appError;
}

export function showSuccessToast(message: string): void {
  toast.success(message);
}

export function showErrorToast(message: string): void {
  toast.error(message);
}

export function showInfoToast(message: string): void {
  toast.info(message);
}

export function showWarningToast(message: string): void {
  toast.warning(message);
}

// Error boundary helper
export function withErrorBoundary<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  errorMessage?: string
) {
  return (props: T) => {
    try {
      return React.createElement(Component, props);
    } catch (error) {
      const appError = handleError(error, { component: Component.name });
      showErrorToast(errorMessage || appError.message);
      return null;
    }
  };
}