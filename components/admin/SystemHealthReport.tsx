'use client';

// System Health Report Component
// Displays automated system health reports with AI-powered recommendations
// Requirement 22.11: Generate automated system health reports

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Database,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getSystemOptimizationService } from '@/services/gemini/system-optimization';
import { toast } from 'react-hot-toast';

interface SystemHealthReportProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export default function SystemHealthReport({ 
  autoRefresh = true, 
  refreshInterval = 300000 // 5 minutes
}: SystemHealthReportProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    metrics: true,
    database: false,
    queries: false,
    errors: false,
    recommendations: true,
  });

  // Load health report
  const loadHealthReport = async () => {
    try {
      setLoading(true);
      const optimizationService = getSystemOptimizationService();
      const healthReport = await optimizationService.generateSystemHealthReport();
      setReport(healthReport);
      setLastUpdated(new Date());
      toast.success('Health report updated');
    } catch (error) {
      console.error('Error loading health report:', error);
      toast.error('Failed to load health report');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadHealthReport();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadHealthReport();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Get health color
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'text-green-600 bg-green-50';
      case 'good':
        return 'text-blue-600 bg-blue-50';
      case 'fair':
        return 'text-yellow-600 bg-yellow-50';
      case 'poor':
        return 'text-orange-600 bg-orange-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Get health icon
  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'fair':
        return <Activity className="h-6 w-6 text-yellow-600" />;
      case 'poor':
        return <AlertTriangle className="h-6 w-6 text-orange-600" />;
      case 'critical':
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Activity className="h-6 w-6 text-gray-600" />;
    }
  };

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading && !report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health Report
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadHealthReport}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Health Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getHealthIcon(report.overallHealth)}
                <div>
                  <h3 className="text-lg font-semibold capitalize">
                    {report.overallHealth} Health
                  </h3>
                  <p className="text-sm text-gray-500">
                    System Health Score: {report.healthScore}/100
                  </p>
                </div>
              </div>
              <Badge className={getHealthColor(report.overallHealth)}>
                {report.healthScore}%
              </Badge>
            </div>

            {/* Health Score Progress */}
            <div>
              <Progress value={report.healthScore} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection('metrics')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
            {expandedSections.metrics ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </CardHeader>
        {expandedSections.metrics && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Cache Size</p>
                <p className="text-lg font-semibold">
                  {report.metrics.cacheSize} entries
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">API Calls Today</p>
                <p className="text-lg font-semibold">
                  {report.metrics.apiCallsToday}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Error Rate</p>
                <p className="text-lg font-semibold">
                  {(report.metrics.errorRate * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Query Time</p>
                <p className="text-lg font-semibold">
                  {report.metrics.averageQueryTime.toFixed(0)}ms
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Database Growth */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection('database')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Growth Prediction
            </CardTitle>
            {expandedSections.database ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </CardHeader>
        {expandedSections.database && (
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Current Size</p>
                  <p className="text-lg font-semibold">
                    {formatBytes(report.databaseGrowth.currentSize)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Predicted (30 days)</p>
                  <p className="text-lg font-semibold">
                    {formatBytes(report.databaseGrowth.predictedSizeIn30Days)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Predicted (90 days)</p>
                  <p className="text-lg font-semibold">
                    {formatBytes(report.databaseGrowth.predictedSizeIn90Days)}
                  </p>
                </div>
              </div>

              {report.databaseGrowth.alertLevel !== 'normal' && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Alert Level: {report.databaseGrowth.alertLevel}</strong>
                    <br />
                    {report.databaseGrowth.recommendation}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Query Optimizations */}
      {report.queryOptimizations.length > 0 && (
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection('queries')}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Query Optimizations ({report.queryOptimizations.length})
              </CardTitle>
              {expandedSections.queries ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>
          </CardHeader>
          {expandedSections.queries && (
            <CardContent>
              <div className="space-y-3">
                {report.queryOptimizations.map((opt: any, index: number) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{opt.query}</h4>
                      <Badge
                        variant={
                          opt.priority === 'high'
                            ? 'destructive'
                            : opt.priority === 'medium'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {opt.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      <strong>Issue:</strong> {opt.issue}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Suggestion:</strong> {opt.suggestedOptimization}
                    </p>
                    <p className="text-sm text-green-600">
                      <strong>Expected Improvement:</strong> {opt.expectedImprovement}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Error Patterns */}
      {report.errorPatterns.length > 0 && (
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection('errors')}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Error Patterns ({report.errorPatterns.length})
              </CardTitle>
              {expandedSections.errors ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>
          </CardHeader>
          {expandedSections.errors && (
            <CardContent>
              <div className="space-y-3">
                {report.errorPatterns.map((pattern: any, index: number) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{pattern.errorType}</h4>
                      <Badge
                        variant={
                          pattern.priority === 'critical' || pattern.priority === 'high'
                            ? 'destructive'
                            : 'default'
                        }
                      >
                        {pattern.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      <strong>Occurrences:</strong> {pattern.occurrences}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Root Cause:</strong> {pattern.rootCause}
                    </p>
                    <p className="text-sm text-blue-600">
                      <strong>Suggested Fix:</strong> {pattern.suggestedFix}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection('recommendations')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recommendations & Proactive Actions
            </CardTitle>
            {expandedSections.recommendations ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </CardHeader>
        {expandedSections.recommendations && (
          <CardContent>
            <div className="space-y-4">
              {/* General Recommendations */}
              <div>
                <h4 className="font-semibold mb-2">General Recommendations</h4>
                <ul className="space-y-2">
                  {report.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Proactive Actions */}
              <div>
                <h4 className="font-semibold mb-2">Proactive Actions</h4>
                <ul className="space-y-2">
                  {report.proactiveActions.map((action: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
