// Gemini AI Service Client
// Base client for interacting with Google's Gemini API

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { db } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Rate limiter for API calls
 */
class RateLimiter {
  private queue: Array<() => void> = [];
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(requestsPerMinute: number) {
    this.maxTokens = requestsPerMinute;
    this.tokens = requestsPerMinute;
    this.lastRefill = Date.now();
    this.refillRate = requestsPerMinute / 60000; // convert to per millisecond
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  async acquire(): Promise<void> {
    this.refillTokens();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return Promise.resolve();
    }

    // Wait until a token is available
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.queue.length === 0) return;

    this.refillTokens();

    while (this.tokens >= 1 && this.queue.length > 0) {
      this.tokens -= 1;
      const resolve = this.queue.shift();
      if (resolve) resolve();
    }

    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }
}

/**
 * Cache entry interface
 */
interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

/**
 * Gemini Service Configuration
 */
interface GeminiServiceConfig {
  apiKey: string;
  rateLimitPerMinute?: number;
  cacheDuration?: number; // in milliseconds
  enableRetry?: boolean;
  maxRetries?: number;
}

/**
 * Main Gemini Service Class
 * Handles all interactions with Google's Gemini AI API
 */
export class GeminiService {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private visionModel: GenerativeModel;
  private cache: Map<string, CacheEntry>;
  private rateLimiter: RateLimiter;
  private config: Required<GeminiServiceConfig>;

  constructor(config: GeminiServiceConfig) {
    this.config = {
      apiKey: config.apiKey,
      rateLimitPerMinute: config.rateLimitPerMinute || 60,
      cacheDuration: config.cacheDuration || 5 * 60 * 1000, // 5 minutes default
      enableRetry: config.enableRetry !== false,
      maxRetries: config.maxRetries || 3,
    };

    this.client = new GoogleGenerativeAI(this.config.apiKey);
    this.model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    this.visionModel = this.client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    this.cache = new Map();
    this.rateLimiter = new RateLimiter(this.config.rateLimitPerMinute);
  }

  /**
   * Generate content using Gemini Pro model
   */
  async generateContent(prompt: string, useCache: boolean = true): Promise<string> {
    // Check cache first
    if (useCache) {
      const cached = this.getFromCache(prompt);
      if (cached !== null) {
        await this.logAPICall('generateContent', 'cache_hit', prompt.length, cached.length);
        return cached;
      }
    }

    // Rate limiting
    await this.rateLimiter.acquire();

    try {
      const result = await this.retryWithBackoff(async () => {
        const response = await this.model.generateContent(prompt);
        return response.response.text();
      });

      // Cache the response
      if (useCache) {
        this.setCache(prompt, result);
      }

      // Log successful API call
      await this.logAPICall('generateContent', 'success', prompt.length, result.length);

      return result;
    } catch (error) {
      await this.logError('generateContent', error as Error, { prompt: prompt.substring(0, 100) });
      throw error;
    }
  }

  /**
   * Analyze image using Gemini Pro Vision model
   */
  async analyzeImage(imageData: string, prompt: string, mimeType: string = 'image/jpeg'): Promise<string> {
    // Rate limiting
    await this.rateLimiter.acquire();

    try {
      const result = await this.retryWithBackoff(async () => {
        const response = await this.visionModel.generateContent([
          prompt,
          {
            inlineData: {
              data: imageData,
              mimeType: mimeType,
            },
          },
        ]);
        return response.response.text();
      });

      // Log successful API call
      await this.logAPICall('analyzeImage', 'success', imageData.length + prompt.length, result.length);

      return result;
    } catch (error) {
      await this.logError('analyzeImage', error as Error, { promptLength: prompt.length });
      throw error;
    }
  }

  /**
   * Generate structured JSON response
   */
  async generateJSON<T = any>(prompt: string, useCache: boolean = true): Promise<T> {
    const response = await this.generateContent(prompt, useCache);
    
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/```\s*([\s\S]*?)\s*```/);
      
