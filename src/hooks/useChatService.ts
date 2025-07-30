/**
 * Chat Service Hook
 * Separates chat business logic from UI components
 * Phase 3: Business Logic Separation
 */

import { useState, useCallback } from 'react';
import { DataService } from '@/core/services';
import { useToast } from '@/hooks/use-toast';

export interface UseChatServiceOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useChatService(options: UseChatServiceOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const sendMessage = useCallback(async (chatId: string, content: string, messageType = 'text') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await DataService.insert('chat_messages', {
        chat_id: chatId,
        content,
        message_type: messageType,
        created_at: new Date().toISOString()
      });
      
      if (error) {
        const errorMessage = error.message || 'Failed to send message';
        setError(errorMessage);
        toast({
          title: 'Message Error',
          description: errorMessage,
          variant: 'destructive'
        });
        return { success: false, error: errorMessage };
      }

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createChat = useCallback(async (chatData: {
    name?: string;
    type: 'private' | 'group' | 'location';
    participants: string[];
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await DataService.insert('chats', {
        name: chatData.name,
        chat_type: chatData.type,
        created_at: new Date().toISOString()
      });
      
      if (error) {
        const errorMessage = error.message || 'Failed to create chat';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Add participants
      if (data && chatData.participants.length > 0) {
        const participantPromises = chatData.participants.map(userId =>
          DataService.insert('chat_participants', {
            chat_id: data.id,
            user_id: userId,
            role: 'member',
            joined_at: new Date().toISOString()
          })
        );
        
        await Promise.all(participantPromises);
      }

      toast({
        title: 'Chat Created',
        description: 'New chat has been created successfully'
      });

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const addParticipant = useCallback(async (chatId: string, userId: string, role = 'member') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await DataService.insert('chat_participants', {
        chat_id: chatId,
        user_id: userId,
        role,
        joined_at: new Date().toISOString()
      });
      
      if (error) {
        const errorMessage = error.message || 'Failed to add participant';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      toast({
        title: 'Participant Added',
        description: 'User has been added to the chat'
      });

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const markAsRead = useCallback(async (chatId: string, messageId?: string) => {
    try {
      const readData = {
        chat_id: chatId,
        read_at: new Date().toISOString()
      };

      if (messageId) {
        Object.assign(readData, { message_id: messageId });
      }

      const { error } = await DataService.insert('message_reads', readData);
      
      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to mark as read';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const clearError = () => setError(null);

  return {
    sendMessage,
    createChat,
    addParticipant,
    markAsRead,
    isLoading,
    error,
    clearError
  };
}