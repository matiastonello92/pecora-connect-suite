import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface UnreadMessagesContextType {
  totalUnreadCount: number;
  unreadCountByChat: Record<string, number>;
  refreshUnreadCounts: () => Promise<void>;
  markChatAsRead: (chatId: string) => Promise<void>;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined);

export const useUnreadMessages = () => {
  const context = useContext(UnreadMessagesContext);
  if (!context) {
    throw new Error('useUnreadMessages must be used within UnreadMessagesProvider');
  }
  return context;
};

export const UnreadMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [unreadCountByChat, setUnreadCountByChat] = useState<Record<string, number>>({});

  const getUnreadCounts = async () => {
    if (!user) return;

    try {
      console.log('Fetching unread counts for user:', user.id);

      // Get all chats the user participates in or should have access to
      const { data: userParticipants, error: participantsError } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          last_read_at,
          chat:chats(
            id,
            type,
            location
          )
        `)
        .eq('user_id', user.id);

      if (participantsError) {
        console.error('Error fetching user participants:', participantsError);
        return;
      }

      const chatCounts: Record<string, number> = {};
      let total = 0;

      // Calculate unread count for each chat the user participates in
      await Promise.all(
        (userParticipants || []).map(async (participant) => {
          const chat = participant.chat;
          if (!chat) return;

          const lastReadAt = participant.last_read_at || '1970-01-01T00:00:00Z';

          // Count unread messages since last read
          const { count, error: countError } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .neq('sender_id', user.id) // Don't count own messages
            .eq('is_deleted', false)
            .gt('created_at', lastReadAt);

          if (countError) {
            console.error('Error counting messages for chat:', chat.id, countError);
            return;
          }

          const unreadCount = count || 0;
          chatCounts[chat.id] = unreadCount;
          total += unreadCount;

          console.log(`Chat ${chat.id} (${chat.type}): ${unreadCount} unread messages`);
        })
      );

      console.log('Total unread count:', total);
      console.log('Unread counts by chat:', chatCounts);

      setUnreadCountByChat(chatCounts);
      setTotalUnreadCount(total);

      // Store in localStorage for persistence
      localStorage.setItem('unreadCounts', JSON.stringify({
        total,
        byChat: chatCounts,
        timestamp: Date.now()
      }));

    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  const markChatAsRead = async (chatId: string) => {
    if (!user) return;

    try {
      console.log('Marking chat as read:', chatId);
      
      // Update participant's last_read_at
      const { error } = await supabase
        .from('chat_participants')
        .upsert({
          chat_id: chatId,
          user_id: user.id,
          last_read_at: new Date().toISOString()
        }, {
          onConflict: 'chat_id,user_id'
        });

      if (error) {
        console.error('Error marking chat as read:', error);
        return;
      }

      // Update local state immediately
      setUnreadCountByChat(prev => {
        const updated = { ...prev };
        const chatUnreadCount = updated[chatId] || 0;
        updated[chatId] = 0;
        
        setTotalUnreadCount(current => Math.max(0, current - chatUnreadCount));
        
        return updated;
      });

      // Refresh counts to ensure accuracy
      setTimeout(() => getUnreadCounts(), 1000);

    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  const refreshUnreadCounts = async () => {
    await getUnreadCounts();
  };

  // Initialize and set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Load initial counts
    getUnreadCounts();

    // Load persisted counts immediately for better UX
    const stored = localStorage.getItem('unreadCounts');
    if (stored) {
      try {
        const { total, byChat, timestamp } = JSON.parse(stored);
        // Only use stored data if it's less than 5 minutes old
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setTotalUnreadCount(total || 0);
          setUnreadCountByChat(byChat || {});
        }
      } catch (error) {
        console.error('Error parsing stored unread counts:', error);
      }
    }

    // Custom event listener for refresh requests
    const handleRefreshRequest = () => {
      console.log('Received refresh request, updating unread counts');
      getUnreadCounts();
    };
    
    window.addEventListener('refreshUnreadCounts', handleRefreshRequest);

    // Set up real-time subscription for new messages
    const messagesChannel = supabase
      .channel('unread-messages-tracking')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        console.log('New message received:', payload);
        const newMessage = payload.new as any;
        
        // Only count if it's not from the current user
        if (newMessage.sender_id !== user.id) {
          // Refresh counts to get accurate data
          setTimeout(() => getUnreadCounts(), 500);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_participants'
      }, (payload) => {
        console.log('Chat participant updated:', payload);
        const participant = payload.new as any;
        
        // If this is the current user's participant record being updated
        if (participant.user_id === user.id) {
          setTimeout(() => getUnreadCounts(), 500);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      window.removeEventListener('refreshUnreadCounts', handleRefreshRequest);
    };
  }, [user]);

  // Refresh counts when user location changes
  useEffect(() => {
    if (user) {
      getUnreadCounts();
    }
  }, [user?.location]);

  return (
    <UnreadMessagesContext.Provider 
      value={{
        totalUnreadCount,
        unreadCountByChat,
        refreshUnreadCounts,
        markChatAsRead
      }}
    >
      {children}
    </UnreadMessagesContext.Provider>
  );
};