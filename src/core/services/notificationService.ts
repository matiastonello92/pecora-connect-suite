/**
 * Notification Service
 * Centralizes all notification and toast logic
 */

import { toast } from 'sonner';

export interface NotificationOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  dismissible?: boolean;
}

export class NotificationService {
  static showSuccess(
    message: string,
    description?: string,
    options?: NotificationOptions
  ) {
    toast.success(message, {
      description,
      duration: options?.duration,
      dismissible: options?.dismissible
    });
  }

  static showError(
    message: string,
    description?: string,
    options?: NotificationOptions
  ) {
    toast.error(message, {
      description,
      duration: options?.duration,
      dismissible: options?.dismissible
    });
  }

  static showWarning(
    message: string,
    description?: string,
    options?: NotificationOptions
  ) {
    toast.warning(message, {
      description,
      duration: options?.duration,
      dismissible: options?.dismissible
    });
  }

  static showInfo(
    message: string,
    description?: string,
    options?: NotificationOptions
  ) {
    toast.info(message, {
      description,
      duration: options?.duration,
      dismissible: options?.dismissible
    });
  }

  // Predefined notification templates
  static notifyOperation(
    operation: string,
    success: boolean,
    customMessage?: string
  ) {
    if (success) {
      this.showSuccess(
        customMessage || `${operation} completed successfully`,
        undefined,
        { duration: 3000 }
      );
    } else {
      this.showError(
        customMessage || `Failed to ${operation.toLowerCase()}`,
        'Please try again or contact support if the problem persists',
        { duration: 5000 }
      );
    }
  }

  static notifyDataChange(
    action: 'created' | 'updated' | 'deleted',
    itemType: string,
    success: boolean = true
  ) {
    const actionMap = {
      created: 'created',
      updated: 'updated', 
      deleted: 'deleted'
    };
    
    this.notifyOperation(
      `${itemType} ${actionMap[action]}`,
      success
    );
  }
}

// Legacy exports for backward compatibility
export const showSuccess = NotificationService.showSuccess.bind(NotificationService);
export const showError = NotificationService.showError.bind(NotificationService);
export const showWarning = NotificationService.showWarning.bind(NotificationService);
export const showInfo = NotificationService.showInfo.bind(NotificationService);
export const notifyOperation = NotificationService.notifyOperation.bind(NotificationService);
export const notifyDataChange = NotificationService.notifyDataChange.bind(NotificationService);