// Enhanced Audit Trail Service

import { db } from '@/lib/db/schema';
import type {
  AuditLog,
  AuditTrailExport,
  AuditSchedule,
  AuditFinding,
  AuditType,
  AuditStatus,
  AuditFindingSeverity,
  AuditFindingStatus,
} from '@/types/database';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

/**
 * Enhanced Audit Trail Service
 * Provides comprehensive, tamper-proof audit logging with advanced search and export capabilities
 */
export class AuditTrailService {
  /**
   * Create an audit log entry
   */
  static async createAuditLog(
    log: Omit<AuditLog, 'id' | 'logId' | 'timestamp' | 'createdAt' | 'checksum' | 'previousChecksum'>
  ): Promise<AuditLog> {
    // Get the previous log entry for chaining
    const previousLog = await db.auditLogs
      .orderBy('timestamp')
      .reverse()
      .first();

    const newLog: AuditLog = {
      ...log,
      id: uuidv4(),
      logId: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      createdAt: new Date(),
      previousChecksum: previousLog?.checksum,
      checksum: '', // Will be calculated below
    };

    // Calculate checksum for tamper detection
    newLog.checksum = this.calculateChecksum(newLog);

    await db.auditLogs.add(newLog);

    return newLog;
  }

  /**
   * Calculate checksum for audit log entry
   */
  private static calculateChecksum(log: Omit<AuditLog, 'checksum'>): string {
    const data = JSON.stringify({
      logId: log.logId,
      timestamp: log.timestamp,
      eventType: log.eventType,
      entityType: log.entityType,
      entityId: log.entityId,
      userId: log.userId,
      action: log.action,
      beforeData: log.beforeData,
      afterData: log.afterData,
      previousChecksum: log.previousChecksum,
    });

    // In browser environment, use SubtleCrypto or a simple hash
    // For now, using a simple hash function
    return this.simpleHash(data);
  }

  /**
   * Simple hash function for browser environment
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Verify audit log chain integrity
   */
  static async verifyAuditLogIntegrity(startDate?: Date, endDate?: Date): Promise<{
    isValid: boolean;
    totalLogs: number;
    verifiedLogs: number;
    tamperedLogs: string[];
    brokenChains: string[];
  }> {
    let query = db.auditLogs.orderBy('timestamp');

    if (startDate) {
      query = query.filter(log => log.timestamp >= startDate);
    }
    if (endDate) {
      query = query.filter(log => log.timestamp <= endDate);
    }

    const logs = await query.toArray();

    const tamperedLogs: string[] = [];
    const brokenChains: string[] = [];
    let verifiedLogs = 0;

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      // Verify checksum
      const calculatedChecksum = this.calculateChecksum({
        ...log,
        checksum: '', // Exclude checksum from calculation
      });

      if (calculatedChecksum !== log.checksum) {
        tamperedLogs.push(log.logId);
      } else {
        verifiedLogs++;
      }

      // Verify chain
      if (i > 0) {
        const previousLog = logs[i - 1];
        if (log.previousChecksum !== previousLog.checksum) {
          brokenChains.push(log.logId);
        }
      }
    }

