import React, { createContext, useContext, ReactNode } from 'react';
import { InventoryProvider } from './InventoryContext';
import { KitchenInventoryProvider } from './KitchenInventoryContext';
import { ChecklistProvider } from './ChecklistContext';
import { EquipmentProvider } from './EquipmentContext';
import { SupplierProvider } from './SupplierContext';

// Business operations provider that combines inventory, checklists, equipment, and suppliers
interface BusinessContextType {
  // This will be extended as we consolidate more context
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const value = {
    // Business context value
  };

  return (
    <BusinessContext.Provider value={value}>
      <InventoryProvider>
        <KitchenInventoryProvider>
          <ChecklistProvider>
            <EquipmentProvider>
              <SupplierProvider>
                {children}
              </SupplierProvider>
            </EquipmentProvider>
          </ChecklistProvider>
        </KitchenInventoryProvider>
      </InventoryProvider>
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};