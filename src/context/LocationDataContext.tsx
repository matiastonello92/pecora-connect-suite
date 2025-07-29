import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient, useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLocationState } from './LocationStateContext';
import { useOptimizedLocationQueries } from '@/hooks/useOptimizedLocationQueries';

/**
 * LocationDataContext: Manages caching and lazy loading of location-specific data
 * Optimizes data fetching with React Query for location-aware content
 */

export interface LocationDataCache {
  [locationCode: string]: {
    lastFetched: Date;
    data: Record<string, any>;
  };
}

export interface LocationSpecificData {
  cashClosures: any[];
  inventories: any[];
  equipment: any[];
  chats: any[];
  orders: any[];
  suppliers: any[];
  messages: any[];
}

interface LocationDataContextType {
  // Data for active location
  activeLocationData: LocationSpecificData;
  
  // Multi-location data
  getAllLocationData: (locationCodes: string[]) => Promise<Record<string, LocationSpecificData>>;
  getLocationData: (locationCode: string) => LocationSpecificData | null;
  
  // Prefetching and caching
  prefetchLocationData: (locationCode: string) => Promise<void>;
  invalidateLocationData: (locationCode?: string) => void;
  clearLocationCache: () => void;
  
  // Loading states
  isLoadingActiveLocation: boolean;
  activeLocationError: Error | null;
  
  // Cache management
  getCacheStats: () => { size: number; locations: string[] };
  getCacheStatus: (locationCode: string) => 'fresh' | 'stale' | 'missing';
}

const LocationDataContext = createContext<LocationDataContextType | undefined>(undefined);

interface LocationDataProviderProps {
  children: ReactNode;
}

