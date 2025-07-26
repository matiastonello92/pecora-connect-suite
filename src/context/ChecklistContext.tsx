import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ChecklistTemplate, ChecklistSession, ChecklistItem } from '@/types/checklist';

interface ChecklistState {
  templates: ChecklistTemplate[];
  sessions: ChecklistSession[];
  loading: boolean;
}

type ChecklistAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_TEMPLATES'; payload: ChecklistTemplate[] }
  | { type: 'LOAD_SESSIONS'; payload: ChecklistSession[] }
  | { type: 'ADD_TEMPLATE'; payload: ChecklistTemplate }
  | { type: 'UPDATE_TEMPLATE'; payload: ChecklistTemplate }
  | { type: 'DELETE_TEMPLATE'; payload: string }
  | { type: 'START_CHECKLIST'; payload: ChecklistSession }
  | { type: 'UPDATE_CHECKLIST_ITEM'; payload: { sessionId: string; itemId: string; completed: boolean; notes?: string } }
  | { type: 'COMPLETE_CHECKLIST'; payload: string };

const checklistReducer = (state: ChecklistState, action: ChecklistAction): ChecklistState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOAD_TEMPLATES':
      return { ...state, templates: action.payload };
    case 'LOAD_SESSIONS':
      return { ...state, sessions: action.payload };
    case 'ADD_TEMPLATE':
      return { ...state, templates: [...state.templates, action.payload] };
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map(template =>
          template.id === action.payload.id ? action.payload : template
        )
      };
    case 'DELETE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter(template => template.id !== action.payload)
      };
    case 'START_CHECKLIST':
      return { ...state, sessions: [...state.sessions, action.payload] };
    case 'UPDATE_CHECKLIST_ITEM':
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.sessionId
            ? {
                ...session,
                items: session.items.map(item =>
                  item.id === action.payload.itemId
                    ? {
                        ...item,
                        completed: action.payload.completed,
                        completedAt: action.payload.completed ? new Date() : undefined,
                        notes: action.payload.notes || item.notes
                      }
                    : item
                )
              }
            : session
        )
      };
    case 'COMPLETE_CHECKLIST':
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload
            ? { ...session, status: 'completed', completedAt: new Date() }
            : session
        )
      };
    default:
      return state;
  }
};

interface ChecklistContextType extends ChecklistState {
  addTemplate: (template: Omit<ChecklistTemplate, 'id'>) => void;
  updateTemplate: (template: ChecklistTemplate) => void;
  deleteTemplate: (templateId: string) => void;
  startChecklist: (templateId: string) => void;
  updateChecklistItem: (sessionId: string, itemId: string, completed: boolean, notes?: string) => void;
  completeChecklist: (sessionId: string) => void;
  getActiveChecklists: () => ChecklistSession[];
  getTemplatesByDepartment: (department: string) => ChecklistTemplate[];
}

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

