'use client';

import { useState } from 'react';
import { AIActivityLog } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, 
  Copy, 
  Check,
  Clock,
  User,
  Cpu,
  Activity,
  AlertTriangle,
  DollarSign,
  FileText,
  Code
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface LogDetailModalProps {
  log: AIActivityLog;
  onClose: () => void;
}

export function LogDetailModal({ log, onClose }: LogDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400';
    if (confidence >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatJSON = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Log Details
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {log.id}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-lg"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Execution Time</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {log.executionTime}ms
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Confidence</div>
                    <div className={cn('text-lg font-semibold', 
                      log.confidenceScore !== undefined 
                        ? getConfidenceColor(log.confidenceScore)
                        : 'text-gray-400'
                    )}>
                      {log.confidenceScore !== undefined ? `${log.confidenceScore.toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Estimated Cost</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${(log.estimatedCost || 0).toFixed(4)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    log.status === 'success' 
                      ? 'bg-green-100 dark:bg-green-900/20'
                      : 'bg-red-100 dark:bg-red-900/20'
                  )}>
                    {log.status === 'success' ? (
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                    <Badge className={getStatusColor(log.status)}>
                      {log.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Operation Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Timestamp</label>
                  <div className="text-sm text-gray-900 dark:text-white mt-1">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">{log.userId}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Model</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Cpu className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {log.modelName}
                      {log.modelVersion && ` v${log.modelVersion}`}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Operation Type</label>
                  <div className="mt-1">
                    <Badge variant="outline">{log.operationType}</Badge>
                  </div>
                </div>

                {log.operationDescription && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                    <div className="text-sm text-gray-900 dark:text-white mt-1">
                      {log.operationDescription}
                    </div>
                  </div>
                )}

                {log.entityType && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Entity Type</label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">
                        {log.entityType}
                      </div>
                    </div>

                    {log.entityId && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Entity ID</label>
                        <div className="text-sm text-gray-900 dark:text-white mt-1">
                          {log.entityId}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {(log.inputTokens || log.outputTokens) && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Input Tokens</label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">
                        {log.inputTokens?.toLocaleString() || 0}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Output Tokens</label>
                      <div className="text-sm text-gray-900 dark:text-white mt-1">
                        {log.outputTokens?.toLocaleString() || 0}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error Information */}
          {log.status === 'error' && (log.errorMessage || log.errorCode) && (
            <Card className="mb-6 border-red-200 dark:border-red-800">
              <CardHeader className="bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <CardTitle className="text-red-900 dark:text-red-100">Error Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {log.errorCode && (
                  <div className="mb-3">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Error Code</label>
                    <div className="text-sm text-red-600 dark:text-red-400 mt-1 font-mono">
                      {log.errorCode}
                    </div>
                  </div>
                )}
                {log.errorMessage && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Error Message</label>
                    <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {log.errorMessage}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Data Tabs */}
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="input" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="input">Input Data</TabsTrigger>
                  <TabsTrigger value="output">Output Data</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                </TabsList>

                <TabsContent value="input" className="mt-4">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(log.inputData, 'input')}
                    >
                      {copiedField === 'input' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-xs">
                      <code className="text-gray-900 dark:text-white">
                        {formatJSON(log.inputData)}
                      </code>
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="output" className="mt-4">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(log.outputData, 'output')}
                    >
                      {copiedField === 'output' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-xs">
                      <code className="text-gray-900 dark:text-white">
                        {formatJSON(log.outputData)}
                      </code>
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="metadata" className="mt-4">
                  {log.metadata ? (
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 z-10"
                        onClick={() => copyToClipboard(JSON.stringify(log.metadata), 'metadata')}
                      >
                        {copiedField === 'metadata' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-xs">
                        <code className="text-gray-900 dark:text-white">
                          {JSON.stringify(log.metadata, null, 2)}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No metadata available
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
