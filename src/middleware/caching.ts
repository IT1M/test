// HTTP caching middleware for API routes

import { NextRequest, NextResponse } from 'next/server';
import { getCacheManager, CacheKeys, CacheTags } from '@/utils/cache';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  vary?: string[]; // Vary headers
  staleWhileRevalidate?: number; // SWR time in seconds
  mustRevalidate?: boolean; // Force revalidation
  private?: boolean; // Private cache (user-specific)
  etag?: boolean; // Generate ETag
}

interface CacheConfig {
  [path: string]: CacheOptions;
}

// Default cache configuration for different API routes
const defaultCacheConfig: CacheConfig = {
  '/api/inventory': {
    ttl: 300, // 5 minutes
    tags: [CacheTags.INVENTORY],
    staleWhileRevalidate: 60,
    vary: ['Authorization'],
  },
  '/api/analytics': {
    ttl: 600, // 10 minutes
    tags: [CacheTags.ANALYTICS],
    staleWhileRevalidate: 120,
  },
  '/api/reports': {
    ttl: 1800, // 30 minutes
    tags: [CacheTags.REPORTS],
    staleWhileRevalidate: 300,
    private: true,
  },
  '/api/settings': {
    ttl: 3600, // 1 hour
    tags: [CacheTags.SETTINGS],
    staleWhileRevalidate: 600,
  },
  '/api/users': {
    ttl: 900, // 15 minutes
    tags: [CacheTags.USERS],
    private: true,
    vary: ['Authorization'],
  },
  '/api/audit': {
    ttl: 1800, // 30 minutes
    tags: [CacheTags.AUDIT],
    private: true,
    vary: ['Authorization'],
  },
};

// Generate cache key from request
function generateCacheKey(request: NextRequest): string {
  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;
  const searchParams = url.searchParams.toString();
  
  // Include user ID for private caches
  const userId = request.headers.get('x-user-id') || 'anonymous';
  
  return `http:${method}:${pathname}:${searchParams}:${userId}`;
}

// Generate ETag from response data
function generateETag(data: any): string {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  // Simple hash function (in production, use a proper hash like SHA-256)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `"${Math.abs(hash).toString(16)}"`;
}

// Check if request has conditional headers
function hasConditionalHeaders(request: NextRequest): boolean {
  return !!(
    request.headers.get('if-none-match') ||
    request.headers.get('if-modified-since')
  );
}

// Check if response should be cached
function shouldCache(request: NextRequest, response: NextResponse): boolean {
  // Don't cache non-GET requests
  if (request.method !== 'GET') return false;
  
  // Don't cache error responses
  if (response.status >= 400) return false;
  
  // Don't cache if explicitly disabled
  const cacheControl = response.headers.get('cache-control');
  if (cacheControl?.includes('no-cache') || cacheControl?.includes('no-store')) {
    return false;
  }
  
  return true;
}

