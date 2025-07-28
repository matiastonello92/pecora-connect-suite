import { supabase } from '@/integrations/supabase/client';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useMobileNotifications } from './useMobileNotifications';

import { toast } from '@/hooks/use-toast';

interface MessageReminder {
  id: string;
  user_id: string;
  chat_id: string;
  message_id: string;
  scheduled_at: string;
  status: 'pending' | 'sent' | 'cancelled';
}

export const useMessageReminders = () => {
  const { user } = useSimpleAuth();
  const language = 'en'; // Temporarily hardcode language
  const { showMobileNotification, isMobile } = useMobileNotifications();
  

  const processReminders = async () => {
    if (!user) return;

    try {
      // Get pending reminders that are due (with proper joins)
      const { data: reminders, error } = await supabase
        .from('message_reminders')
        .select(`
          *,
          chats(
            id,
            type,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString());

      if (error) {
        console.error('Error fetching reminders:', error);
        return;
      }

      // Process each reminder
      for (const reminder of reminders || []) {
        await sendReminderNotification(reminder);
      }

    } catch (error) {
      console.error('Error processing reminders:', error);
    }
  };

  const sendReminderNotification = async (reminder: any) => {
    try {
      const chat = reminder.chats;

      if (!chat) {
        console.log('Missing chat data for reminder:', reminder.id);
        await markReminderAsCancelled(reminder.id);
        return;
      }

      // Get the message separately
      const { data: message, error: messageError } = await supabase
        .from('chat_messages')
        .select('content, sender_id, created_at')
        .eq('id', reminder.message_id)
        .single();

      if (messageError || !message) {
        console.log('Missing message data for reminder:', reminder.id, messageError);
        await markReminderAsCancelled(reminder.id);
        return;
      }

      // Get sender info
      const { data: sender } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', message.sender_id)
        .single();

      if (!sender) {
        console.log('Could not find sender for reminder:', reminder.id);
        await markReminderAsCancelled(reminder.id);
        return;
      }

      // Check if message is still unread
      const { data: participant } = await supabase
        .from('chat_participants')
        .select('last_read_at')
        .eq('chat_id', chat.id)
        .eq('user_id', user!.id)
        .single();

      if (participant && participant.last_read_at) {
        const lastReadAt = new Date(participant.last_read_at);
        const messageCreatedAt = new Date(message.created_at);
        
        // If message was read after it was created, don't send reminder
        if (lastReadAt >= messageCreatedAt) {
          await markReminderAsCancelled(reminder.id);
          return;
        }
      }

      const senderName = `${sender.first_name} ${sender.last_name}`;
      const messagePreview = message.content?.substring(0, 30) || 'New message';
      
      const title = `Unread message from ${senderName}`;
      const body = `${messagePreview}${message.content?.length > 30 ? '...' : ''}`;

      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `reminder-${chat.id}`,
          requireInteraction: false
        });

        notification.onclick = () => {
          window.focus();
          window.dispatchEvent(new CustomEvent('navigateToChat', { 
            detail: { chatId: chat.id } 
          }));
          notification.close();
        };

        setTimeout(() => notification.close(), 10000);
      }

      // Show mobile notification if on mobile
      if (isMobile) {
        await showMobileNotification(
          title,
          body,
          'message_reminder',
          { chat_id: chat.id }
        );
      }

      // Show in-app toast
      toast({
        title,
        description: body,
        duration: 8000
      });

      // Mark reminder as sent
      await markReminderAsSent(reminder.id);

    } catch (error) {
      console.error('Error sending reminder notification:', error);
    }
  };

  const markReminderAsSent = async (reminderId: string) => {
    await supabase
      .from('message_reminders')
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString() 
      })
      .eq('id', reminderId);
  };

  const markReminderAsCancelled = async (reminderId: string) => {
    await supabase
      .from('message_reminders')
      .update({ status: 'cancelled' })
      .eq('id', reminderId);
  };

  return {
    processReminders,
    sendReminderNotification
  };
};