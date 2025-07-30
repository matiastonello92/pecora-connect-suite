import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, MoreVertical } from 'lucide-react';
// import { useChat } from '@/context/ChatContext'; // TODO: Fix context export
import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_edited: boolean;
  is_deleted: boolean;
  message_type: 'text' | 'image' | 'file';
  media_url?: string;
  media_type?: string;
  reply_to_id?: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

const MESSAGES_PER_PAGE = 50;

export const MessageListWithPagination = () => {
  // TODO: Implement useChatContext once ChatContext exports are fixed
  const currentChat = null;
  const allMessages: Message[] = [];
  const deleteMessage = async (id: string) => {};
  const { profile } = useEnhancedAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Implement pagination
  const messages = useMemo(() => {
    return allMessages.slice(0, page * MESSAGES_PER_PAGE);
  }, [allMessages, page]);

  const hasMoreMessages = allMessages.length > messages.length;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages) return;
    
    setIsLoadingMore(true);
    setPage(prev => prev + 1);
    setIsLoadingMore(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Select a chat to view messages</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Load More Button */}
      {hasMoreMessages && (
        <div className="p-4 border-b">
          <Button
            variant="outline"
            onClick={loadMoreMessages}
            disabled={isLoadingMore}
            className="w-full"
          >
            {isLoadingMore ? 'Loading...' : 'Load More Messages'}
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <Card key={message.id} className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.sender?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {getInitials(
                    message.sender?.first_name || '',
                    message.sender?.last_name || ''
                  )}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {message.sender?.first_name} {message.sender?.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </span>
                  {message.is_edited && (
                    <Badge variant="secondary" className="text-xs">
                      Edited
                    </Badge>
                  )}
                </div>

                {message.is_deleted ? (
                  <p className="text-muted-foreground italic text-sm">
                    This message was deleted
                  </p>
                ) : (
                  <>
                    {message.reply_to_id && (
                      <div className="bg-muted p-2 rounded mb-2 text-sm">
                        <p className="text-muted-foreground">Replying to a message</p>
                      </div>
                    )}
                    
                    <div className="text-sm">
                      {message.message_type === 'text' ? (
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      ) : message.message_type === 'image' ? (
                        <div className="space-y-2">
                          <img
                            src={message.media_url}
                            alt="Shared image"
                            className="max-w-xs rounded-lg"
                          />
                          {message.content && (
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <a
                            href={message.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            📎 {message.content || 'File attachment'}
                          </a>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Message Actions */}
              {profile?.user_id === message.sender_id && !message.is_deleted && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDeleteMessage(message.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </Card>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};