export const ChecklistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(checklistReducer, {
    templates: [],
    sessions: [],
    loading: false
  });

  // Mock data
  useEffect(() => {
    const mockTemplates: ChecklistTemplate[] = [
      {
        id: '1',
        name: 'Opening Kitchen Checklist',
        description: 'Daily tasks to complete when opening the kitchen',
        department: 'kitchen',
        frequency: 'daily',
        estimatedTime: 30,
        status: 'active',
        items: [
          {
            id: '1',
            title: 'Check refrigerator temperatures',
            description: 'Ensure all refrigerators are at correct temperature (0-4°C)',
            isRequired: true,
            category: 'safety',
            order: 1
          },
          {
            id: '2',
            title: 'Inspect equipment',
            description: 'Visual inspection of all kitchen equipment for damage',
            isRequired: true,
            category: 'equipment',
            order: 2
          },
          {
            id: '3',
            title: 'Check gas connections',
            description: 'Ensure all gas connections are secure and no leaks',
            isRequired: true,
            category: 'safety',
            order: 3
          },
          {
            id: '4',
            title: 'Stock prep stations',
            description: 'Ensure all prep stations have necessary tools and ingredients',
            isRequired: false,
            category: 'preparation',
            order: 4
          }
        ],
        createdBy: 'chef@pecora.com',
        createdAt: new Date('2024-01-15'),
        isActive: true
      },
      {
        id: '2',
        name: 'Closing Bar Checklist',
        description: 'End of day tasks for bar service',
        department: 'service',
        frequency: 'daily',
        estimatedTime: 45,
        status: 'active',
        items: [
          {
            id: '1',
            title: 'Clean all glassware',
            description: 'Wash and sanitize all glasses and bar tools',
            isRequired: true,
            category: 'cleaning',
            order: 1
          },
          {
            id: '2',
            title: 'Inventory spirits',
            description: 'Count and record all spirit bottles',
            isRequired: true,
            category: 'inventory',
            order: 2
          },
          {
            id: '3',
            title: 'Empty cash register',
            description: 'Count cash and record daily sales',
            isRequired: true,
            category: 'finance',
            order: 3
          },
          {
            id: '4',
            title: 'Clean espresso machine',
            description: 'Run cleaning cycle and descale if needed',
            isRequired: true,
            category: 'equipment',
            order: 4
          }
        ],
        createdBy: 'manager@pecora.com',
        createdAt: new Date('2024-01-20'),
        isActive: true
      },
      {
        id: '3',
        name: 'Weekly Deep Clean',
        description: 'Comprehensive cleaning checklist for all areas',
        department: 'kitchen',
        frequency: 'weekly',
        estimatedTime: 120,
        status: 'active',
        items: [
          {
            id: '1',
            title: 'Deep clean ovens',
            description: 'Remove all racks and thoroughly clean oven interior',
            isRequired: true,
            category: 'cleaning',
            order: 1
          },
          {
            id: '2',
            title: 'Sanitize walk-in cooler',
            description: 'Empty, clean, and sanitize entire walk-in refrigerator',
            isRequired: true,
            category: 'cleaning',
            order: 2
          },
          {
            id: '3',
            title: 'Clean hood vents',
            description: 'Remove grease and debris from exhaust hood',
            isRequired: true,
            category: 'cleaning',
            order: 3
          }
        ],
        createdBy: 'manager@pecora.com',
        createdAt: new Date('2024-01-10'),
        isActive: true
      }
    ];

    const mockSessions: ChecklistSession[] = [
      {
        id: '1',
        templateId: '1',
        template: mockTemplates[0],
        status: 'in-progress',
        assignedTo: 'kitchen@pecora.com',
        startedAt: new Date(Date.now() - 30 * 60 * 1000),
        items: mockTemplates[0].items.map(item => ({
          ...item,
          completed: item.id === '1' || item.id === '2',
          completedAt: item.id === '1' || item.id === '2' ? new Date(Date.now() - 15 * 60 * 1000) : undefined
        }))
      },
      {
        id: '2',
        templateId: '2',
        template: mockTemplates[1],
        status: 'completed',
        assignedTo: 'service@pecora.com',
        startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
        items: mockTemplates[1].items.map(item => ({
          ...item,
          completed: true,
          completedAt: new Date(Date.now() - 23 * 60 * 60 * 1000)
        }))
      }
    ];

    dispatch({ type: 'LOAD_TEMPLATES', payload: mockTemplates });
    dispatch({ type: 'LOAD_SESSIONS', payload: mockSessions });
  }, []);

  const addTemplate = (templateData: Omit<ChecklistTemplate, 'id'>) => {
    const newTemplate: ChecklistTemplate = {
      ...templateData,
      id: Date.now().toString()
    };
    dispatch({ type: 'ADD_TEMPLATE', payload: newTemplate });
  };

  const updateTemplate = (template: ChecklistTemplate) => {
    dispatch({ type: 'UPDATE_TEMPLATE', payload: template });
  };

  const deleteTemplate = (templateId: string) => {
    dispatch({ type: 'DELETE_TEMPLATE', payload: templateId });
  };

  const startChecklist = (templateId: string) => {
    const template = state.templates.find(t => t.id === templateId);
    if (!template) return;

    const newSession: ChecklistSession = {
      id: Date.now().toString(),
      templateId,
      template,
      status: 'in-progress',
      assignedTo: 'current@user.com',
      startedAt: new Date(),
      items: template.items.map(item => ({
        ...item,
        completed: false
      }))
    };

    dispatch({ type: 'START_CHECKLIST', payload: newSession });
  };

  const updateChecklistItem = (sessionId: string, itemId: string, completed: boolean, notes?: string) => {
    dispatch({
      type: 'UPDATE_CHECKLIST_ITEM',
      payload: { sessionId, itemId, completed, notes }
    });
  };

  const completeChecklist = (sessionId: string) => {
    dispatch({ type: 'COMPLETE_CHECKLIST', payload: sessionId });
  };

  const getActiveChecklists = () => {
    return state.sessions.filter(session => session.status === 'in-progress');
  };

  const getTemplatesByDepartment = (department: string) => {
    return state.templates.filter(template => template.department === department);
  };

  return (
    <ChecklistContext.Provider value={{
      ...state,
      addTemplate,
      updateTemplate,
      deleteTemplate,
      startChecklist,
      updateChecklistItem,
      completeChecklist,
      getActiveChecklists,
      getTemplatesByDepartment
    }}>
      {children}
    </ChecklistContext.Provider>
  );
};

export const useChecklist = () => {
  const context = useContext(ChecklistContext);
  if (!context) {
    throw new Error('useChecklist must be used within a ChecklistProvider');
  }
  return context;
};