import { useLocation } from '@/context/LocationContext';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook to get the current effective location for data operations
 * Returns the active location for users with "all_locations" access,
 * or the user's assigned location for location-specific users
 */
export const useEffectiveLocation = () => {
  const { user } = useAuth();
  const { activeLocation, canSwitchLocations } = useLocation();

  // If user can switch locations, use the active location
  // Otherwise, use their assigned location
  const effectiveLocation = canSwitchLocations ? activeLocation : (user?.location as 'menton' | 'lyon' | 'all_locations');

  return {
    effectiveLocation,
    canSwitchLocations,
    isLocationRestricted: !canSwitchLocations
  };
};

/**
 * Hook to filter data arrays by location
 */
export const useLocationFilter = <T extends { location?: string }>(data: T[]) => {
  const { effectiveLocation, canSwitchLocations } = useEffectiveLocation();

  // If user can switch locations and not viewing all, filter by active location
  // If viewing all locations, show all data
  // Otherwise, filter by user's assigned location
  const filteredData = canSwitchLocations 
    ? (effectiveLocation === 'all_locations' ? data : data.filter(item => item.location === effectiveLocation))
    : data.filter(item => item.location === effectiveLocation || !item.location);

  return filteredData;
};

/**
 * Hook to get location data for new records
 */
export const useLocationData = () => {
  const { effectiveLocation } = useEffectiveLocation();

  return {
    getLocationForNewRecord: () => effectiveLocation,
    effectiveLocation
  };
};
