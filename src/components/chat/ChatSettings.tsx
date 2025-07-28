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
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';

interface ChatSettingsProps {
  children?: React.ReactNode;
}

export const ChatSettings: React.FC<ChatSettingsProps> = ({ children }) => {
  const { activeChat, muteChat } = useChatContext();
  const { profile } = useSimpleAuth();
  const language = 'en'; // Temporary hardcode
  const { t } = useTranslation(language);
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
        title: isMuted ? t('communication.chatUnmuted') : t('communication.chatMuted'),
        description: isMuted 
          ? t('communication.chatUnmutedDesc') 
          : t('communication.chatMutedDesc')
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('communication.muteError'),
        variant: 'destructive'
      });
    }
  };

  const handleLeaveChat = () => {
    // TODO: Implement leave chat functionality
    toast({
      title: t('communication.leaveChat'),
      description: t('communication.leaveChatConfirm'),
      variant: 'destructive'
    });
  };

  const getChatTypeDisplay = () => {
    switch (activeChat.type) {
      case 'private':
        return { label: t('communication.chatTypes.private'), icon: '💬' };
      case 'group':
        return { label: t('communication.chatTypes.group'), icon: '👥' };
      case 'global':
        return { label: t('communication.chatTypes.global'), icon: '🌍' };
      case 'announcements':
        return { label: t('communication.chatTypes.announcements'), icon: '📢' };
      default:
        return { label: t('communication.chatTypes.unknown'), icon: '❓' };
    }
  };

  const getParticipantName = (participant: any) => {
    if (participant.user) {
      return `${participant.user.first_name} ${participant.user.last_name}`;
    }
    return t('communication.unknownUser');
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
            <span>{t('communication.chatSettings')}</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Chat Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">{t('communication.chatInfo')}</h3>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('communication.chatName')}</span>
                  <span className="text-sm font-medium">
                    {activeChat.name || getChatTypeDisplay().label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('communication.chatType')}</span>
                  <Badge variant="secondary" className="text-xs">
                    {chatTypeDisplay.icon} {chatTypeDisplay.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('communication.participants')}</span>
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
                <h3 className="font-medium">{t('communication.notifications')}</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    <div>
                      <Label className="text-sm font-medium">
                        {isMuted ? t('communication.unmute') : t('communication.mute')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {isMuted 
                          ? t('communication.chatCurrentlyMuted') 
                          : t('communication.chatNotMuted')
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
                        {t('communication.pushNotifications')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('communication.pushNotificationsDesc')}
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
                  <h3 className="font-medium">{t('communication.participants')}</h3>
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
                               ({t('communication.you')})
                             </span>
                           )}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {participant.role === 'admin' && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            {t('communication.admin')}
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
                    ? t('communication.deleteConversation') 
                    : t('communication.leaveGroup')
                  }
                </Button>
              )}

              {(isAdmin || isCreator) && activeChat.type === 'group' && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {t('communication.archiveChat')}
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};