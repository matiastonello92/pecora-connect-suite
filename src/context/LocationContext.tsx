import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useSimpleAuth } from './SimpleAuthContext';
import { useActiveLocations, Location, userHasMultipleLocations } from '@/hooks/useLocations';

interface LocationContextType {
  activeLocation: string;
  setActiveLocation: (location: string) => void;
  canSwitchLocations: boolean;
  availableLocations: { value: string; label: string }[];
  userLocations: string[];
  allActiveLocations: Location[];
  isLocationBlocked: boolean;
  requestLocationPermission: () => Promise<void>;
  suggestedLocation: string | null;
  acceptSuggestedLocation: () => void;
  dismissSuggestedLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Location coordinates for proximity detection
const LOCATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  menton: { lat: 43.7736, lng: 7.5042 },
  lyon: { lat: 45.7640, lng: 4.8357 },
  paris: { lat: 48.8566, lng: 2.3522 },
  nice: { lat: 43.7102, lng: 7.2620 },
  cannes: { lat: 43.5528, lng: 7.0174 },
  monaco: { lat: 43.7384, lng: 7.4246 },
  antibes: { lat: 43.5804, lng: 7.1251 }
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useSimpleAuth();
  const { data: allActiveLocations = [], isLoading } = useActiveLocations();
  
  // Get user's locations from their profile
  const userLocations = profile?.locations || ['menton'];
  
  // State for location management
  const [activeLocation, setActiveLocationState] = useState<string>('');
  const [suggestedLocation, setSuggestedLocation] = useState<string | null>(null);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  // User can switch locations if they have multiple locations
  const canSwitchLocations = userHasMultipleLocations(userLocations);

  // Available locations for switching - NO "All Locations" option
  const availableLocations = useMemo(() => {
    const userAccessibleLocations = allActiveLocations.filter(location => 
      userLocations.includes(location.code)
    );
    
    return userAccessibleLocations.map(location => ({
      value: location.code,
      label: location.name
    }));
  }, [allActiveLocations, userLocations]);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Find nearest location to user's current position
  const findNearestLocation = (lat: number, lng: number): string | null => {
    let nearestLocation = null;
    let minDistance = Infinity;

    for (const location of userLocations) {
      const coords = LOCATION_COORDINATES[location];
      if (coords) {
        const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
        if (distance < minDistance && distance < 50) { // Within 50km
          minDistance = distance;
          nearestLocation = location;
        }
      }
    }

    return nearestLocation;
  };

  // Request geolocation permission and suggest nearest location
  const requestLocationPermission = async (): Promise<void> => {
    if (!navigator.geolocation || hasRequestedPermission) return;
    
    setHasRequestedPermission(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const nearest = findNearestLocation(position.coords.latitude, position.coords.longitude);
      if (nearest && nearest !== activeLocation) {
        setSuggestedLocation(nearest);
      }
    } catch (error) {
      console.warn('Geolocation failed:', error);
    }
  };

  // Accept suggested location
  const acceptSuggestedLocation = () => {
    if (suggestedLocation) {
      setActiveLocation(suggestedLocation);
      setSuggestedLocation(null);
    }
  };

  // Dismiss suggested location
  const dismissSuggestedLocation = () => {
    setSuggestedLocation(null);
  };

  // Initialize active location with smart fallback
  useEffect(() => {
    if (userLocations.length === 0) return;

    // If single location, auto-select it
    if (userLocations.length === 1) {
      setActiveLocationState(userLocations[0]);
      localStorage.setItem('activeLocation', userLocations[0]);
      return;
    }

    // For multiple locations, try to restore from localStorage
    const saved = localStorage.getItem('activeLocation');
    if (saved && userLocations.includes(saved)) {
      setActiveLocationState(saved);
      return;
    }

    // Try geolocation if available
    if (navigator.geolocation && !hasRequestedPermission) {
      requestLocationPermission();
    }

    // Fallback to first location
    if (!activeLocation) {
      setActiveLocationState(userLocations[0]);
      localStorage.setItem('activeLocation', userLocations[0]);
    }
  }, [userLocations, hasRequestedPermission]);

  const setActiveLocation = (location: string) => {
    if (userLocations.includes(location)) {
      setActiveLocationState(location);
      localStorage.setItem('activeLocation', location);
      // Dismiss any suggestion when user manually switches
      if (suggestedLocation) {
        setSuggestedLocation(null);
      }
    }
  };

  // Check if location is blocked (no valid active location)
  const isLocationBlocked = !activeLocation || !userLocations.includes(activeLocation);

  const value: LocationContextType = {
    activeLocation,
    setActiveLocation,
    canSwitchLocations,
    availableLocations,
    userLocations,
    allActiveLocations,
    isLocationBlocked,
    requestLocationPermission,
    suggestedLocation,
    acceptSuggestedLocation,
    dismissSuggestedLocation
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};