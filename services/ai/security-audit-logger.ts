// Security Audit Logger Service for AI Control Center
// Logs all user actions with IP tracking and tamper-proof signatures

import { db } from '@/lib/db/schema';
import { generateId } from '@/lib/utils/generators';
import { DataEncryption } from '@/lib/security/encryption';

export interface SecurityAuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  outcome: 'success' | 'failure' | 'denied';
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  requiresMFA: boolean;
  mfaVerified: boolean;
  signature: string;
  createdAt: Date;
}

export interface SecurityAuditFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
  resourceType?: string;
  severity?: string;
  outcome?: string;
  page?: number;
  pageSize?: number;
}

export class SecurityAuditLogger {
  /**
   * Log a security audit event
   */
  static async logAction(entry: Omit<SecurityAuditEntry, 'id' | 'timestamp' | 'signature' | 'createdAt'>): Promise<void> {
    const id = generateId();
    const timestamp = new Date();
    
    // Create tamper-proof signature
    const dataToSign = JSON.stringify({
      id,
      timestamp: timestamp.toISOString(),
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      outcome: entry.outcome,
    });
    
    const signature = DataEncryption.createHMAC(dataToSign);
    
    const auditEntry: SecurityAuditEntry = {
      id,
      timestamp,
      ...entry,
      signature,
      createdAt: timestamp,
    };
    
    // Store in database
    await db.securityAuditLog.add(auditEntry);
    
    // Log critical actions to console
    if (entry.severity === 'critical' || entry.severity === 'high') {
      console.warn('[SECURITY AUDIT]', {
        action: entry.action,
        user: entry.userName,
        severity: entry.severity,
        outcome: entry.outcome,
      });
    }
  }
  
