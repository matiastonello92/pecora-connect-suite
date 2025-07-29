import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useLocation } from '@/context/LocationContext';
import { Chat, ChatMessage } from '@/types/communication';
import { useCallback, useMemo } from 'react';

// Query key factories for consistent caching
export const chatKeys = {
  all: ['chats'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  list: (userId: string, locations: string[]) => [...chatKeys.lists(), userId, locations] as const,
  detail: (id: string) => [...chatKeys.all, 'detail', id] as const,
  messages: (chatId: string) => [...chatKeys.all, 'messages', chatId] as const,
  unreadCounts: (userId: string) => [...chatKeys.all, 'unread', userId] as const,
};

// Optimized hook to fetch chats with unread counts in a single operation
export const useOptimizedChats = () => {
  const { profile } = useSimpleAuth();
  const { userLocations } = useLocation();
  const queryClient = useQueryClient();

  const chatsQuery = useQuery({
    queryKey: chatKeys.list(profile?.user_id || '', userLocations),
    queryFn: async () => {
      if (!profile?.user_id) throw new Error('No profile available');

      // Single optimized query to get chats with unread counts using CTE
      const { data, error } = await supabase.rpc('get_chats_with_unread_counts', {
        user_id: profile.user_id,
        user_locations: userLocations
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.user_id && userLocations.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes for chat list
  });

  const refreshChats = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
  }, [queryClient]);

  return {
    chats: chatsQuery.data || [],
    loading: chatsQuery.isLoading,
    error: chatsQuery.error?.message || null,
    refreshChats,
  };
};

// Optimized hook for chat messages with virtual scrolling preparation
export const useOptimizedMessages = (chatId: string | null) => {
  const messagesQuery = useQuery({
    queryKey: chatKeys.messages(chatId || ''),
    queryFn: async () => {
      if (!chatId) return [];

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
      return data as unknown as ChatMessage[] || [];
    },
    enabled: !!chatId,
    staleTime: 1000 * 60 * 1, // 1 minute for messages
  });

  return {
    messages: messagesQuery.data || [],
    loading: messagesQuery.isLoading,
    error: messagesQuery.error?.message || null,
  };
};

// Debounced mutation for sending messages
export const useSendMessage = () => {
  const { profile } = useSimpleAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      chatId, 
      content, 
      messageType = 'text',
      mediaUrl 
    }: {
      chatId: string;
      content: string;
      messageType?: string;
      mediaUrl?: string;
    }) => {
      if (!profile) throw new Error('No profile available');

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
    },
    onSuccess: (_, variables) => {
      // Invalidate messages for this chat
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.chatId) });
      // Invalidate chat list to update last message
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
};

// Optimized unread counts hook
export const useOptimizedUnreadCounts = () => {
  const { profile } = useSimpleAuth();

  const unreadQuery = useQuery({
    queryKey: chatKeys.unreadCounts(profile?.user_id || ''),
    queryFn: async () => {
      if (!profile?.user_id) return { total: 0, byChat: {} };

      const { data, error } = await supabase.rpc('get_user_unread_counts', {
        user_id: profile.user_id
      });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.user_id,
    staleTime: 1000 * 30, // 30 seconds for unread counts
    refetchInterval: 1000 * 60, // Refetch every minute
  });

  return {
    totalUnreadCount: unreadQuery.data?.total || 0,
    unreadCountByChat: unreadQuery.data?.byChat || {},
    loading: unreadQuery.isLoading,
  };
};

// Mutation for marking messages as read with optimistic updates
export const useMarkAsRead = () => {
  const { profile } = useSimpleAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string) => {
      if (!profile) throw new Error('No profile available');

      const { error } = await supabase
        .from('chat_participants')
        .upsert({
          chat_id: chatId,
          user_id: profile.user_id,
          last_read_at: new Date().toISOString()
        }, {
          onConflict: 'chat_id,user_id'
        });

      if (error) throw error;
    },
    onMutate: async (chatId) => {
      // Optimistic update for unread counts
      const unreadKey = chatKeys.unreadCounts(profile?.user_id || '');
      
      await queryClient.cancelQueries({ queryKey: unreadKey });
      
      const previousData = queryClient.getQueryData(unreadKey);
      
      queryClient.setQueryData(unreadKey, (old: any) => {
        if (!old) return old;
        const chatUnreadCount = old.byChat[chatId] || 0;
        return {
          total: Math.max(0, old.total - chatUnreadCount),
          byChat: { ...old.byChat, [chatId]: 0 }
        };
      });

      return { previousData };
    },
    onError: (err, chatId, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        const unreadKey = chatKeys.unreadCounts(profile?.user_id || '');
        queryClient.setQueryData(unreadKey, context.previousData);
      }
    },
    onSettled: () => {
      // Refetch to ensure accuracy
      queryClient.invalidateQueries({ queryKey: chatKeys.unreadCounts(profile?.user_id || '') });
    },
  });
};