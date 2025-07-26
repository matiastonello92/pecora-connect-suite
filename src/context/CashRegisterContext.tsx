import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { MenuItem, Order, OrderItem, CashSession, PaymentMethod, OrderStatus } from '@/types/cashRegister';

interface CashRegisterState {
  menuItems: MenuItem[];
  orders: Order[];
  currentOrder: Order | null;
  currentSession: CashSession | null;
  dailySales: number;
  loading: boolean;
}

type CashRegisterAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_MENU_ITEMS'; payload: MenuItem[] }
  | { type: 'LOAD_ORDERS'; payload: Order[] }
  | { type: 'START_ORDER'; payload: Order }
  | { type: 'ADD_ORDER_ITEM'; payload: OrderItem }
  | { type: 'UPDATE_ORDER_ITEM'; payload: { itemId: string; quantity: number } }
  | { type: 'REMOVE_ORDER_ITEM'; payload: string }
  | { type: 'COMPLETE_ORDER'; payload: { paymentMethod: PaymentMethod; total: number } }
  | { type: 'CANCEL_ORDER' }
  | { type: 'START_CASH_SESSION'; payload: number }
  | { type: 'END_CASH_SESSION'; payload: number }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: OrderStatus } };

const cashRegisterReducer = (state: CashRegisterState, action: CashRegisterAction): CashRegisterState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOAD_MENU_ITEMS':
      return { ...state, menuItems: action.payload };
    case 'LOAD_ORDERS':
      return { ...state, orders: action.payload };
    case 'START_ORDER':
      return { ...state, currentOrder: action.payload };
    case 'ADD_ORDER_ITEM':
      if (!state.currentOrder) return state;
      const existingItem = state.currentOrder.items.find(item => item.menuItemId === action.payload.menuItemId);
      if (existingItem) {
        return {
          ...state,
          currentOrder: {
            ...state.currentOrder,
            items: state.currentOrder.items.map(item =>
              item.menuItemId === action.payload.menuItemId
                ? { ...item, quantity: item.quantity + action.payload.quantity }
                : item
            )
          }
        };
      }
      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          items: [...state.currentOrder.items, action.payload]
        }
      };
    case 'UPDATE_ORDER_ITEM':
      if (!state.currentOrder) return state;
      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          items: state.currentOrder.items.map(item =>
            item.id === action.payload.itemId
              ? { ...item, quantity: action.payload.quantity }
              : item
          )
        }
      };
    case 'REMOVE_ORDER_ITEM':
      if (!state.currentOrder) return state;
      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          items: state.currentOrder.items.filter(item => item.id !== action.payload)
        }
      };
    case 'COMPLETE_ORDER':
      if (!state.currentOrder) return state;
      const completedOrder = {
        ...state.currentOrder,
        paymentMethod: action.payload.paymentMethod,
        total: action.payload.total,
        status: 'preparing' as OrderStatus,
        completedAt: new Date()
      };
      return {
        ...state,
        orders: [completedOrder, ...state.orders],
        currentOrder: null,
        dailySales: state.dailySales + action.payload.total
      };
    case 'CANCEL_ORDER':
      return { ...state, currentOrder: null };
    case 'START_CASH_SESSION':
      const newSession: CashSession = {
        id: Date.now().toString(),
        startAmount: action.payload,
        cashSales: 0,
        cardSales: 0,
        digitalSales: 0,
        voucherSales: 0,
        totalSales: 0,
        startedBy: 'current@user.com',
        startedAt: new Date(),
        isActive: true
      };
      return { ...state, currentSession: newSession };
    case 'END_CASH_SESSION':
      if (!state.currentSession) return state;
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          endAmount: action.payload,
          endedBy: 'current@user.com',
          endedAt: new Date(),
          isActive: false
        }
      };
    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.orderId
            ? { ...order, status: action.payload.status }
            : order
        )
      };
    default:
      return state;
  }
};

interface CashRegisterContextType extends CashRegisterState {
  startNewOrder: (tableNumber?: number, customerName?: string) => void;
  addItemToOrder: (menuItem: MenuItem, quantity: number) => void;
  updateOrderItem: (itemId: string, quantity: number) => void;
  removeOrderItem: (itemId: string) => void;
  completeOrder: (paymentMethod: PaymentMethod) => void;
  cancelOrder: () => void;
  startCashSession: (startAmount: number) => void;
  endCashSession: (endAmount: number) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  calculateOrderTotal: () => number;
}

const CashRegisterContext = createContext<CashRegisterContextType | undefined>(undefined);

export const CashRegisterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cashRegisterReducer, {
    menuItems: [],
    orders: [],
    currentOrder: null,
    currentSession: null,
    dailySales: 0,
    loading: false
  });

  // Initialize with empty data - ready for real use
  useEffect(() => {
    dispatch({ type: 'LOAD_MENU_ITEMS', payload: [] });
    dispatch({ type: 'LOAD_ORDERS', payload: [] });
  }, []);

  const startNewOrder = (tableNumber?: number, customerName?: string) => {
    const newOrder: Order = {
      id: Date.now().toString(),
      tableNumber,
      customerName,
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      status: 'pending',
      type: tableNumber ? 'dine-in' : 'takeaway',
      createdBy: 'current@user.com',
      createdAt: new Date()
    };
    dispatch({ type: 'START_ORDER', payload: newOrder });
  };

  const addItemToOrder = (menuItem: MenuItem, quantity: number) => {
    const orderItem: OrderItem = {
      id: Date.now().toString(),
      menuItemId: menuItem.id,
      menuItem,
      quantity,
      price: menuItem.price * quantity
    };
    dispatch({ type: 'ADD_ORDER_ITEM', payload: orderItem });
  };

  const updateOrderItem = (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_ORDER_ITEM', payload: { itemId, quantity } });
  };

  const removeOrderItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ORDER_ITEM', payload: itemId });
  };

  const calculateOrderTotal = () => {
    if (!state.currentOrder) return 0;
    const subtotal = state.currentOrder.items.reduce((sum, item) => sum + item.price, 0);
    const tax = subtotal * 0.1; // 10% tax
    return subtotal + tax;
  };

  const completeOrder = (paymentMethod: PaymentMethod) => {
    const total = calculateOrderTotal();
    dispatch({ type: 'COMPLETE_ORDER', payload: { paymentMethod, total } });
  };

  const cancelOrder = () => {
    dispatch({ type: 'CANCEL_ORDER' });
  };

  const startCashSession = (startAmount: number) => {
    dispatch({ type: 'START_CASH_SESSION', payload: startAmount });
  };

  const endCashSession = (endAmount: number) => {
    dispatch({ type: 'END_CASH_SESSION', payload: endAmount });
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } });
  };

  return (
    <CashRegisterContext.Provider value={{
      ...state,
      startNewOrder,
      addItemToOrder,
      updateOrderItem,
      removeOrderItem,
      completeOrder,
      cancelOrder,
      startCashSession,
      endCashSession,
      updateOrderStatus,
      calculateOrderTotal
    }}>
      {children}
    </CashRegisterContext.Provider>
  );
};

export const useCashRegister = () => {
  const context = useContext(CashRegisterContext);
  if (!context) {
    throw new Error('useCashRegister must be used within a CashRegisterProvider');
  }
  return context;
};