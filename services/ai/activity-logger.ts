// AI Activity Logger Service
// Comprehensive logging and monitoring of all AI operations

import { db } from '@/lib/db/schema';
import { AIActivityLog } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

/**
 * PHI/PII patterns for sanitization
 */
const PHI_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  nationalId: /\b\d{10,14}\b/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  medicalRecordNumber: /\b(MRN|mrn)[-:\s]?\d{6,10}\b/gi,
};

/**
 * Filter options for activity logs
 */
export interface ActivityLogFilter {
  startDate?: Date;
  endDate?: Date;
  modelName?: string;
  userId?: string;
  operationType?: string;
  status?: 'success' | 'error' | 'timeout' | 'rate-limited';
  minConfidence?: number;
  maxConfidence?: number;
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Export format options
 */
export type ExportFormat = 'csv' | 'json' | 'excel';

/**
 * Activity analytics result
 */
export interface ActivityAnalytics {
  totalOperations: number;
  successRate: number;
  averageConfidence: number;
  averageExecutionTime: number;
  totalCost: number;
  operationsByType: Record<string, number>;
  operationsByModel: Record<string, number>;
  errorRate: number;
  topErrors: Array<{ message: string; count: number }>;
  peakUsageHours: Array<{ hour: number; count: number }>;
  confidenceDistribution: {
    high: number; // 80-100
    medium: number; // 50-79
    low: number; // 0-49
  };
}

/**
 * Anomaly detection result
 */
export interface AnomalousActivity {
  id: string;
  type: 'repeated_low_confidence' | 'unusual_pattern' | 'high_error_rate' | 'suspicious_input' | 'cost_spike';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedLogs: string[];
  detectedAt: Date;
  recommendation: string;
}

/**
 * Log retention policy
 */
export interface RetentionPolicy {
  retentionDays: number;
  archiveBeforeDelete: boolean;
  applyToOperationTypes?: string[];
}

/**
 * AI Activity Logger Class
 * Handles comprehensive logging, filtering, export, and analysis of AI operations
 */
export class AIActivityLogger {
  /**
   * Log an AI operation with automatic PHI sanitization
   */
  static async logAIOperation(params: {
    userId: string;
    modelName: string;
    modelVersion?: string;
    operationType: AIActivityLog['operationType'];
    operationDescription?: string;
    inputData: any;
    outputData: any;
    inputTokens?: number;
    outputTokens?: number;
    confidenceScore?: number;
    executionTime: number;
    status: AIActivityLog['status'];
    errorMessage?: string;
    errorCode?: string;
    metadata?: Record<string, any>;
    entityType?: string;
    entityId?: string;
    estimatedCost?: number;
  }): Promise<string> {
    try {
      // Sanitize input and output data
      const sanitizedInput = this.sanitizePHI(JSON.stringify(params.inputData));
      const sanitizedOutput = this.sanitizePHI(JSON.stringify(params.outputData));

      const logEntry: AIActivityLog = {
        id: uuidv4(),
        timestamp: new Date(),
        userId: params.userId,
        modelName: params.modelName,
        modelVersion: params.modelVersion,
        operationType: params.operationType,
        operationDescription: params.operationDescription,
        inputData: sanitizedInput,
        outputData: sanitizedOutput,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        confidenceScore: params.confidenceScore,
        executionTime: params.executionTime,
        status: params.status,
        errorMessage: params.errorMessage,
        errorCode: params.errorCode,
        metadata: params.metadata,
        entityType: params.entityType,
        entityId: params.entityId,
        estimatedCost: params.estimatedCost,
        createdAt: new Date(),
      };

      // Save to database
      await db.aiActivityLogs.add(logEntry);

      // Check for anomalies asynchronously (don't block)
      this.checkForAnomalies(logEntry).catch(err => 
        console.error('Anomaly detection failed:', err)
      );

      return logEntry.id;
    } catch (error) {
      console.error('Failed to log AI operation:', error);
      throw error;
    }
  }

