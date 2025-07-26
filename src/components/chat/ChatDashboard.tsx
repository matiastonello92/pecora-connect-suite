import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useChatContext } from '@/context/ChatContext';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr, it } from 'date-fns/locale';
import {
  MessageSquare,
  Users,
  Globe,
  Megaphone,
  Search,
  Plus,
  Settings,
  Volume2,
  VolumeX,
  Clock
} from 'lucide-react';
import { ChatType } from '@/types/communication';

const locales = { en: enUS, fr, it };

export const ChatDashboard: React.FC = () => {
  const {
    filteredChats,
    activeChat,
    setActiveChat,
    searchTerm,
    setSearchTerm,
    loading,
    createChat
  } = useChatContext();
  const { t, i18n } = useTranslation();
  const [showCreateChat, setShowCreateChat] = useState(false);

  const getLocale = () => locales[i18n.language as keyof typeof locales] || enUS;

  const getChatIcon = (type: ChatType) => {
    switch (type) {
      case 'private':
        return <MessageSquare className="h-4 w-4" />;
      case 'group':
        return <Users className="h-4 w-4" />;
      case 'global':
        return <Globe className="h-4 w-4" />;
      case 'announcements':
        return <Megaphone className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getChatName = (chat: any) => {
    if (chat.name) return chat.name;
    
    if (chat.type === 'private' && chat.participants) {
      // Find the other participant (not the current user)
      // We'll need to get current user ID from context
      const otherParticipant = chat.participants.find((p: any) => p.user?.first_name);
      if (otherParticipant?.user) {
        return `${otherParticipant.user.first_name} ${otherParticipant.user.last_name}`;
      }
    }
    
    return t(`communication.chatTypes.${chat.type}`);
  };

  const getLastMessagePreview = (chat: any) => {
    if (!chat.last_message) return t('communication.noMessages');
    
    const message = chat.last_message;
    if (message.message_type === 'text') {
      return message.content || '';
    } else {
      return t(`communication.messageTypes.${message.message_type}`);
    }
  };

  const handleCreateChat = async (type: ChatType) => {
    if (type === 'group') {
      // For group chats, we'll need a participant selection dialog
      // For now, just create an empty group
      await createChat(type, t('communication.newGroupChat'));
    } else if (type === 'private') {
      // For private chats, we'll need a user selection dialog
      // This will be handled by connection requests
    }
    setShowCreateChat(false);
  };

  return (
    <div className="flex h-full">
      {/* Chat List */}
      <div className="w-80 border-r border-border bg-card">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t('communication.dashboard.title')}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateChat(!showCreateChat)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('communication.searchChats')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Quick Create Buttons */}
          {showCreateChat && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleCreateChat('group')}
              >
                <Users className="h-4 w-4 mr-2" />
                {t('communication.createGroupChat')}
              </Button>
            </div>
          )}
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                {t('common.loading')}
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm ? t('communication.noChatsFound') : t('communication.noChats')}
              </div>
            ) : (
              filteredChats.map((chat) => (
                <Card
                  key={chat.id}
                  className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                    activeChat?.id === chat.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => setActiveChat(chat)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start space-x-3">
                      {/* Chat Avatar/Icon */}
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                        {getChatIcon(chat.type)}
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">{getChatName(chat)}</h3>
                          <div className="flex items-center space-x-1">
                            {chat.unread_count > 0 && (
                              <Badge variant="default" className="h-5 text-xs">
                                {chat.unread_count}
                              </Badge>
                            )}
                            {/* Mute indicator */}
                            {chat.participants?.some((p: any) => p.is_muted) && (
                              <VolumeX className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {getLastMessagePreview(chat)}
                        </p>

                        {/* Timestamp */}
                        {chat.last_message_at && (
                          <div className="flex items-center mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDistanceToNow(new Date(chat.last_message_at), {
                              addSuffix: true,
                              locale: getLocale()
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Content Area */}
      <div className="flex-1 flex items-center justify-center bg-background">
        {activeChat ? (
          <div className="text-center text-muted-foreground">
            {/* This will be replaced with the actual chat component */}
            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{getChatName(activeChat)}</h3>
            <p>{t('communication.chatSelected')}</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t('communication.selectChat')}</h3>
            <p>{t('communication.selectChatDescription')}</p>
          </div>
        )}
      </div>
    </div>
  );
};