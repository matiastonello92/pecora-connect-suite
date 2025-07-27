import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatContext } from '@/context/ChatContext';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useUserManagement } from '@/context/UserManagementContext';
import { useTranslation } from '@/lib/i18n';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr, it } from 'date-fns/locale';
import {
  Search,
  UserPlus,
  Check,
  X,
  Clock,
  MessageCircle,
  ArrowLeft,
  MapPin
} from 'lucide-react';

const locales = { en: enUS, fr, it };

interface ConnectionRequestManagerProps {
  onClose: () => void;
}

export const ConnectionRequestManager: React.FC<ConnectionRequestManagerProps> = ({ onClose }) => {
  const { user } = useSimpleAuth();
  const language = 'en'; // Temporary hardcode
  const { users } = useUserManagement();
  const { 
    connectionRequests, 
    sendConnectionRequest, 
    respondToConnectionRequest,
    canSendConnectionRequest,
    getConnectionStatus
  } = useChatContext();
  const { t } = useTranslation(language);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const getLocale = () => locales[language as keyof typeof locales] || enUS;

  // Check if user has privileged role that can bypass location restrictions
  const canAccessAllLocations = () => {
    if (!user) return false;
    
    // Check using auth user role and user management data
    const currentUserProfile = users.find(u => u.id === user.id);
    if (!currentUserProfile) return false;
    
    const privilegedRoles = ['general_manager', 'human_resources'];
    return user?.user_metadata?.role === 'super_admin' || 
           user?.user_metadata?.role === 'manager' ||
           currentUserProfile.accessLevel === 'general_manager' ||
           privilegedRoles.includes(currentUserProfile.restaurantRole || '');
  };

  // Load available users based on location access
  useEffect(() => {
    const loadAvailableUsers = async () => {
      if (!user) return;
      
      setLoadingUsers(true);
      try {
        let filteredUsers = users.filter(u => 
          u.id !== user.id && // Exclude current user
          u.status === 'active' // Only active users
        );

        // Apply location filtering for non-privileged users
        if (!canAccessAllLocations()) {
          const userLocations = user?.user_metadata?.locations || [user?.user_metadata?.location]; // Support both new and old format
          filteredUsers = filteredUsers.filter(u => {
            const targetUserLocations = u.locations || [u.location];
            return userLocations.some(loc => targetUserLocations.includes(loc));
          });
        }

        // Check connection status for each user
        const usersWithStatus = await Promise.all(
          filteredUsers.map(async (targetUser) => {
            const status = await getConnectionStatus(targetUser.id);
            const canSend = await canSendConnectionRequest(targetUser.id);
            return {
              ...targetUser,
              connectionStatus: status,
              canSendRequest: canSend
            };
          })
        );

        setAvailableUsers(usersWithStatus);
      } catch (error) {
        console.error('Error loading available users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadAvailableUsers();
  }, [user, users, getConnectionStatus, canSendConnectionRequest]);

  // Listen for custom event to open connection requests
  useEffect(() => {
    const handleOpenConnectionRequests = () => {
      // The parent component (ChatDashboard) will handle this event
      console.log('Connection requests should be opened');
    };

    window.addEventListener('openConnectionRequests', handleOpenConnectionRequests);
    
    return () => {
      window.removeEventListener('openConnectionRequests', handleOpenConnectionRequests);
    };
  }, []);

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

  // Filter available users based on search term
  const filteredAvailableUsers = availableUsers.filter(targetUser => {
    if (!searchTerm) return targetUser.canSendRequest;
    
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${targetUser.firstName} ${targetUser.lastName}`.toLowerCase();
    const email = targetUser.email?.toLowerCase() || '';
    const position = targetUser.position?.toLowerCase() || '';
    const department = targetUser.department?.toLowerCase() || '';
    
    return targetUser.canSendRequest && (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      position.includes(searchLower) ||
      department.includes(searchLower)
    );
  });

  const handleSendRequest = async () => {
    if (!selectedUser) return;
    
    await sendConnectionRequest(selectedUser.id, requestMessage.trim() || undefined);
    
    setSelectedUser(null);
    setRequestMessage('');
    setShowUserList(false);
    
    // Refresh available users to update connection status
    const usersWithStatus = await Promise.all(
      availableUsers.map(async (targetUser) => {
        const status = await getConnectionStatus(targetUser.id);
        const canSend = await canSendConnectionRequest(targetUser.id);
        return {
          ...targetUser,
          connectionStatus: status,
          canSendRequest: canSend
        };
      })
    );
    setAvailableUsers(usersWithStatus);
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
          
          <Button onClick={() => setShowUserList(true)}>
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
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="available">
              {t('communication.availableUsers')}
            </TabsTrigger>
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

          {/* Available Users Tab */}
          <TabsContent value="available">
            <ScrollArea className="h-96">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-pulse text-muted-foreground">
                    {t('common.loading')}
                  </div>
                </div>
              ) : filteredAvailableUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{searchTerm ? t('communication.noUsersFound') : t('communication.noAvailableUsers')}</p>
                  {!canAccessAllLocations() && (
                    <p className="text-xs mt-2">
                      {t('communication.locationRestrictedMessage')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAvailableUsers.map((targetUser) => (
                    <Card key={targetUser.id} className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>
                                {getInitials(`${targetUser.firstName} ${targetUser.lastName}`)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">
                                {targetUser.firstName} {targetUser.lastName}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {targetUser.position} • {targetUser.department}
                              </p>
              {canAccessAllLocations() && (
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  {(targetUser.locations || [targetUser.location]).join(', ')}
                </p>
              )}
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedUser(targetUser);
                              setShowUserList(true);
                            }}
                            disabled={!targetUser.canSendRequest}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            {t('communication.connect')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

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
        {showUserList && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>{t('communication.sendConnectionRequest')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(`${selectedUser.firstName} ${selectedUser.lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.position} • {selectedUser.department}
                    </p>
                    {canAccessAllLocations() && (
                      <p className="text-xs text-muted-foreground flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {(selectedUser.locations || [selectedUser.location]).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <textarea
                  placeholder={t('communication.optionalMessage')}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full p-2 border rounded-lg resize-none h-24"
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setShowUserList(false);
                    setSelectedUser(null);
                    setRequestMessage('');
                  }}>
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