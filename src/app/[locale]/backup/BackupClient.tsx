"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/utils/formatters";
import toast from "react-hot-toast";

interface Backup {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: "CSV" | "JSON" | "SQL";
  recordCount: number;
  storagePath: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface ScheduledBackupJob {
  id: string;
  name: string;
  schedule: string;
  type: 'full' | 'incremental';
  fileType: "CSV" | "JSON" | "SQL";
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  options: {
    encryption: boolean;
    compression: boolean;
    testing: boolean;
    cleanup: boolean;
  };
}

interface BackupTestResult {
  success: boolean;
  tests: {
    fileExists: boolean;
    checksumValid: boolean;
    decryptable: boolean;
    decompressible: boolean;
    parseable: boolean;
    restorable: boolean;
  };
  errors: string[];
}

interface BackupClientProps {
  userRole: string;
}

export default function BackupClient({ userRole }: BackupClientProps) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledBackupJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedType, setSelectedType] = useState<"CSV" | "JSON" | "SQL">("JSON");
  const [selectedBackupType, setSelectedBackupType] = useState<"full" | "incremental">("incremental");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<any>(null);
  const [restoring, setRestoring] = useState(false);
  const [testingBackup, setTestingBackup] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<BackupTestResult | null>(null);
  const [activeTab, setActiveTab] = useState<"backups" | "scheduled">("backups");

  useEffect(() => {
    fetchBackups();
    if (userRole === "ADMIN" || userRole === "MANAGER") {
      fetchScheduledJobs();
    }
  }, [userRole]);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/backup");
      const result = await response.json();

      if (result.success) {
        setBackups(result.data);
      } else {
        toast.error(result.error?.message || "Failed to fetch backups");
      }
    } catch (error) {
      console.error("Error fetching backups:", error);
      toast.error("An error occurred while fetching backups");
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledJobs = async () => {
    try {
      const response = await fetch("/api/backup/scheduler");
      const result = await response.json();

      if (result.success) {
        setScheduledJobs(result.data);
      } else {
        toast.error(result.error?.message || "Failed to fetch scheduled jobs");
      }
    } catch (error) {
      console.error("Error fetching scheduled jobs:", error);
      toast.error("An error occurred while fetching scheduled jobs");
    }
  };

  const createBackup = async () => {
    try {
      setCreating(true);
      const response = await fetch("/api/backup/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileType: selectedType,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || "Backup created successfully");
        setShowCreateModal(false);
        fetchBackups();
      } else {
        toast.error(result.error?.message || "Failed to create backup");
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      toast.error("An error occurred while creating backup");
    } finally {
      setCreating(false);
    }
  };

  const createAdvancedBackup = async () => {
    try {
      setCreating(true);
      const response = await fetch("/api/backup/advanced", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: selectedBackupType,
          fileType: selectedType,
          options: {
            encryption: true,
            compression: true,
            testing: true,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || "Advanced backup created successfully");
        setShowAdvancedModal(false);
        fetchBackups();
        
        if (result.data.testResults && !result.data.testResults.success) {
          toast.error("Backup created but failed validation tests");
        }
      } else {
        toast.error(result.error?.message || "Failed to create advanced backup");
      }
    } catch (error) {
      console.error("Error creating advanced backup:", error);
      toast.error("An error occurred while creating advanced backup");
    } finally {
      setCreating(false);
    }
  };

  const testBackup = async (backupId: string) => {
    try {
      setTestingBackup(backupId);
      toast.loading("Testing backup integrity...", { id: "test-backup" });
      
      const response = await fetch(`/api/backup/test/${backupId}`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        setTestResults(result.data);
        if (result.data.success) {
          toast.success("Backup test passed successfully", { id: "test-backup" });
        } else {
          toast.error(`Backup test failed: ${result.data.errors.join(", ")}`, { id: "test-backup" });
        }
      } else {
        toast.error(result.error?.message || "Failed to test backup", { id: "test-backup" });
      }
    } catch (error) {
      console.error("Error testing backup:", error);
      toast.error("An error occurred while testing backup", { id: "test-backup" });
    } finally {
      setTestingBackup(null);
    }
  };

  const cleanupOldBackups = async () => {
    try {
      toast.loading("Cleaning up old backups...", { id: "cleanup" });
      
      const response = await fetch("/api/backup/cleanup", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Cleanup completed. ${result.data.deleted} old backups removed.`, { id: "cleanup" });
        fetchBackups();
      } else {
        toast.error(result.error?.message || "Failed to cleanup backups", { id: "cleanup" });
      }
    } catch (error) {
      console.error("Error cleaning up backups:", error);
      toast.error("An error occurred during cleanup", { id: "cleanup" });
    }
  };

  const toggleScheduledJob = async (jobId: string, action: 'enable' | 'disable') => {
    try {
      const response = await fetch(`/api/backup/scheduler/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Job ${action}d successfully`);
        fetchScheduledJobs();
      } else {
        toast.error(result.error?.message || `Failed to ${action} job`);
      }
    } catch (error) {
      console.error(`Error ${action}ing job:`, error);
      toast.error(`An error occurred while ${action}ing the job`);
    }
  };

  const executeScheduledJob = async (jobId: string) => {
    try {
      toast.loading("Executing backup job...", { id: "execute-job" });
      
      const response = await fetch(`/api/backup/scheduler/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "execute" }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Backup job executed successfully", { id: "execute-job" });
        fetchBackups();
        fetchScheduledJobs();
      } else {
        toast.error(result.error?.message || "Failed to execute job", { id: "execute-job" });
      }
    } catch (error) {
      console.error("Error executing job:", error);
      toast.error("An error occurred while executing the job", { id: "execute-job" });
    }
  };

  const downloadBackup = async (backup: Backup) => {
    try {
      toast.loading("Downloading backup...", { id: "download" });
      
      const response = await fetch(`/api/backup/download/${backup.id}`);
      
      if (!response.ok) {
        const result = await response.json();
        toast.error(result.error?.message || "Failed to download backup", { id: "download" });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = backup.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Backup downloaded successfully", { id: "download" });
    } catch (error) {
      console.error("Error downloading backup:", error);
      toast.error("An error occurred while downloading backup", { id: "download" });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const extension = file.name.split(".").pop()?.toUpperCase();
    if (extension !== "CSV" && extension !== "JSON") {
      toast.error("Only CSV and JSON files are supported for restore");
      return;
    }

    setRestoreFile(file);

    // Read file and generate preview
    try {
      const content = await file.text();
      const response = await fetch("/api/backup/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          backupData: content,
          fileType: extension,
          preview: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setRestorePreview(result.data);
      } else {
        toast.error(result.error?.message || "Failed to preview backup");
        setRestoreFile(null);
      }
    } catch (error) {
      console.error("Error previewing backup:", error);
      toast.error("Failed to read backup file");
      setRestoreFile(null);
    }
  };

  const performRestore = async () => {
    if (!restoreFile || !restorePreview) return;

    try {
      setRestoring(true);
      const content = await restoreFile.text();
      const extension = restoreFile.name.split(".").pop()?.toUpperCase();

      const response = await fetch("/api/backup/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          backupData: content,
          fileType: extension,
          preview: false,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || "Backup restored successfully");
        setShowRestoreModal(false);
        setRestoreFile(null);
        setRestorePreview(null);
        fetchBackups();
      } else {
        toast.error(result.error?.message || "Failed to restore backup");
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast.error("An error occurred while restoring backup");
    } finally {
      setRestoring(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "IN_PROGRESS":
        return "warning";
      case "FAILED":
        return "danger";
      default:
        return "default";
    }
  };

  const getFileTypeBadgeVariant = (fileType: string) => {
    switch (fileType) {
      case "CSV":
        return "primary";
      case "JSON":
        return "secondary";
      case "SQL":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
          Backup Management
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Create and manage system backups
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-secondary-200 dark:border-secondary-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("backups")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "backups"
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-secondary-400 dark:hover:text-secondary-300"
              }`}
            >
              Backups ({backups.length})
            </button>
            {(userRole === "ADMIN" || userRole === "MANAGER") && (
              <button
                onClick={() => setActiveTab("scheduled")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "scheduled"
                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-secondary-400 dark:hover:text-secondary-300"
                }`}
              >
                Scheduled Jobs ({scheduledJobs.length})
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-secondary-600 dark:text-secondary-400">
          {activeTab === "backups" 
            ? `${backups.length} backup${backups.length !== 1 ? "s" : ""} found`
            : `${scheduledJobs.length} scheduled job${scheduledJobs.length !== 1 ? "s" : ""} found`
          }
        </div>
        <div className="flex gap-3">
          {activeTab === "backups" ? (
            <>
              {userRole === "ADMIN" && (
                <>
                  <Button onClick={cleanupOldBackups} variant="ghost" size="sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Cleanup Old
                  </Button>
                  <Button onClick={() => setShowRestoreModal(true)} variant="secondary">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Restore Backup
                  </Button>
                </>
              )}
              {(userRole === "ADMIN" || userRole === "MANAGER") && (
                <Button onClick={() => setShowAdvancedModal(true)} variant="success">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Advanced Backup
                </Button>
              )}
              <Button onClick={() => setShowCreateModal(true)} variant="primary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Backup
              </Button>
            </>
          ) : (
            <>
              {userRole === "ADMIN" && (
                <Button onClick={() => setShowSchedulerModal(true)} variant="primary">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Scheduled Job
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : activeTab === "backups" ? (
        <div className="bg-white dark:bg-secondary-950 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
              <thead className="bg-secondary-50 dark:bg-secondary-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Records
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-secondary-950 divide-y divide-secondary-200 dark:divide-secondary-800">
                {backups.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-secondary-500 dark:text-secondary-400">
                      No backups found. Create your first backup to get started.
                    </td>
                  </tr>
                ) : (
                  backups.map((backup) => (
                    <tr key={backup.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-900">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        {backup.fileName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getFileTypeBadgeVariant(backup.fileType)} size="sm">
                          {backup.fileType}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 dark:text-secondary-300">
                        {backup.recordCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 dark:text-secondary-300">
                        {formatFileSize(backup.fileSize)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(backup.status)} size="sm">
                          {backup.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 dark:text-secondary-300">
                        {backup.createdBy.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 dark:text-secondary-300">
                        {formatDate(backup.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {backup.status === "COMPLETED" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => downloadBackup(backup)}
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                              </Button>
                              {(userRole === "ADMIN" || userRole === "MANAGER") && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => testBackup(backup.id)}
                                  isLoading={testingBackup === backup.id}
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Test
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-secondary-950 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
              <thead className="bg-secondary-50 dark:bg-secondary-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Job Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Last Run
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Options
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-secondary-950 divide-y divide-secondary-200 dark:divide-secondary-800">
                {scheduledJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-secondary-500 dark:text-secondary-400">
                      No scheduled backup jobs found. Create your first scheduled job to automate backups.
                    </td>
                  </tr>
                ) : (
                  scheduledJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-900">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        {job.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Badge variant={job.type === 'full' ? 'warning' : 'primary'} size="sm">
                            {job.type}
                          </Badge>
                          <Badge variant="secondary" size="sm">
                            {job.fileType}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 dark:text-secondary-300">
                        {job.schedule}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={job.enabled ? 'success' : 'danger'} size="sm">
                          {job.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 dark:text-secondary-300">
                        {job.lastRun ? formatDate(job.lastRun) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          {job.options.encryption && (
                            <Badge variant="info" size="xs">🔒</Badge>
                          )}
                          {job.options.compression && (
                            <Badge variant="info" size="xs">📦</Badge>
                          )}
                          {job.options.testing && (
                            <Badge variant="info" size="xs">🧪</Badge>
                          )}
                          {job.options.cleanup && (
                            <Badge variant="info" size="xs">🧹</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => executeScheduledJob(job.id)}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-10V7a3 3 0 11-6 0V4a2 2 0 012-2h2a2 2 0 012 2v3a3 3 0 11-6 0z" />
                            </svg>
                            Run Now
                          </Button>
                          {userRole === "ADMIN" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleScheduledJob(job.id, job.enabled ? 'disable' : 'enable')}
                            >
                              {job.enabled ? (
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-10V7a3 3 0 11-6 0V4a2 2 0 012-2h2a2 2 0 012 2v3a3 3 0 11-6 0z" />
                                </svg>
                              )}
                              {job.enabled ? 'Disable' : 'Enable'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Advanced Backup Modal */}
      {showAdvancedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-secondary-200 dark:border-secondary-700">
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                Create Advanced Backup
              </h2>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                Enhanced backup with encryption, compression, and testing
              </p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Backup Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="backupType"
                      value="incremental"
                      checked={selectedBackupType === "incremental"}
                      onChange={(e) => setSelectedBackupType(e.target.value as "full" | "incremental")}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                    />
                    <span className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
                      Incremental - Only changes since last backup
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="backupType"
                      value="full"
                      checked={selectedBackupType === "full"}
                      onChange={(e) => setSelectedBackupType(e.target.value as "full" | "incremental")}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                    />
                    <span className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
                      Full - Complete database backup
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  File Format
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fileType"
                      value="JSON"
                      checked={selectedType === "JSON"}
                      onChange={(e) => setSelectedType(e.target.value as "CSV" | "JSON" | "SQL")}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                    />
                    <span className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
                      JSON - Structured data with metadata
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fileType"
                      value="CSV"
                      checked={selectedType === "CSV"}
                      onChange={(e) => setSelectedType(e.target.value as "CSV" | "JSON" | "SQL")}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                    />
                    <span className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
                      CSV - Excel-compatible format
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fileType"
                      value="SQL"
                      checked={selectedType === "SQL"}
                      onChange={(e) => setSelectedType(e.target.value as "CSV" | "JSON" | "SQL")}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                    />
                    <span className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
                      SQL - Database insert statements
                    </span>
                  </label>
                </div>
              </div>

              <div className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg p-3">
                <h4 className="text-sm font-medium text-info-800 dark:text-info-200 mb-2">
                  Advanced Features Included:
                </h4>
                <ul className="text-xs text-info-700 dark:text-info-300 space-y-1">
                  <li>🔒 AES-256 encryption</li>
                  <li>📦 Gzip compression</li>
                  <li>🧪 Automatic integrity testing</li>
                  <li>📊 Detailed metadata tracking</li>
                  <li>🔍 Checksum validation</li>
                </ul>
              </div>
            </div>
            <div className="px-6 py-4 bg-secondary-50 dark:bg-secondary-800 flex justify-end gap-3 rounded-b-lg">
              <Button
                variant="ghost"
                onClick={() => setShowAdvancedModal(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={createAdvancedBackup}
                isLoading={creating}
              >
                Create Advanced Backup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-secondary-200 dark:border-secondary-700">
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                Create New Backup
              </h2>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Backup Format
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="fileType"
                    value="JSON"
                    checked={selectedType === "JSON"}
                    onChange={(e) => setSelectedType(e.target.value as "CSV" | "JSON" | "SQL")}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                  />
                  <span className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
                    JSON - Structured data with metadata
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="fileType"
                    value="CSV"
                    checked={selectedType === "CSV"}
                    onChange={(e) => setSelectedType(e.target.value as "CSV" | "JSON" | "SQL")}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                  />
                  <span className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
                    CSV - Excel-compatible format
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="fileType"
                    value="SQL"
                    checked={selectedType === "SQL"}
                    onChange={(e) => setSelectedType(e.target.value as "CSV" | "JSON" | "SQL")}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300"
                  />
                  <span className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
                    SQL - Database insert statements
                  </span>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 bg-secondary-50 dark:bg-secondary-800 flex justify-end gap-3 rounded-b-lg">
              <Button
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={createBackup}
                isLoading={creating}
              >
                Create Backup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Backup Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-secondary-200 dark:border-secondary-700">
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                Restore Backup
              </h2>
              <p className="text-sm text-danger-600 dark:text-danger-400 mt-1">
                ⚠️ Warning: This will replace all existing inventory data!
              </p>
            </div>
            <div className="px-6 py-4">
              {!restoreFile ? (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Select Backup File
                  </label>
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-secondary-500 dark:text-secondary-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100
                      dark:file:bg-primary-900 dark:file:text-primary-300"
                  />
                  <p className="mt-2 text-xs text-secondary-500 dark:text-secondary-400">
                    Supported formats: CSV, JSON
                  </p>
                </div>
              ) : restorePreview ? (
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Backup Preview
                    </h3>
                    <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary-600 dark:text-secondary-400">Total Items:</span>
                        <span className="font-semibold text-secondary-900 dark:text-secondary-100">
                          {restorePreview.summary.totalItems.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary-600 dark:text-secondary-400">MAIS Destination:</span>
                        <span className="font-semibold text-secondary-900 dark:text-secondary-100">
                          {restorePreview.summary.destinations.MAIS.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary-600 dark:text-secondary-400">FOZAN Destination:</span>
                        <span className="font-semibold text-secondary-900 dark:text-secondary-100">
                          {restorePreview.summary.destinations.FOZAN.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary-600 dark:text-secondary-400">Total Quantity:</span>
                        <span className="font-semibold text-secondary-900 dark:text-secondary-100">
                          {restorePreview.summary.totalQuantity.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary-600 dark:text-secondary-400">Total Reject:</span>
                        <span className="font-semibold text-secondary-900 dark:text-secondary-100">
                          {restorePreview.summary.totalReject.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
                    <p className="text-sm text-warning-800 dark:text-warning-200">
                      <strong>Important:</strong> Restoring this backup will permanently delete all current inventory data and replace it with the backup data. This action cannot be undone.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-secondary-50 dark:bg-secondary-800 flex justify-end gap-3 rounded-b-lg">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestoreFile(null);
                  setRestorePreview(null);
                }}
                disabled={restoring}
              >
                Cancel
              </Button>
              {restoreFile && restorePreview && (
                <Button
                  variant="danger"
                  onClick={performRestore}
                  isLoading={restoring}
                >
                  Restore Backup
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Test Results Modal */}
      {testResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-secondary-200 dark:border-secondary-700">
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                Backup Test Results
              </h2>
              <p className={`text-sm mt-1 ${testResults.success ? 'text-success-600' : 'text-danger-600'}`}>
                {testResults.success ? '✅ All tests passed' : '❌ Some tests failed'}
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                    Test Results
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(testResults.tests).map(([testName, passed]) => (
                      <div key={testName} className="flex items-center justify-between p-2 bg-secondary-50 dark:bg-secondary-800 rounded">
                        <span className="text-sm text-secondary-700 dark:text-secondary-300 capitalize">
                          {testName.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className={`text-sm font-medium ${passed ? 'text-success-600' : 'text-danger-600'}`}>
                          {passed ? '✅ Pass' : '❌ Fail'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {testResults.errors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-danger-700 dark:text-danger-300 mb-2">
                      Errors Found
                    </h3>
                    <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-3">
                      <ul className="text-sm text-danger-700 dark:text-danger-300 space-y-1">
                        {testResults.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 bg-secondary-50 dark:bg-secondary-800 flex justify-end rounded-b-lg">
              <Button
                variant="ghost"
                onClick={() => setTestResults(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
