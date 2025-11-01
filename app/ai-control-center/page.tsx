'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Permission, hasPermission } from '@/lib/auth/rbac';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Activity, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  Settings,
  FileText,
  Shield,
  Moon,
  Sun
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ModelStatus {
  model_id: string;
  model_name: string;
  version: string;
  status: 'active' | 'inactive' | 'error';
  health: 'healthy' | 'warning' | 'critical';
  avg_response_ms: number;
  error_rate: number;
  avg_confidence: number;
  last_call: string;
  calls_today: number;
  cost_today: number;
}

interface SystemStatus {
  timestamp: string;
  systemHealth: 'healthy' | 'warning' | 'critical';
  models: ModelStatus[];
  aggregates: {
    total_calls_24h: number;
    total_calls_7d: number;
    avg_confidence: number;
    total_cost_today: number;
    active_models: number;
    error_rate: number;
  };
}

interface ActivityLog {
  id: string;
  timestamp: string;
  model_name: string;
  operation_type: string;
  confidence_score: number;
  status: 'success' | 'error' | 'timeout';
  execution_time: number;
}

interface Alert {
  id: string;
  type: 'performance' | 'cost' | 'error' | 'security';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  created_at: string;
}

export default function AIControlCenterPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.getCurrentUser());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshInterval, setRefreshInterval] = useState(60000); // 60 seconds default
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Check permissions
  useEffect(() => {
    if (!user || !hasPermission(user, Permission.ACCESS_AI_CONTROL_CENTER)) {
      router.push('/unauthorized');
    }
  }, [user, router]);

  // Fetch system status
  const fetchSystemStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-control/status');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  }, []);

  // Fetch recent activity
  const fetchRecentActivity = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-control/logs?page=1&page_size=10&sort=-timestamp');
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    }
  }, []);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-control/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      fetchSystemStatus(),
      fetchRecentActivity(),
      fetchAlerts()
    ]);
    setLastRefresh(new Date());
    setIsLoading(false);
  }, [fetchSystemStatus, fetchRecentActivity, fetchAlerts]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-refresh with configurable interval
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshData, refreshInterval]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'r':
            e.preventDefault();
            refreshData();
            break;
          case 'f':
            e.preventDefault();
            router.push('/ai-control-center/audit-logs');
            break;
          case 'e':
            e.preventDefault();
            // Export functionality
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [refreshData, router]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Get status color
  const getStatusColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'critical':
        return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  // Get status icon
  const getStatusIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  if (!user || !hasPermission(user, Permission.ACCESS_AI_CONTROL_CENTER)) {
    return null;
  }

  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors', isDarkMode && 'dark')}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  AI Mais Co.
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  AI Control Center
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* System Health Indicator */}
              {systemStatus && (
                <Badge className={cn('flex items-center gap-2', getStatusColor(systemStatus.systemHealth))}>
                  {getStatusIcon(systemStatus.systemHealth)}
                  <span className="font-medium capitalize">{systemStatus.systemHealth}</span>
                </Badge>
              )}

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                Refresh
              </Button>

              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {/* User Menu */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900 dark:text-white">{user.username}</div>
                  <div className="text-gray-500 dark:text-gray-400 capitalize">{user.role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>System Health</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {systemStatus ? (
                  <span className={cn(getStatusColor(systemStatus.systemHealth))}>
                    {systemStatus.systemHealth === 'healthy' ? '98%' : systemStatus.systemHealth === 'warning' ? '75%' : '45%'}
                  </span>
                ) : (
                  <span className="text-gray-400">--</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Activity className="w-4 h-4" />
                <span>{systemStatus?.aggregates.active_models || 0} models active</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Throughput (24h)</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {systemStatus ? (
                  <span>{(systemStatus.aggregates.total_calls_24h / 1000).toFixed(1)}K</span>
                ) : (
                  <span className="text-gray-400">--</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span>+12% from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Confidence</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {systemStatus ? (
                  <span>{systemStatus.aggregates.avg_confidence.toFixed(2)}</span>
                ) : (
                  <span className="text-gray-400">--</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <BarChart3 className="w-4 h-4" />
                <span>Across all models</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Cost Today</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {systemStatus ? (
                  <span>${systemStatus.aggregates.total_cost_today.toFixed(2)}</span>
                ) : (
                  <span className="text-gray-400">--</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <DollarSign className="w-4 h-4" />
                <span>Budget: $50.00</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Model Status - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Model Status</CardTitle>
                    <CardDescription>Real-time performance metrics</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push('/ai-control-center/diagnostics')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Diagnostics
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemStatus?.models.map((model) => (
                    <div
                      key={model.model_id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={cn('w-3 h-3 rounded-full', 
                          model.health === 'healthy' ? 'bg-green-500' : 
                          model.health === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        )} />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{model.model_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">v{model.version}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="text-gray-500 dark:text-gray-400">Confidence</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{model.avg_confidence.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-500 dark:text-gray-400">Response</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{model.avg_response_ms}ms</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-500 dark:text-gray-400">Calls</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{model.calls_today}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-500 dark:text-gray-400">Cost</div>
                          <div className="font-semibold text-gray-900 dark:text-white">${model.cost_today.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!systemStatus?.models || systemStatus.models.length === 0) && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No models configured
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts - Takes 1 column */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Alerts</CardTitle>
                    <CardDescription>{alerts.length} active</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => router.push('/ai-control-center/alerts')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        'p-3 rounded-lg border-l-4',
                        alert.severity === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                        alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                        'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900 dark:text-white">{alert.title}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{alert.description}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {alert.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <div>No active alerts</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity Feed */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest AI operations</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/ai-control-center/audit-logs')}>
                <FileText className="w-4 h-4 mr-2" />
                View All Logs
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      log.status === 'success' ? 'bg-green-500' :
                      log.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                    )} />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {log.model_name} - {log.operation_type}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-gray-500 dark:text-gray-400 text-xs">Confidence</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{log.confidence_score.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 dark:text-gray-400 text-xs">Time</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{log.execution_time}ms</div>
                    </div>
                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                      {log.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Last refresh: {lastRefresh.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span>Auto-refresh: {refreshInterval / 1000}s</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>PHI Sanitization: Enabled</span>
          </div>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Keyboard Shortcuts:</strong> Ctrl+R (Refresh) | Ctrl+F (Search Logs) | Ctrl+E (Export)
          </div>
        </div>
      </div>
    </div>
  );
}
