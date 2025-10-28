"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  Activity, 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  BarChart3,
  Zap,
  Shield,
  Globe,
  Monitor
} from "lucide-react";
import { formatDate } from "@/utils/formatters";
import toast from "react-hot-toast";

interface SystemMetrics {
  server: {
    uptime: number;
    status: "healthy" | "warning" | "critical";
    lastRestart: string;
    version: string;
  };
  database: {
    status: "healthy" | "warning" | "critical";
    connections: {
      active: number;
      max: number;
      idle: number;
    };
    queryPerformance: {
      avgResponseTime: number;
      slowQueries: number;
    };
    size: {
      used: number;
      total: number;
    };
  };
  performance: {
    cpu: {
      usage: number;
      cores: number;
      load: number[];
    };
    memory: {
      used: number;
      total: number;
      cached: number;
    };
    disk: {
      used: number;
      total: number;
      iops: number;
    };
  };
  application: {
    activeUsers: number;
    totalSessions: number;
    requestsPerMinute: number;
    errorRate: number;
    responseTime: number;
  };
  security: {
    failedLogins: number;
    securityAlerts: number;
    lastSecurityScan: string;
    sslStatus: "valid" | "expiring" | "expired";
    sslExpiryDate: string;
  };
  network: {
    status: "healthy" | "warning" | "critical";
    latency: number;
    bandwidth: {
      incoming: number;
      outgoing: number;
    };
    requests: {
      successful: number;
      failed: number;
      total: number;
    };
  };
}

interface HealthAlert {
  id: string;
  type: "info" | "warning" | "error" | "critical";
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  component: string;
}