      const jsonString = jsonMatch ? jsonMatch[1] : response;
      return JSON.parse(jsonString.trim());
    } catch (error) {
      // If parsing fails, try to parse the entire response
      try {
        return JSON.parse(response);
      } catch {
        throw new Error(`Failed to parse JSON response: ${response.substring(0, 200)}`);
      }
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retryCount: number = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (!this.config.enableRetry || retryCount >= this.config.maxRetries) {
        throw error;
      }

      // Check if error is retryable
      const isRetryable = this.isRetryableError(error);
      if (!isRetryable) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));

      return this.retryWithBackoff(fn, retryCount + 1);
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'RATE_LIMIT_EXCEEDED',
      'TIMEOUT',
      'NETWORK_ERROR',
      'SERVICE_UNAVAILABLE',
    ];

    const errorMessage = error?.message || error?.toString() || '';
    return retryableErrors.some(err => errorMessage.includes(err));
  }

  /**
   * Get data from cache
   */
  private getFromCache(key: string): string | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: string): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.config.cacheDuration,
    };

    this.cache.set(key, entry);

    // Clean up expired entries periodically
    if (this.cache.size > 100) {
      this.cleanupCache();
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: number } {
    let totalSize = 0;
    this.cache.forEach(entry => {
      totalSize += entry.data.length;
    });

    return {
      size: totalSize,
      entries: this.cache.size,
    };
  }

  /**
   * Log API call to system logs
   */
  private async logAPICall(
    action: string,
    status: string,
    inputSize: number,
    outputSize: number
  ): Promise<void> {
    try {
      await db.systemLogs.add({
        id: uuidv4(),
        action: `gemini_${action}`,
        entityType: 'gemini_api',
        details: JSON.stringify({
          status,
          inputSize,
          outputSize,
          timestamp: new Date().toISOString(),
        }),
        userId: 'system',
        timestamp: new Date(),
        status: status === 'success' || status === 'cache_hit' ? 'success' : 'error',
      });
    } catch (error) {
      // Silently fail logging to avoid breaking the main flow
      console.error('Failed to log API call:', error);
    }
  }

  /**
   * Log error to system logs
   */
  private async logError(action: string, error: Error, context?: any): Promise<void> {
    try {
      await db.systemLogs.add({
        id: uuidv4(),
        action: `gemini_${action}_error`,
        entityType: 'gemini_api',
        details: JSON.stringify({
          error: error.message,
          context,
          timestamp: new Date().toISOString(),
        }),
        userId: 'system',
        timestamp: new Date(),
        status: 'error',
        errorMessage: error.stack,
      });
    } catch (logError) {
      // Silently fail logging to avoid breaking the main flow
      console.error('Failed to log error:', logError);
    }
  }

  /**
   * Test connection to Gemini API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.generateContent('Hello, respond with "OK"', false);
      return response.toLowerCase().includes('ok');
    } catch (error) {
      return false;
    }
  }

  /**
   * Get API usage statistics from logs
   */
  async getUsageStats(days: number = 30): Promise<{
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    cacheHits: number;
    averageResponseTime: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await db.systemLogs
      .where('entityType')
      .equals('gemini_api')
      .and(log => log.timestamp >= startDate)
      .toArray();

    const stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      cacheHits: 0,
      averageResponseTime: 0,
    };

    logs.forEach(log => {
      const details = JSON.parse(log.details);
      
      if (details.status === 'cache_hit') {
        stats.cacheHits++;
      } else if (log.status === 'success') {
        stats.successfulCalls++;
        stats.totalCalls++;
      } else if (log.status === 'error') {
        stats.failedCalls++;
        stats.totalCalls++;
      }
    });

    return stats;
  }
}

/**
 * Create and export a singleton instance
 * This will be initialized with the API key from environment variables
 */
let geminiServiceInstance: GeminiService | null = null;

export function getGeminiService(): GeminiService {
  if (!geminiServiceInstance) {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_GEMINI_API_KEY environment variable is not set');
    }

    geminiServiceInstance = new GeminiService({
      apiKey,
      rateLimitPerMinute: 60,
      cacheDuration: 5 * 60 * 1000,
      enableRetry: true,
      maxRetries: 3,
    });
  }

  return geminiServiceInstance;
}

// Export for testing purposes
export function resetGeminiService(): void {
  geminiServiceInstance = null;
}
