import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useChatContext } from '@/context/ChatContext';
import { useSimpleAuth } from '@/context/SimpleAuthContext';

import {
  Users,
  Settings,
  UserPlus,
  UserMinus,
  Crown,
  Upload,
  Edit,
  Trash2,
  LogOut
} from 'lucide-react';

interface GroupManagementProps {
  onClose: () => void;
}

export const GroupManagement: React.FC<GroupManagementProps> = ({ onClose }) => {
  const { activeChat, createChat, updateChat, addParticipant, removeParticipant, updateParticipantRole } = useChatContext();
  const { profile } = useSimpleAuth();
  
  
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editingGroupInfo, setEditingGroupInfo] = useState(false);

  // Mock users for demonstration - in real app, fetch from API
  const availableUsers = [
    { user_id: '1', name: 'John Doe', position: 'Manager', department: 'Kitchen' },
    { user_id: '2', name: 'Jane Smith', position: 'Server', department: 'Service' },
    { user_id: '3', name: 'Mike Johnson', position: 'Chef', department: 'Kitchen' },
    { user_id: '4', name: 'Sarah Wilson', position: 'Host', department: 'Service' },
  ];

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    
    const newChat = await createChat('group', groupName, selectedUsers);
    if (newChat) {
      setShowCreateGroup(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedUsers([]);
    }
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (activeChat) {
      await removeParticipant(activeChat.id, userId);
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    if (activeChat) {
      await updateParticipantRole(activeChat.id, userId, 'admin');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (showCreateGroup) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Create Group</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Group Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center cursor-pointer hover:bg-muted/80 focus:bg-muted/80 active:bg-muted/80 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Group name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
                <Input
                  placeholder="Group description (optional)..."
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* User Selection */}
          <div>
            <h3 className="font-medium mb-3">Add Participants</h3>
            <ScrollArea className="h-64 border rounded-lg">
              <div className="p-3 space-y-2">
                {availableUsers.map((user) => (
                  <div key={user.user_id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted focus:bg-muted active:bg-muted transition-colors">
                    <Checkbox
                      checked={selectedUsers.includes(user.user_id)}
                      onCheckedChange={(checked) => handleUserSelection(user.user_id, checked as boolean)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.position} • {user.department}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCreateGroup(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={!groupName.trim()}>
              Create Group
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activeChat || activeChat.type !== 'group') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Group Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Button onClick={() => setShowCreateGroup(true)}>
              <Users className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>{activeChat.name || 'Group Info'}</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setEditingGroupInfo(!editingGroupInfo)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Group Info */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">
              {getInitials(activeChat.name || 'Group')}
            </AvatarFallback>
          </Avatar>
          
          {editingGroupInfo ? (
            <div className="flex-1 space-y-2">
              <Input
                value={activeChat.name || ''}
                onChange={(e) => {/* Update group name */}}
                placeholder="Group name..."
              />
              <Input
                value={activeChat.description || ''}
                onChange={(e) => {/* Update group description */}}
                placeholder="Group description..."
              />
            </div>
          ) : (
            <div className="flex-1">
              <h3 className="text-lg font-medium">{activeChat.name}</h3>
              <p className="text-sm text-muted-foreground">
                {activeChat.description || 'No description'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {`${activeChat.participants?.length || 0} participants`}
              </p>
            </div>
          )}
        </div>

        {/* Participants */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Participants</h3>
            <Button size="sm" variant="outline">
              <UserPlus className="h-4 w-4 mr-1" />
              Add Member
            </Button>
          </div>
          
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {activeChat.participants?.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(
                          participant.user 
                            ? `${participant.user.first_name} ${participant.user.last_name}`
                            : 'Unknown'
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {participant.user 
                          ? `${participant.user.first_name} ${participant.user.last_name}`
                          : 'Unknown User'}
                      </p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-muted-foreground">
                          {participant.user?.position}
                        </p>
                        {participant.role === 'admin' && (
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {participant.role !== 'admin' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMakeAdmin(participant.user_id)}
                      >
                        <Crown className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveParticipant(participant.user_id)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Group Actions */}
        <div className="border-t pt-4 space-y-2">
          <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
            <LogOut className="h-4 w-4 mr-2" />
            Leave Group
          </Button>
          
          <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Group
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};