  /**
   * Get audit logs with filtering
   */
  static async getAuditLogs(filter: SecurityAuditFilter): Promise<{
    logs: SecurityAuditEntry[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    let query = db.securityAuditLog.orderBy('timestamp').reverse();
    
    // Apply filters
    if (filter.startDate || filter.endDate) {
      query = query.filter(log => {
        if (filter.startDate && log.timestamp < filter.startDate) return false;
        if (filter.endDate && log.timestamp > filter.endDate) return false;
        return true;
      });
    }
    
    if (filter.userId) {
      query = query.filter(log => log.userId === filter.userId);
    }
    
    if (filter.action) {
      query = query.filter(log => log.action.includes(filter.action));
    }
    
    if (filter.resourceType) {
      query = query.filter(log => log.resourceType === filter.resourceType);
    }
    
    if (filter.severity) {
      query = query.filter(log => log.severity === filter.severity);
    }
    
    if (filter.outcome) {
      query = query.filter(log => log.outcome === filter.outcome);
    }
    
    const allLogs = await query.toArray();
    const total = allLogs.length;
    
    // Pagination
    const page = filter.page || 1;
    const pageSize = filter.pageSize || 50;
    const startIndex = (page - 1) * pageSize;
    const logs = allLogs.slice(startIndex, startIndex + pageSize);
    
    return { logs, total, page, pageSize };
  }
  
  /**
   * Export audit logs with tamper-proof signature
   */
  static async exportAuditLogs(filter: SecurityAuditFilter): Promise<{
    data: SecurityAuditEntry[];
    exportSignature: string;
    exportTimestamp: Date;
  }> {
    const { logs } = await this.getAuditLogs({ ...filter, pageSize: 10000 });
    const exportTimestamp = new Date();
    
    // Create tamper-proof signature for the entire export
    const exportData = JSON.stringify({
      logs: logs.map(l => ({
        id: l.id,
        timestamp: l.timestamp,
        userId: l.userId,
        action: l.action,
        outcome: l.outcome,
      })),
      exportTimestamp: exportTimestamp.toISOString(),
      count: logs.length,
    });
    
    const exportSignature = DataEncryption.createHMAC(exportData);
    
    return {
      data: logs,
      exportSignature,
      exportTimestamp,
    };
  }
  
  /**
   * Verify audit log integrity
   */
  static verifyLogIntegrity(log: SecurityAuditEntry): boolean {
    const dataToVerify = JSON.stringify({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      userId: log.userId,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      outcome: log.outcome,
    });
    
    return DataEncryption.verifyHMAC(dataToVerify, log.signature);
  }
  
  /**
   * Get client IP address (browser-side approximation)
   */
  static async getClientIP(): Promise<string> {
    try {
      // In production, this should be obtained from server-side
      // For now, return a placeholder
      return 'client-ip';
    } catch {
      return 'unknown';
    }
  }
  
  /**
   * Log AI configuration change
   */
  static async logConfigChange(
    userId: string,
    userName: string,
    userRole: string,
    settingName: string,
    oldValue: any,
    newValue: any,
    requiresMFA: boolean = false,
    mfaVerified: boolean = false
  ): Promise<void> {
    await this.logAction({
      userId,
      userName,
      userRole,
      action: 'ai_config_change',
      resourceType: 'ai_configuration',
      resourceId: settingName,
      ipAddress: await this.getClientIP(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      outcome: 'success',
      details: {
        settingName,
        oldValue,
        newValue,
      },
      severity: this.getConfigChangeSeverity(settingName),
      requiresMFA,
      mfaVerified,
    });
  }
  
  /**
   * Log AI model access
   */
  static async logModelAccess(
    userId: string,
    userName: string,
    userRole: string,
    modelName: string,
    operation: string,
    outcome: 'success' | 'failure' | 'denied'
  ): Promise<void> {
    await this.logAction({
      userId,
      userName,
      userRole,
      action: `ai_model_${operation}`,
      resourceType: 'ai_model',
      resourceId: modelName,
      ipAddress: await this.getClientIP(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      outcome,
      details: { modelName, operation },
      severity: outcome === 'denied' ? 'high' : 'medium',
      requiresMFA: false,
      mfaVerified: false,
    });
  }
  
  /**
   * Log data export
   */
  static async logDataExport(
    userId: string,
    userName: string,
    userRole: string,
    dataType: string,
    recordCount: number
  ): Promise<void> {
    await this.logAction({
      userId,
      userName,
      userRole,
      action: 'data_export',
      resourceType: dataType,
      resourceId: 'bulk',
      ipAddress: await this.getClientIP(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      outcome: 'success',
      details: { dataType, recordCount },
      severity: recordCount > 1000 ? 'high' : 'medium',
      requiresMFA: recordCount > 1000,
      mfaVerified: false,
    });
  }
  
  /**
   * Log authentication event
   */
  static async logAuthEvent(
    userId: string,
    userName: string,
    userRole: string,
    event: 'login' | 'logout' | 'mfa_success' | 'mfa_failure' | 'access_denied',
    outcome: 'success' | 'failure' | 'denied'
  ): Promise<void> {
    await this.logAction({
      userId,
      userName,
      userRole,
      action: `auth_${event}`,
      resourceType: 'authentication',
      resourceId: userId,
      ipAddress: await this.getClientIP(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      outcome,
      details: { event },
      severity: outcome === 'failure' || outcome === 'denied' ? 'high' : 'low',
      requiresMFA: false,
      mfaVerified: event === 'mfa_success',
    });
  }
  
  /**
   * Get configuration change severity
   */
  private static getConfigChangeSeverity(settingName: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalSettings = ['api_key', 'encryption_key', 'security', 'phi_sanitization'];
    const highSettings = ['rate_limit', 'budget', 'model_enabled'];
    
    if (criticalSettings.some(s => settingName.toLowerCase().includes(s))) {
      return 'critical';
    }
    
    if (highSettings.some(s => settingName.toLowerCase().includes(s))) {
      return 'high';
    }
    
    return 'medium';
  }
}
