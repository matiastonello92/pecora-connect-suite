import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

// Capacitor Local Notifications for mobile support
interface LocalNotification {
  title: string;
  body: string;
  id: number;
  schedule?: {
    at: Date;
  };
  sound?: string;
  attachments?: Array<{
    id: string;
    url: string;
    options?: {
      type: string;
    };
  }>;
  actionTypeId?: string;
  extra?: any;
}

declare global {
  interface Window {
    Capacitor?: {
      platform: string;
      isNativePlatform: () => boolean;
    };
    CapacitorNotifications?: {
      requestPermissions: () => Promise<{ display: string }>;
      schedule: (options: { notifications: LocalNotification[] }) => Promise<void>;
      addListener: (event: string, callback: (notification: any) => void) => { remove: () => void };
    };
  }
}

export const useMobileNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Only initialize if running on mobile (Capacitor)
    if (!window.Capacitor?.isNativePlatform()) {
      return;
    }

    const requestPermissions = async () => {
      try {
        if (window.CapacitorNotifications) {
          await window.CapacitorNotifications.requestPermissions();
        }
      } catch (error) {
        console.error('Error requesting mobile notification permissions:', error);
      }
    };

    requestPermissions();

    // Set up notification tap handler
    const notificationListener = window.CapacitorNotifications?.addListener(
      'localNotificationActionPerformed',
      (notification) => {
        console.log('Notification tapped:', notification);
        
        // Handle notification tap
        if (notification.notification?.extra) {
          const { type, chat_id, request_id } = notification.notification.extra;
          
          if (type === 'private_message' && chat_id) {
            // Navigate to chat
            window.dispatchEvent(new CustomEvent('navigateToChat', { 
              detail: { chatId: chat_id } 
            }));
          } else if (type === 'connection_request') {
            // Navigate to connection requests
            window.dispatchEvent(new CustomEvent('openConnectionRequests'));
          }
        }
      }
    );

    return () => {
      notificationListener?.remove();
    };
  }, [user]);

  const showMobileNotification = async (
    title: string,
    body: string,
    type: string,
    extraData: any = {}
  ) => {
    if (!window.Capacitor?.isNativePlatform() || !window.CapacitorNotifications) {
      return;
    }

    try {
      const notification: LocalNotification = {
        title,
        body,
        id: Date.now(),
        extra: {
          type,
          ...extraData
        }
      };

      await window.CapacitorNotifications.schedule({
        notifications: [notification]
      });
    } catch (error) {
      console.error('Error showing mobile notification:', error);
    }
  };

  return {
    showMobileNotification,
    isMobile: window.Capacitor?.isNativePlatform() || false
  };
};