import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleAuth } from './SimpleAuthContext';
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
  
  // Error state
  error: string | null;
  
  // Emergency recovery
  emergencyFixAuth: () => Promise<void>;
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
  const { profile } = useSimpleAuth();
  const { userLocations } = useLocation();
  
  
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load chats and connection requests when user or location changes
  useEffect(() => {
    if (!profile) {
      console.log('🚫 No profile in ChatContext, waiting...');
      return;
    }
    
    console.log('🚀 Profile available in ChatContext, loading chats...');
    loadChats();
    loadConnectionRequests();
  }, [profile, userLocations]);

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
      markAsRead(activeChat.id);
    } else {
      setMessages([]);
    }
  }, [activeChat]);

  const loadChats = async () => {
    if (!profile?.user_id) {
      console.log('❌ No profile user ID available for loading chats');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Loading chats for user:', profile.user_id);
      
      // Ensure user is properly synced to location chats
      try {
        const { data: syncResult } = await supabase.rpc('sync_user_chat_memberships', {
          target_user_id: profile.user_id
        });
        console.log('🔄 User sync result:', syncResult);
      } catch (syncError) {
        console.warn('⚠️ Exception syncing user to chats:', syncError);
      }

      // Get user's accessible locations from profile
      const profileLocations = profile.locations || ['menton'];
      console.log('📍 User locations:', profileLocations);
      
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
        .in('location', profileLocations)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading chats:', error);
        setError(`Failed to load chats: ${error.message}`);
        return;
      }

      console.log('📊 Raw chats data received:', data?.length || 0, 'chats');

      // Calculate unread counts for each chat
      const chatsWithUnread = await Promise.all(
        (data || []).map(async (chat) => {
          const participant = chat.participants?.find(p => p.user_id === profile.user_id);
          
          // Check if user has access to this chat
          let hasAccess = false;
          
          if (chat.type === 'private') {
            hasAccess = !!participant;
          } else if (chat.type === 'global' || chat.type === 'announcements') {
            hasAccess = profileLocations.includes(chat.location);
          }
          
          if (!hasAccess) return null;

          // Get unread count
          let unreadCount = 0;
          if (participant?.last_read_at) {
            const { count, error: countError } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_id', chat.id)
              .gt('created_at', participant.last_read_at);
            
            if (!countError) {
              unreadCount = count || 0;
            }
          }

          // Get last message
          const { data: lastMessage } = await supabase
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

          return {
            ...chat,
            unread_count: unreadCount,
            last_message: lastMessage || null
          };
        })
      );

      // Filter out null entries
      const filteredChats = chatsWithUnread.filter(chat => chat !== null);
      
      console.log('📈 Final chat list:', filteredChats.length, 'chats accessible');
      setChats(filteredChats as unknown as Chat[]);
      
    } catch (error: any) {
      console.error('💥 Unexpected error loading chats:', error);
      setError(`Unexpected chat error: ${error.message}`);
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
      toast.error('Failed to load messages');
    }
  };

  const loadConnectionRequests = async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('connection_requests')
        .select('*')
        .or(`requester_id.eq.${profile.user_id},recipient_id.eq.${profile.user_id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnectionRequests(data as unknown as ConnectionRequest[] || []);
    } catch (error: any) {
      console.error('Error loading connection requests:', error);
    }
  };

  const sendMessage = async (
    chatId: string, 
    content: string, 
    messageType: ChatMessageType = 'text',
    mediaUrl?: string
  ) => {
    if (!profile) return;
    
    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: profile.user_id,
          content,
          message_type: messageType,
          media_url: mediaUrl
        });

      if (error) throw error;
      await markAsRead(chatId);
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const markAsRead = async (chatId: string, messageId?: string) => {
    if (!profile) return;
    
    try {
      // Update participant's last_read_at
      await supabase
        .from('chat_participants')
        .upsert({
          chat_id: chatId,
          user_id: profile.user_id,
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
            user_id: profile.user_id
          }, {
            onConflict: 'message_id,user_id'
          });
      }

      await loadChats();
      window.dispatchEvent(new CustomEvent('refreshUnreadCounts'));
    } catch (error: any) {
      console.error('Error marking as read:', error);
    }
  };

  // Chat module supports multi-location views
  const filteredChats = chats.filter(chat => {
    const profileLocations = profile?.locations || ['menton'];
    const hasLocationAccess = profileLocations.includes(chat.location);
    
    if (!hasLocationAccess) return false;
    
    // Apply search filter
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
  const createChat = async (type: ChatType, name?: string, participants?: string[]): Promise<Chat | null> => {
    return null; // Simplified for now
  };

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
    if (!profile) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('chat_participants')
        .update({
          is_muted: muted,
          muted_until: mutedUntil ? mutedUntil.toISOString() : null
        })
        .eq('chat_id', chatId)
        .eq('user_id', profile.user_id);

      if (error) throw error;

      // Update local state
      setChats(prevChats => 
        prevChats.map(chat => {
          if (chat.id === chatId) {
            return {
              ...chat,
              participants: chat.participants?.map(p => 
                p.user_id === profile.user_id 
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

  const sendConnectionRequest = async (userId: string, message?: string) => {
    // Simplified implementation
    toast.error('Connection requests not available in simplified mode');
  };

  const respondToConnectionRequest = async (requestId: string, accept: boolean) => {
    // Simplified implementation
    toast.error('Connection requests not available in simplified mode');
  };

  const getConnectionStatus = async (userId: string): Promise<string> => {
    return 'none';
  };

  const canSendConnectionRequest = async (recipientId: string): Promise<boolean> => {
    return false;
  };

  const uploadMedia = async (file: File, chatId: string): Promise<string | null> => {
    if (!profile) return null;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}/${chatId}/${Date.now()}.${fileExt}`;
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
      toast.error('Failed to upload file');
      return null;
    }
  };

  const refreshChats = async () => {
    await loadChats();
    toast.success('Chat list refreshed');
  };

  const ensureUserInChats = async () => {
    if (!profile) return;
    
    try {
      const { data: syncResult } = await supabase.rpc('sync_user_chat_memberships', {
        target_user_id: profile.user_id
      });
      
      console.log('🔧 Chat sync result:', syncResult);
      await loadChats();
      toast.success('Successfully synced to chats');
    } catch (error: any) {
      console.error('Error ensuring user in chats:', error);
      toast.error('Failed to sync chats');
    }
  };

  const emergencyFixAuth = async () => {
    if (!profile) {
      toast.error('No authenticated user found');
      return;
    }
    
    try {
      // Sync user to appropriate chats
      const { data: syncResult } = await supabase.rpc('sync_user_chat_memberships', {
        target_user_id: profile.user_id
      });
      console.log('🔧 Emergency sync result:', syncResult);
      
      await loadChats();
      toast.success('Emergency authentication fix completed!');
    } catch (error: any) {
      console.error('❌ Emergency fix failed:', error);
      toast.error(`Emergency fix failed: ${error.message}`);
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
      ensureUserInChats,
      error,
      emergencyFixAuth
    }}>
      {children}
    </ChatContext.Provider>
  );
};