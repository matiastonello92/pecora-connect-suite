import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';

// Supplier types  
export interface Supplier {
  id: string;
  name: string;
  category: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  location: string;
  status: 'active' | 'inactive';
  rating?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SupplierState {
  suppliers: Supplier[];
  loading: boolean;
}

type SupplierAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_SUPPLIERS'; payload: Supplier[] }
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
  | { type: 'DELETE_SUPPLIER'; payload: string };

const supplierReducer = (state: SupplierState, action: SupplierAction): SupplierState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOAD_SUPPLIERS':
      return { ...state, suppliers: action.payload };
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.payload] };
    case 'UPDATE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.map(supplier =>
          supplier.id === action.payload.id ? action.payload : supplier
        )
      };
    case 'DELETE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.filter(supplier => supplier.id !== action.payload)
      };
    default:
      return state;
  }
};

interface SupplierContextType extends SupplierState {
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
  getSuppliersByCategory: (category: string) => Supplier[];
  getSuppliersByLocation: (location: string) => Supplier[];
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

export const SupplierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useEnhancedAuth();
  const [state, dispatch] = useReducer(supplierReducer, {
    suppliers: [],
    loading: false
  });

  // Initialize with empty data
  useEffect(() => {
    dispatch({ type: 'LOAD_SUPPLIERS', payload: [] });
  }, []);

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    dispatch({ type: 'ADD_SUPPLIER', payload: newSupplier });
  };

  const updateSupplier = (supplier: Supplier) => {
    const updatedSupplier = {
      ...supplier,
      updatedAt: new Date()
    };
    dispatch({ type: 'UPDATE_SUPPLIER', payload: updatedSupplier });
  };

  const deleteSupplier = (supplierId: string) => {
    dispatch({ type: 'DELETE_SUPPLIER', payload: supplierId });
  };

  const getSuppliersByCategory = (category: string) => {
    // Simplified for now - will need location data from LocationContext
    return state.suppliers.filter(supplier => 
      supplier.category === category
    );
  };

  const getSuppliersByLocation = (location: string) => {
    // Simplified for now - will need location data from LocationContext
    return state.suppliers.filter(supplier => 
      supplier.location === location
    );
  };

  return (
    <SupplierContext.Provider value={{
      ...state,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      getSuppliersByCategory,
      getSuppliersByLocation
    }}>
      {children}
    </SupplierContext.Provider>
  );
};

export const useSupplier = () => {
  const context = useContext(SupplierContext);
  if (!context) {
    throw new Error('useSupplier must be used within a SupplierProvider');
  }
  return context;
};