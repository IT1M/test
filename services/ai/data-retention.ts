// AI Data Retention and Archival Service
// Comprehensive data lifecycle management for AI activity logs

import { db } from '@/lib/db/schema';
import { AIActivityLog } from '@/types/database';
import { AIActivityLogger } from './activity-logger';
import * as XLSX from 'xlsx';
import pako from 'pako';

/**
 * Retention policy configuration
 */
export interface RetentionPolicyConfig {
  id: string;
  name: string;
  retentionDays: number;
  archiveBeforeDelete: boolean;
  compressionEnabled: boolean;
  applyToOperationTypes?: string[];
  applyToModels?: string[];
  applyToStatuses?: Array<'success' | 'error' | 'timeout' | 'rate-limited'>;
  enabled: boolean;
  lastExecuted?: Date;
  nextExecution?: Date;
  executionSchedule?: 'daily' | 'weekly' | 'monthly';
}

/**
 * Archival result
 */
export interface ArchivalResult {
  totalLogs: number;
  archivedLogs: number;
  deletedLogs: number;
  archiveSize: number;
  compressionRatio?: number;
  archiveLocation: string;
  executionTime: number;
  errors: string[];
}

/**
 * Data integrity check result
 */
export interface IntegrityCheckResult {
  totalLogs: number;
  corruptedLogs: number;
  missingFields: number;
  invalidTimestamps: number;
  duplicateIds: number;
  issues: Array<{
    logId: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  checkTimestamp: Date;
}

/**
 * Export/Import format
 */
export interface ArchiveFormat {
  version: string;
  exportDate: Date;
  totalRecords: number;
  compressed: boolean;
  metadata: {
    retentionPolicy?: string;
    dateRange: { start: Date; end: Date };
    models: string[];
    operationTypes: string[];
  };
  data: AIActivityLog[];
}

/**
 * Data Retention Service Class
 * Handles automatic log cleanup, archival, compression, and integrity checking
 */
export class DataRetentionService {
  private static readonly ARCHIVE_VERSION = '1.0.0';
  private static readonly CHUNK_SIZE = 1000; // Process logs in chunks
  private static readonly MAX_ARCHIVE_SIZE = 100 * 1024 * 1024; // 100MB

  /**
   * Execute retention policy with archival and cleanup
   */
  static async executeRetentionPolicy(
    policy: RetentionPolicyConfig
  ): Promise<ArchivalResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let archivedLogs = 0;
    let deletedLogs = 0;
    let archiveSize = 0;
    let compressionRatio: number | undefined;
    let archiveLocation = '';

