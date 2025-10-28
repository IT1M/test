import { backupScheduler } from "@/services/backupScheduler";

let isInitialized = false;

export function initializeBackupScheduler() {
  if (isInitialized) {
    return;
  }

  try {
    // Start the backup scheduler
    backupScheduler.start();
    isInitialized = true;
    
    console.log('✅ Backup scheduler initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize backup scheduler:', error);
  }
}

export function stopBackupScheduler() {
  if (!isInitialized) {
    return;
  }

  try {
    backupScheduler.stop();
    isInitialized = false;
    
    console.log('✅ Backup scheduler stopped successfully');
  } catch (error) {
    console.error('❌ Failed to stop backup scheduler:', error);
  }
}

// Initialize on module load in production
if (process.env.NODE_ENV === 'production') {
  initializeBackupScheduler();
}