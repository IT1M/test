"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  getPerformanceDashboardData,
  type PerformanceStats,
  type PerformanceMetric,
} from "@/lib/utils/performance";
import { formatDate } from "@/lib/utils/formatters";

export function PerformanceDashboard() {
  const [stats, setStats] = useState<PerformanceStats[]>([]);
  const [recentSlowOps, setRecentSlowOps] = useState<PerformanceMetric[]>([]);
  const [systemHealth, setSystemHealth] = useState<'good' | 'warning' | 'critical'>('good');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadPerformanceData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = async () => {
    try {
      const data = await getPerformanceDashboardData();
      setStats(data.stats);
      setRecentSlowOps(data.recentSlowOperations);
      setSystemHealth(data.systemHealth);
    } catch (error) {
      console.error("Error loading performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthBadge = () => {
    const config = {
      good: {
        icon: CheckCircle,
        label: "Good",
        className: "bg-green-500 hover:bg-green-600",
      },
      warning: {
        icon: AlertTriangle,
        label: "Warning",
        className: "bg-yellow-500 hover:bg-yellow-600",
      },
      critical: {
        icon: XCircle,
        label: "Critical",
        className: "bg-red-500 hover:bg-red-600",
      },
    };

    const { icon: Icon, label, className } = config[systemHealth];

    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getMetricTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      page_load: "Page Load",
      api_call: "API Call",
      database_query: "Database Query",
      component_render: "Component Render",
      file_upload: "File Upload",
      export_operation: "Export Operation",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading performance data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Performance Health
            </CardTitle>
            {getHealthBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.type}
                className="p-4 border rounded-lg bg-muted/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {getMetricTypeLabel(stat.type)}
                  </span>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {formatDuration(stat.avgDuration)}
                    </span>
                    <span className="text-xs text-muted-foreground">avg</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Min: {formatDuration(stat.minDuration)}</span>
                    <span>Max: {formatDuration(stat.maxDuration)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.count} operations
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Slow Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Recent Slow Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSlowOps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No slow operations detected recently
            </div>
          ) : (
            <div className="space-y-2">
              {recentSlowOps.slice(0, 10).map((op) => (
                <div
                  key={op.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getMetricTypeLabel(op.type)}
                      </Badge>
                      <span className="font-medium">{op.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(op.timestamp)}
                      {op.metadata && Object.keys(op.metadata).length > 0 && (
                        <span className="ml-2">
                          {Object.entries(op.metadata)
                            .filter(([key]) => key !== 'error')
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-lg font-bold ${
                        op.duration > 10000
                          ? "text-red-500"
                          : op.duration > 5000
                          ? "text-yellow-500"
                          : "text-blue-500"
                      }`}
                    >
                      {formatDuration(op.duration)}
                    </span>
                    {op.duration > 10000 ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Tips */}
      {systemHealth !== 'good' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Performance Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {systemHealth === 'critical' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>
                      System performance is critically slow. Consider clearing cache
                      or reducing data load.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>
                      Check for slow API calls and optimize Gemini AI usage.
                    </span>
                  </li>
                </>
              )}
              {systemHealth === 'warning' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    <span>
                      Some operations are running slower than optimal. Monitor
                      performance metrics.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    <span>
                      Consider enabling virtual scrolling for large data lists.
                    </span>
                  </li>
                </>
              )}
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>
                  Use caching strategies to reduce redundant API calls and database
                  queries.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>
                  Implement pagination for large datasets to improve load times.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
