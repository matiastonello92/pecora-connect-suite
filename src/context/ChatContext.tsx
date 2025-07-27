import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useLocation } from './LocationContext';
import { 
  Chat, 
  ChatMessage, 
  ChatParticipant, 
  ConnectionRequest, 
  ChatNotification,
  ChatType,
  ChatMessageType
} from '@/types/communication';
import { toast } from "sonner";
import { useTranslation } from '@/lib/i18n';

interface ChatContextType {
  // Chats
  chats: Chat[];
  activeChat: Chat | null;
  setActiveChat: (chat: Chat | null) => void;
  createChat: (type: ChatType, name?: string, participants?: string[]) => Promise<Chat | null>;
  updateChat: (chatId: string, updates: Partial<Chat>) => Promise<void>;
  archiveChat: (chatId: string) => Promise<void>;
  
  // Messages
  messages: ChatMessage[];
  sendMessage: (chatId: string, content: string, messageType?: ChatMessageType, mediaUrl?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: (chatId: string, messageId?: string) => Promise<void>;
  
  // Participants
  addParticipant: (chatId: string, userId: string) => Promise<void>;
  removeParticipant: (chatId: string, userId: string) => Promise<void>;
  updateParticipantRole: (chatId: string, userId: string, role: 'admin' | 'member') => Promise<void>;
  muteChat: (chatId: string, muted: boolean, mutedUntil?: Date) => Promise<void>;
  
  // Connection requests
  connectionRequests: ConnectionRequest[];
  sendConnectionRequest: (userId: string, message?: string) => Promise<void>;
  respondToConnectionRequest: (requestId: string, accept: boolean) => Promise<void>;
  getConnectionStatus: (userId: string) => Promise<string>;
  canSendConnectionRequest: (recipientId: string) => Promise<boolean>;
  
  // Search and filters
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredChats: Chat[];
  
  // Loading states
  loading: boolean;
  sendingMessage: boolean;
  
  // Media upload
  uploadMedia: (file: File, chatId: string) => Promise<string | null>;
  
  // Manual refresh and recovery
  refreshChats: () => Promise<void>;
  ensureUserInChats: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, language } = useAuth();
  const { activeLocation, isViewingAllLocations } = useLocation();
  const { t } = useTranslation(language);
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Load chats and connection requests when user or location changes
  useEffect(() => {
    if (!user) return;
    
    loadChats();
    loadConnectionRequests();
    
    // Set up real-time subscriptions
    const chatsChannel = supabase
      .channel('chats-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chats' 
      }, () => {
        loadChats();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_participants' 
      }, () => {
        loadChats();
      })
      .subscribe();

    const messagesChannel = supabase
      .channel('messages-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_messages' 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new as ChatMessage;
          if (activeChat && newMessage.chat_id === activeChat.id) {
            loadMessages(activeChat.id);
          }
          loadChats(); // Refresh to update last_message_at
        } else if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          if (activeChat) {
            loadMessages(activeChat.id);
          }
        }
      })
      .subscribe();

    const requestsChannel = supabase
      .channel('connection-requests-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'connection_requests' 
      }, () => {
        loadConnectionRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, [user, activeChat, activeLocation]);

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
      // Mark chat as read when opening it
      markAsRead(activeChat.id);
    } else {
      setMessages([]);
    }
  }, [activeChat]);

  const loadChats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('🔄 Loading chats for user:', user.id, 'location:', user.location);
      
      // First ensure default chats exist with better error handling
      try {
        const { error: ensureError } = await supabase.rpc('ensure_default_chats');
        if (ensureError) {
          console.warn('⚠️ Error ensuring default chats:', ensureError);
          // Continue anyway - user might still see existing chats
        } else {
          console.log('✅ Default chats ensured successfully');
        }
      } catch (ensureError) {
        console.warn('⚠️ Exception ensuring default chats:', ensureError);
      }

      // Build query based on user's location - only show menton and lyon chats
      console.log('🔍 Querying chats with location filter: [menton, lyon]');
      
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          participants:chat_participants(
            *,
            user:profiles!chat_participants_user_id_fkey(
              first_name,
              last_name,
              position,
              department,
              role
            )
          )
        `)
        .in('location', ['menton', 'lyon'])
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading chats:', error);
        toast.error(`Chat loading failed: ${error.message}`);
        return;
      }

      console.log('📊 Raw chats data received:', data?.length || 0, 'chats');
      console.log('📋 Chat details:', data?.map(c => `${c.type}-${c.location} (${c.participants?.length || 0} participants)`));

      // Calculate unread counts and add last message info
      const chatsWithUnread = await Promise.all(
        (data || []).map(async (chat) => {
          const participant = chat.participants?.find(p => p.user_id === user.id);
          console.log(`🔍 Checking access for chat ${chat.type}-${chat.location}:`, {
            isParticipant: !!participant,
            userLocation: user.location,
            chatLocation: chat.location
          });
          
          // Check if user has access to this chat
          let hasAccess = false;
          
          if (chat.type === 'private') {
            // Private chats: user must be a participant
            hasAccess = !!participant;
          } else if (chat.type === 'global' || chat.type === 'announcements') {
            // Global/announcement chats: based on location access
            if (user.location === 'all_locations') {
              // Super admin sees all chats (menton and lyon)
              hasAccess = chat.location === 'menton' || chat.location === 'lyon';
            } else {
              // Regular users see their location's chats
              hasAccess = chat.location === user.location;
            }
            
            // ALSO check if user is a participant (they should be auto-joined)
            if (hasAccess && !participant) {
              console.warn(`⚠️ User should have access to ${chat.type}-${chat.location} but is not a participant!`);
            }
          }
          
          console.log(`${hasAccess ? '✅' : '❌'} Access to ${chat.type}-${chat.location}:`, hasAccess);
          
          if (!hasAccess) return null;

          // Get unread count
          let unreadCount = 0;
          if (participant?.last_read_at) {
            const { count, error: countError } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_id', chat.id)
              .gt('created_at', participant.last_read_at);
            
            if (countError) {
              console.error('Error counting unread messages:', countError);
            } else {
              unreadCount = count || 0;
            }
          }

          // Get last message
          const { data: lastMessage, error: lastMessageError } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:profiles!chat_messages_sender_id_fkey(
                first_name,
                last_name
              )
            `)
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (lastMessageError && lastMessageError.code !== 'PGRST116') {
            console.error('Error loading last message:', lastMessageError);
          }

          return {
            ...chat,
            unread_count: unreadCount,
            last_message: lastMessage || null
          };
        })
      );

      // Filter out null entries (chats user doesn't have access to)
      const filteredChats = chatsWithUnread.filter(chat => chat !== null);
      
      console.log('📈 Final chat list:', filteredChats.length, 'chats accessible');
      console.log('📝 Chat names:', filteredChats.map(c => c.name));
      
      setChats(filteredChats as unknown as Chat[]);
      
      if (filteredChats.length === 0) {
        console.warn('⚠️ No chats found! This indicates a problem with auto-join.');
        toast.error('No chats found for your location. Use the Refresh button or contact an administrator.');
      } else {
        console.log('✅ Chats loaded successfully:', filteredChats.length);
      }
    } catch (error: any) {
      console.error('💥 Unexpected error loading chats:', error);
      toast.error(`Unexpected chat error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles!chat_messages_sender_id_fkey(
            first_name,
            last_name,
            position,
            department
          )
        `)
        .eq('chat_id', chatId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data as unknown as ChatMessage[] || []);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast.error(t('communication.errorLoadingChats'));
    }
  };

  const loadConnectionRequests = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('connection_requests')
        .select(`
          *
        `)
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnectionRequests(data as unknown as ConnectionRequest[] || []);
    } catch (error: any) {
      console.error('Error loading connection requests:', error);
      toast.error(t('communication.errorLoadingChats'));
    }
  };

  const createChat = async (type: ChatType, name?: string, participants?: string[]): Promise<Chat | null> => {
    if (!user) return null;
    
    try {
      const { data: chat, error } = await supabase
        .from('chats')
        .insert({
          type,
          name,
          location: user.location || 'general',
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin
      await supabase
        .from('chat_participants')
        .insert({
          chat_id: chat.id,
          user_id: user.id,
          role: 'admin'
        });

      // Add other participants
      if (participants && participants.length > 0) {
        await supabase
          .from('chat_participants')
          .insert(
            participants.map(userId => ({
              chat_id: chat.id,
              user_id: userId,
              role: 'member' as const
            }))
          );
      }

      await loadChats();
      toast.success(t('communication.groupCreated'));
      return chat as Chat;
    } catch (error: any) {
      console.error('Error creating chat:', error);
      toast.error(t('communication.errorCreatingGroup'));
      return null;
    }
  };

  const sendMessage = async (
    chatId: string, 
    content: string, 
    messageType: ChatMessageType = 'text',
    mediaUrl?: string
  ) => {
    if (!user) return;
    
    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content,
          message_type: messageType,
          media_url: mediaUrl
        });

      if (error) throw error;

      // Create read receipt for sender
      await markAsRead(chatId);
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(t('communication.errorSendingMessage'));
    } finally {
      setSendingMessage(false);
    }
  };

  const markAsRead = async (chatId: string, messageId?: string) => {
    if (!user) return;
    
    try {
      console.log('Marking chat as read in ChatContext:', chatId);
      
      // Update participant's last_read_at
      await supabase
        .from('chat_participants')
        .upsert({
          chat_id: chatId,
          user_id: user.id,
          last_read_at: new Date().toISOString()
        }, {
          onConflict: 'chat_id,user_id'
        });

      // If specific message, create read receipt
      if (messageId) {
        await supabase
          .from('message_read_receipts')
          .upsert({
            message_id: messageId,
            user_id: user.id
          }, {
            onConflict: 'message_id,user_id'
          });
      }

      // Refresh local chat list
      await loadChats();
      
      // Trigger unread count refresh in UnreadMessagesContext
      window.dispatchEvent(new CustomEvent('refreshUnreadCounts'));
    } catch (error: any) {
      console.error('Error marking as read:', error);
    }
  };

  const sendConnectionRequest = async (userId: string, message?: string) => {
    if (!user) return;
    
    try {
      // Check if user can send a connection request
      const { data: canSend } = await supabase.rpc('can_send_connection_request', {
        requester_user_id: user.id,
        recipient_user_id: userId
      });
      
      if (!canSend) {
        toast.error(t('communication.cannotSendRequest'));
        return;
      }
      
      const { error } = await supabase
        .from('connection_requests')
        .insert({
          requester_id: user.id,
          recipient_id: userId,
          message
        });

      if (error) throw error;
      
      await loadConnectionRequests();
      toast.success(t('communication.requestSent'));
    } catch (error: any) {
      console.error('Error sending connection request:', error);
      toast.error(error.message || t('communication.errorSendingMessage'));
    }
  };

  const respondToConnectionRequest = async (requestId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ 
          status: accept ? 'accepted' : 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      
      await loadConnectionRequests();
      toast.success(accept ? t('communication.requestAccepted') : t('communication.requestDeclined'));
    } catch (error: any) {
      console.error('Error responding to connection request:', error);
      toast.error(t('communication.errorSendingMessage'));
    }
  };

  const getConnectionStatus = async (userId: string): Promise<string> => {
    if (!user) return 'none';
    
    try {
      const { data, error } = await supabase.rpc('get_connection_status', {
        user1_id: user.id,
        user2_id: userId
      });
      
      if (error) throw error;
      return data || 'none';
    } catch (error) {
      console.error('Error getting connection status:', error);
      return 'none';
    }
  };

  const canSendConnectionRequest = async (recipientId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('can_send_connection_request', {
        requester_user_id: user.id,
        recipient_user_id: recipientId
      });
      
      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking if can send connection request:', error);
      return false;
    }
  };

  const uploadMedia = async (file: File, chatId: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${chatId}/${Date.now()}.${fileExt}`;
      const bucket = file.type.startsWith('image/') ? 'chat-media' : 'chat-documents';
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading media:', error);
      toast.error(t('communication.errorUploadingFile'));
      return null;
    }
  };

  // Filtered chats based on search and location
  const filteredChats = chats.filter(chat => {
    // First apply location filter
    if (!isViewingAllLocations) {
      // If not viewing all locations, only show chats for the active location
      // Exception: always show global and announcement chats for user's location or if they have all_locations access
      const shouldShowChat = chat.location === activeLocation || 
        (chat.type === 'global' || chat.type === 'announcements');
      if (!shouldShowChat) return false;
    }
    
    // Then apply search filter
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in chat name
    if (chat.name?.toLowerCase().includes(searchLower)) return true;
    
    // Search in participant names
    const participantMatch = chat.participants?.some(p => 
      p.user && (
        p.user.first_name.toLowerCase().includes(searchLower) ||
        p.user.last_name.toLowerCase().includes(searchLower)
      )
    );
    
    if (participantMatch) return true;
    
    // Search in last message
    if (chat.last_message?.content?.toLowerCase().includes(searchLower)) return true;
    
    return false;
  });

  // Stub implementations for remaining functions
  const updateChat = async (chatId: string, updates: Partial<Chat>) => {
    // Implementation for updating chat details
  };

  const archiveChat = async (chatId: string) => {
    // Implementation for archiving chat
  };

  const editMessage = async (messageId: string, content: string) => {
    // Implementation for editing messages
  };

  const deleteMessage = async (messageId: string) => {
    // Implementation for deleting messages
  };

  const addParticipant = async (chatId: string, userId: string) => {
    // Implementation for adding participants
  };

  const removeParticipant = async (chatId: string, userId: string) => {
    // Implementation for removing participants
  };

  const updateParticipantRole = async (chatId: string, userId: string, role: 'admin' | 'member') => {
    // Implementation for updating participant roles
  };

  const muteChat = async (chatId: string, muted: boolean, mutedUntil?: Date) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('chat_participants')
        .update({
          is_muted: muted,
          muted_until: mutedUntil ? mutedUntil.toISOString() : null
        })
        .eq('chat_id', chatId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setChats(prevChats => 
        prevChats.map(chat => {
          if (chat.id === chatId) {
            return {
              ...chat,
              participants: chat.participants?.map(p => 
                p.user_id === user.id 
                  ? { ...p, is_muted: muted, muted_until: mutedUntil ? mutedUntil.toISOString() : null }
                  : p
              )
            };
          }
          return chat;
        })
      );

      console.log(`Chat ${muted ? 'muted' : 'unmuted'} successfully`);
    } catch (error: any) {
      console.error('Error muting/unmuting chat:', error);
      throw error;
    }
  };

  // Manual refresh function for recovery
  const refreshChats = async () => {
    await loadChats();
    toast.success('Chat list refreshed');
  };

  // Ensure user is properly joined to their chats
  const ensureUserInChats = async () => {
    if (!user) return;
    
    try {
      // Call the backfill function to ensure user is in appropriate chats
      const { data, error } = await supabase.rpc('backfill_user_chat_memberships');
      
      if (error) {
        console.error('Error ensuring user in chats:', error);
        toast.error('Failed to join missing chats. Please contact support.');
        return;
      }
      
      const result = data?.[0];
      if (result?.memberships_added > 0) {
        toast.success(`Successfully joined ${result.memberships_added} chat(s)`);
        await loadChats();
      } else {
        toast.success('You are already in all appropriate chats');
      }
    } catch (error: any) {
      console.error('Error ensuring user in chats:', error);
      toast.error('Failed to join missing chats. Please contact support.');
    }
  };

  return (
    <ChatContext.Provider value={{
      chats,
      activeChat,
      setActiveChat,
      createChat,
      updateChat,
      archiveChat,
      messages,
      sendMessage,
      editMessage,
      deleteMessage,
      markAsRead,
      addParticipant,
      removeParticipant,
      updateParticipantRole,
      muteChat,
      connectionRequests,
      sendConnectionRequest,
      respondToConnectionRequest,
      getConnectionStatus,
      canSendConnectionRequest,
      searchTerm,
      setSearchTerm,
      filteredChats,
      loading,
      sendingMessage,
      uploadMedia,
      refreshChats,
      ensureUserInChats
    }}>
      {children}
    </ChatContext.Provider>
  );
};