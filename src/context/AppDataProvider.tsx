import React, { createContext, useContext, ReactNode } from 'react';
import { LocationProvider } from './LocationContext';
import { UnreadMessagesProvider } from './UnreadMessagesContext';

// Core app data provider that combines location, permissions, and message state
interface AppDataContextType {
  // This will be extended as we consolidate more context
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const value = {
    // Core app data context value
  };

  return (
    <AppDataContext.Provider value={value}>
      <LocationProvider>
        <UnreadMessagesProvider>
          {children}
        </UnreadMessagesProvider>
      </LocationProvider>
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};