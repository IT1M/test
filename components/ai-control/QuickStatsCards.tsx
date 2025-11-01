'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Zap,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface QuickStat {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description?: string;
}

interface QuickStatsCardsProps {
  systemHealth: number;
  throughput24h: number;
  avgConfidence: number;
  costToday: number;
  activeModels: number;
  errorRate: number;
  avgResponseTime: number;
  successRate: number;
}

export function QuickStatsCards({
  systemHealth,
  throughput24h,
  avgConfidence,
  costToday,
  activeModels,
  errorRate,
  avgResponseTime,
  successRate
}: QuickStatsCardsProps) {
  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Get trend indicator
  const TrendIndicator = ({ change }: { change?: number }) => {
    if (!change) return null;
    
    const isPositive = change > 0;
    return (
      <div className={cn(
        'flex items-center gap-1 text-sm font-medium',
        isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      )}>
        {isPositive ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
        <span>{Math.abs(change).toFixed(1)}%</span>
      </div>
    );
  };

  // Define stats
  const stats: QuickStat[] = [
    {
      label: 'System Health',
      value: `${systemHealth}%`,
      change: 2.5,
      changeLabel: 'vs yesterday',
      icon: <Activity className="w-6 h-6" />,
      color: systemHealth >= 90 ? 'text-green-600 dark:text-green-400' : 
             systemHealth >= 70 ? 'text-yellow-600 dark:text-yellow-400' : 
             'text-red-600 dark:text-red-400',
      bgColor: systemHealth >= 90 ? 'bg-green-50 dark:bg-green-900/20' : 
               systemHealth >= 70 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 
               'bg-red-50 dark:bg-red-900/20',
      description: `${activeModels} models active`
    },
    {
      label: 'Throughput (24h)',
      value: formatNumber(throughput24h),
      change: 12.3,
      changeLabel: 'vs yesterday',
      icon: <Zap className="w-6 h-6" />,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      description: 'Total API calls'
    },
    {
      label: 'Avg Confidence',
      value: avgConfidence.toFixed(2),
      change: 1.8,
      changeLabel: 'vs yesterday',
      icon: <BarChart3 className="w-6 h-6" />,
      color: avgConfidence >= 0.8 ? 'text-green-600 dark:text-green-400' : 
             avgConfidence >= 0.6 ? 'text-yellow-600 dark:text-yellow-400' : 
             'text-red-600 dark:text-red-400',
      bgColor: avgConfidence >= 0.8 ? 'bg-green-50 dark:bg-green-900/20' : 
               avgConfidence >= 0.6 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 
               'bg-red-50 dark:bg-red-900/20',
      description: 'Across all models'
    },
    {
      label: 'Cost Today',
      value: `$${costToday.toFixed(2)}`,
      change: -5.2,
      changeLabel: 'vs yesterday',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      description: 'Budget: $50.00'
    },
    {
      label: 'Success Rate',
      value: `${(successRate * 100).toFixed(1)}%`,
      change: 0.5,
      changeLabel: 'vs yesterday',
      icon: <CheckCircle className="w-6 h-6" />,
      color: successRate >= 0.95 ? 'text-green-600 dark:text-green-400' : 
             successRate >= 0.85 ? 'text-yellow-600 dark:text-yellow-400' : 
             'text-red-600 dark:text-red-400',
      bgColor: successRate >= 0.95 ? 'bg-green-50 dark:bg-green-900/20' : 
               successRate >= 0.85 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 
               'bg-red-50 dark:bg-red-900/20',
      description: 'Last 24 hours'
    },
    {
      label: 'Error Rate',
      value: `${(errorRate * 100).toFixed(2)}%`,
      change: -1.2,
      changeLabel: 'vs yesterday',
      icon: <AlertTriangle className="w-6 h-6" />,
      color: errorRate < 0.05 ? 'text-green-600 dark:text-green-400' : 
             errorRate < 0.1 ? 'text-yellow-600 dark:text-yellow-400' : 
             'text-red-600 dark:text-red-400',
      bgColor: errorRate < 0.05 ? 'bg-green-50 dark:bg-green-900/20' : 
               errorRate < 0.1 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 
               'bg-red-50 dark:bg-red-900/20',
      description: 'Last 24 hours'
    },
    {
      label: 'Avg Response',
      value: `${avgResponseTime}ms`,
      change: -8.5,
      changeLabel: 'vs yesterday',
      icon: <Clock className="w-6 h-6" />,
      color: avgResponseTime < 500 ? 'text-green-600 dark:text-green-400' : 
             avgResponseTime < 1000 ? 'text-yellow-600 dark:text-yellow-400' : 
             'text-red-600 dark:text-red-400',
      bgColor: avgResponseTime < 500 ? 'bg-green-50 dark:bg-green-900/20' : 
               avgResponseTime < 1000 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 
               'bg-red-50 dark:bg-red-900/20',
      description: 'Across all models'
    },
    {
      label: 'Active Models',
      value: activeModels,
      icon: <Activity className="w-6 h-6" />,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      description: 'Currently running'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card 
          key={index}
          className="hover:shadow-lg transition-shadow"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">
                {stat.label}
              </CardDescription>
              <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                <span className={stat.color}>{stat.icon}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Main Value */}
              <div className={cn('text-3xl font-bold', stat.color)}>
                {stat.value}
              </div>

              {/* Trend and Description */}
              <div className="flex items-center justify-between">
                {stat.change !== undefined ? (
                  <TrendIndicator change={stat.change} />
                ) : (
                  <div />
                )}
                {stat.description && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.description}
                  </span>
                )}
              </div>

              {/* Change Label */}
              {stat.changeLabel && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.changeLabel}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
