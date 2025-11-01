'use client';

// Data Retention Manager Component
// UI for managing AI log retention policies and archival

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import {
  Archive,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  Database,
  FileArchive,
  Play,
  Pause,
  RefreshCw,
} from 'lucide-react';
import { DataRetentionService, RetentionPolicyConfig, ArchivalResult, IntegrityCheckResult } from '@/services/ai/data-retention';
import { RetentionScheduler, ScheduledJob } from '@/services/ai/retention-scheduler';

export function DataRetentionManager() {
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [integrityResult, setIntegrityResult] = useState<IntegrityCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const jobs = RetentionScheduler.getScheduledJobs();
      setScheduledJobs(jobs);

      const stats = await DataRetentionService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to load retention data:', error);
    }
  };

  const handleExecuteNow = async (policyId: string) => {
    setExecuting(policyId);
    try {
      await RetentionScheduler.executeNow(policyId);
      await loadData();
    } catch (error) {
      console.error('Failed to execute policy:', error);
      alert('Failed to execute retention policy');
    } finally {
      setExecuting(null);
    }
  };

  const handleRunIntegrityCheck = async () => {
    setLoading(true);
    try {
      const result = await DataRetentionService.runIntegrityCheck();
      setIntegrityResult(result);
    } catch (error) {
      console.error('Failed to run integrity check:', error);
      alert('Failed to run integrity check');
    } finally {
      setLoading(false);
    }
  };

  const handleExportBackup = async () => {
    setLoading(true);
    try {
      const blob = await DataRetentionService.exportForBackup(undefined, undefined, 'json', true);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-logs-backup-${new Date().toISOString()}.json.gz`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export backup:', error);
      alert('Failed to export backup');
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await DataRetentionService.importFromBackup(file);
      alert(`Import completed: ${result.imported} logs imported, ${result.skipped} skipped`);
      await loadData();
    } catch (error) {
      console.error('Failed to import backup:', error);
      alert('Failed to import backup');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Storage Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Storage Statistics
        </h3>
        
        {storageStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Total Logs</div>
              <div className="text-2xl font-bold">{storageStats.totalLogs.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Storage Size</div>
              <div className="text-2xl font-bold">{formatBytes(storageStats.totalSize)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Oldest Log</div>
              <div className="text-sm font-medium">
                {storageStats.oldestLog ? new Date(storageStats.oldestLog).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Newest Log</div>
              <div className="text-sm font-medium">
                {storageStats.newestLog ? new Date(storageStats.newestLog).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Scheduled Retention Policies */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Scheduled Retention Policies
        </h3>

        <div className="space-y-4">
          {scheduledJobs.map(job => (
            <div key={job.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium">{job.policyName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={
                      job.status === 'completed' ? 'default' :
                      job.status === 'running' ? 'secondary' :
                      job.status === 'failed' ? 'destructive' :
                      'outline'
                    }>
                      {job.status}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleExecuteNow(job.id)}
                  disabled={executing === job.id}
                >
                  {executing === job.id ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Execute Now
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                <div>
                  <span className="text-gray-500">Last Execution:</span>
                  <div className="font-medium">{formatDate(job.lastExecution)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Next Execution:</span>
                  <div className="font-medium">{formatDate(job.nextExecution)}</div>
                </div>
              </div>

              {job.lastResult && (
                <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-gray-500">Archived:</span>
                      <div className="font-medium">{job.lastResult.archivedLogs}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Deleted:</span>
                      <div className="font-medium">{job.lastResult.deletedLogs}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Archive Size:</span>
                      <div className="font-medium">{formatBytes(job.lastResult.archiveSize)}</div>
                    </div>
                  </div>
                  {job.lastResult.errors.length > 0 && (
                    <div className="mt-2 text-red-600">
                      {job.lastResult.errors.length} error(s) occurred
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {scheduledJobs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No retention policies scheduled
            </div>
          )}
        </div>
      </Card>

      {/* Data Integrity Check */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Data Integrity Check
        </h3>

        <Button
          onClick={handleRunIntegrityCheck}
          disabled={loading}
          className="mb-4"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Running Check...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Run Integrity Check
            </>
          )}
        </Button>

        {integrityResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="text-sm text-gray-500">Total Logs</div>
                <div className="text-xl font-bold">{integrityResult.totalLogs}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Corrupted</div>
                <div className="text-xl font-bold text-red-600">{integrityResult.corruptedLogs}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Missing Fields</div>
                <div className="text-xl font-bold text-orange-600">{integrityResult.missingFields}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Invalid Timestamps</div>
                <div className="text-xl font-bold text-orange-600">{integrityResult.invalidTimestamps}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Duplicate IDs</div>
                <div className="text-xl font-bold text-red-600">{integrityResult.duplicateIds}</div>
              </div>
            </div>

            {integrityResult.issues.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Issues Detected:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {integrityResult.issues.slice(0, 10).map((issue, index) => (
                    <Alert key={index} variant={issue.severity === 'high' ? 'destructive' : 'default'}>
                      <AlertTriangle className="w-4 h-4" />
                      <div className="ml-2">
                        <div className="font-medium">{issue.issue}</div>
                        <div className="text-sm text-gray-600">Log ID: {issue.logId}</div>
                      </div>
                    </Alert>
                  ))}
                  {integrityResult.issues.length > 10 && (
                    <div className="text-sm text-gray-500 text-center">
                      ... and {integrityResult.issues.length - 10} more issues
                    </div>
                  )}
                </div>
              </div>
            )}

            {integrityResult.issues.length === 0 && (
              <Alert>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div className="ml-2 text-green-600">
                  All logs passed integrity check
                </div>
              </Alert>
            )}
          </div>
        )}
      </Card>

      {/* Backup & Restore */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileArchive className="w-5 h-5" />
          Backup & Restore
        </h3>

        <div className="flex gap-4">
          <Button
            onClick={handleExportBackup}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Backup
          </Button>

          <div>
            <input
              type="file"
              id="import-backup"
              accept=".json,.gz"
              onChange={handleImportBackup}
              className="hidden"
            />
            <Button
              onClick={() => document.getElementById('import-backup')?.click()}
              disabled={loading}
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Backup
            </Button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>• Export creates a compressed backup of all AI activity logs</p>
          <p>• Import restores logs from a backup file (skips duplicates)</p>
          <p>• Backups are compressed using gzip for efficient storage</p>
        </div>
      </Card>
    </div>
  );
}
