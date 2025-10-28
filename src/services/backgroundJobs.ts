import { ActivityMonitoringService } from "./activityMonitoring";

export class BackgroundJobService {
  private static intervals: NodeJS.Timeout[] = [];

  // Start all background jobs
  static startJobs() {
    console.log('Starting background jobs...');
    
    // Security detection job - runs every 5 minutes
    const securityJob = setInterval(async () => {
      try {
        await ActivityMonitoringService.detectSuspiciousActivities();
        console.log('Security detection job completed');
      } catch (error) {
        console.error('Security detection job failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup job - runs every hour
    const cleanupJob = setInterval(async () => {
      try {
        await ActivityMonitoringService.cleanupOldData();
        console.log('Cleanup job completed');
      } catch (error) {
        console.error('Cleanup job failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    this.intervals.push(securityJob, cleanupJob);
  }

  // Stop all background jobs
  static stopJobs() {
    console.log('Stopping background jobs...');
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  // Run security detection manually
  static async runSecurityDetection() {
    try {
      await ActivityMonitoringService.detectSuspiciousActivities();
      return { success: true, message: 'Security detection completed' };
    } catch (error) {
      console.error('Manual security detection failed:', error);
      return { success: false, error: 'Security detection failed' };
    }
  }

  // Run cleanup manually
  static async runCleanup() {
    try {
      await ActivityMonitoringService.cleanupOldData();
      return { success: true, message: 'Cleanup completed' };
    } catch (error) {
      console.error('Manual cleanup failed:', error);
      return { success: false, error: 'Cleanup failed' };
    }
  }
}

// Auto-start jobs in production
if (process.env.NODE_ENV === 'production') {
  BackgroundJobService.startJobs();
}

// Graceful shutdown
process.on('SIGTERM', () => {
  BackgroundJobService.stopJobs();
});

process.on('SIGINT', () => {
  BackgroundJobService.stopJobs();
});

export default BackgroundJobService;