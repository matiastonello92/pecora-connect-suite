import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { MonthlyInventory, InventoryItem, KitchenProduct, InventoryStatus, InventoryAnomaly, KITCHEN_PRODUCTS } from '@/types/kitchenInventory';
import { useAuth } from '@/context/AuthContext';

interface KitchenInventoryState {
  currentInventory: MonthlyInventory | null;
  historicalInventories: MonthlyInventory[];
  products: KitchenProduct[];
  loading: boolean;
  isInventoryPeriod: boolean;
  notifications: any[];
}

type KitchenInventoryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_INVENTORY'; payload: MonthlyInventory | null }
  | { type: 'SET_HISTORICAL_INVENTORIES'; payload: MonthlyInventory[] }
  | { type: 'SET_PRODUCTS'; payload: KitchenProduct[] }
  | { type: 'UPDATE_INVENTORY_ITEM'; payload: { productId: string; quantity: number; notes?: string } }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SAVE_INVENTORY' }
  | { type: 'APPROVE_INVENTORY'; payload: string }
  | { type: 'SET_INVENTORY_PERIOD'; payload: boolean }
  | { type: 'DETECT_ANOMALIES' };

const kitchenInventoryReducer = (state: KitchenInventoryState, action: KitchenInventoryAction): KitchenInventoryState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_CURRENT_INVENTORY':
      return { ...state, currentInventory: action.payload };
    case 'SET_HISTORICAL_INVENTORIES':
      return { ...state, historicalInventories: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'UPDATE_INVENTORY_ITEM':
      if (!state.currentInventory || state.currentInventory.isLocked) return state;
      
      const updatedItems = state.currentInventory.items.map(item =>
        item.productId === action.payload.productId
          ? {
              ...item,
              quantity: action.payload.quantity,
              notes: action.payload.notes || item.notes,
              updatedAt: new Date(),
              updatedBy: 'current@user.com' // Would come from auth context
            }
          : item
      );

      // If item doesn't exist, create it
      if (!updatedItems.find(item => item.productId === action.payload.productId)) {
        const product = state.products.find(p => p.id === action.payload.productId);
        if (product) {
          updatedItems.push({
            productId: action.payload.productId,
            product,
            quantity: action.payload.quantity,
            notes: action.payload.notes,
            updatedBy: 'current@user.com',
            updatedAt: new Date()
          });
        }
      }

      const totalValue = updatedItems.reduce((sum, item) => sum + (item.quantity * item.product.unitPrice), 0);

      return {
        ...state,
        currentInventory: {
          ...state.currentInventory,
          items: updatedItems,
          totalValue
        }
      };
    
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload
            ? { ...product, isFavorite: !product.isFavorite }
            : product
        )
      };
    
    case 'SAVE_INVENTORY':
      if (!state.currentInventory) return state;
      return {
        ...state,
        currentInventory: {
          ...state.currentInventory,
          status: 'completed',
          completedAt: new Date(),
          completedBy: 'current@user.com',
          isLocked: true
        }
      };
    
    case 'APPROVE_INVENTORY':
      return {
        ...state,
        currentInventory: state.currentInventory?.id === action.payload
          ? {
              ...state.currentInventory,
              status: 'approved',
              approvedAt: new Date(),
              approvedBy: 'current@user.com'
            }
          : state.currentInventory,
        historicalInventories: state.historicalInventories.map(inv =>
          inv.id === action.payload
            ? {
                ...inv,
                status: 'approved',
                approvedAt: new Date(),
                approvedBy: 'current@user.com'
              }
            : inv
        )
      };
    
    case 'SET_INVENTORY_PERIOD':
      return { ...state, isInventoryPeriod: action.payload };
    
    case 'DETECT_ANOMALIES':
      if (!state.currentInventory) return state;
      
      const anomalies: InventoryAnomaly[] = [];
      const previousInventory = state.historicalInventories[0]; // Most recent previous inventory

      state.currentInventory.items.forEach(currentItem => {
        const previousItem = previousInventory?.items.find(item => item.productId === currentItem.productId);
        
        if (previousItem) {
          // Quantity spike detection (>50% increase)
          const quantityChange = ((currentItem.quantity - previousItem.quantity) / previousItem.quantity) * 100;
          if (Math.abs(quantityChange) > 50) {
            anomalies.push({
              id: `anomaly-${Date.now()}-${currentItem.productId}`,
              type: 'quantity_spike',
              productId: currentItem.productId,
              description: `Quantity changed by ${quantityChange.toFixed(1)}%`,
              severity: Math.abs(quantityChange) > 100 ? 'high' : 'medium',
              currentValue: currentItem.quantity,
              previousValue: previousItem.quantity,
              detectedAt: new Date()
            });
          }

          // Value spike detection
          const currentValue = currentItem.quantity * currentItem.product.unitPrice;
          const previousValue = previousItem.quantity * previousItem.product.unitPrice;
          const valueChange = ((currentValue - previousValue) / previousValue) * 100;
          
          if (Math.abs(valueChange) > 75) {
            anomalies.push({
              id: `anomaly-${Date.now()}-value-${currentItem.productId}`,
              type: 'value_spike',
              productId: currentItem.productId,
              description: `Value changed by ${valueChange.toFixed(1)}%`,
              severity: Math.abs(valueChange) > 150 ? 'high' : 'medium',
              currentValue: currentValue,
              previousValue: previousValue,
              detectedAt: new Date()
            });
          }
        }

        // Rarely updated items (quantity is 0 for multiple periods)
        if (currentItem.quantity === 0 && previousItem?.quantity === 0) {
          anomalies.push({
            id: `anomaly-${Date.now()}-stale-${currentItem.productId}`,
            type: 'rarely_updated',
            productId: currentItem.productId,
            description: 'Item has been at 0 quantity for multiple periods',
            severity: 'low',
            currentValue: 0,
            previousValue: 0,
            detectedAt: new Date()
          });
        }
      });

      return {
        ...state,
        currentInventory: {
          ...state.currentInventory,
          anomalies
        }
      };
    
    default:
      return state;
  }
};

