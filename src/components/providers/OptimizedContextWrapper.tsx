import React, { memo, useMemo, useCallback } from 'react';
import { UnreadMessagesProvider } from '@/context/UnreadMessagesContext';
import { CommunicationProvider } from '@/context/CommunicationProvider';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

// Memoized context providers to prevent unnecessary re-renders
const MemoizedUnreadMessagesProvider = memo<{ children: React.ReactNode }>(
  ({ children }) => <UnreadMessagesProvider>{children}</UnreadMessagesProvider>
);
MemoizedUnreadMessagesProvider.displayName = 'MemoizedUnreadMessagesProvider';

const MemoizedCommunicationProvider = memo<{ children: React.ReactNode }>(
  ({ children }) => <CommunicationProvider>{children}</CommunicationProvider>
);
MemoizedCommunicationProvider.displayName = 'MemoizedCommunicationProvider';

// Optimized context wrapper component
export const OptimizedContextWrapper = memo<{ children: React.ReactNode }>(
  ({ children }) => {
    // Monitor performance for this wrapper
    const { recordMetric } = usePerformanceMonitoring();
    
    React.useEffect(() => {
      const startTime = performance.now();
      return () => {
        const endTime = performance.now();
        recordMetric('component_render_time', endTime - startTime, 'OptimizedContextWrapper');
      };
    });

    return (
      <MemoizedUnreadMessagesProvider>
        <MemoizedCommunicationProvider>
          {children}
        </MemoizedCommunicationProvider>
      </MemoizedUnreadMessagesProvider>
    );
  }
);

OptimizedContextWrapper.displayName = 'OptimizedContextWrapper';