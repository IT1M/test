// AI Control Center Configuration Service
// Manages AI Control Center settings and provides configuration to AI services

import { db } from '@/lib/db/schema';

/**
 * AI Control Center Configuration
 */
export interface AIControlConfig {
  // Activity Logging
  enableActivityLogging: boolean;
  logRetentionDays: number;
  
  // PHI/PII Protection
  enablePHISanitization: boolean;
  autoRedactPHI: boolean;
  
  // Rate Limiting
  rateLimitPerMinute: number;
  enableRateLimiting: boolean;
  
  // Cost Tracking
  enableCostTracking: boolean;
  costPerInputToken: number;
  costPerOutputToken: number;
  monthlyCostLimit?: number;
  
  // Performance Monitoring
  enablePerformanceMetrics: boolean;
  performanceThresholds: {
    maxResponseTime: number; // milliseconds
    minConfidenceScore: number; // 0-100
    maxErrorRate: number; // percentage
  };
  
  // Automation & Alerts
  enableAutomationTriggers: boolean;
  enableAlerts: boolean;
  alertChannels: Array<'in-app' | 'email' | 'sms' | 'webhook'>;
  
  // Caching
  enableCaching: boolean;
  cacheDuration: number; // milliseconds
  
  // Retry Logic
  enableRetry: boolean;
  maxRetries: number;
  
  // Model Configuration
  defaultModel: string;
  enabledModels: string[];
}

/**
 * Default AI Control Center Configuration
 */
const DEFAULT_CONFIG: AIControlConfig = {
  enableActivityLogging: true,
  logRetentionDays: 90,
  
  enablePHISanitization: true,
  autoRedactPHI: true,
  
  rateLimitPerMinute: 60,
  enableRateLimiting: true,
  
  enableCostTracking: true,
  costPerInputToken: 0.00001, // $0.01 per 1K tokens
  costPerOutputToken: 0.00003, // $0.03 per 1K tokens
  monthlyCostLimit: 1000, // $1000
  
  enablePerformanceMetrics: true,
  performanceThresholds: {
    maxResponseTime: 30000, // 30 seconds
    minConfidenceScore: 50,
    maxErrorRate: 10, // 10%
  },
  
  enableAutomationTriggers: true,
  enableAlerts: true,
  alertChannels: ['in-app'],
  
  enableCaching: true,
  cacheDuration: 5 * 60 * 1000, // 5 minutes
  
  enableRetry: true,
  maxRetries: 3,
  
  defaultModel: 'gemini-2.0-flash-exp',
  enabledModels: ['gemini-2.0-flash-exp', 'gemini-2.0-flash-exp-vision'],
};

/**
 * AI Control Configuration Manager
 */
export class AIControlConfigManager {
  private static config: AIControlConfig = DEFAULT_CONFIG;
  private static configKey = 'ai-control-config';

  /**
   * Load configuration from storage
   */
  static async loadConfig(): Promise<AIControlConfig> {
    try {
      // Try to load from localStorage first
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.configKey);
        if (stored) {
          this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
          return this.config;
        }
      }

      // Try to load from database
      const settings = await db.systemLogs
        .where('entityType')
        .equals('ai-control-config')
        .first();

      if (settings && settings.details) {
        const parsed = typeof settings.details === 'string' 
          ? JSON.parse(settings.details) 
          : settings.details;
        this.config = { ...DEFAULT_CONFIG, ...parsed };
      }

      return this.config;
    } catch (error) {
      console.error('Failed to load AI Control config:', error);
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Save configuration to storage
   */
  static async saveConfig(config: Partial<AIControlConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...config };

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.configKey, JSON.stringify(this.config));
      }

      // Save to database
      await db.systemLogs.add({
        id: `ai-control-config-${Date.now()}`,
        action: 'config-update',
        entityType: 'ai-control-config',
        details: JSON.stringify(this.config),
        userId: 'system',
        timestamp: new Date(),
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to save AI Control config:', error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  static getConfig(): AIControlConfig {
    return { ...this.config };
  }

  /**
   * Update specific configuration setting
   */
  static async updateSetting<K extends keyof AIControlConfig>(
    key: K,
    value: AIControlConfig[K]
  ): Promise<void> {
    const update: Partial<AIControlConfig> = {};
    update[key] = value;
    await this.saveConfig(update);
  }

  /**
   * Reset configuration to defaults
   */
  static async resetToDefaults(): Promise<void> {
    await this.saveConfig(DEFAULT_CONFIG);
  }

  /**
   * Check if a feature is enabled
   */
  static isFeatureEnabled(feature: keyof AIControlConfig): boolean {
    const value = this.config[feature];
    return typeof value === 'boolean' ? value : false;
  }

  /**
   * Get rate limit setting
   */
  static getRateLimit(): number {
    return this.config.enableRateLimiting ? this.config.rateLimitPerMinute : Infinity;
  }

  /**
   * Get cost tracking settings
   */
  static getCostSettings(): {
    enabled: boolean;
    costPerInputToken: number;
    costPerOutputToken: number;
    monthlyCostLimit?: number;
  } {
    return {
      enabled: this.config.enableCostTracking,
      costPerInputToken: this.config.costPerInputToken,
      costPerOutputToken: this.config.costPerOutputToken,
      monthlyCostLimit: this.config.monthlyCostLimit,
    };
  }

  /**
   * Get performance thresholds
   */
  static getPerformanceThresholds(): AIControlConfig['performanceThresholds'] {
    return { ...this.config.performanceThresholds };
  }

  /**
   * Check if monthly cost limit is exceeded
   */
  static async checkCostLimit(): Promise<{
    exceeded: boolean;
    currentCost: number;
    limit?: number;
  }> {
    if (!this.config.enableCostTracking || !this.config.monthlyCostLimit) {
      return { exceeded: false, currentCost: 0 };
    }

    try {
      // Get logs from current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const logs = await db.aiActivityLogs
        .where('timestamp')
        .above(startOfMonth)
        .toArray();

      const currentCost = logs.reduce((sum, log) => sum + (log.estimatedCost || 0), 0);

      return {
        exceeded: currentCost >= this.config.monthlyCostLimit,
        currentCost,
        limit: this.config.monthlyCostLimit,
      };
    } catch (error) {
      console.error('Failed to check cost limit:', error);
      return { exceeded: false, currentCost: 0, limit: this.config.monthlyCostLimit };
    }
  }

  /**
   * Export configuration
   */
  static exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration
   */
  static async importConfig(configJson: string): Promise<void> {
    try {
      const imported = JSON.parse(configJson);
      await this.saveConfig(imported);
    } catch (error) {
      console.error('Failed to import config:', error);
      throw new Error('Invalid configuration format');
    }
  }
}

// Initialize configuration on module load
if (typeof window !== 'undefined') {
  AIControlConfigManager.loadConfig().catch(err => 
    console.error('Failed to initialize AI Control config:', err)
  );
}
