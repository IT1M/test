"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Shield, 
  Activity, 
  BarChart3, 
  Clock, 
  MapPin, 
  Smartphone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download
} from "lucide-react";
import { formatDate } from "@/utils/formatters";
import { getRoleDefinition } from "@/utils/rbac";

type UserRole = "ADMIN" | "DATA_ENTRY" | "SUPERVISOR" | "MANAGER" | "AUDITOR";

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  twoFactorEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
  lastActivity?: string;
  preferences?: any;
  _count?: {
    inventoryItems: number;
    auditLogs: number;
    sessions?: number;
    activities?: number;
    securityAlerts?: number;
  };
}

interface UserSession {
  id: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  device?: string;
  browser?: string;
  isActive: boolean;
  lastActivity: string;
  createdAt: string;
}

interface UserActivity {
  id: string;
  action: string;
  resource?: string;
  timestamp: string;
  ipAddress: string;
  duration?: number;
}

interface SecurityAlert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  isResolved: boolean;
  createdAt: string;
}

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function UserDetailsModal({ isOpen, onClose, user }: UserDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserDetails();
    }
  }, [isOpen, user]);

  const fetchUserDetails = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch sessions
      const sessionsResponse = await fetch(`/api/users/${user.id}/sessions`);
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.data || []);
      }

      // Fetch activities
      const activitiesResponse = await fetch(`/api/users/${user.id}/activities`);
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData.data || []);
      }

      // Fetch security alerts
      const alertsResponse = await fetch(`/api/users/${user.id}/security-alerts`);
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setSecurityAlerts(alertsData.data || []);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const roleDefinition = getRoleDefinition(user.role);
  const activeSessions = sessions.filter(s => s.isActive);
  const recentAlerts = securityAlerts.filter(a => !a.isResolved);

  const getActivityStatus = () => {
    if (!user.lastActivity) return { status: "Never logged in", color: "text-secondary-400", icon: XCircle };
    
    const lastActivity = new Date(user.lastActivity);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
    
    if (diffMinutes < 5) return { status: "Online now", color: "text-success-600", icon: CheckCircle };
    if (diffMinutes < 60) return { status: `Active ${Math.floor(diffMinutes)}m ago`, color: "text-success-600", icon: CheckCircle };
    
    const diffHours = diffMinutes / 60;
    if (diffHours < 24) return { status: `Active ${Math.floor(diffHours)}h ago`, color: "text-warning-600", icon: Clock };
    
    const diffDays = diffHours / 24;
    if (diffDays < 7) return { status: `Active ${Math.floor(diffDays)}d ago`, color: "text-secondary-500", icon: Clock };
    
    return { status: `Inactive for ${Math.floor(diffDays)}d`, color: "text-danger-600", icon: AlertTriangle };
  };

  const activityStatus = getActivityStatus();
  const ActivityIcon = activityStatus.icon;

  const tabs = [
    { id: "overview", label: "Overview", icon: UserIcon },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "sessions", label: "Sessions", icon: Smartphone },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`User Details: ${user.name}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* User Header */}
        <div className="flex items-start justify-between p-6 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                {user.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Mail className="w-4 h-4 text-secondary-500" />
                <span className="text-secondary-600 dark:text-secondary-400">{user.email}</span>
              </div>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant={user.isActive ? "success" : "secondary"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant={user.role === "ADMIN" ? "danger" : "primary"}>
                  {user.role.replace("_", " ")}
                </Badge>
                {user.twoFactorEnabled && (
                  <Badge variant="success">
                    <Shield className="w-3 h-3 mr-1" />
                    2FA Enabled
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-2">
              <ActivityIcon className={`w-4 h-4 ${activityStatus.color}`} />
              <span className={`text-sm ${activityStatus.color}`}>
                {activityStatus.status}
              </span>
            </div>
            {recentAlerts.length > 0 && (
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-warning-600" />
                <span className="text-sm text-warning-600">
                  {recentAlerts.length} security alert{recentAlerts.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-secondary-200 dark:border-secondary-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-secondary-400 dark:hover:text-secondary-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  Basic Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="w-5 h-5 text-secondary-400" />
                    <div>
                      <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        Full Name
                      </div>
                      <div className="text-sm text-secondary-600 dark:text-secondary-400">
                        {user.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-secondary-400" />
                    <div>
                      <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        Email Address
                      </div>
                      <div className="text-sm text-secondary-600 dark:text-secondary-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-secondary-400" />
                    <div>
                      <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        Member Since
                      </div>
                      <div className="text-sm text-secondary-600 dark:text-secondary-400">
                        {formatDate(user.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role & Permissions */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  Role & Permissions
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-1">
                      Current Role
                    </div>
                    <Badge variant={user.role === "ADMIN" ? "danger" : "primary"}>
                      {user.role.replace("_", " ")}
                    </Badge>
                  </div>
                  {roleDefinition && (
                    <div>
                      <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-1">
                        Description
                      </div>
                      <div className="text-sm text-secondary-600 dark:text-secondary-400">
                        {roleDefinition.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  Activity Statistics
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {user._count?.inventoryItems || 0}
                    </div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">
                      Inventory Entries
                    </div>
                  </div>
                  <div className="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {user._count?.auditLogs || 0}
                    </div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">
                      Audit Actions
                    </div>
                  </div>
                  <div className="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {activeSessions.length}
                    </div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">
                      Active Sessions
                    </div>
                  </div>
                  <div className="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {user._count?.securityAlerts || 0}
                    </div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">
                      Security Alerts
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Status */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  Security Status
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600 dark:text-secondary-400">
                      Two-Factor Authentication
                    </span>
                    <Badge variant={user.twoFactorEnabled ? "success" : "warning"}>
                      {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600 dark:text-secondary-400">
                      Account Status
                    </span>
                    <Badge variant={user.isActive ? "success" : "danger"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600 dark:text-secondary-400">
                      Security Alerts
                    </span>
                    <Badge variant={recentAlerts.length > 0 ? "warning" : "success"}>
                      {recentAlerts.length > 0 ? `${recentAlerts.length} Active` : "None"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  Recent Activity
                </h4>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
                  No recent activity found
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 10).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Activity className="w-4 h-4 text-secondary-400" />
                        <div>
                          <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                            {activity.action}
                          </div>
                          {activity.resource && (
                            <div className="text-xs text-secondary-500 dark:text-secondary-400">
                              {activity.resource}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-secondary-600 dark:text-secondary-400">
                          {formatDate(activity.timestamp)}
                        </div>
                        <div className="text-xs text-secondary-500 dark:text-secondary-400">
                          {activity.ipAddress}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "sessions" && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Active Sessions
              </h4>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
                  No active sessions found
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Smartphone className="w-5 h-5 text-secondary-400" />
                        <div>
                          <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                            {session.device || "Unknown Device"}
                          </div>
                          <div className="text-xs text-secondary-500 dark:text-secondary-400">
                            {session.browser} • {session.ipAddress}
                          </div>
                          {session.location && (
                            <div className="text-xs text-secondary-500 dark:text-secondary-400 flex items-center mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {session.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={session.isActive ? "success" : "secondary"}>
                          {session.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                          Last: {formatDate(session.lastActivity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Security Alerts
              </h4>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : securityAlerts.length === 0 ? (
                <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
                  No security alerts found
                </div>
              ) : (
                <div className="space-y-3">
                  {securityAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                            alert.severity === "HIGH" || alert.severity === "CRITICAL" 
                              ? "text-danger-600" 
                              : alert.severity === "MEDIUM" 
                                ? "text-warning-600" 
                                : "text-secondary-400"
                          }`} />
                          <div>
                            <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                              {alert.title}
                            </div>
                            <div className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                              {alert.description}
                            </div>
                            <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">
                              {formatDate(alert.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            alert.severity === "CRITICAL" ? "danger" :
                            alert.severity === "HIGH" ? "danger" :
                            alert.severity === "MEDIUM" ? "warning" : "secondary"
                          }>
                            {alert.severity}
                          </Badge>
                          <Badge variant={alert.isResolved ? "success" : "warning"}>
                            {alert.isResolved ? "Resolved" : "Active"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary">
            <Eye className="w-4 h-4 mr-2" />
            View Full Profile
          </Button>
        </div>
      </div>
    </Modal>
  );
}