interface KitchenInventoryContextType extends KitchenInventoryState {
  updateInventoryItem: (productId: string, quantity: number, notes?: string) => void;
  toggleProductFavorite: (productId: string) => void;
  saveInventory: () => void;
  approveInventory: (inventoryId: string) => void;
  createNewInventory: () => void;
  exportInventory: (format: 'csv' | 'pdf') => void;
  detectAnomalies: () => void;
  checkInventoryPeriod: () => boolean;
}

const KitchenInventoryContext = createContext<KitchenInventoryContextType | undefined>(undefined);

export const KitchenInventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(kitchenInventoryReducer, {
    currentInventory: null,
    historicalInventories: [],
    products: KITCHEN_PRODUCTS,
    loading: false,
    isInventoryPeriod: false,
    notifications: []
  });

  // Check if we're in the inventory period (last day of month to first day of next month)
  const checkInventoryPeriod = (): boolean => {
    const now = new Date();
    const currentDay = now.getDate();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    // Available from last day of month to first day of next month
    return currentDay === lastDayOfMonth || currentDay === 1;
  };

  useEffect(() => {
    // Check inventory period
    const isInPeriod = checkInventoryPeriod();
    dispatch({ type: 'SET_INVENTORY_PERIOD', payload: isInPeriod });

    // Load historical inventories (empty by default - will be loaded from backend)
    dispatch({ type: 'SET_HISTORICAL_INVENTORIES', payload: [] });
  }, [user]);

  const updateInventoryItem = (productId: string, quantity: number, notes?: string) => {
    dispatch({ type: 'UPDATE_INVENTORY_ITEM', payload: { productId, quantity, notes } });
  };

  const toggleProductFavorite = (productId: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: productId });
  };

  const saveInventory = () => {
    dispatch({ type: 'SAVE_INVENTORY' });
    // Here you would send push notification to managers
  };

  const approveInventory = (inventoryId: string) => {
    dispatch({ type: 'APPROVE_INVENTORY', payload: inventoryId });
  };

  const createNewInventory = () => {
    const now = new Date();
    const newInventory: MonthlyInventory = {
      id: `inv-${now.getFullYear()}-${now.getMonth() + 1}`,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      department: 'kitchen',
      status: 'draft',
      items: [],
      createdBy: user?.email || 'current@user.com',
      createdAt: now,
      totalValue: 0,
      anomalies: [],
      isLocked: false
    };
    dispatch({ type: 'SET_CURRENT_INVENTORY', payload: newInventory });
  };

  const exportInventory = (format: 'csv' | 'pdf') => {
    if (!state.currentInventory) return;
    
    // In a real implementation, this would generate and download the file
    
    if (format === 'csv') {
      // Generate CSV
      const csvContent = [
        'Product,Category,Quantity,Unit,Unit Price,Total Value,Notes',
        ...state.currentInventory.items.map(item => 
          `"${item.product.name}","${item.product.category}",${item.quantity},"${item.product.unit}",${item.product.unitPrice},${item.quantity * item.product.unitPrice},"${item.notes || ''}"`
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kitchen-inventory-${state.currentInventory.year}-${state.currentInventory.month}.csv`;
      a.click();
    }
  };

  const detectAnomalies = () => {
    dispatch({ type: 'DETECT_ANOMALIES' });
  };

  return (
    <KitchenInventoryContext.Provider value={{
      ...state,
      updateInventoryItem,
      toggleProductFavorite,
      saveInventory,
      approveInventory,
      createNewInventory,
      exportInventory,
      detectAnomalies,
      checkInventoryPeriod
    }}>
      {children}
    </KitchenInventoryContext.Provider>
  );
};

export const useKitchenInventory = () => {
  const context = useContext(KitchenInventoryContext);
  if (!context) {
    throw new Error('useKitchenInventory must be used within a KitchenInventoryProvider');
  }
  return context;
};