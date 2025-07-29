import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useLocationSwitchTimer, usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useActiveLocations } from '@/hooks/useLocations';

interface EnhancedLocationStateContextType {
  activeLocation: string | null;
  setActiveLocation: (location: string) => Promise<void>;
  isLocationSwitching: boolean;
  switchHistory: Array<{ from: string | null; to: string; timestamp: number; duration?: number }>;
  canSwitchLocations: boolean;
  lastSwitchDuration: number | null;
}

const EnhancedLocationStateContext = createContext<EnhancedLocationStateContextType | undefined>(undefined);

export const EnhancedLocationStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeLocation, setActiveLocationState] = useState<string | null>(null);
  const [isLocationSwitching, setIsLocationSwitching] = useState(false);
  const [switchHistory, setSwitchHistory] = useState<Array<{ from: string | null; to: string; timestamp: number; duration?: number }>>([]);
  const [lastSwitchDuration, setLastSwitchDuration] = useState<number | null>(null);
  
  const { data: locations } = useActiveLocations();
  const startLocationSwitch = useLocationSwitchTimer();
  const { recordMetric } = usePerformanceMonitoring();
  
  const switchTimerRef = useRef<(() => number | null) | null>(null);

  const canSwitchLocations = React.useMemo(() => {
    return !isLocationSwitching && !!locations && locations.length > 1;
  }, [isLocationSwitching, locations]);

  const setActiveLocation = useCallback(async (newLocation: string) => {
    if (isLocationSwitching || newLocation === activeLocation) return;
    
    const fromLocation = activeLocation;
    setIsLocationSwitching(true);
    
    // Start performance timer
    switchTimerRef.current = startLocationSwitch(fromLocation || undefined, newLocation);
    
    // Record switch start
    const switchRecord = {
      from: fromLocation,
      to: newLocation,
      timestamp: performance.now(),
    };
    
    try {
      // Simulate async location switching logic
      await new Promise(resolve => {
        // Use requestIdleCallback for better performance
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(() => {
            setActiveLocationState(newLocation);
            resolve(void 0);
          });
        } else {
          setTimeout(() => {
            setActiveLocationState(newLocation);
            resolve(void 0);
          }, 0);
        }
      });
      
      // End performance timer
      const duration = switchTimerRef.current?.() || null;
      setLastSwitchDuration(duration);
      
      // Update switch history
      setSwitchHistory(prev => {
        const newHistory = [...prev, { ...switchRecord, duration: duration || undefined }];
        // Keep only last 50 switches
        return newHistory.slice(-50);
      });
      
      // Record additional metrics
      if (duration) {
        recordMetric('location_switch_success', 1, 'navigation', newLocation);
        
        // Check if switch was fast enough
        if (duration > 100) {
          recordMetric('location_switch_slow', 1, 'navigation', newLocation, {
            duration,
            fromLocation,
            toLocation: newLocation,
          });
        }
      }
      
    } catch (error) {
      console.error('Location switch failed:', error);
      recordMetric('location_switch_error', 1, 'navigation', newLocation);
    } finally {
      setIsLocationSwitching(false);
      switchTimerRef.current = null;
    }
  }, [activeLocation, isLocationSwitching, startLocationSwitch, recordMetric]);

  // Monitor overall switching performance
  useEffect(() => {
    if (switchHistory.length >= 10) {
      const recentSwitches = switchHistory.slice(-10);
      const avgDuration = recentSwitches
        .filter(s => s.duration !== undefined)
        .reduce((sum, s) => sum + (s.duration || 0), 0) / recentSwitches.length;
      
      recordMetric('location_switch_avg_10', avgDuration, 'navigation_analytics');
      
      // Alert if average switching time is degrading
      if (avgDuration > 150) {
        recordMetric('location_switch_degradation', avgDuration, 'navigation_alerts');
      }
    }
  }, [switchHistory, recordMetric]);

  const value: EnhancedLocationStateContextType = {
    activeLocation,
    setActiveLocation,
    isLocationSwitching,
    switchHistory,
    canSwitchLocations,
    lastSwitchDuration,
  };

  return (
    <EnhancedLocationStateContext.Provider value={value}>
      {children}
    </EnhancedLocationStateContext.Provider>
  );
};

export const useEnhancedLocationState = (): EnhancedLocationStateContextType => {
  const context = useContext(EnhancedLocationStateContext);
  if (!context) {
    throw new Error('useEnhancedLocationState must be used within an EnhancedLocationStateProvider');
  }
  return context;
};