// Apply cache headers to response
function applyCacheHeaders(
  response: NextResponse,
  options: CacheOptions,
  etag?: string
): NextResponse {
  const headers = new Headers(response.headers);
  
  // Set Cache-Control header
  const cacheControlParts: string[] = [];
  
  if (options.private) {
    cacheControlParts.push('private');
  } else {
    cacheControlParts.push('public');
  }
  
  if (options.ttl) {
    cacheControlParts.push(`max-age=${options.ttl}`);
  }
  
  if (options.staleWhileRevalidate) {
    cacheControlParts.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }
  
  if (options.mustRevalidate) {
    cacheControlParts.push('must-revalidate');
  }
  
  headers.set('Cache-Control', cacheControlParts.join(', '));
  
  // Set Vary header
  if (options.vary?.length) {
    headers.set('Vary', options.vary.join(', '));
  }
  
  // Set ETag
  if (etag) {
    headers.set('ETag', etag);
  }
  
  // Set Last-Modified
  headers.set('Last-Modified', new Date().toUTCString());
  
  // Set custom cache tags header for debugging
  if (options.tags?.length) {
    headers.set('X-Cache-Tags', options.tags.join(', '));
  }
  
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Main caching middleware
export function withCache(options: CacheOptions = {}) {
  return function cacheMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async function cachedHandler(request: NextRequest): Promise<NextResponse> {
      const cacheManager = getCacheManager();
      const cacheKey = generateCacheKey(request);
      const pathname = new URL(request.url).pathname;
      
      // Get cache configuration
      const config = {
        ...defaultCacheConfig[pathname],
        ...options,
      };
      
      // Skip caching for non-GET requests
      if (request.method !== 'GET') {
        return handler(request);
      }
      
      try {
        // Check for cached response
        const cachedResponse = await cacheManager.get<{
          status: number;
          statusText: string;
          headers: Record<string, string>;
          body: any;
          etag: string;
          timestamp: number;
        }>(cacheKey);
        
        if (cachedResponse) {
          const { status, statusText, headers, body, etag, timestamp } = cachedResponse;
          
          // Check conditional headers
          const ifNoneMatch = request.headers.get('if-none-match');
          if (ifNoneMatch && ifNoneMatch === etag) {
            return new NextResponse(null, {
              status: 304,
              headers: {
                'ETag': etag,
                'X-Cache': 'HIT',
                'X-Cache-Status': 'not-modified',
              },
            });
          }
          
          // Check if still fresh
          const age = (Date.now() - timestamp) / 1000;
          const isStale = config.ttl ? age > config.ttl : false;
          
          if (!isStale || (config.staleWhileRevalidate && age < config.ttl! + config.staleWhileRevalidate)) {
            console.log(`[Cache] Cache hit for: ${cacheKey}`);
            
            // Return cached response
            const response = new NextResponse(JSON.stringify(body), {
              status,
              statusText,
              headers: {
                ...headers,
                'Content-Type': 'application/json',
                'X-Cache': 'HIT',
                'X-Cache-Age': Math.floor(age).toString(),
              },
            });
            
            // If stale, trigger background revalidation
            if (isStale && config.staleWhileRevalidate) {
              console.log(`[Cache] Stale response, revalidating in background: ${cacheKey}`);
              // Don't await - let it run in background
              revalidateInBackground(handler, request, cacheKey, config);
            }
            
            return response;
          }
        }
        
        console.log(`[Cache] Cache miss for: ${cacheKey}`);
        
        // Execute original handler
        const response = await handler(request);
        
        // Cache the response if appropriate
        if (shouldCache(request, response)) {
          const responseBody = await response.text();
          let parsedBody;
          
          try {
            parsedBody = JSON.parse(responseBody);
          } catch {
            parsedBody = responseBody;
          }
          
          const etag = config.etag ? generateETag(parsedBody) : undefined;
          
          // Store in cache
          const cacheData = {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: parsedBody,
            etag: etag || '',
            timestamp: Date.now(),
          };
          
          await cacheManager.set(cacheKey, cacheData, {
            ttl: config.ttl || 300,
            tags: config.tags,
          });
          
          // Create new response with cache headers
          const cachedResponse = new NextResponse(responseBody, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
          
          return applyCacheHeaders(cachedResponse, config, etag);
        }
        
        return response;
      } catch (error) {
        console.error('[Cache] Caching middleware error:', error);
        // Fallback to original handler on cache errors
        return handler(request);
      }
    };
  };
}

// Background revalidation
async function revalidateInBackground(
  handler: (request: NextRequest) => Promise<NextResponse>,
  request: NextRequest,
  cacheKey: string,
  config: CacheOptions
): Promise<void> {
  try {
    const cacheManager = getCacheManager();
    const response = await handler(request);
    
    if (shouldCache(request, response)) {
      const responseBody = await response.text();
      let parsedBody;
      
      try {
        parsedBody = JSON.parse(responseBody);
      } catch {
        parsedBody = responseBody;
      }
      
      const etag = config.etag ? generateETag(parsedBody) : undefined;
      
      const cacheData = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: parsedBody,
        etag: etag || '',
        timestamp: Date.now(),
      };
      
      await cacheManager.set(cacheKey, cacheData, {
        ttl: config.ttl || 300,
        tags: config.tags,
      });
      
      console.log(`[Cache] Background revalidation completed for: ${cacheKey}`);
    }
  } catch (error) {
    console.error('[Cache] Background revalidation failed:', error);
  }
}

// Cache invalidation utilities
export async function invalidateCache(tags: string[]): Promise<void> {
  const cacheManager = getCacheManager();
  await cacheManager.invalidateByTags(tags);
  console.log(`[Cache] Invalidated cache for tags: ${tags.join(', ')}`);
}

export async function invalidateCacheByPattern(pattern: string): Promise<void> {
  // This would require a more sophisticated cache implementation
  // For now, we'll clear all cache
  const cacheManager = getCacheManager();
  await cacheManager.clear();
  console.log(`[Cache] Cleared all cache (pattern: ${pattern})`);
}

// Preload cache utilities
export async function preloadCache(routes: Array<{
  path: string;
  params?: Record<string, string>;
}>): Promise<void> {
  const cacheManager = getCacheManager();
  
  const entries = routes.map(({ path, params }) => ({
    key: `preload:${path}:${JSON.stringify(params || {})}`,
    fetcher: async () => {
      const url = new URL(path, process.env.NEXTAUTH_URL || 'http://localhost:3000');
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
      }
      
      const response = await fetch(url.toString());
      return response.ok ? response.json() : null;
    },
    config: { ttl: 300 },
  }));
  
  await cacheManager.warmCache(entries);
}

export default withCache;