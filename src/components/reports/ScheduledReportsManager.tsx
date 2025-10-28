"use client";

import { useState, useCallback } from "react";
import { ReportTemplate } from "./ReportBuilder";
import { cn } from "@/utils/cn";

export interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  templateId: string;
  template?: ReportTemplate;
  schedule: {
    frequency: "daily" | "weekly" | "monthly" | "quarterly";
    time: string; // HH:MM format
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    timezone: string;
  };
  recipients: {
    emails: string[];
    roles: string[];
  };
  format: "pdf" | "excel" | "csv";
  filters?: {
    dateRange?: "last7days" | "last30days" | "lastMonth" | "lastQuarter";
    categories?: string[];
    destinations?: string[];
  };
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  createdBy: string;
}

export interface ScheduledReportsManagerProps {
  className?: string;
  onCreateSchedule?: (schedule: Omit<ScheduledReport, "id" | "createdAt" | "createdBy">) => void;
  onUpdateSchedule?: (id: string, updates: Partial<ScheduledReport>) => void;
  onDeleteSchedule?: (id: string) => void;
  onToggleSchedule?: (id: string, isActive: boolean) => void;
  onRunNow?: (id: string) => void;
  availableTemplates?: ReportTemplate[];
}

// Mock data for demonstration
const MOCK_SCHEDULED_REPORTS: ScheduledReport[] = [
  {
    id: "sched-1",
    name: "Weekly Inventory Summary",
    description: "Comprehensive weekly inventory report for management review",
    templateId: "inventory-summary",
    schedule: {
      frequency: "weekly",
      time: "09:00",
      dayOfWeek: 1, // Monday
      timezone: "Asia/Riyadh",
    },
    recipients: {
      emails: ["manager@saudimais.com", "supervisor@saudimais.com"],
      roles: ["MANAGER", "ADMIN"],
    },
    format: "pdf",
    filters: {
      dateRange: "last7days",
    },
    isActive: true,
    lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    createdBy: "admin@saudimais.com",
  },
  {
    id: "sched-2",
    name: "Monthly Performance Report",
    description: "Detailed monthly performance analysis with KPIs and trends",
    templateId: "monthly-analysis",
    schedule: {
      frequency: "monthly",
      time: "08:00",
      dayOfMonth: 1,
      timezone: "Asia/Riyadh",
    },
    recipients: {
      emails: ["ceo@saudimais.com", "operations@saudimais.com"],
      roles: ["ADMIN"],
    },
    format: "excel",
    filters: {
      dateRange: "lastMonth",
    },
    isActive: true,
    lastRun: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    createdBy: "admin@saudimais.com",
  },
];

