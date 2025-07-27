import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useActiveLocations, Location, userHasMultipleLocations } from '@/hooks/useLocations';

interface LocationContextType {
  activeLocation: string;
  setActiveLocation: (location: string) => void;
  canSwitchLocations: boolean;
  availableLocations: { value: string; label: string }[];
  isViewingAllLocations: boolean;
  userLocations: string[];
  allActiveLocations: Location[];
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { data: allActiveLocations = [], isLoading } = useActiveLocations();
  
  // Get user's locations from the new locations array field
  const userLocations = user?.locations || [];
  
  // Set initial active location to first user location or fallback
  const [activeLocation, setActiveLocationState] = useState<string>(
    userLocations[0] || 'menton'
  );

  // User can switch locations if they have multiple locations
  const canSwitchLocations = userHasMultipleLocations(userLocations);

  // Available locations for switching - based on user's assigned locations
  const availableLocations = useMemo(() => {
    const userAccessibleLocations = allActiveLocations.filter(location => 
      userLocations.includes(location.code)
    );
    
    const locations = userAccessibleLocations.map(location => ({
      value: location.code,
      label: location.name
    }));
    
    // Add "All Locations" option only for users with multiple locations
    if (canSwitchLocations) {
      locations.unshift({ value: 'all_locations', label: 'All Locations' });
    }
    
    return locations;
  }, [allActiveLocations, userLocations, canSwitchLocations]);

  // Set default location based on user's first location
  useEffect(() => {
    if (userLocations.length > 0 && !userLocations.includes(activeLocation)) {
      setActiveLocationState(userLocations[0]);
    }
  }, [userLocations, activeLocation]);

  const setActiveLocation = (location: string) => {
    if (canSwitchLocations || userLocations.includes(location)) {
      setActiveLocationState(location);
      // Store in localStorage for persistence
      localStorage.setItem('activeLocation', location);
    }
  };

  // Load saved location on mount if valid
  useEffect(() => {
    if (canSwitchLocations) {
      const saved = localStorage.getItem('activeLocation');
      if (saved && (saved === 'all_locations' || userLocations.includes(saved))) {
        setActiveLocationState(saved);
      }
    }
  }, [canSwitchLocations, userLocations]);

  const isViewingAllLocations = activeLocation === 'all_locations';

  const value: LocationContextType = {
    activeLocation,
    setActiveLocation,
    canSwitchLocations,
    availableLocations,
    isViewingAllLocations,
    userLocations,
    allActiveLocations
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