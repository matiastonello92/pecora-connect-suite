import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Message, Announcement, ShiftNote, MessageType, MessagePriority } from '@/types/communication';

interface CommunicationState {
  messages: Message[];
  announcements: Announcement[];
  shiftNotes: ShiftNote[];
  unreadCount: number;
  loading: boolean;
}

type CommunicationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_MESSAGES'; payload: Message[] }
  | { type: 'LOAD_ANNOUNCEMENTS'; payload: Announcement[] }
  | { type: 'LOAD_SHIFT_NOTES'; payload: ShiftNote[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'ADD_ANNOUNCEMENT'; payload: Announcement }
  | { type: 'ADD_SHIFT_NOTE'; payload: ShiftNote }
  | { type: 'MARK_MESSAGE_READ'; payload: string }
  | { type: 'UPDATE_UNREAD_COUNT'; payload: number };

const communicationReducer = (state: CommunicationState, action: CommunicationAction): CommunicationState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOAD_MESSAGES':
      return { ...state, messages: action.payload };
    case 'LOAD_ANNOUNCEMENTS':
      return { ...state, announcements: action.payload };
    case 'LOAD_SHIFT_NOTES':
      return { ...state, shiftNotes: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [action.payload, ...state.messages] };
    case 'ADD_ANNOUNCEMENT':
      return { ...state, announcements: [action.payload, ...state.announcements] };
    case 'ADD_SHIFT_NOTE':
      return { ...state, shiftNotes: [action.payload, ...state.shiftNotes] };
    case 'MARK_MESSAGE_READ':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload ? { ...msg, status: 'read', readAt: new Date() } : msg
        )
      };
    case 'UPDATE_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
    default:
      return state;
  }
};

interface CommunicationContextType extends CommunicationState {
  sendMessage: (to: string[], subject: string, content: string, type: MessageType, priority: MessagePriority) => void;
  createAnnouncement: (title: string, content: string, priority: MessagePriority, departments: string[], roles: string[]) => void;
  addShiftNote: (shift: 'morning' | 'afternoon' | 'evening' | 'night', department: string, notes: string) => void;
  markMessageAsRead: (messageId: string) => void;
  getMessagesByDepartment: (department: string) => Message[];
  getUnreadMessages: () => Message[];
}

const CommunicationContext = createContext<CommunicationContextType | undefined>(undefined);

export const CommunicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(communicationReducer, {
    messages: [],
    announcements: [],
    shiftNotes: [],
    unreadCount: 0,
    loading: false
  });

  // Mock data
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: '1',
        from: 'manager@pecora.com',
        to: ['kitchen@pecora.com'],
        subject: 'Inventory Update Required',
        content: 'Please complete the inventory count for dry goods by end of shift.',
        type: 'department',
        priority: 'medium',
        status: 'delivered',
        department: 'kitchen',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: '2',
        from: 'chef@pecora.com',
        to: ['all@pecora.com'],
        subject: 'Menu Change',
        content: 'Today\'s special: Truffle risotto. Limited quantities available.',
        type: 'general',
        priority: 'high',
        status: 'sent',
        createdAt: new Date(Date.now() - 30 * 60 * 1000)
      }
    ];

    const mockAnnouncements: Announcement[] = [
      {
        id: '1',
        title: 'Team Meeting Tomorrow',
        content: 'Monthly team meeting scheduled for tomorrow at 2 PM in the main dining area.',
        priority: 'medium',
        departments: ['kitchen', 'service', 'management'],
        roles: ['base', 'manager'],
        createdBy: 'manager@pecora.com',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        isActive: true
      }
    ];

    const mockShiftNotes: ShiftNote[] = [
      {
        id: '1',
        shift: 'morning',
        date: new Date(),
        department: 'kitchen',
        notes: 'Low on tomatoes, ordered fresh supply. Prep for lunch rush complete.',
        createdBy: 'kitchen@pecora.com',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
      }
    ];

    dispatch({ type: 'LOAD_MESSAGES', payload: mockMessages });
    dispatch({ type: 'LOAD_ANNOUNCEMENTS', payload: mockAnnouncements });
    dispatch({ type: 'LOAD_SHIFT_NOTES', payload: mockShiftNotes });
    dispatch({ type: 'UPDATE_UNREAD_COUNT', payload: 1 });
  }, []);

  const sendMessage = (to: string[], subject: string, content: string, type: MessageType, priority: MessagePriority) => {
    const message: Message = {
      id: Date.now().toString(),
      from: 'current@user.com',
      to,
      subject,
      content,
      type,
      priority,
      status: 'sent',
      createdAt: new Date()
    };
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  };

  const createAnnouncement = (title: string, content: string, priority: MessagePriority, departments: string[], roles: string[]) => {
    const announcement: Announcement = {
      id: Date.now().toString(),
      title,
      content,
      priority,
      departments,
      roles,
      createdBy: 'current@user.com',
      createdAt: new Date(),
      isActive: true
    };
    dispatch({ type: 'ADD_ANNOUNCEMENT', payload: announcement });
  };

  const addShiftNote = (shift: 'morning' | 'afternoon' | 'evening' | 'night', department: string, notes: string) => {
    const shiftNote: ShiftNote = {
      id: Date.now().toString(),
      shift,
      date: new Date(),
      department,
      notes,
      createdBy: 'current@user.com',
      createdAt: new Date()
    };
    dispatch({ type: 'ADD_SHIFT_NOTE', payload: shiftNote });
  };

  const markMessageAsRead = (messageId: string) => {
    dispatch({ type: 'MARK_MESSAGE_READ', payload: messageId });
  };

  const getMessagesByDepartment = (department: string) => {
    return state.messages.filter(msg => msg.department === department || msg.type === 'general');
  };

  const getUnreadMessages = () => {
    return state.messages.filter(msg => msg.status !== 'read');
  };

  return (
    <CommunicationContext.Provider value={{
      ...state,
      sendMessage,
      createAnnouncement,
      addShiftNote,
      markMessageAsRead,
      getMessagesByDepartment,
      getUnreadMessages
    }}>
      {children}
    </CommunicationContext.Provider>
  );
};

export const useCommunication = () => {
  const context = useContext(CommunicationContext);
  if (!context) {
    throw new Error('useCommunication must be used within a CommunicationProvider');
  }
  return context;
};