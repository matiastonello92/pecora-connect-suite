import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocationType } from '@/types/users';
import { useAuth } from './AuthContext';

type ActiveLocationType = 'menton' | 'lyon';

interface LocationContextType {
  activeLocation: ActiveLocationType;
  setActiveLocation: (location: ActiveLocationType) => void;
  canSwitchLocations: boolean;
  availableLocations: { value: ActiveLocationType; label: string }[];
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeLocation, setActiveLocationState] = useState<ActiveLocationType>('menton');

  // Determine if user can switch locations
  const canSwitchLocations = user?.location === 'all_locations';

  // Available locations for switching
  const availableLocations = [
    { value: 'menton' as ActiveLocationType, label: 'Menton' },
    { value: 'lyon' as ActiveLocationType, label: 'Lyon' }
  ];

  // Set default location based on user's location
  useEffect(() => {
    if (user?.location && user.location !== 'all_locations') {
      setActiveLocationState(user.location as ActiveLocationType);
    }
  }, [user?.location]);

  const setActiveLocation = (location: ActiveLocationType) => {
    if (canSwitchLocations) {
      setActiveLocationState(location);
      // Store in localStorage for persistence
      localStorage.setItem('activeLocation', location);
    }
  };

  // Load saved location on mount
  useEffect(() => {
    if (canSwitchLocations) {
      const saved = localStorage.getItem('activeLocation') as ActiveLocationType;
      if (saved && availableLocations.some(loc => loc.value === saved)) {
        setActiveLocationState(saved);
      }
    }
  }, [canSwitchLocations]);

  const value: LocationContextType = {
    activeLocation,
    setActiveLocation,
    canSwitchLocations,
    availableLocations
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