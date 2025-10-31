// ============================================================================
// Audit Action Types
// ============================================================================

export interface AuditAction {
  type: string;
  entityType: string;
  entityId: string;
  userId: string;
  before?: any;
  after?: any;
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface CriticalAction extends AuditAction {
  severity: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval?: boolean;
  approvedBy?: string;
}

// ============================================================================
// Audit Logger Class
// ============================================================================

export class AuditLogger {
  private static logs: AuditAction[] = [];
  private static readonly MAX_LOGS = 1000;

  /**
   * Logs an action to the audit trail
   */
  static async logAction(action: AuditAction): Promise<void> {
    const auditEntry: AuditAction = {
      ...action,
      timestamp: action.timestamp || new Date(),
    };

    // Add to in-memory log
    this.logs.push(auditEntry);

    // Keep only last MAX_LOGS entries
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }

    // In a real implementation, this would save to database
    // For now, we'll use localStorage
    if (typeof window !== 'undefined') {
      try {
        const storedLogs = JSON.parse(
          localStorage.getItem('audit_logs') || '[]'
        );
        storedLogs.push({
          ...auditEntry,
          timestamp: auditEntry.timestamp?.toISOString() || new Date().toISOString(),
        });

        // Keep only last 500 logs in localStorage
        if (storedLogs.length > 500) {
          storedLogs.shift();
        }

        localStorage.setItem('audit_logs', JSON.stringify(storedLogs));
      } catch (error) {
        console.error('Failed to store audit log:', error);
      }
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Audit Log:', auditEntry);
    }
  }

  /**
   * Logs a critical action that requires special attention
   */
  static async logCriticalAction(action: CriticalAction): Promise<void> {
    await this.logAction(action);

    // Send notification to admins for critical actions
    if (action.severity === 'critical' || action.severity === 'high') {
      await this.notifyAdmins(action);
    }

    // In production, this would also send to external monitoring service
    console.warn('Critical Action:', action);
  }

  /**
   * Gets audit trail for a specific entity
   */
  static async getAuditTrail(
    entityType: string,
    entityId: string
  ): Promise<AuditAction[]> {
    // Filter in-memory logs
    const memoryLogs = this.logs.filter(
      (log) => log.entityType === entityType && log.entityId === entityId
    );

    // Get from localStorage
    if (typeof window !== 'undefined') {
      try {
        const storedLogs = JSON.parse(
          localStorage.getItem('audit_logs') || '[]'
        );
        const storedFiltered = storedLogs
          .filter(
            (log: any) =>
              log.entityType === entityType && log.entityId === entityId
          )
          .map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp),
          }));

        // Combine and deduplicate
        const combined = [...memoryLogs, ...storedFiltered];
        const unique = Array.from(
          new Map(
            combined.map((log) => [
              `${log.type}-${log.timestamp?.getTime() || 0}`,
              log,
            ])
          ).values()
        );

        return unique.sort(
          (a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
        );
      } catch (error) {
        console.error('Failed to retrieve audit logs:', error);
      }
    }

    return memoryLogs;
  }

  /**
   * Gets all audit logs for a user
   */
  static async getUserAuditTrail(userId: string): Promise<AuditAction[]> {
    const memoryLogs = this.logs.filter((log) => log.userId === userId);

    if (typeof window !== 'undefined') {
      try {
        const storedLogs = JSON.parse(
          localStorage.getItem('audit_logs') || '[]'
        );
        const storedFiltered = storedLogs
          .filter((log: any) => log.userId === userId)
          .map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp),
          }));

        const combined = [...memoryLogs, ...storedFiltered];
        const unique = Array.from(
          new Map(
            combined.map((log) => [
              `${log.type}-${log.timestamp.getTime()}`,
              log,
            ])
          ).values()
        );

        return unique.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        );
      } catch (error) {
        console.error('Failed to retrieve user audit logs:', error);
      }
    }

    return memoryLogs;
  }

  /**
   * Gets recent audit logs
   */
  static async getRecentLogs(limit: number = 50): Promise<AuditAction[]> {
    const memoryLogs = [...this.logs];

    if (typeof window !== 'undefined') {
      try {
        const storedLogs = JSON.parse(
          localStorage.getItem('audit_logs') || '[]'
        );
        const storedParsed = storedLogs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));

        const combined = [...memoryLogs, ...storedParsed];
        const unique = Array.from(
          new Map(
            combined.map((log) => [
              `${log.type}-${log.timestamp?.getTime() || 0}`,
              log,
            ])
          ).values()
        );

        return unique
          .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
          .slice(0, limit);
      } catch (error) {
        console.error('Failed to retrieve recent logs:', error);
      }
    }

    return memoryLogs
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  /**
   * Calculates changes between before and after states
   */
  static calculateChanges(
    before: any,
    after: any
  ): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};

    // Get all keys from both objects
    const allKeys = new Set([
      ...Object.keys(before || {}),
      ...Object.keys(after || {}),
    ]);

    for (const key of allKeys) {
      const oldValue = before?.[key];
      const newValue = after?.[key];

      // Skip if values are the same
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
        continue;
      }

      changes[key] = {
        old: oldValue,
        new: newValue,
      };
    }

    return changes;
  }

  /**
   * Notifies admins of critical actions
   */
  private static async notifyAdmins(action: CriticalAction): Promise<void> {
    // In a real implementation, this would send notifications via email, SMS, etc.
    console.warn('Admin Notification:', {
      message: `Critical action: ${action.type}`,
      severity: action.severity,
      entityType: action.entityType,
      entityId: action.entityId,
      userId: action.userId,
      timestamp: action.timestamp,
    });
  }

  /**
   * Clears audit logs
   */
  static clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('audit_logs');
    }
  }

  /**
   * Exports audit logs
   */
  static async exportLogs(): Promise<string> {
    const allLogs = await this.getRecentLogs(1000);
    return JSON.stringify(allLogs, null, 2);
  }
}

