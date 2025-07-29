import { useQuery, useQueries, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useQueryTimer, usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useCallback, useMemo } from 'react';

interface OptimizedQueryConfig {
  batchSize?: number;
  maxConcurrent?: number;
  enableVirtualization?: boolean;
  cacheTimeout?: number;
}

const DEFAULT_CONFIG: OptimizedQueryConfig = {
  batchSize: 100,
  maxConcurrent: 5,
  enableVirtualization: true,
  cacheTimeout: 300000, // 5 minutes
};

/**
 * Optimized query hook for handling large datasets (10,000+ locations)
 */
export const useOptimizedLocationQueries = (config: OptimizedQueryConfig = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const startQueryTimer = useQueryTimer();
  const { recordMetric } = usePerformanceMonitoring();

  // Virtualized location loading with pagination
  const useVirtualizedLocations = useCallback((
    page: number = 0,
    pageSize: number = finalConfig.batchSize || 100
  ) => {
    return useQuery({
      queryKey: ['virtualized-locations', page, pageSize],
      queryFn: async () => {
        const endTimer = startQueryTimer('virtualized_locations_query');
        
        try {
          const { data, error, count } = await supabase
            .from('locations')
            .select('*', { count: 'exact' })
            .eq('is_active', true)
            .order('name')
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (error) throw error;

          const duration = endTimer?.({
            page,
            pageSize,
            resultCount: data?.length || 0,
            totalCount: count || 0,
          }) || 0;

          // Record performance metrics
          recordMetric('query_result_size', data?.length || 0, 'location_query');
          
          if (duration > 200) {
            recordMetric('slow_query_detected', duration, 'location_query', undefined, {
              queryType: 'virtualized_locations',
              page,
              pageSize,
            });
          }

          return {
            data: data || [],
            totalCount: count || 0,
            hasMore: (page + 1) * pageSize < (count || 0),
            duration,
          };
        } catch (error) {
          endTimer?.({ error: true });
          recordMetric('query_error', 1, 'location_query');
          throw error;
        }
      },
      staleTime: finalConfig.cacheTimeout,
      gcTime: finalConfig.cacheTimeout * 2,
      enabled: finalConfig.enableVirtualization,
    });
  }, [startQueryTimer, recordMetric, finalConfig]);

  // Batch location data queries
  const useBatchLocationData = useCallback((locationIds: string[]) => {
    const batches = useMemo(() => {
      const batchSize = finalConfig.batchSize || 100;
      const result = [];
      for (let i = 0; i < locationIds.length; i += batchSize) {
        result.push(locationIds.slice(i, i + batchSize));
      }
      return result;
    }, [locationIds, finalConfig.batchSize]);

    return useQueries({
      queries: batches.map((batch, index) => ({
        queryKey: ['batch-location-data', batch.join(','), index],
        queryFn: async () => {
          const endTimer = startQueryTimer('batch_location_data_query');
          
          try {
            // Parallel queries for different data types
            const [cashData, inventoryData, equipmentData] = await Promise.all([
              supabase
                .from('cash_closures')
                .select('location, closing_amount, date')
                .in('location', batch)
                .order('date', { ascending: false })
                .limit(10),
              
              supabase
                .from('monthly_inventories')
                .select('location, total_value, status')
                .in('location', batch)
                .order('created_at', { ascending: false })
                .limit(10),
              
              supabase
                .from('equipment')
                .select('location, status, name')
                .in('location', batch)
                .eq('status', 'operational')
                .limit(20),
            ]);

            const duration = endTimer?.({
              batchSize: batch.length,
              batchIndex: index,
            }) || 0;

            recordMetric('batch_query_duration', duration, 'batch_location_data');
            
            if (duration > 500) {
              recordMetric('batch_query_slow', duration, 'batch_location_data', undefined, {
                batchSize: batch.length,
                batchIndex: index,
              });
            }

            return {
              locations: batch,
              cashClosures: cashData.data || [],
              inventories: inventoryData.data || [],
              equipment: equipmentData.data || [],
              duration,
            };
          } catch (error) {
            endTimer?.({ error: true });
            recordMetric('batch_query_error', 1, 'batch_location_data');
            throw error;
          }
        },
        staleTime: finalConfig.cacheTimeout,
        gcTime: finalConfig.cacheTimeout * 2,
      }))
    });
  }, [startQueryTimer, recordMetric, finalConfig]);

  // Optimized single location query with caching
  const useOptimizedLocationData = useCallback((locationId: string | null) => {
    return useQuery({
      queryKey: ['optimized-location-data', locationId],
      queryFn: async () => {
        if (!locationId) return null;
        
        const endTimer = startQueryTimer('single_location_query', locationId);
        
        try {
          // Use optimized location data query
          const { data, error } = await supabase
            .rpc('get_user_location_data', {
              target_user_id: (await supabase.auth.getUser()).data.user?.id,
              location_codes: [locationId],
            });

          if (error) throw error;

          const duration = endTimer?.({ locationId }) || 0;
          
          recordMetric('single_location_query_duration', duration, 'single_location_data', locationId);
          
          if (duration > 200) {
            recordMetric('single_location_query_slow', duration, 'single_location_data', locationId);
          }

          return data;
        } catch (error) {
          endTimer?.({ error: true });
          recordMetric('single_location_query_error', 1, 'single_location_data', locationId);
          throw error;
        }
      },
      enabled: !!locationId,
      staleTime: finalConfig.cacheTimeout / 2, // Shorter cache for active location
      gcTime: finalConfig.cacheTimeout,
    });
  }, [startQueryTimer, recordMetric, finalConfig]);

  // Real-time subscription with latency monitoring
  const useRealtimeLocationUpdates = useCallback((locationId: string | null) => {
    const { recordMetric: recordRealtimeMetric } = usePerformanceMonitoring();
    
    return useQuery({
      queryKey: ['realtime-location-updates', locationId],
      queryFn: async () => {
        if (!locationId) return null;
        
        const subscriptionStart = performance.now();
        
        return new Promise((resolve) => {
          const channel = supabase
            .channel(`location-${locationId}`)
            .on('postgres_changes', 
              { 
                event: '*', 
                schema: 'public', 
                filter: `location=eq.${locationId}` 
              }, 
              (payload) => {
                const latency = performance.now() - subscriptionStart;
                
                recordRealtimeMetric('realtime_latency', latency, 'realtime_subscription', locationId, {
                  eventType: payload.eventType,
                  table: payload.table,
                });
                
                if (latency > 150) {
                  recordRealtimeMetric('realtime_slow', latency, 'realtime_subscription', locationId);
                }
                
                resolve(payload);
              }
            )
            .subscribe();

          // Cleanup function
          return () => {
            supabase.removeChannel(channel);
          };
        });
      },
      enabled: !!locationId,
      staleTime: Infinity, // Real-time data doesn't get stale
    });
  }, [recordMetric]);

  return {
    useVirtualizedLocations,
    useBatchLocationData,
    useOptimizedLocationData,
    useRealtimeLocationUpdates,
    config: finalConfig,
  };
};

/**
 * Performance-optimized query invalidation
 */
export const useSmartQueryInvalidation = () => {
  const { recordMetric } = usePerformanceMonitoring();
  
  return useCallback(async (pattern: string) => {
    const startTime = performance.now();
    
    try {
      // Implement smart invalidation logic here
      // This would invalidate only related queries, not everything
      
      const duration = performance.now() - startTime;
      recordMetric('query_invalidation_duration', duration, 'cache_management');
      
      if (duration > 50) {
        recordMetric('query_invalidation_slow', duration, 'cache_management', undefined, {
          pattern,
        });
      }
    } catch (error) {
      recordMetric('query_invalidation_error', 1, 'cache_management');
      throw error;
    }
  }, [recordMetric]);
};