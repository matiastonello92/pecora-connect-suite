import { useState, useEffect, useCallback } from 'react';

interface AsyncDataOptions {
  immediate?: boolean;
  dependencies?: any[];
}

/**
 * Hook generico per fetching dati con stati loading/error
 * Elimina duplicazione di logica di data fetching tra componenti
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  options: AsyncDataOptions = {}
) {
  const { immediate = true, dependencies = [] } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetcher();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('useAsyncData error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData, ...dependencies]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData,
    reset: () => {
      setData(null);
      setError(null);
      setLoading(false);
    }
  };
}