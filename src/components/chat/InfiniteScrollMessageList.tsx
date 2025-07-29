import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowDown } from 'lucide-react';
import { usePaginatedMessages } from '@/hooks/usePaginatedMessages';
import { VirtualScrollManager } from './VirtualScrollManager';
import { MessageHeightCalculator } from './MessageHeightCalculator';
import { OptimizedMessageList } from './OptimizedMessageList';
import { ChatMessage } from '@/types/communication';

interface InfiniteScrollMessageListProps {
  chatId: string;
  height: number;
  onMessageClick?: (message: ChatMessage) => void;
  autoScrollToNew?: boolean;
}

export const InfiniteScrollMessageList: React.FC<InfiniteScrollMessageListProps> = ({
  chatId,
  height,
  onMessageClick,
  autoScrollToNew = true
}) => {
  const [messageHeights, setMessageHeights] = useState<{ [messageId: string]: number }>({});
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const scrollManagerRef = useRef<any>(null);

  // Use paginated messages hook
  const {
    messages,
    totalMessages,
    hasNewMessages,
    isLoading,
    loadOlderMessages,
    loadNewerMessages,
    hasMoreOlder,
    hasMoreNewer,
    isLoadingOlder,
    isLoadingNewer,
    markNewMessagesAsSeen,
    saveScrollPosition,
    getScrollPosition
  } = usePaginatedMessages({
    chatId,
    pageSize: 50,
    enabled: !!chatId
  });

  // Handle height calculations
  const handleHeightCalculated = useCallback((messageId: string, height: number) => {
    setMessageHeights(prev => ({
      ...prev,
      [messageId]: height
    }));
  }, []);

  // Get item height for virtual scrolling
  const getItemHeight = useCallback((index: number) => {
    const message = messages[index];
    return messageHeights[message?.id] || 80; // Default height
  }, [messages, messageHeights]);

  // Handle scroll events
  const handleScroll = useCallback((scrollTop: number, scrollDirection: 'up' | 'down') => {
    saveScrollPosition(scrollTop);
    
    // Check if near bottom
    const scrollThreshold = 200;
    const isAtBottom = scrollTop > (scrollManagerRef.current?.scrollHeight || 0) - height - scrollThreshold;
    setIsNearBottom(isAtBottom);
    setShowScrollToBottom(!isAtBottom && hasNewMessages);

    // Mark messages as seen when scrolling down near bottom
    if (isAtBottom && hasNewMessages) {
      markNewMessagesAsSeen();
    }
  }, [saveScrollPosition, height, hasNewMessages, markNewMessagesAsSeen]);

  // Handle reaching top (load older messages)
  const handleReachTop = useCallback(() => {
    if (hasMoreOlder && !isLoadingOlder) {
      console.log('Loading older messages...');
      loadOlderMessages();
    }
  }, [hasMoreOlder, isLoadingOlder, loadOlderMessages]);

  // Handle reaching bottom (load newer messages if available)
  const handleReachBottom = useCallback(() => {
    if (hasMoreNewer && !isLoadingNewer) {
      console.log('Loading newer messages...');
      loadNewerMessages();
    }
  }, [hasMoreNewer, isLoadingNewer, loadNewerMessages]);

  // Scroll to bottom button handler
  const scrollToBottom = useCallback(() => {
    scrollManagerRef.current?.scrollToBottom();
    markNewMessagesAsSeen();
    setShowScrollToBottom(false);
  }, [markNewMessagesAsSeen]);

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (autoScrollToNew && isNearBottom && hasNewMessages) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [autoScrollToNew, isNearBottom, hasNewMessages, scrollToBottom]);

  // Render individual message item
  const renderMessageItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = messages[index];
    if (!message) return null;

    return (
      <div style={style} onClick={() => onMessageClick?.(message)}>
        <OptimizedMessageList messages={[message]} />
      </div>
    );
  }, [messages, onMessageClick]);

  // Memoized sorted messages
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Caricamento messaggi...</span>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Height calculator for precise measurements */}
      <MessageHeightCalculator
        messages={sortedMessages}
        onHeightCalculated={handleHeightCalculated}
        defaultHeight={80}
      />

      {/* Loading older messages indicator */}
      {isLoadingOlder && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm p-2 border-b">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Caricamento messaggi precedenti...
          </div>
        </div>
      )}

      {/* Virtual scroll manager */}
      <VirtualScrollManager
        messages={sortedMessages}
        height={height}
        width="100%"
        itemRenderer={renderMessageItem}
        getItemHeight={getItemHeight}
        onScroll={handleScroll}
        onReachTop={handleReachTop}
        onReachBottom={handleReachBottom}
        scrollToBottom={autoScrollToNew && isNearBottom}
        maintainScrollPosition={true}
        overscanCount={5}
      />

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <div className="absolute bottom-4 right-4 z-20">
          <Button
            onClick={scrollToBottom}
            variant="default"
            size="sm"
            className="rounded-full shadow-lg"
          >
            <ArrowDown className="h-4 w-4" />
            {hasNewMessages && (
              <span className="ml-1 text-xs">
                Nuovi messaggi
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Loading newer messages indicator */}
      {isLoadingNewer && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm p-2 border-t">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Caricamento messaggi recenti...
          </div>
        </div>
      )}

      {/* Message stats */}
      {sortedMessages.length > 0 && (
        <div className="absolute top-2 left-2 z-10 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs text-muted-foreground">
          {sortedMessages.length} di {totalMessages} messaggi
        </div>
      )}
    </div>
  );
};