import { useEffect } from 'react';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { useChatContext } from '@/context/ChatContext';

// Hook to integrate chat notifications with chat interactions
export const useChatNotifications = () => {
  const { markChatAsRead, refreshUnreadCounts } = useUnreadMessages();
  const { activeChat } = useChatContext();

  // Mark active chat as read when it changes
  useEffect(() => {
    if (activeChat) {
      console.log('Active chat changed, marking as read:', activeChat.id);
      markChatAsRead(activeChat.id);
    }
  }, [activeChat?.id, markChatAsRead]);

  // Refresh counts when returning to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing unread counts');
        refreshUnreadCounts();
      }
    };

    const handleFocus = () => {
      console.log('Window focused, refreshing unread counts');
      refreshUnreadCounts();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshUnreadCounts]);

  return { markChatAsRead, refreshUnreadCounts };
};