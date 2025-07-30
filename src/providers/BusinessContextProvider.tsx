/**
 * Business Context Provider
 * Simple wrapper that provides access to all business contexts through a unified interface
 * Uses composition pattern instead of complex context merging
 */

import React, { ReactNode, createContext, useContext } from 'react';

// Import hooks from existing contexts (these will be available if their providers are present)
import { useInventory } from '@/context/InventoryContext';
import { useKitchenInventory } from '@/context/KitchenInventoryContext';
import { useChecklist } from '@/context/ChecklistContext';
import { useEquipment } from '@/context/EquipmentContext';
import { useSupplier } from '@/context/SupplierContext';
import { useCashRegister } from '@/context/CashRegisterContext';
import { useFinancial } from '@/context/FinancialContext';
import { useCommunication } from '@/context/CommunicationContext';
import { useUserManagement } from '@/context/UserManagementContext';
import { useChatContext } from '@/context/ChatContext';

// Simple interface that provides organized access to business contexts
interface BusinessContextType {
  // Helper methods to access business contexts
  getInventory: () => ReturnType<typeof useInventory>;
  getKitchenInventory: () => ReturnType<typeof useKitchenInventory>;
  getChecklist: () => ReturnType<typeof useChecklist>;
  getEquipment: () => ReturnType<typeof useEquipment>;
  getSupplier: () => ReturnType<typeof useSupplier>;
  getCashRegister: () => ReturnType<typeof useCashRegister>;
  getFinancial: () => ReturnType<typeof useFinancial>;
  getCommunication: () => ReturnType<typeof useCommunication>;
  getUserManagement: () => ReturnType<typeof useUserManagement>;
  getChat: () => ReturnType<typeof useChatContext>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessContextProvider');
  }
  return context;
};

// Provider component
export const BusinessContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const contextValue: BusinessContextType = {
    getInventory: useInventory,
    getKitchenInventory: useKitchenInventory, 
    getChecklist: useChecklist,
    getEquipment: useEquipment,
    getSupplier: useSupplier,
    getCashRegister: useCashRegister,
    getFinancial: useFinancial,
    getCommunication: useCommunication,
    getUserManagement: useUserManagement,
    getChat: useChatContext,
  };

  return (
    <BusinessContext.Provider value={contextValue}>
      {children}
    </BusinessContext.Provider>
  );
};