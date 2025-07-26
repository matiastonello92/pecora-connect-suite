import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCommunication } from '@/context/CommunicationContext';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Bell, FileText, Send, Plus, Clock, AlertTriangle } from 'lucide-react';
import { MessageType, MessagePriority } from '@/types/communication';

export const Communication = () => {
  const { user, language } = useAuth();
  const { t } = useTranslation(language);
  const {
    messages,
    announcements,
    shiftNotes,
    unreadCount,
    sendMessage,
    createAnnouncement,
    addShiftNote,
    markMessageAsRead,
    getUnreadMessages
  } = useCommunication();

  const [newMessage, setNewMessage] = useState({
    to: '',
    subject: '',
    content: '',
    type: 'general' as MessageType,
    priority: 'medium' as MessagePriority
  });

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium' as MessagePriority,
    departments: [] as string[],
    roles: [] as string[]
  });

  const [newShiftNote, setNewShiftNote] = useState({
    shift: 'morning' as 'morning' | 'afternoon' | 'evening' | 'night',
    department: user?.department || '',
    notes: ''
  });

  const handleSendMessage = () => {
    if (newMessage.subject && newMessage.content) {
      sendMessage(
        [newMessage.to],
        newMessage.subject,
        newMessage.content,
        newMessage.type,
        newMessage.priority
      );
      setNewMessage({
        to: '',
        subject: '',
        content: '',
        type: 'general',
        priority: 'medium'
      });
    }
  };

  const handleCreateAnnouncement = () => {
    if (newAnnouncement.title && newAnnouncement.content) {
      createAnnouncement(
        newAnnouncement.title,
        newAnnouncement.content,
        newAnnouncement.priority,
        newAnnouncement.departments,
        newAnnouncement.roles
      );
      setNewAnnouncement({
        title: '',
        content: '',
        priority: 'medium',
        departments: [],
        roles: []
      });
    }
  };

  const handleAddShiftNote = () => {
    if (newShiftNote.notes) {
      addShiftNote(newShiftNote.shift, newShiftNote.department, newShiftNote.notes);
      setNewShiftNote({
        shift: 'morning',
        department: user?.department || '',
        notes: ''
      });
    }
  };

  const getPriorityColor = (priority: MessagePriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat(language, {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('communication')}</h1>
          <p className="text-muted-foreground">
            Manage team communication and updates
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="ml-2">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      <Tabs defaultValue="messages" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="shift-notes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Shift Notes
          </TabsTrigger>
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          <div className="grid gap-4">
            {messages.length > 0 ? (
              messages.map((message) => (
                <Card key={message.id} className={`cursor-pointer transition-colors ${
                  message.status !== 'read' ? 'border-primary/50 bg-primary/5' : ''
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(message.priority)}`} />
                        <CardTitle className="text-sm">{message.subject}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {message.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(message.createdAt)}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">From: {message.from}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{message.content}</p>
                    {message.status !== 'read' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => markMessageAsRead(message.id)}
                      >
                        Mark as Read
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No messages yet</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <div className="grid gap-4">
            {announcements.length > 0 ? (
              announcements.map((announcement) => (
                <Card key={announcement.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(announcement.priority)}`} />
                        <CardTitle>{announcement.title}</CardTitle>
                        {announcement.priority === 'urgent' && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(announcement.createdAt)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-3">{announcement.content}</p>
                    <div className="flex gap-2">
                      {announcement.departments.map(dept => (
                        <Badge key={dept} variant="secondary" className="text-xs">
                          {dept}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No announcements</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="shift-notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Shift Note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={newShiftNote.shift}
                  onValueChange={(value: any) => setNewShiftNote({ ...newShiftNote, shift: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  value={newShiftNote.department}
                  onChange={(e) => setNewShiftNote({ ...newShiftNote, department: e.target.value })}
                  placeholder="Department"
                />
              </div>

              <Textarea
                value={newShiftNote.notes}
                onChange={(e) => setNewShiftNote({ ...newShiftNote, notes: e.target.value })}
                placeholder="Shift notes..."
                rows={3}
              />

              <Button onClick={handleAddShiftNote} className="w-full">
                Add Shift Note
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {shiftNotes.length > 0 ? (
              shiftNotes.map((note) => (
                <Card key={note.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{note.shift}</Badge>
                        <Badge variant="secondary">{note.department}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(note.createdAt)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p>{note.notes}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No shift notes</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="send" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Send Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={newMessage.to}
                  onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
                  placeholder="To (email)"
                />

                <Input
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  placeholder="Subject"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={newMessage.type}
                    onValueChange={(value: MessageType) => setNewMessage({ ...newMessage, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="shift">Shift</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={newMessage.priority}
                    onValueChange={(value: MessagePriority) => setNewMessage({ ...newMessage, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  placeholder="Message content..."
                  rows={4}
                />

                <Button onClick={handleSendMessage} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Create Announcement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  placeholder="Announcement title"
                />

                <Textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  placeholder="Announcement content..."
                  rows={4}
                />

                <Select
                  value={newAnnouncement.priority}
                  onValueChange={(value: MessagePriority) => setNewAnnouncement({ ...newAnnouncement, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleCreateAnnouncement} className="w-full">
                  <Bell className="h-4 w-4 mr-2" />
                  Create Announcement
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};