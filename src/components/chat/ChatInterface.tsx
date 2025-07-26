import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useChatContext } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useTranslation } from '@/lib/i18n';
import {
  Phone,
  Video,
  MoreVertical,
  Search,
  ArrowLeft,
  Users,
  Info,
  Pin,
  Bell,
  BellOff,
  Archive,
  Trash2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { ChatType } from '@/types/communication';

interface ChatInterfaceProps {
  onBack?: () => void;
  onShowInfo?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onBack, onShowInfo }) => {
  const { activeChat, messages, sendMessage, sendingMessage } = useChatContext();
  const { user } = useAuth();
  const { t } = useTranslation('en');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-muted/20 to-muted/40">
        <div className="text-center text-muted-foreground max-w-md mx-auto p-8">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <Users className="w-16 h-16 text-primary/60" />
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-foreground">
            {t('communication.selectChat')}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {t('communication.selectChatDescription')}
          </p>
        </div>
      </div>
    );
  }

  const getChatName = () => {
    if (activeChat.name) return activeChat.name;
    
    if (activeChat.type === 'private' && activeChat.participants) {
      const otherParticipant = activeChat.participants.find((p: any) => 
        p.user_id !== user?.id && p.user?.first_name
      );
      if (otherParticipant?.user) {
        return `${otherParticipant.user.first_name} ${otherParticipant.user.last_name}`;
      }
    }
    
    return t(`communication.chatTypes.${activeChat.type}`);
  };

  const getChatSubtitle = () => {
    if (activeChat.type === 'private' && activeChat.participants) {
      const otherParticipant = activeChat.participants.find((p: any) => 
        p.user_id !== user?.id && p.user?.position
      );
      if (otherParticipant?.user) {
        return otherParticipant.user.position;
      }
      return t('communication.online');
    }
    
    if (activeChat.type === 'group' && activeChat.participants) {
      return t('communication.participantsCount', { count: activeChat.participants.length });
    }
    
    if (activeChat.type === 'global') {
      return t('communication.globalChatSubtitle');
    }
    
    if (activeChat.type === 'announcements') {
      return t('communication.announcementChatSubtitle');
    }
    
    return activeChat.description || '';
  };

  const getInitials = () => {
    const name = getChatName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getChatIcon = () => {
    switch (activeChat.type) {
      case 'private':
        return null; // Use avatar for private chats
      case 'group':
        return <Users className="h-5 w-5 text-green-500" />;
      case 'global':
        return <Users className="h-5 w-5 text-purple-500" />;
      case 'announcements':
        return <Pin className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const isCurrentUserMuted = () => {
    if (!user || !activeChat.participants) return false;
    const currentUserParticipant = activeChat.participants.find(p => p.user_id === user.id);
    return currentUserParticipant?.is_muted || false;
  };

  const canSendMessages = () => {
    // Announcements: only admins and managers can send
    if (activeChat.type === 'announcements') {
      return user?.role && ['manager', 'super_admin'].includes(user.role);
    }
    
    // All other chats: check if user is not muted
    return !isCurrentUserMuted();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Back Button (Mobile) */}
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack} 
              className="md:hidden hover:bg-accent focus:bg-accent active:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          {/* Chat Avatar */}
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            {getChatIcon() && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-background flex items-center justify-center">
                {getChatIcon()}
              </div>
            )}
            {/* Online indicator for private chats */}
            {activeChat.type === 'private' && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
            )}
          </div>
          
          {/* Chat Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-foreground truncate">
                {getChatName()}
              </h3>
              {activeChat.type === 'announcements' && (
                <Pin className="h-4 w-4 text-orange-500" />
              )}
              {isCurrentUserMuted() && (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex items-center space-x-2 mt-0.5">
              <p className="text-sm text-muted-foreground truncate">
                {getChatSubtitle()}
              </p>
              {typingUsers.length > 0 && (
                <Badge variant="secondary" className="text-xs h-5 animate-pulse">
                  {t('communication.typing')}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          {/* Video/Voice calls for private chats */}
          {activeChat.type === 'private' && (
            <>
              <Button 
                variant="ghost" 
                size="sm"
                className="hover:bg-accent focus:bg-accent active:bg-accent"
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="hover:bg-accent focus:bg-accent active:bg-accent"
              >
                <Video className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {/* Search */}
          <Button 
            variant="ghost" 
            size="sm"
            className="hover:bg-accent focus:bg-accent active:bg-accent"
          >
            <Search className="h-4 w-4" />
          </Button>
          
          {/* Chat Info */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowChatInfo(!showChatInfo)}
            className="hover:bg-accent focus:bg-accent active:bg-accent"
          >
            <Info className="h-4 w-4" />
          </Button>
          
          {/* More Options */}
          <Button 
            variant="ghost" 
            size="sm"
            className="hover:bg-accent focus:bg-accent active:bg-accent"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 relative bg-gradient-to-b from-background to-muted/10">
        <ScrollArea className="h-full">
          <div className="p-4">
            <MessageList messages={messages} />
            
            {/* Sending indicator */}
            {sendingMessage && (
              <div className="flex justify-end mt-4">
                <div className="bg-primary/10 text-primary px-3 py-2 rounded-2xl text-sm animate-pulse">
                  {t('communication.sending')}...
                </div>
              </div>
            )}
            
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="border-t border-border bg-card/95 backdrop-blur-sm">
        {canSendMessages() ? (
          <MessageInput
            onSendMessage={(content, type, mediaUrl) => 
              sendMessage(activeChat.id, content, type, mediaUrl)
            }
          />
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            {activeChat.type === 'announcements' 
              ? t('communication.onlyAdminsCanSend')
              : t('communication.chatMuted')
            }
          </div>
        )}
      </div>

      {/* Chat Info Sidebar (if shown) */}
      {showChatInfo && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-card border-l border-border shadow-lg animate-slide-in-right">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{t('communication.chatInfo')}</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowChatInfo(false)}
                className="hover:bg-accent focus:bg-accent active:bg-accent"
              >
                ×
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Chat details would go here */}
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-3">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-lg">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <h4 className="font-semibold text-lg">{getChatName()}</h4>
                <p className="text-muted-foreground text-sm">{getChatSubtitle()}</p>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};