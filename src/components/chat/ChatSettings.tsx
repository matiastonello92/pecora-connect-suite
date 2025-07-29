import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Bell, 
  BellOff, 
  Users, 
  Info, 
  LogOut,
  Archive,
  Trash2,
  Shield
} from 'lucide-react';
import { useChatContext } from '@/context/ChatContext';
import { useSimpleAuth } from '@/context/SimpleAuthContext';

import { useToast } from '@/hooks/use-toast';

interface ChatSettingsProps {
  children?: React.ReactNode;
}

export const ChatSettings: React.FC<ChatSettingsProps> = ({ children }) => {
  const { activeChat, muteChat } = useChatContext();
  const { profile } = useSimpleAuth();
  
  
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);

  if (!activeChat) return null;

  const getCurrentUserParticipant = () => {
    return activeChat.participants?.find(p => p.user_id === profile?.user_id);
  };

  const currentParticipant = getCurrentUserParticipant();
  const isMuted = currentParticipant?.is_muted || false;
  const isAdmin = currentParticipant?.role === 'admin';
  const isCreator = activeChat.created_by === profile?.user_id;

  const handleMuteToggle = async () => {
    try {
      await muteChat(activeChat.id, !isMuted);
      toast({
        title: isMuted ? 'Chat Unmuted' : 'Chat Muted',
        description: isMuted 
          ? 'You will now receive notifications from this chat' 
          : 'You will no longer receive notifications from this chat'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update chat settings',
        variant: 'destructive'
      });
    }
  };

  const handleLeaveChat = () => {
    // TODO: Implement leave chat functionality
    toast({
      title: 'Leave Chat',
      description: 'Are you sure you want to leave this chat?',
      variant: 'destructive'
    });
  };

  const getChatTypeDisplay = () => {
    switch (activeChat.type) {
      case 'private':
        return { label: 'Private Chat', icon: '💬' };
      case 'group':
        return { label: 'Group Chat', icon: '👥' };
      case 'global':
        return { label: 'Global Chat', icon: '🌍' };
      case 'announcements':
        return { label: 'Announcements', icon: '📢' };
      default:
        return { label: 'Unknown', icon: '❓' };
    }
  };

  const getParticipantName = (participant: any) => {
    if (participant.user) {
      return `${participant.user.first_name} ${participant.user.last_name}`;
    }
    return 'Unknown User';
  };

  const chatTypeDisplay = getChatTypeDisplay();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Chat Settings</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Chat Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Chat Information</h3>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Chat Name</span>
                  <span className="text-sm font-medium">
                    {activeChat.name || getChatTypeDisplay().label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Chat Type</span>
                  <Badge variant="secondary" className="text-xs">
                    {chatTypeDisplay.icon} {chatTypeDisplay.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Participants</span>
                  <span className="text-sm font-medium">
                    {activeChat.participants?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Notifications</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    <div>
                      <Label className="text-sm font-medium">
                        {isMuted ? 'Unmute Chat' : 'Mute Chat'}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {isMuted 
                          ? 'This chat is currently muted' 
                          : 'You will receive notifications from this chat'
                        }
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={!isMuted} 
                    onCheckedChange={handleMuteToggle}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isNotificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                    <div>
                      <Label className="text-sm font-medium">
                        Push Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receive push notifications for new messages
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={isNotificationsEnabled} 
                    onCheckedChange={setIsNotificationsEnabled}
                  />
                </div>
              </div>
            </div>

            {/* Participants (for group chats) */}
            {activeChat.type === 'group' && activeChat.participants && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Participants</h3>
                </div>
                
                <div className="space-y-2">
                  {activeChat.participants.map((participant: any) => (
                    <div key={participant.user_id} className="flex items-center space-x-3 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getParticipantName(participant).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {getParticipantName(participant)}
                           {participant.user_id === profile?.user_id && (
                             <span className="text-xs text-muted-foreground ml-1">
                               (You)
                             </span>
                           )}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {participant.role === 'admin' && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Chat Actions */}
            <div className="space-y-3">
              {activeChat.type !== 'global' && activeChat.type !== 'announcements' && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleLeaveChat}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {activeChat.type === 'private' 
                    ? 'Delete Conversation' 
                    : 'Leave Group'
                  }
                </Button>
              )}

              {(isAdmin || isCreator) && activeChat.type === 'group' && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Chat
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};