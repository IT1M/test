'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface RateLimitInfo {
  service: string;
  maxRequests: number;
  currentRequests: number;
  windowMs: number;
  resetTime: Date;
  queueLength: number;
}

/**
 * RateLimitStatus component
 * Displays current rate limit status for API services
 */
export function RateLimitStatus() {
  const [rateLimits, setRateLimits] = useState<RateLimitInfo[]>([
    {
      service: 'Gemini AI',
      maxRequests: 60,
      currentRequests: 0,
      windowMs: 60000,
      resetTime: new Date(Date.now() + 60000),
      queueLength: 0,
    },
  ]);

  useEffect(() => {
    // Update rate limit info every 5 seconds
    const interval = setInterval(() => {
      updateRateLimitInfo();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateRateLimitInfo = () => {
    // In a real implementation, this would fetch actual rate limit data
    // from the Gemini service or a rate limit tracking service
    setRateLimits(prev =>
      prev.map(limit => ({
        ...limit,
        // Simulate some usage
        currentRequests: Math.floor(Math.random() * limit.maxRequests),
        queueLength: Math.floor(Math.random() * 5),
      }))
    );
  };

  const getUsagePercentage = (current: number, max: number): number => {
    return (current / max) * 100;
  };

  const getStatusColor = (percentage: number): string => {
    if (percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage < 50) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (percentage < 80) return <Clock className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage < 50) return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
    if (percentage < 80) return <Badge className="bg-yellow-100 text-yellow-800">Moderate</Badge>;
    return <Badge className="bg-red-100 text-red-800">High Usage</Badge>;
  };

  const formatTimeRemaining = (resetTime: Date): string => {
    const now = new Date();
    const diff = resetTime.getTime() - now.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="space-y-4">
      {rateLimits.map((limit) => {
        const usagePercentage = getUsagePercentage(limit.currentRequests, limit.maxRequests);
        
        return (
          <Card key={limit.service}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  <CardTitle>{limit.service} Rate Limit</CardTitle>
                </div>
                {getStatusBadge(usagePercentage)}
              </div>
              <CardDescription>
                API request rate limiting and queue status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Usage Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Current Usage</span>
                  <span className={getStatusColor(usagePercentage)}>
                    {limit.currentRequests} / {limit.maxRequests} requests
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{usagePercentage.toFixed(1)}% used</span>
                  <span>{limit.maxRequests - limit.currentRequests} remaining</span>
                </div>
              </div>

              {/* Rate Limit Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Window Period</div>
                  <div className="text-sm font-medium">
                    {limit.windowMs / 1000} seconds
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Resets In</div>
                  <div className="text-sm font-medium">
                    {formatTimeRemaining(limit.resetTime)}
                  </div>
                </div>
              </div>

              {/* Queue Status */}
              {limit.queueLength > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium">
                      {limit.queueLength} request{limit.queueLength !== 1 ? 's' : ''} queued
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Requests are being queued due to rate limit. They will be processed automatically.
                  </p>
                </div>
              )}

              {/* Status Indicator */}
              <div className="flex items-center gap-2 pt-4 border-t">
                {getStatusIcon(usagePercentage)}
                <span className="text-sm">
                  {usagePercentage < 50 && 'Rate limit is healthy'}
                  {usagePercentage >= 50 && usagePercentage < 80 && 'Moderate API usage'}
                  {usagePercentage >= 80 && 'High API usage - requests may be queued'}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
