import { useLocation } from '@/context/LocationContext';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { userHasAccessToLocation } from '@/hooks/useLocations';

/**
 * Hook to get the current effective location for data operations
 * Returns the active location for users with multiple location access,
 * or the user's primary location for single-location users
 */
export const useEffectiveLocation = () => {
  const { user } = useSimpleAuth();
  const { activeLocation, userLocations } = useLocation();

  // Always use the single active location (no "all_locations" support)
  const effectiveLocation = activeLocation || userLocations[0] || 'menton';

  return {
    effectiveLocation,
    isLocationRestricted: userLocations.length === 1,
    userLocations
  };
};

/**
 * Hook to filter data arrays by location based on user's access
 */
export const useLocationFilter = <T extends { location?: string }>(data: T[]) => {
  const { effectiveLocation } = useEffectiveLocation();

  // Filter data to show only items for the single active location
  const filteredData = data.filter(item => {
    if (!item.location) return true; // Include items without location
    
    // Only show items for the current active location
    return item.location === effectiveLocation;
  });

  return filteredData;
};

/**
 * Hook to get location data for new records
 */
export const useLocationData = () => {
  const { effectiveLocation, userLocations } = useEffectiveLocation();

  return {
    getLocationForNewRecord: () => {
      // Always use the current active location for new records
      return effectiveLocation;
    },
    effectiveLocation,
    userLocations,
    getUserAccessibleLocations: () => userLocations
  };
};
