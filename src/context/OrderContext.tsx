import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';

// Order types
export interface Order {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  location: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: Date;
  deliveryDate?: Date;
  items: OrderItem[];
  totalAmount: number;
  notes?: string;
  createdBy: string;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

interface OrderState {
  orders: Order[];
  currentOrder: Partial<Order> | null;
  loading: boolean;
}

type OrderAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_ORDERS'; payload: Order[] }
  | { type: 'CREATE_ORDER'; payload: Partial<Order> }
  | { type: 'UPDATE_ORDER'; payload: Partial<Order> }
  | { type: 'SUBMIT_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { id: string; status: Order['status'] } };

const orderReducer = (state: OrderState, action: OrderAction): OrderState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOAD_ORDERS':
      return { ...state, orders: action.payload };
    case 'CREATE_ORDER':
      return { ...state, currentOrder: action.payload };
    case 'UPDATE_ORDER':
      return { 
        ...state, 
        currentOrder: state.currentOrder ? { ...state.currentOrder, ...action.payload } : action.payload 
      };
    case 'SUBMIT_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders],
        currentOrder: null
      };
    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.id
            ? { ...order, status: action.payload.status, updatedAt: new Date() }
            : order
        )
      };
    default:
      return state;
  }
};

interface OrderContextType extends OrderState {
  createNewOrder: () => void;
  updateCurrentOrder: (data: Partial<Order>) => void;
  submitOrder: () => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  getOrdersByLocation: (location: string) => Order[];
  getOrdersByStatus: (status: Order['status']) => Order[];
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useEnhancedAuth();
  const [state, dispatch] = useReducer(orderReducer, {
    orders: [],
    currentOrder: null,
    loading: false
  });

  // Initialize with empty data
  useEffect(() => {
    dispatch({ type: 'LOAD_ORDERS', payload: [] });
  }, []);

  const createNewOrder = () => {
    const newOrder: Partial<Order> = {
      id: Date.now().toString(),
      orderNumber: `ORD-${Date.now()}`,
      location: 'menton', // Default location - will need location context
      status: 'pending',
      orderDate: new Date(),
      items: [],
      totalAmount: 0,
      createdBy: user?.email || 'current@user.com',
      updatedAt: new Date()
    };
    dispatch({ type: 'CREATE_ORDER', payload: newOrder });
  };

  const updateCurrentOrder = (data: Partial<Order>) => {
    dispatch({ type: 'UPDATE_ORDER', payload: { ...data, updatedAt: new Date() } });
  };

  const submitOrder = () => {
    if (!state.currentOrder) return;
    
    const completeOrder: Order = {
      ...state.currentOrder as Order,
      status: 'pending',
      updatedAt: new Date()
    };
    
    dispatch({ type: 'SUBMIT_ORDER', payload: completeOrder });
  };

  const updateOrderStatus = (id: string, status: Order['status']) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id, status } });
  };

  const getOrdersByLocation = (location: string) => {
    // Simplified for now - will need location data from LocationContext
    return state.orders.filter(order => 
      order.location === location
    );
  };

  const getOrdersByStatus = (status: Order['status']) => {
    // Simplified for now - will need location data from LocationContext
    return state.orders.filter(order => 
      order.status === status
    );
  };

  return (
    <OrderContext.Provider value={{
      ...state,
      createNewOrder,
      updateCurrentOrder,
      submitOrder,
      updateOrderStatus,
      getOrdersByLocation,
      getOrdersByStatus
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};