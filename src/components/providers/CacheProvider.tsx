"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CacheManager, getCacheManager, CacheKeys, CacheTags } from '@/utils/cache';

interface CacheContextType {
  cacheManager: CacheManager;
  stats: {
    memory: {
      hits: number;
      misses: number;
      hitRate: number;
      size: number;
    };
    redis: {
      hits: number;
      misses: number;
      hitRate: number;
      size: number;
    };
    combined: {
      hits: number;
      misses: number;
      hitRate: number;
      size: number;
    };
  };
  actions: {
    clearCache: () => Promise<void>;
    invalidateByTags: (tags: string[]) => Promise<void>;
    warmCache: () => Promise<void>;
    refreshStats: () => void;
  };
}

const CacheContext = createContext<CacheContextType | null>(null);

export function useCache() {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
}

interface CacheProviderProps {
  children: ReactNode;
}

export function CacheProvider({ children }: CacheProviderProps) {
  const [cacheManager] = useState(() => getCacheManager());
  const [stats, setStats] = useState({
    memory: { hits: 0, misses: 0, hitRate: 0, size: 0 },
    redis: { hits: 0, misses: 0, hitRate: 0, size: 0 },
    combined: { hits: 0, misses: 0, hitRate: 0, size: 0 },
  });

  // Refresh stats periodically
  useEffect(() => {
    const refreshStats = () => {
      const currentStats = cacheManager.getStats();
      setStats(currentStats);
    };

    // Initial stats
    refreshStats();

    // Refresh every 30 seconds
    const interval = setInterval(refreshStats, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [cacheManager]);

  // Warm cache on initialization
  useEffect(() => {
    const warmInitialCache = async () => {
      try {
        await cacheManager.warmCache([
          {
            key: CacheKeys.settings('app'),
            fetcher: async () => {
              // Fetch app settings
              const response = await fetch('/api/settings/app');
              return response.ok ? response.json() : null;
            },
            config: { ttl: 3600, tags: [CacheTags.SETTINGS] }, // 1 hour
          },
          {
            key: CacheKeys.analytics(),
            fetcher: async () => {
              // Fetch basic analytics
              const response = await fetch('/api/analytics/summary');
              return response.ok ? response.json() : null;
            },
            config: { ttl: 300, tags: [CacheTags.ANALYTICS] }, // 5 minutes
          },
        ]);
      } catch (error) {
        console.error('[CacheProvider] Failed to warm cache:', error);
      }
    };

    warmInitialCache();
  }, [cacheManager]);

  const clearCache = async () => {
    try {
      await cacheManager.clear();
      setStats({
        memory: { hits: 0, misses: 0, hitRate: 0, size: 0 },
        redis: { hits: 0, misses: 0, hitRate: 0, size: 0 },
        combined: { hits: 0, misses: 0, hitRate: 0, size: 0 },
      });
      console.log('[CacheProvider] Cache cleared successfully');
    } catch (error) {
      console.error('[CacheProvider] Failed to clear cache:', error);
      throw error;
    }
  };

  const invalidateByTags = async (tags: string[]) => {
    try {
      await cacheManager.invalidateByTags(tags);
      // Refresh stats after invalidation
      const currentStats = cacheManager.getStats();
      setStats(currentStats);
      console.log(`[CacheProvider] Invalidated cache by tags: ${tags.join(', ')}`);
    } catch (error) {
      console.error('[CacheProvider] Failed to invalidate cache by tags:', error);
      throw error;
    }
  };

  const warmCache = async () => {
    try {
      await cacheManager.warmCache([
        {
          key: CacheKeys.inventory({}),
          fetcher: async () => {
            const response = await fetch('/api/inventory?limit=50');
            return response.ok ? response.json() : null;
          },
          config: { ttl: 300, tags: [CacheTags.INVENTORY] },
        },
        {
          key: CacheKeys.analytics(),
          fetcher: async () => {
            const response = await fetch('/api/analytics/summary');
            return response.ok ? response.json() : null;
          },
          config: { ttl: 300, tags: [CacheTags.ANALYTICS] },
        },
        {
          key: CacheKeys.reports('recent', 'week'),
          fetcher: async () => {
            const response = await fetch('/api/reports?type=recent&period=week');
            return response.ok ? response.json() : null;
          },
          config: { ttl: 600, tags: [CacheTags.REPORTS] },
        },
      ]);
      
      // Refresh stats after warming
      const currentStats = cacheManager.getStats();
      setStats(currentStats);
      console.log('[CacheProvider] Cache warmed successfully');
    } catch (error) {
      console.error('[CacheProvider] Failed to warm cache:', error);
      throw error;
    }
  };

  const refreshStats = () => {
    const currentStats = cacheManager.getStats();
    setStats(currentStats);
  };

  const contextValue: CacheContextType = {
    cacheManager,
    stats,
    actions: {
      clearCache,
      invalidateByTags,
      warmCache,
      refreshStats,
    },
  };

  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  );
}

// Hook for cached API calls
export function useCachedFetch<T>(
  url: string,
  options: {
    cacheKey?: string;
    ttl?: number;
    tags?: string[];
    enabled?: boolean;
    staleWhileRevalidate?: boolean;
  } = {}
) {
  const { cacheManager } = useCache();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    cacheKey = url,
    ttl = 300,
    tags = [],
    enabled = true,
    staleWhileRevalidate = false,
  } = options;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get from cache first
        const cachedData = await cacheManager.get<T>(cacheKey);
        
        if (cachedData !== null) {
          setData(cachedData);
          setLoading(false);
          
          // If stale-while-revalidate, fetch fresh data in background
          if (staleWhileRevalidate) {
            fetchFreshData();
          }
          return;
        }

        // Cache miss, fetch fresh data
        await fetchFreshData();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLoading(false);
      }
    };

    const fetchFreshData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const freshData = await response.json();
        
        // Cache the fresh data
        await cacheManager.set(cacheKey, freshData, { ttl, tags });
        
        setData(freshData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLoading(false);
      }
    };

    fetchData();
  }, [url, cacheKey, ttl, enabled, staleWhileRevalidate, cacheManager]);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const freshData = await response.json();
      
      // Update cache
      await cacheManager.set(cacheKey, freshData, { ttl, tags });
      
      setData(freshData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const invalidate = async () => {
    await cacheManager.delete(cacheKey);
    await refetch();
  };

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
  };
}

// Hook for cache statistics monitoring
export function useCacheStats() {
  const { stats, actions } = useCache();
  
  const getCacheHealth = () => {
    const { combined } = stats;
    
    if (combined.hitRate >= 80) return 'excellent';
    if (combined.hitRate >= 60) return 'good';
    if (combined.hitRate >= 40) return 'fair';
    return 'poor';
  };

  const getRecommendations = () => {
    const recommendations: string[] = [];
    const { combined } = stats;
    
    if (combined.hitRate < 50) {
      recommendations.push('Consider increasing cache TTL for frequently accessed data');
    }
    
    if (combined.size > 1000) {
      recommendations.push('Cache size is large, consider implementing cache eviction policies');
    }
    
    if (combined.misses > combined.hits) {
      recommendations.push('High cache miss rate, review caching strategy');
    }
    
    return recommendations;
  };

  return {
    stats,
    health: getCacheHealth(),
    recommendations: getRecommendations(),
    actions,
  };
}

export default CacheProvider;