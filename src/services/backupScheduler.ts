import { advancedBackupService } from "./advancedBackup";
import { prisma } from "./prisma";
import { BackupType } from "@prisma/client";

export interface ScheduledBackupJob {
  id: string;
  name: string;
  schedule: string; // Cron expression
  type: 'full' | 'incremental';
  fileType: BackupType;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  options: {
    encryption: boolean;
    compression: boolean;
    testing: boolean;
    cleanup: boolean;
  };
}

export class BackupScheduler {
  private jobs: Map<string, ScheduledBackupJob> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeDefaultJobs();
  }

  /**
   * Initialize default backup jobs
   */
  private initializeDefaultJobs(): void {
    // Daily incremental backup
    this.addJob({
      id: 'daily-incremental',
      name: 'Daily Incremental Backup',
      schedule: '0 2 * * *', // 2 AM daily
      type: 'incremental',
      fileType: 'JSON',
      enabled: true,
      options: {
        encryption: true,
        compression: true,
        testing: true,
        cleanup: false,
      },
    });

    // Weekly full backup
    this.addJob({
      id: 'weekly-full',
      name: 'Weekly Full Backup',
      schedule: '0 1 * * 0', // 1 AM on Sundays
      type: 'full',
      fileType: 'JSON',
      enabled: true,
      options: {
        encryption: true,
        compression: true,
        testing: true,
        cleanup: true,
      },
    });

    // Monthly archive backup
    this.addJob({
      id: 'monthly-archive',
      name: 'Monthly Archive Backup',
      schedule: '0 0 1 * *', // Midnight on 1st of each month
      type: 'full',
      fileType: 'SQL',
      enabled: true,
      options: {
        encryption: true,
        compression: true,
        testing: true,
        cleanup: false,
      },
    });
  }

  /**
   * Add a new scheduled backup job
   */
  addJob(job: ScheduledBackupJob): void {
    this.jobs.set(job.id, job);
    if (job.enabled) {
      this.scheduleJob(job);
    }
  }

  /**
   * Remove a scheduled backup job
   */
  removeJob(jobId: string): void {
    this.unscheduleJob(jobId);
    this.jobs.delete(jobId);
  }

  /**
   * Enable a scheduled backup job
   */
  enableJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.enabled = true;
      this.scheduleJob(job);
    }
  }

  /**
   * Disable a scheduled backup job
   */
  disableJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.enabled = false;
      this.unscheduleJob(jobId);
    }
  }

  /**
   * Get all scheduled jobs
   */
  getJobs(): ScheduledBackupJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get a specific job by ID
   */
  getJob(jobId: string): ScheduledBackupJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Execute a backup job immediately
   */
  async executeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await this.runBackupJob(job);
  }

  /**
   * Start the scheduler
   */
  start(): void {
    console.log('Starting backup scheduler...');
    
    // Schedule all enabled jobs
    for (const job of this.jobs.values()) {
      if (job.enabled) {
        this.scheduleJob(job);
      }
    }

    console.log(`Scheduled ${this.intervals.size} backup jobs`);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    console.log('Stopping backup scheduler...');
    
    // Clear all intervals
    for (const [jobId, interval] of this.intervals) {
      clearInterval(interval);
      this.intervals.delete(jobId);
    }

    console.log('Backup scheduler stopped');
  }

  /**
   * Schedule a specific job
   */
  private scheduleJob(job: ScheduledBackupJob): void {
    // For simplicity, we'll use a basic interval-based scheduler
    // In production, you'd want to use a proper cron library like node-cron
    
    const interval = this.parseCronToInterval(job.schedule);
    if (interval > 0) {
      const timer = setInterval(async () => {
        try {
          await this.runBackupJob(job);
        } catch (error) {
          console.error(`Error running scheduled backup job ${job.id}:`, error);
        }
      }, interval);

      this.intervals.set(job.id, timer);
      console.log(`Scheduled job ${job.id} with interval ${interval}ms`);
    }
  }

  /**
   * Unschedule a specific job
   */
  private unscheduleJob(jobId: string): void {
    const interval = this.intervals.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(jobId);
      console.log(`Unscheduled job ${jobId}`);
    }
  }

  /**
   * Execute a backup job
   */
  private async runBackupJob(job: ScheduledBackupJob): Promise<void> {
    console.log(`Running backup job: ${job.name}`);
    
    try {
      // Get system admin user for backup creation
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN', isActive: true },
      });

      if (!adminUser) {
        throw new Error('No active admin user found for scheduled backup');
      }

      // Update last run time
      job.lastRun = new Date();

      let backupMetadata;

      // Create backup based on type
      if (job.type === 'full') {
        backupMetadata = await advancedBackupService.createFullBackup(
          adminUser.id,
          job.fileType
        );
      } else {
        backupMetadata = await advancedBackupService.createIncrementalBackup(
          adminUser.id,
          job.fileType
        );
      }

      console.log(`Backup created: ${backupMetadata.id}`);

      // Test backup if enabled
      if (job.options.testing) {
        const testResults = await advancedBackupService.testBackup(backupMetadata.id);
        if (!testResults.success) {
          console.error(`Backup test failed for ${backupMetadata.id}:`, testResults.errors);
          // You might want to send an alert here
        } else {
          console.log(`Backup test passed for ${backupMetadata.id}`);
        }
      }

      // Cleanup old backups if enabled
      if (job.options.cleanup) {
        const cleanupResults = await advancedBackupService.cleanupOldBackups();
        console.log(`Cleanup completed: ${cleanupResults.deleted} backups removed`);
        
        if (cleanupResults.errors.length > 0) {
          console.error('Cleanup errors:', cleanupResults.errors);
        }
      }

      // Send success notification
      await this.sendBackupNotification('success', job, backupMetadata);

    } catch (error) {
      console.error(`Backup job ${job.id} failed:`, error);
      
      // Send failure notification
      await this.sendBackupNotification('failure', job, null, error);
    }
  }

  /**
   * Parse cron expression to interval (simplified)
   */
  private parseCronToInterval(cronExpression: string): number {
    // This is a very simplified cron parser
    // In production, use a proper cron library
    
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) {
      console.error(`Invalid cron expression: ${cronExpression}`);
      return 0;
    }

    // For now, just handle some common patterns
    if (cronExpression === '0 2 * * *') {
      // Daily at 2 AM - run every 24 hours
      return 24 * 60 * 60 * 1000;
    } else if (cronExpression === '0 1 * * 0') {
      // Weekly on Sunday at 1 AM - run every 7 days
      return 7 * 24 * 60 * 60 * 1000;
    } else if (cronExpression === '0 0 1 * *') {
      // Monthly on 1st at midnight - run every 30 days (approximate)
      return 30 * 24 * 60 * 60 * 1000;
    }

    // Default to daily if we can't parse
    console.warn(`Unknown cron pattern ${cronExpression}, defaulting to daily`);
    return 24 * 60 * 60 * 1000;
  }

  /**
   * Send backup notification
   */
  private async sendBackupNotification(
    type: 'success' | 'failure',
    job: ScheduledBackupJob,
    backupMetadata?: any,
    error?: any
  ): Promise<void> {
    try {
      // Get all admin users for notification
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true },
      });

      const title = type === 'success' 
        ? `Backup Completed: ${job.name}`
        : `Backup Failed: ${job.name}`;

      const message = type === 'success'
        ? `Scheduled backup "${job.name}" completed successfully. ${backupMetadata?.recordCount || 0} records backed up.`
        : `Scheduled backup "${job.name}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

      // Create notifications for all admin users
      for (const admin of adminUsers) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: type === 'success' ? 'SUCCESS' : 'ERROR',
            title,
            message,
            metadata: {
              jobId: job.id,
              jobName: job.name,
              backupId: backupMetadata?.id,
              timestamp: new Date().toISOString(),
            },
          },
        });
      }

      console.log(`Sent ${type} notification for job ${job.id} to ${adminUsers.length} admins`);
    } catch (notificationError) {
      console.error('Failed to send backup notification:', notificationError);
    }
  }
}

// Export singleton instance
export const backupScheduler = new BackupScheduler();