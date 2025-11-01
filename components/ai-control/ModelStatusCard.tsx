'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ModelStatusCardProps {
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

export function ModelStatusCard({
  model_id,
  model_name,
  version,
  status,
  health,
  avg_response_ms,
  error_rate,
  avg_confidence,
  last_call,
  calls_today,
  cost_today
}: ModelStatusCardProps) {
  // Get health indicator color and icon
  const getHealthIndicator = () => {
    switch (health) {
      case 'healthy':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          icon: <CheckCircle className="w-5 h-5" />
        };
      case 'warning':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          icon: <AlertTriangle className="w-5 h-5" />
        };
      case 'critical':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          icon: <XCircle className="w-5 h-5" />
        };
      default:
        return {
          color: 'bg-gray-400',
          textColor: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          icon: <Activity className="w-5 h-5" />
        };
    }
  };

  const healthIndicator = getHealthIndicator();

  // Format last call time
  const formatLastCall = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Health Indicator Dot */}
            <div className={cn('w-3 h-3 rounded-full animate-pulse', healthIndicator.color)} />
            <div>
              <CardTitle className="text-lg font-semibold">{model_name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">v{version}</span>
                <Badge 
                  variant={status === 'active' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {status}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Health Badge */}
          <div className={cn('flex items-center gap-2 px-3 py-1 rounded-full', healthIndicator.bgColor)}>
            <span className={healthIndicator.textColor}>{healthIndicator.icon}</span>
            <span className={cn('text-sm font-medium capitalize', healthIndicator.textColor)}>
              {health}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Average Confidence */}
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Confidence</div>
            <div className={cn(
              'text-lg font-bold',
              avg_confidence >= 0.8 ? 'text-green-600 dark:text-green-400' :
              avg_confidence >= 0.6 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            )}>
              {avg_confidence.toFixed(2)}
            </div>
          </div>

          {/* Response Time */}
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Response</div>
            <div className={cn(
              'text-lg font-bold',
              avg_response_ms < 500 ? 'text-green-600 dark:text-green-400' :
              avg_response_ms < 1000 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            )}>
              {avg_response_ms}ms
            </div>
          </div>

          {/* Error Rate */}
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Error Rate</div>
            <div className={cn(
              'text-lg font-bold',
              error_rate < 0.05 ? 'text-green-600 dark:text-green-400' :
              error_rate < 0.1 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            )}>
              {(error_rate * 100).toFixed(1)}%
            </div>
          </div>

          {/* Calls Today */}
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Calls</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {calls_today.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last call: <span className="font-medium">{formatLastCall(last_call)}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Cost: <span className="font-medium text-gray-900 dark:text-white">${cost_today.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
