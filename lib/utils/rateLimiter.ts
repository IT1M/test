/**
 * Global Rate Limiter
 * Manages rate limiting across different services and endpoints
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  queueRequests?: boolean;
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  queuePosition?: number;
}

class RateLimiterInstance {
  private requests: Map<string, number[]> = new Map();
  private queue: Map<string, Array<() => void>> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  /**
   * Register a rate limit configuration for a service
   */
  register(service: string, config: RateLimitConfig): void {
    this.configs.set(service, config);
  }

  /**
   * Check if a request is allowed
   */
  check(service: string): RateLimitStatus {
    const config = this.configs.get(service);
    if (!config) {
      // If no config, allow by default
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: new Date(Date.now() + 60000),
      };
    }

    const now = Date.now();
    const requests = this.requests.get(service) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter(
      (time) => now - time < config.windowMs
    );

    const remaining = Math.max(0, config.maxRequests - validRequests.length);
    const allowed = validRequests.length < config.maxRequests;

    // Calculate reset time
    const oldestRequest = validRequests[0] || now;
    const resetTime = new Date(oldestRequest + config.windowMs);

    return {
      allowed,
      remaining,
      resetTime,
    };
  }

  /**
   * Acquire a rate limit token
   */
  async acquire(service: string): Promise<void> {
    const config = this.configs.get(service);
    if (!config) {
      return Promise.resolve();
    }

    const status = this.check(service);

    if (status.allowed) {
      // Add request to tracking
      const requests = this.requests.get(service) || [];
      requests.push(Date.now());
      this.requests.set(service, requests);
      return Promise.resolve();
    }

    // If queueing is enabled, queue the request
    if (config.queueRequests) {
      return new Promise<void>((resolve) => {
        const queue = this.queue.get(service) || [];
        queue.push(resolve);
        this.queue.set(service, queue);
        this.processQueue(service);
      });
    }

    // Otherwise, throw an error
    throw new Error(
      `Rate limit exceeded for ${service}. Please try again in ${Math.ceil(
        (status.resetTime.getTime() - Date.now()) / 1000
      )} seconds.`
    );
  }

  /**
   * Process queued requests
   */
  private processQueue(service: string): void {
    const config = this.configs.get(service);
    if (!config) return;

    const queue = this.queue.get(service) || [];
    if (queue.length === 0) return;

    const status = this.check(service);

    while (status.allowed && queue.length > 0) {
      const resolve = queue.shift();
      if (resolve) {
        // Add request to tracking
        const requests = this.requests.get(service) || [];
        requests.push(Date.now());
        this.requests.set(service, requests);
        resolve();
      }
    }

    // Schedule next queue processing
    if (queue.length > 0) {
      setTimeout(() => this.processQueue(service), 1000);
    }
  }

  /**
   * Get queue length for a service
   */
  getQueueLength(service: string): number {
    const queue = this.queue.get(service) || [];
    return queue.length;
  }

  /**
   * Get current usage for a service
   */
  getUsage(service: string): {
    current: number;
    max: number;
    percentage: number;
  } {
    const config = this.configs.get(service);
    if (!config) {
      return { current: 0, max: Infinity, percentage: 0 };
    }

    const now = Date.now();
    const requests = this.requests.get(service) || [];
    const validRequests = requests.filter(
      (time) => now - time < config.windowMs
    );

    return {
      current: validRequests.length,
      max: config.maxRequests,
      percentage: (validRequests.length / config.maxRequests) * 100,
    };
  }

  /**
   * Reset rate limit for a service
   */
  reset(service: string): void {
    this.requests.delete(service);
    this.queue.delete(service);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.requests.clear();
    this.queue.clear();
  }

  /**
   * Get all registered services
   */
  getServices(): string[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Get statistics for all services
   */
  getStats(): Record<
    string,
    {
      usage: {
        current: number;
        max: number;
        percentage: number;
      };
      queueLength: number;
      status: RateLimitStatus;
    }
  > {
    const stats: Record<string, any> = {};

    for (const service of this.getServices()) {
      stats[service] = {
        usage: this.getUsage(service),
        queueLength: this.getQueueLength(service),
        status: this.check(service),
      };
    }

    return stats;
  }
}

// Create singleton instance
export const RateLimiter = new RateLimiterInstance();

// Register default rate limits
RateLimiter.register('gemini', {
  maxRequests: 60,
  windowMs: 60000, // 1 minute
  queueRequests: true,
});

RateLimiter.register('api', {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  queueRequests: false,
});

/**
 * Decorator to apply rate limiting to a function
 */
export function withRateLimit(service: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      await RateLimiter.acquire(service);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Wrapper function to apply rate limiting
 */
export async function withRateLimitCheck<T>(
  service: string,
  fn: () => Promise<T>
): Promise<T> {
  await RateLimiter.acquire(service);
  return fn();
}