    try {
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

      // Get logs to process
      const logsToProcess = await this.getLogsForRetention(cutoffDate, policy);
      const totalLogs = logsToProcess.length;

      if (totalLogs === 0) {
        return {
          totalLogs: 0,
          archivedLogs: 0,
          deletedLogs: 0,
          archiveSize: 0,
          archiveLocation: 'N/A',
          executionTime: Date.now() - startTime,
          errors: [],
        };
      }

      // Archive logs if enabled
      if (policy.archiveBeforeDelete) {
        try {
          const archiveResult = await this.archiveLogs(
            logsToProcess,
            policy,
            cutoffDate
          );
          archivedLogs = archiveResult.archivedCount;
          archiveSize = archiveResult.size;
          compressionRatio = archiveResult.compressionRatio;
          archiveLocation = archiveResult.location;
        } catch (error) {
          errors.push(`Archival failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Don't proceed with deletion if archival failed
          return {
            totalLogs,
            archivedLogs: 0,
            deletedLogs: 0,
            archiveSize: 0,
            archiveLocation: 'Failed',
            executionTime: Date.now() - startTime,
            errors,
          };
        }
      }

      // Delete old logs
      try {
        deletedLogs = await this.deleteLogs(logsToProcess);
      } catch (error) {
        errors.push(`Deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Update policy execution timestamp
      await this.updatePolicyExecution(policy.id);

      return {
        totalLogs,
        archivedLogs,
        deletedLogs,
        archiveSize,
        compressionRatio,
        archiveLocation,
        executionTime: Date.now() - startTime,
        errors,
      };
    } catch (error) {
      errors.push(`Policy execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        totalLogs: 0,
        archivedLogs: 0,
        deletedLogs: 0,
        archiveSize: 0,
        archiveLocation: 'Failed',
        executionTime: Date.now() - startTime,
        errors,
      };
    }
  }

  /**
   * Get logs that match retention criteria
   */
  private static async getLogsForRetention(
    cutoffDate: Date,
    policy: RetentionPolicyConfig
  ): Promise<AIActivityLog[]> {
    let logs = await db.aiActivityLogs
      .where('timestamp')
      .below(cutoffDate)
      .toArray();

    // Apply operation type filter
    if (policy.applyToOperationTypes && policy.applyToOperationTypes.length > 0) {
      logs = logs.filter(log => policy.applyToOperationTypes!.includes(log.operationType));
    }

    // Apply model filter
    if (policy.applyToModels && policy.applyToModels.length > 0) {
      logs = logs.filter(log => policy.applyToModels!.includes(log.modelName));
    }

    // Apply status filter
    if (policy.applyToStatuses && policy.applyToStatuses.length > 0) {
      logs = logs.filter(log => policy.applyToStatuses!.includes(log.status));
    }

    return logs;
  }

  /**
   * Archive logs to file with optional compression
   */
  private static async archiveLogs(
    logs: AIActivityLog[],
    policy: RetentionPolicyConfig,
    cutoffDate: Date
  ): Promise<{
    archivedCount: number;
    size: number;
    compressionRatio?: number;
    location: string;
  }> {
    // Prepare archive format
    const dateRange = {
      start: logs.reduce((min, log) => log.timestamp < min ? log.timestamp : min, logs[0].timestamp),
      end: cutoffDate,
    };

    const models = [...new Set(logs.map(log => log.modelName))];
    const operationTypes = [...new Set(logs.map(log => log.operationType))];

    const archiveData: ArchiveFormat = {
      version: this.ARCHIVE_VERSION,
      exportDate: new Date(),
      totalRecords: logs.length,
      compressed: policy.compressionEnabled,
      metadata: {
        retentionPolicy: policy.name,
        dateRange,
        models,
        operationTypes,
      },
      data: logs,
    };

    // Convert to JSON
    const jsonData = JSON.stringify(archiveData, null, 2);
    const originalSize = new Blob([jsonData]).size;

    let finalData: Blob;
    let compressionRatio: number | undefined;

    // Apply compression if enabled
    if (policy.compressionEnabled) {
      const compressed = pako.gzip(jsonData);
      finalData = new Blob([compressed], { type: 'application/gzip' });
      compressionRatio = originalSize / finalData.size;
    } else {
      finalData = new Blob([jsonData], { type: 'application/json' });
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = policy.compressionEnabled ? 'json.gz' : 'json';
    const filename = `ai-activity-archive-${policy.name}-${timestamp}.${extension}`;

    // Save archive (browser download)
    if (typeof window !== 'undefined') {
      const url = URL.createObjectURL(finalData);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }

    return {
      archivedCount: logs.length,
      size: finalData.size,
      compressionRatio,
      location: filename,
    };
  }

  /**
   * Delete logs from database
   */
  private static async deleteLogs(logs: AIActivityLog[]): Promise<number> {
    const idsToDelete = logs.map(log => log.id);
    
    // Delete in chunks to avoid memory issues
    let deletedCount = 0;
    for (let i = 0; i < idsToDelete.length; i += this.CHUNK_SIZE) {
      const chunk = idsToDelete.slice(i, i + this.CHUNK_SIZE);
      await db.aiActivityLogs.bulkDelete(chunk);
      deletedCount += chunk.length;
    }

    return deletedCount;
  }

  /**
   * Update policy execution timestamp
   */
  private static async updatePolicyExecution(policyId: string): Promise<void> {
    // This would update a retention policy table if we had one
    // For now, we'll just log it
    console.log(`Retention policy ${policyId} executed at ${new Date().toISOString()}`);
  }

  /**
   * Run daily data integrity check
   */
  static async runIntegrityCheck(): Promise<IntegrityCheckResult> {
    const issues: Array<{
      logId: string;
      issue: string;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    try {
      const allLogs = await db.aiActivityLogs.toArray();
      const totalLogs = allLogs.length;

      let corruptedLogs = 0;
      let missingFields = 0;
      let invalidTimestamps = 0;
      let duplicateIds = 0;

      // Check for duplicate IDs
      const idSet = new Set<string>();
      const duplicates = new Set<string>();
      allLogs.forEach(log => {
        if (idSet.has(log.id)) {
          duplicates.add(log.id);
          duplicateIds++;
        }
        idSet.add(log.id);
      });

      if (duplicates.size > 0) {
        duplicates.forEach(id => {
          issues.push({
            logId: id,
            issue: 'Duplicate log ID detected',
            severity: 'high',
          });
        });
      }

      // Check each log for integrity
      for (const log of allLogs) {
        let hasIssue = false;

        // Check required fields
        if (!log.id || !log.timestamp || !log.userId || !log.modelName || !log.operationType) {
          missingFields++;
          hasIssue = true;
          issues.push({
            logId: log.id || 'unknown',
            issue: 'Missing required fields',
            severity: 'high',
          });
        }

        // Check timestamp validity
        if (log.timestamp) {
          const timestamp = new Date(log.timestamp);
          if (isNaN(timestamp.getTime()) || timestamp > new Date()) {
            invalidTimestamps++;
            hasIssue = true;
            issues.push({
              logId: log.id,
              issue: 'Invalid timestamp',
              severity: 'medium',
            });
          }
        }

        // Check data integrity
        try {
          if (log.inputData) {
            JSON.parse(log.inputData);
          }
          if (log.outputData) {
            JSON.parse(log.outputData);
          }
        } catch (error) {
          corruptedLogs++;
          hasIssue = true;
          issues.push({
            logId: log.id,
            issue: 'Corrupted JSON data',
            severity: 'high',
          });
        }

        // Check confidence score range
        if (log.confidenceScore !== undefined && (log.confidenceScore < 0 || log.confidenceScore > 100)) {
          hasIssue = true;
          issues.push({
            logId: log.id,
            issue: 'Invalid confidence score (must be 0-100)',
            severity: 'low',
          });
        }

        // Check execution time validity
        if (log.executionTime < 0) {
          hasIssue = true;
          issues.push({
            logId: log.id,
            issue: 'Negative execution time',
            severity: 'medium',
          });
        }

        if (hasIssue) {
          corruptedLogs++;
        }
      }

      return {
        totalLogs,
        corruptedLogs,
        missingFields,
        invalidTimestamps,
        duplicateIds,
        issues,
        checkTimestamp: new Date(),
      };
    } catch (error) {
      console.error('Integrity check failed:', error);
      throw error;
    }
  }

  /**
   * Export logs for backup
   */
  static async exportForBackup(
    startDate?: Date,
    endDate?: Date,
    format: 'json' | 'excel' = 'json',
    compress: boolean = true
  ): Promise<Blob> {
    try {
      let logs: AIActivityLog[];

      if (startDate && endDate) {
        logs = await db.aiActivityLogs
          .where('timestamp')
          .between(startDate, endDate, true, true)
          .toArray();
      } else if (startDate) {
        logs = await db.aiActivityLogs
          .where('timestamp')
          .above(startDate)
          .toArray();
      } else {
        logs = await db.aiActivityLogs.toArray();
      }

      if (format === 'json') {
        const archiveData: ArchiveFormat = {
          version: this.ARCHIVE_VERSION,
          exportDate: new Date(),
          totalRecords: logs.length,
          compressed: compress,
          metadata: {
            dateRange: {
              start: startDate || logs[0]?.timestamp || new Date(),
              end: endDate || new Date(),
            },
            models: [...new Set(logs.map(log => log.modelName))],
            operationTypes: [...new Set(logs.map(log => log.operationType))],
          },
          data: logs,
        };

        const jsonData = JSON.stringify(archiveData, null, 2);

        if (compress) {
          const compressed = pako.gzip(jsonData);
          return new Blob([compressed], { type: 'application/gzip' });
        } else {
          return new Blob([jsonData], { type: 'application/json' });
        }
      } else {
        // Excel format
        const worksheet = XLSX.utils.json_to_sheet(
          logs.map(log => ({
            ID: log.id,
            Timestamp: log.timestamp.toISOString(),
            'User ID': log.userId,
            'Model Name': log.modelName,
            'Model Version': log.modelVersion || '',
            'Operation Type': log.operationType,
            'Confidence Score': log.confidenceScore || 'N/A',
            'Execution Time (ms)': log.executionTime,
            Status: log.status,
            'Entity Type': log.entityType || '',
            'Entity ID': log.entityId || '',
            'Estimated Cost': log.estimatedCost || 0,
            'Error Message': log.errorMessage || '',
          }))
        );

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'AI Activity Logs');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        return new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
      }
    } catch (error) {
      console.error('Export for backup failed:', error);
      throw error;
    }
  }

  /**
   * Import logs from backup
   */
  static async importFromBackup(file: File): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    try {
      const fileContent = await file.arrayBuffer();
      let jsonData: string;

      // Check if file is compressed
      if (file.name.endsWith('.gz')) {
        try {
          const decompressed = pako.ungzip(new Uint8Array(fileContent), { to: 'string' });
          jsonData = decompressed;
        } catch (error) {
          throw new Error('Failed to decompress file');
        }
      } else {
        jsonData = new TextDecoder().decode(fileContent);
      }

      // Parse archive format
      const archiveData: ArchiveFormat = JSON.parse(jsonData);

      // Validate version compatibility
      if (archiveData.version !== this.ARCHIVE_VERSION) {
        errors.push(`Version mismatch: archive is ${archiveData.version}, expected ${this.ARCHIVE_VERSION}`);
      }

      // Get existing log IDs to avoid duplicates
      const existingIds = new Set(
        (await db.aiActivityLogs.toCollection().primaryKeys()).map(String)
      );

      // Import logs in chunks
      const logsToImport = archiveData.data.filter(log => {
        if (existingIds.has(log.id)) {
          skipped++;
          return false;
        }
        return true;
      });

      for (let i = 0; i < logsToImport.length; i += this.CHUNK_SIZE) {
        const chunk = logsToImport.slice(i, i + this.CHUNK_SIZE);
        try {
          await db.aiActivityLogs.bulkAdd(chunk);
          imported += chunk.length;
        } catch (error) {
          errors.push(`Failed to import chunk ${i / this.CHUNK_SIZE + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { imported, skipped, errors };
    } catch (error) {
      errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { imported, skipped, errors };
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    totalLogs: number;
    totalSize: number;
    oldestLog: Date | null;
    newestLog: Date | null;
    averageLogSize: number;
    logsByModel: Record<string, number>;
    logsByStatus: Record<string, number>;
  }> {
    try {
      const allLogs = await db.aiActivityLogs.toArray();
      const totalLogs = allLogs.length;

      if (totalLogs === 0) {
        return {
          totalLogs: 0,
          totalSize: 0,
          oldestLog: null,
          newestLog: null,
          averageLogSize: 0,
          logsByModel: {},
          logsByStatus: {},
        };
      }

      // Calculate total size (approximate)
      const totalSize = allLogs.reduce((sum, log) => {
        const logSize = JSON.stringify(log).length;
        return sum + logSize;
      }, 0);

      // Find oldest and newest logs
      const timestamps = allLogs.map(log => log.timestamp);
      const oldestLog = new Date(Math.min(...timestamps.map(t => t.getTime())));
      const newestLog = new Date(Math.max(...timestamps.map(t => t.getTime())));

      // Calculate average log size
      const averageLogSize = totalSize / totalLogs;

      // Group by model
      const logsByModel: Record<string, number> = {};
      allLogs.forEach(log => {
        logsByModel[log.modelName] = (logsByModel[log.modelName] || 0) + 1;
      });

      // Group by status
      const logsByStatus: Record<string, number> = {};
      allLogs.forEach(log => {
        logsByStatus[log.status] = (logsByStatus[log.status] || 0) + 1;
      });

      return {
        totalLogs,
        totalSize,
        oldestLog,
        newestLog,
        averageLogSize,
        logsByModel,
        logsByStatus,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic retention policy execution
   */
  static scheduleRetentionJob(
    policy: RetentionPolicyConfig,
    callback?: (result: ArchivalResult) => void
  ): NodeJS.Timeout | number {
    const getNextExecutionDelay = (): number => {
      const now = new Date();
      let nextExecution = new Date();

      switch (policy.executionSchedule) {
        case 'daily':
          nextExecution.setDate(now.getDate() + 1);
          nextExecution.setHours(2, 0, 0, 0); // 2 AM
          break;
        case 'weekly':
          nextExecution.setDate(now.getDate() + (7 - now.getDay())); // Next Sunday
          nextExecution.setHours(2, 0, 0, 0);
          break;
        case 'monthly':
          nextExecution.setMonth(now.getMonth() + 1, 1); // First day of next month
          nextExecution.setHours(2, 0, 0, 0);
          break;
        default:
          nextExecution.setDate(now.getDate() + 1);
          nextExecution.setHours(2, 0, 0, 0);
      }

      return nextExecution.getTime() - now.getTime();
    };

    const executeJob = async () => {
      if (!policy.enabled) {
        console.log(`Retention policy ${policy.name} is disabled, skipping execution`);
        return;
      }

      console.log(`Executing retention policy: ${policy.name}`);
      const result = await this.executeRetentionPolicy(policy);
      
      if (callback) {
        callback(result);
      }

      console.log(`Retention policy ${policy.name} completed:`, result);

      // Schedule next execution
      const delay = getNextExecutionDelay();
      setTimeout(executeJob, delay);
    };

    // Schedule first execution
    const initialDelay = getNextExecutionDelay();
    return setTimeout(executeJob, initialDelay);
  }

  /**
   * Compress existing logs in database (in-place optimization)
   */
  static async compressStoredLogs(): Promise<{
    processed: number;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  }> {
    try {
      const allLogs = await db.aiActivityLogs.toArray();
      let originalSize = 0;
      let compressedSize = 0;

      for (const log of allLogs) {
        // Calculate original size
        const originalInputSize = log.inputData.length;
        const originalOutputSize = log.outputData.length;
        originalSize += originalInputSize + originalOutputSize;

        // Compress large text fields
        if (originalInputSize > 1000) {
          const compressed = pako.deflate(log.inputData, { to: 'string' });
          log.inputData = compressed;
          compressedSize += compressed.length;
        } else {
          compressedSize += originalInputSize;
        }

        if (originalOutputSize > 1000) {
          const compressed = pako.deflate(log.outputData, { to: 'string' });
          log.outputData = compressed;
          compressedSize += compressed.length;
        } else {
          compressedSize += originalOutputSize;
        }

        // Update log in database
        await db.aiActivityLogs.put(log);
      }

      const compressionRatio = originalSize > 0 ? originalSize / compressedSize : 1;

      return {
        processed: allLogs.length,
        originalSize,
        compressedSize,
        compressionRatio,
      };
    } catch (error) {
      console.error('Failed to compress stored logs:', error);
      throw error;
    }
  }
}
