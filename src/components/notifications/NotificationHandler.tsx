import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChatContext } from '@/context/ChatContext';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';

export const NotificationHandler: React.FC = () => {
  const { user } = useAuth();
  const { messages, activeChat } = useChatContext();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user || !('Notification' in window)) return;

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [user]);

  useEffect(() => {
    if (!messages.length || !user) return;

    const latestMessage = messages[messages.length - 1];
    
    // Don't notify for own messages or messages in active chat
    if (latestMessage.sender_id === user.id || 
        (activeChat && latestMessage.chat_id === activeChat.id)) {
      return;
    }

    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      const notification = new Notification(
        t('communication.newMessage', { name: 'Someone' }),
        {
          body: latestMessage.content?.substring(0, 100) || 'New message',
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        }
      );

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }

    // Show in-app toast notification
    toast({
      title: t('communication.newMessage', { name: 'Someone' }),
      description: latestMessage.content?.substring(0, 100) || 'New message'
    });
  }, [messages, user, activeChat, t]);

  return null; // This component doesn't render anything
};