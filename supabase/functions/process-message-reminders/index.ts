import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processing message reminders...');

    // Get pending reminders that are due (scheduled_at <= now)
    const { data: reminders, error: fetchError } = await supabase
      .from('message_reminders')
      .select(`
        *,
        chat:chats(
          id,
          type,
          name,
          participants:chat_participants(
            user:profiles(first_name, last_name)
          )
        ),
        message:chat_messages(
          content,
          created_at,
          sender_id,
          sender:profiles(first_name, last_name)
        ),
        user:profiles(first_name, last_name)
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching reminders:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch reminders' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;
    let errorCount = 0;

    // Process each reminder
    for (const reminder of reminders || []) {
      try {
        const chat = reminder.chat;
        const message = reminder.message;
        const sender = message?.sender;
        const user = reminder.user;

        if (!chat || !message || !sender || !user) {
          console.warn('Skipping reminder due to missing data:', reminder.id);
          continue;
        }

        // Check if message is still unread
        const { data: participant } = await supabase
          .from('chat_participants')
          .select('last_read_at')
          .eq('chat_id', chat.id)
          .eq('user_id', reminder.user_id)
          .single();

        if (participant && participant.last_read_at) {
          const lastReadAt = new Date(participant.last_read_at);
          const messageCreatedAt = new Date(message.created_at);
          
          // If message was read after it was created, cancel reminder
          if (lastReadAt >= messageCreatedAt) {
            await supabase
              .from('message_reminders')
              .update({ status: 'cancelled' })
              .eq('id', reminder.id);
            
            console.log('Cancelled reminder for read message:', reminder.id);
            continue;
          }
        }

        // Create a notification for the reminder
        const senderName = `${sender.first_name} ${sender.last_name}`;
        const messagePreview = message.content?.substring(0, 30) || 'New message';
        
        const title = `Unread message from ${senderName}`;
        const notificationMessage = `${messagePreview}${message.content?.length > 30 ? '...' : ''}`;

        // Insert notification
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: reminder.user_id,
            type: 'message_reminder',
            title,
            message: notificationMessage,
            location: chat.location || 'all_locations',
            data: {
              chat_id: chat.id,
              message_id: message.id,
              sender_id: message.sender_id,
              sender_name: senderName,
              is_reminder: true
            }
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
          errorCount++;
          continue;
        }

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from('message_reminders')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString() 
          })
          .eq('id', reminder.id);

        if (updateError) {
          console.error('Error updating reminder status:', updateError);
          errorCount++;
          continue;
        }

        processedCount++;
        console.log(`Processed reminder for user ${user.first_name} ${user.last_name}: ${title}`);

      } catch (error) {
        console.error('Error processing individual reminder:', error);
        errorCount++;
      }
    }

    console.log(`Reminder processing complete. Processed: ${processedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount, 
        errors: errorCount,
        total_reminders: reminders?.length || 0
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in reminder processing function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});