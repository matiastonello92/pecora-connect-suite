import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { InventoryItem, InventorySession, InvoiceItem } from '@/types/inventory';

interface InventoryState {
  items: InventoryItem[];
  sessions: InventorySession[];
  currentSession: InventorySession | null;
  loading: boolean;
}

type InventoryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_ITEMS'; payload: InventoryItem[] }
  | { type: 'LOAD_SESSIONS'; payload: InventorySession[] }
  | { type: 'ADD_ITEM'; payload: InventoryItem }
  | { type: 'UPDATE_ITEM'; payload: InventoryItem }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'START_SESSION'; payload: InventorySession }
  | { type: 'END_SESSION'; payload: string }
  | { type: 'UPDATE_SESSION_ITEM'; payload: { sessionId: string; itemId: string; countedQuantity: number } };

const inventoryReducer = (state: InventoryState, action: InventoryAction): InventoryState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOAD_ITEMS':
      return { ...state, items: action.payload };
    case 'LOAD_SESSIONS':
      return { ...state, sessions: action.payload };
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item => 
          item.id === action.payload.id ? action.payload : item
        )
      };
    case 'DELETE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
    case 'START_SESSION':
      return {
        ...state,
        sessions: [...state.sessions, action.payload],
        currentSession: action.payload
      };
    case 'END_SESSION':
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload
            ? { ...session, status: 'completed', completedAt: new Date() }
            : session
        ),
        currentSession: null
      };
    case 'UPDATE_SESSION_ITEM':
      if (!state.currentSession) return state;
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          items: state.currentSession.items.map(item =>
            item.itemId === action.payload.itemId
              ? { ...item, countedQuantity: action.payload.countedQuantity }
              : item
          )
        }
      };
    default:
      return state;
  }
};

interface InventoryContextType extends InventoryState {
  addItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateItem: (item: InventoryItem) => void;
  deleteItem: (itemId: string) => void;
  startInventorySession: (department: string) => void;
  endInventorySession: (sessionId: string) => void;
  updateSessionItem: (sessionId: string, itemId: string, countedQuantity: number) => void;
  processInvoice: (items: InvoiceItem[]) => void;
  getLowStockItems: () => InventoryItem[];
  getExpiringItems: (days: number) => InventoryItem[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(inventoryReducer, {
    items: [],
    sessions: [],
    currentSession: null,
    loading: false
  });

  // Mock data
  useEffect(() => {
    const mockItems: InventoryItem[] = [
      {
        id: '1',
        name: 'San Marzano Tomatoes',
        category: 'vegetables',
        unit: 'kg',
        currentStock: 25,
        minStock: 10,
        maxStock: 50,
        unitCost: 4.50,
        supplier: 'Italian Foods Co.',
        location: 'Dry Storage A1',
        department: 'kitchen',
        expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        lastUpdated: new Date(),
        updatedBy: 'system'
      },
      {
        id: '2',
        name: 'Mozzarella di Bufala',
        category: 'dairy',
        unit: 'kg',
        currentStock: 8,
        minStock: 5,
        maxStock: 20,
        unitCost: 18.00,
        supplier: 'Campania Dairy',
        location: 'Fridge B2',
        department: 'kitchen',
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        lastUpdated: new Date(),
        updatedBy: 'chef@pecora.com'
      },
      {
        id: '3',
        name: '00 Flour',
        category: 'dry-goods',
        unit: 'kg',
        currentStock: 45,
        minStock: 20,
        maxStock: 100,
        unitCost: 2.20,
        supplier: 'Mulino Bianco',
        location: 'Dry Storage A3',
        department: 'pizzeria',
        lastUpdated: new Date(),
        updatedBy: 'system'
      },
      {
        id: '4',
        name: 'Chianti Classico 2020',
        category: 'wine',
        unit: 'bottle',
        currentStock: 12,
        minStock: 6,
        maxStock: 24,
        unitCost: 15.50,
        supplier: 'Tuscan Wines',
        location: 'Wine Cellar C1',
        department: 'service',
        lastUpdated: new Date(),
        updatedBy: 'sommelier@pecora.com'
      }
    ];

    const mockSessions: InventorySession[] = [
      {
        id: '1',
        department: 'kitchen',
        status: 'active',
        startedBy: 'chef@pecora.com',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        items: [
          {
            itemId: '1',
            item: mockItems[0],
            expectedQuantity: 25,
            countedQuantity: 24,
            variance: -1,
            notes: 'One damaged can'
          },
          {
            itemId: '2',
            item: mockItems[1],
            expectedQuantity: 8,
            countedQuantity: 8,
            variance: 0
          }
        ]
      }
    ];

    dispatch({ type: 'LOAD_ITEMS', payload: mockItems });
    dispatch({ type: 'LOAD_SESSIONS', payload: mockSessions });
    dispatch({ type: 'START_SESSION', payload: mockSessions[0] });
  }, []);

  const addItem = (itemData: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: Date.now().toString()
    };
    dispatch({ type: 'ADD_ITEM', payload: newItem });
  };

  const updateItem = (item: InventoryItem) => {
    dispatch({ type: 'UPDATE_ITEM', payload: item });
  };

  const deleteItem = (itemId: string) => {
    dispatch({ type: 'DELETE_ITEM', payload: itemId });
  };

  const startInventorySession = (department: string) => {
    const departmentItems = state.items.filter(item => item.department === department);
    const sessionItems = departmentItems.map(item => ({
      itemId: item.id,
      item,
      expectedQuantity: item.currentStock,
      countedQuantity: 0,
      variance: 0
    }));

    const newSession: InventorySession = {
      id: Date.now().toString(),
      department,
      status: 'active',
      startedBy: 'current@user.com',
      startedAt: new Date(),
      items: sessionItems
    };

    dispatch({ type: 'START_SESSION', payload: newSession });
  };

  const endInventorySession = (sessionId: string) => {
    dispatch({ type: 'END_SESSION', payload: sessionId });
  };

  const updateSessionItem = (sessionId: string, itemId: string, countedQuantity: number) => {
    dispatch({ type: 'UPDATE_SESSION_ITEM', payload: { sessionId, itemId, countedQuantity } });
  };

  const processInvoice = (items: InvoiceItem[]) => {
    items.forEach(invoiceItem => {
      const existingItem = state.items.find(item => item.id === invoiceItem.itemId);
      if (existingItem) {
        const updatedItem: InventoryItem = {
          ...existingItem,
          currentStock: existingItem.currentStock + invoiceItem.quantity,
          unitCost: invoiceItem.unitCost,
          lastUpdated: new Date(),
          updatedBy: 'invoice-system'
        };
        dispatch({ type: 'UPDATE_ITEM', payload: updatedItem });
      }
    });
  };

  const getLowStockItems = () => {
    return state.items.filter(item => item.currentStock <= item.minStock);
  };

  const getExpiringItems = (days: number) => {
    const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return state.items.filter(item => 
      item.expiryDate && item.expiryDate <= targetDate
    );
  };

  return (
    <InventoryContext.Provider value={{
      ...state,
      addItem,
      updateItem,
      deleteItem,
      startInventorySession,
      endInventorySession,
      updateSessionItem,
      processInvoice,
      getLowStockItems,
      getExpiringItems
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};