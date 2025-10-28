"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { 
  Settings, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Database, 
  Mail, 
  Shield, 
  Globe,
  Clock,
  Zap,
  FileText,
  Key
} from "lucide-react";
import toast from "react-hot-toast";

interface SystemConfig {
  general: {
    siteName: string;
    siteDescription: string;
    defaultLanguage: string;
    timezone: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
  };
  database: {
    connectionPoolSize: number;
    queryTimeout: number;
    backupRetentionDays: number;
    autoBackupEnabled: boolean;
    autoBackupSchedule: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
    allowedFileTypes: string[];
    maxFileSize: number;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    enableTLS: boolean;
  };
  performance: {
    cacheEnabled: boolean;
    cacheTTL: number;
    compressionEnabled: boolean;
    rateLimitEnabled: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
  };
  notifications: {
    enableEmailNotifications: boolean;
    enablePushNotifications: boolean;
    notificationRetentionDays: number;
    criticalAlertsEmail: string;
  };
}

export default function SystemConfigurationManager() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<keyof SystemConfig>("general");
  const [hasChanges, setHasChanges] = useState(false);

  const sections = [
    { id: "general" as keyof SystemConfig, label: "General Settings", icon: Settings },
    { id: "database" as keyof SystemConfig, label: "Database", icon: Database },
    { id: "security" as keyof SystemConfig, label: "Security", icon: Shield },
    { id: "email" as keyof SystemConfig, label: "Email", icon: Mail },
    { id: "performance" as keyof SystemConfig, label: "Performance", icon: Zap },
    { id: "notifications" as keyof SystemConfig, label: "Notifications", icon: FileText },
  ];

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      const data = await response.json();

      if (data.success) {
        setConfig(data.data);
      } else {
        toast.error("Failed to load system configuration");
      }
    } catch (error) {
      console.error("Error fetching config:", error);
      toast.error("Failed to load system configuration");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Configuration saved successfully");
        setHasChanges(false);
      } else {
        toast.error(data.error?.message || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    if (!config) return;

    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [field]: value,
      },
    });
    setHasChanges(true);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-warning-600 mx-auto mb-4" />
        <p className="text-secondary-500 dark:text-secondary-400">
          Unable to load system configuration
        </p>
        <Button variant="outline" onClick={fetchConfig} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            System Configuration
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Manage system settings and configuration
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <Badge variant="warning">
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" onClick={fetchConfig}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="primary" 
            onClick={saveConfig} 
            loading={saving}
            disabled={!hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Section Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
              Configuration Sections
            </h3>
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeSection === section.id
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                        : "text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Configuration Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-6">
            {activeSection === "general" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  General Settings
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Site Name"
                    value={config.general.siteName}
                    onChange={(e) => updateConfig("general", "siteName", e.target.value)}
                  />
                  
                  <Input
                    label="Site Description"
                    value={config.general.siteDescription}
                    onChange={(e) => updateConfig("general", "siteDescription", e.target.value)}
                  />
                  
                  <Select
                    label="Default Language"
                    value={config.general.defaultLanguage}
                    onChange={(e) => updateConfig("general", "defaultLanguage", e.target.value)}
                  >
                    <option value="ar">Arabic</option>
                    <option value="en">English</option>
                  </Select>
                  
                  <Select
                    label="Timezone"
                    value={config.general.timezone}
                    onChange={(e) => updateConfig("general", "timezone", e.target.value)}
                  >
                    <option value="Asia/Riyadh">Asia/Riyadh</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={config.general.maintenanceMode}
                      onChange={(e) => updateConfig("general", "maintenanceMode", e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                    />
                    <label htmlFor="maintenanceMode" className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                      Maintenance Mode
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="registrationEnabled"
                      checked={config.general.registrationEnabled}
                      onChange={(e) => updateConfig("general", "registrationEnabled", e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                    />
                    <label htmlFor="registrationEnabled" className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                      Allow User Registration
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "database" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  Database Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Connection Pool Size"
                    type="number"
                    value={config.database.connectionPoolSize}
                    onChange={(e) => updateConfig("database", "connectionPoolSize", parseInt(e.target.value))}
                  />
                  
                  <Input
                    label="Query Timeout (seconds)"
                    type="number"
                    value={config.database.queryTimeout}
                    onChange={(e) => updateConfig("database", "queryTimeout", parseInt(e.target.value))}
                  />
                  
                  <Input
                    label="Backup Retention (days)"
                    type="number"
                    value={config.database.backupRetentionDays}
                    onChange={(e) => updateConfig("database", "backupRetentionDays", parseInt(e.target.value))}
                  />
                  
                  <Input
                    label="Auto Backup Schedule"
                    value={config.database.autoBackupSchedule}
                    onChange={(e) => updateConfig("database", "autoBackupSchedule", e.target.value)}
                    helperText="Cron expression (e.g., 0 2 * * *)"
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="autoBackupEnabled"
                    checked={config.database.autoBackupEnabled}
                    onChange={(e) => updateConfig("database", "autoBackupEnabled", e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                  <label htmlFor="autoBackupEnabled" className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    Enable Automatic Backups
                  </label>
                </div>
              </div>
            )}

            {activeSection === "security" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  Security Settings
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Session Timeout (minutes)"
                    type="number"
                    value={config.security.sessionTimeout}
                    onChange={(e) => updateConfig("security", "sessionTimeout", parseInt(e.target.value))}
                  />
                  
                  <Input
                    label="Max Login Attempts"
                    type="number"
                    value={config.security.maxLoginAttempts}
                    onChange={(e) => updateConfig("security", "maxLoginAttempts", parseInt(e.target.value))}
                  />
                  
                  <Input
                    label="Lockout Duration (minutes)"
                    type="number"
                    value={config.security.lockoutDuration}
                    onChange={(e) => updateConfig("security", "lockoutDuration", parseInt(e.target.value))}
                  />
                  
                  <Input
                    label="Password Min Length"
                    type="number"
                    value={config.security.passwordMinLength}
                    onChange={(e) => updateConfig("security", "passwordMinLength", parseInt(e.target.value))}
                  />
                  
                  <Input
                    label="Max File Size (MB)"
                    type="number"
                    value={config.security.maxFileSize}
                    onChange={(e) => updateConfig("security", "maxFileSize", parseInt(e.target.value))}
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="requireTwoFactor"
                    checked={config.security.requireTwoFactor}
                    onChange={(e) => updateConfig("security", "requireTwoFactor", e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                  <label htmlFor="requireTwoFactor" className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    Require Two-Factor Authentication
                  </label>
                </div>
              </div>
            )}

            {/* Add other sections as needed */}
            {activeSection === "email" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  Email Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="SMTP Host"
                    value={config.email.smtpHost}
                    onChange={(e) => updateConfig("email", "smtpHost", e.target.value)}
                  />
                  
                  <Input
                    label="SMTP Port"
                    type="number"
                    value={config.email.smtpPort}
                    onChange={(e) => updateConfig("email", "smtpPort", parseInt(e.target.value))}
                  />
                  
                  <Input
                    label="SMTP Username"
                    value={config.email.smtpUsername}
                    onChange={(e) => updateConfig("email", "smtpUsername", e.target.value)}
                  />
                  
                  <Input
                    label="SMTP Password"
                    type="password"
                    value={config.email.smtpPassword}
                    onChange={(e) => updateConfig("email", "smtpPassword", e.target.value)}
                  />
                  
                  <Input
                    label="From Email"
                    type="email"
                    value={config.email.fromEmail}
                    onChange={(e) => updateConfig("email", "fromEmail", e.target.value)}
                  />
                  
                  <Input
                    label="From Name"
                    value={config.email.fromName}
                    onChange={(e) => updateConfig("email", "fromName", e.target.value)}
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableTLS"
                    checked={config.email.enableTLS}
                    onChange={(e) => updateConfig("email", "enableTLS", e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                  <label htmlFor="enableTLS" className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    Enable TLS/SSL
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}