import { supabase } from '@/integrations/supabase/client';

export const createReminderService = () => {
  let processingInterval: NodeJS.Timeout | null = null;

  const startService = () => {
    if (processingInterval) return;

    // Process reminders every 5 minutes
    processingInterval = setInterval(async () => {
      try {
        // Call the edge function to process reminders
        const { error } = await supabase.functions.invoke('process-message-reminders');
        
        if (error) {
          console.error('Error processing message reminders:', error);
        }
      } catch (error) {
        console.error('Error calling reminder service:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    console.log('Message reminder service started');
  };

  const stopService = () => {
    if (processingInterval) {
      clearInterval(processingInterval);
      processingInterval = null;
      console.log('Message reminder service stopped');
    }
  };

  return {
    start: startService,
    stop: stopService
  };
};

// Singleton instance
export const reminderService = createReminderService();