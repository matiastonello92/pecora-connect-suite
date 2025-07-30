/**
 * Service Data Hook
 * Standardized data fetching pattern to replace useState/useEffect combinations
 */

import { useState, useEffect, useCallback } from 'react';
import { DataService } from '@/core/services/dataService';
import type { PaginationParams, PaginatedResponse } from '@/core/types';

interface UseServiceDataOptions<T> {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending: boolean };
  pagination?: PaginationParams;
  enabled?: boolean;
  refetchInterval?: number;
}

interface UseServiceDataResult<T> {
  data: T[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  total?: number;
  hasMore?: boolean;
}

export function useServiceData<T = any>(
  options: UseServiceDataOptions<T>
): UseServiceDataResult<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>();
  const [hasMore, setHasMore] = useState<boolean>();

  const fetchData = useCallback(async () => {
    if (!options.enabled && options.enabled !== undefined) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await DataService.query<T>(options.table, {
        select: options.select,
        filters: options.filters,
        orderBy: options.orderBy,
        pagination: options.pagination,
      });
      
      if (result.error) {
        setError(result.error.message || 'Failed to fetch data');
      } else {
        setData(result.data || []);
        
        // Handle pagination metadata if available
        if (options.pagination && result.data) {
          setTotal(result.data.length);
          setHasMore(result.data.length === options.pagination.limit);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [
    options.table,
    options.select,
    JSON.stringify(options.filters),
    JSON.stringify(options.orderBy),
    JSON.stringify(options.pagination),
    options.enabled,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refetch interval
  useEffect(() => {
    if (options.refetchInterval) {
      const interval = setInterval(fetchData, options.refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, options.refetchInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    total,
    hasMore,
  };
}

// Specialized hook for single item
export function useServiceItem<T = any>(table: string, id: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItem = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await DataService.findById<T>(table, id);
      
      if (result.error) {
        setError(result.error.message || 'Failed to fetch item');
      } else {
        setData(result.data);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [table, id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  return {
    data,
    loading,
    error,
    refetch: fetchItem,
  };
}