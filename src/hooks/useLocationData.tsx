import { useLocation } from '@/context/LocationContext';
import { useAuth } from '@/context/AuthContext';
import { userHasAccessToLocation } from '@/hooks/useLocations';

/**
 * Hook to get the current effective location for data operations
 * Returns the active location for users with multiple location access,
 * or the user's primary location for single-location users
 */
export const useEffectiveLocation = () => {
  const { user } = useAuth();
  const { activeLocation, canSwitchLocations, userLocations } = useLocation();

  // If user can switch locations, use the active location
  // Otherwise, use their first assigned location
  const effectiveLocation = canSwitchLocations 
    ? activeLocation 
    : (userLocations[0] || 'menton');

  return {
    effectiveLocation,
    canSwitchLocations,
    isLocationRestricted: !canSwitchLocations,
    userLocations
  };
};

/**
 * Hook to filter data arrays by location based on user's access
 */
export const useLocationFilter = <T extends { location?: string }>(data: T[]) => {
  const { effectiveLocation, canSwitchLocations, userLocations } = useEffectiveLocation();

  // Filter data based on user's location access
  const filteredData = data.filter(item => {
    if (!item.location) return true; // Include items without location

    // If user can switch locations and viewing all, show items from all user's locations
    if (canSwitchLocations && effectiveLocation === 'all_locations') {
      return userHasAccessToLocation(userLocations, item.location);
    }

    // If user can switch locations, filter by active location
    if (canSwitchLocations) {
      return item.location === effectiveLocation;
    }

    // For single-location users, show items from their accessible locations
    return userHasAccessToLocation(userLocations, item.location);
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
      // If viewing all locations, use the user's first location as default
      return effectiveLocation === 'all_locations' ? userLocations[0] : effectiveLocation;
    },
    effectiveLocation,
    userLocations,
    getUserAccessibleLocations: () => userLocations
  };
};
