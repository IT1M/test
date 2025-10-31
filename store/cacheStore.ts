// Cache Store - Search and AI response caching with expiration
// Requirements: 3.10, 12.1

import { create } from 'zustand';
import { Product } from '@/types/database';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

interface CacheState {
  searchCache: Map<string, CacheEntry<any>>;
  aiResponseCache: Map<string, CacheEntry<any>>;
  productCache: Map<string, CacheEntry<Product>>;
  
  // Actions
  setSearchCache: (key: string, value: any) => void;
  getSearchCache: (key: string) => any | null;
  
  setAIResponseCache: (key: string, value: any) => void;
  getAIResponseCache: (key: string) => any | null;
  
  setProductCache: (productId: string, product: Product) => void;
  getProductCache: (productId: string) => Product | null;
  
  clearCache: () => void;
  clearSearchCache: () => void;
  clearAIResponseCache: () => void;
  clearProductCache: () => void;
  
  getCacheStats: () => CacheStats;
}

interface CacheStats {
  searchCacheSize: number;
  aiResponseCacheSize: number;
  productCacheSize: number;
  totalSize: number;
}

const CACHE_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

export const useCacheStore = create<CacheState>((set, get) => ({
  searchCache: new Map(),
  aiResponseCache: new Map(),
  productCache: new Map(),

  setSearchCache: (key: string, value: any) => {
    const cache = new Map(get().searchCache);
    cache.set(key, {
      value,
      timestamp: Date.now(),
    });
    set({ searchCache: cache });
  },

  getSearchCache: (key: string) => {
    const cached = get().searchCache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache has expired
    const currentTime = Date.now();
    const elapsedTime = currentTime - cached.timestamp;
    
    if (elapsedTime > CACHE_EXPIRATION_TIME) {
      // Remove expired entry
      const cache = new Map(get().searchCache);
      cache.delete(key);
      set({ searchCache: cache });
      return null;
    }
    
    return cached.value;
  },

  setAIResponseCache: (key: string, value: any) => {
    const cache = new Map(get().aiResponseCache);
    cache.set(key, {
      value,
      timestamp: Date.now(),
    });
    set({ aiResponseCache: cache });
  },

  getAIResponseCache: (key: string) => {
    const cached = get().aiResponseCache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache has expired
    const currentTime = Date.now();
    const elapsedTime = currentTime - cached.timestamp;
    
    if (elapsedTime > CACHE_EXPIRATION_TIME) {
      // Remove expired entry
      const cache = new Map(get().aiResponseCache);
      cache.delete(key);
      set({ aiResponseCache: cache });
      return null;
    }
    
    return cached.value;
  },

  setProductCache: (productId: string, product: Product) => {
    const cache = new Map(get().productCache);
    cache.set(productId, {
      value: product,
      timestamp: Date.now(),
    });
    set({ productCache: cache });
  },

  getProductCache: (productId: string) => {
    const cached = get().productCache.get(productId);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache has expired
    const currentTime = Date.now();
    const elapsedTime = currentTime - cached.timestamp;
    
    if (elapsedTime > CACHE_EXPIRATION_TIME) {
      // Remove expired entry
      const cache = new Map(get().productCache);
      cache.delete(productId);
      set({ productCache: cache });
      return null;
    }
    
    return cached.value;
  },

  clearCache: () => {
    set({
      searchCache: new Map(),
      aiResponseCache: new Map(),
      productCache: new Map(),
    });
  },

  clearSearchCache: () => {
    set({ searchCache: new Map() });
  },

  clearAIResponseCache: () => {
    set({ aiResponseCache: new Map() });
  },

  clearProductCache: () => {
    set({ productCache: new Map() });
  },

  getCacheStats: () => {
    const state = get();
    return {
      searchCacheSize: state.searchCache.size,
      aiResponseCacheSize: state.aiResponseCache.size,
      productCacheSize: state.productCache.size,
      totalSize: state.searchCache.size + state.aiResponseCache.size + state.productCache.size,
    };
  },
}));

// Helper function to clean up expired cache entries
export const cleanupExpiredCache = () => {
  const state = useCacheStore.getState();
  const currentTime = Date.now();
  
  // Clean search cache
  const searchCache = new Map(state.searchCache);
  for (const [key, entry] of searchCache.entries()) {
    if (currentTime - entry.timestamp > CACHE_EXPIRATION_TIME) {
      searchCache.delete(key);
    }
  }
  
  // Clean AI response cache
  const aiResponseCache = new Map(state.aiResponseCache);
  for (const [key, entry] of aiResponseCache.entries()) {
    if (currentTime - entry.timestamp > CACHE_EXPIRATION_TIME) {
      aiResponseCache.delete(key);
    }
  }
  
  // Clean product cache
  const productCache = new Map(state.productCache);
  for (const [key, entry] of productCache.entries()) {
    if (currentTime - entry.timestamp > CACHE_EXPIRATION_TIME) {
      productCache.delete(key);
    }
  }
  
  useCacheStore.setState({
    searchCache,
    aiResponseCache,
    productCache,
  });
};

// Auto-cleanup expired cache entries - can be called in app initialization
export const initializeCacheCleanup = () => {
  // Clean up expired cache every minute
  setInterval(() => {
    cleanupExpiredCache();
  }, 60000); // Run every minute
};

// Helper to generate cache keys
export const generateCacheKey = (prefix: string, params: Record<string, any>): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  
  return `${prefix}:${sortedParams}`;
};
