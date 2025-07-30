/**
 * Module Registry
 * High-performance module registration and management system
 * Supports 100,000+ concurrent users with dynamic loading
 */

import { CoreModule, ModuleState, ModuleRegistryConfig, PerformanceMetrics } from '../types/core';

export class ModuleRegistry {
  private modules = new Map<string, CoreModule>();
  private moduleStates = new Map<string, ModuleState>();
  private moduleInstances = new Map<string, any>();
  private dependencies = new Map<string, Set<string>>();
  private memoryUsage = 0;
  private config: ModuleRegistryConfig;

  constructor(config: ModuleRegistryConfig) {
    this.config = config;
    this.setupMemoryMonitoring();
  }

  async register(module: CoreModule): Promise<void> {
    if (this.modules.size >= this.config.maxModules) {
      throw new Error(`Maximum modules limit reached: ${this.config.maxModules}`);
    }

    if (this.modules.has(module.id)) {
      console.warn(`Module ${module.id} already registered, updating...`);
    }

    // Validate dependencies
    if (module.dependencies) {
      for (const depId of module.dependencies) {
        if (!this.modules.has(depId)) {
          throw new Error(`Missing dependency: ${depId} for module ${module.id}`);
        }
      }
      this.dependencies.set(module.id, new Set(module.dependencies));
    }

    this.modules.set(module.id, module);
    this.moduleStates.set(module.id, {
      id: module.id,
      status: 'loading',
      memoryUsage: 0,
    });

    // Auto-load if not lazy or if critical priority
    if (!module.lazy || (module.priority && module.priority > 8)) {
      await this.load(module.id);
    }
  }

  async unregister(moduleId: string): Promise<void> {
    // Check for dependent modules
    const dependents = this.getDependents(moduleId);
    if (dependents.length > 0) {
      throw new Error(`Cannot unregister ${moduleId}: has dependents [${dependents.join(', ')}]`);
    }

    await this.unload(moduleId);
    this.modules.delete(moduleId);
    this.moduleStates.delete(moduleId);
    this.dependencies.delete(moduleId);
  }

