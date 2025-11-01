'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Clock,
  DollarSign,
  BarChart3,
  PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { AIActivityLogger, ActivityAnalytics } from '@/services/ai/activity-logger';

interface LogAnalyticsDashboardProps {
  startDate?: Date;
  endDate?: Date;
}

export function LogAnalyticsDashboard({ startDate, endDate }: LogAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<ActivityAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const data = await AIActivityLogger.getActivityAnalytics({
          startDate,
          endDate,
        });
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [startDate, endDate]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Activity className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Operations</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {analytics.totalOperations.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Activity className="w-4 h-4" />
              <span>All AI operations</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Success Rate</CardDescription>
            <CardTitle className="text-3xl font-bold">
              <span className={cn(
                analytics.successRate >= 95 ? 'text-green-600 dark:text-green-400' :
                analytics.successRate >= 80 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              )}>
                {analytics.successRate.toFixed(1)}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              {analytics.successRate >= 95 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">Excellent</span>
                </>
              ) : analytics.successRate >= 80 ? (
                <>
                  <Activity className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-yellow-600 dark:text-yellow-400">Good</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-red-600 dark:text-red-400">Needs attention</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Confidence</CardDescription>
            <CardTitle className="text-3xl font-bold">
              <span className={cn(
                analytics.averageConfidence >= 80 ? 'text-green-600 dark:text-green-400' :
                analytics.averageConfidence >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              )}>
                {analytics.averageConfidence.toFixed(1)}%
              </span>
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
            <CardDescription>Total Cost</CardDescription>
            <CardTitle className="text-3xl font-bold">
              ${analytics.totalCost.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <DollarSign className="w-4 h-4" />
              <span>Estimated spend</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operations by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Operations by Type</CardTitle>
            <CardDescription>Distribution of AI operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.operationsByType)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([type, count]) => {
                  const percentage = (count / analytics.totalOperations) * 100;
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300 capitalize">
                          {type.replace('-', ' ')}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {count.toLocaleString()} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Operations by Model */}
        <Card>
          <CardHeader>
            <CardTitle>Operations by Model</CardTitle>
            <CardDescription>Usage across AI models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.operationsByModel)
                .sort(([, a], [, b]) => b - a)
                .map(([model, count]) => {
                  const percentage = (count / analytics.totalOperations) * 100;
                  return (
                    <div key={model} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{model}</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {count.toLocaleString()} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Confidence Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Confidence Distribution</CardTitle>
            <CardDescription>Quality of AI predictions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">High (80-100%)</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {analytics.confidenceDistribution.high}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Medium (50-79%)</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {analytics.confidenceDistribution.medium}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Low (0-49%)</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {analytics.confidenceDistribution.low}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>System performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Avg Execution Time</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {analytics.averageExecutionTime.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">
                    {analytics.averageExecutionTime < 1000 ? 'Fast' : 
                     analytics.averageExecutionTime < 3000 ? 'Normal' : 'Slow'}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Error Rate</span>
                  <span className={cn(
                    'text-sm font-semibold',
                    analytics.errorRate < 5 ? 'text-green-600 dark:text-green-400' :
                    analytics.errorRate < 15 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  )}>
                    {analytics.errorRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">
                    {analytics.errorRate < 5 ? 'Excellent' : 
                     analytics.errorRate < 15 ? 'Acceptable' : 'High'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Errors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Errors</CardTitle>
            <CardDescription>Most common error messages</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topErrors.length > 0 ? (
              <div className="space-y-3">
                {analytics.topErrors.slice(0, 3).map((error, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                        {error.message}
                      </span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {error.count}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                No errors recorded
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Peak Usage Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Peak Usage Hours</CardTitle>
          <CardDescription>Busiest times for AI operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {analytics.peakUsageHours.map((peak) => (
              <div key={peak.hour} className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {peak.hour}:00
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {peak.count.toLocaleString()} ops
                </div>
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                    style={{ 
                      width: `${(peak.count / Math.max(...analytics.peakUsageHours.map(p => p.count))) * 100}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
