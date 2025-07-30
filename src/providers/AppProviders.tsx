/**
 * App Providers
 * Single entry point for all providers - reduces nesting from 6 levels to 2 levels
 */

import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SimpleAuthProvider } from '@/context/SimpleAuthContext';
import { OptimizedLocationProvider } from '@/context/OptimizedLocationProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Business contexts (these will be wrapped by UnifiedAppProvider)
import { InventoryProvider } from '@/context/InventoryContext';
import { KitchenInventoryProvider } from '@/context/KitchenInventoryContext';
import { ChecklistProvider } from '@/context/ChecklistContext';
import { EquipmentProvider } from '@/context/EquipmentContext';
import { SupplierProvider } from '@/context/SupplierContext';
import { CashRegisterProvider } from '@/context/CashRegisterContext';
import { FinancialProvider } from '@/context/FinancialProvider';
import { CommunicationProvider } from '@/context/CommunicationProvider';
import { UserManagementProvider } from '@/context/UserManagementContext';
import { ChatProvider } from '@/context/ChatContext';

import { UnifiedAppProvider } from './UnifiedAppProvider';
import { UnifiedBusinessProvider } from './UnifiedBusinessProvider';

interface AppProvidersProps {
  children: ReactNode;
  queryClient: QueryClient;
}

/**
 * Main App Providers
 * FINAL STRUCTURE: Only 2 levels of nesting (Core + Business)
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children, queryClient }) => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SimpleAuthProvider>
            <OptimizedLocationProvider>
              <UnifiedBusinessProvider>
                <UnifiedAppProvider>
                  <TooltipProvider>
                    {children}
                  </TooltipProvider>
                </UnifiedAppProvider>
              </UnifiedBusinessProvider>
            </OptimizedLocationProvider>
          </SimpleAuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

// Legacy exports for backward compatibility
export { useUnifiedApp } from './UnifiedAppProvider';
export { useBusiness } from './BusinessContextProvider';