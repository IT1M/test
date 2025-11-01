'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface MetricData {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  avg_confidence: number;
  avg_response_time: number;
  total_cost: number;
  error_rate: number;
  change_percent?: number;
}

interface ActivityMetricsProps {
  metrics_24h: MetricData;
  metrics_7d: MetricData;
  metrics_30d: MetricData;
}

export function ActivityMetrics({ metrics_24h, metrics_7d, metrics_30d }: ActivityMetricsProps) {
  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Get trend indicator
  const getTrendIndicator = (change?: number) => {
    if (!change) return { icon: <Minus className="w-4 h-4" />, color: 'text-gray-500', text: 'No change' };
    
    if (change > 0) {
      return {
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'text-green-600 dark:text-green-400',
        text: `+${change.toFixed(1)}%`
      };
    }
    
    return {
      icon: <TrendingDown className="w-4 h-4" />,
      color: 'text-red-600 dark:text-red-400',
      text: `${change.toFixed(1)}%`
    };
  };

  // Render metric card
  const MetricCard = ({ 
    label, 
    value, 
    change, 
    format = 'number',
    colorThreshold 
  }: { 
    label: string; 
    value: number; 
    change?: number; 
    format?: 'number' | 'currency' | 'percentage' | 'time';
    colorThreshold?: { good: number; warning: number };
  }) => {
    const trend = getTrendIndicator(change);
    
    // Format value based on type
    const formatValue = () => {
      switch (format) {
        case 'currency':
          return `$${value.toFixed(2)}`;
        case 'percentage':
          return `${(value * 100).toFixed(1)}%`;
        case 'time':
          return `${value.toFixed(0)}ms`;
        default:
          return formatNumber(value);
      }
    };

    // Determine value color based on threshold
    const getValueColor = () => {
      if (!colorThreshold) return 'text-gray-900 dark:text-white';
      
      if (value >= colorThreshold.good) return 'text-green-600 dark:text-green-400';
      if (value >= colorThreshold.warning) return 'text-yellow-600 dark:text-yellow-400';
      return 'text-red-600 dark:text-red-400';
    };

    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{label}</div>
        <div className={cn('text-2xl font-bold mb-1', getValueColor())}>
          {formatValue()}
        </div>
        {change !== undefined && (
          <div className={cn('flex items-center gap-1 text-sm', trend.color)}>
            {trend.icon}
            <span>{trend.text}</span>
          </div>
        )}
      </div>
    );
  };

  // Render metrics for a time period
  const MetricsGrid = ({ metrics }: { metrics: MetricData }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard 
        label="Total Calls" 
        value={metrics.total_calls} 
        change={metrics.change_percent}
      />
      <MetricCard 
        label="Success Rate" 
        value={metrics.successful_calls / metrics.total_calls}
        format="percentage"
        colorThreshold={{ good: 0.95, warning: 0.85 }}
      />
      <MetricCard 
        label="Avg Confidence" 
        value={metrics.avg_confidence}
        colorThreshold={{ good: 0.8, warning: 0.6 }}
      />
      <MetricCard 
        label="Avg Response" 
        value={metrics.avg_response_time}
        format="time"
      />
      <MetricCard 
        label="Total Cost" 
        value={metrics.total_cost}
        format="currency"
      />
      <MetricCard 
        label="Error Rate" 
        value={metrics.error_rate}
        format="percentage"
      />
      <MetricCard 
        label="Successful" 
        value={metrics.successful_calls}
      />
      <MetricCard 
        label="Failed" 
        value={metrics.failed_calls}
      />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Metrics</CardTitle>
        <CardDescription>Cumulative statistics across different time periods</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="24h" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="24h">24 Hours</TabsTrigger>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
          </TabsList>
          
          <TabsContent value="24h" className="mt-6">
            <MetricsGrid metrics={metrics_24h} />
          </TabsContent>
          
          <TabsContent value="7d" className="mt-6">
            <MetricsGrid metrics={metrics_7d} />
          </TabsContent>
          
          <TabsContent value="30d" className="mt-6">
            <MetricsGrid metrics={metrics_30d} />
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Daily Average</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatNumber(metrics_30d.total_calls / 30)}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">calls per day</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400 mb-1">Overall Success</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {((metrics_30d.successful_calls / metrics_30d.total_calls) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">last 30 days</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Monthly Cost</div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                ${metrics_30d.total_cost.toFixed(2)}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">last 30 days</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