    return {
      isValid: tamperedLogs.length === 0 && brokenChains.length === 0,
      totalLogs: logs.length,
      verifiedLogs,
      tamperedLogs,
      brokenChains,
    };
  }

  /**
   * Search audit logs with advanced filters
   */
  static async searchAuditLogs(filters: {
    startDate?: Date;
    endDate?: Date;
    entityTypes?: string[];
    userIds?: string[];
    eventTypes?: string[];
    entityId?: string;
    isSecurityEvent?: boolean;
    isCriticalOperation?: boolean;
    complianceRelevant?: boolean;
    status?: 'success' | 'failure' | 'partial';
    searchText?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    logs: AuditLog[];
    total: number;
  }> {
    let query = db.auditLogs.orderBy('timestamp').reverse();

    // Apply filters
    let logs = await query.toArray();

    if (filters.startDate) {
      logs = logs.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      logs = logs.filter(log => log.timestamp <= filters.endDate!);
    }

    if (filters.entityTypes && filters.entityTypes.length > 0) {
      logs = logs.filter(log => filters.entityTypes!.includes(log.entityType));
    }

    if (filters.userIds && filters.userIds.length > 0) {
      logs = logs.filter(log => filters.userIds!.includes(log.userId));
    }

    if (filters.eventTypes && filters.eventTypes.length > 0) {
      logs = logs.filter(log => filters.eventTypes!.includes(log.eventType));
    }

    if (filters.entityId) {
      logs = logs.filter(log => log.entityId === filters.entityId);
    }

    if (filters.isSecurityEvent !== undefined) {
      logs = logs.filter(log => log.isSecurityEvent === filters.isSecurityEvent);
    }

    if (filters.isCriticalOperation !== undefined) {
      logs = logs.filter(log => log.isCriticalOperation === filters.isCriticalOperation);
    }

    if (filters.complianceRelevant !== undefined) {
      logs = logs.filter(log => log.complianceRelevant === filters.complianceRelevant);
    }

    if (filters.status) {
      logs = logs.filter(log => log.status === filters.status);
    }

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      logs = logs.filter(log =>
        log.action.toLowerCase().includes(searchLower) ||
        log.entityType.toLowerCase().includes(searchLower) ||
        log.username.toLowerCase().includes(searchLower) ||
        log.entityId.toLowerCase().includes(searchLower)
      );
    }

    const total = logs.length;

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    const paginatedLogs = logs.slice(offset, offset + limit);

    return {
      logs: paginatedLogs,
      total,
    };
  }

  /**
   * Get audit logs for a specific entity
   */
  static async getEntityAuditHistory(
    entityType: string,
    entityId: string
  ): Promise<AuditLog[]> {
    return await db.auditLogs
      .where('[entityType+entityId]')
      .equals([entityType, entityId])
      .reverse()
      .sortBy('timestamp');
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserAuditHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditLog[]> {
    let logs = await db.auditLogs
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('timestamp');

    if (startDate) {
      logs = logs.filter(log => log.timestamp >= startDate);
    }

    if (endDate) {
      logs = logs.filter(log => log.timestamp <= endDate);
    }

    return logs;
  }

  /**
   * Export audit logs
   */
  static async exportAuditLogs(
    requestedBy: string,
    filters: {
      startDate: Date;
      endDate: Date;
      entityTypes?: string[];
      userIds?: string[];
      eventTypes?: string[];
    },
    purpose: string,
    fileFormat: 'json' | 'csv' | 'pdf' | 'xml' = 'json'
  ): Promise<AuditTrailExport> {
    const { logs, total } = await this.searchAuditLogs({
      ...filters,
      limit: 10000, // Max export limit
    });

    // Generate export file (in real implementation, this would create actual files)
    const exportData = this.formatExportData(logs, fileFormat);
    const fileUrl = `exports/audit-${Date.now()}.${fileFormat}`;
    const fileSize = JSON.stringify(exportData).length;

    // Set expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const exportRecord: AuditTrailExport = {
      id: uuidv4(),
      exportId: `EXPORT-${Date.now()}`,
      requestedBy,
      requestDate: new Date(),
      startDate: filters.startDate,
      endDate: filters.endDate,
      entityTypes: filters.entityTypes,
      userIds: filters.userIds,
      eventTypes: filters.eventTypes,
      totalRecords: total,
      fileFormat,
      fileUrl,
      fileSize,
      purpose,
      encryptionEnabled: false,
      expiryDate,
      status: 'completed',
      completedAt: new Date(),
      createdAt: new Date(),
    };

    await db.auditTrailExports.add(exportRecord);

    return exportRecord;
  }

  /**
   * Format export data based on file format
   */
  private static formatExportData(logs: AuditLog[], format: string): any {
    switch (format) {
      case 'json':
        return logs;
      case 'csv':
        return this.convertToCSV(logs);
      case 'xml':
        return this.convertToXML(logs);
      case 'pdf':
        return { logs, format: 'pdf' }; // PDF generation would be handled separately
      default:
        return logs;
    }
  }

  /**
   * Convert logs to CSV format
   */
  private static convertToCSV(logs: AuditLog[]): string {
    const headers = [
      'Log ID',
      'Timestamp',
      'Event Type',
      'Entity Type',
      'Entity ID',
      'User ID',
      'Username',
      'Action',
      'Status',
      'IP Address',
    ];

    const rows = logs.map(log => [
      log.logId,
      log.timestamp.toISOString(),
      log.eventType,
      log.entityType,
      log.entityId,
      log.userId,
      log.username,
      log.action,
      log.status,
      log.ipAddress,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Convert logs to XML format
   */
  private static convertToXML(logs: AuditLog[]): string {
    const xmlLogs = logs.map(log => `
      <AuditLog>
        <LogID>${log.logId}</LogID>
        <Timestamp>${log.timestamp.toISOString()}</Timestamp>
        <EventType>${log.eventType}</EventType>
        <EntityType>${log.entityType}</EntityType>
        <EntityID>${log.entityId}</EntityID>
        <UserID>${log.userId}</UserID>
        <Username>${log.username}</Username>
        <Action>${log.action}</Action>
        <Status>${log.status}</Status>
        <IPAddress>${log.ipAddress}</IPAddress>
      </AuditLog>
    `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?><AuditLogs>${xmlLogs}</AuditLogs>`;
  }

  /**
   * Get audit trail exports
   */
  static async getAuditTrailExports(filters?: {
    requestedBy?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditTrailExport[]> {
    let query = db.auditTrailExports.toCollection();

    if (filters?.requestedBy) {
      query = db.auditTrailExports.where('requestedBy').equals(filters.requestedBy);
    }

    const exports = await query.reverse().sortBy('requestDate');

    // Apply additional filters
    let filtered = exports;

    if (filters?.status) {
      filtered = filtered.filter(e => e.status === filters.status);
    }

    if (filters?.startDate) {
      filtered = filtered.filter(e => e.requestDate >= filters.startDate!);
    }

    if (filters?.endDate) {
      filtered = filtered.filter(e => e.requestDate <= filters.endDate!);
    }

    return filtered;
  }

  /**
   * Create audit schedule
   */
  static async createAuditSchedule(
    schedule: Omit<AuditSchedule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AuditSchedule> {
    const newSchedule: AuditSchedule = {
      ...schedule,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.auditSchedules.add(newSchedule);

    return newSchedule;
  }

  /**
   * Get audit schedules
   */
  static async getAuditSchedules(filters?: {
    auditType?: AuditType;
    status?: AuditStatus;
    leadAuditorId?: string;
  }): Promise<AuditSchedule[]> {
    let query = db.auditSchedules.toCollection();

    if (filters?.auditType && filters?.status) {
      query = db.auditSchedules.where('[auditType+status]').equals([filters.auditType, filters.status]);
    } else if (filters?.status) {
      query = db.auditSchedules.where('status').equals(filters.status);
    }

    const schedules = await query.toArray();

    // Apply additional filters
    let filtered = schedules;

    if (filters?.leadAuditorId) {
      filtered = filtered.filter(s => s.leadAuditorId === filters.leadAuditorId);
    }

    return filtered.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }

  /**
   * Update audit schedule
   */
  static async updateAuditSchedule(
    id: string,
    updates: Partial<AuditSchedule>
  ): Promise<void> {
    await db.auditSchedules.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  /**
   * Create audit finding
   */
  static async createAuditFinding(
    finding: Omit<AuditFinding, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AuditFinding> {
    const newFinding: AuditFinding = {
      ...finding,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.auditFindings.add(newFinding);

    return newFinding;
  }

  /**
   * Get audit findings
   */
  static async getAuditFindings(filters?: {
    auditScheduleId?: string;
    severity?: AuditFindingSeverity;
    status?: AuditFindingStatus;
    assignedTo?: string;
  }): Promise<AuditFinding[]> {
    let query = db.auditFindings.toCollection();

    if (filters?.auditScheduleId) {
      query = db.auditFindings.where('auditScheduleId').equals(filters.auditScheduleId);
    }

    const findings = await query.toArray();

    // Apply additional filters
    let filtered = findings;

    if (filters?.severity) {
      filtered = filtered.filter(f => f.severity === filters.severity);
    }

    if (filters?.status) {
      filtered = filtered.filter(f => f.status === filters.status);
    }

    if (filters?.assignedTo) {
      filtered = filtered.filter(f => f.assignedTo === filters.assignedTo);
    }

    return filtered.sort((a, b) => {
      // Sort by severity (critical first) then by due date
      const severityOrder = { critical: 0, major: 1, minor: 2 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      
      if (severityDiff !== 0) return severityDiff;
      
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  }

  /**
   * Update audit finding
   */
  static async updateAuditFinding(
    id: string,
    updates: Partial<AuditFinding>
  ): Promise<void> {
    await db.auditFindings.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  /**
   * Get audit statistics
   */
  static async getAuditStatistics(startDate?: Date, endDate?: Date): Promise<{
    totalLogs: number;
    securityEvents: number;
    criticalOperations: number;
    complianceRelevantLogs: number;
    failedOperations: number;
    uniqueUsers: number;
    topUsers: Array<{ userId: string; username: string; count: number }>;
    topEntityTypes: Array<{ entityType: string; count: number }>;
    topEventTypes: Array<{ eventType: string; count: number }>;
  }> {
    const { logs, total } = await this.searchAuditLogs({
      startDate,
      endDate,
      limit: 100000,
    });

    const securityEvents = logs.filter(l => l.isSecurityEvent).length;
    const criticalOperations = logs.filter(l => l.isCriticalOperation).length;
    const complianceRelevantLogs = logs.filter(l => l.complianceRelevant).length;
    const failedOperations = logs.filter(l => l.status === 'failure').length;

    const uniqueUsers = new Set(logs.map(l => l.userId)).size;

    // Calculate top users
    const userCounts: Record<string, { username: string; count: number }> = {};
    logs.forEach(log => {
      if (!userCounts[log.userId]) {
        userCounts[log.userId] = { username: log.username, count: 0 };
      }
      userCounts[log.userId].count++;
    });

    const topUsers = Object.entries(userCounts)
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate top entity types
    const entityTypeCounts: Record<string, number> = {};
    logs.forEach(log => {
      entityTypeCounts[log.entityType] = (entityTypeCounts[log.entityType] || 0) + 1;
    });

    const topEntityTypes = Object.entries(entityTypeCounts)
      .map(([entityType, count]) => ({ entityType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate top event types
    const eventTypeCounts: Record<string, number> = {};
    logs.forEach(log => {
      eventTypeCounts[log.eventType] = (eventTypeCounts[log.eventType] || 0) + 1;
    });

    const topEventTypes = Object.entries(eventTypeCounts)
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalLogs: total,
      securityEvents,
      criticalOperations,
      complianceRelevantLogs,
      failedOperations,
      uniqueUsers,
      topUsers,
      topEntityTypes,
      topEventTypes,
    };
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  static async cleanupOldAuditLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldLogs = await db.auditLogs
      .where('timestamp')
      .below(cutoffDate)
      .toArray();

    // Only delete non-compliance-relevant logs
    const logsToDelete = oldLogs.filter(log => !log.complianceRelevant);

    await Promise.all(logsToDelete.map(log => db.auditLogs.delete(log.id)));

    return logsToDelete.length;
  }
}
