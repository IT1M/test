// AI Data Retention Scheduler
// Background job scheduler for automatic log cleanup and archival

import { DataRetentionService, RetentionPolicyConfig, ArchivalResult } from './data-retention';
import { db } from '@/lib/db/schema';

/**
 * Scheduled job status
 */
export interface ScheduledJob {
  id: string;
  policyId: string;
  policyName: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  lastExecution?: Date;
  nextExecution?: Date;
  lastResult?: ArchivalResult;
  timerId?: NodeJS.Timeout | number;
}

/**
 * Retention Scheduler Class
 * Manages background jobs for automatic data retention
 */
export class RetentionScheduler {
  private static jobs: Map<string, ScheduledJob> = new Map();
  private static integrityCheckTimer?: NodeJS.Timeout | number;

  /**
   * Default retention policies
   */
  static readonly DEFAULT_POLICIES: RetentionPolicyConfig[] = [
    {
      id: 'policy-90-days',
      name: 'Standard 90-Day Retention',
      retentionDays: 90,
      archiveBeforeDelete: true,
      compressionEnabled: true,
      enabled: true,
      executionSchedule: 'daily',
    },
    {
      id: 'policy-error-logs-30-days',
      name: 'Error Logs 30-Day Retention',
      retentionDays: 30,
      archiveBeforeDelete: true,
      compressionEnabled: true,
      applyToStatuses: ['error', 'timeout', 'rate-limited'],
      enabled: true,
      executionSchedule: 'weekly',
    },
    {
      id: 'policy-success-logs-180-days',
      name: 'Success Logs 180-Day Retention',
      retentionDays: 180,
      archiveBeforeDelete: false,
      compressionEnabled: false,
      applyToStatuses: ['success'],
      enabled: false,
      executionSchedule: 'monthly',
    },
  ];

  /**
   * Initialize scheduler with default policies
   */
  static async initialize(): Promise<void> {
    console.log('Initializing AI Data Retention Scheduler...');

    // Schedule default policies
    for (const policy of this.DEFAULT_POLICIES) {
      if (policy.enabled) {
        await this.schedulePolicy(policy);
      }
    }

    // Schedule daily integrity check
    this.scheduleDailyIntegrityCheck();

    console.log(`Retention Scheduler initialized with ${this.jobs.size} active jobs`);
  }

  /**
   * Schedule a retention policy
   */
  static async schedulePolicy(policy: RetentionPolicyConfig): Promise<string> {
    // Check if already scheduled
    if (this.jobs.has(policy.id)) {
      console.log(`Policy ${policy.name} is already scheduled`);
      return policy.id;
    }

    const job: ScheduledJob = {
      id: policy.id,
      policyId: policy.id,
      policyName: policy.name,
      status: 'scheduled',
      nextExecution: this.calculateNextExecution(policy.executionSchedule || 'daily'),
    };

    // Schedule the job
    const timerId = DataRetentionService.scheduleRetentionJob(
      policy,
      (result: ArchivalResult) => {
        this.handleJobCompletion(policy.id, result);
      }
    );

    job.timerId = timerId;
    this.jobs.set(policy.id, job);

    console.log(`Scheduled retention policy: ${policy.name} (next execution: ${job.nextExecution?.toISOString()})`);
    return policy.id;
  }

  /**
   * Unschedule a retention policy
   */
  static unschedulePolicy(policyId: string): boolean {
    const job = this.jobs.get(policyId);
    if (!job) {
      return false;
    }

    // Clear timer
    if (job.timerId) {
      clearTimeout(job.timerId as NodeJS.Timeout);
    }

    this.jobs.delete(policyId);
    console.log(`Unscheduled retention policy: ${job.policyName}`);
    return true;
  }

  /**
   * Execute a policy immediately (manual trigger)
   */
  static async executeNow(policyId: string): Promise<ArchivalResult> {
    const job = this.jobs.get(policyId);
    if (!job) {
      throw new Error(`Policy ${policyId} not found`);
    }

    // Find the policy configuration
    const policy = this.DEFAULT_POLICIES.find(p => p.id === policyId);
    if (!policy) {
      throw new Error(`Policy configuration for ${policyId} not found`);
    }

    // Update job status
    job.status = 'running';
    this.jobs.set(policyId, job);

    try {
      const result = await DataRetentionService.executeRetentionPolicy(policy);
      this.handleJobCompletion(policyId, result);
      return result;
    } catch (error) {
      job.status = 'failed';
      job.lastExecution = new Date();
      this.jobs.set(policyId, job);
      throw error;
    }
  }

  /**
   * Handle job completion
   */
  private static handleJobCompletion(policyId: string, result: ArchivalResult): void {
    const job = this.jobs.get(policyId);
    if (!job) return;

    job.status = result.errors.length > 0 ? 'failed' : 'completed';
    job.lastExecution = new Date();
    job.lastResult = result;
    
    // Calculate next execution
    const policy = this.DEFAULT_POLICIES.find(p => p.id === policyId);
    if (policy) {
      job.nextExecution = this.calculateNextExecution(policy.executionSchedule || 'daily');
    }

    this.jobs.set(policyId, job);

    // Log result
    console.log(`Retention policy ${job.policyName} completed:`, {
      archived: result.archivedLogs,
      deleted: result.deletedLogs,
      errors: result.errors.length,
    });

    // Log to system logs
    this.logJobExecution(job, result);
  }

