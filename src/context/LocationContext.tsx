import React, { ReactNode } from 'react';
import { OptimizedLocationProvider } from './OptimizedLocationProvider';
import { useLocation as useOptimizedLocation } from './LocationBackwardCompatibility';

/**
 * Updated LocationContext that uses the new optimized three-context system
 * This maintains backward compatibility while providing improved performance
 */

// Re-export the optimized location hook with the same name for backward compatibility
export const useLocation = useOptimizedLocation;

// Re-export the provider with the same name for backward compatibility
export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <OptimizedLocationProvider>
      {children}
    </OptimizedLocationProvider>
  );
};

// Re-export types and hooks from the optimized contexts for direct access when needed
export { 
  useLocationMeta, 
  useLocationState, 
  useLocationData,
  type LocationHierarchy,
  type LocationMetadata,
  type LocationOption,
  type LocationSpecificData 
} from './OptimizedLocationProvider';

// Re-export migration utilities
export { useLocationMigration } from './LocationBackwardCompatibility';

/**
 * MIGRATION GUIDE:
 * 
 * The LocationContext has been split into three focused contexts:
 * 
 * 1. LocationMetaContext (useLocationMeta):
 *    - Location definitions and hierarchy data
 *    - allLocations, getLocationByCode, getLocationCoordinates
 *    - Cached for 30 minutes (rarely changes)
 * 
 * 2. LocationStateContext (useLocationState):
 *    - Active location and switching logic
 *    - activeLocation, setActiveLocation, canSwitchLocations
 *    - Real-time state management
 * 
 * 3. LocationDataContext (useLocationData):
 *    - Location-specific data caching
 *    - activeLocationData, prefetchLocationData
 *    - Optimized with React Query
 * 
 * BACKWARD COMPATIBILITY:
 * - Existing components using useLocation() will work unchanged
 * - All previous properties and methods are available
 * - Performance is automatically improved
 * 
 * PERFORMANCE BENEFITS:
 * - Lazy loading of location hierarchy (loaded once, cached 30min)
 * - Intelligent data prefetching for location switching
 * - Optimized React Query caching with proper staleTime
 * - Separate re-renders for different types of location changes
 * 
 * ADVANCED USAGE:
 * - Use useLocationMeta() for hierarchy operations
 * - Use useLocationState() for state management only
 * - Use useLocationData() for data operations and caching
 * - Use useLocationMigration() for performance monitoring
 */