  /**
   * Sanitize PHI/PII from text
   */
  private static sanitizePHI(text: string): string {
    let sanitized = text;

    // Replace email addresses
    sanitized = sanitized.replace(PHI_PATTERNS.email, '[EMAIL_REDACTED]');

    // Replace phone numbers
    sanitized = sanitized.replace(PHI_PATTERNS.phone, '[PHONE_REDACTED]');

    // Replace SSN
    sanitized = sanitized.replace(PHI_PATTERNS.ssn, '[SSN_REDACTED]');

    // Replace national IDs
    sanitized = sanitized.replace(PHI_PATTERNS.nationalId, '[ID_REDACTED]');

    // Replace credit card numbers
    sanitized = sanitized.replace(PHI_PATTERNS.creditCard, '[CARD_REDACTED]');

    // Replace IP addresses
    sanitized = sanitized.replace(PHI_PATTERNS.ipAddress, '[IP_REDACTED]');

    // Replace medical record numbers
    sanitized = sanitized.replace(PHI_PATTERNS.medicalRecordNumber, '[MRN_REDACTED]');

    return sanitized;
  }

  /**
   * Get activity logs with advanced filtering
   */
  static async getActivityLogs(filter: ActivityLogFilter = {}): Promise<AIActivityLog[]> {
    try {
      let query = db.aiActivityLogs.orderBy('timestamp').reverse();

      // Apply filters
      const logs = await query.toArray();

      let filtered = logs;

      // Date range filter
      if (filter.startDate) {
        filtered = filtered.filter(log => log.timestamp >= filter.startDate!);
      }
      if (filter.endDate) {
        filtered = filtered.filter(log => log.timestamp <= filter.endDate!);
      }

      // Model name filter
      if (filter.modelName) {
        filtered = filtered.filter(log => log.modelName === filter.modelName);
      }

      // User filter
      if (filter.userId) {
        filtered = filtered.filter(log => log.userId === filter.userId);
      }

      // Operation type filter
      if (filter.operationType) {
        filtered = filtered.filter(log => log.operationType === filter.operationType);
      }

      // Status filter
      if (filter.status) {
        filtered = filtered.filter(log => log.status === filter.status);
      }

      // Confidence range filter
      if (filter.minConfidence !== undefined) {
        filtered = filtered.filter(log => 
          log.confidenceScore !== undefined && log.confidenceScore >= filter.minConfidence!
        );
      }
      if (filter.maxConfidence !== undefined) {
        filtered = filtered.filter(log => 
          log.confidenceScore !== undefined && log.confidenceScore <= filter.maxConfidence!
        );
      }

      // Entity filter
      if (filter.entityType) {
        filtered = filtered.filter(log => log.entityType === filter.entityType);
      }
      if (filter.entityId) {
        filtered = filtered.filter(log => log.entityId === filter.entityId);
      }

      // Pagination
      const offset = filter.offset || 0;
      const limit = filter.limit || 100;
      
      return filtered.slice(offset, offset + limit);
    } catch (error) {
      console.error('Failed to get activity logs:', error);
      throw error;
    }
  }

