import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useChatContext } from '@/context/ChatContext';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useTranslation } from 'react-i18next';
import {
  Phone,
  Video,
  MoreVertical,
  Search,
  ArrowLeft,
  Users,
  Info
} from 'lucide-react';
import { ChatType } from '@/types/communication';

interface ChatInterfaceProps {
  onBack?: () => void;
  onShowInfo?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onBack, onShowInfo }) => {
  const { activeChat, messages, sendMessage, sendingMessage } = useChatContext();
  const { t } = useTranslation();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground max-w-md mx-auto p-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">{t('communication.selectChat')}</h3>
          <p className="text-sm">{t('communication.selectChatDescription')}</p>
        </div>
      </div>
    );
  }

  const getChatName = () => {
    if (activeChat.name) return activeChat.name;
    
    if (activeChat.type === 'private' && activeChat.participants) {
      const otherParticipant = activeChat.participants.find((p: any) => p.user?.first_name);
      if (otherParticipant?.user) {
        return `${otherParticipant.user.first_name} ${otherParticipant.user.last_name}`;
      }
    }
    
    return t(`communication.chatTypes.${activeChat.type}`);
  };

  const getChatSubtitle = () => {
    if (activeChat.type === 'private' && activeChat.participants) {
      const otherParticipant = activeChat.participants.find((p: any) => p.user?.position);
      if (otherParticipant?.user) {
        return otherParticipant.user.position;
      }
    }
    
    if (activeChat.type === 'group' && activeChat.participants) {
      return t('communication.participantsCount', { count: activeChat.participants.length });
    }
    
    return activeChat.description || '';
  };

  const getInitials = () => {
    const name = getChatName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center space-x-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="md:hidden">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{getChatName()}</h3>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground truncate">
                {getChatSubtitle()}
              </p>
              {typingUsers.length > 0 && (
                <Badge variant="secondary" className="text-xs h-4">
                  {t('communication.typing')}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {activeChat.type === 'private' && (
            <>
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="h-4 w-4" />
              </Button>
            </>
          )}
          
          <Button variant="ghost" size="sm">
            <Search className="h-4 w-4" />
          </Button>
          
          {onShowInfo && (
            <Button variant="ghost" size="sm" onClick={onShowInfo}>
              <Info className="h-4 w-4" />
            </Button>
          )}
          
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 relative">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            <MessageList messages={messages} />
            {sendingMessage && (
              <div className="flex justify-end">
                <div className="bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm">
                  {t('communication.sending')}...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="border-t bg-card">
        <MessageInput
          onSendMessage={(content, type, mediaUrl) => 
            sendMessage(activeChat.id, content, type, mediaUrl)
          }
        />
      </div>
    </div>
  );
};