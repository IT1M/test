/**
 * Rate Limiting Utility
 * Implements token bucket algorithm for rate limiting
 */

interface RateLimitStore {
  tokens: number;
  lastRefill: number;
}

// In-memory store for rate limiting (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitStore>();

interface RateLimitConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check if request is within rate limit
 * @param identifier - Unique identifier (user ID, IP address, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result with headers info
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 } // 100 req/min default
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  // Get or initialize rate limit data
  let rateLimitData = rateLimitStore.get(key);

  if (!rateLimitData) {
    rateLimitData = {
      tokens: config.maxRequests,
      lastRefill: now,
    };
    rateLimitStore.set(key, rateLimitData);
  }

  // Calculate tokens to add based on time elapsed
  const timeSinceLastRefill = now - rateLimitData.lastRefill;
  const tokensToAdd = Math.floor(
    (timeSinceLastRefill / config.windowMs) * config.maxRequests
  );

  if (tokensToAdd > 0) {
    rateLimitData.tokens = Math.min(
      config.maxRequests,
      rateLimitData.tokens + tokensToAdd
    );
    rateLimitData.lastRefill = now;
  }

  // Check if request can proceed
  const success = rateLimitData.tokens > 0;

  if (success) {
    rateLimitData.tokens -= 1;
  }

  // Calculate reset time
  const resetTime = rateLimitData.lastRefill + config.windowMs;

  return {
    success,
    limit: config.maxRequests,
    remaining: Math.max(0, rateLimitData.tokens),
    reset: Math.ceil(resetTime / 1000), // Unix timestamp in seconds
  };
}

/**
 * Clear rate limit data for an identifier
 * @param identifier - Unique identifier to clear
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Clean up old entries from rate limit store
 * Should be called periodically to prevent memory leaks
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  const maxAge = 3600000; // 1 hour

  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.lastRefill > maxAge) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 10 minutes
if (typeof window === 'undefined') {
  // Only run on server
  setInterval(cleanupRateLimitStore, 600000);
}
