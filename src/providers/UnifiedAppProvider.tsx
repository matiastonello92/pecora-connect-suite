/**
 * Unified App Provider
 * Consolidates app-level state into a simple, typed interface
 */

import React, { ReactNode, createContext, useContext, useState, useMemo } from 'react';
import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';

// Unified App Context Type
interface UnifiedAppContextType {
  // Auth state (delegated to EnhancedAuthProvider)
  auth: {
    user: any;
    profile: any;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  
  // Global app state
  app: {
    isInitialized: boolean;
    theme: 'light' | 'dark';
    sidebar: {
      isCollapsed: boolean;
      toggle: () => void;
    };
  };
}

const UnifiedAppContext = createContext<UnifiedAppContextType | undefined>(undefined);

export const useUnifiedApp = () => {
  const context = useContext(UnifiedAppContext);
  if (!context) {
    throw new Error('useUnifiedApp must be used within a UnifiedAppProvider');
  }
  return context;
};

// Provider component
export const UnifiedAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useEnhancedAuth();
  
  // Global app state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const contextValue = useMemo((): UnifiedAppContextType => ({
    auth: {
      user: auth.user,
      profile: auth.profile,
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
    },
    
    app: {
      isInitialized: auth.isAuthenticated && !auth.isLoading,
      theme,
      sidebar: {
        isCollapsed,
        toggle: () => setIsCollapsed(!isCollapsed),
      },
    },
  }), [
    auth.user,
    auth.profile, 
    auth.isAuthenticated,
    auth.isLoading,
    theme,
    isCollapsed,
  ]);

  return (
    <UnifiedAppContext.Provider value={contextValue}>
      {children}
    </UnifiedAppContext.Provider>
  );
};