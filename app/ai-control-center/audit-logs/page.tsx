'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Permission, hasPermission } from '@/lib/auth/rbac';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIControlBreadcrumb, FloatingHelpButton } from '@/components/ai-control';
import { 
  Search, 
  Download, 
  Filter, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { AIActivityLogger, ActivityLogFilter } from '@/services/ai/activity-logger';
import { AIActivityLog } from '@/types/database';
import { LogDetailModal } from '@/components/ai-control/LogDetailModal';
import { LogAnalyticsDashboard } from '@/components/ai-control/LogAnalyticsDashboard';

export default function AuditLogsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.getCurrentUser());
  
  // State
  const [logs, setLogs] = useState<AIActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AIActivityLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalLogs, setTotalLogs] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedOperation, setSelectedOperation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [maxConfidence, setMaxConfidence] = useState<number>(100);
  const [showFilters, setShowFilters] = useState(false);
  
  // Suspicious activity flags
  const [suspiciousLogs, setSuspiciousLogs] = useState<Set<string>>(new Set());

  // Check permissions
  useEffect(() => {
    if (!user || !hasPermission(user, Permission.ACCESS_AI_CONTROL_CENTER)) {
      router.push('/unauthorized');
    }
  }, [user, router]);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const filter: ActivityLogFilter = {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      };

      // Apply filters
      if (startDate) filter.startDate = new Date(startDate);
      if (endDate) filter.endDate = new Date(endDate);
      if (selectedModel !== 'all') filter.modelName = selectedModel;
      if (selectedUser !== 'all') filter.userId = selectedUser;
      if (selectedOperation !== 'all') filter.operationType = selectedOperation as any;
      if (selectedStatus !== 'all') filter.status = selectedStatus as any;
      if (minConfidence > 0) filter.minConfidence = minConfidence;
      if (maxConfidence < 100) filter.maxConfidence = maxConfidence;

      const fetchedLogs = await AIActivityLogger.getActivityLogs(filter);
      setLogs(fetchedLogs);
      
      // Get total count
      const count = await AIActivityLogger.getLogCount(filter.startDate, filter.endDate);
      setTotalLogs(count);
      
      // Flag suspicious activities
      flagSuspiciousActivities(fetchedLogs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, startDate, endDate, selectedModel, selectedUser, selectedOperation, selectedStatus, minConfidence, maxConfidence]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Flag suspicious activities
  const flagSuspiciousActivities = (logs: AIActivityLog[]) => {
    const suspicious = new Set<string>();
    
    logs.forEach(log => {
      // Flag low confidence with errors
      if (log.status === 'error' && log.confidenceScore && log.confidenceScore < 50) {
        suspicious.add(log.id);
      }
      
      // Flag repeated errors
      const errorCount = logs.filter(l => 
        l.modelName === log.modelName && 
        l.status === 'error' &&
        Math.abs(l.timestamp.getTime() - log.timestamp.getTime()) < 3600000 // Within 1 hour
      ).length;
      
      if (errorCount >= 3) {
        suspicious.add(log.id);
      }
      
      // Flag unusually long execution times
      if (log.executionTime > 5000) {
        suspicious.add(log.id);
      }
    });
    
    setSuspiciousLogs(suspicious);
  };

  // Export logs
  const handleExport = async (format: 'csv' | 'json' | 'excel') => {
    try {
      const filter: ActivityLogFilter = {};
      if (startDate) filter.startDate = new Date(startDate);
      if (endDate) filter.endDate = new Date(endDate);
      if (selectedModel !== 'all') filter.modelName = selectedModel;
      if (selectedUser !== 'all') filter.userId = selectedUser;
      if (selectedOperation !== 'all') filter.operationType = selectedOperation as any;
      if (selectedStatus !== 'all') filter.status = selectedStatus as any;

      const exportData = await AIActivityLogger.exportActivityLogs(filter, format);
      
      // Download file
      const blob = typeof exportData === 'string' 
        ? new Blob([exportData], { type: format === 'csv' ? 'text/csv' : 'application/json' })
        : exportData;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-activity-logs-${new Date().toISOString()}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setSelectedModel('all');
    setSelectedUser('all');
    setSelectedOperation('all');
    setSelectedStatus('all');
    setMinConfidence(0);
    setMaxConfidence(100);
    setCurrentPage(1);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'timeout':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'rate-limited':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400';
    if (confidence >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const totalPages = Math.ceil(totalLogs / pageSize);

  if (!user || !hasPermission(user, Permission.ACCESS_AI_CONTROL_CENTER)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/ai-control-center')}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Audit Logs
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {totalLogs.toLocaleString()} total logs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {showAnalytics ? 'Hide' : 'Show'} Analytics
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLogs}
                disabled={isLoading}
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
                Refresh
              </Button>

              <Select onValueChange={(value) => handleExport(value as any)}>
                <SelectTrigger className="w-32">
                  <Download className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <AIControlBreadcrumb />

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <div className="mb-6">
            <LogAnalyticsDashboard 
              startDate={startDate ? new Date(startDate) : undefined}
              endDate={endDate ? new Date(endDate) : undefined}
            />
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                <CardTitle>Filters</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                >
                  Reset
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {showFilters && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Start Date
                  </label>
                  <Input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    End Date
                  </label>
                  <Input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                {/* Model Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Model
                  </label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Models</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                      <SelectItem value="gemini-pro-vision">Gemini Pro Vision</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Operation Type Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Operation Type
                  </label>
                  <Select value={selectedOperation} onValueChange={setSelectedOperation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Operations</SelectItem>
                      <SelectItem value="search">Search</SelectItem>
                      <SelectItem value="analysis">Analysis</SelectItem>
                      <SelectItem value="forecast">Forecast</SelectItem>
                      <SelectItem value="pricing">Pricing</SelectItem>
                      <SelectItem value="ocr">OCR</SelectItem>
                      <SelectItem value="medical-analysis">Medical Analysis</SelectItem>
                      <SelectItem value="insights">Insights</SelectItem>
                      <SelectItem value="document-generation">Document Generation</SelectItem>
                      <SelectItem value="chatbot">Chatbot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Status
                  </label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="timeout">Timeout</SelectItem>
                      <SelectItem value="rate-limited">Rate Limited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Confidence Range */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Min Confidence (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={minConfidence}
                    onChange={(e) => setMinConfidence(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Max Confidence (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={maxConfidence}
                    onChange={(e) => setMaxConfidence(Number(e.target.value))}
                  />
                </div>

                {/* Page Size */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Page Size
                  </label>
                  <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 rows</SelectItem>
                      <SelectItem value="50">50 rows</SelectItem>
                      <SelectItem value="100">100 rows</SelectItem>
                      <SelectItem value="200">200 rows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Logs</CardTitle>
            <CardDescription>
              Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalLogs)} of {totalLogs.toLocaleString()} logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No logs found matching your filters
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Model
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Operation
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Confidence
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {logs.map((log) => (
                      <tr 
                        key={log.id}
                        className={cn(
                          'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                          suspiciousLogs.has(log.id) && 'bg-red-50 dark:bg-red-900/10'
                        )}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {suspiciousLogs.has(log.id) && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                            <div>
                              <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          <div>{log.modelName}</div>
                          {log.modelVersion && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              v{log.modelVersion}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          <Badge variant="outline">{log.operationType}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {log.userId}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {log.confidenceScore !== undefined ? (
                            <span className={cn('font-semibold', getConfidenceColor(log.confidenceScore))}>
                              {log.confidenceScore.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {log.executionTime}ms
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge className={getStatusColor(log.status)}>
                            {log.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLog(log);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLog(null);
          }}
        />
      )}

      {/* Floating Help Button */}
      <FloatingHelpButton />
    </div>
  );
}
