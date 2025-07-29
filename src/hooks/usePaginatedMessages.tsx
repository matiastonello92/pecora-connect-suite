import { useState, useCallback, useRef, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/communication';

interface PaginatedMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  media_url: string | null;
  created_at: string;
  is_edited: boolean;
  is_deleted: boolean;
  sender_info: any;
  read_receipts: any[];
  total_count: number;
}

interface UsePaginatedMessagesOptions {
  chatId: string;
  pageSize?: number;
  enabled?: boolean;
}

export const usePaginatedMessages = ({ 
  chatId, 
  pageSize = 50, 
  enabled = true 
}: UsePaginatedMessagesOptions) => {
  const [totalMessages, setTotalMessages] = useState(0);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const scrollPositionRef = useRef<number>(0);

  // Infinite query for loading older messages (scrolling up)
  const {
    data,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['paginated-messages', chatId],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('get_paginated_messages', {
        p_chat_id: chatId,
        p_cursor: pageParam?.cursor || null,
        p_limit: pageSize,
        p_direction: pageParam?.direction || 'before'
      });

      if (error) throw error;
      
      const messages = data as PaginatedMessage[];
      if (messages.length > 0) {
        setTotalMessages(messages[0].total_count);
      }
      
      return {
        messages: messages.map(msg => ({
          id: msg.id,
          chat_id: msg.chat_id,
          sender_id: msg.sender_id,
          content: msg.content,
          message_type: msg.message_type as any,
          media_url: msg.media_url,
          created_at: msg.created_at,
          is_edited: msg.is_edited,
          is_deleted: msg.is_deleted,
          sender: msg.sender_info,
          read_receipts: msg.read_receipts
        } as ChatMessage)),
        nextCursor: messages.length === pageSize ? messages[messages.length - 1]?.created_at : null,
        prevCursor: messages.length === pageSize ? messages[0]?.created_at : null,
        totalCount: messages[0]?.total_count || 0
      };
    },
    initialPageParam: { cursor: null, direction: 'before' },
    getNextPageParam: (lastPage) => 
      lastPage.nextCursor ? { cursor: lastPage.nextCursor, direction: 'before' } : undefined,
    getPreviousPageParam: (firstPage) => 
      firstPage.prevCursor ? { cursor: firstPage.prevCursor, direction: 'after' } : undefined,
    enabled: enabled && !!chatId,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });

  // Flatten all pages into a single array of messages
  const allMessages = data?.pages.flatMap(page => page.messages) || [];

  // Load more messages when scrolling up (older messages)
  const loadOlderMessages = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Load newer messages when scrolling down (for catching up)
  const loadNewerMessages = useCallback(async () => {
    if (hasPreviousPage && !isFetchingPreviousPage) {
      await fetchPreviousPage();
    }
  }, [hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat-messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          setHasNewMessages(true);
          // Refetch to include new message in the list
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, refetch]);

  // Mark new messages as seen
  const markNewMessagesAsSeen = useCallback(() => {
    setHasNewMessages(false);
  }, []);

  // Store scroll position for restoration
  const saveScrollPosition = useCallback((position: number) => {
    scrollPositionRef.current = position;
  }, []);

  const getScrollPosition = useCallback(() => {
    return scrollPositionRef.current;
  }, []);

  return {
    messages: allMessages,
    totalMessages,
    hasNewMessages,
    isLoading,
    error,
    
    // Pagination controls
    loadOlderMessages,
    loadNewerMessages,
    hasMoreOlder: hasNextPage,
    hasMoreNewer: hasPreviousPage,
    isLoadingOlder: isFetchingNextPage,
    isLoadingNewer: isFetchingPreviousPage,
    
    // Scroll position management
    saveScrollPosition,
    getScrollPosition,
    markNewMessagesAsSeen,
    
    // Manual refresh
    refetch
  };
};