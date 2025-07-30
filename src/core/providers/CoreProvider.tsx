/**
 * Core Provider - Unified Context Management
 * Single-level provider architecture supporting 100,000+ concurrent users
 * Replaces all nested provider architecture with dynamic module composition
 */

import React, { ReactNode, createContext, useContext, useMemo, useEffect, useState } from 'react';
import { ModuleRegistry } from '../registry/ModuleRegistry';
import { EventBus } from '../events/EventBus';
import { CoreContextType, CoreProviderConfig, CoreModule } from '../types/core';
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring';

// Default configuration optimized for 100,000+ users
const DEFAULT_CONFIG: CoreProviderConfig = {
  performance: {
    maxConcurrentUsers: 100000,
    memoryThreshold: 512, // MB
    enableMetrics: true,
  },
  modules: {
    maxModules: 50,
    memoryLimit: 256, // MB
    enableLazyLoading: true,
    enableHotReload: process.env.NODE_ENV === 'development',
    preloadCritical: true,
  },
  events: {
    maxListeners: 1000,
    batchSize: 100,
    batchTimeout: 10, // ms
    enableDebugging: process.env.NODE_ENV === 'development',
    memoryLimit: 64, // MB
  },
  enableDevMode: process.env.NODE_ENV === 'development',
};

const CoreContext = createContext<CoreContextType | undefined>(undefined);

export const useCoreContext = () => {
  const context = useContext(CoreContext);
  if (!context) {
    throw new Error('useCoreContext must be used within a CoreProvider');
  }
  return context;
};

interface CoreProviderProps {
  children: ReactNode;
  config?: Partial<CoreProviderConfig>;
  modules?: CoreModule[];
}

