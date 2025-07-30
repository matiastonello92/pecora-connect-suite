// Communication system types
export type ChatType = 'private' | 'group' | 'global' | 'announcements';
export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked';
export type ChatMessageType = 'text' | 'image' | 'voice' | 'document' | 'system';
export type NotificationPriority = 'normal' | 'urgent' | 'forced';

export interface ConnectionRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: ConnectionStatus;
  message?: string;
  created_at: string;
  updated_at: string;
  requester?: {
    first_name: string;
    last_name: string;
    position?: string;
    department?: string;
  };
  recipient?: {
    first_name: string;
    last_name: string;
    position?: string;
    department?: string;
  };
}

export interface Chat {
  id: string;
  type: ChatType;
  name?: string;
  description?: string;
  location: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  is_archived: boolean;
  metadata: Record<string, any>;
  participants?: ChatParticipant[];
  last_message?: ChatMessage;
  unread_count?: number;
}

export interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  last_read_at: string;
  is_muted: boolean;
  muted_until?: string;
  notification_settings: Record<string, any>;
  user?: {
    first_name: string;
    last_name: string;
    position?: string;
    department?: string;
    role?: string; // Optional since role system removed
  };
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content?: string;
  message_type: ChatMessageType;
  media_url?: string;
  media_type?: string;
  media_size?: number;
  reply_to_id?: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  is_deleted: boolean;
  metadata: Record<string, any>;
  sender?: {
    first_name: string;
    last_name: string;
    position?: string;
    department?: string;
  };
  reply_to?: ChatMessage;
  read_receipts?: MessageReadReceipt[];
}

export interface MessageReadReceipt {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}

export interface ChatNotification {
  id: string;
  user_id: string;
  chat_id: string;
  message_id?: string;
  type: string;
  priority: NotificationPriority;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  expires_at?: string;
  metadata: Record<string, any>;
}

// Legacy types for backward compatibility
export type MessageType = 'general' | 'urgent' | 'department';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type MessagePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Message {
  id: string;
  from: string;
  to: string[];
  subject: string;
  content: string;
  type: 'general' | 'urgent' | 'department';
  priority: MessagePriority;
  status: MessageStatus;
  department?: string;
  attachments?: string[];
  createdAt: Date;
  readAt?: Date;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: MessagePriority;
  departments: string[];
  roles: string[];
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}
