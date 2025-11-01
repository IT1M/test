'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useEffect, useState } from 'react';

interface RateLimitData {
  model_name: string;
  requests_per_minute: {
    limit: number;
    used: number;
    remaining: number;
    reset_at: string;
  };
  requests_per_hour: {
    limit: number;
    used: number;
    remaining: number;
    reset_at: string;
  };
  daily_quota: {
    limit: number;
    used: number;
    remaining: number;
    reset_at: string;
  };
}

interface RateLimitIndicatorProps {
  rateLimits: RateLimitData[];
}

export function RateLimitIndicator({ rateLimits }: RateLimitIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate time remaining until reset
  const getTimeRemaining = (resetAt: string): string => {
    const resetTime = new Date(resetAt);
    const diffMs = resetTime.getTime() - currentTime.getTime();
    
    if (diffMs <= 0) return 'Resetting...';
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    }
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs % 60}s`;
    }
    return `${diffSecs}s`;
  };

  // Get status color based on usage percentage
  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return {
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      progressColor: 'bg-red-500',
      icon: <AlertTriangle className="w-4 h-4" />
    };
    if (percentage >= 70) return {
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      progressColor: 'bg-yellow-500',
      icon: <AlertTriangle className="w-4 h-4" />
    };
    return {
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      progressColor: 'bg-green-500',
      icon: <CheckCircle className="w-4 h-4" />
    };
  };

  // Render rate limit card
  const RateLimitCard = ({ 
    label, 
    limit, 
    used, 
    remaining, 
    resetAt,
    icon 
  }: { 
    label: string; 
    limit: number; 
    used: number; 
    remaining: number; 
    resetAt: string;
    icon: React.ReactNode;
  }) => {
    const percentage = (used / limit) * 100;
    const status = getStatusColor(percentage);

    return (
      <div className={cn('p-4 rounded-lg border', status.bgColor)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={status.color}>{icon}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
          </div>
          <Badge variant="outline" className={cn('text-xs', status.color)}>
            {percentage.toFixed(0)}%
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <Progress 
            value={percentage} 
            className="h-2"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-gray-500 dark:text-gray-400">Used</div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {used.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">Remaining</div>
            <div className={cn('font-semibold', status.color)}>
              {remaining.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">Limit</div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {limit.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Resets in
            </span>
            <span className="font-mono font-semibold text-gray-900 dark:text-white">
              {getTimeRemaining(resetAt)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Rate Limits
            </CardTitle>
            <CardDescription>API usage and quota monitoring</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {rateLimits.length} Models
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {rateLimits.map((rateLimit) => (
            <div key={rateLimit.model_name} className="space-y-4">
              {/* Model Header */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {rateLimit.model_name}
                </h3>
                {/* Overall Status */}
                {(() => {
                  const overallPercentage = Math.max(
                    (rateLimit.requests_per_minute.used / rateLimit.requests_per_minute.limit) * 100,
                    (rateLimit.requests_per_hour.used / rateLimit.requests_per_hour.limit) * 100,
                    (rateLimit.daily_quota.used / rateLimit.daily_quota.limit) * 100
                  );
                  const status = getStatusColor(overallPercentage);
                  return (
                    <div className={cn('flex items-center gap-2 px-3 py-1 rounded-full', status.bgColor)}>
                      <span className={status.color}>{status.icon}</span>
                      <span className={cn('text-xs font-medium', status.color)}>
                        {overallPercentage >= 90 ? 'Critical' : overallPercentage >= 70 ? 'Warning' : 'Healthy'}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Rate Limit Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RateLimitCard
                  label="Per Minute"
                  limit={rateLimit.requests_per_minute.limit}
                  used={rateLimit.requests_per_minute.used}
                  remaining={rateLimit.requests_per_minute.remaining}
                  resetAt={rateLimit.requests_per_minute.reset_at}
                  icon={<Zap className="w-4 h-4" />}
                />
                <RateLimitCard
                  label="Per Hour"
                  limit={rateLimit.requests_per_hour.limit}
                  used={rateLimit.requests_per_hour.used}
                  remaining={rateLimit.requests_per_hour.remaining}
                  resetAt={rateLimit.requests_per_hour.reset_at}
                  icon={<Clock className="w-4 h-4" />}
                />
                <RateLimitCard
                  label="Daily Quota"
                  limit={rateLimit.daily_quota.limit}
                  used={rateLimit.daily_quota.used}
                  remaining={rateLimit.daily_quota.remaining}
                  resetAt={rateLimit.daily_quota.reset_at}
                  icon={<CheckCircle className="w-4 h-4" />}
                />
              </div>
            </div>
          ))}

          {rateLimits.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No rate limit data available</p>
            </div>
          )}
        </div>

        {/* Summary */}
        {rateLimits.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Requests Today</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {rateLimits.reduce((sum, rl) => sum + rl.daily_quota.used, 0).toLocaleString()}
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-xs text-green-600 dark:text-green-400 mb-1">Remaining Today</div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {rateLimits.reduce((sum, rl) => sum + rl.daily_quota.remaining, 0).toLocaleString()}
                </div>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">Avg Usage</div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {rateLimits.length > 0 
                    ? ((rateLimits.reduce((sum, rl) => sum + (rl.daily_quota.used / rl.daily_quota.limit), 0) / rateLimits.length) * 100).toFixed(0)
                    : 0}%
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