export function ScheduledReportsManager({
  className,
  onCreateSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onToggleSchedule,
  onRunNow,
  availableTemplates = [],
}: ScheduledReportsManagerProps) {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(MOCK_SCHEDULED_REPORTS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledReport | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduledReport | null>(null);

  const handleToggleSchedule = useCallback((id: string, isActive: boolean) => {
    setScheduledReports(prev => 
      prev.map(schedule => 
        schedule.id === id ? { ...schedule, isActive } : schedule
      )
    );
    onToggleSchedule?.(id, isActive);
  }, [onToggleSchedule]);

  const handleDeleteSchedule = useCallback((id: string) => {
    if (window.confirm("Are you sure you want to delete this scheduled report?")) {
      setScheduledReports(prev => prev.filter(schedule => schedule.id !== id));
      onDeleteSchedule?.(id);
    }
  }, [onDeleteSchedule]);

  const handleRunNow = useCallback((id: string) => {
    const schedule = scheduledReports.find(s => s.id === id);
    if (schedule) {
      // Update last run time
      setScheduledReports(prev => 
        prev.map(s => 
          s.id === id ? { ...s, lastRun: new Date() } : s
        )
      );
      onRunNow?.(id);
    }
  }, [scheduledReports, onRunNow]);

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "daily": return "Daily";
      case "weekly": return "Weekly";
      case "monthly": return "Monthly";
      case "quarterly": return "Quarterly";
      default: return frequency;
    }
  };

  const getScheduleDescription = (schedule: ScheduledReport["schedule"]) => {
    const { frequency, time, dayOfWeek, dayOfMonth } = schedule;
    
    switch (frequency) {
      case "daily":
        return `Daily at ${time}`;
      case "weekly":
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return `Weekly on ${days[dayOfWeek || 0]} at ${time}`;
      case "monthly":
        return `Monthly on day ${dayOfMonth} at ${time}`;
      case "quarterly":
        return `Quarterly at ${time}`;
      default:
        return `${frequency} at ${time}`;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
              Scheduled Reports
            </h2>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
              Automate report generation and delivery
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Schedule Report
          </button>
        </div>
      </div>

      {/* Scheduled Reports List */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700">
        {scheduledReports.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-secondary-400 dark:text-secondary-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
              No Scheduled Reports
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mb-4">
              Create your first scheduled report to automate report delivery
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
            >
              Create Schedule
            </button>
          </div>
        ) : (
          <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
            {scheduledReports.map(schedule => (
              <ScheduledReportCard
                key={schedule.id}
                schedule={schedule}
                onToggle={(isActive) => handleToggleSchedule(schedule.id, isActive)}
                onEdit={() => setEditingSchedule(schedule)}
                onDelete={() => handleDeleteSchedule(schedule.id)}
                onRunNow={() => handleRunNow(schedule.id)}
                onViewDetails={() => setSelectedSchedule(schedule)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingSchedule) && (
        <ScheduleReportModal
          schedule={editingSchedule}
          availableTemplates={availableTemplates}
          onSave={(scheduleData) => {
            if (editingSchedule) {
              setScheduledReports(prev => 
                prev.map(s => 
                  s.id === editingSchedule.id ? { ...s, ...scheduleData } : s
                )
              );
              onUpdateSchedule?.(editingSchedule.id, scheduleData);
            } else {
              const newSchedule: ScheduledReport = {
                ...scheduleData,
                id: `sched-${Date.now()}`,
                createdAt: new Date(),
                createdBy: "current-user@example.com", // Replace with actual user
              };
              setScheduledReports(prev => [...prev, newSchedule]);
              onCreateSchedule?.(scheduleData);
            }
            setShowCreateModal(false);
            setEditingSchedule(null);
          }}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingSchedule(null);
          }}
        />
      )}

      {/* Details Modal */}
      {selectedSchedule && (
        <ScheduleDetailsModal
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
          onEdit={() => {
            setEditingSchedule(selectedSchedule);
            setSelectedSchedule(null);
          }}
        />
      )}
    </div>
  );
}

interface ScheduledReportCardProps {
  schedule: ScheduledReport;
  onToggle: (isActive: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onRunNow: () => void;
  onViewDetails: () => void;
}

function ScheduledReportCard({
  schedule,
  onToggle,
  onEdit,
  onDelete,
  onRunNow,
  onViewDetails,
}: ScheduledReportCardProps) {
  const getStatusColor = () => {
    if (!schedule.isActive) return "text-secondary-500 dark:text-secondary-400";
    
    const now = new Date();
    const nextRun = schedule.nextRun;
    
    if (!nextRun) return "text-warning-600 dark:text-warning-400";
    
    const hoursUntilNext = (nextRun.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilNext < 1) return "text-success-600 dark:text-success-400";
    if (hoursUntilNext < 24) return "text-primary-600 dark:text-primary-400";
    return "text-secondary-600 dark:text-secondary-400";
  };

  return (
    <div className="p-6 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 truncate">
              {schedule.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                schedule.isActive
                  ? "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300"
                  : "bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300"
              )}>
                {schedule.isActive ? "Active" : "Inactive"}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-full uppercase">
                {schedule.format}
              </span>
            </div>
          </div>

          <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
            {schedule.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-secondary-700 dark:text-secondary-300">Schedule:</span>
              <div className="text-secondary-600 dark:text-secondary-400">
                {getScheduleDescription(schedule.schedule)}
              </div>
            </div>

            <div>
              <span className="font-medium text-secondary-700 dark:text-secondary-300">Recipients:</span>
              <div className="text-secondary-600 dark:text-secondary-400">
                {schedule.recipients.emails.length} emails, {schedule.recipients.roles.length} roles
              </div>
            </div>

            <div>
              <span className="font-medium text-secondary-700 dark:text-secondary-300">Next Run:</span>
              <div className={cn("font-medium", getStatusColor())}>
                {schedule.nextRun ? schedule.nextRun.toLocaleString() : "Not scheduled"}
              </div>
            </div>
          </div>

          {schedule.lastRun && (
            <div className="mt-2 text-xs text-secondary-500 dark:text-secondary-400">
              Last run: {schedule.lastRun.toLocaleString()}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {/* Toggle Switch */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={schedule.isActive}
              onChange={(e) => onToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onRunNow}
              disabled={!schedule.isActive}
              className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Run now"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1M9 6h6a2 2 0 012 2v8a2 2 0 01-2 2H9a2 2 0 01-2-2V8a2 2 0 012-2z" />
              </svg>
            </button>

            <button
              onClick={onViewDetails}
              className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400"
              title="View details"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>

            <button
              onClick={onEdit}
              className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400"
              title="Edit schedule"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            <button
              onClick={onDelete}
              className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-danger-600 dark:hover:text-danger-400"
              title="Delete schedule"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ScheduleReportModalProps {
  schedule?: ScheduledReport | null;
  availableTemplates: ReportTemplate[];
  onSave: (schedule: Omit<ScheduledReport, "id" | "createdAt" | "createdBy">) => void;
  onCancel: () => void;
}

function ScheduleReportModal({
  schedule,
  availableTemplates,
  onSave,
  onCancel,
}: ScheduleReportModalProps) {
  const [formData, setFormData] = useState({
    name: schedule?.name || "",
    description: schedule?.description || "",
    templateId: schedule?.templateId || "",
    frequency: schedule?.schedule.frequency || "weekly" as const,
    time: schedule?.schedule.time || "09:00",
    dayOfWeek: schedule?.schedule.dayOfWeek || 1,
    dayOfMonth: schedule?.schedule.dayOfMonth || 1,
    timezone: schedule?.schedule.timezone || "Asia/Riyadh",
    emails: schedule?.recipients.emails.join(", ") || "",
    roles: schedule?.recipients.roles || [],
    format: schedule?.format || "pdf" as const,
    isActive: schedule?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const scheduleData: Omit<ScheduledReport, "id" | "createdAt" | "createdBy"> = {
      name: formData.name,
      description: formData.description,
      templateId: formData.templateId,
      schedule: {
        frequency: formData.frequency,
        time: formData.time,
        dayOfWeek: formData.frequency === "weekly" ? formData.dayOfWeek : undefined,
        dayOfMonth: formData.frequency === "monthly" ? formData.dayOfMonth : undefined,
        timezone: formData.timezone,
      },
      recipients: {
        emails: formData.emails.split(",").map(email => email.trim()).filter(Boolean),
        roles: formData.roles,
      },
      format: formData.format,
      isActive: formData.isActive,
      // Calculate next run time based on schedule
      nextRun: calculateNextRun(formData.frequency, formData.time, formData.dayOfWeek, formData.dayOfMonth),
    };

    onSave(scheduleData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-secondary-200 dark:border-secondary-700">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            {schedule ? "Edit Scheduled Report" : "Create Scheduled Report"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">
              Basic Information
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Report Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                placeholder="Weekly Inventory Summary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                placeholder="Brief description of the report"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Report Template
              </label>
              <select
                required
                value={formData.templateId}
                onChange={(e) => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
              >
                <option value="">Select a template</option>
                {availableTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">
              Schedule Configuration
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                />
              </div>
            </div>

            {formData.frequency === "weekly" && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Day of Week
                </label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                </select>
              </div>
            )}

            {formData.frequency === "monthly" && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Day of Month
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dayOfMonth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dayOfMonth: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                />
              </div>
            )}
          </div>

          {/* Recipients */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">
              Recipients
            </h4>

            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Email Addresses (comma-separated)
              </label>
              <input
                type="text"
                value={formData.emails}
                onChange={(e) => setFormData(prev => ({ ...prev, emails: e.target.value }))}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                placeholder="user1@example.com, user2@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Output Format
              </label>
              <select
                value={formData.format}
                onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value as any }))}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Activate schedule immediately
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
            >
              {schedule ? "Update Schedule" : "Create Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ScheduleDetailsModalProps {
  schedule: ScheduledReport;
  onClose: () => void;
  onEdit: () => void;
}

function ScheduleDetailsModal({ schedule, onClose, onEdit }: ScheduleDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Schedule Details
            </h3>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
              Basic Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-600 dark:text-secondary-400">Name:</span>
                <span className="font-medium text-secondary-900 dark:text-secondary-100">{schedule.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600 dark:text-secondary-400">Status:</span>
                <span className={cn(
                  "px-2 py-1 text-xs font-medium rounded-full",
                  schedule.isActive
                    ? "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300"
                    : "bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300"
                )}>
                  {schedule.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600 dark:text-secondary-400">Format:</span>
                <span className="font-medium text-secondary-900 dark:text-secondary-100 uppercase">{schedule.format}</span>
              </div>
            </div>
          </div>

          {/* Schedule Info */}
          <div>
            <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
              Schedule Configuration
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-600 dark:text-secondary-400">Frequency:</span>
                <span className="font-medium text-secondary-900 dark:text-secondary-100 capitalize">{schedule.schedule.frequency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600 dark:text-secondary-400">Time:</span>
                <span className="font-medium text-secondary-900 dark:text-secondary-100">{schedule.schedule.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600 dark:text-secondary-400">Timezone:</span>
                <span className="font-medium text-secondary-900 dark:text-secondary-100">{schedule.schedule.timezone}</span>
              </div>
              {schedule.nextRun && (
                <div className="flex justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">Next Run:</span>
                  <span className="font-medium text-secondary-900 dark:text-secondary-100">{schedule.nextRun.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Recipients */}
          <div>
            <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
              Recipients
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-secondary-600 dark:text-secondary-400">Email Addresses:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {schedule.recipients.emails.map((email, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded-full"
                    >
                      {email}
                    </span>
                  ))}
                </div>
              </div>
              {schedule.recipients.roles.length > 0 && (
                <div>
                  <span className="text-sm text-secondary-600 dark:text-secondary-400">Roles:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {schedule.recipients.roles.map((role, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
            <button
              onClick={onEdit}
              className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 border border-primary-300 dark:border-primary-600 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20"
            >
              Edit Schedule
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-secondary-600 hover:bg-secondary-700 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate next run time
function calculateNextRun(
  frequency: string,
  time: string,
  dayOfWeek?: number,
  dayOfMonth?: number
): Date {
  const now = new Date();
  const [hours, minutes] = time.split(":").map(Number);
  
  const nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);
  
  switch (frequency) {
    case "daily":
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
      
    case "weekly":
      const currentDay = nextRun.getDay();
      const targetDay = dayOfWeek || 1;
      let daysUntilTarget = targetDay - currentDay;
      
      if (daysUntilTarget <= 0 || (daysUntilTarget === 0 && nextRun <= now)) {
        daysUntilTarget += 7;
      }
      
      nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      break;
      
    case "monthly":
      const targetDate = dayOfMonth || 1;
      nextRun.setDate(targetDate);
      
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;
      
    case "quarterly":
      const currentMonth = nextRun.getMonth();
      const nextQuarterMonth = Math.ceil((currentMonth + 1) / 3) * 3;
      nextRun.setMonth(nextQuarterMonth);
      nextRun.setDate(1);
      
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 3);
      }
      break;
  }
  
  return nextRun;
}