import React, { ReactNode } from 'react';
import { LocationMetaProvider } from './LocationMetaContext';
import { LocationStateProvider } from './LocationStateContext';
import { LocationDataProvider } from './LocationDataContext';

/**
 * OptimizedLocationProvider: Combines all three location contexts
 * Provides the complete location management system with optimized data loading
 */

interface OptimizedLocationProviderProps {
  children: ReactNode;
}

export const OptimizedLocationProvider: React.FC<OptimizedLocationProviderProps> = ({ children }) => {
  return (
    <LocationMetaProvider>
      <LocationStateProvider>
        <LocationDataProvider>
          {children}
        </LocationDataProvider>
      </LocationStateProvider>
    </LocationMetaProvider>
  );
};

// Re-export all hooks for easy access
export { useLocationMeta } from './LocationMetaContext';
export { useLocationState } from './LocationStateContext';
export { useLocationData } from './LocationDataContext';

// Re-export types
export type { LocationHierarchy, LocationMetadata } from './LocationMetaContext';
export type { LocationOption } from './LocationStateContext';
export type { LocationSpecificData, LocationDataCache } from './LocationDataContext';