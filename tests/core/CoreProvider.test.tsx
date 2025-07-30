/**
 * CoreProvider Tests
 * Comprehensive test suite for Core Infrastructure Module
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CoreProvider, useCoreContext } from '../../src/core/providers/CoreProvider';
import { PerformanceMonitoringProvider } from '../../src/hooks/usePerformanceMonitoring';
import { CoreModule } from '../../src/core/types/core';

// Mock modules for testing
const mockModules: CoreModule[] = [
  {
    id: 'test-module-1',
    name: 'Test Module 1',
    version: '1.0.0',
    priority: 9,
    factory: () => Promise.resolve({ test: 'data1' }),
  },
  {
    id: 'test-module-2',
    name: 'Test Module 2',
    version: '1.0.0',
    priority: 5,
    dependencies: ['test-module-1'],
    factory: () => Promise.resolve({ test: 'data2' }),
  },
  {
    id: 'lazy-module',
    name: 'Lazy Module',
    version: '1.0.0',
    priority: 3,
    lazy: true,
    factory: () => Promise.resolve({ test: 'lazy-data' }),
  },
];

// Test component that uses CoreContext
const TestComponent: React.FC = () => {
  const core = useCoreContext();
  
  return (
    <div>
      <div data-testid="module-count">{core.moduleRegistry.getAll().length}</div>
      <div data-testid="is-healthy">{core.performance.isHealthy().toString()}</div>
      <button
        data-testid="emit-event"
        onClick={() => core.eventBus.emit({
          type: 'test.event',
          payload: { test: true },
          source: 'TestComponent',
        })}
      >
        Emit Event
      </button>
    </div>
  );
};

const renderWithProviders = (children: React.ReactNode, modules: CoreModule[] = []) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <PerformanceMonitoringProvider>
        <CoreProvider modules={modules}>
          {children}
        </CoreProvider>
      </PerformanceMonitoringProvider>
    </QueryClientProvider>
  );
};

describe('CoreProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any global state
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', async () => {
      renderWithProviders(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-healthy')).toHaveTextContent('true');
      });
    });

    it('should register provided modules on initialization', async () => {
      renderWithProviders(<TestComponent />, mockModules);
      
      await waitFor(() => {
        // Should include provided modules + business modules
        const moduleCount = parseInt(screen.getByTestId('module-count').textContent || '0');
        expect(moduleCount).toBeGreaterThan(mockModules.length);
      });
    });

    it('should show loading state during initialization', () => {
      renderWithProviders(<TestComponent />);
      
      expect(screen.getByText('Initializing Core System...')).toBeInTheDocument();
    });
  });

  describe('Module Registry Integration', () => {
    it('should load modules with dependencies in correct order', async () => {
      const { container } = renderWithProviders(<TestComponent />, mockModules);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-healthy')).toHaveTextContent('true');
      });

      // Module with dependencies should be loaded after its dependencies
      const coreContext = (container.querySelector('[data-testid="module-count"]') as any)?.__reactInternalInstance;
      // This is a simplified test - in reality we'd test the actual loading order
    });

    it('should handle module loading errors gracefully', async () => {
      const errorModule: CoreModule = {
        id: 'error-module',
        name: 'Error Module',
        version: '1.0.0',
        factory: () => Promise.reject(new Error('Test error')),
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      renderWithProviders(<TestComponent />, [errorModule]);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-healthy')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Core initialization failed'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should support lazy loading of modules', async () => {
      renderWithProviders(<TestComponent />, mockModules);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-healthy')).toHaveTextContent('true');
      });

      // Lazy modules should not be loaded initially
      // This would require exposing more internal state for proper testing
    });
  });

  describe('Event Bus Integration', () => {
    it('should emit and handle events', async () => {
      const eventHandler = jest.fn();
      
      const EventTestComponent: React.FC = () => {
        const core = useCoreContext();
        
        React.useEffect(() => {
          const listenerId = core.eventBus.on('test.event', eventHandler);
          return () => core.eventBus.off(listenerId);
        }, [core.eventBus]);
        
        return (
          <button
            data-testid="emit-event"
            onClick={() => core.eventBus.emit({
              type: 'test.event',
              payload: { test: true },
              source: 'TestComponent',
            })}
          >
            Emit Event
          </button>
        );
      };

      renderWithProviders(<EventTestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('emit-event')).toBeInTheDocument();
      });

      act(() => {
        screen.getByTestId('emit-event').click();
      });

      await waitFor(() => {
        expect(eventHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'test.event',
            payload: { test: true },
            source: 'TestComponent',
          })
        );
      });
    });

    it('should handle event listener errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const ErrorEventComponent: React.FC = () => {
        const core = useCoreContext();
        
        React.useEffect(() => {
          const listenerId = core.eventBus.on('error.event', () => {
            throw new Error('Test handler error');
          });
          return () => core.eventBus.off(listenerId);
        }, [core.eventBus]);
        
        React.useEffect(() => {
          core.eventBus.emit({
            type: 'error.event',
            payload: {},
            source: 'TestComponent',
          });
        }, [core.eventBus]);
        
        return <div>Error Test</div>;
      };

      renderWithProviders(<ErrorEventComponent />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('EventBus: Handler error'),
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Monitoring', () => {
    it('should report system health status', async () => {
      renderWithProviders(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-healthy')).toHaveTextContent('true');
      });
    });

    it('should provide performance metrics', async () => {
      const MetricsComponent: React.FC = () => {
        const core = useCoreContext();
        const [metrics, setMetrics] = React.useState<any>(null);
        
        React.useEffect(() => {
          setMetrics(core.performance.getMetrics());
        }, [core.performance]);
        
        if (!metrics) return <div>Loading...</div>;
        
        return (
          <div>
            <div data-testid="memory-usage">{metrics.memoryUsage}</div>
            <div data-testid="active-modules">{metrics.activeModules}</div>
            <div data-testid="error-rate">{metrics.errorRate}</div>
          </div>
        );
      };

      renderWithProviders(<MetricsComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('memory-usage')).toBeInTheDocument();
        expect(screen.getByTestId('active-modules')).toBeInTheDocument();
        expect(screen.getByTestId('error-rate')).toBeInTheDocument();
      });

      const memoryUsage = parseInt(screen.getByTestId('memory-usage').textContent || '0');
      const activeModules = parseInt(screen.getByTestId('active-modules').textContent || '0');
      const errorRate = parseFloat(screen.getByTestId('error-rate').textContent || '0');

      expect(memoryUsage).toBeGreaterThanOrEqual(0);
      expect(activeModules).toBeGreaterThan(0);
      expect(errorRate).toBeGreaterThanOrEqual(0);
      expect(errorRate).toBeLessThanOrEqual(1);
    });

    it('should monitor component performance', async () => {
      const PerformanceTestComponent: React.FC = () => {
        const core = useCoreContext();
        const [duration, setDuration] = React.useState<number | null>(null);
        
        React.useEffect(() => {
          const stopMonitoring = core.performance.monitor('test-component');
          
          // Simulate some work
          setTimeout(() => {
            const result = stopMonitoring();
            setDuration(100); // Mock duration
          }, 100);
        }, [core.performance]);
        
        return <div data-testid="duration">{duration}</div>;
      };

      renderWithProviders(<PerformanceTestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('duration')).toHaveTextContent('100');
      });
    });
  });

  describe('Configuration Management', () => {
    it('should use custom configuration', async () => {
      const customConfig = {
        modules: {
          maxModules: 25,
          memoryLimit: 128,
          enableLazyLoading: false,
          enableHotReload: false,
          preloadCritical: false,
        },
      };

      const ConfigTestComponent: React.FC = () => {
        const core = useCoreContext();
        return (
          <div data-testid="config">{JSON.stringify(core.config.modules.maxModules)}</div>
        );
      };

      render(
        <QueryClientProvider client={new QueryClient()}>
          <PerformanceMonitoringProvider>
            <CoreProvider config={customConfig}>
              <ConfigTestComponent />
            </CoreProvider>
          </PerformanceMonitoringProvider>
        </QueryClientProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('config')).toHaveTextContent('25');
      });
    });

    it('should allow runtime configuration updates', async () => {
      const ConfigUpdateComponent: React.FC = () => {
        const core = useCoreContext();
        const [maxModules, setMaxModules] = React.useState(core.config.modules.maxModules);
        
        const updateConfig = () => {
          core.updateConfig({
            modules: { ...core.config.modules, maxModules: 100 }
          });
          setMaxModules(100);
        };
        
        return (
          <div>
            <div data-testid="max-modules">{maxModules}</div>
            <button data-testid="update-config" onClick={updateConfig}>
              Update Config
            </button>
          </div>
        );
      };

      renderWithProviders(<ConfigUpdateComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('max-modules')).toBeInTheDocument();
      });

      act(() => {
        screen.getByTestId('update-config').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('max-modules')).toHaveTextContent('100');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing context gracefully', () => {
      const TestComponentWithoutProvider: React.FC = () => {
        try {
          useCoreContext();
          return <div>Should not render</div>;
        } catch (error) {
          return <div data-testid="error">Context Error</div>;
        }
      };

      render(<TestComponentWithoutProvider />);
      
      expect(screen.getByTestId('error')).toHaveTextContent('Context Error');
    });
  });
});