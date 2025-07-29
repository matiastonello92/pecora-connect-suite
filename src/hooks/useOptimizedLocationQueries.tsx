import { useQuery, useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleAuth } from '@/context/SimpleAuthContext';

/**
 * Optimized hook that eliminates N+1 patterns by using bulk fetching functions
 * Replaces individual location queries with single bulk operations
 */
export const useOptimizedLocationQueries = () => {
  const { user } = useSimpleAuth();

  // Bulk fetch user's location access data
  const { data: userLocationData } = useQuery({
    queryKey: ['user-location-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase.rpc('get_user_location_data', {
        target_user_id: user.id,
        location_codes: null // Get all locations
      });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Bulk fetch location-aware data counts for dashboard
  const { data: locationStats } = useQuery({
    queryKey: ['location-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      
      const tables = ['cash_closures', 'monthly_inventories', 'equipment'];
      const results = await Promise.all(
        tables.map(async (table) => {
          const { data, error } = await supabase.rpc('get_location_aware_data', {
            target_user_id: user.id,
            table_name: table,
            location_codes: null,
            date_filter: null,
            status_filter: null
          });
          
          if (error) throw error;
          return { table, data: data || [] };
        })
      );
      
      return results.reduce((acc, { table, data }) => {
        acc[table] = data;
        return acc;
      }, {} as Record<string, any[]>);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Optimized chat data with bulk loading
  const { data: userChats } = useQuery({
    queryKey: ['user-chats-bulk', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase.rpc('get_user_chats_bulk', {
        target_user_id: user.id
      });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30, // 30 seconds for real-time feel
  });

  // Batch location validation
  const validateLocations = async (locationCodes: string[]) => {
    if (!user?.id) return [];
    
    const { data, error } = await supabase.rpc('validate_user_locations_batch', {
      target_user_id: user.id,
      location_codes: locationCodes
    });
    
    if (error) throw error;
    return data || [];
  };

  // Optimized location access check
  const checkLocationAccess = async (locationCode: string) => {
    if (!user?.id) return false;
    
    const { data, error } = await supabase.rpc('user_has_location_access_optimized', {
      target_user_id: user.id,
      location_code: locationCode
    });
    
    if (error) throw error;
    return data || false;
  };

  return {
    userLocationData: userLocationData || [],
    locationStats: locationStats || {},
    userChats: userChats || [],
    validateLocations,
    checkLocationAccess,
    
    // Helper functions for common operations
    getUserAccessibleLocations: () => 
      (userLocationData || []).filter(loc => loc.has_access).map(loc => loc.location_code),
    
    getLocationPermissions: (locationCode: string) =>
      (userLocationData || []).find(loc => loc.location_code === locationCode)?.permissions,
    
    getTotalUnreadMessages: () =>
      (userChats || []).reduce((total, chat) => total + (chat.unread_count || 0), 0),
    
    getChatsByLocation: (locationCode: string) =>
      (userChats || []).filter(chat => chat.location_code === locationCode),
  };
};

/**
 * Hook for optimized location-specific data fetching with filters
 * Uses indexed queries and bulk operations for maximum performance
 */
export const useLocationSpecificData = (
  tableName: string,
  locationCodes?: string[],
  filters?: {
    dateFilter?: Date;
    statusFilter?: string;
  }
) => {
  const { user } = useSimpleAuth();

  return useQuery({
    queryKey: ['location-specific-data', tableName, locationCodes, filters, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase.rpc('get_location_aware_data', {
        target_user_id: user.id,
        table_name: tableName,
        location_codes: locationCodes || null,
        date_filter: filters?.dateFilter?.toISOString().split('T')[0] || null,
        status_filter: filters?.statusFilter || null
      });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!tableName,
    staleTime: 1000 * 60 * 1, // 1 minute for filtered data
  });
};

/**
 * Hook for parallel location data fetching
 * Eliminates sequential queries by fetching multiple location datasets simultaneously
 */
export const useParallelLocationData = (locationCodes: string[]) => {
  const { user } = useSimpleAuth();

  const queries = useQueries({
    queries: locationCodes.map(locationCode => ({
      queryKey: ['location-data', locationCode, user?.id],
      queryFn: async () => {
        if (!user?.id) return null;
        
        // Use the optimized bulk function for each location
        const { data, error } = await supabase.rpc('get_user_location_data', {
          target_user_id: user.id,
          location_codes: [locationCode]
        });
        
        if (error) throw error;
        return { locationCode, data: data?.[0] || null };
      },
      enabled: !!user?.id,
      staleTime: 1000 * 60 * 5,
    }))
  });

  return {
    isLoading: queries.some(query => query.isLoading),
    isError: queries.some(query => query.isError),
    data: queries.reduce((acc, query) => {
      if (query.data) {
        acc[query.data.locationCode] = query.data.data;
      }
      return acc;
    }, {} as Record<string, any>),
  };
};

/**
 * Performance monitoring hook for location queries
 * Tracks query performance and identifies bottlenecks
 */
export const useLocationQueryPerformance = () => {
  const startTime = performance.now();
  
  return {
    measureQuery: (queryName: string) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 1000) {
        console.warn(`Slow location query detected: ${queryName} took ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    },
    
    logPerformance: (queryName: string, recordCount: number) => {
      const duration = performance.now() - startTime;
      console.log(`📊 Query Performance: ${queryName} - ${recordCount} records in ${duration.toFixed(2)}ms`);
    }
  };
};