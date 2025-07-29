import React from 'react';
import { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { OptimizedMessageList } from './OptimizedMessageList';
import { ChatMessage } from '@/types/communication';

interface VirtualizedMessageListProps {
  messages: ChatMessage[];
  height: number;
}

const ITEM_HEIGHT = 80; // Approximate height per message

export const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({ 
  messages, 
  height 
}) => {
  const messageItems = useMemo(() => {
    return messages.map((message, index) => ({
      message,
      index,
      key: message.id
    }));
  }, [messages]);

  const renderMessage = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = messageItems[index];
    
    return (
      <div style={style}>
        <OptimizedMessageList messages={[item.message]} />
      </div>
    );
  };

  if (messages.length < 50) {
    // Use regular list for small message counts
    return <OptimizedMessageList messages={messages} />;
  }

  return (
    <List
      height={height}
      width="100%"
      itemCount={messageItems.length}
      itemSize={ITEM_HEIGHT}
      itemData={messageItems}
    >
      {renderMessage}
    </List>
  );
};