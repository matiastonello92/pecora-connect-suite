import React, { useCallback, useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { FixedSizeList as List, VariableSizeList, ListOnScrollProps } from 'react-window';
import { ChatMessage } from '@/types/communication';

interface VirtualScrollManagerProps {
  messages: ChatMessage[];
  height: number;
  width: string | number;
  itemRenderer: (props: any) => React.ReactElement;
  getItemHeight: (index: number) => number;
  onScroll?: (scrollTop: number, scrollDirection: 'up' | 'down') => void;
  onReachTop?: () => void;
  onReachBottom?: () => void;
  scrollToBottom?: boolean;
  maintainScrollPosition?: boolean;
  overscanCount?: number;
}

export const VirtualScrollManager = forwardRef<VirtualScrollHandle, VirtualScrollManagerProps>(({
  messages,
  height,
  width,
  itemRenderer,
  getItemHeight,
  onScroll,
  onReachTop,
  onReachBottom,
  scrollToBottom = false,
  maintainScrollPosition = true,
  overscanCount = 5
}, ref) => {
  const listRef = useRef<VariableSizeList>(null);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const previousMessageCount = useRef(messages.length);

  // Handle scroll events with throttling
  const handleScroll = useCallback((props: any) => {
    const scrollTop = props.scrollTop || 0;
    const direction = scrollTop > lastScrollTop ? 'down' : 'up';
    setScrollDirection(direction);
    setLastScrollTop(scrollTop);
    setIsScrolling(true);

    // Call external scroll handler
    onScroll?.(scrollTop, direction);

    // Check if reached top or bottom
    const scrollThreshold = 100;
    if (scrollTop < scrollThreshold && direction === 'up') {
      onReachTop?.();
    } else if (scrollTop > 1000 - height - scrollThreshold && direction === 'down') {
      onReachBottom?.();
    }

    // Debounce scrolling state
    setTimeout(() => setIsScrolling(false), 150);
  }, [lastScrollTop, onScroll, onReachTop, onReachBottom, height]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollToBottom && listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [scrollToBottom, messages.length]);

  // Maintain scroll position when messages are prepended (loading older messages)
  useEffect(() => {
    if (maintainScrollPosition && listRef.current) {
      const currentMessageCount = messages.length;
      const newMessagesAdded = currentMessageCount - previousMessageCount.current;
      
      if (newMessagesAdded > 0 && scrollDirection === 'up') {
        // Scroll to maintain position after prepending messages
        setTimeout(() => {
          listRef.current?.scrollToItem(newMessagesAdded, 'start');
        }, 0);
      }
      
      previousMessageCount.current = currentMessageCount;
    }
  }, [messages.length, maintainScrollPosition, scrollDirection]);

  // Optimized item renderer with memoization
  const memoizedItemRenderer = useCallback((props: any) => {
    return itemRenderer(props);
  }, [itemRenderer]);

  // Reset cache when message heights change
  const resetCache = useCallback(() => {
    listRef.current?.resetAfterIndex(0);
  }, []);

  // Imperative scroll methods
  const scrollToIndex = useCallback((index: number, align: 'start' | 'center' | 'end' | 'smart' = 'smart') => {
    listRef.current?.scrollToItem(index, align);
  }, []);

  const scrollToMessage = useCallback((messageId: string) => {
    const index = messages.findIndex(msg => msg.id === messageId);
    if (index >= 0) {
      scrollToIndex(index, 'center');
    }
  }, [messages, scrollToIndex]);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToItem(0, 'start');
  }, []);

  const scrollToBottomImperative = useCallback(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length]);

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    scrollToIndex,
    scrollToMessage,
    scrollToTop,
    scrollToBottom: scrollToBottomImperative,
    resetCache
  }), [scrollToIndex, scrollToMessage, scrollToTop, scrollToBottomImperative, resetCache]);

  return (
    <VariableSizeList
      ref={listRef}
      height={height}
      width={width}
      itemCount={messages.length}
      itemSize={getItemHeight}
      onScroll={handleScroll}
      overscanCount={overscanCount}
      estimatedItemSize={80}
      itemData={messages}
    >
      {memoizedItemRenderer}
    </VariableSizeList>
  );
});

// Export methods for external use
export interface VirtualScrollHandle {
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end' | 'smart') => void;
  scrollToMessage: (messageId: string) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  resetCache: () => void;
}