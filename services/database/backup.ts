// Backup Service - Manages data backup and recovery operations

import { db } from '@/lib/db/schema';
import { SettingsService } from './settings';

export interface BackupMetadata {
  version: number;
  exportDate: string;
  databaseVersion: number;
  recordCounts: {
    products: number;
    customers: number;
    orders: number;
    inventory: number;
    sales: number;
    patients: number;
    medicalRecords: number;
    quotations: number;
    invoices: number;
    payments: number;
    stockMovements: number;
    purchaseOrders: number;
    searchHistory: number;
    systemLogs: number;
    users: number;
  };
}

export interface BackupData {
  metadata: BackupMetadata;
  data: any;
  settings?: any;
}

/**
 * Backup Service
 * Handles database backup, restore, and scheduled backups
 */
export class BackupService {
  private static readonly BACKUP_STORAGE_KEY = 'last_backup_timestamp';
  private static readonly AUTO_BACKUP_KEY = 'auto_backup_enabled';

  /**
   * Create a full database backup
   */
  static async createBackup(includeSettings: boolean = true): Promise<BackupData> {
    try {
      // Export all database data
      const exportedData = await db.exportAllData();

      // Get record counts for metadata
      const stats = await db.getStats();

      // Create metadata
      const metadata: BackupMetadata = {
        version: 1,
        exportDate: new Date().toISOString(),
        databaseVersion: exportedData.version,
        recordCounts: {
          products: stats.products,
          customers: stats.customers,
          orders: stats.orders,
          inventory: await db.inventory.count(),
          sales: await db.sales.count(),
          patients: stats.patients,
          medicalRecords: stats.medicalRecords,
          quotations: await db.quotations.count(),
          invoices: await db.invoices.count(),
          payments: await db.payments.count(),
          stockMovements: await db.stockMovements.count(),
          purchaseOrders: await db.purchaseOrders.count(),
          searchHistory: await db.searchHistory.count(),
          systemLogs: await db.systemLogs.count(),
          users: await db.users.count(),
        },
      };

      // Include settings if requested
      let settings;
      if (includeSettings) {
        settings = await SettingsService.getSettings();
      }

      const backup: BackupData = {
        metadata,
        data: exportedData.data,
        settings,
      };

      // Update last backup timestamp
      localStorage.setItem(this.BACKUP_STORAGE_KEY, new Date().toISOString());

      // Log backup creation
      await db.systemLogs.add({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action: 'create_backup',
        entityType: 'system',
        details: `Backup created with ${Object.values(metadata.recordCounts).reduce((a, b) => a + b, 0)} total records`,
        userId: 'system',
        timestamp: new Date(),
        status: 'success',
      });

      return backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      
      // Log backup failure
      await db.systemLogs.add({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action: 'create_backup',
        entityType: 'system',
        details: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        userId: 'system',
        timestamp: new Date(),
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Download backup as JSON file
   */
  static async downloadBackup(includeSettings: boolean = true): Promise<void> {
    try {
      const backup = await this.createBackup(includeSettings);
      
      // Convert to JSON string
      const jsonString = JSON.stringify(backup, null, 2);
      
      // Create blob
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.download = `medical-products-backup-${timestamp}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw error;
    }
  }

  /**
   * Get last backup timestamp
   */
  static getLastBackupTimestamp(): Date | null {
    const timestamp = localStorage.getItem(this.BACKUP_STORAGE_KEY);
    return timestamp ? new Date(timestamp) : null;
  }

  /**
   * Check if automatic backup is enabled
   */
  static isAutoBackupEnabled(): boolean {
    const enabled = localStorage.getItem(this.AUTO_BACKUP_KEY);
    return enabled === 'true';
  }

  /**
   * Enable or disable automatic backups
   */
  static setAutoBackupEnabled(enabled: boolean): void {
    localStorage.setItem(this.AUTO_BACKUP_KEY, enabled.toString());
  }

  /**
   * Schedule automatic backup
   * This should be called on app initialization
   */
  static scheduleAutoBackup(intervalHours: number = 24): void {
    if (!this.isAutoBackupEnabled()) {
      return;
    }

    const intervalMs = intervalHours * 60 * 60 * 1000;

    // Check if backup is needed
    const lastBackup = this.getLastBackupTimestamp();
    const now = new Date();

    if (!lastBackup || (now.getTime() - lastBackup.getTime()) >= intervalMs) {
      // Perform backup
      this.createBackup(true).catch(error => {
        console.error('Auto backup failed:', error);
      });
    }

    // Schedule next check
    setTimeout(() => {
      this.scheduleAutoBackup(intervalHours);
    }, intervalMs);
  }

  /**
   * Validate backup data format
   */
  static validateBackup(backup: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if backup has required structure
    if (!backup) {
      errors.push('Backup data is empty');
      return { valid: false, errors };
    }

    if (!backup.metadata) {
      errors.push('Backup metadata is missing');
    } else {
      if (!backup.metadata.version) {
        errors.push('Backup version is missing');
      }
      if (!backup.metadata.exportDate) {
        errors.push('Backup export date is missing');
      }
      if (!backup.metadata.recordCounts) {
        errors.push('Backup record counts are missing');
      }
    }

    if (!backup.data) {
      errors.push('Backup data is missing');
    } else {
      // Check if data has expected tables
      const expectedTables = [
        'products',
        'customers',
        'orders',
        'inventory',
        'sales',
        'patients',
        'medicalRecords',
        'quotations',
        'invoices',
        'payments',
        'stockMovements',
        'purchaseOrders',
        'searchHistory',
        'systemLogs',
        'users',
      ];

      for (const table of expectedTables) {
        if (!Array.isArray(backup.data[table])) {
          errors.push(`Table '${table}' is missing or invalid`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Restore database from backup
   */
  static async restoreBackup(
    backup: BackupData,
    options: {
      clearExisting?: boolean;
      restoreSettings?: boolean;
      userId?: string;
    } = {}
  ): Promise<void> {
    const { clearExisting = true, restoreSettings = true, userId = 'system' } = options;

    try {
      // Validate backup
      const validation = this.validateBackup(backup);
      if (!validation.valid) {
        throw new Error(`Invalid backup format: ${validation.errors.join(', ')}`);
      }

      // Clear existing data if requested
      if (clearExisting) {
        await db.clearAllData();
      }

      // Import data
      await db.importAllData({
        version: backup.metadata.databaseVersion,
        exportDate: backup.metadata.exportDate,
        data: backup.data,
      });

      // Restore settings if included and requested
      if (restoreSettings && backup.settings) {
        const settingsJson = JSON.stringify(backup.settings);
        await SettingsService.importSettings(settingsJson, userId);
      }

      // Log successful restore
      await db.systemLogs.add({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action: 'restore_backup',
        entityType: 'system',
        details: `Backup restored successfully from ${backup.metadata.exportDate}`,
        userId,
        timestamp: new Date(),
        status: 'success',
      });
    } catch (error) {
      console.error('Error restoring backup:', error);

      // Log restore failure
      await db.systemLogs.add({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action: 'restore_backup',
        entityType: 'system',
        details: `Backup restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        userId,
        timestamp: new Date(),
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Restore database from uploaded file
   */
  static async restoreFromFile(
    file: File,
    options: {
      clearExisting?: boolean;
      restoreSettings?: boolean;
      userId?: string;
    } = {}
  ): Promise<void> {
    try {
      // Read file content
      const text = await file.text();
      const backup = JSON.parse(text);

      // Restore backup
      await this.restoreBackup(backup, options);
    } catch (error) {
      console.error('Error restoring from file:', error);
      throw new Error('Failed to restore backup from file. Please ensure the file is a valid backup.');
    }
  }

  /**
   * Get backup statistics
   */
  static async getBackupStats(): Promise<{
    lastBackup: Date | null;
    autoBackupEnabled: boolean;
    databaseSize: number;
    recordCount: number;
  }> {
    const stats = await db.getStats();
    const recordCount = stats.products + stats.customers + stats.orders + stats.patients + stats.medicalRecords;

    return {
      lastBackup: this.getLastBackupTimestamp(),
      autoBackupEnabled: this.isAutoBackupEnabled(),
      databaseSize: stats.totalSize,
      recordCount,
    };
  }
}
