/**
 * Unified Business Provider
 * Consolidates ALL business providers into a single provider using composition pattern
 * Replaces the 10-level nesting with optimized context management
 */

import React, { ReactNode, createContext, useContext, useMemo } from 'react';
import { useEnhancedPermissions } from '@/providers/EnhancedPermissionProvider';

// Import all business context hooks
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
import { useLocation } from '@/context/LocationContext';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { useReports } from '@/context/ReportsContext';

// Import original providers for composition
import { InventoryProvider } from '@/context/InventoryContext';
import { KitchenInventoryProvider } from '@/context/KitchenInventoryContext';
import { ChecklistProvider } from '@/context/ChecklistContext';
import { EquipmentProvider } from '@/context/EquipmentContext';
import { SupplierProvider } from '@/context/SupplierContext';
import { CashRegisterProvider } from '@/context/CashRegisterContext';
import { FinancialProvider } from '@/context/FinancialContext';
import { CommunicationProvider } from '@/context/CommunicationContext';
import { UserManagementProvider } from '@/context/UserManagementContext';
import { ChatProvider } from '@/context/ChatContext';
import { LocationProvider } from '@/context/LocationContext';

import { UnreadMessagesProvider } from '@/context/UnreadMessagesContext';
import { ReportsProvider } from '@/context/ReportsContext';

// Unified Business Context Interface
interface UnifiedBusinessContextType {
  // Business contexts
  inventory: ReturnType<typeof useInventory>;
  kitchenInventory: ReturnType<typeof useKitchenInventory>;
  checklist: ReturnType<typeof useChecklist>;
  equipment: ReturnType<typeof useEquipment>;
  supplier: ReturnType<typeof useSupplier>;
  cashRegister: ReturnType<typeof useCashRegister>;
  financial: ReturnType<typeof useFinancial>;
  communication: ReturnType<typeof useCommunication>;
  userManagement: ReturnType<typeof useUserManagement>;
  chat: ReturnType<typeof useChatContext>;
  
  // Core contexts
  location: ReturnType<typeof useLocation>;
  permissions: ReturnType<typeof useEnhancedPermissions>;
  unreadMessages: ReturnType<typeof useUnreadMessages>;
  reports: ReturnType<typeof useReports>;
}

const UnifiedBusinessContext = createContext<UnifiedBusinessContextType | undefined>(undefined);

export const useUnifiedBusiness = () => {
  const context = useContext(UnifiedBusinessContext);
  if (!context) {
    throw new Error('useUnifiedBusiness must be used within a UnifiedBusinessProvider');
  }
  return context;
};

// All providers nested component (will be optimized)
const AllProvidersNested: React.FC<{ children: ReactNode }> = ({ children }) => (
  <LocationProvider>
    <UnreadMessagesProvider>
      <ReportsProvider>
        <InventoryProvider>
          <KitchenInventoryProvider>
            <ChecklistProvider>
              <EquipmentProvider>
                <SupplierProvider>
                  <CashRegisterProvider>
                    <FinancialProvider>
                      <CommunicationProvider>
                        <UserManagementProvider>
                          <ChatProvider>
                            {children}
                          </ChatProvider>
                        </UserManagementProvider>
                      </CommunicationProvider>
                    </FinancialProvider>
                  </CashRegisterProvider>
                </SupplierProvider>
              </EquipmentProvider>
            </ChecklistProvider>
          </KitchenInventoryProvider>
        </InventoryProvider>
      </ReportsProvider>
    </UnreadMessagesProvider>
  </LocationProvider>
);

// Context value component that uses all hooks
const BusinessContextValue: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use all business context hooks
  const inventory = useInventory();
  const kitchenInventory = useKitchenInventory();
  const checklist = useChecklist();
  const equipment = useEquipment();
  const supplier = useSupplier();
  const cashRegister = useCashRegister();
  const financial = useFinancial();
  const communication = useCommunication();
  const userManagement = useUserManagement();
  const chat = useChatContext();
  const location = useLocation();
  const permissions = useEnhancedPermissions();
  const unreadMessages = useUnreadMessages();
  const reports = useReports();

  const contextValue = useMemo((): UnifiedBusinessContextType => ({
    inventory,
    kitchenInventory,
    checklist,
    equipment,
    supplier,
    cashRegister,
    financial,
    communication,
    userManagement,
    chat,
    location,
    permissions,
    unreadMessages,
    reports,
  }), [
    inventory,
    kitchenInventory,
    checklist,
    equipment,
    supplier,
    cashRegister,
    financial,
    communication,
    userManagement,
    chat,
    location,
    permissions,
    unreadMessages,
    reports,
  ]);

  return (
    <UnifiedBusinessContext.Provider value={contextValue}>
      {children}
    </UnifiedBusinessContext.Provider>
  );
};

// Main Provider component
export const UnifiedBusinessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AllProvidersNested>
      <BusinessContextValue>
        {children}
      </BusinessContextValue>
    </AllProvidersNested>
  );
};

// Individual context access for backward compatibility
export const useBusiness = () => useUnifiedBusiness();
export const useBusinessInventory = () => useUnifiedBusiness().inventory;
export const useBusinessKitchenInventory = () => useUnifiedBusiness().kitchenInventory;
export const useBusinessChecklist = () => useUnifiedBusiness().checklist;
export const useBusinessEquipment = () => useUnifiedBusiness().equipment;
export const useBusinessSupplier = () => useUnifiedBusiness().supplier;
export const useBusinessCashRegister = () => useUnifiedBusiness().cashRegister;
export const useBusinessFinancial = () => useUnifiedBusiness().financial;
export const useBusinessCommunication = () => useUnifiedBusiness().communication;
export const useBusinessUserManagement = () => useUnifiedBusiness().userManagement;
export const useBusinessChat = () => useUnifiedBusiness().chat;
export const useBusinessLocation = () => useUnifiedBusiness().location;
export const useBusinessPermissions = () => useUnifiedBusiness().permissions;
export const useBusinessUnreadMessages = () => useUnifiedBusiness().unreadMessages;
export const useBusinessReports = () => useUnifiedBusiness().reports;