import React from 'react';
import { useLocationMeta, useLocationState, useLocationData } from './OptimizedLocationProvider';

/**
 * Backward compatibility hook that provides the same interface as the original LocationContext
 * This allows existing components to work without changes while using the optimized contexts
 */

interface BackwardCompatibleLocationContext {
  // State from LocationStateContext
  activeLocation: string | null;
  suggestedLocation: string | null;
  hasRequestedPermission: boolean;
  availableLocations: Array<{ value: string; label: string }>;
  canSwitchLocations: boolean;
  isLocationBlocked: boolean;
  setActiveLocation: (location: string) => void;
  requestLocationPermission: () => Promise<void>;
  acceptSuggestedLocation: () => void;
  dismissSuggestedLocation: () => void;

  // Meta data from LocationMetaContext
  allLocations: Array<{
    id: string;
    code: string;
    name: string;
    depth: number;
    hierarchy: Record<string, any>;
    fullPath: string;
    parentLocationId?: string;
    isActive: boolean;
  }>;
  allActiveLocations: Array<{ code: string; name: string }>; // Backward compatibility alias
  getLocationByCode: (code: string) => any;
  getLocationCoordinates: (code: string) => { latitude: number; longitude: number } | undefined;

  // Data methods from LocationDataContext
  activeLocationData: any;
  prefetchLocationData: (locationCode: string) => Promise<void>;
  invalidateLocationData: (locationCode?: string) => void;

  // Loading states (combined)
  isLoading: boolean;
  error: Error | null;

  // Additional helpers for easier migration
  userLocations: string[];
  effectiveLocation: string | null;
}

export const useLocation = (): BackwardCompatibleLocationContext => {
  const meta = useLocationMeta();
  const state = useLocationState();
  const data = useLocationData();

  // Derive user locations from available locations
  const userLocations = state.availableLocations.map(loc => loc.value);
  
  // Effective location is the active location or first available
  const effectiveLocation = state.activeLocation || userLocations[0] || null;

  // Combined loading and error states
  const isLoading = meta.isLoadingHierarchy || meta.isLoadingMetadata || 
                   state.isLoadingUserLocations || data.isLoadingActiveLocation;
  
  const error = meta.hierarchyError || meta.metadataError || 
               state.userLocationError || data.activeLocationError;

  // Create backward compatibility alias for allActiveLocations
  const allActiveLocations = meta.allLocations.map(loc => ({
    code: loc.code,
    name: loc.name
  }));

  return {
    // LocationState properties
    activeLocation: state.activeLocation,
    suggestedLocation: state.suggestedLocation,
    hasRequestedPermission: state.hasRequestedPermission,
    availableLocations: state.availableLocations,
    canSwitchLocations: state.canSwitchLocations,
    isLocationBlocked: state.isLocationBlocked,
    setActiveLocation: state.setActiveLocation,
    requestLocationPermission: state.requestLocationPermission,
    acceptSuggestedLocation: state.acceptSuggestedLocation,
    dismissSuggestedLocation: state.dismissSuggestedLocation,

    // LocationMeta properties
    allLocations: meta.allLocations,
    allActiveLocations, // Backward compatibility alias
    getLocationByCode: meta.getLocationByCode,
    getLocationCoordinates: meta.getLocationCoordinates,

    // LocationData properties
    activeLocationData: data.activeLocationData,
    prefetchLocationData: data.prefetchLocationData,
    invalidateLocationData: data.invalidateLocationData,

    // Combined states
    isLoading,
    error,

    // Additional helpers
    userLocations,
    effectiveLocation,
  };
};

/**
 * Migration helper hook that provides additional utilities for transitioning
 * from the old LocationContext to the new optimized contexts
 */
export const useLocationMigration = () => {
  const meta = useLocationMeta();
  const state = useLocationState();
  const data = useLocationData();

  return {
    // Performance monitoring
    getCacheStats: data.getCacheStats,
    getCacheStatus: data.getCacheStatus,
    
    // Hierarchy navigation
    getLocationDescendants: meta.getLocationDescendants,
    getLocationAncestors: meta.getLocationAncestors,
    getLocationsByLevel: meta.getLocationsByLevel,
    
    // Advanced data operations
    getAllLocationData: data.getAllLocationData,
    getLocationData: data.getLocationData,
    clearLocationCache: data.clearLocationCache,
    
    // Context health check
    getContextHealth: () => ({
      meta: {
        locationsLoaded: meta.allLocations.length,
        isLoading: meta.isLoadingHierarchy || meta.isLoadingMetadata,
        hasError: !!(meta.hierarchyError || meta.metadataError)
      },
      state: {
        hasActiveLocation: !!state.activeLocation,
        availableLocationCount: state.availableLocations.length,
        canSwitch: state.canSwitchLocations,
        isLoading: state.isLoadingUserLocations,
        hasError: !!state.userLocationError
      },
      data: {
        hasCachedData: !!data.activeLocationData,
        cacheStats: data.getCacheStats(),
        isLoading: data.isLoadingActiveLocation,
        hasError: !!data.activeLocationError
      }
    }),
    
    // Migration recommendations
    getMigrationRecommendations: () => {
      const recommendations: string[] = [];
      
      if (meta.allLocations.length === 0) {
        recommendations.push('Consider adding location hierarchy data');
      }
      
      if (state.availableLocations.length > 3) {
        recommendations.push('Consider implementing location grouping for better UX');
      }
      
      const cacheStats = data.getCacheStats();
      if (cacheStats.size > 10) {
        recommendations.push('Consider clearing old location cache data');
      }
      
      return recommendations;
    }
  };
};