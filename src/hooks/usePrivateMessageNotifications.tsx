import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useChatContext } from '@/context/ChatContext';
import { useTranslation } from '@/lib/i18n';
import { toast } from '@/hooks/use-toast';

interface NotificationData {
  chat_id?: string;
  message_id?: string;
  sender_id?: string;
  sender_name?: string;
  request_id?: string;
  requester_id?: string;
  requester_name?: string;
  recipient_id?: string;
  recipient_name?: string;
}

interface DatabaseNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: NotificationData;
  created_at: string;
}

export const usePrivateMessageNotifications = () => {
  const { user } = useSimpleAuth();
  const language = 'en'; // Temporarily hardcode language
  const { setActiveChat, activeChat } = useChatContext();
  const { t } = useTranslation(language);

  useEffect(() => {
    if (!user) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Set up real-time subscription for notifications
    const notificationsChannel = supabase
      .channel('private-message-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, async (payload) => {
        const notification = payload.new as DatabaseNotification;
        await handleNewNotification(notification);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, [user]);

  const handleNewNotification = async (notification: DatabaseNotification) => {
    const { type, title, message, data } = notification;

    // Skip if user is in the active chat where the message was sent
    if (type === 'private_message' && activeChat?.id === data.chat_id) {
      return;
    }

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `${type}-${data.chat_id || data.request_id}`,
        requireInteraction: false
      });

      // Handle notification click
      browserNotification.onclick = () => {
        window.focus();
        if (type === 'private_message' && data.chat_id) {
          // Navigate to the specific chat
          navigateToChat(data.chat_id);
        } else if (type === 'connection_request') {
          // Navigate to connection requests
          navigateToConnectionRequests();
        }
        browserNotification.close();
      };

      // Auto close after 8 seconds
      setTimeout(() => browserNotification.close(), 8000);
    }

    // Show in-app toast notification
    toast({
      title,
      description: message,
      duration: 5000
    });

    // Mark notification as read after a short delay
    setTimeout(() => {
      markNotificationAsRead(notification.id);
    }, 1000);
  };

  const navigateToChat = async (chatId: string) => {
    try {
      // Simply dispatch an event to let the chat system handle navigation
      window.dispatchEvent(new CustomEvent('navigateToChat', { 
        detail: { chatId } 
      }));
    } catch (error) {
      console.error('Error navigating to chat:', error);
    }
  };

  const navigateToConnectionRequests = () => {
    // This could trigger opening the connection requests dialog or navigate to a specific route
    // For now, we'll dispatch a custom event that the ConnectionRequestManager can listen to
    window.dispatchEvent(new CustomEvent('openConnectionRequests'));
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return {
    handleNewNotification,
    navigateToChat,
    navigateToConnectionRequests
  };
};