  /**
   * Export activity logs in specified format
   */
  static async exportActivityLogs(
    filter: ActivityLogFilter = {},
    format: ExportFormat = 'csv'
  ): Promise<string | Blob> {
    try {
      const logs = await this.getActivityLogs({ ...filter, limit: 10000 });

      switch (format) {
        case 'csv':
          return this.exportToCSV(logs);
        case 'json':
          return this.exportToJSON(logs);
        case 'excel':
          return this.exportToExcel(logs);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Failed to export activity logs:', error);
      throw error;
    }
  }

  /**
   * Export logs to CSV format
   */
  private static exportToCSV(logs: AIActivityLog[]): string {
    const headers = [
      'ID',
      'Timestamp',
      'User ID',
      'Model Name',
      'Operation Type',
      'Confidence Score',
      'Execution Time (ms)',
      'Status',
      'Entity Type',
      'Entity ID',
      'Estimated Cost',
      'Error Message',
    ];

    const rows = logs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.userId,
      log.modelName,
      log.operationType,
      log.confidenceScore?.toFixed(2) || 'N/A',
      log.executionTime.toString(),
      log.status,
      log.entityType || '',
      log.entityId || '',
      log.estimatedCost?.toFixed(4) || '0',
      log.errorMessage || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Export logs to JSON format
   */
  private static exportToJSON(logs: AIActivityLog[]): string {
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Export logs to Excel format
   */
  private static exportToExcel(logs: AIActivityLog[]): Blob {
    const worksheet = XLSX.utils.json_to_sheet(
      logs.map(log => ({
        ID: log.id,
        Timestamp: log.timestamp.toISOString(),
        'User ID': log.userId,
        'Model Name': log.modelName,
        'Model Version': log.modelVersion || '',
        'Operation Type': log.operationType,
        'Operation Description': log.operationDescription || '',
        'Confidence Score': log.confidenceScore || 'N/A',
        'Execution Time (ms)': log.executionTime,
        Status: log.status,
        'Entity Type': log.entityType || '',
        'Entity ID': log.entityId || '',
        'Input Tokens': log.inputTokens || 0,
        'Output Tokens': log.outputTokens || 0,
        'Estimated Cost': log.estimatedCost || 0,
        'Error Message': log.errorMessage || '',
        'Error Code': log.errorCode || '',
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AI Activity Logs');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Get activity analytics and aggregated statistics
   */
  static async getActivityAnalytics(filter: ActivityLogFilter = {}): Promise<ActivityAnalytics> {
    try {
      const logs = await this.getActivityLogs({ ...filter, limit: 100000 });

      if (logs.length === 0) {
        return {
          totalOperations: 0,
          successRate: 0,
          averageConfidence: 0,
          averageExecutionTime: 0,
          totalCost: 0,
          operationsByType: {},
          operationsByModel: {},
          errorRate: 0,
          topErrors: [],
          peakUsageHours: [],
          confidenceDistribution: { high: 0, medium: 0, low: 0 },
        };
      }

      // Calculate basic metrics
      const totalOperations = logs.length;
      const successfulOps = logs.filter(log => log.status === 'success').length;
      const successRate = (successfulOps / totalOperations) * 100;

      // Calculate average confidence
      const logsWithConfidence = logs.filter(log => log.confidenceScore !== undefined);
      const averageConfidence = logsWithConfidence.length > 0
        ? logsWithConfidence.reduce((sum, log) => sum + (log.confidenceScore || 0), 0) / logsWithConfidence.length
        : 0;

      // Calculate average execution time
      const averageExecutionTime = logs.reduce((sum, log) => sum + log.executionTime, 0) / totalOperations;

      // Calculate total cost
      const totalCost = logs.reduce((sum, log) => sum + (log.estimatedCost || 0), 0);

      // Operations by type
      const operationsByType: Record<string, number> = {};
      logs.forEach(log => {
        operationsByType[log.operationType] = (operationsByType[log.operationType] || 0) + 1;
      });

      // Operations by model
      const operationsByModel: Record<string, number> = {};
      logs.forEach(log => {
        operationsByModel[log.modelName] = (operationsByModel[log.modelName] || 0) + 1;
      });

      // Error rate
      const errorOps = logs.filter(log => log.status === 'error').length;
      const errorRate = (errorOps / totalOperations) * 100;

      // Top errors
      const errorMessages: Record<string, number> = {};
      logs.filter(log => log.errorMessage).forEach(log => {
        const msg = log.errorMessage!;
        errorMessages[msg] = (errorMessages[msg] || 0) + 1;
      });
      const topErrors = Object.entries(errorMessages)
        .map(([message, count]) => ({ message, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Peak usage hours
      const hourCounts: Record<number, number> = {};
      logs.forEach(log => {
        const hour = log.timestamp.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      const peakUsageHours = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Confidence distribution
      const confidenceDistribution = {
        high: logsWithConfidence.filter(log => (log.confidenceScore || 0) >= 80).length,
        medium: logsWithConfidence.filter(log => (log.confidenceScore || 0) >= 50 && (log.confidenceScore || 0) < 80).length,
        low: logsWithConfidence.filter(log => (log.confidenceScore || 0) < 50).length,
      };

      return {
        totalOperations,
        successRate,
        averageConfidence,
        averageExecutionTime,
        totalCost,
        operationsByType,
        operationsByModel,
        errorRate,
        topErrors,
        peakUsageHours,
        confidenceDistribution,
      };
    } catch (error) {
      console.error('Failed to get activity analytics:', error);
      throw error;
    }
  }

  /**
   * Apply retention policy and archive/delete old logs
   */
  static async applyRetentionPolicy(policy: RetentionPolicy): Promise<{
    archived: number;
    deleted: number;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

      let query = db.aiActivityLogs.where('timestamp').below(cutoffDate);

      // Filter by operation types if specified
      let logsToProcess = await query.toArray();
      if (policy.applyToOperationTypes && policy.applyToOperationTypes.length > 0) {
        logsToProcess = logsToProcess.filter(log => 
          policy.applyToOperationTypes!.includes(log.operationType)
        );
      }

      let archived = 0;
      let deleted = 0;

      if (policy.archiveBeforeDelete) {
        // Export to JSON for archival
        const archiveData = this.exportToJSON(logsToProcess);
        const archiveBlob = new Blob([archiveData], { type: 'application/json' });
        
        // Create download link (in browser context)
        if (typeof window !== 'undefined') {
          const url = URL.createObjectURL(archiveBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `ai-activity-archive-${new Date().toISOString()}.json`;
          link.click();
          URL.revokeObjectURL(url);
        }
        
        archived = logsToProcess.length;
      }

      // Delete old logs
      const idsToDelete = logsToProcess.map(log => log.id);
      await db.aiActivityLogs.bulkDelete(idsToDelete);
      deleted = idsToDelete.length;

      return { archived, deleted };
    } catch (error) {
      console.error('Failed to apply retention policy:', error);
      throw error;
    }
  }

  /**
   * Detect anomalous activity using pattern analysis
   */
  static async detectAnomalousActivity(
    lookbackHours: number = 24
  ): Promise<AnomalousActivity[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - lookbackHours);

      const recentLogs = await db.aiActivityLogs
        .where('timestamp')
        .above(cutoffDate)
        .toArray();

      const anomalies: AnomalousActivity[] = [];

      // 1. Detect repeated low confidence results
      const lowConfidenceLogs = recentLogs.filter(
        log => log.confidenceScore !== undefined && log.confidenceScore < 50
      );
      
      if (lowConfidenceLogs.length > 10) {
        const byModel: Record<string, AIActivityLog[]> = {};
        lowConfidenceLogs.forEach(log => {
          if (!byModel[log.modelName]) byModel[log.modelName] = [];
          byModel[log.modelName].push(log);
        });

        Object.entries(byModel).forEach(([modelName, logs]) => {
          if (logs.length >= 5) {
            anomalies.push({
              id: uuidv4(),
              type: 'repeated_low_confidence',
              severity: logs.length >= 10 ? 'high' : 'medium',
              description: `Model ${modelName} has ${logs.length} operations with confidence < 50% in the last ${lookbackHours} hours`,
              affectedLogs: logs.map(l => l.id),
              detectedAt: new Date(),
              recommendation: 'Review model configuration, input data quality, or consider retraining/updating the model',
            });
          }
        });
      }

      // 2. Detect high error rate
      const errorLogs = recentLogs.filter(log => log.status === 'error');
      const errorRate = (errorLogs.length / recentLogs.length) * 100;

      if (errorRate > 20) {
        anomalies.push({
          id: uuidv4(),
          type: 'high_error_rate',
          severity: errorRate > 50 ? 'critical' : 'high',
          description: `Error rate is ${errorRate.toFixed(1)}% (${errorLogs.length} errors out of ${recentLogs.length} operations)`,
          affectedLogs: errorLogs.map(l => l.id),
          detectedAt: new Date(),
          recommendation: 'Check API connectivity, review error messages, and verify API key validity',
        });
      }

      // 3. Detect unusual patterns (same operation repeated many times in short period)
      const operationCounts: Record<string, { count: number; logs: AIActivityLog[] }> = {};
      recentLogs.forEach(log => {
        const key = `${log.userId}-${log.operationType}-${log.entityId || 'none'}`;
        if (!operationCounts[key]) {
          operationCounts[key] = { count: 0, logs: [] };
        }
        operationCounts[key].count++;
        operationCounts[key].logs.push(log);
      });

      Object.entries(operationCounts).forEach(([key, data]) => {
        if (data.count > 50) {
          anomalies.push({
            id: uuidv4(),
            type: 'unusual_pattern',
            severity: data.count > 100 ? 'high' : 'medium',
            description: `Unusual pattern detected: ${data.count} identical operations in ${lookbackHours} hours`,
            affectedLogs: data.logs.map(l => l.id),
            detectedAt: new Date(),
            recommendation: 'Investigate potential automation loop or user behavior issue',
          });
        }
      });

      // 4. Detect cost spikes
      const totalCost = recentLogs.reduce((sum, log) => sum + (log.estimatedCost || 0), 0);
      const avgCostPerOp = totalCost / recentLogs.length;

      if (avgCostPerOp > 0.1) { // $0.10 per operation threshold
        anomalies.push({
          id: uuidv4(),
          type: 'cost_spike',
          severity: avgCostPerOp > 0.5 ? 'critical' : 'high',
          description: `Average cost per operation is $${avgCostPerOp.toFixed(4)}, total cost: $${totalCost.toFixed(2)}`,
          affectedLogs: recentLogs.map(l => l.id),
          detectedAt: new Date(),
          recommendation: 'Review usage patterns, enable caching, or optimize prompts to reduce token usage',
        });
      }

      // 5. Detect suspicious input patterns (very long inputs)
      const longInputLogs = recentLogs.filter(log => log.inputData.length > 50000);
      if (longInputLogs.length > 5) {
        anomalies.push({
          id: uuidv4(),
          type: 'suspicious_input',
          severity: 'medium',
          description: `${longInputLogs.length} operations with unusually large input data (>50KB)`,
          affectedLogs: longInputLogs.map(l => l.id),
          detectedAt: new Date(),
          recommendation: 'Review input data sources and implement input size limits',
        });
      }

      return anomalies;
    } catch (error) {
      console.error('Failed to detect anomalous activity:', error);
      throw error;
    }
  }

  /**
   * Check for anomalies after logging (internal method)
   */
  private static async checkForAnomalies(log: AIActivityLog): Promise<void> {
    try {
      // Check for repeated low confidence from same model
      if (log.confidenceScore !== undefined && log.confidenceScore < 50) {
        const recentLowConfidence = await db.aiActivityLogs
          .where('modelName')
          .equals(log.modelName)
          .and(l => 
            l.timestamp > new Date(Date.now() - 3600000) && // Last hour
            l.confidenceScore !== undefined &&
            l.confidenceScore < 50
          )
          .count();

        if (recentLowConfidence >= 5) {
          console.warn(`Anomaly detected: ${recentLowConfidence} low confidence results from ${log.modelName} in the last hour`);
        }
      }

      // Check for high error rate
      if (log.status === 'error') {
        const recentErrors = await db.aiActivityLogs
          .where('timestamp')
          .above(new Date(Date.now() - 3600000))
          .and(l => l.status === 'error')
          .count();

        if (recentErrors >= 10) {
          console.warn(`Anomaly detected: ${recentErrors} errors in the last hour`);
        }
      }
    } catch (error) {
      // Silently fail anomaly detection
      console.error('Anomaly check failed:', error);
    }
  }

  /**
   * Get log count by date range
   */
  static async getLogCount(startDate?: Date, endDate?: Date): Promise<number> {
    try {
      let query = db.aiActivityLogs;

      if (startDate && endDate) {
        return await query
          .where('timestamp')
          .between(startDate, endDate, true, true)
          .count();
      } else if (startDate) {
        return await query
          .where('timestamp')
          .above(startDate)
          .count();
      } else if (endDate) {
        return await query
          .where('timestamp')
          .below(endDate)
          .count();
      }

      return await query.count();
    } catch (error) {
      console.error('Failed to get log count:', error);
      throw error;
    }
  }

  /**
   * Clear all activity logs (use with caution)
   */
  static async clearAllLogs(): Promise<number> {
    try {
      const count = await db.aiActivityLogs.count();
      await db.aiActivityLogs.clear();
      return count;
    } catch (error) {
      console.error('Failed to clear logs:', error);
      throw error;
    }
  }
}