  /**
   * Calculate next execution time
   */
  private static calculateNextExecution(schedule: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date();
    const next = new Date();

    switch (schedule) {
      case 'daily':
        next.setDate(now.getDate() + 1);
        next.setHours(2, 0, 0, 0); // 2 AM
        break;
      case 'weekly':
        next.setDate(now.getDate() + (7 - now.getDay())); // Next Sunday
        next.setHours(2, 0, 0, 0);
        break;
      case 'monthly':
        next.setMonth(now.getMonth() + 1, 1); // First day of next month
        next.setHours(2, 0, 0, 0);
        break;
    }

    return next;
  }

  /**
   * Schedule daily integrity check
   */
  private static scheduleDailyIntegrityCheck(): void {
    const runCheck = async () => {
      console.log('Running daily data integrity check...');
      
      try {
        const result = await DataRetentionService.runIntegrityCheck();
        
        console.log('Integrity check completed:', {
          totalLogs: result.totalLogs,
          issues: result.issues.length,
          corrupted: result.corruptedLogs,
        });

        // Log critical issues
        const criticalIssues = result.issues.filter(i => i.severity === 'high');
        if (criticalIssues.length > 0) {
          console.error('Critical integrity issues detected:', criticalIssues);
        }

        // Log to system logs
        await this.logIntegrityCheck(result);
      } catch (error) {
        console.error('Integrity check failed:', error);
      }

      // Schedule next check (24 hours)
      this.integrityCheckTimer = setTimeout(runCheck, 24 * 60 * 60 * 1000);
    };

    // Run first check after 1 hour
    this.integrityCheckTimer = setTimeout(runCheck, 60 * 60 * 1000);
  }

  /**
   * Stop all scheduled jobs
   */
  static stopAll(): void {
    // Clear all policy timers
    this.jobs.forEach(job => {
      if (job.timerId) {
        clearTimeout(job.timerId as NodeJS.Timeout);
      }
    });
    this.jobs.clear();

    // Clear integrity check timer
    if (this.integrityCheckTimer) {
      clearTimeout(this.integrityCheckTimer as NodeJS.Timeout);
      this.integrityCheckTimer = undefined;
    }

    console.log('All retention jobs stopped');
  }

  /**
   * Get all scheduled jobs
   */
  static getScheduledJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values()).map(job => ({
      ...job,
      timerId: undefined, // Don't expose timer ID
    }));
  }

  /**
   * Get job status
   */
  static getJobStatus(policyId: string): ScheduledJob | undefined {
    const job = this.jobs.get(policyId);
    if (!job) return undefined;

    return {
      ...job,
      timerId: undefined, // Don't expose timer ID
    };
  }

  /**
   * Log job execution to system logs
   */
  private static async logJobExecution(job: ScheduledJob, result: ArchivalResult): Promise<void> {
    try {
      await db.systemLogs.add({
        id: `retention-${job.id}-${Date.now()}`,
        action: 'data_retention_executed',
        entityType: 'ai_activity_log',
        entityId: job.policyId,
        timestamp: new Date(),
        userId: 'system',
        status: result.errors.length > 0 ? 'error' : 'success',
        details: JSON.stringify({
          policyName: job.policyName,
          archivedLogs: result.archivedLogs,
          deletedLogs: result.deletedLogs,
          archiveSize: result.archiveSize,
          executionTime: result.executionTime,
          errors: result.errors,
        }),
      });
    } catch (error) {
      console.error('Failed to log job execution:', error);
    }
  }

  /**
   * Log integrity check to system logs
   */
  private static async logIntegrityCheck(result: any): Promise<void> {
    try {
      await db.systemLogs.add({
        id: `integrity-check-${Date.now()}`,
        action: 'data_integrity_check',
        entityType: 'ai_activity_log',
        entityId: 'all',
        timestamp: new Date(),
        userId: 'system',
        status: result.issues.length > 0 ? 'warning' : 'success',
        details: JSON.stringify({
          totalLogs: result.totalLogs,
          corruptedLogs: result.corruptedLogs,
          missingFields: result.missingFields,
          invalidTimestamps: result.invalidTimestamps,
          duplicateIds: result.duplicateIds,
          issuesCount: result.issues.length,
          criticalIssues: result.issues.filter((i: any) => i.severity === 'high').length,
        }),
      });
    } catch (error) {
      console.error('Failed to log integrity check:', error);
    }
  }

  /**
   * Get retention statistics
   */
  static async getRetentionStats(): Promise<{
    activeJobs: number;
    totalExecutions: number;
    totalArchived: number;
    totalDeleted: number;
    lastIntegrityCheck?: Date;
    storageStats: any;
  }> {
    const activeJobs = this.jobs.size;
    
    let totalExecutions = 0;
    let totalArchived = 0;
    let totalDeleted = 0;

    this.jobs.forEach(job => {
      if (job.lastResult) {
        totalExecutions++;
        totalArchived += job.lastResult.archivedLogs;
        totalDeleted += job.lastResult.deletedLogs;
      }
    });

    const storageStats = await DataRetentionService.getStorageStats();

    return {
      activeJobs,
      totalExecutions,
      totalArchived,
      totalDeleted,
      storageStats,
    };
  }
}
