"use client";

import { useState, lazy, Suspense } from "react";
import { 
  Users, 
  Shield, 
  Activity, 
  Database, 
  Settings as SettingsIcon, 
  Monitor, 
  FileText, 
  Bell,
  Key,
  Globe,
  Zap,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { canPerformAction } from "@/utils/rbac";

type UserRole = "ADMIN" | "DATA_ENTRY" | "SUPERVISOR" | "MANAGER" | "AUDITOR";

// Lazy load components
const EnhancedUserManagement = lazy(() => import("./EnhancedUserManagement"));
const SystemHealthMonitoring = lazy(() => import("./SystemHealthMonitoring"));
const ActivityMonitoringDashboard = lazy(() => import("./ActivityMonitoringDashboard"));

interface EnhancedAdminSettingsProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    preferences: any;
  };
}

type AdminTab = 
  | "overview" 
  | "users" 
  | "monitoring" 
  | "activity" 
  | "backup" 
  | "security" 
  | "system" 
  | "audit"
  | "notifications";

interface SystemOverview {
  totalUsers: number;
  activeUsers: number;
  systemHealth: "healthy" | "warning" | "critical";
  lastBackup: string;
  securityAlerts: number;
  systemUptime: number;
}

export default function EnhancedAdminSettings({ user }: EnhancedAdminSettingsProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [systemOverview, setSystemOverview] = useState<SystemOverview | null>(null);

  const adminTabs = [
    { 
      id: "overview" as AdminTab, 
      label: "System Overview", 
      icon: BarChart3,
      description: "System status and key metrics",
      permission: "monitoring"
    },
    { 
      id: "users" as AdminTab, 
      label: "User Management", 
      icon: Users,
      description: "Manage users, roles, and permissions",
      permission: "user"
    },
    { 
      id: "monitoring" as AdminTab, 
      label: "System Health", 
      icon: Monitor,
      description: "Real-time system performance monitoring",
      permission: "monitoring"
    },
    { 
      id: "activity" as AdminTab, 
      label: "Activity Monitoring", 
      icon: Activity,
      description: "User activity and session tracking",
      permission: "monitoring"
    },
    { 
      id: "backup" as AdminTab, 
      label: "Backup & Recovery", 
      icon: HardDrive,
      description: "Database backup and restore operations",
      permission: "backup"
    },
    { 
      id: "security" as AdminTab, 
      label: "Security Center", 
      icon: Shield,
      description: "Security alerts and access control",
      permission: "monitoring"
    },
    { 
      id: "system" as AdminTab, 
      label: "System Configuration", 
      icon: SettingsIcon,
      description: "System settings and configuration",
      permission: "settings"
    },
    { 
      id: "audit" as AdminTab, 
      label: "Audit Trail", 
      icon: FileText,
      description: "System audit logs and compliance",
      permission: "audit"
    },
    { 
      id: "notifications" as AdminTab, 
      label: "Notification Center", 
      icon: Bell,
      description: "System notifications and alerts",
      permission: "notifications"
    },
  ];

  // Filter tabs based on user permissions
  const availableTabs = adminTabs.filter(tab => 
    canPerformAction(user.role, "read", tab.permission)
  );

  const getHealthStatusColor = (status: "healthy" | "warning" | "critical") => {
    switch (status) {
      case "healthy": return "text-success-600";
      case "warning": return "text-warning-600";
      case "critical": return "text-danger-600";
      default: return "text-secondary-600";
    }
  };

  const getHealthStatusIcon = (status: "healthy" | "warning" | "critical") => {
    switch (status) {
      case "healthy": return CheckCircle;
      case "warning": return AlertTriangle;
      case "critical": return AlertTriangle;
      default: return Clock;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            Administrative Settings
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-2">
            Comprehensive system management and configuration
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="primary">
            {user.role}
          </Badge>
          <Badge variant="success">
            Admin Access
          </Badge>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full xl:w-80 flex-shrink-0">
          <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
              Management Tools
            </h3>
            <nav className="space-y-2">
              {availableTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-start p-3 text-sm rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
                        : "text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800"
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                        {tab.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick System Status */}
          {systemOverview && (
            <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-4 mt-4">
              <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
                Quick Status
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-secondary-600 dark:text-secondary-400">System Health:</span>
                  <div className="flex items-center space-x-1">
                    {(() => {
                      const HealthIcon = getHealthStatusIcon(systemOverview.systemHealth);
                      return (
                        <HealthIcon className={`h-3 w-3 ${getHealthStatusColor(systemOverview.systemHealth)}`} />
                      );
                    })()}
                    <span className={`text-xs font-medium ${getHealthStatusColor(systemOverview.systemHealth)}`}>
                      {systemOverview.systemHealth.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-secondary-600 dark:text-secondary-400">Active Users:</span>
                  <span className="text-xs font-medium">{systemOverview.activeUsers}/{systemOverview.totalUsers}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-secondary-600 dark:text-secondary-400">Uptime:</span>
                  <span className="text-xs font-medium">{formatUptime(systemOverview.systemUptime)}</span>
                </div>
                
                {systemOverview.securityAlerts > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-secondary-600 dark:text-secondary-400">Security Alerts:</span>
                    <Badge variant="danger" className="text-xs">
                      {systemOverview.securityAlerts}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-secondary-900 rounded-lg shadow">
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            }>
              {activeTab === "overview" && (
                <div className="p-6">
                  <SystemOverviewDashboard user={user} onOverviewUpdate={setSystemOverview} />
                </div>
              )}
              
              {activeTab === "users" && (
                <div className="p-6">
                  <EnhancedUserManagement 
                    currentUserRole={user.role}
                    currentUserId={user.id}
                  />
                </div>
              )}
              
              {activeTab === "monitoring" && (
                <div className="p-6">
                  <SystemHealthMonitoring />
                </div>
              )}
              
              {activeTab === "activity" && (
                <div className="p-6">
                  <ActivityMonitoringDashboard />
                </div>
              )}
              
              {activeTab === "backup" && (
                <div className="p-6">
                  <BackupManagement />
                </div>
              )}
              
              {activeTab === "security" && (
                <div className="p-6">
                  <SecurityCenter />
                </div>
              )}
              
              {activeTab === "system" && (
                <div className="p-6">
                  <SystemConfiguration />
                </div>
              )}
              
              {activeTab === "audit" && (
                <div className="p-6">
                  <AuditTrail />
                </div>
              )}
              
              {activeTab === "notifications" && (
                <div className="p-6">
                  <NotificationCenter />
                </div>
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

// System Overview Dashboard Component
function SystemOverviewDashboard({ 
  user, 
  onOverviewUpdate 
}: { 
  user: any; 
  onOverviewUpdate: (overview: SystemOverview) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
        System Overview
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-primary-600" />
            <div>
              <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                24
              </div>
              <div className="text-sm text-secondary-600 dark:text-secondary-400">
                Total Users
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8 text-success-600" />
            <div>
              <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                12
              </div>
              <div className="text-sm text-secondary-600 dark:text-secondary-400">
                Active Sessions
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-success-600" />
            <div>
              <div className="text-2xl font-bold text-success-600">
                98%
              </div>
              <div className="text-sm text-secondary-600 dark:text-secondary-400">
                System Health
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-warning-600" />
            <div>
              <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                7d 12h
              </div>
              <div className="text-sm text-secondary-600 dark:text-secondary-400">
                Uptime
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
        <Monitor className="h-12 w-12 mx-auto mb-4" />
        <p>System overview dashboard will be populated with real-time data</p>
      </div>
    </div>
  );
}

// Placeholder components for other sections
function BackupManagement() {
  return (
    <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
      <HardDrive className="h-12 w-12 mx-auto mb-4" />
      <p>Backup management interface will be implemented here</p>
    </div>
  );
}

function SecurityCenter() {
  return (
    <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
      <Shield className="h-12 w-12 mx-auto mb-4" />
      <p>Security center interface will be implemented here</p>
    </div>
  );
}

function SystemConfiguration() {
  return (
    <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
      <SettingsIcon className="h-12 w-12 mx-auto mb-4" />
      <p>System configuration interface will be implemented here</p>
    </div>
  );
}

function AuditTrail() {
  return (
    <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
      <FileText className="h-12 w-12 mx-auto mb-4" />
      <p>Audit trail interface will be implemented here</p>
    </div>
  );
}

function NotificationCenter() {
  return (
    <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
      <Bell className="h-12 w-12 mx-auto mb-4" />
      <p>Notification center interface will be implemented here</p>
    </div>
  );
}