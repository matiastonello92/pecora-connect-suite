/**
 * Super Unified Provider - FIXED
 * Includes all necessary providers including location context
 */

import React, { ReactNode, createContext, useContext, useMemo, useReducer } from 'react';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { OptimizedLocationProvider } from '@/context/OptimizedLocationProvider';

// All business state types in one unified interface
interface SuperUnifiedContextType {
  // Auth state (from SimpleAuthContext)
  auth: {
    user: any;
    profile: any;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  
  // All business contexts unified
  business: {
    inventory: {
      items: any[];
      loading: boolean;
      error: string | null;
      actions: {
        addItem: (item: any) => void;
        updateItem: (id: string, updates: any) => void;
        deleteItem: (id: string) => void;
        refreshItems: () => void;
      };
    };
    
    kitchenInventory: {
      ingredients: any[];
      loading: boolean;
      error: string | null;
      actions: {
        addIngredient: (ingredient: any) => void;
        updateIngredient: (id: string, updates: any) => void;
        deleteIngredient: (id: string) => void;
      };
    };
    
    checklist: {
      items: any[];
      loading: boolean;
      error: string | null;
      actions: {
        addChecklistItem: (item: any) => void;
        updateChecklistItem: (id: string, updates: any) => void;
        toggleComplete: (id: string) => void;
      };
    };
    
    equipment: {
      items: any[];
      loading: boolean;
      error: string | null;
      actions: {
        addEquipment: (equipment: any) => void;
        updateEquipment: (id: string, updates: any) => void;
        deleteEquipment: (id: string) => void;
      };
    };
    
    suppliers: {
      items: any[];
      loading: boolean;
      error: string | null;
      actions: {
        addSupplier: (supplier: any) => void;
        updateSupplier: (id: string, updates: any) => void;
        deleteSupplier: (id: string) => void;
      };
    };
    
    cashRegister: {
      isOpen: boolean;
      currentBalance: number;
      transactions: any[];
      loading: boolean;
      error: string | null;
      actions: {
        openRegister: (openingBalance: number) => void;
        closeRegister: () => void;
        addTransaction: (transaction: any) => void;
      };
    };
    
    financial: {
      reports: any[];
      totalRevenue: number;
      totalExpenses: number;
      loading: boolean;
      error: string | null;
      actions: {
        generateReport: (period: string) => void;
        addExpense: (expense: any) => void;
        addRevenue: (revenue: any) => void;
      };
    };
    
    communication: {
      messages: any[];
      unreadCount: number;
      loading: boolean;
      error: string | null;
      actions: {
        sendMessage: (message: any) => void;
        markAsRead: (messageId: string) => void;
        deleteMessage: (messageId: string) => void;
      };
    };
    
    userManagement: {
      users: any[];
      invitations: any[];
      loading: boolean;
      error: string | null;
      actions: {
        inviteUser: (userData: any) => void;
        updateUser: (id: string, updates: any) => void;
        deactivateUser: (id: string) => void;
        resendInvitation: (invitationId: string) => void;
      };
    };
    
    chat: {
      conversations: any[];
      activeConversation: any;
      messages: any[];
      loading: boolean;
      error: string | null;
      actions: {
        sendMessage: (conversationId: string, message: string) => void;
        createConversation: (participants: string[]) => void;
        markAsRead: (conversationId: string) => void;
      };
    };
  };
}

// Internal state management using useReducer for better performance
type BusinessAction = 
  | { type: 'SET_LOADING'; module: string; loading: boolean }
  | { type: 'SET_ERROR'; module: string; error: string | null }
  | { type: 'SET_DATA'; module: string; data: any }
  | { type: 'UPDATE_ITEM'; module: string; id: string; updates: any }
  | { type: 'DELETE_ITEM'; module: string; id: string }
  | { type: 'ADD_ITEM'; module: string; item: any };

const businessReducer = (state: any, action: BusinessAction) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        [action.module]: {
          ...state[action.module],
          loading: action.loading
        }
      };
    case 'SET_ERROR':
      return {
        ...state,
        [action.module]: {
          ...state[action.module],
          error: action.error
        }
      };
    case 'SET_DATA':
      return {
        ...state,
        [action.module]: {
          ...state[action.module],
          ...action.data,
          loading: false,
          error: null
        }
      };
    default:
      return state;
  }
};

