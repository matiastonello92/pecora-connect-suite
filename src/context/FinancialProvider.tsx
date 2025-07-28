import React, { createContext, useContext, ReactNode } from 'react';
import { FinancialProvider as BaseFinancialProvider } from './FinancialContext';
import { CashRegisterProvider } from './CashRegisterContext';
import { ReportsProvider } from './ReportsContext';

// Financial provider that combines financial data, cash register, and reports
interface FinancialContextType {
  // This will be extended as we consolidate more context
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  const value = {
    // Financial context value
  };

  return (
    <FinancialContext.Provider value={value}>
      <BaseFinancialProvider>
        <CashRegisterProvider>
          <ReportsProvider>
            {children}
          </ReportsProvider>
        </CashRegisterProvider>
      </BaseFinancialProvider>
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};