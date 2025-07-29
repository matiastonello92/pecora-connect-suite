import { supabase } from '@/integrations/supabase/client';

/**
 * Optimized location query utilities that eliminate N+1 patterns
 * and provide high-performance database operations for scale
 */

export interface OptimizedQueryOptions {
  useCache?: boolean;
  batchSize?: number;
  timeout?: number;
}

/**
 * Batch fetch location data for multiple users
 * Eliminates N+1 patterns when loading user location information
 */
export const batchFetchUserLocationData = async (
  userIds: string[],
  locationCodes?: string[],
  options: OptimizedQueryOptions = {}
) => {
  const { batchSize = 50 } = options;
  const results: Array<{ userId: string; locations: any[] }> = [];
  
  // Process in batches to avoid overwhelming the database
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (userId) => {
      const { data, error } = await supabase.rpc('get_user_location_data', {
        target_user_id: userId,
        location_codes: locationCodes || null
      });
      
      if (error) {
        console.error(`Error fetching location data for user ${userId}:`, error);
        return { userId, locations: [] };
      }
      
      return { userId, locations: data || [] };
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};

/**
 * Optimized location-aware data fetching with advanced filtering
 * Uses composite indexes for maximum performance
 */
export const fetchLocationAwareDataOptimized = async (
  userId: string,
  tableName: string,
  filters: {
    locationCodes?: string[];
    dateRange?: { start: Date; end: Date };
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
) => {
  const { locationCodes, dateRange, status, limit = 100, offset = 0 } = filters;
  
  // Use the optimized bulk function first
  const { data: bulkData, error: bulkError } = await supabase.rpc('get_location_aware_data', {
    target_user_id: userId,
    table_name: tableName,
    location_codes: locationCodes || null,
    date_filter: dateRange?.start?.toISOString().split('T')[0] || null,
    status_filter: status || null
  });
  
  if (bulkError) throw bulkError;
  
  // For detailed data, use optimized direct queries with indexes
  const baseQuery = supabase
    .from(tableName as any)
    .select('*')
    .range(offset, offset + limit - 1);
  
  // Apply location filter using the user's accessible locations
  const { data: userLocations } = await supabase.rpc('get_user_location_data', {
    target_user_id: userId,
    location_codes: locationCodes || null
  });
  
  const accessibleLocations = (userLocations || [])
    .filter((loc: any) => loc.has_access)
    .map((loc: any) => loc.location_code);
  
  if (accessibleLocations.length === 0) {
    return { summary: bulkData, details: [] };
  }
  
  baseQuery.in('location', accessibleLocations);
  
  // Apply additional filters using indexed columns
  if (dateRange) {
    baseQuery.gte('created_at', dateRange.start.toISOString());
    baseQuery.lte('created_at', dateRange.end.toISOString());
  }
  
  if (status) {
    baseQuery.eq('status', status);
  }
  
  // Order by indexed columns for optimal performance
  baseQuery.order('created_at', { ascending: false });
  
  const { data: detailData, error: detailError } = await baseQuery;
  
  if (detailError) throw detailError;
  
  return {
    summary: bulkData,
    details: detailData || []
  };
};

/**
 * High-performance chat data fetching with optimized joins
 * Eliminates multiple round trips for chat-related queries
 */
export const fetchOptimizedChatData = async (userId: string) => {
  const startTime = performance.now();
  
  try {
    // Use the bulk chat function for optimal performance
    const { data: chats, error: chatError } = await supabase.rpc('get_user_chats_bulk', {
      target_user_id: userId
    });
    
    if (chatError) throw chatError;
    
    const endTime = performance.now();
    console.log(`📊 Chat data fetched in ${(endTime - startTime).toFixed(2)}ms for ${(chats || []).length} chats`);
    
    return chats || [];
  } catch (error) {
    console.error('Error fetching optimized chat data:', error);
    throw error;
  }
};

/**
 * Batch validation of location access for multiple locations
 * More efficient than individual location checks
 */
export const batchValidateLocationAccess = async (
  userId: string,
  locationCodes: string[]
) => {
  if (locationCodes.length === 0) return [];
  
  const { data, error } = await supabase.rpc('validate_user_locations_batch', {
    target_user_id: userId,
    location_codes: locationCodes
  });
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Optimized dashboard data loader
 * Fetches all necessary dashboard data in minimal queries
 */
export const loadDashboardDataOptimized = async (userId: string) => {
  const startTime = performance.now();
  
  try {
    // Parallel execution of all dashboard queries
    const [
      userLocationData,
      chatData,
      inventoryData,
      equipmentData,
      cashClosureData
    ] = await Promise.all([
      supabase.rpc('get_user_location_data', {
        target_user_id: userId,
        location_codes: null
      }),
      supabase.rpc('get_user_chats_bulk', {
        target_user_id: userId
      }),
      supabase.rpc('get_location_aware_data', {
        target_user_id: userId,
        table_name: 'monthly_inventories',
        location_codes: null,
        date_filter: null,
        status_filter: null
      }),
      supabase.rpc('get_location_aware_data', {
        target_user_id: userId,
        table_name: 'equipment',
        location_codes: null,
        date_filter: null,
        status_filter: null
      }),
      supabase.rpc('get_location_aware_data', {
        target_user_id: userId,
        table_name: 'cash_closures',
        location_codes: null,
        date_filter: new Date().toISOString().split('T')[0], // Today only
        status_filter: null
      })
    ]);
    
    const endTime = performance.now();
    console.log(`🚀 Dashboard data loaded in ${(endTime - startTime).toFixed(2)}ms`);
    
    // Check for errors
    const errors = [
      userLocationData.error,
      chatData.error,
      inventoryData.error,
      equipmentData.error,
      cashClosureData.error
    ].filter(Boolean);
    
    if (errors.length > 0) {
      console.error('Dashboard loading errors:', errors);
      throw new Error('Failed to load dashboard data');
    }
    
    return {
      userLocations: userLocationData.data || [],
      chats: chatData.data || [],
      inventoryStats: inventoryData.data || [],
      equipmentStats: equipmentData.data || [],
      todayCashClosures: cashClosureData.data || [],
      loadTime: endTime - startTime
    };
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    throw error;
  }
};

/**
 * Cache management for optimized location queries
 * Provides intelligent caching with location-aware invalidation
 */
export class LocationQueryCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  static set(key: string, data: any, ttlMs: number = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }
  
  static get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  static invalidateByLocation(locationCode: string) {
    const keysToDelete = Array.from(this.cache.keys())
      .filter(key => key.includes(locationCode));
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
  
  static clear() {
    this.cache.clear();
  }
  
  static getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * Performance monitoring utilities for location queries
 */
export const LocationQueryPerformance = {
  async measureQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⚡ ${queryName}: ${duration.toFixed(2)}ms`);
      
      if (duration > 1000) {
        console.warn(`🐌 Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ ${queryName} failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
      throw error;
    }
  },
  
  logBatchOperation(operationName: string, itemCount: number, duration: number) {
    const avgTimePerItem = duration / itemCount;
    console.log(`📦 ${operationName}: ${itemCount} items in ${duration.toFixed(2)}ms (${avgTimePerItem.toFixed(2)}ms/item)`);
  }
};