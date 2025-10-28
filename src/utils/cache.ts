// Advanced multi-level caching system for Saudi Mais Inventory System

interface CacheConfig {
  ttl: number; // Time to live in seconds
  staleWhileRevalidate?: number; // Stale-while-revalidate time in seconds
  tags?: string[]; // Cache tags for invalidation
  compress?: boolean; // Whether to compress the data
  serialize?: boolean; // Whether to serialize the data
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  compressed: boolean;
  etag: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

// Browser-based memory cache (Level 1)
class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0,
  };
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    
    return this.deserialize(entry.data, entry.compressed);
  }

  set<T>(key: string, value: T, config: CacheConfig): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const serialized = this.serialize(value, config.compress);
    const entry: CacheEntry<T> = {
      data: serialized,
      timestamp: Date.now(),
      ttl: config.ttl,
      tags: config.tags || [],
      compressed: config.compress || false,
      etag: this.generateETag(serialized),
    };

    this.cache.set(key, entry);
    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  invalidateByTags(tags: string[]): number {
    let invalidated = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    
    this.stats.deletes += invalidated;
    this.stats.size = this.cache.size;
    return invalidated;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
    this.stats.size = 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.stats.deletes += cleaned;
      this.stats.size = this.cache.size;
      console.log(`[MemoryCache] Cleaned up ${cleaned} expired entries`);
    }
  }

  private serialize<T>(value: T, compress: boolean = false): any {
    if (!compress) return value;
    
    try {
      // Simple compression simulation (in real app, use actual compression)
      const serialized = JSON.stringify(value);
      return { __compressed: true, data: serialized };
    } catch {
      return value;
    }
  }

  private deserialize<T>(value: any, compressed: boolean = false): T {
    if (!compressed || !value?.__compressed) return value;
    
    try {
      return JSON.parse(value.data);
    } catch {
      return value;
    }
  }

  private generateETag(data: any): string {
    // Simple ETag generation (in real app, use proper hashing)
    return btoa(JSON.stringify(data)).substring(0, 16);
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// Redis-based distributed cache (Level 2)
class RedisCache {
  private connected = false;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0,
  };

  constructor() {
    // In a real implementation, this would connect to Redis
    // For now, we'll simulate Redis behavior
    this.connected = typeof window === 'undefined'; // Server-side only
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected) {
      this.stats.misses++;
      return null;
    }

    try {
      // Simulate Redis get operation
      const stored = localStorage?.getItem(`redis:${key}`);
      if (!stored) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(stored);
      
      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl * 1000) {
        await this.delete(key);
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      this.stats.hits++;
      this.updateHitRate();
      return entry.data;
    } catch (error) {
      console.error('[RedisCache] Get error:', error);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  async set<T>(key: string, value: T, config: CacheConfig): Promise<void> {
    if (!this.connected) return;

    try {
      const entry: CacheEntry<T> = {
        data: value,
        timestamp: Date.now(),
        ttl: config.ttl,
        tags: config.tags || [],
        compressed: config.compress || false,
        etag: this.generateETag(value),
      };

      // Simulate Redis set operation
      localStorage?.setItem(`redis:${key}`, JSON.stringify(entry));
      
      // Store tags for invalidation
      if (config.tags?.length) {
        for (const tag of config.tags) {
          const tagKey = `redis:tag:${tag}`;
          const existingKeys = localStorage?.getItem(tagKey);
          const keys = existingKeys ? JSON.parse(existingKeys) : [];
          if (!keys.includes(key)) {
            keys.push(key);
            localStorage?.setItem(tagKey, JSON.stringify(keys));
          }
        }
      }

      this.stats.sets++;
    } catch (error) {
      console.error('[RedisCache] Set error:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.connected) return false;

    try {
      // Simulate Redis delete operation
      const existed = localStorage?.getItem(`redis:${key}`) !== null;
      localStorage?.removeItem(`redis:${key}`);
      
      if (existed) {
        this.stats.deletes++;
      }
      
      return existed;
    } catch (error) {
      console.error('[RedisCache] Delete error:', error);
      return false;
    }
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    if (!this.connected) return 0;

    let invalidated = 0;
    
    try {
      for (const tag of tags) {
        const tagKey = `redis:tag:${tag}`;
        const keysJson = localStorage?.getItem(tagKey);
        
        if (keysJson) {
          const keys: string[] = JSON.parse(keysJson);
          
          for (const key of keys) {
            if (await this.delete(key)) {
              invalidated++;
            }
          }
          
          localStorage?.removeItem(tagKey);
        }
      }
    } catch (error) {
      console.error('[RedisCache] Tag invalidation error:', error);
    }
    
    return invalidated;
  }

  async clear(): Promise<void> {
    if (!this.connected) return;

    try {
      // Remove all Redis keys
      const keys = Object.keys(localStorage || {}).filter(key => key.startsWith('redis:'));
      keys.forEach(key => localStorage?.removeItem(key));
      this.stats.deletes += keys.length;
    } catch (error) {
      console.error('[RedisCache] Clear error:', error);
    }
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private generateETag(data: any): string {
    return btoa(JSON.stringify(data)).substring(0, 16);
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
}

// HTTP cache with browser Cache API (Level 3)
class HttpCache {
  private cacheName = 'saudi-mais-http-cache-v1';
  private supported = false;

  constructor() {
    this.supported = typeof window !== 'undefined' && 'caches' in window;
  }

  async get(url: string): Promise<Response | null> {
    if (!this.supported) return null;

    try {
      const cache = await caches.open(this.cacheName);
      const response = await cache.match(url);
      
      if (response) {
        // Check if response is still fresh
        const cacheControl = response.headers.get('cache-control');
        const maxAge = this.parseMaxAge(cacheControl);
        const responseTime = new Date(response.headers.get('date') || '').getTime();
        
        if (maxAge && Date.now() - responseTime > maxAge * 1000) {
          await cache.delete(url);
          return null;
        }
        
        console.log(`[HttpCache] Cache hit for: ${url}`);
        return response.clone();
      }
      
      return null;
    } catch (error) {
      console.error('[HttpCache] Get error:', error);
      return null;
    }
  }

  async set(url: string, response: Response, maxAge?: number): Promise<void> {
    if (!this.supported) return;

    try {
      const cache = await caches.open(this.cacheName);
      
      // Clone response and add cache headers
      const responseToCache = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'cache-control': `max-age=${maxAge || 300}`, // Default 5 minutes
          'date': new Date().toISOString(),
        },
      });
      
      await cache.put(url, responseToCache);
      console.log(`[HttpCache] Cached response for: ${url}`);
    } catch (error) {
      console.error('[HttpCache] Set error:', error);
    }
  }

  async delete(url: string): Promise<boolean> {
    if (!this.supported) return false;

    try {
      const cache = await caches.open(this.cacheName);
      return await cache.delete(url);
    } catch (error) {
      console.error('[HttpCache] Delete error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    if (!this.supported) return;

    try {
      await caches.delete(this.cacheName);
      console.log('[HttpCache] Cache cleared');
    } catch (error) {
      console.error('[HttpCache] Clear error:', error);
    }
  }

  private parseMaxAge(cacheControl: string | null): number | null {
    if (!cacheControl) return null;
    
    const match = cacheControl.match(/max-age=(\d+)/);
    return match ? parseInt(match[1]) : null;
  }
}

// Multi-level cache manager
export class CacheManager {
  private memoryCache: MemoryCache;
  private redisCache: RedisCache;
  private httpCache: HttpCache;
  private defaultConfig: CacheConfig = {
    ttl: 300, // 5 minutes
    staleWhileRevalidate: 60, // 1 minute
    compress: false,
    serialize: true,
  };

  constructor(memoryCacheSize = 100) {
    this.memoryCache = new MemoryCache(memoryCacheSize);
    this.redisCache = new RedisCache();
    this.httpCache = new HttpCache();
  }

  // Get from cache with fallback through levels
  async get<T>(key: string): Promise<T | null> {
    // Level 1: Memory cache (fastest)
    let result = this.memoryCache.get<T>(key);
    if (result !== null) {
      console.log(`[Cache] Memory hit for: ${key}`);
      return result;
    }

    // Level 2: Redis cache
    result = await this.redisCache.get<T>(key);
    if (result !== null) {
      console.log(`[Cache] Redis hit for: ${key}`);
      // Populate memory cache
      this.memoryCache.set(key, result, this.defaultConfig);
      return result;
    }

    console.log(`[Cache] Miss for: ${key}`);
    return null;
  }

  // Set in all cache levels
  async set<T>(key: string, value: T, config: Partial<CacheConfig> = {}): Promise<void> {
    const fullConfig = { ...this.defaultConfig, ...config };
    
    // Set in all levels
    this.memoryCache.set(key, value, fullConfig);
    await this.redisCache.set(key, value, fullConfig);
    
    console.log(`[Cache] Set: ${key}`);
  }

  // Delete from all cache levels
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.redisCache.delete(key);
    console.log(`[Cache] Deleted: ${key}`);
  }

  // Invalidate by tags across all levels
  async invalidateByTags(tags: string[]): Promise<void> {
    const memoryInvalidated = this.memoryCache.invalidateByTags(tags);
    const redisInvalidated = await this.redisCache.invalidateByTags(tags);
    
    console.log(`[Cache] Invalidated by tags [${tags.join(', ')}]: ${memoryInvalidated + redisInvalidated} entries`);
  }

  // Clear all caches
  async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.redisCache.clear();
    await this.httpCache.clear();
    console.log('[Cache] All caches cleared');
  }

  // Get cache statistics
  getStats(): {
    memory: CacheStats;
    redis: CacheStats;
    combined: CacheStats;
  } {
    const memoryStats = this.memoryCache.getStats();
    const redisStats = this.redisCache.getStats();
    
    return {
      memory: memoryStats,
      redis: redisStats,
      combined: {
        hits: memoryStats.hits + redisStats.hits,
        misses: memoryStats.misses + redisStats.misses,
        sets: memoryStats.sets + redisStats.sets,
        deletes: memoryStats.deletes + redisStats.deletes,
        size: memoryStats.size + redisStats.size,
        hitRate: ((memoryStats.hits + redisStats.hits) / 
                 (memoryStats.hits + memoryStats.misses + redisStats.hits + redisStats.misses)) * 100 || 0,
      },
    };
  }

  // Cache warming utilities
  async warmCache(entries: Array<{ key: string; fetcher: () => Promise<any>; config?: Partial<CacheConfig> }>): Promise<void> {
    console.log(`[Cache] Warming cache with ${entries.length} entries...`);
    
    const promises = entries.map(async ({ key, fetcher, config }) => {
      try {
        const value = await fetcher();
        await this.set(key, value, config);
        console.log(`[Cache] Warmed: ${key}`);
      } catch (error) {
        console.error(`[Cache] Failed to warm ${key}:`, error);
      }
    });
    
    await Promise.all(promises);
    console.log('[Cache] Cache warming completed');
  }

  // HTTP cache methods
  async getHttpResponse(url: string): Promise<Response | null> {
    return this.httpCache.get(url);
  }

  async setHttpResponse(url: string, response: Response, maxAge?: number): Promise<void> {
    return this.httpCache.set(url, response, maxAge);
  }

  // Cleanup and destroy
  destroy(): void {
    this.memoryCache.destroy();
  }
}

// Cache decorators and utilities
export function cached<T extends (...args: any[]) => Promise<any>>(
  keyGenerator: (...args: Parameters<T>) => string,
  config: Partial<CacheConfig> = {}
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: Parameters<T>) {
      const cacheKey = keyGenerator(...args);
      const cacheManager = getCacheManager();
      
      // Try to get from cache
      let result = await cacheManager.get(cacheKey);
      
      if (result === null) {
        // Cache miss, execute original method
        result = await method.apply(this, args);
        
        // Cache the result
        await cacheManager.set(cacheKey, result, config);
      }
      
      return result;
    };
  };
}

// Global cache manager instance
let globalCacheManager: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new CacheManager();
  }
  return globalCacheManager;
}

// Cache key generators
export const CacheKeys = {
  inventory: (filters: any) => `inventory:${JSON.stringify(filters)}`,
  analytics: (dateFrom?: string, dateTo?: string, destination?: string) => 
    `analytics:${dateFrom || 'all'}:${dateTo || 'all'}:${destination || 'all'}`,
  user: (userId: string) => `user:${userId}`,
  settings: (key: string) => `settings:${key}`,
  reports: (type: string, period: string) => `reports:${type}:${period}`,
  auditLogs: (filters: any) => `audit:${JSON.stringify(filters)}`,
};

// Cache tags for invalidation
export const CacheTags = {
  INVENTORY: 'inventory',
  ANALYTICS: 'analytics',
  USERS: 'users',
  SETTINGS: 'settings',
  REPORTS: 'reports',
  AUDIT: 'audit',
};

export default CacheManager;