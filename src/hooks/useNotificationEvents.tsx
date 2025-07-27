import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Custom hook to trigger unread count refresh events
export const useNotificationEvents = () => {
  useEffect(() => {
    const triggerUnreadRefresh = () => {
      // Dispatch a custom event that UnreadMessagesContext can listen to
      window.dispatchEvent(new CustomEvent('refreshUnreadCounts'));
    };

    // Set up real-time subscription for chat participants updates
    const participantsChannel = supabase
      .channel('notification-participants-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_participants'
      }, () => {
        console.log('Chat participant updated, triggering unread refresh');
        setTimeout(triggerUnreadRefresh, 500);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
    };
  }, []);
};