import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useChatContext } from '@/context/ChatContext';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/context/AuthContext';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { useMessageReminders } from '@/hooks/useMessageReminders';
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
  Check,
  CheckCheck,
  Pin,
  Archive,
  Menu
} from 'lucide-react';
import { ChatType } from '@/types/communication';
import { ChatInterface } from './ChatInterface';
import { ConnectionRequestManager } from './ConnectionRequestManager';
import { GroupManagement } from './GroupManagement';
import { ChatSettings } from './ChatSettings';
import { NotificationBadge } from '@/components/ui/notification-badge';

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
  const { user, language } = useAuth();
  const { unreadCountByChat, markChatAsRead } = useUnreadMessages();
  const { processReminders } = useMessageReminders();
  const { t } = useTranslation(language);
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [showConnections, setShowConnections] = useState(false);

  // Listen for navigation events from notifications
  useEffect(() => {
    const handleNavigateToChat = async (event: CustomEvent) => {
      const { chatId } = event.detail;
      
      try {
        // Find the chat in the current chats list
        const chat = filteredChats.find(c => c.id === chatId);
        if (chat) {
          setActiveChat(chat);
        }
      } catch (error) {
        console.error('Error navigating to chat:', error);
      }
    };

    const handleOpenConnectionRequests = () => {
      setShowConnections(true);
    };

    window.addEventListener('navigateToChat', handleNavigateToChat as EventListener);
    window.addEventListener('openConnectionRequests', handleOpenConnectionRequests);
    
    return () => {
      window.removeEventListener('navigateToChat', handleNavigateToChat as EventListener);
      window.removeEventListener('openConnectionRequests', handleOpenConnectionRequests);
    };
  }, [filteredChats, setActiveChat]);

  // Process reminders periodically
  useEffect(() => {
    if (!user) return;

    // Process reminders immediately
    processReminders();

    // Set up interval to process reminders every 5 minutes
    const interval = setInterval(processReminders, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, processReminders]);

  // Auto-mark chat as read when opened
  useEffect(() => {
    if (activeChat) {
      markChatAsRead(activeChat.id);
    }
  }, [activeChat, markChatAsRead]);
  const [showGroups, setShowGroups] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getLocale = () => enUS;

  const getChatIcon = (type: ChatType) => {
    switch (type) {
      case 'private':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'group':
        return <Users className="h-5 w-5 text-green-500" />;
      case 'global':
        return <Globe className="h-5 w-5 text-purple-500" />;
      case 'announcements':
        return <Megaphone className="h-5 w-5 text-orange-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getChatName = (chat: any) => {
    if (chat.name) return chat.name;
    
    if (chat.type === 'private' && chat.participants) {
      const otherParticipant = chat.participants.find((p: any) => 
        p.user_id !== user?.id && p.user?.first_name
      );
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

  const getInitials = (chat: any) => {
    const name = getChatName(chat);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isMessageFromCurrentUser = (chat: any) => {
    return chat.last_message?.sender_id === user?.id;
  };

  const getMessageStatus = (chat: any) => {
    if (!chat.last_message || !isMessageFromCurrentUser(chat)) return null;
    
    // For now, we'll show as delivered - would need read receipts data
    return <CheckCheck className="h-3 w-3 text-blue-500" />;
  };

  const handleCreateChat = async (type: ChatType) => {
    if (type === 'group') {
      setShowGroups(true);
    } else if (type === 'private') {
      setShowConnections(true);
    }
    setShowCreateChat(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const sortedChats = [...filteredChats].sort((a, b) => {
    // Announcements and global chats first
    if (a.type === 'announcements' && b.type !== 'announcements') return -1;
    if (b.type === 'announcements' && a.type !== 'announcements') return 1;
    if (a.type === 'global' && b.type !== 'global' && b.type !== 'announcements') return -1;
    if (b.type === 'global' && a.type !== 'global' && a.type !== 'announcements') return 1;
    
    // Then by last message time
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
  });

  if (showConnections) {
    return <ConnectionRequestManager onClose={() => setShowConnections(false)} />;
  }

  if (showGroups) {
    return <GroupManagement onClose={() => setShowGroups(false)} />;
  }

  return (
    <div className="flex h-full bg-background">
      {/* Chat List Sidebar */}
      <div className={`${activeChat && !isMobileMenuOpen ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-border bg-card`}>
        {/* Header */}
        <div className="p-4 bg-primary/5 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-foreground">
              {t('communication.dashboard.title')}
            </h1>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConnections(true)}
                className="hover:bg-accent focus:bg-accent active:bg-accent"
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateChat(!showCreateChat)}
                className="hover:bg-accent focus:bg-accent active:bg-accent"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <ChatSettings>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-accent focus:bg-accent active:bg-accent"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </ChatSettings>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('communication.searchChats')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border-border focus:bg-background"
            />
          </div>

          {/* Quick Create Menu */}
          {showCreateChat && (
            <div className="mt-3 p-3 bg-background/80 rounded-lg border border-border animate-fade-in">
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start hover:bg-accent focus:bg-accent active:bg-accent"
                  onClick={() => handleCreateChat('group')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {t('communication.createGroupChat')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start hover:bg-accent focus:bg-accent active:bg-accent"
                  onClick={() => setShowConnections(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t('communication.newPrivateChat')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse text-muted-foreground">
                  {t('common.loading')}
                </div>
              </div>
            ) : sortedChats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <p className="text-sm">
                  {searchTerm ? t('communication.noChatsFound') : t('communication.noChats')}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {sortedChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`relative rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 focus:bg-accent/50 active:bg-accent/50 ${
                      activeChat?.id === chat.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => {
                      setActiveChat(chat);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <div className="p-3">
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-2 border-background">
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm">
                              {getInitials(chat)}
                            </AvatarFallback>
                          </Avatar>
                          {/* Chat type indicator */}
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-background flex items-center justify-center">
                            {getChatIcon(chat.type)}
                          </div>
                        </div>

                        {/* Chat Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className={`text-sm truncate text-foreground ${
                                  unreadCountByChat[chat.id] > 0 ? 'font-bold' : 'font-semibold'
                                }`}>
                                  {getChatName(chat)}
                                </h3>
                                {chat.type === 'announcements' && (
                                  <Pin className="h-3 w-3 text-orange-500" />
                                )}
                              </div>
                              
                              <div className="flex items-center mt-1 space-x-1">
                                {getMessageStatus(chat)}
                                <p className="text-xs text-muted-foreground truncate flex-1">
                                  {getLastMessagePreview(chat)}
                                </p>
                              </div>
                            </div>

                            {/* Time and Badges */}
                            <div className="flex flex-col items-end space-y-1 ml-2">
                              {chat.last_message_at && (
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(chat.last_message_at)}
                                </span>
                              )}
                              
                              <div className="flex items-center space-x-1 relative">
                                {unreadCountByChat[chat.id] > 0 && (
                                  <NotificationBadge
                                    count={unreadCountByChat[chat.id]}
                                    size="sm"
                                    className="static transform-none h-5 min-w-[20px] -top-0 -right-0"
                                  />
                                )}
                                {chat.participants?.some((p: any) => p.is_muted) && (
                                  <VolumeX className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Interface */}
      <div className={`${!activeChat || isMobileMenuOpen ? 'hidden md:flex' : 'flex'} flex-1 flex-col`}>
        <ChatInterface 
          onBack={() => setIsMobileMenuOpen(true)}
        />
      </div>
    </div>
  );
};