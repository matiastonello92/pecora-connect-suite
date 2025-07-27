import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Location {
  code: string;
  name: string;
}

/**
 * Hook to fetch all active locations dynamically
 * This ensures the app supports any number of locations without hardcoding
 */
export const useActiveLocations = () => {
  return useQuery({
    queryKey: ['active-locations'],
    queryFn: async (): Promise<Location[]> => {
      const { data, error } = await supabase
        .from('locations')
        .select('code, name')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching active locations:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - locations don't change frequently
  });
};

/**
 * Helper function to check if user has access to a specific location
 */
export const userHasAccessToLocation = (userLocations: string[], location: string): boolean => {
  return userLocations.includes(location);
};

/**
 * Helper function to get all locations a user has access to
 */
export const getUserAccessibleLocations = (userLocations: string[], allLocations: Location[]): Location[] => {
  return allLocations.filter(location => userHasAccessToLocation(userLocations, location.code));
};

/**
 * Helper function to check if user has access to multiple locations
 */
export const userHasMultipleLocations = (userLocations: string[]): boolean => {
  return userLocations.length > 1;
};