export const LocationDataProvider: React.FC<LocationDataProviderProps> = ({ children }) => {
  const { activeLocation } = useLocationState();
  const { userLocationData } = useOptimizedLocationQueries();
  const queryClient = useQueryClient();

  // Get accessible location codes
  const accessibleLocations = userLocationData
    .filter(loc => loc.has_access)
    .map(loc => loc.location_code);

  // Load data for active location with aggressive caching
  const {
    data: activeLocationData = {
      cashClosures: [],
      inventories: [],
      equipment: [],
      chats: [],
      orders: [],
      suppliers: [],
      messages: []
    },
    isLoading: isLoadingActiveLocation,
    error: activeLocationError
  } = useQuery({
    queryKey: ['location-data', activeLocation],
    queryFn: async (): Promise<LocationSpecificData> => {
      if (!activeLocation) {
        return {
          cashClosures: [],
          inventories: [],
          equipment: [],
          chats: [],
          orders: [],
          suppliers: [],
          messages: []
        };
      }

      const startTime = performance.now();

      // Parallel fetch all location-specific data
      const [
        cashClosuresRes,
        inventoriesRes,
        equipmentRes,
        chatsRes,
        ordersRes,
        suppliersRes,
        messagesRes
      ] = await Promise.allSettled([
        supabase
          .from('cash_closures')
          .select('*')
          .eq('location', activeLocation)
          .order('created_at', { ascending: false })
          .limit(50),
        
        supabase
          .from('monthly_inventories')
          .select('*')
          .eq('location', activeLocation)
          .order('created_at', { ascending: false })
          .limit(20),
        
        supabase
          .from('equipment')
          .select('*')
          .eq('location', activeLocation)
          .order('created_at', { ascending: false }),
        
        supabase.rpc('get_user_chats_bulk', {
          target_user_id: (userLocationData.find(u => u.has_access)?.permissions as any)?.user_id || ''
        }),
        
        supabase
          .from('orders')
          .select('*')
          .eq('location', activeLocation)
          .order('created_at', { ascending: false })
          .limit(30),
        
        supabase
          .from('suppliers')
          .select('*')
          .eq('location', activeLocation)
          .order('name'),
        
        supabase
          .from('messages')
          .select('*')
          .eq('location', activeLocation)
          .order('created_at', { ascending: false })
          .limit(100)
      ]);

      const endTime = performance.now();
      console.log(`📊 Location data loaded for ${activeLocation} in ${(endTime - startTime).toFixed(2)}ms`);

      return {
        cashClosures: cashClosuresRes.status === 'fulfilled' ? (cashClosuresRes.value.data || []) : [],
        inventories: inventoriesRes.status === 'fulfilled' ? (inventoriesRes.value.data || []) : [],
        equipment: equipmentRes.status === 'fulfilled' ? (equipmentRes.value.data || []) : [],
        chats: chatsRes.status === 'fulfilled' ? 
          ((chatsRes.value.data || []) as any[]).filter((chat: any) => chat.location_code === activeLocation) : [],
        orders: ordersRes.status === 'fulfilled' ? (ordersRes.value.data || []) : [],
        suppliers: suppliersRes.status === 'fulfilled' ? (suppliersRes.value.data || []) : [],
        messages: messagesRes.status === 'fulfilled' ? (messagesRes.value.data || []) : [],
      };
    },
    enabled: !!activeLocation,
    staleTime: 1000 * 60 * 2, // 2 minutes - location data changes frequently
    gcTime: 1000 * 60 * 10, // 10 minutes cache time
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Parallel queries for multiple locations (used for prefetching)
  const useLocationQueries = (locationCodes: string[]) => {
    return useQueries({
      queries: locationCodes.map(locationCode => ({
        queryKey: ['location-data', locationCode],
        queryFn: async (): Promise<LocationSpecificData> => {
          // Reuse the same logic as activeLocationData but for specific location
          const startTime = performance.now();

          const [
            cashClosuresRes,
            inventoriesRes,
            equipmentRes,
            ordersRes,
            suppliersRes,
            messagesRes
          ] = await Promise.allSettled([
            supabase
              .from('cash_closures')
              .select('*')
              .eq('location', locationCode)
              .order('created_at', { ascending: false })
              .limit(50),
            
            supabase
              .from('monthly_inventories')
              .select('*')
              .eq('location', locationCode)
              .order('created_at', { ascending: false })
              .limit(20),
            
            supabase
              .from('equipment')
              .select('*')
              .eq('location', locationCode)
              .order('created_at', { ascending: false }),
            
            supabase
              .from('orders')
              .select('*')
              .eq('location', locationCode)
              .order('created_at', { ascending: false })
              .limit(30),
            
            supabase
              .from('suppliers')
              .select('*')
              .eq('location', locationCode)
              .order('name'),
            
            supabase
              .from('messages')
              .select('*')
              .eq('location', locationCode)
              .order('created_at', { ascending: false })
              .limit(100)
          ]);

          const endTime = performance.now();
          console.log(`📊 Prefetched data for ${locationCode} in ${(endTime - startTime).toFixed(2)}ms`);

          return {
            cashClosures: cashClosuresRes.status === 'fulfilled' ? (cashClosuresRes.value.data || []) : [],
            inventories: inventoriesRes.status === 'fulfilled' ? (inventoriesRes.value.data || []) : [],
            equipment: equipmentRes.status === 'fulfilled' ? (equipmentRes.value.data || []) : [],
            chats: [], // Chat data comes from bulk query
            orders: ordersRes.status === 'fulfilled' ? (ordersRes.value.data || []) : [],
            suppliers: suppliersRes.status === 'fulfilled' ? (suppliersRes.value.data || []) : [],
            messages: messagesRes.status === 'fulfilled' ? (messagesRes.value.data || []) : [],
          };
        },
        enabled: false, // Only fetch when explicitly requested
        staleTime: 1000 * 60 * 5, // 5 minutes for prefetched data
        gcTime: 1000 * 60 * 15, // 15 minutes cache time
      }))
    });
  };

  // Context methods
  const getAllLocationData = async (locationCodes: string[]): Promise<Record<string, LocationSpecificData>> => {
    const validCodes = locationCodes.filter(code => accessibleLocations.includes(code));
    const results: Record<string, LocationSpecificData> = {};

    await Promise.all(
      validCodes.map(async (locationCode) => {
        const data = await queryClient.fetchQuery({
          queryKey: ['location-data', locationCode],
          queryFn: async () => {
            // Use the same fetching logic as above
            const [
              cashClosuresRes,
              inventoriesRes,
              equipmentRes,
              ordersRes,
              suppliersRes,
              messagesRes
            ] = await Promise.allSettled([
              supabase.from('cash_closures').select('*').eq('location', locationCode).limit(50),
              supabase.from('monthly_inventories').select('*').eq('location', locationCode).limit(20),
              supabase.from('equipment').select('*').eq('location', locationCode),
              supabase.from('orders').select('*').eq('location', locationCode).limit(30),
              supabase.from('suppliers').select('*').eq('location', locationCode),
              supabase.from('messages').select('*').eq('location', locationCode).limit(100)
            ]);

            return {
              cashClosures: cashClosuresRes.status === 'fulfilled' ? (cashClosuresRes.value.data || []) : [],
              inventories: inventoriesRes.status === 'fulfilled' ? (inventoriesRes.value.data || []) : [],
              equipment: equipmentRes.status === 'fulfilled' ? (equipmentRes.value.data || []) : [],
              chats: [],
              orders: ordersRes.status === 'fulfilled' ? (ordersRes.value.data || []) : [],
              suppliers: suppliersRes.status === 'fulfilled' ? (suppliersRes.value.data || []) : [],
              messages: messagesRes.status === 'fulfilled' ? (messagesRes.value.data || []) : [],
            };
          },
          staleTime: 1000 * 60 * 5,
        });

        results[locationCode] = data;
      })
    );

    return results;
  };

  const getLocationData = (locationCode: string): LocationSpecificData | null => {
    return queryClient.getQueryData(['location-data', locationCode]) || null;
  };

  const prefetchLocationData = async (locationCode: string): Promise<void> => {
    if (!accessibleLocations.includes(locationCode)) return;

    await queryClient.prefetchQuery({
      queryKey: ['location-data', locationCode],
      queryFn: async () => getAllLocationData([locationCode]).then(data => data[locationCode]),
      staleTime: 1000 * 60 * 5,
    });
  };

  const invalidateLocationData = (locationCode?: string) => {
    if (locationCode) {
      queryClient.invalidateQueries({ queryKey: ['location-data', locationCode] });
    } else {
      queryClient.invalidateQueries({ 
        predicate: query => 
          query.queryKey[0] === 'location-data'
      });
    }
  };

  const clearLocationCache = () => {
    queryClient.removeQueries({ 
      predicate: query => 
        query.queryKey[0] === 'location-data'
    });
  };

  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const locationQueries = cache.findAll({ queryKey: ['location-data'] });
    
    return {
      size: locationQueries.length,
      locations: locationQueries.map(query => query.queryKey[1] as string).filter(Boolean)
    };
  };

  const getCacheStatus = (locationCode: string): 'fresh' | 'stale' | 'missing' => {
    const query = queryClient.getQueryState(['location-data', locationCode]);
    
    if (!query) return 'missing';
    
    // Check if the query is stale by comparing timestamps
    const now = Date.now();
    const staleTime = 1000 * 60 * 2; // 2 minutes
    const lastFetch = query.dataUpdatedAt || 0;
    
    if (now - lastFetch > staleTime) return 'stale';
    return 'fresh';
  };

  const value: LocationDataContextType = {
    activeLocationData,
    getAllLocationData,
    getLocationData,
    prefetchLocationData,
    invalidateLocationData,
    clearLocationCache,
    isLoadingActiveLocation,
    activeLocationError: activeLocationError as Error | null,
    getCacheStats,
    getCacheStatus,
  };

  return (
    <LocationDataContext.Provider value={value}>
      {children}
    </LocationDataContext.Provider>
  );
};

export const useLocationData = (): LocationDataContextType => {
  const context = useContext(LocationDataContext);
  if (!context) {
    throw new Error('useLocationData must be used within a LocationDataProvider');
  }
  return context;
};