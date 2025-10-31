// Settings Service - Manages system settings in IndexedDB

import { SystemSettings, defaultSettings } from '@/types/settings';
import { db } from '@/lib/db/schema';

const SETTINGS_KEY = 'system_settings';

/**
 * Settings Service
 * Manages system configuration and preferences
 */
export class SettingsService {
  /**
   * Validate settings before saving
   */
  private static validateSettings(settings: Partial<SystemSettings>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate general settings
    if (settings.general) {
      // General settings validation (theme, dateFormat, etc. are enums so they're type-safe)
    }

    // Validate Gemini API settings
    if (settings.geminiAPI) {
      if (settings.geminiAPI.rateLimit !== undefined) {
        if (settings.geminiAPI.rateLimit < 1 || settings.geminiAPI.rateLimit > 120) {
          errors.push('Rate limit must be between 1 and 120 requests per minute');
        }
      }
      if (settings.geminiAPI.cacheExpiration !== undefined) {
        if (settings.geminiAPI.cacheExpiration < 1 || settings.geminiAPI.cacheExpiration > 60) {
          errors.push('Cache expiration must be between 1 and 60 minutes');
        }
      }
    }

    // Validate data management settings
    if (settings.dataManagement) {
      if (settings.dataManagement.autoSaveInterval !== undefined) {
        if (settings.dataManagement.autoSaveInterval < 10 || settings.dataManagement.autoSaveInterval > 300) {
          errors.push('Auto-save interval must be between 10 and 300 seconds');
        }
      }
      if (settings.dataManagement.dataRetentionDays !== undefined) {
        if (settings.dataManagement.dataRetentionDays < 30 || settings.dataManagement.dataRetentionDays > 3650) {
          errors.push('Data retention period must be between 30 and 3650 days');
        }
      }
    }

    // Validate business settings
    if (settings.business) {
      if (settings.business.taxRate !== undefined) {
        if (settings.business.taxRate < 0 || settings.business.taxRate > 100) {
          errors.push('Tax rate must be between 0 and 100 percent');
        }
      }
      if (settings.business.companyName !== undefined && !settings.business.companyName.trim()) {
        errors.push('Company name is required');
      }
    }

    // Validate inventory settings
    if (settings.inventory) {
      if (settings.inventory.lowStockThreshold !== undefined && settings.inventory.lowStockThreshold < 0) {
        errors.push('Low stock threshold must be a positive number');
      }
      if (settings.inventory.expiryAlertDays !== undefined) {
        if (settings.inventory.expiryAlertDays < 1 || settings.inventory.expiryAlertDays > 365) {
          errors.push('Expiry alert period must be between 1 and 365 days');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Log settings change to system logs
   */
  private static async logSettingsChange(
    action: string,
    details: string,
    userId: string,
    status: 'success' | 'error' = 'success'
  ): Promise<void> {
    try {
      await db.systemLogs.add({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action,
        entityType: 'settings',
        details,
        userId,
        timestamp: new Date(),
        status,
      });
    } catch (error) {
      console.error('Error logging settings change:', error);
    }
  }

  /**
   * Get current system settings
   */
  static async getSettings(): Promise<SystemSettings> {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        // Convert date strings back to Date objects
        settings.lastUpdated = new Date(settings.lastUpdated);
        return settings;
      }
      return defaultSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return defaultSettings;
    }
  }

  /**
   * Update system settings
   */
  static async updateSettings(
    settings: Partial<SystemSettings>,
    userId: string
  ): Promise<SystemSettings> {
    try {
      // Validate settings
      const validation = this.validateSettings(settings);
      if (!validation.valid) {
        const errorMessage = validation.errors.join(', ');
        await this.logSettingsChange(
          'update_settings',
          `Validation failed: ${errorMessage}`,
          userId,
          'error'
        );
        throw new Error(errorMessage);
      }

      const current = await this.getSettings();
      const updated: SystemSettings = {
        ...current,
        ...settings,
        lastUpdated: new Date(),
        updatedBy: userId,
      };

      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));

      // Log the change
      await this.logSettingsChange(
        'update_settings',
        `Settings updated: ${Object.keys(settings).join(', ')}`,
        userId,
        'success'
      );

      return updated;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Update general settings
   */
  static async updateGeneralSettings(
    settings: Partial<SystemSettings['general']>,
    userId: string
  ): Promise<SystemSettings> {
    const current = await this.getSettings();
    return this.updateSettings(
      {
        general: { ...current.general, ...settings },
      },
      userId
    );
  }

  /**
   * Update Gemini API settings
   */
  static async updateGeminiAPISettings(
    settings: Partial<SystemSettings['geminiAPI']>,
    userId: string
  ): Promise<SystemSettings> {
    const current = await this.getSettings();
    return this.updateSettings(
      {
        geminiAPI: { ...current.geminiAPI, ...settings },
      },
      userId
    );
  }

  /**
   * Update data management settings
   */
  static async updateDataManagementSettings(
    settings: Partial<SystemSettings['dataManagement']>,
    userId: string
  ): Promise<SystemSettings> {
    const current = await this.getSettings();
    return this.updateSettings(
      {
        dataManagement: { ...current.dataManagement, ...settings },
      },
      userId
    );
  }

  /**
   * Update business settings
   */
  static async updateBusinessSettings(
    settings: Partial<SystemSettings['business']>,
    userId: string
  ): Promise<SystemSettings> {
    const current = await this.getSettings();
    return this.updateSettings(
      {
        business: { ...current.business, ...settings },
      },
      userId
    );
  }

  /**
   * Update inventory settings
   */
  static async updateInventorySettings(
    settings: Partial<SystemSettings['inventory']>,
    userId: string
  ): Promise<SystemSettings> {
    const current = await this.getSettings();
    return this.updateSettings(
      {
        inventory: { ...current.inventory, ...settings },
      },
      userId
    );
  }

  /**
   * Update notification settings
   */
  static async updateNotificationSettings(
    settings: Partial<SystemSettings['notifications']>,
    userId: string
  ): Promise<SystemSettings> {
    const current = await this.getSettings();
    return this.updateSettings(
      {
        notifications: { ...current.notifications, ...settings },
      },
      userId
    );
  }

  /**
   * Add or update payment terms template
   */
  static async updatePaymentTerms(
    paymentTerms: SystemSettings['paymentTerms'],
    userId: string
  ): Promise<SystemSettings> {
    return this.updateSettings({ paymentTerms }, userId);
  }

  /**
   * Add or update custom field
   */
  static async updateCustomFields(
    customFields: SystemSettings['customFields'],
    userId: string
  ): Promise<SystemSettings> {
    return this.updateSettings({ customFields }, userId);
  }

  /**
   * Add or update report template
   */
  static async updateReportTemplates(
    reportTemplates: SystemSettings['reportTemplates'],
    userId: string
  ): Promise<SystemSettings> {
    return this.updateSettings({ reportTemplates }, userId);
  }

  /**
   * Reset settings to defaults
   */
  static async resetSettings(userId: string): Promise<SystemSettings> {
    const reset = {
      ...defaultSettings,
      lastUpdated: new Date(),
      updatedBy: userId,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(reset));
    return reset;
  }

  /**
   * Export settings as JSON
   */
  static async exportSettings(): Promise<string> {
    const settings = await this.getSettings();
    return JSON.stringify(settings, null, 2);
  }

  /**
   * Import settings from JSON
   */
  static async importSettings(
    jsonString: string,
    userId: string
  ): Promise<SystemSettings> {
    try {
      const settings = JSON.parse(jsonString);
      return this.updateSettings(settings, userId);
    } catch (error) {
      console.error('Error importing settings:', error);
      throw new Error('Invalid settings format');
    }
  }
}
