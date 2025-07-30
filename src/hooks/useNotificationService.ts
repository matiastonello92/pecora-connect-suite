import { useCallback } from 'react';
import { toast } from 'sonner';

interface NotificationOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  dismissible?: boolean;
}

/**
 * Centralized notification service hook
 * Eliminates duplication of toast notification patterns
 */
export function useNotificationService() {
  const showSuccess = useCallback((
    message: string,
    description?: string,
    options?: NotificationOptions
  ) => {
    toast.success(message, {
      description,
      duration: options?.duration,
      dismissible: options?.dismissible
    });
  }, []);

  const showError = useCallback((
    message: string,
    description?: string,
    options?: NotificationOptions
  ) => {
    toast.error(message, {
      description,
      duration: options?.duration,
      dismissible: options?.dismissible
    });
  }, []);

  const showWarning = useCallback((
    message: string,
    description?: string,
    options?: NotificationOptions
  ) => {
    toast.warning(message, {
      description,
      duration: options?.duration,
      dismissible: options?.dismissible
    });
  }, []);

  const showInfo = useCallback((
    message: string,
    description?: string,
    options?: NotificationOptions
  ) => {
    toast.info(message, {
      description,
      duration: options?.duration,
      dismissible: options?.dismissible
    });
  }, []);

  // Predefined notification templates
  const notifyOperation = useCallback((
    operation: string,
    success: boolean,
    customMessage?: string
  ) => {
    if (success) {
      showSuccess(
        customMessage || `${operation} completed successfully`,
        undefined,
        { duration: 3000 }
      );
    } else {
      showError(
        customMessage || `Failed to ${operation.toLowerCase()}`,
        'Please try again or contact support if the problem persists',
        { duration: 5000 }
      );
    }
  }, [showSuccess, showError]);

  const notifyDataChange = useCallback((
    action: 'created' | 'updated' | 'deleted',
    itemType: string,
    success: boolean = true
  ) => {
    const actionMap = {
      created: 'created',
      updated: 'updated', 
      deleted: 'deleted'
    };
    
    notifyOperation(
      `${itemType} ${actionMap[action]}`,
      success
    );
  }, [notifyOperation]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    notifyOperation,
    notifyDataChange
  };
}