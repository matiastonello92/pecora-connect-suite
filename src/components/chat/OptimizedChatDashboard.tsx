import React, { memo, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';

import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useLocation } from '@/context/LocationContext';
import { useMessageReminders } from '@/hooks/useMessageReminders';
import { useOptimizedChats, useOptimizedUnreadCounts, useMarkAsRead } from '@/hooks/useOptimizedChatQueries';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
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
  Menu,
  RefreshCw,
  Bug,
  AlertTriangle
} from 'lucide-react';
import { ChatType } from '@/types/communication';
import { OptimizedChatInterface } from './OptimizedChatInterface';
import { ConnectionRequestManager } from './ConnectionRequestManager';
import { GroupManagement } from './GroupManagement';
import { ChatSettings } from './ChatSettings';
import { LocationFilter } from './LocationFilter';
import { ChatSystemStatus } from './ChatSystemStatus';
import { NotificationBadge } from '@/components/ui/notification-badge';
import { OptimizedChatList } from './OptimizedChatList';
import { useState, useEffect } from 'react';

export const OptimizedChatDashboard = memo(() => {
  const { profile } = useSimpleAuth();
  const { userLocations } = useLocation();
  const { processReminders } = useMessageReminders();
  
  // Use optimized hooks
  const { chats, loading, error, refreshChats } = useOptimizedChats();
  const { totalUnreadCount, unreadCountByChat } = useOptimizedUnreadCounts();
  const markAsReadMutation = useMarkAsRead();
  
  const [activeChat, setActiveChat] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | 'all_locations'>('all_locations');
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Listen for navigation events from notifications
  useEffect(() => {
    const handleNavigateToChat = async (event: CustomEvent) => {
      const { chatId } = event.detail;
      
      try {
        const chat = chats.find(c => c.id === chatId);
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
  }, [chats]);

  // Process reminders periodically
  useEffect(() => {
    if (!profile) return;

    processReminders();
    const interval = setInterval(processReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [profile, processReminders]);

  // Auto-mark chat as read when opened
  useEffect(() => {
    if (activeChat) {
      markAsReadMutation.mutate(activeChat.id);
    }
  }, [activeChat, markAsReadMutation]);

  const handleChatSelect = useCallback((chat: any) => {
    setActiveChat(chat);
    setIsMobileMenuOpen(false);
  }, []);

  const handleCreateChat = async (type: ChatType) => {
    if (type === 'group') {
      setShowGroups(true);
    } else if (type === 'private') {
      setShowConnections(true);
    }
    setShowCreateChat(false);
  };

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
              Communication
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
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border-border focus:bg-background"
            />
          </div>

          {/* Location Filter */}
          <div className="mt-3">
            <LocationFilter 
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
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
                  Create Group Chat
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start hover:bg-accent focus:bg-accent active:bg-accent"
                  onClick={() => setShowConnections(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  New Private Chat
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
                  Loading...
                </div>
              </div>
            ) : (
              <OptimizedChatList
                chats={chats}
                activeChat={activeChat}
                onChatSelect={handleChatSelect}
                unreadCountByChat={unreadCountByChat}
                searchTerm={searchTerm}
                selectedLocation={selectedLocation}
              />
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Interface */}
      <div className={`${!activeChat || isMobileMenuOpen ? 'hidden md:flex' : 'flex'} flex-1 flex-col`}>
        {activeChat ? (
          <OptimizedChatInterface 
            chat={activeChat} 
            onBack={() => setActiveChat(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a chat</h3>
              <p className="text-sm">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

OptimizedChatDashboard.displayName = 'OptimizedChatDashboard';