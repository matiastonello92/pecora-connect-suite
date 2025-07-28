import React, { createContext, useContext, ReactNode } from 'react';
import { ChatProvider } from './ChatContext';
import { CommunicationProvider as BaseCommunicationProvider } from './CommunicationContext';

// Communication provider that combines chat and messaging
interface CommunicationContextType {
  // This will be extended as we consolidate more context
}

const CommunicationContext = createContext<CommunicationContextType | undefined>(undefined);

export const CommunicationProvider = ({ children }: { children: ReactNode }) => {
  const value = {
    // Communication context value
  };

  return (
    <CommunicationContext.Provider value={value}>
      <ChatProvider>
        <BaseCommunicationProvider>
          {children}
        </BaseCommunicationProvider>
      </ChatProvider>
    </CommunicationContext.Provider>
  );
};

export const useCommunication = () => {
  const context = useContext(CommunicationContext);
  if (context === undefined) {
    throw new Error('useCommunication must be used within a CommunicationProvider');
  }
  return context;
};