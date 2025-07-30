/**
 * Permission Cache Manager
 * Role-based caching with intelligent prefetching and bit-field optimization
 */

import type { AppModule, AccessLevel, UserPermission } from '@/types/users';
import { supabase } from '@/integrations/supabase/client';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface PermissionBitField {
  read: number;
  write: number;
  validate: number;
  delete: number;
}

export interface CacheConfig {
  defaultTTL: number; // 15 minutes
  maxCacheSize: number; // 10000 entries
  prefetchThreshold: number; // 0.8 (80% of TTL)
  hitCountThreshold: number; // 10 hits before considering hot
}

const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 15 * 60 * 1000, // 15 minutes
  maxCacheSize: 10000,
  prefetchThreshold: 0.8,
  hitCountThreshold: 10,
};

export class PermissionCache {
  private static instance: PermissionCache;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private roleCache: Map<AccessLevel, PermissionBitField> = new Map();
  private userPermissionsCache: Map<string, UserPermission[]> = new Map();
  private prefetchQueue: Set<string> = new Set();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor(config: CacheConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.initializeBitFields();
    this.startCleanupTimer();
  }

  static getInstance(config?: CacheConfig): PermissionCache {
    if (!PermissionCache.instance) {
      PermissionCache.instance = new PermissionCache(config);
    }
    return PermissionCache.instance;
  }

  private initializeBitFields() {
    // Pre-calculate bit fields for all access levels
    const modules: AppModule[] = [
      'chat', 'inventory_sala', 'inventory_kitchen', 'checklists',
      'suppliers', 'equipment', 'financial', 'cash_closure',
      'reports', 'tasks', 'communication', 'announcements', 'user_management'
    ];

    const accessLevels: AccessLevel[] = [
      'base', 'manager_sala', 'manager_cucina', 'general_manager',
      'assistant_manager', 'financial_department', 'communication_department', 'observer'
    ];

    accessLevels.forEach(level => {
      this.roleCache.set(level, this.calculateBitField(level, modules));
    });
  }

  private calculateBitField(accessLevel: AccessLevel, modules: AppModule[]): PermissionBitField {
    const bitField: PermissionBitField = { read: 0, write: 0, validate: 0, delete: 0 };
    
    modules.forEach((module, index) => {
      const permissions = this.getDefaultPermissionsForModule(accessLevel, module);
      
      if (permissions.can_read) bitField.read |= (1 << index);
      if (permissions.can_write) bitField.write |= (1 << index);
      if (permissions.can_validate) bitField.validate |= (1 << index);
      if (permissions.can_delete) bitField.delete |= (1 << index);
    });

    return bitField;
  }

  private getDefaultPermissionsForModule(level: AccessLevel, module: AppModule) {
    // Simplified permission matrix - would use the full PermissionManager logic
    const basePerms = { can_read: false, can_write: false, can_validate: false, can_delete: false };
    
    switch (level) {
      case 'general_manager':
        return { can_read: true, can_write: true, can_validate: true, can_delete: true };
      case 'base':
        if (['chat', 'inventory_sala', 'inventory_kitchen'].includes(module)) {
          return { can_read: true, can_write: true, can_validate: false, can_delete: false };
        }
        return { can_read: true, can_write: false, can_validate: false, can_delete: false };
      default:
        return basePerms;
    }
  }

  async getPermissions(userId: string, accessLevel: AccessLevel): Promise<UserPermission[]> {
    const cacheKey = `permissions:${userId}`;
    const cached = this.get<UserPermission[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const permissions = (data || []).map(perm => ({
        ...perm,
        created_at: new Date(perm.created_at),
        updated_at: new Date(perm.updated_at)
      }));

      this.set(cacheKey, permissions);
      this.userPermissionsCache.set(userId, permissions);
      
      return permissions;
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      return [];
    }
  }

  hasPermissionFast(
    userId: string,
    accessLevel: AccessLevel,
    module: AppModule,
    permission: 'can_read' | 'can_write' | 'can_validate' | 'can_delete'
  ): boolean {
    // Fast bit-field lookup for default permissions
    const bitField = this.roleCache.get(accessLevel);
    if (!bitField) return false;

    const moduleIndex = this.getModuleIndex(module);
    if (moduleIndex === -1) return false;

    // Check if the bit is set for this permission
    const hasDefaultPermission = (bitField[permission.replace('can_', '') as keyof PermissionBitField] & (1 << moduleIndex)) !== 0;

    // Check for custom permissions override
    const userPermissions = this.userPermissionsCache.get(userId);
    if (userPermissions) {
      const customPerm = userPermissions.find(p => p.module === module);
      if (customPerm) {
        return customPerm[permission];
      }
    }

    return hasDefaultPermission;
  }

  private getModuleIndex(module: AppModule): number {
    const modules: AppModule[] = [
      'chat', 'inventory_sala', 'inventory_kitchen', 'checklists',
      'suppliers', 'equipment', 'financial', 'cash_closure',
      'reports', 'tasks', 'communication', 'announcements', 'user_management'
    ];
    return modules.indexOf(module);
  }

  async batchCheckPermissions(
    userId: string,
    accessLevel: AccessLevel,
    checks: Array<{ module: AppModule; permission: 'can_read' | 'can_write' | 'can_validate' | 'can_delete' }>
  ): Promise<boolean[]> {
    // Ensure user permissions are cached
    await this.getPermissions(userId, accessLevel);
    
    return checks.map(check => 
      this.hasPermissionFast(userId, accessLevel, check.module, check.permission)
    );
  }

  prefetchUserPermissions(userId: string, accessLevel: AccessLevel) {
    if (!this.prefetchQueue.has(userId)) {
      this.prefetchQueue.add(userId);
      
      // Use setTimeout to avoid blocking
      setTimeout(async () => {
        await this.getPermissions(userId, accessLevel);
        this.prefetchQueue.delete(userId);
      }, 0);
    }
  }

  private set<T>(key: string, value: T, ttl?: number): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.config.maxCacheSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      hits: 0
    });
  }

  private get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;

    // Schedule prefetch if approaching expiry and frequently accessed
    const timeToExpiry = entry.ttl - (now - entry.timestamp);
    if (timeToExpiry < entry.ttl * this.config.prefetchThreshold && entry.hits > this.config.hitCountThreshold) {
      this.schedulePrefetch(key);
    }

    return entry.data;
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private schedulePrefetch(key: string): void {
    // Implementation would depend on the specific prefetch strategy
    console.log('Scheduling prefetch for key:', key);
  }

  invalidateUser(userId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    this.userPermissionsCache.delete(userId);
  }

  invalidateRole(accessLevel: AccessLevel): void {
    // Invalidate all users with this access level
    // This would require tracking which users have which roles
    this.roleCache.delete(accessLevel);
    this.initializeBitFields(); // Recalculate
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxCacheSize,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private calculateHitRate(): number {
    let totalHits = 0;
    let totalEntries = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      totalEntries++;
    }

    return totalEntries > 0 ? totalHits / totalEntries : 0;
  }

  private estimateMemoryUsage(): number {
    // Rough estimation in KB
    return (this.cache.size * 0.5) + (this.userPermissionsCache.size * 2);
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
    this.roleCache.clear();
    this.userPermissionsCache.clear();
    this.prefetchQueue.clear();
  }
}