// Communication system types
export type MessageType = 'general' | 'urgent' | 'department' | 'shift';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type MessagePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Message {
  id: string;
  from: string;
  to: string[];
  subject: string;
  content: string;
  type: MessageType;
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

export interface ShiftNote {
  id: string;
  shift: 'morning' | 'afternoon' | 'evening' | 'night';
  date: Date;
  department: string;
  notes: string;
  createdBy: string;
  createdAt: Date;
}