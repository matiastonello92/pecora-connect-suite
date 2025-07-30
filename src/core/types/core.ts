/**
 * Core Infrastructure Types
 * Defines the foundation types for the Core Infrastructure Module
 */

export interface CoreModule {
  id: string;
  name: string;
  version: string;
  dependencies?: string[];
  lazy?: boolean;
  priority?: number;
  config?: Record<string, any>;
  factory: () => Promise<any> | any;
}

export interface ModuleRegistryConfig {
  maxModules: number;
  memoryLimit: number; // MB
  enableLazyLoading: boolean;
  enableHotReload: boolean;
  preloadCritical: boolean;
}

export interface EventBusConfig {
  maxListeners: number;
  batchSize: number;
  batchTimeout: number; // ms
  enableDebugging: boolean;
  memoryLimit: number; // MB
}

export interface CoreProviderConfig {
  performance: {
    maxConcurrentUsers: number;
    memoryThreshold: number;
    enableMetrics: boolean;
  };
  modules: ModuleRegistryConfig;
  events: EventBusConfig;
  enableDevMode: boolean;
}

export interface ModuleState {
  id: string;
  status: 'loading' | 'loaded' | 'error' | 'suspended';
  instance?: any;
  error?: Error;
  memoryUsage?: number;
  loadTime?: number;
}

export interface CoreEvent {
  id: string;
  type: string;
  payload: any;
  source: string;
  timestamp: number;
  priority?: number;
}

export interface EventListener {
  id: string;
  pattern: string;
  handler: (event: CoreEvent) => void | Promise<void>;
  once?: boolean;
  priority?: number;
}

export interface PerformanceMetrics {
  memoryUsage: number;
  activeModules: number;
  eventThroughput: number;
  averageResponseTime: number;
  errorRate: number;
}

export interface CoreContextType {
  // Module Management
  moduleRegistry: {
    register: (module: CoreModule) => Promise<void>;
    unregister: (moduleId: string) => Promise<void>;
    get: (moduleId: string) => ModuleState | undefined;
    getAll: () => ModuleState[];
    load: (moduleId: string) => Promise<any>;
    unload: (moduleId: string) => Promise<void>;
  };
  
  // Event System
  eventBus: {
    emit: (event: Omit<CoreEvent, 'id' | 'timestamp'>) => void;
    on: (pattern: string, handler: EventListener['handler']) => string;
    off: (listenerId: string) => void;
    once: (pattern: string, handler: EventListener['handler']) => string;
  };
  
  // Performance Monitoring
  performance: {
    getMetrics: () => PerformanceMetrics;
    monitor: (component: string) => () => void;
    isHealthy: () => boolean;
  };
  
  // Configuration
  config: CoreProviderConfig;
  updateConfig: (config: Partial<CoreProviderConfig>) => void;
}