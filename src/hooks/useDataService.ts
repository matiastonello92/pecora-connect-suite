/**
 * Data Service Hook
 * Standardizes data fetching patterns and eliminates useEffect/useState duplications
 * Phase 3: Business Logic Separation
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataService } from '@/core/services';
import { useToast } from '@/hooks/use-toast';

export interface UseDataServiceOptions<T> {
  table: string;
  queryKey?: string[];
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending: boolean };
  onSuccess?: (data: T[]) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

export function useDataService<T = any>(options: UseDataServiceOptions<T>) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = options.queryKey || [options.table, options.filters];

  // Read operation with React Query (v5 compatible)
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await DataService.query<T>(options.table, {
        filters: options.filters,
        orderBy: options.orderBy
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to fetch data');
      }
      
      return data || [];
    },
    enabled: options.enabled !== false
  });

  // Create operation
  const createMutation = useMutation({
    mutationFn: async (newItem: Partial<T>) => {
      const { data, error } = await DataService.insert<T>(options.table, newItem);
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: 'Success',
        description: 'Item created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create item',
        variant: 'destructive'
      });
    }
  });

  // Update operation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<T> }) => {
      const { data, error } = await DataService.update<T>(options.table, id, updates);
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: 'Success',
        description: 'Item updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update item',
        variant: 'destructive'
      });
    }
  });

  // Delete operation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await DataService.delete(options.table, id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: 'Success',
        description: 'Item deleted successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete item',
        variant: 'destructive'
      });
    }
  });

  const create = useCallback((item: Partial<T>) => {
    return createMutation.mutateAsync(item);
  }, [createMutation]);

  const update = useCallback((id: string, updates: Partial<T>) => {
    return updateMutation.mutateAsync({ id, updates });
  }, [updateMutation]);

  const remove = useCallback((id: string) => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const refresh = useCallback(() => {
    return refetch();
  }, [refetch]);

  return {
    // Data
    data: data || [],
    isLoading,
    error,
    
    // Actions
    create,
    update,
    remove,
    refresh,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Utilities
    invalidate: () => queryClient.invalidateQueries({ queryKey })
  };
}