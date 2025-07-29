import { useCallback, useMemo } from 'react';

/**
 * Debounce function to limit the rate of function execution
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const debouncedCallback = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(...args), delay);
    }) as T;
  }, [callback, delay]);

  return debouncedCallback;
};

/**
 * Throttle function to limit function execution to once per interval
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const throttledCallback = useMemo(() => {
    let lastRun = 0;
    
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun >= delay) {
        lastRun = now;
        return callback(...args);
      }
    }) as T;
  }, [callback, delay]);

  return throttledCallback;
};

/**
 * Request deduplication to prevent multiple identical requests
 */
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear() {
    this.pendingRequests.clear();
  }
}

export const requestDeduplicator = new RequestDeduplicator();

/**
 * Memoized selector hook for complex state selection
 */
export const useSelector = <T, R>(
  data: T,
  selector: (data: T) => R,
  deps: React.DependencyList = []
): R => {
  return useMemo(() => selector(data), [data, ...deps]);
};