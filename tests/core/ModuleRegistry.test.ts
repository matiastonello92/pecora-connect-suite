/**
 * ModuleRegistry Tests
 * Test suite for module registration and management
 */

import { ModuleRegistry } from '../../src/core/registry/ModuleRegistry';
import { CoreModule, ModuleRegistryConfig } from '../../src/core/types/core';

const defaultConfig: ModuleRegistryConfig = {
  maxModules: 10,
  memoryLimit: 50, // MB
  enableLazyLoading: true,
  enableHotReload: false,
  preloadCritical: true,
};

describe('ModuleRegistry', () => {
  let registry: ModuleRegistry;

  beforeEach(() => {
    registry = new ModuleRegistry(defaultConfig);
  });

  describe('Module Registration', () => {
    it('should register a simple module', async () => {
      const module: CoreModule = {
        id: 'test-module',
        name: 'Test Module',
        version: '1.0.0',
        factory: () => ({ test: 'data' }),
      };

      await registry.register(module);
      
      const state = registry.get('test-module');
      expect(state).toBeDefined();
      expect(state?.id).toBe('test-module');
    });

    it('should register and load critical modules immediately', async () => {
      const module: CoreModule = {
        id: 'critical-module',
        name: 'Critical Module',
        version: '1.0.0',
        priority: 9,
        factory: () => ({ critical: true }),
      };

      await registry.register(module);
      
      const state = registry.get('critical-module');
      expect(state?.status).toBe('loaded');
    });

    it('should not auto-load lazy modules', async () => {
      const module: CoreModule = {
        id: 'lazy-module',
        name: 'Lazy Module',
        version: '1.0.0',
        lazy: true,
        factory: () => ({ lazy: true }),
      };

      await registry.register(module);
      
      const state = registry.get('lazy-module');
      expect(state?.status).toBe('loading');
    });

    it('should enforce maximum module limit', async () => {
      const modules: CoreModule[] = [];
      
      // Create more modules than the limit allows
      for (let i = 0; i < defaultConfig.maxModules + 1; i++) {
        modules.push({
          id: `module-${i}`,
          name: `Module ${i}`,
          version: '1.0.0',
          factory: () => ({ id: i }),
        });
      }

      // Register up to the limit
      for (let i = 0; i < defaultConfig.maxModules; i++) {
        await registry.register(modules[i]);
      }

      // This should throw an error
      await expect(registry.register(modules[defaultConfig.maxModules]))
        .rejects.toThrow('Maximum modules limit reached');
    });

    it('should handle duplicate registrations', async () => {
      const module: CoreModule = {
        id: 'duplicate-module',
        name: 'Duplicate Module',
        version: '1.0.0',
        factory: () => ({ version: 1 }),
      };

      const updatedModule: CoreModule = {
        ...module,
        factory: () => ({ version: 2 }),
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await registry.register(module);
      await registry.register(updatedModule);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('already registered, updating')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Module Dependencies', () => {
    it('should validate dependencies exist', async () => {
      const moduleWithDeps: CoreModule = {
        id: 'dependent-module',
        name: 'Dependent Module',
        version: '1.0.0',
        dependencies: ['non-existent-module'],
        factory: () => ({ dependent: true }),
      };

      await expect(registry.register(moduleWithDeps))
        .rejects.toThrow('Missing dependency: non-existent-module');
    });

    it('should load dependencies before dependent modules', async () => {
      const dependency: CoreModule = {
        id: 'dependency',
        name: 'Dependency',
        version: '1.0.0',
        factory: () => ({ dependency: true }),
      };

      const dependent: CoreModule = {
        id: 'dependent',
        name: 'Dependent',
        version: '1.0.0',
        dependencies: ['dependency'],
        factory: () => ({ dependent: true }),
      };

      await registry.register(dependency);
      await registry.register(dependent);

      // Load the dependent module
      await registry.load('dependent');

      // Both should be loaded
      expect(registry.get('dependency')?.status).toBe('loaded');
      expect(registry.get('dependent')?.status).toBe('loaded');
    });

    it('should prevent unregistering modules with dependents', async () => {
      const dependency: CoreModule = {
        id: 'dependency',
        name: 'Dependency',
        version: '1.0.0',
        factory: () => ({ dependency: true }),
      };

      const dependent: CoreModule = {
        id: 'dependent',
        name: 'Dependent',
        version: '1.0.0',
        dependencies: ['dependency'],
        factory: () => ({ dependent: true }),
      };

      await registry.register(dependency);
      await registry.register(dependent);

      await expect(registry.unregister('dependency'))
        .rejects.toThrow('Cannot unregister dependency: has dependents [dependent]');
    });
  });

  describe('Module Loading', () => {
    it('should load module instances', async () => {
      const testData = { test: 'instance' };
      const module: CoreModule = {
        id: 'loadable-module',
        name: 'Loadable Module',
        version: '1.0.0',
        lazy: true,
        factory: () => testData,
      };

      await registry.register(module);
      const instance = await registry.load('loadable-module');

      expect(instance).toBe(testData);
      expect(registry.getInstance('loadable-module')).toBe(testData);
      expect(registry.get('loadable-module')?.status).toBe('loaded');
    });

    it('should handle async module factories', async () => {
      const module: CoreModule = {
        id: 'async-module',
        name: 'Async Module',
        version: '1.0.0',
        lazy: true,
        factory: () => Promise.resolve({ async: true }),
      };

      await registry.register(module);
      const instance = await registry.load('async-module');

      expect(instance).toEqual({ async: true });
    });

    it('should handle module loading errors', async () => {
      const module: CoreModule = {
        id: 'error-module',
        name: 'Error Module',
        version: '1.0.0',
        lazy: true,
        factory: () => {
          throw new Error('Module load error');
        },
      };

      await registry.register(module);
      
      await expect(registry.load('error-module'))
        .rejects.toThrow('Module load error');
      
      expect(registry.get('error-module')?.status).toBe('error');
    });

    it('should return same instance for multiple loads', async () => {
      const module: CoreModule = {
        id: 'singleton-module',
        name: 'Singleton Module',
        version: '1.0.0',
        lazy: true,
        factory: () => ({ id: Math.random() }),
      };

      await registry.register(module);
      
      const instance1 = await registry.load('singleton-module');
      const instance2 = await registry.load('singleton-module');

      expect(instance1).toBe(instance2);
    });

    it('should handle concurrent loading of same module', async () => {
      let factoryCallCount = 0;
      const module: CoreModule = {
        id: 'concurrent-module',
        name: 'Concurrent Module',
        version: '1.0.0',
        lazy: true,
        factory: async () => {
          factoryCallCount++;
          await new Promise(resolve => setTimeout(resolve, 100));
          return { calls: factoryCallCount };
        },
      };

      await registry.register(module);
      
      // Start multiple concurrent loads
      const [instance1, instance2, instance3] = await Promise.all([
        registry.load('concurrent-module'),
        registry.load('concurrent-module'),
        registry.load('concurrent-module'),
      ]);

      // Factory should only be called once
      expect(factoryCallCount).toBe(1);
      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
    });
  });

  describe('Module Unloading', () => {
    it('should unload modules and free memory', async () => {
      const module: CoreModule = {
        id: 'unloadable-module',
        name: 'Unloadable Module',
        version: '1.0.0',
        factory: () => ({ 
          cleanup: jest.fn(),
          data: 'test'
        }),
      };

      await registry.register(module);
      await registry.load('unloadable-module');
      
      const instance = registry.getInstance('unloadable-module');
      expect(instance).toBeDefined();
      
      await registry.unload('unloadable-module');
      
      expect(registry.getInstance('unloadable-module')).toBeUndefined();
      expect(registry.get('unloadable-module')?.status).toBe('suspended');
    });

    it('should call cleanup method if available', async () => {
      const cleanupMock = jest.fn();
      const module: CoreModule = {
        id: 'cleanup-module',
        name: 'Cleanup Module',
        version: '1.0.0',
        factory: () => ({ cleanup: cleanupMock }),
      };

      await registry.register(module);
      await registry.load('cleanup-module');
      await registry.unload('cleanup-module');

      expect(cleanupMock).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const module: CoreModule = {
        id: 'cleanup-error-module',
        name: 'Cleanup Error Module',
        version: '1.0.0',
        factory: () => ({
          cleanup: () => { throw new Error('Cleanup error'); }
        }),
      };

      await registry.register(module);
      await registry.load('cleanup-error-module');
      await registry.unload('cleanup-error-module');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleanup failed'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Metrics', () => {
    it('should provide module metrics', async () => {
      const modules: CoreModule[] = [
        {
          id: 'module-1',
          name: 'Module 1',
          version: '1.0.0',
          factory: () => ({ data: 'test1' }),
        },
        {
          id: 'module-2',
          name: 'Module 2',
          version: '1.0.0',
          factory: () => ({ data: 'test2' }),
        },
      ];

      for (const module of modules) {
        await registry.register(module);
      }

      const metrics = registry.getMetrics();

      expect(metrics.activeModules).toBe(2);
      expect(metrics.memoryUsage).toBeGreaterThan(0);
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBe(0);
    });

    it('should track error rates', async () => {
      const errorModule: CoreModule = {
        id: 'error-module',
        name: 'Error Module',
        version: '1.0.0',
        lazy: true,
        factory: () => { throw new Error('Test error'); },
      };

      const successModule: CoreModule = {
        id: 'success-module',
        name: 'Success Module',
        version: '1.0.0',
        factory: () => ({ success: true }),
      };

      await registry.register(errorModule);
      await registry.register(successModule);

      try {
        await registry.load('error-module');
      } catch (error) {
        // Expected error
      }

      const metrics = registry.getMetrics();
      expect(metrics.errorRate).toBe(0.5); // 1 error out of 2 modules
    });

    it('should calculate average load times', async () => {
      const fastModule: CoreModule = {
        id: 'fast-module',
        name: 'Fast Module',
        version: '1.0.0',
        lazy: true,
        factory: () => ({ fast: true }),
      };

      const slowModule: CoreModule = {
        id: 'slow-module',
        name: 'Slow Module',
        version: '1.0.0',
        lazy: true,
        factory: async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return { slow: true };
        },
      };

      await registry.register(fastModule);
      await registry.register(slowModule);

      await registry.load('fast-module');
      await registry.load('slow-module');

      const metrics = registry.getMetrics();
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('Memory Management', () => {
    it('should enforce memory limits', async () => {
      // Create a registry with very low memory limit
      const lowMemoryRegistry = new ModuleRegistry({
        ...defaultConfig,
        memoryLimit: 0.001, // 1KB
      });

      const largeModule: CoreModule = {
        id: 'large-module',
        name: 'Large Module',
        version: '1.0.0',
        lazy: true,
        factory: () => ({
          largeData: new Array(10000).fill('x').join(''), // Large string
        }),
      };

      await lowMemoryRegistry.register(largeModule);
      
      await expect(lowMemoryRegistry.load('large-module'))
        .rejects.toThrow('Memory limit exceeded');
    });

    it('should estimate memory usage', async () => {
      const module: CoreModule = {
        id: 'memory-module',
        name: 'Memory Module',
        version: '1.0.0',
        factory: () => ({ data: 'test' }),
      };

      await registry.register(module);
      await registry.load('memory-module');

      const state = registry.get('memory-module');
      expect(state?.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('Preloading', () => {
    it('should preload critical modules', async () => {
      const criticalModules: CoreModule[] = [
        {
          id: 'critical-1',
          name: 'Critical 1',
          version: '1.0.0',
          priority: 9,
          factory: () => ({ critical: 1 }),
        },
        {
          id: 'critical-2',
          name: 'Critical 2',
          version: '1.0.0',
          priority: 8,
          factory: () => ({ critical: 2 }),
        },
        {
          id: 'normal',
          name: 'Normal',
          version: '1.0.0',
          priority: 5,
          factory: () => ({ normal: true }),
        },
      ];

      for (const module of criticalModules) {
        await registry.register(module);
      }

      await registry.preloadCritical();

      // Critical modules should be loaded
      expect(registry.get('critical-1')?.status).toBe('loaded');
      expect(registry.get('critical-2')?.status).toBe('loaded');
      // Normal priority module should not be loaded
      expect(registry.get('normal')?.status).toBe('loading');
    });
  });
});