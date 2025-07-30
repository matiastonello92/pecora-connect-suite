/**
 * Notification Service Hook
 * Separates notification business logic from UI components
 * Phase 3: Business Logic Separation
 */

import { useState, useCallback } from 'react';
import { DataService } from '@/core/services';
import { useToast } from '@/hooks/use-toast';

export interface UseNotificationServiceOptions {
  autoShow?: boolean;
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function useNotificationService(options: UseNotificationServiceOptions = {}) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const showNotification = useCallback(async (notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    userId?: string;
    locationId?: string;
  }) => {
    try {
      await DataService.insert('notifications', {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        user_id: notification.userId,
        location_id: notification.locationId,
        created_at: new Date().toISOString()
      });
      
      if (options.autoShow) {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === 'error' ? 'destructive' : 'default'
        });
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [options.autoShow, toast]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await DataService.update('notifications', notificationId, {
        read: true,
        read_at: new Date().toISOString()
      });
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const markAllAsRead = useCallback(async (userId: string) => {
    try {
      const { data, error } = await DataService.query('notifications', {
        filters: { user_id: userId, read: false }
      });
      
      if (data) {
        await Promise.all(data.map((notif: any) => 
          DataService.update('notifications', notif.id, {
            read: true,
            read_at: new Date().toISOString()
          })
        ));
      }
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await DataService.delete('notifications', notificationId);
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const fetchNotifications = useCallback(async (userId: string, filters?: any) => {
    setIsLoading(true);
    try {
      const result = await DataService.query('notifications', {
        filters: { user_id: userId, ...filters },
        orderBy: { column: 'created_at', ascending: false }
      });
      setNotifications(result.data || []);
      return { success: true, data: result.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Backward compatibility methods
  const showSuccess = useCallback((title: string, message?: string) => {
    return showNotification({ title, message: message || '', type: 'success' });
  }, [showNotification]);

  const showError = useCallback((title: string, message?: string) => {
    return showNotification({ title, message: message || '', type: 'error' });
  }, [showNotification]);

  return {
    notifications,
    isLoading,
    showNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    showSuccess,
    showError
  };
}