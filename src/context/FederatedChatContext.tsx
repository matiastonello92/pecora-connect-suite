import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleAuth } from '@/context/SimpleAuthContext';

/**
 * FederatedChatContext: Manages the new federated chat system
 * Handles location hierarchy groups, auto-join logic, and message pagination
 */

export interface LocationChatGroup {
  id: string;
  name: string;
  description: string;
  location_pattern: string[];
  chat_type: 'regional' | 'city_wide' | 'district' | 'department' | 'role_based' | 'emergency';
  hierarchy_level: number;
  required_roles: string[];
  auto_join_enabled: boolean;
  max_participants: number;
  archive_after_days: number;
  priority: number;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface FederatedChat {
  id: string;
  name: string;
  description?: string;
  type: 'group' | 'private' | 'global' | 'announcements';
  location_group_id?: string;
  is_federated: boolean;
  participant_count: number;
  location: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  locationGroup?: LocationChatGroup;
}

export interface PaginatedMessage {
  message_id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  message_type: 'text' | 'image' | 'file' | 'audio' | 'video';
  media_url?: string;
  media_type?: string;
  created_at: string;
  is_edited: boolean;
  is_archived: boolean;
  reply_to_id?: string;
}

interface FederatedChatContextType {
  // Chat groups
  availableChatGroups: LocationChatGroup[];
  userFederatedChats: FederatedChat[];
  
  // Auto-join functionality
  autoJoinFederatedChats: () => Promise<void>;
  checkUserGroupEligibility: (groupId: string) => boolean;
  
  // Message pagination
  getMessagePage: (chatId: string, page: number, includeArchived?: boolean) => Promise<PaginatedMessage[]>;
  loadMoreMessages: (chatId: string, beforeTimestamp: string, includeArchived?: boolean) => Promise<PaginatedMessage[]>;
  
  // Archive management
  archiveOldMessages: (chatId: string, daysOld?: number) => Promise<number>;
  
  // Loading states
  isLoadingGroups: boolean;
  isLoadingChats: boolean;
  isAutoJoining: boolean;
  
