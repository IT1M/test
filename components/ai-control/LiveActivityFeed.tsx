'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Pause, 
  Play,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ActivityLogEntry {
  id: string;
  timestamp: string;
  model_name: string;
  operation_type: string;
  confidence_score: number;
  status: 'success' | 'error' | 'timeout';
  execution_time: number;
  user_id?: string;
}

interface LiveActivityFeedProps {
  initialLogs?: ActivityLogEntry[];
  maxEntries?: number;
  autoScroll?: boolean;
}

export function LiveActivityFeed({ 
  initialLogs = [], 
  maxEntries = 50,
  autoScroll = true 
}: LiveActivityFeedProps) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>(initialLogs);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'timeout'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simulate real-time updates (in production, this would be WebSocket)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      // Fetch new logs from API
      fetchNewLogs();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [isPaused]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Fetch new logs
  const fetchNewLogs = async () => {
    try {
      const response = await fetch('/api/ai-control/logs?page=1&page_size=10&sort=-timestamp');
      if (response.ok) {
        const data = await response.json();
        if (data.logs && data.logs.length > 0) {
          setLogs(prevLogs => {
            const newLogs = [...data.logs, ...prevLogs];
            return newLogs.slice(0, maxEntries);
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch new logs:', error);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20'
        };
      case 'error':
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20'
        };
      case 'timeout':
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
        };
      default:
        return {
          icon: <Activity className="w-4 h-4" />,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20'
        };
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // Export logs
  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-logs-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Live Activity Feed
            </CardTitle>
            <CardDescription>
              Real-time AI operation stream ({filteredLogs.length} entries)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-2"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({logs.length})
          </Button>
          <Button
            variant={filter === 'success' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('success')}
          >
            Success ({logs.filter(l => l.status === 'success').length})
          </Button>
          <Button
            variant={filter === 'error' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('error')}
          >
            Errors ({logs.filter(l => l.status === 'error').length})
          </Button>
          <Button
            variant={filter === 'timeout' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('timeout')}
          >
            Timeouts ({logs.filter(l => l.status === 'timeout').length})
          </Button>
        </div>

        {/* Activity Stream */}
        <ScrollArea className="h-96" ref={scrollRef}>
          <div className="space-y-2">
            {filteredLogs.map((log, index) => {
              const statusDisplay = getStatusDisplay(log.status);
              const isNew = index < 3; // Highlight recent entries

              return (
                <div
                  key={log.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-all',
                    statusDisplay.bgColor,
                    isNew && 'animate-in fade-in slide-in-from-top-2 duration-500',
                    'hover:shadow-md'
                  )}
                >
                  {/* Status Indicator */}
                  <div className={cn('flex-shrink-0', statusDisplay.color)}>
                    {statusDisplay.icon}
                  </div>

                  {/* Log Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {log.model_name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {log.operation_type}
                      </Badge>
                      {isNew && (
                        <Badge className="text-xs bg-blue-500">NEW</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <span>•</span>
                      <span>Confidence: {log.confidence_score.toFixed(2)}</span>
                      <span>•</span>
                      <span>{log.execution_time}ms</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <Badge
                    variant={log.status === 'success' ? 'default' : 'destructive'}
                    className="flex-shrink-0"
                  >
                    {log.status}
                  </Badge>
                </div>
              );
            })}

            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No activity logs to display</p>
                <p className="text-sm mt-1">
                  {filter !== 'all' ? 'Try changing the filter' : 'Waiting for AI operations...'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Status Bar */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-2 h-2 rounded-full',
                isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'
              )} />
              <span>{isPaused ? 'Paused' : 'Live'}</span>
            </div>
            <div>
              Last update: {logs.length > 0 ? formatTimestamp(logs[0].timestamp) : 'Never'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