export default function SystemHealthMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  const fetchHealthMetrics = async () => {
    try {
      const response = await fetch('/api/health/detailed');
      const data = await response.json();

      if (data.success) {
        setMetrics(data.data.metrics);
        setAlerts(data.data.alerts || []);
      } else {
        toast.error("Failed to fetch health metrics");
      }
    } catch (error) {
      console.error("Error fetching health metrics:", error);
      toast.error("Failed to fetch health metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthMetrics();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchHealthMetrics, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const getStatusColor = (status: "healthy" | "warning" | "critical") => {
    switch (status) {
      case "healthy": return "text-success-600";
      case "warning": return "text-warning-600";
      case "critical": return "text-danger-600";
      default: return "text-secondary-600";
    }
  };

  const getStatusIcon = (status: "healthy" | "warning" | "critical") => {
    switch (status) {
      case "healthy": return CheckCircle;
      case "warning": return AlertTriangle;
      case "critical": return XCircle;
      default: return Activity;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getPercentage = (used: number, total: number) => {
    return total > 0 ? Math.round((used / total) * 100) : 0;
  };

  const getOverallHealth = () => {
    if (!metrics) return { status: "unknown", score: 0 };
    
    const components = [
      metrics.server.status,
      metrics.database.status,
      metrics.network.status,
    ];
    
    const criticalCount = components.filter(s => s === "critical").length;
    const warningCount = components.filter(s => s === "warning").length;
    const healthyCount = components.filter(s => s === "healthy").length;
    
    if (criticalCount > 0) return { status: "critical", score: 25 };
    if (warningCount > 1) return { status: "warning", score: 60 };
    if (warningCount > 0) return { status: "warning", score: 80 };
    return { status: "healthy", score: 95 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-warning-600 mx-auto mb-4" />
        <p className="text-secondary-500 dark:text-secondary-400">
          Unable to load system health metrics
        </p>
        <Button variant="outline" onClick={fetchHealthMetrics} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const overallHealth = getOverallHealth();
  const OverallIcon = getStatusIcon(overallHealth.status as any);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            System Health Monitoring
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Real-time system performance and health metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-secondary-600 dark:text-secondary-400">
              Auto-refresh:
            </label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
            />
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              disabled={!autoRefresh}
              className="text-sm border border-secondary-300 rounded px-2 py-1"
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          </div>
          
          <Button variant="outline" onClick={fetchHealthMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Score */}
      <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              overallHealth.status === "healthy" ? "bg-success-100 dark:bg-success-900/20" :
              overallHealth.status === "warning" ? "bg-warning-100 dark:bg-warning-900/20" :
              "bg-danger-100 dark:bg-danger-900/20"
            }`}>
              <OverallIcon className={`h-8 w-8 ${getStatusColor(overallHealth.status as any)}`} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                System Health Score
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400">
                Overall system performance and availability
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-4xl font-bold text-secondary-900 dark:text-secondary-100">
              {overallHealth.score}%
            </div>
            <Badge variant={
              overallHealth.status === "healthy" ? "success" :
              overallHealth.status === "warning" ? "warning" : "danger"
            }>
              {overallHealth.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.filter(a => !a.resolved).length > 0 && (
        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
            Active Alerts
          </h3>
          <div className="space-y-3">
            {alerts.filter(a => !a.resolved).map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === "critical" ? "bg-danger-50 border-danger-500 dark:bg-danger-900/20" :
                  alert.type === "error" ? "bg-danger-50 border-danger-500 dark:bg-danger-900/20" :
                  alert.type === "warning" ? "bg-warning-50 border-warning-500 dark:bg-warning-900/20" :
                  "bg-info-50 border-info-500 dark:bg-info-900/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">{alert.title}</div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                      {alert.message}
                    </div>
                    <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">
                      {alert.component} • {formatDate(alert.timestamp)}
                    </div>
                  </div>
                  <Badge variant={
                    alert.type === "critical" || alert.type === "error" ? "danger" :
                    alert.type === "warning" ? "warning" : "primary"
                  }>
                    {alert.type.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Components Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Server Health */}
        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Server className="h-6 w-6 text-secondary-400" />
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Server
              </h3>
            </div>
            <Badge variant={
              metrics.server.status === "healthy" ? "success" :
              metrics.server.status === "warning" ? "warning" : "danger"
            }>
              {metrics.server.status.toUpperCase()}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Uptime:</span>
              <span className="text-sm font-medium">{formatUptime(metrics.server.uptime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Version:</span>
              <span className="text-sm font-medium">{metrics.server.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Last Restart:</span>
              <span className="text-sm font-medium">{formatDate(metrics.server.lastRestart)}</span>
            </div>
          </div>
        </div>

        {/* Database Health */}
        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Database className="h-6 w-6 text-secondary-400" />
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Database
              </h3>
            </div>
            <Badge variant={
              metrics.database.status === "healthy" ? "success" :
              metrics.database.status === "warning" ? "warning" : "danger"
            }>
              {metrics.database.status.toUpperCase()}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Connections:</span>
              <span className="text-sm font-medium">
                {metrics.database.connections.active}/{metrics.database.connections.max}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Avg Response:</span>
              <span className="text-sm font-medium">{metrics.database.queryPerformance.avgResponseTime}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Storage:</span>
              <span className="text-sm font-medium">
                {formatBytes(metrics.database.size.used)} / {formatBytes(metrics.database.size.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Cpu className="h-6 w-6 text-secondary-400" />
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Performance
              </h3>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-secondary-600 dark:text-secondary-400">CPU Usage:</span>
                <span className="text-sm font-medium">{metrics.performance.cpu.usage}%</span>
              </div>
              <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    metrics.performance.cpu.usage > 80 ? "bg-danger-600" :
                    metrics.performance.cpu.usage > 60 ? "bg-warning-600" : "bg-success-600"
                  }`}
                  style={{ width: `${metrics.performance.cpu.usage}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-secondary-600 dark:text-secondary-400">Memory:</span>
                <span className="text-sm font-medium">
                  {getPercentage(metrics.performance.memory.used, metrics.performance.memory.total)}%
                </span>
              </div>
              <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    getPercentage(metrics.performance.memory.used, metrics.performance.memory.total) > 80 ? "bg-danger-600" :
                    getPercentage(metrics.performance.memory.used, metrics.performance.memory.total) > 60 ? "bg-warning-600" : "bg-success-600"
                  }`}
                  style={{ width: `${getPercentage(metrics.performance.memory.used, metrics.performance.memory.total)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-secondary-600 dark:text-secondary-400">Disk:</span>
                <span className="text-sm font-medium">
                  {getPercentage(metrics.performance.disk.used, metrics.performance.disk.total)}%
                </span>
              </div>
              <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    getPercentage(metrics.performance.disk.used, metrics.performance.disk.total) > 80 ? "bg-danger-600" :
                    getPercentage(metrics.performance.disk.used, metrics.performance.disk.total) > 60 ? "bg-warning-600" : "bg-success-600"
                  }`}
                  style={{ width: `${getPercentage(metrics.performance.disk.used, metrics.performance.disk.total)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Metrics */}
        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Monitor className="h-6 w-6 text-secondary-400" />
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Application
              </h3>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Active Users:</span>
              <span className="text-sm font-medium">{metrics.application.activeUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Total Sessions:</span>
              <span className="text-sm font-medium">{metrics.application.totalSessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Requests/min:</span>
              <span className="text-sm font-medium">{metrics.application.requestsPerMinute}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Error Rate:</span>
              <span className={`text-sm font-medium ${
                metrics.application.errorRate > 5 ? "text-danger-600" :
                metrics.application.errorRate > 1 ? "text-warning-600" : "text-success-600"
              }`}>
                {metrics.application.errorRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Response Time:</span>
              <span className="text-sm font-medium">{metrics.application.responseTime}ms</span>
            </div>
          </div>
        </div>

        {/* Security Status */}
        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-secondary-400" />
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Security
              </h3>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Failed Logins:</span>
              <span className={`text-sm font-medium ${
                metrics.security.failedLogins > 10 ? "text-danger-600" :
                metrics.security.failedLogins > 5 ? "text-warning-600" : "text-success-600"
              }`}>
                {metrics.security.failedLogins}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Security Alerts:</span>
              <span className={`text-sm font-medium ${
                metrics.security.securityAlerts > 0 ? "text-danger-600" : "text-success-600"
              }`}>
                {metrics.security.securityAlerts}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">SSL Status:</span>
              <Badge variant={
                metrics.security.sslStatus === "valid" ? "success" :
                metrics.security.sslStatus === "expiring" ? "warning" : "danger"
              }>
                {metrics.security.sslStatus.toUpperCase()}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Last Scan:</span>
              <span className="text-sm font-medium">{formatDate(metrics.security.lastSecurityScan)}</span>
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Globe className="h-6 w-6 text-secondary-400" />
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Network
              </h3>
            </div>
            <Badge variant={
              metrics.network.status === "healthy" ? "success" :
              metrics.network.status === "warning" ? "warning" : "danger"
            }>
              {metrics.network.status.toUpperCase()}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Latency:</span>
              <span className="text-sm font-medium">{metrics.network.latency}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Success Rate:</span>
              <span className="text-sm font-medium">
                {Math.round((metrics.network.requests.successful / metrics.network.requests.total) * 100)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Bandwidth In:</span>
              <span className="text-sm font-medium">{formatBytes(metrics.network.bandwidth.incoming)}/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Bandwidth Out:</span>
              <span className="text-sm font-medium">{formatBytes(metrics.network.bandwidth.outgoing)}/s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}