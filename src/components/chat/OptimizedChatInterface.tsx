import React, { memo, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOptimizedMessages, useSendMessage } from '@/hooks/useOptimizedChatQueries';
import { OptimizedMessageList } from './OptimizedMessageList';
import { MessageInput } from './MessageInput';
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  MoreVertical,
  Users,
  Settings
} from 'lucide-react';
import { ChatType } from '@/types/communication';

interface OptimizedChatInterfaceProps {
  chat: any;
  onBack: () => void;
}

export const OptimizedChatInterface = memo<OptimizedChatInterfaceProps>(({ 
  chat, 
  onBack 
}) => {
  const { messages, loading } = useOptimizedMessages(chat?.id);
  const sendMessageMutation = useSendMessage();

  const getChatTitle = useCallback(() => {
    if (chat.name) return chat.name;
    
    if (chat.type === 'private' && chat.participants) {
      const otherParticipant = chat.participants.find((p: any) => 
        p.user?.first_name
      );
      if (otherParticipant?.user) {
        return `${otherParticipant.user.first_name} ${otherParticipant.user.last_name}`;
      }
    }
    
    return `${chat.type.charAt(0).toUpperCase() + chat.type.slice(1)} Chat`;
  }, [chat]);

  const getChatSubtitle = useCallback(() => {
    if (chat.type === 'private') {
      const participant = chat.participants?.find((p: any) => p.user?.position);
      return participant?.user?.position || 'Private conversation';
    }
    
    if (chat.type === 'global') return `Global • ${chat.location}`;
    if (chat.type === 'announcements') return `Announcements • ${chat.location}`;
    if (chat.type === 'group') {
      const memberCount = chat.participants?.length || 0;
      return `${memberCount} members • ${chat.location}`;
    }
    
    return chat.location;
  }, [chat]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !chat?.id) return;

    try {
      await sendMessageMutation.mutateAsync({
        chatId: chat.id,
        content: content.trim(),
        messageType: 'text'
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [chat?.id, sendMessageMutation]);

  if (!chat) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate">
              {getChatTitle()}
            </h2>
            <p className="text-sm text-muted-foreground truncate">
              {getChatSubtitle()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {chat.type === 'private' && (
            <>
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {chat.type === 'group' && (
            <Button variant="ghost" size="sm">
              <Users className="h-4 w-4" />
            </Button>
          )}
          
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-muted-foreground">
                Loading messages...
              </div>
            </div>
          ) : (
            <OptimizedMessageList messages={messages} />
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-border bg-card/50">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={sendMessageMutation.isPending}
        />
      </div>
    </div>
  );
});

OptimizedChatInterface.displayName = 'OptimizedChatInterface';