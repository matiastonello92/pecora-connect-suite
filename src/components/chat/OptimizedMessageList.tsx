import React, { memo, useMemo, useCallback } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { format, isToday, isYesterday } from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  Download,
  FileText,
  Play,
  MoreVertical,
  CheckCheck,
  MessageSquare
} from 'lucide-react';
import { ChatMessage } from '@/types/communication';

interface OptimizedMessageListProps {
  messages: ChatMessage[];
}

// Memoized individual message component
const MessageItem = memo(({ 
  message, 
  previousMessage,
  isOwn,
  showDate,
  groupWithPrevious 
}: {
  message: ChatMessage;
  previousMessage?: ChatMessage;
  isOwn: boolean;
  showDate: boolean;
  groupWithPrevious: boolean;
}) => {
  const senderName = message.sender 
    ? `${message.sender.first_name} ${message.sender.last_name}`
    : 'Unknown';
  
  const initials = senderName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const renderMediaContent = useCallback((message: ChatMessage) => {
    if (!message.media_url) return null;

    switch (message.message_type) {
      case 'image':
        return (
          <div className="relative max-w-xs">
            <img 
              src={message.media_url} 
              alt="Shared image"
              className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.media_url, '_blank')}
            />
          </div>
        );
      
      case 'voice':
        return (
          <div className="flex items-center space-x-3 bg-muted/50 rounded-lg p-3 max-w-xs">
            <Button size="sm" variant="ghost" className="p-1 h-8 w-8">
              <Play className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="h-1 bg-muted rounded-full">
                <div className="h-1 bg-primary rounded-full w-1/3"></div>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">0:30</span>
          </div>
        );
      
      case 'document':
        return (
          <div className="flex items-center space-x-3 bg-muted/50 rounded-lg p-3 max-w-xs">
            <FileText className="h-8 w-8 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.media_url.split('/').pop()}
              </p>
              <p className="text-xs text-muted-foreground">
                {message.media_size ? `${(message.media_size / 1024).toFixed(1)} KB` : 'Document'}
              </p>
            </div>
            <Button size="sm" variant="ghost" className="p-1 h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  }, []);

  return (
    <div>
      {/* Date Divider */}
      {showDate && (
        <div className="flex justify-center my-4">
          <div className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs">
            {format(new Date(message.created_at), 'EEEE, MMMM do', { locale: enUS })}
          </div>
        </div>
      )}

      {/* Message */}
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${groupWithPrevious ? 'mt-1' : 'mt-4'}`}>
        <div className={`flex max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          {!isOwn && !groupWithPrevious && (
            <Avatar className="h-8 w-8 mr-2">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
          {!isOwn && groupWithPrevious && <div className="w-10" />}

          {/* Message Bubble */}
          <div className={`relative group ${isOwn ? 'ml-2' : 'mr-2'}`}>
            {/* Sender Name */}
            {!isOwn && !groupWithPrevious && (
              <p className="text-xs text-muted-foreground mb-1 px-1">
                {senderName}
              </p>
            )}

            {/* Message Content */}
            <div className={`rounded-lg px-3 py-2 ${
              isOwn 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}>
              {/* Media Content */}
              {renderMediaContent(message)}
              
              {/* Text Content */}
              {message.content && (
                <div className={`${message.media_url ? 'mt-2' : ''}`}>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
              )}

              {/* Message Footer */}
              <div className={`flex items-center justify-end space-x-1 mt-1 ${
                isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
              }`}>
                <span className="text-xs">
                  {format(new Date(message.created_at), 'HH:mm')}
                </span>
                
                {isOwn && (
                  <div className="flex items-center">
                    {message.is_edited && (
                      <span className="text-xs mr-1">edited</span>
                    )}
                    <CheckCheck className="h-3 w-3" />
                  </div>
                )}
              </div>
            </div>

            {/* Message Actions */}
            <Button
              variant="ghost"
              size="sm"
              className={`absolute top-0 transition-opacity p-1 h-6 w-6 opacity-50 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 ${
                isOwn ? '-left-8' : '-right-8'
              }`}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export const OptimizedMessageList = memo<OptimizedMessageListProps>(({ messages }) => {
  const { profile } = useSimpleAuth();

  // Memoized message processing
  const processedMessages = useMemo(() => {
    return messages.map((message, index) => {
      const previousMessage = index > 0 ? messages[index - 1] : undefined;
      
      const shouldShowDateDivider = () => {
        if (!previousMessage) return true;
        
        const currentDate = new Date(message.created_at);
        const previousDate = new Date(previousMessage.created_at);
        
        return currentDate.toDateString() !== previousDate.toDateString();
      };

      const shouldGroupWithPrevious = () => {
        if (!previousMessage) return false;
        if (message.sender_id !== previousMessage.sender_id) return false;
        
        const currentTime = new Date(message.created_at).getTime();
        const previousTime = new Date(previousMessage.created_at).getTime();
        
        // Group messages within 5 minutes
        return (currentTime - previousTime) < 5 * 60 * 1000;
      };

      return {
        message,
        previousMessage,
        isOwn: message.sender_id === profile?.user_id,
        showDate: shouldShowDateDivider(),
        groupWithPrevious: shouldGroupWithPrevious()
      };
    });
  }, [messages, profile?.user_id]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Start the conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {processedMessages.map(({ message, previousMessage, isOwn, showDate, groupWithPrevious }) => (
        <MessageItem
          key={message.id}
          message={message}
          previousMessage={previousMessage}
          isOwn={isOwn}
          showDate={showDate}
          groupWithPrevious={groupWithPrevious}
        />
      ))}
    </div>
  );
});

OptimizedMessageList.displayName = 'OptimizedMessageList';