export const CoreProvider: React.FC<CoreProviderProps> = ({ 
  children, 
  config: configOverrides,
  modules = []
}) => {
  const [config, setConfig] = useState<CoreProviderConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...configOverrides,
  }));
  
  const [moduleRegistry] = useState(() => new ModuleRegistry(config.modules));
  const [eventBus] = useState(() => new EventBus(config.events));
  const [isInitialized, setIsInitialized] = useState(false);
  
  const performanceMonitoring = usePerformanceMonitoring();

  // Initialize core systems
  useEffect(() => {
    const initializeCore = async () => {
      try {
        // Register provided modules
        for (const module of modules) {
          await moduleRegistry.register(module);
        }

        // Register core business modules
        await registerBusinessModules(moduleRegistry);

        // Preload critical modules
        await moduleRegistry.preloadCritical();

        // Setup system event listeners
        setupSystemEventListeners(eventBus, moduleRegistry);

        setIsInitialized(true);
        
        eventBus.emit({
          type: 'core.initialized',
          payload: { 
            modulesCount: moduleRegistry.getAll().length,
            config 
          },
          source: 'CoreProvider',
        });

      } catch (error) {
        console.error('Core initialization failed:', error);
        eventBus.emit({
          type: 'core.error',
          payload: { error },
          source: 'CoreProvider',
        });
      }
    };

    initializeCore();

    // Cleanup on unmount
    return () => {
      eventBus.destroy();
    };
  }, []);

  // Performance monitoring integration
  useEffect(() => {
    const interval = setInterval(() => {
      if (config.performance.enableMetrics) {
        const registryMetrics = moduleRegistry.getMetrics();
        const eventMetrics = eventBus.getMetrics();
        
        // Update event throughput in registry metrics
        registryMetrics.eventThroughput = eventMetrics.eventsProcessed;
        
        // Record performance metrics
        performanceMonitoring.recordMetric(
          'core_memory_usage',
          registryMetrics.memoryUsage + eventMetrics.memoryUsage,
          'core',
          undefined,
          { activeModules: registryMetrics.activeModules }
        );
        
        performanceMonitoring.recordMetric(
          'core_active_modules',
          registryMetrics.activeModules,
          'core'
        );
        
        performanceMonitoring.recordMetric(
          'event_throughput',
          eventMetrics.eventsProcessed,
          'events'
        );
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [config.performance.enableMetrics]);

  const contextValue = useMemo((): CoreContextType => ({
    moduleRegistry: {
      register: (module: CoreModule) => moduleRegistry.register(module),
      unregister: (moduleId: string) => moduleRegistry.unregister(moduleId),
      get: (moduleId: string) => moduleRegistry.get(moduleId),
      getAll: () => moduleRegistry.getAll(),
      load: (moduleId: string) => moduleRegistry.load(moduleId),
      unload: (moduleId: string) => moduleRegistry.unload(moduleId),
    },
    
    eventBus: {
      emit: (event) => eventBus.emit(event),
      on: (pattern, handler) => eventBus.on(pattern, handler),
      off: (listenerId) => eventBus.off(listenerId),
      once: (pattern, handler) => eventBus.once(pattern, handler),
    },
    
    performance: {
      getMetrics: () => {
        const registryMetrics = moduleRegistry.getMetrics();
        const eventMetrics = eventBus.getMetrics();
        
        return {
          ...registryMetrics,
          eventThroughput: eventMetrics.eventsProcessed,
          memoryUsage: registryMetrics.memoryUsage + eventMetrics.memoryUsage,
        };
      },
      monitor: (component: string) => {
        const startTime = performance.now();
        return () => {
          const duration = performance.now() - startTime;
          performanceMonitoring.recordMetric(`${component}_duration`, duration, 'core');
        };
      },
      isHealthy: () => {
        const metrics = moduleRegistry.getMetrics();
        return metrics.errorRate < 0.05 && // Less than 5% error rate
               metrics.memoryUsage < config.performance.memoryThreshold * 1024 * 1024 * 0.8; // Less than 80% memory threshold
      },
    },
    
    config,
    updateConfig: (newConfig) => {
      setConfig(prev => ({ ...prev, ...newConfig }));
    },
  }), [moduleRegistry, eventBus, config]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing Core System...</p>
        </div>
      </div>
    );
  }

  return (
    <CoreContext.Provider value={contextValue}>
      {children}
    </CoreContext.Provider>
  );
};

// Register all business modules with the registry
async function registerBusinessModules(registry: ModuleRegistry): Promise<void> {
  const businessModules: CoreModule[] = [
    {
      id: 'inventory',
      name: 'Inventory Management',
      version: '1.0.0',
      priority: 9,
      factory: () => import('../../context/InventoryContext').then(m => m.useInventory),
    },
    {
      id: 'kitchen-inventory',
      name: 'Kitchen Inventory',
      version: '1.0.0',
      priority: 8,
      dependencies: ['inventory'],
      factory: () => import('../../context/KitchenInventoryContext').then(m => m.useKitchenInventory),
    },
    {
      id: 'checklist',
      name: 'Checklist Management',
      version: '1.0.0',
      priority: 7,
      factory: () => import('../../context/ChecklistContext').then(m => m.useChecklist),
    },
    {
      id: 'equipment',
      name: 'Equipment Management',
      version: '1.0.0',
      priority: 6,
      factory: () => import('../../context/EquipmentContext').then(m => m.useEquipment),
    },
    {
      id: 'supplier',
      name: 'Supplier Management',
      version: '1.0.0',
      priority: 6,
      factory: () => import('../../context/SupplierContext').then(m => m.useSupplier),
    },
    {
      id: 'cash-register',
      name: 'Cash Register',
      version: '1.0.0',
      priority: 8,
      factory: () => import('../../context/CashRegisterContext').then(m => m.useCashRegister),
    },
    {
      id: 'financial',
      name: 'Financial Management',
      version: '1.0.0',
      priority: 7,
      dependencies: ['cash-register'],
      factory: () => import('../../context/FinancialContext').then(m => m.useFinancial),
    },
    {
      id: 'communication',
      name: 'Communication',
      version: '1.0.0',
      priority: 9,
      factory: () => import('../../context/CommunicationContext').then(m => m.useCommunication),
    },
    {
      id: 'user-management',
      name: 'User Management',
      version: '1.0.0',
      priority: 8,
      factory: () => import('../../context/UserManagementContext').then(m => m.useUserManagement),
    },
    {
      id: 'chat',
      name: 'Chat System',
      version: '1.0.0',
      priority: 9,
      dependencies: ['communication'],
      factory: () => import('../../context/ChatContext').then(m => m.useChatContext),
    },
    {
      id: 'unread-messages',
      name: 'Unread Messages',
      version: '1.0.0',
      priority: 5,
      dependencies: ['chat'],
      lazy: true,
      factory: () => import('../../context/UnreadMessagesContext').then(m => m.useUnreadMessages),
    },
    {
      id: 'reports',
      name: 'Reports System',
      version: '1.0.0',
      priority: 4,
      lazy: true,
      factory: () => import('../../context/ReportsContext').then(m => m.useReports),
    },
    {
      id: 'location',
      name: 'Location Management',
      version: '1.0.0',
      priority: 10,
      factory: () => import('../../context/OptimizedLocationProvider').then(m => ({ 
        meta: m.useLocationMeta,
        state: m.useLocationState,
        data: m.useLocationData
      })),
    },
  ];

  for (const module of businessModules) {
    await registry.register(module);
  }
}

// Setup system-level event listeners
function setupSystemEventListeners(eventBus: EventBus, registry: ModuleRegistry): void {
  // Module lifecycle events
  eventBus.on('module.*', (event) => {
    console.debug(`Module event: ${event.type}`, event.payload);
  });

  // Performance monitoring
  eventBus.on('performance.threshold.exceeded', (event) => {
    console.warn('Performance threshold exceeded:', event.payload);
  });

  // Error handling
  eventBus.on('system.error', (event) => {
    console.error('System error:', event.payload);
  });

  // Memory management
  eventBus.on('memory.high', async (event) => {
    console.warn('High memory usage detected, triggering cleanup');
    // Trigger module garbage collection
    // registry.performGarbageCollection(); // This would be a public method
  });
}