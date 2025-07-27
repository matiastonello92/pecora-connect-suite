import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ChecklistTemplate, ChecklistSession, ChecklistItem } from '@/types/checklist';
import { useSimpleAuth } from '@/context/SimpleAuthContext';

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
  const { user } = useSimpleAuth();
  const [state, dispatch] = useReducer(checklistReducer, {
    templates: [],
    sessions: [],
    loading: false
  });

  // Initialize with empty data - ready for real use
  useEffect(() => {
    dispatch({ type: 'LOAD_TEMPLATES', payload: [] });
    dispatch({ type: 'LOAD_SESSIONS', payload: [] });
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
    // Simplified for now - will need location data from LocationContext
    return state.sessions.filter(session => 
      session.status === 'in-progress'
    );
  };

  const getTemplatesByDepartment = (department: string) => {
    // Simplified for now - will need location data from LocationContext
    return state.templates.filter(template => 
      template.department === department
    );
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