import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * LocationMetaContext: Manages location definitions, hierarchy, and metadata
 * Loads location structure data that rarely changes
 */

export interface LocationHierarchy {
  id: string;
  code: string;
  name: string;
  depth: number;
  hierarchy: Record<string, any>;
  fullPath: string;
  parentLocationId?: string;
  isActive: boolean;
}

export interface LocationMetadata {
  code: string;
  name: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timezone?: string;
  currency?: string;
  locale?: string;
}

interface LocationMetaContextType {
  // Location definitions
  allLocations: LocationHierarchy[];
  locationMetadata: Record<string, LocationMetadata>;
  
  // Hierarchy queries
  getLocationDescendants: (locationId: string) => LocationHierarchy[];
  getLocationAncestors: (locationId: string) => LocationHierarchy[];
  getLocationsByLevel: (level: string) => LocationHierarchy[];
  
  // Metadata helpers
  getLocationByCode: (code: string) => LocationHierarchy | undefined;
  getLocationCoordinates: (code: string) => { latitude: number; longitude: number } | undefined;
  
  // Loading states
  isLoadingHierarchy: boolean;
  isLoadingMetadata: boolean;
  hierarchyError: Error | null;
  metadataError: Error | null;
}

const LocationMetaContext = createContext<LocationMetaContextType | undefined>(undefined);

// Location coordinates mapping
const LOCATION_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  menton: { latitude: 43.7764, longitude: 7.5045 },
  lyon: { latitude: 45.7640, longitude: 4.8357 },
  // Add more locations as needed
};

interface LocationMetaProviderProps {
  children: ReactNode;
}

export const LocationMetaProvider: React.FC<LocationMetaProviderProps> = ({ children }) => {
  // Load all active locations with hierarchy
  const {
    data: allLocations = [],
    isLoading: isLoadingHierarchy,
    error: hierarchyError
  } = useQuery({
    queryKey: ['location-hierarchy'],
    queryFn: async (): Promise<LocationHierarchy[]> => {
      const { data, error } = await supabase
        .from('locations')
        .select(`
          id,
          code,
          name,
          depth,
          hierarchy,
          path,
          parent_location_id,
          is_active
        `)
        .eq('is_active', true)
        .order('depth')
        .order('name');

      if (error) throw error;

      return (data || []).map(location => ({
        id: location.id,
        code: location.code,
        name: location.name,
        depth: location.depth || 0,
        hierarchy: typeof location.hierarchy === 'object' && location.hierarchy !== null 
          ? location.hierarchy as Record<string, any>
          : {},
        fullPath: Array.isArray(location.path) ? location.path.join(' > ') : location.name,
        parentLocationId: location.parent_location_id || undefined,
        isActive: location.is_active
      }));
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - hierarchy rarely changes
    gcTime: 1000 * 60 * 60, // 1 hour cache time
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Load location metadata
  const {
    data: locationMetadata = {},
    isLoading: isLoadingMetadata,
    error: metadataError
  } = useQuery({
    queryKey: ['location-metadata'],
    queryFn: async (): Promise<Record<string, LocationMetadata>> => {
      // For now, build metadata from known locations and coordinates
      // In the future, this could come from a metadata table
      const metadata: Record<string, LocationMetadata> = {};
      
      allLocations.forEach(location => {
        metadata[location.code] = {
          code: location.code,
          name: location.name,
          coordinates: LOCATION_COORDINATES[location.code],
          timezone: 'Europe/Paris', // Default timezone
          currency: 'EUR',
          locale: 'fr-FR'
        };
      });
      
      return metadata;
    },
    enabled: allLocations.length > 0,
    staleTime: 1000 * 60 * 60, // 1 hour - metadata rarely changes
    gcTime: 1000 * 60 * 120, // 2 hours cache time
  });

  // Helper functions
  const getLocationDescendants = (locationId: string): LocationHierarchy[] => {
    const location = allLocations.find(loc => loc.id === locationId);
    if (!location) return [];
    
    return allLocations.filter(loc => 
      loc.depth > location.depth && 
      loc.fullPath.startsWith(location.fullPath)
    );
  };

  const getLocationAncestors = (locationId: string): LocationHierarchy[] => {
    const location = allLocations.find(loc => loc.id === locationId);
    if (!location) return [];
    
    const ancestors: LocationHierarchy[] = [];
    let currentParentId = location.parentLocationId;
    
    while (currentParentId) {
      const parent = allLocations.find(loc => loc.id === currentParentId);
      if (parent) {
        ancestors.unshift(parent);
        currentParentId = parent.parentLocationId;
      } else {
        break;
      }
    }
    
    return ancestors;
  };

  const getLocationsByLevel = (level: string): LocationHierarchy[] => {
    return allLocations.filter(location => 
      location.hierarchy && location.hierarchy[level]
    );
  };

  const getLocationByCode = (code: string): LocationHierarchy | undefined => {
    return allLocations.find(location => location.code === code);
  };

  const getLocationCoordinates = (code: string) => {
    return locationMetadata[code]?.coordinates;
  };

  const value: LocationMetaContextType = {
    allLocations,
    locationMetadata,
    getLocationDescendants,
    getLocationAncestors,
    getLocationsByLevel,
    getLocationByCode,
    getLocationCoordinates,
    isLoadingHierarchy,
    isLoadingMetadata,
    hierarchyError: hierarchyError as Error | null,
    metadataError: metadataError as Error | null,
  };

  return (
    <LocationMetaContext.Provider value={value}>
      {children}
    </LocationMetaContext.Provider>
  );
};

export const useLocationMeta = (): LocationMetaContextType => {
  const context = useContext(LocationMetaContext);
  if (!context) {
    throw new Error('useLocationMeta must be used within a LocationMetaProvider');
  }
  return context;
};