// ============================================================================
// Audit Decorators
// ============================================================================

/**
 * Decorator to automatically log method calls
 */
export function Auditable(entityType: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const userId = getCurrentUserId();
      const entityId = args[0]; // Assume first arg is entity ID

      try {
        const result = await originalMethod.apply(this, args);

        await AuditLogger.logAction({
          type: propertyKey,
          entityType,
          entityId,
          userId,
          metadata: { args },
        });

        return result;
      } catch (error) {
        await AuditLogger.logAction({
          type: `${propertyKey}_failed`,
          entityType,
          entityId,
          userId,
          metadata: { args, error: (error as Error).message },
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for critical operations
 */
export function CriticalOperation(severity: CriticalAction['severity']) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const userId = getCurrentUserId();
      const entityId = args[0];

      const action: CriticalAction = {
        type: propertyKey,
        entityType: target.constructor.name,
        entityId,
        userId,
        severity,
        metadata: { args },
      };

      await AuditLogger.logCriticalAction(action);

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets current user ID (placeholder - should be implemented based on auth system)
 */
function getCurrentUserId(): string {
  // In a real implementation, this would get the user ID from the auth system
  if (typeof window !== 'undefined') {
    return localStorage.getItem('current_user_id') || 'anonymous';
  }
  return 'system';
}

/**
 * Logs data access
 */
export async function logDataAccess(
  entityType: string,
  entityId: string,
  action: 'read' | 'write' | 'delete'
): Promise<void> {
  await AuditLogger.logAction({
    type: `data_${action}`,
    entityType,
    entityId,
    userId: getCurrentUserId(),
    metadata: { action },
  });
}

/**
 * Logs authentication event
 */
export async function logAuthEvent(
  event: 'login' | 'logout' | 'failed_login' | 'password_change',
  userId: string,
  metadata?: Record<string, any>
): Promise<void> {
  await AuditLogger.logAction({
    type: `auth_${event}`,
    entityType: 'user',
    entityId: userId,
    userId,
    metadata,
  });
}

/**
 * Logs permission check
 */
export async function logPermissionCheck(
  userId: string,
  permission: string,
  granted: boolean
): Promise<void> {
  await AuditLogger.logAction({
    type: 'permission_check',
    entityType: 'user',
    entityId: userId,
    userId,
    metadata: { permission, granted },
  });
}

/**
 * Logs configuration change
 */
export async function logConfigChange(
  setting: string,
  oldValue: any,
  newValue: any,
  userId: string
): Promise<void> {
  await AuditLogger.logCriticalAction({
    type: 'config_change',
    entityType: 'system',
    entityId: setting,
    userId,
    severity: 'high',
    before: oldValue,
    after: newValue,
    changes: { [setting]: { old: oldValue, new: newValue } },
  });
}

/**
 * Logs data export
 */
export async function logDataExport(
  entityType: string,
  recordCount: number,
  userId: string
): Promise<void> {
  await AuditLogger.logCriticalAction({
    type: 'data_export',
    entityType,
    entityId: 'bulk',
    userId,
    severity: 'medium',
    metadata: { recordCount },
  });
}

/**
 * Logs bulk operation
 */
export async function logBulkOperation(
  operation: string,
  entityType: string,
  affectedIds: string[],
  userId: string
): Promise<void> {
  await AuditLogger.logCriticalAction({
    type: `bulk_${operation}`,
    entityType,
    entityId: 'bulk',
    userId,
    severity: 'high',
    metadata: { affectedIds, count: affectedIds.length },
  });
}
