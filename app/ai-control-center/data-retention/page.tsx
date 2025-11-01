'use client';

// AI Control Center - Data Retention Page
// Manage AI log retention policies, archival, and data integrity

import React, { useEffect } from 'react';
import { DataRetentionManager } from '@/components/ai-control/DataRetentionManager';
import { RetentionScheduler } from '@/services/ai/retention-scheduler';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { FloatingHelpButton } from '@/components/ai-control';

export default function DataRetentionPage() {
  useEffect(() => {
    // Initialize retention scheduler on mount
    RetentionScheduler.initialize().catch(error => {
      console.error('Failed to initialize retention scheduler:', error);
    });

    // Cleanup on unmount
    return () => {
      // Note: We don't stop all jobs on unmount as they should continue running
      // RetentionScheduler.stopAll();
    };
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Data Retention & Archival</h1>
        <p className="text-gray-600">
          Manage AI activity log retention policies, archival, and data integrity checks
        </p>
      </div>

      {/* Information Alert */}
      <Alert>
        <Info className="w-4 h-4" />
        <div className="ml-2">
          <div className="font-medium">Automated Data Management</div>
          <div className="text-sm text-gray-600 mt-1">
            Retention policies run automatically based on their schedule. Logs are archived before deletion
            to ensure data is preserved. Daily integrity checks detect and report data issues.
          </div>
        </div>
      </Alert>

      {/* Data Retention Manager Component */}
      <DataRetentionManager />

      {/* Documentation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Retention Policy Guidelines</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <strong>Standard 90-Day Retention:</strong> Archives and deletes all logs older than 90 days.
            Runs daily at 2 AM. Recommended for most use cases.
          </div>
          <div>
            <strong>Error Logs 30-Day Retention:</strong> Archives and deletes error logs older than 30 days.
            Runs weekly. Helps maintain database performance by removing old error records.
          </div>
          <div>
            <strong>Success Logs 180-Day Retention:</strong> Deletes successful operation logs older than 180 days
            without archiving. Disabled by default. Enable for long-term audit requirements.
          </div>
          <div className="mt-4 pt-4 border-t">
            <strong>Data Integrity Checks:</strong> Run daily to detect corrupted logs, missing fields,
            invalid timestamps, and duplicate IDs. Critical issues are logged and can trigger alerts.
          </div>
          <div>
            <strong>Backup & Restore:</strong> Manual backup exports all logs to a compressed file.
            Import restores logs from backup, skipping duplicates. Use for disaster recovery or data migration.
          </div>
        </div>
      </Card>

      {/* Floating Help Button */}
      <FloatingHelpButton />
    </div>
  );
}
