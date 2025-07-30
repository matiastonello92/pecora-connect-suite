import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';
import { useLocationMeta } from './LocationMetaContext';

/**
 * LocationStateContext: Manages active location state and switching logic
 * Handles location selection, geolocation, and user preferences
 */

export interface LocationOption {
  value: string;
  label: string;
}

interface LocationStateContextType {
  // Current state
  activeLocation: string | null;
  suggestedLocation: string | null;
  hasRequestedPermission: boolean;
  
  // Computed properties
  availableLocations: LocationOption[];
  canSwitchLocations: boolean;
  isLocationBlocked: boolean;
  
  // Actions
  setActiveLocation: (location: string) => void;
  requestLocationPermission: () => Promise<void>;
  acceptSuggestedLocation: () => void;
  dismissSuggestedLocation: () => void;
  
  // Loading states
  isLoadingUserLocations: boolean;
  userLocationError: Error | null;
}

const LocationStateContext = createContext<LocationStateContextType | undefined>(undefined);

interface LocationStateProviderProps {
  children: ReactNode;
}

export const LocationStateProvider: React.FC<LocationStateProviderProps> = ({ children }) => {
  const { user, profile } = useEnhancedAuth();
  const { allLocations, getLocationCoordinates } = useLocationMeta();
  const queryClient = useQueryClient();
  
  // Local state
  const [activeLocation, setActiveLocationState] = useState<string | null>(null);
  const [suggestedLocation, setSuggestedLocation] = useState<string | null>(null);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  // Load user's accessible locations from profile
  const {
    data: userLocations = [],
    isLoading: isLoadingUserLocations,
    error: userLocationError
  } = useQuery({
    queryKey: ['user-locations', user?.id],
    queryFn: async () => {
      if (!user?.id || !profile) return [];
      
      // Get locations directly from the profile
      return profile.locations || [];
    },
    enabled: !!user?.id && !!profile,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes cache time
  });

  // Computed properties
  const availableLocations: LocationOption[] = React.useMemo(() => {
    return allLocations
      .filter(location => userLocations.includes(location.code))
      .map(location => ({
        value: location.code,
        label: location.name
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allLocations, userLocations]);

  const canSwitchLocations = availableLocations.length > 1;
  
  const isLocationBlocked = !activeLocation || !userLocations.includes(activeLocation);

  // Initialize active location
  useEffect(() => {
    if (!user?.id || availableLocations.length === 0) return;

    // Priority: localStorage > user's first location > first available
    const savedLocation = localStorage.getItem('activeLocation');
    
    if (savedLocation && userLocations.includes(savedLocation)) {
      setActiveLocationState(savedLocation);
    } else if (userLocations.length > 0) {
      setActiveLocationState(userLocations[0]);
    }
  }, [user?.id, userLocations, availableLocations.length]);

  // Location actions
  const setActiveLocation = useCallback((location: string) => {
    if (!userLocations.includes(location)) {
      console.warn(`User does not have access to location: ${location}`);
      return;
    }
    
    setActiveLocationState(location);
    localStorage.setItem('activeLocation', location);
    
    // Invalidate location-specific queries
    queryClient.invalidateQueries({ 
      predicate: (query) => 
        query.queryKey.some(key => 
          typeof key === 'string' && key.includes('location-data')
        )
    });
  }, [userLocations, queryClient]);

  const requestLocationPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      return;
    }

    setHasRequestedPermission(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Find nearest location
      let nearestLocation: string | null = null;
      let minDistance = Infinity;

      availableLocations.forEach(({ value: locationCode }) => {
        const coordinates = getLocationCoordinates(locationCode);
        if (coordinates) {
          const distance = calculateDistance(
            latitude,
            longitude,
            coordinates.latitude,
            coordinates.longitude
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            nearestLocation = locationCode;
          }
        }
      });

      if (nearestLocation && nearestLocation !== activeLocation) {
        setSuggestedLocation(nearestLocation);
      }
    } catch (error) {
      console.warn('Error getting location:', error);
    }
  }, [availableLocations, getLocationCoordinates, activeLocation]);

  const acceptSuggestedLocation = useCallback(() => {
    if (suggestedLocation) {
      setActiveLocation(suggestedLocation);
      setSuggestedLocation(null);
    }
  }, [suggestedLocation, setActiveLocation]);

  const dismissSuggestedLocation = useCallback(() => {
    setSuggestedLocation(null);
  }, []);

  const value: LocationStateContextType = {
    activeLocation,
    suggestedLocation,
    hasRequestedPermission,
    availableLocations,
    canSwitchLocations,
    isLocationBlocked,
    setActiveLocation,
    requestLocationPermission,
    acceptSuggestedLocation,
    dismissSuggestedLocation,
    isLoadingUserLocations,
    userLocationError: userLocationError as Error | null,
  };

  return (
    <LocationStateContext.Provider value={value}>
      {children}
    </LocationStateContext.Provider>
  );
};

export const useLocationState = (): LocationStateContextType => {
  const context = useContext(LocationStateContext);
  if (!context) {
    throw new Error('useLocationState must be used within a LocationStateProvider');
  }
  return context;
};

// Helper function to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}