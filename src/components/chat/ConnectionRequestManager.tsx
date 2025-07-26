import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatContext } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr, it } from 'date-fns/locale';
import {
  Search,
  UserPlus,
  Check,
  X,
  Clock,
  MessageCircle,
  ArrowLeft
} from 'lucide-react';

const locales = { en: enUS, fr, it };

interface ConnectionRequestManagerProps {
  onClose: () => void;
}

export const ConnectionRequestManager: React.FC<ConnectionRequestManagerProps> = ({ onClose }) => {
  const { 
    connectionRequests, 
    sendConnectionRequest, 
    respondToConnectionRequest 
  } = useChatContext();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSendRequest, setShowSendRequest] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [requestMessage, setRequestMessage] = useState('');

  const getLocale = () => locales[i18n.language as keyof typeof locales] || enUS;

  const incomingRequests = connectionRequests.filter(
    req => req.recipient_id === user?.id && req.status === 'pending'
  );
  
  const outgoingRequests = connectionRequests.filter(
    req => req.requester_id === user?.id && req.status === 'pending'
  );
  
  const acceptedRequests = connectionRequests.filter(
    req => req.status === 'accepted' && 
    (req.requester_id === user?.id || req.recipient_id === user?.id)
  );

  const handleSendRequest = async () => {
    if (!recipientEmail.trim()) return;
    
    // In a real implementation, you'd lookup the user by email
    // For now, we'll use a placeholder user ID
    await sendConnectionRequest('placeholder-user-id', requestMessage.trim() || undefined);
    
    setRecipientEmail('');
    setRequestMessage('');
    setShowSendRequest(false);
  };

  const handleAccept = async (requestId: string) => {
    await respondToConnectionRequest(requestId, true);
  };

  const handleDecline = async (requestId: string) => {
    await respondToConnectionRequest(requestId, false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-accent focus:bg-accent active:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <UserPlus className="h-5 w-5" />
            <span>{t('communication.connections')}</span>
          </CardTitle>
          
          <Button onClick={() => setShowSendRequest(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            {t('communication.sendRequest')}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('communication.searchConnections')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="incoming" className="flex items-center space-x-2">
              <span>{t('communication.incoming')}</span>
              {incomingRequests.length > 0 && (
                <Badge variant="default" className="ml-1">
                  {incomingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing">
              {t('communication.outgoing')}
            </TabsTrigger>
            <TabsTrigger value="accepted">
              {t('communication.connections')}
            </TabsTrigger>
          </TabsList>

          {/* Incoming Requests */}
          <TabsContent value="incoming">
            <ScrollArea className="h-96">
              {incomingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('communication.noIncomingRequests')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incomingRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>
                                {getInitials('User Name')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">User Name</h4>
                              <p className="text-sm text-muted-foreground">
                                Position • Department
                              </p>
                              {request.message && (
                                <p className="text-sm mt-1 italic">
                                  "{request.message}"
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(request.created_at), {
                                  addSuffix: true,
                                  locale: getLocale()
                                })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleAccept(request.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              {t('communication.accept')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDecline(request.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              {t('communication.decline')}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Outgoing Requests */}
          <TabsContent value="outgoing">
            <ScrollArea className="h-96">
              {outgoingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('communication.noOutgoingRequests')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {outgoingRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>
                                {getInitials('User Name')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">User Name</h4>
                              <p className="text-sm text-muted-foreground">
                                Position • Department
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(request.created_at), {
                                  addSuffix: true,
                                  locale: getLocale()
                                })}
                              </p>
                            </div>
                          </div>
                          
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {t('communication.pending')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Accepted Connections */}
          <TabsContent value="accepted">
            <ScrollArea className="h-96">
              {acceptedRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('communication.noConnections')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {acceptedRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>
                                {getInitials('User Name')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">User Name</h4>
                              <p className="text-sm text-muted-foreground">
                                Position • Department
                              </p>
                            </div>
                          </div>
                          
                          <Button variant="outline" size="sm">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {t('communication.message')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Send Request Modal */}
        {showSendRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>{t('communication.sendConnectionRequest')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder={t('communication.recipientEmail')}
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
                <textarea
                  placeholder={t('communication.optionalMessage')}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full p-2 border rounded-lg resize-none h-24"
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowSendRequest(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={handleSendRequest}>
                    {t('communication.send')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};