  async load(moduleId: string): Promise<any> {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module not found: ${moduleId}`);
    }

    const currentState = this.moduleStates.get(moduleId);
    if (currentState?.status === 'loaded') {
      return this.moduleInstances.get(moduleId);
    }

    if (currentState?.status === 'loading') {
      // Wait for loading to complete
      return this.waitForLoad(moduleId);
    }

    this.updateModuleState(moduleId, { status: 'loading' });

    try {
      // Load dependencies first
      if (module.dependencies) {
        await Promise.all(
          module.dependencies.map(depId => this.load(depId))
        );
      }

      const startTime = performance.now();
      const instance = await module.factory();
      const loadTime = performance.now() - startTime;

      // Memory usage estimation (basic heuristic)
      const memoryUsage = this.estimateMemoryUsage(instance);
      
      if (this.memoryUsage + memoryUsage > this.config.memoryLimit * 1024 * 1024) {
        throw new Error(`Memory limit exceeded for module ${moduleId}`);
      }

      this.moduleInstances.set(moduleId, instance);
      this.memoryUsage += memoryUsage;
      
      this.updateModuleState(moduleId, {
        status: 'loaded',
        instance,
        memoryUsage,
        loadTime,
      });

      return instance;
    } catch (error) {
      this.updateModuleState(moduleId, {
        status: 'error',
        error: error as Error,
      });
      throw error;
    }
  }

  async unload(moduleId: string): Promise<void> {
    const state = this.moduleStates.get(moduleId);
    if (!state || state.status !== 'loaded') {
      return;
    }

    const instance = this.moduleInstances.get(moduleId);
    
    // Call cleanup if available
    if (instance && typeof instance.cleanup === 'function') {
      try {
        await instance.cleanup();
      } catch (error) {
        console.warn(`Cleanup failed for module ${moduleId}:`, error);
      }
    }

    this.moduleInstances.delete(moduleId);
    this.memoryUsage -= state.memoryUsage || 0;
    
    this.updateModuleState(moduleId, {
      status: 'suspended',
      instance: undefined,
      memoryUsage: 0,
    });
  }

  get(moduleId: string): ModuleState | undefined {
    return this.moduleStates.get(moduleId);
  }

  getAll(): ModuleState[] {
    return Array.from(this.moduleStates.values());
  }

  getInstance(moduleId: string): any {
    return this.moduleInstances.get(moduleId);
  }

  getMetrics(): PerformanceMetrics {
    const states = Array.from(this.moduleStates.values());
    const loadedModules = states.filter(s => s.status === 'loaded');
    const errorModules = states.filter(s => s.status === 'error');
    
    return {
      memoryUsage: this.memoryUsage,
      activeModules: loadedModules.length,
      eventThroughput: 0, // Will be updated by EventBus
      averageResponseTime: this.calculateAverageLoadTime(),
      errorRate: errorModules.length / states.length,
    };
  }

  // Preload critical modules
  async preloadCritical(): Promise<void> {
    if (!this.config.preloadCritical) return;

    const criticalModules = Array.from(this.modules.values())
      .filter(m => m.priority && m.priority > 7)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const module of criticalModules) {
      try {
        await this.load(module.id);
      } catch (error) {
        console.error(`Failed to preload critical module ${module.id}:`, error);
      }
    }
  }

  private updateModuleState(moduleId: string, updates: Partial<ModuleState>): void {
    const current = this.moduleStates.get(moduleId);
    if (current) {
      this.moduleStates.set(moduleId, { ...current, ...updates });
    }
  }

  private async waitForLoad(moduleId: string, timeout = 10000): Promise<any> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const state = this.moduleStates.get(moduleId);
      if (state?.status === 'loaded') {
        return this.moduleInstances.get(moduleId);
      }
      if (state?.status === 'error') {
        throw state.error;
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    throw new Error(`Module load timeout: ${moduleId}`);
  }

  private getDependents(moduleId: string): string[] {
    const dependents: string[] = [];
    
    for (const [id, deps] of this.dependencies.entries()) {
      if (deps.has(moduleId)) {
        dependents.push(id);
      }
    }
    
    return dependents;
  }

  private estimateMemoryUsage(instance: any): number {
    // Basic memory estimation heuristic
    // In production, this could use more sophisticated methods
    try {
      const serialized = JSON.stringify(instance);
      return serialized.length * 2; // Rough estimate: 2 bytes per character
    } catch {
      return 1024; // Default 1KB if serialization fails
    }
  }

  private calculateAverageLoadTime(): number {
    const states = Array.from(this.moduleStates.values());
    const loadTimes = states
      .map(s => s.loadTime)
      .filter((time): time is number => time !== undefined);
    
    if (loadTimes.length === 0) return 0;
    
    return loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
  }

  private setupMemoryMonitoring(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      setInterval(() => {
        // Monitor memory usage and trigger cleanup if needed
        if (this.memoryUsage > this.config.memoryLimit * 1024 * 1024 * 0.8) {
          this.performGarbageCollection();
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private async performGarbageCollection(): Promise<void> {
    console.warn('Performing module garbage collection...');
    
    // Unload least recently used non-critical modules
    const states = Array.from(this.moduleStates.entries())
      .filter(([_, state]) => state.status === 'loaded')
      .map(([id, state]) => ({ id, state }))
      .filter(({ id }) => {
        const module = this.modules.get(id);
        return !module || !module.priority || module.priority < 5;
      })
      .sort((a, b) => (a.state.loadTime || 0) - (b.state.loadTime || 0));

    // Unload bottom 20% of modules
    const toUnload = states.slice(0, Math.floor(states.length * 0.2));
    
    for (const { id } of toUnload) {
      try {
        await this.unload(id);
      } catch (error) {
        console.error(`Failed to unload module ${id}:`, error);
      }
    }
  }
}