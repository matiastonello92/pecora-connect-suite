import React, { useMemo, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types/communication';

interface MessageHeightCache {
  [messageId: string]: number;
}

interface MessageHeightCalculatorProps {
  messages: ChatMessage[];
  onHeightCalculated: (messageId: string, height: number) => void;
  defaultHeight?: number;
}

export const MessageHeightCalculator: React.FC<MessageHeightCalculatorProps> = ({
  messages,
  onHeightCalculated,
  defaultHeight = 80
}) => {
  const measurementRef = useRef<HTMLDivElement>(null);
  const heightCache = useRef<MessageHeightCache>({});

  // Calculate estimated height based on content
  const estimateMessageHeight = useMemo(() => {
    return (message: ChatMessage): number => {
      // Check cache first
      if (heightCache.current[message.id]) {
        return heightCache.current[message.id];
      }

      let estimatedHeight = defaultHeight;

      // Base height for avatar, padding, and basic content
      const baseHeight = 60;
      
      // Text content height estimation
      if (message.content) {
        const textLength = message.content.length;
        const estimatedLines = Math.ceil(textLength / 50); // ~50 chars per line
        const lineHeight = 20;
        estimatedHeight = baseHeight + (estimatedLines * lineHeight);
      }

      // Additional height for media content
      if (message.message_type === 'image') {
        estimatedHeight += 200; // Standard image height
      } else if (message.message_type === 'voice') {
        estimatedHeight += 60; // Voice message player height
      } else if (message.message_type === 'document') {
        estimatedHeight += 80; // Document preview height
      }

      // Additional height for read receipts
      if (message.read_receipts && message.read_receipts.length > 0) {
        estimatedHeight += 30;
      }

      // Cache the estimated height
      heightCache.current[message.id] = estimatedHeight;
      
      return estimatedHeight;
    };
  }, [defaultHeight]);

  // Precise measurement using DOM
  const measureMessageHeight = (message: ChatMessage): number => {
    if (!measurementRef.current) return estimateMessageHeight(message);

    // Create a temporary element for measurement
    const tempElement = document.createElement('div');
    tempElement.style.position = 'absolute';
    tempElement.style.visibility = 'hidden';
    tempElement.style.width = measurementRef.current.offsetWidth + 'px';
    tempElement.style.whiteSpace = 'pre-wrap';
    tempElement.innerHTML = `
      <div style="padding: 12px; display: flex; gap: 8px;">
        <div style="width: 40px; height: 40px; border-radius: 50%; background: #ccc;"></div>
        <div style="flex: 1;">
          <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">Sender</div>
          <div style="font-size: 14px; line-height: 1.4;">${message.content || ''}</div>
          ${message.message_type === 'image' ? '<div style="width: 200px; height: 200px; background: #f0f0f0; margin-top: 8px;"></div>' : ''}
          ${message.message_type === 'voice' ? '<div style="height: 60px; background: #f0f0f0; margin-top: 8px;"></div>' : ''}
          ${message.message_type === 'document' ? '<div style="height: 80px; background: #f0f0f0; margin-top: 8px;"></div>' : ''}
          <div style="font-size: 12px; color: #666; margin-top: 4px;">
            ${new Date(message.created_at).toLocaleTimeString()}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(tempElement);
    const height = tempElement.offsetHeight;
    document.body.removeChild(tempElement);

    // Cache the measured height
    heightCache.current[message.id] = height;
    onHeightCalculated(message.id, height);

    return height;
  };

  // Effect to measure heights for visible messages
  useEffect(() => {
    messages.forEach(message => {
      if (!heightCache.current[message.id]) {
        const height = measureMessageHeight(message);
        onHeightCalculated(message.id, height);
      }
    });
  }, [messages, onHeightCalculated]);

  return (
    <div 
      ref={measurementRef} 
      style={{ 
        position: 'absolute', 
        top: -9999, 
        left: -9999, 
        visibility: 'hidden',
        width: '100%',
        pointerEvents: 'none'
      }}
    />
  );
};