  // Error states
  groupsError: Error | null;
  chatsError: Error | null;
}

const FederatedChatContext = createContext<FederatedChatContextType | undefined>(undefined);

interface FederatedChatProviderProps {
  children: React.ReactNode;
}

export const FederatedChatProvider: React.FC<FederatedChatProviderProps> = ({ children }) => {
  const { user } = useSimpleAuth();
  const queryClient = useQueryClient();
  const [messagePagination, setMessagePagination] = useState<Record<string, { page: number; hasMore: boolean }>>({});

  // Load available chat groups for user
  const {
    data: availableChatGroups = [],
    isLoading: isLoadingGroups,
    error: groupsError
  } = useQuery({
    queryKey: ['location-chat-groups', user?.id],
    queryFn: async (): Promise<LocationChatGroup[]> => {
      const { data, error } = await supabase
        .from('location_chat_groups')
        .select('*')
        .eq('is_active', true)
        .order('hierarchy_level')
        .order('priority', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Load user's federated chats
  const {
    data: userFederatedChats = [],
    isLoading: isLoadingChats,
    error: chatsError
  } = useQuery({
    queryKey: ['federated-chats', user?.id],
    queryFn: async (): Promise<FederatedChat[]> => {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          locationGroup:location_chat_groups(*)
        `)
        .eq('is_federated', true)
        .in('id', 
          supabase
            .from('chat_participants')
            .select('chat_id')
            .eq('user_id', user?.id || '')
        )
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Auto-join mutation
  const autoJoinMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase.rpc('auto_join_federated_chats', {
        target_user_id: user.id
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate chats to refresh the list
      queryClient.invalidateQueries({ queryKey: ['federated-chats', user?.id] });
    },
  });

  // Auto-join function
  const autoJoinFederatedChats = useCallback(async () => {
    await autoJoinMutation.mutateAsync();
  }, [autoJoinMutation]);

  // Check if user is eligible for a specific group
  const checkUserGroupEligibility = useCallback((groupId: string): boolean => {
    const group = availableChatGroups.find(g => g.id === groupId);
    if (!group || !user) return false;

    // This would typically check against user's profile data
    // For now, return true if group exists and user is authenticated
    return true;
  }, [availableChatGroups, user]);

  // Get paginated messages
  const getMessagePage = useCallback(async (
    chatId: string, 
    page: number = 1, 
    includeArchived: boolean = false
  ): Promise<PaginatedMessage[]> => {
    const pageSize = 50;
    const offset = (page - 1) * pageSize;
    
    const { data, error } = await supabase.rpc('get_chat_messages_paginated', {
      chat_id_param: chatId,
      page_size: pageSize,
      before_timestamp: null,
      include_archived: includeArchived
    });

    if (error) throw error;
    
    // Update pagination state
    setMessagePagination(prev => ({
      ...prev,
      [chatId]: {
        page,
        hasMore: (data || []).length === pageSize
      }
    }));

    return data || [];
  }, []);

  // Load more messages (infinite scroll)
  const loadMoreMessages = useCallback(async (
    chatId: string,
    beforeTimestamp: string,
    includeArchived: boolean = false
  ): Promise<PaginatedMessage[]> => {
    const pageSize = 50;
    
    const { data, error } = await supabase.rpc('get_chat_messages_paginated', {
      chat_id_param: chatId,
      page_size: pageSize,
      before_timestamp: beforeTimestamp,
      include_archived: includeArchived
    });

    if (error) throw error;
    
    // Update pagination state
    const currentPage = messagePagination[chatId]?.page || 1;
    setMessagePagination(prev => ({
      ...prev,
      [chatId]: {
        page: currentPage + 1,
        hasMore: (data || []).length === pageSize
      }
    }));

    return data || [];
  }, [messagePagination]);

  // Archive old messages
  const archiveOldMessages = useCallback(async (
    chatId: string, 
    daysOld: number = 90
  ): Promise<number> => {
    const { data, error } = await supabase.rpc('archive_old_messages', {
      chat_id_param: chatId,
      days_old: daysOld
    });

    if (error) throw error;
    
    // Invalidate message queries for this chat
    queryClient.invalidateQueries({ 
      queryKey: ['chat-messages', chatId] 
    });

    return data || 0;
  }, [queryClient]);

  // Auto-join on mount and profile changes
  useEffect(() => {
    if (user?.id && availableChatGroups.length > 0) {
      autoJoinFederatedChats();
    }
  }, [user?.id, availableChatGroups.length, autoJoinFederatedChats]);

  const value: FederatedChatContextType = {
    availableChatGroups,
    userFederatedChats,
    autoJoinFederatedChats,
    checkUserGroupEligibility,
    getMessagePage,
    loadMoreMessages,
    archiveOldMessages,
    isLoadingGroups,
    isLoadingChats,
    isAutoJoining: autoJoinMutation.isPending,
    groupsError: groupsError as Error | null,
    chatsError: chatsError as Error | null,
  };

  return (
    <FederatedChatContext.Provider value={value}>
      {children}
    </FederatedChatContext.Provider>
  );
};

export const useFederatedChat = (): FederatedChatContextType => {
  const context = useContext(FederatedChatContext);
  if (!context) {
    throw new Error('useFederatedChat must be used within a FederatedChatProvider');
  }
  return context;
};

/**
 * Hook for managing infinite scroll pagination in chat messages
 */
export const useChatMessagePagination = (chatId: string, includeArchived: boolean = false) => {
  const { getMessagePage, loadMoreMessages } = useFederatedChat();
  const [messages, setMessages] = useState<PaginatedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load initial messages
  const loadInitialMessages = useCallback(async () => {
    if (!chatId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const initialMessages = await getMessagePage(chatId, 1, includeArchived);
      setMessages(initialMessages);
      setHasMore(initialMessages.length === 50); // Assuming page size of 50
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [chatId, includeArchived, getMessagePage]);

  // Load more messages for infinite scroll
  const loadMore = useCallback(async () => {
    if (!chatId || !hasMore || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const oldestMessage = messages[messages.length - 1];
      if (!oldestMessage) return;
      
      const moreMessages = await loadMoreMessages(
        chatId, 
        oldestMessage.created_at, 
        includeArchived
      );
      
      setMessages(prev => [...prev, ...moreMessages]);
      setHasMore(moreMessages.length === 50); // Check if there are more messages
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [chatId, hasMore, isLoading, messages, includeArchived, loadMoreMessages]);

  // Reset when chat changes
  useEffect(() => {
    setMessages([]);
    setHasMore(true);
    setError(null);
    loadInitialMessages();
  }, [chatId, includeArchived, loadInitialMessages]);

  // Add new message to the list (for real-time updates)
  const addMessage = useCallback((newMessage: PaginatedMessage) => {
    setMessages(prev => [newMessage, ...prev]);
  }, []);

  return {
    messages,
    isLoading,
    hasMore,
    error,
    loadMore,
    addMessage,
    reload: loadInitialMessages
  };
};