const SuperUnifiedContext = createContext<SuperUnifiedContextType | undefined>(undefined);

export const useSuperUnified = () => {
  const context = useContext(SuperUnifiedContext);
  if (!context) {
    throw new Error('useSuperUnified must be used within a SuperUnifiedProvider');
  }
  return context;
};

// Internal context provider that manages business state
const SuperUnifiedContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useSimpleAuth();
  
  // Unified state management using reducer
  const [businessState, dispatch] = useReducer(businessReducer, {
    inventory: { items: [], loading: false, error: null },
    kitchenInventory: { ingredients: [], loading: false, error: null },
    checklist: { items: [], loading: false, error: null },
    equipment: { items: [], loading: false, error: null },
    suppliers: { items: [], loading: false, error: null },
    cashRegister: { isOpen: false, currentBalance: 0, transactions: [], loading: false, error: null },
    financial: { reports: [], totalRevenue: 0, totalExpenses: 0, loading: false, error: null },
    communication: { messages: [], unreadCount: 0, loading: false, error: null },
    userManagement: { users: [], invitations: [], loading: false, error: null },
    chat: { conversations: [], activeConversation: null, messages: [], loading: false, error: null }
  });

  // Create unified actions
  const createActions = useMemo(() => ({
    inventory: {
      addItem: (item: any) => dispatch({ type: 'ADD_ITEM', module: 'inventory', item }),
      updateItem: (id: string, updates: any) => dispatch({ type: 'UPDATE_ITEM', module: 'inventory', id, updates }),
      deleteItem: (id: string) => dispatch({ type: 'DELETE_ITEM', module: 'inventory', id }),
      refreshItems: () => {} // Will be implemented with proper query invalidation
    },
    kitchenInventory: {
      addIngredient: (ingredient: any) => dispatch({ type: 'ADD_ITEM', module: 'kitchenInventory', item: ingredient }),
      updateIngredient: (id: string, updates: any) => dispatch({ type: 'UPDATE_ITEM', module: 'kitchenInventory', id, updates }),
      deleteIngredient: (id: string) => dispatch({ type: 'DELETE_ITEM', module: 'kitchenInventory', id })
    },
    checklist: {
      addChecklistItem: (item: any) => dispatch({ type: 'ADD_ITEM', module: 'checklist', item }),
      updateChecklistItem: (id: string, updates: any) => dispatch({ type: 'UPDATE_ITEM', module: 'checklist', id, updates }),
      toggleComplete: (id: string) => dispatch({ type: 'UPDATE_ITEM', module: 'checklist', id, updates: { completed: true } })
    },
    equipment: {
      addEquipment: (equipment: any) => dispatch({ type: 'ADD_ITEM', module: 'equipment', item: equipment }),
      updateEquipment: (id: string, updates: any) => dispatch({ type: 'UPDATE_ITEM', module: 'equipment', id, updates }),
      deleteEquipment: (id: string) => dispatch({ type: 'DELETE_ITEM', module: 'equipment', id })
    },
    suppliers: {
      addSupplier: (supplier: any) => dispatch({ type: 'ADD_ITEM', module: 'suppliers', item: supplier }),
      updateSupplier: (id: string, updates: any) => dispatch({ type: 'UPDATE_ITEM', module: 'suppliers', id, updates }),
      deleteSupplier: (id: string) => dispatch({ type: 'DELETE_ITEM', module: 'suppliers', id })
    },
    cashRegister: {
      openRegister: (openingBalance: number) => dispatch({ type: 'SET_DATA', module: 'cashRegister', data: { isOpen: true, currentBalance: openingBalance } }),
      closeRegister: () => dispatch({ type: 'SET_DATA', module: 'cashRegister', data: { isOpen: false } }),
      addTransaction: (transaction: any) => dispatch({ type: 'ADD_ITEM', module: 'cashRegister', item: transaction })
    },
    financial: {
      generateReport: (period: string) => {},
      addExpense: (expense: any) => {},
      addRevenue: (revenue: any) => {}
    },
    communication: {
      sendMessage: (message: any) => dispatch({ type: 'ADD_ITEM', module: 'communication', item: message }),
      markAsRead: (messageId: string) => {},
      deleteMessage: (messageId: string) => dispatch({ type: 'DELETE_ITEM', module: 'communication', id: messageId })
    },
    userManagement: {
      inviteUser: (userData: any) => {},
      updateUser: (id: string, updates: any) => dispatch({ type: 'UPDATE_ITEM', module: 'userManagement', id, updates }),
      deactivateUser: (id: string) => {},
      resendInvitation: (invitationId: string) => {}
    },
    chat: {
      sendMessage: (conversationId: string, message: string) => {},
      createConversation: (participants: string[]) => {},
      markAsRead: (conversationId: string) => {}
    }
  }), []);

  // Memoized context value for optimal performance
  const contextValue = useMemo((): SuperUnifiedContextType => ({
    auth: {
      user: auth.user,
      profile: auth.profile,
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading
    },
    
    business: {
      inventory: {
        items: businessState.inventory.items,
        loading: businessState.inventory.loading,
        error: businessState.inventory.error,
        actions: createActions.inventory
      },
      kitchenInventory: {
        ingredients: businessState.kitchenInventory.ingredients,
        loading: businessState.kitchenInventory.loading,
        error: businessState.kitchenInventory.error,
        actions: createActions.kitchenInventory
      },
      checklist: {
        items: businessState.checklist.items,
        loading: businessState.checklist.loading,
        error: businessState.checklist.error,
        actions: createActions.checklist
      },
      equipment: {
        items: businessState.equipment.items,
        loading: businessState.equipment.loading,
        error: businessState.equipment.error,
        actions: createActions.equipment
      },
      suppliers: {
        items: businessState.suppliers.items,
        loading: businessState.suppliers.loading,
        error: businessState.suppliers.error,
        actions: createActions.suppliers
      },
      cashRegister: {
        isOpen: businessState.cashRegister.isOpen,
        currentBalance: businessState.cashRegister.currentBalance,
        transactions: businessState.cashRegister.transactions,
        loading: businessState.cashRegister.loading,
        error: businessState.cashRegister.error,
        actions: createActions.cashRegister
      },
      financial: {
        reports: businessState.financial.reports,
        totalRevenue: businessState.financial.totalRevenue,
        totalExpenses: businessState.financial.totalExpenses,
        loading: businessState.financial.loading,
        error: businessState.financial.error,
        actions: createActions.financial
      },
      communication: {
        messages: businessState.communication.messages,
        unreadCount: businessState.communication.unreadCount,
        loading: businessState.communication.loading,
        error: businessState.communication.error,
        actions: createActions.communication
      },
      userManagement: {
        users: businessState.userManagement.users,
        invitations: businessState.userManagement.invitations,
        loading: businessState.userManagement.loading,
        error: businessState.userManagement.error,
        actions: createActions.userManagement
      },
      chat: {
        conversations: businessState.chat.conversations,
        activeConversation: businessState.chat.activeConversation,
        messages: businessState.chat.messages,
        loading: businessState.chat.loading,
        error: businessState.chat.error,
        actions: createActions.chat
      }
    }
  }), [
    auth.user,
    auth.profile,
    auth.isAuthenticated,
    auth.isLoading,
    businessState,
    createActions
  ]);

  return (
    <SuperUnifiedContext.Provider value={contextValue}>
      {children}
    </SuperUnifiedContext.Provider>
  );
};

// Main Provider component that includes location providers
export const SuperUnifiedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <OptimizedLocationProvider>
      <SuperUnifiedContextProvider>
        {children}
      </SuperUnifiedContextProvider>
    </OptimizedLocationProvider>
  );
};

// Backward compatibility exports
export const useBusiness = () => useSuperUnified().business;
export const useBusinessInventory = () => useSuperUnified().business.inventory;
export const useBusinessLocation = () => {
  // This will now work because OptimizedLocationProvider is included
  const { useLocationMeta, useLocationState } = require('@/context/OptimizedLocationProvider');
  return {
    meta: useLocationMeta(),
    state: useLocationState()
  };
};