'use client';

import { useEffect, useState } from 'react';
import { AuditLogger, AuditAction } from '@/lib/security/audit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { History, User, Calendar, FileText } from 'lucide-react';

interface AuditTrailProps {
  entityType: string;
  entityId: string;
  maxHeight?: string;
}

/**
 * AuditTrail component
 * Displays the audit trail for a specific entity
 */
export function AuditTrail({ entityType, entityId, maxHeight = '400px' }: AuditTrailProps) {
  const [auditLogs, setAuditLogs] = useState<AuditAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuditTrail();
  }, [entityType, entityId]);

  const loadAuditTrail = async () => {
    setIsLoading(true);
    try {
      const logs = await AuditLogger.getAuditTrail(entityType, entityId);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Failed to load audit trail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (type: string): string => {
    if (type.includes('create')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (type.includes('update') || type.includes('edit')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (type.includes('delete')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const formatActionType = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Audit Trail
          </CardTitle>
          <CardDescription>Loading audit history...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Audit Trail
          </CardTitle>
          <CardDescription>No audit history available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Audit Trail
        </CardTitle>
        <CardDescription>
          Complete history of changes and actions ({auditLogs.length} entries)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight }}>
          <div className="space-y-4">
            {auditLogs.map((log, index) => (
              <div
                key={`${log.type}-${log.timestamp?.getTime() || index}`}
                className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 pb-4 relative"
              >
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900" />
                
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className={getActionColor(log.type)}>
                    {formatActionType(log.type)}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {log.timestamp ? formatDistanceToNow(log.timestamp, { addSuffix: true }) : 'Unknown time'}
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <User className="h-3 w-3" />
                    <span>User: {log.userId}</span>
                  </div>

                  {log.timestamp && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>{log.timestamp.toLocaleString()}</span>
                    </div>
                  )}

                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                      <div className="flex items-center gap-2 mb-1 font-semibold">
                        <FileText className="h-3 w-3" />
                        <span>Changes:</span>
                      </div>
                      <div className="space-y-1 ml-5">
                        {Object.entries(log.changes).map(([field, change]) => (
                          <div key={field} className="grid grid-cols-3 gap-2">
                            <span className="font-medium">{field}:</span>
                            <span className="text-red-600 dark:text-red-400 truncate">
                              {JSON.stringify(change.old)}
                            </span>
                            <span className="text-green-600 dark:text-green-400 truncate">
                              → {JSON.stringify(change.new)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {log.metadata && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                      <div className="font-semibold mb-1">Additional Details:</div>
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
