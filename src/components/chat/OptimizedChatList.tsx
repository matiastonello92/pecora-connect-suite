import React, { memo, useMemo, useCallback } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  MessageSquare,
  Users,
  Globe,
  Megaphone,
  CheckCheck
} from 'lucide-react';
import { Chat, ChatType } from '@/types/communication';
import { useSimpleAuth } from '@/context/SimpleAuthContext';

interface OptimizedChatListProps {
  chats: Chat[];
  activeChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
  unreadCountByChat: Record<string, number>;
  searchTerm: string;
  selectedLocation: string | 'all_locations';
}

// Memoized chat item component to prevent unnecessary re-renders
const ChatItem = memo(({ 
  chat, 
  isActive, 
  onClick, 
  unreadCount,
  currentUserId 
}: {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
  unreadCount: number;
  currentUserId?: string;
}) => {
  const getChatIcon = useCallback((type: ChatType) => {
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
  }, []);

  const getChatName = useCallback((chat: Chat) => {
    if (chat.name) return chat.name;
    
    if (chat.type === 'private' && chat.participants) {
      const otherParticipant = chat.participants.find((p: any) => 
        p.user_id !== currentUserId && p.user?.first_name
      );
      if (otherParticipant?.user) {
        return `${otherParticipant.user.first_name} ${otherParticipant.user.last_name}`;
      }
    }
    
    return `${chat.type.charAt(0).toUpperCase() + chat.type.slice(1)} Chat`;
  }, [currentUserId]);

  const getLastMessagePreview = useCallback((chat: Chat) => {
    if (!chat.last_message) return "No messages";
    
    const message = chat.last_message;
    if (message.message_type === 'text') {
      return message.content || '';
    } else {
      return `${message.message_type} message`;
    }
  }, []);

  const getInitials = useCallback((chat: Chat) => {
    const name = getChatName(chat);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, [getChatName]);

  const isMessageFromCurrentUser = useCallback((chat: Chat) => {
    return chat.last_message?.sender_id === currentUserId;
  }, [currentUserId]);

  const formatTime = useCallback((dateString: string) => {
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
  }, []);

  return (
    <div
      className={`relative rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 focus:bg-accent/50 active:bg-accent/50 ${
        isActive ? 'bg-accent' : ''
      }`}
      onClick={onClick}
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
            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border border-border">
              {getChatIcon(chat.type)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-foreground truncate text-sm">
                {getChatName(chat)}
              </h3>
              <div className="flex items-center space-x-1">
                {chat.last_message && isMessageFromCurrentUser(chat) && (
                  <CheckCheck className="h-3 w-3 text-blue-500" />
                )}
                <span className="text-xs text-muted-foreground">
                  {chat.last_message_at ? formatTime(chat.last_message_at) : ''}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                {getLastMessagePreview(chat)}
              </p>
              
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5 rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>

            {/* Location indicator */}
            <div className="flex items-center mt-1">
              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                {chat.location}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ChatItem.displayName = 'ChatItem';

export const OptimizedChatList = memo<OptimizedChatListProps>(({
  chats,
  activeChat,
  onChatSelect,
  unreadCountByChat,
  searchTerm,
  selectedLocation
}) => {
  const { profile } = useSimpleAuth();

  // Memoized filtering and sorting logic
  const filteredAndSortedChats = useMemo(() => {
    // Apply search filter
    let filtered = chats;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = chats.filter(chat => {
        // Search in chat name
        if (chat.name?.toLowerCase().includes(searchLower)) return true;
        
        // Search in participant names
        const participantMatch = chat.participants?.some(p => 
          p.user && (
            p.user.first_name.toLowerCase().includes(searchLower) ||
            p.user.last_name.toLowerCase().includes(searchLower)
          )
        );
        
        if (participantMatch) return true;
        
        // Search in last message
        if (chat.last_message?.content?.toLowerCase().includes(searchLower)) return true;
        
        return false;
      });
    }

    // Apply location filter
    if (selectedLocation !== 'all_locations') {
      filtered = filtered.filter(chat => chat.location === selectedLocation);
    }

    // Sort chats
    return [...filtered].sort((a, b) => {
      // Announcements and global chats first
      if (a.type === 'announcements' && b.type !== 'announcements') return -1;
      if (b.type === 'announcements' && a.type !== 'announcements') return 1;
      if (a.type === 'global' && b.type !== 'global' && b.type !== 'announcements') return -1;
      if (b.type === 'global' && a.type !== 'global' && a.type !== 'announcements') return 1;
      
      // Then by last message time
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });
  }, [chats, searchTerm, selectedLocation]);

  // Memoized chat selection handler
  const handleChatSelect = useCallback((chat: Chat) => {
    onChatSelect(chat);
  }, [onChatSelect]);

  if (filteredAndSortedChats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground space-y-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm mb-2">
            {searchTerm ? 'No chats found' : 'No chats found for your location'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filteredAndSortedChats.map((chat) => (
        <ChatItem
          key={chat.id}
          chat={chat}
          isActive={activeChat?.id === chat.id}
          onClick={() => handleChatSelect(chat)}
          unreadCount={unreadCountByChat[chat.id] || 0}
          currentUserId={profile?.user_id}
        />
      ))}
    </div>
  );
});

OptimizedChatList.displayName = 'OptimizedChatList';