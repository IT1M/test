'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Permission, hasPermission } from '@/lib/auth/rbac';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIControlBreadcrumb, FloatingHelpButton } from '@/components/ai-control';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Settings,
  PieChart,
  BarChart3,
  Activity,
  Zap,
  Target,
  Lightbulb,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface CostData {
  period: {
    start: string;
    end: string;
  };
  total_cost: number;
  budget: number;
  budget_used_percent: number;
  projected_month_end: number;
  by_model: Array<{
    model_name: string;
    cost: number;
    calls: number;
    cost_per_call: number;
  }>;
  by_operation: Array<{
    operation_type: string;
    cost: number;
    calls: number;
  }>;
  daily_breakdown: Array<{
    date: string;
    cost: number;
    calls: number;
  }>;
}

interface CostOptimization {
  id: string;
  type: 'cache' | 'batch' | 'model' | 'threshold';
  title: string;
  description: string;
  potential_savings: number;
  savings_percent: number;
  priority: 'high' | 'medium' | 'low';
  implementation_effort: 'easy' | 'moderate' | 'complex';
}

interface CacheMetrics {
  hit_rate: number;
  miss_rate: number;
  total_requests: number;
  cache_hits: number;
  cache_misses: number;
  cost_saved: number;
  avg_response_time_cached: number;
  avg_response_time_uncached: number;
}

interface BudgetAlert {
  id: string;
  threshold: number;
  current_usage: number;
  status: 'ok' | 'warning' | 'critical';
  message: string;
}

interface ROIMetric {
  category: string;
  ai_cost: number;
  business_value: number;
  roi_percent: number;
  description: string;
}

export default function CostAnalyticsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);
  const [costData, setCostData] = useState<CostData | null>(null);
  const [optimizations, setOptimizations] = useState<CostOptimization[]>([]);
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetrics | null>(null);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const [roiMetrics, setROIMetrics] = useState<ROIMetric[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Check permissions
  useEffect(() => {
    if (!user || !hasPermission(user, Permission.ACCESS_AI_CONTROL_CENTER)) {
      router.push('/unauthorized');
    }
  }, [user, router]);

  // Fetch cost data
  const fetchCostData = useCallback(async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      const response = await fetch(
        `/api/ai-control/cost-analytics?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}&group_by=day`
      );
      
      if (response.ok) {
        const data = await response.json();
        setCostData(data);
      }
    } catch (error) {
      console.error('Failed to fetch cost data:', error);
    }
  }, [timeRange]);

  // Fetch optimization recommendations
  const fetchOptimizations = useCallback(async () => {
    try {
      // Mock data - in production, this would come from an API endpoint
      const mockOptimizations: CostOptimization[] = [
        {
          id: '1',
          type: 'cache',
          title: 'Increase cache duration for stable queries',
          description: 'Extend cache TTL from 1 hour to 4 hours for classification results with confidence > 0.9',
          potential_savings: 45.20,
          savings_percent: 12.5,
          priority: 'high',
          implementation_effort: 'easy'
        },
        {
          id: '2',
          type: 'batch',
          title: 'Enable batch processing for document analysis',
          description: 'Process multiple documents in a single API call to reduce overhead costs',
          potential_savings: 32.80,
          savings_percent: 9.1,
          priority: 'high',
          implementation_effort: 'moderate'
        },
        {
          id: '3',
          type: 'model',
          title: 'Use lighter model for simple classifications',
          description: 'Switch to gemini-pro-flash for basic document type detection (30% faster, 50% cheaper)',
          potential_savings: 67.50,
          savings_percent: 18.7,
          priority: 'medium',
          implementation_effort: 'moderate'
        },
        {
          id: '4',
          type: 'threshold',
          title: 'Optimize confidence thresholds',
          description: 'Reduce unnecessary re-processing by adjusting auto-approval threshold from 0.75 to 0.80',
          potential_savings: 23.40,
          savings_percent: 6.5,
          priority: 'low',
          implementation_effort: 'easy'
        }
      ];
      
      setOptimizations(mockOptimizations);
    } catch (error) {
      console.error('Failed to fetch optimizations:', error);
    }
  }, []);

  // Fetch cache metrics
  const fetchCacheMetrics = useCallback(async () => {
    try {
      // Mock data - in production, this would come from an API endpoint
      const mockCacheMetrics: CacheMetrics = {
        hit_rate: 0.68,
        miss_rate: 0.32,
        total_requests: 15234,
        cache_hits: 10359,
        cache_misses: 4875,
        cost_saved: 124.35,
        avg_response_time_cached: 45,
        avg_response_time_uncached: 340
      };
      
      setCacheMetrics(mockCacheMetrics);
    } catch (error) {
      console.error('Failed to fetch cache metrics:', error);
    }
  }, []);

  // Fetch budget alerts
  const fetchBudgetAlerts = useCallback(async () => {
    try {
      const mockAlerts: BudgetAlert[] = [
        {
          id: '1',
          threshold: 80,
          current_usage: 77.49,
          status: 'warning',
          message: 'Approaching 80% budget threshold'
        },
        {
          id: '2',
          threshold: 100,
          current_usage: 77.49,
          status: 'ok',
          message: 'Within budget limits'
        }
      ];
      
      setBudgetAlerts(mockAlerts);
    } catch (error) {
      console.error('Failed to fetch budget alerts:', error);
    }
  }, []);

  // Fetch ROI metrics
  const fetchROIMetrics = useCallback(async () => {
    try {
      const mockROI: ROIMetric[] = [
        {
          category: 'Document Classification',
          ai_cost: 145.20,
          business_value: 2340.00,
          roi_percent: 1511,
          description: 'Automated classification saves 40 hours/month of manual work'
        },
        {
          category: 'Medical Report Analysis',
          ai_cost: 89.50,
          business_value: 1560.00,
          roi_percent: 1643,
          description: 'Faster diagnosis and treatment recommendations'
        },
        {
          category: 'Demand Forecasting',
          ai_cost: 67.30,
          business_value: 4200.00,
          roi_percent: 6141,
          description: 'Reduced stockouts and overstock by 35%'
        },
        {
          category: 'Pricing Optimization',
          ai_cost: 45.80,
          business_value: 3100.00,
          roi_percent: 6668,
          description: 'Increased profit margins by 8%'
        }
      ];
      
      setROIMetrics(mockROI);
    } catch (error) {
      console.error('Failed to fetch ROI metrics:', error);
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      fetchCostData(),
      fetchOptimizations(),
      fetchCacheMetrics(),
      fetchBudgetAlerts(),
      fetchROIMetrics()
    ]);
    setIsLoading(false);
  }, [fetchCostData, fetchOptimizations, fetchCacheMetrics, fetchBudgetAlerts, fetchROIMetrics]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Format currency
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Get effort color
  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'complex':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Chart colors
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

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
                size="icon"
                onClick={() => router.push('/ai-control-center')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Cost & Performance Analytics
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Optimize AI spending and maximize ROI
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Time Range Selector */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <Button
                  variant={timeRange === '7d' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeRange('7d')}
                >
                  7 Days
                </Button>
                <Button
                  variant={timeRange === '30d' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeRange('30d')}
                >
                  30 Days
                </Button>
                <Button
                  variant={timeRange === '90d' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeRange('90d')}
                >
                  90 Days
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isLoading}
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
                Refresh
              </Button>

              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <AIControlBreadcrumb />

        {/* Budget Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Cost ({timeRange})</CardDescription>
              <CardTitle className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {costData ? formatCurrency(costData.total_cost) : '--'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <DollarSign className="w-4 h-4" />
                <span>Budget: {costData ? formatCurrency(costData.budget) : '--'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Budget Used</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {costData ? (
                  <span className={cn(
                    costData.budget_used_percent >= 90 ? 'text-red-600 dark:text-red-400' :
                    costData.budget_used_percent >= 75 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-green-600 dark:text-green-400'
                  )}>
                    {costData.budget_used_percent.toFixed(1)}%
                  </span>
                ) : '--'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    costData && costData.budget_used_percent >= 90 ? 'bg-red-600' :
                    costData && costData.budget_used_percent >= 75 ? 'bg-yellow-600' :
                    'bg-green-600'
                  )}
                  style={{ width: `${costData?.budget_used_percent || 0}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Projected Month End</CardDescription>
              <CardTitle className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {costData ? formatCurrency(costData.projected_month_end) : '--'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                {costData && costData.projected_month_end > costData.budget ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-red-600" />
                    <span className="text-red-600 dark:text-red-400">
                      Over budget by {formatCurrency(costData.projected_month_end - costData.budget)}
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 dark:text-green-400">
                      Under budget
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Potential Savings</CardDescription>
              <CardTitle className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(optimizations.reduce((sum, opt) => sum + opt.potential_savings, 0))}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Lightbulb className="w-4 h-4" />
                <span>{optimizations.length} recommendations</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Alerts */}
        {budgetAlerts.some(alert => alert.status !== 'ok') && (
          <Card className="mb-8 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <CardTitle className="text-yellow-900 dark:text-yellow-100">Budget Alerts</CardTitle>
                  <CardDescription className="text-yellow-700 dark:text-yellow-300">
                    Action may be required
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {budgetAlerts.filter(alert => alert.status !== 'ok').map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        alert.status === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                      )} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{alert.message}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Current: {alert.current_usage.toFixed(1)}% | Threshold: {alert.threshold}%
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="breakdown" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
            <TabsTrigger value="cache">Cache Metrics</TabsTrigger>
            <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
            <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
            <TabsTrigger value="comparison">Model Comparison</TabsTrigger>
          </TabsList>

          {/* Cost Breakdown Tab */}
          <TabsContent value="breakdown" className="space-y-6">
            {/* Daily Cost Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Cost Trend</CardTitle>
                <CardDescription>Cost and usage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={costData?.daily_breakdown || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="cost"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.6}
                      name="Cost ($)"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="calls"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      name="API Calls"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost by Model and Operation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Model */}
              <Card>
                <CardHeader>
                  <CardTitle>Cost by Model</CardTitle>
                  <CardDescription>Breakdown by AI model</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={costData?.by_model || []}
                        dataKey="cost"
                        nameKey="model_name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry: any) => `${entry.model_name}: $${entry.cost.toFixed(2)}`}
                      >
                        {costData?.by_model.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  
                  {/* Model Details */}
                  <div className="mt-4 space-y-2">
                    {costData?.by_model.map((model, index) => (
                      <div key={model.model_name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div>
                            <div className="font-medium text-sm text-gray-900 dark:text-white">
                              {model.model_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {model.calls.toLocaleString()} calls
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(model.cost)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ${model.cost_per_call.toFixed(4)}/call
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* By Operation */}
              <Card>
                <CardHeader>
                  <CardTitle>Cost by Operation</CardTitle>
                  <CardDescription>Breakdown by operation type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={costData?.by_operation || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="operation_type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cost" fill="#8b5cf6" name="Cost ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* Operation Details */}
                  <div className="mt-4 space-y-2">
                    {costData?.by_operation.map((operation) => (
                      <div key={operation.operation_type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white capitalize">
                            {operation.operation_type}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {operation.calls.toLocaleString()} calls
                          </div>
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(operation.cost)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cache Metrics Tab */}
          <TabsContent value="cache" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Cache Hit Rate</CardDescription>
                  <CardTitle className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {cacheMetrics ? `${(cacheMetrics.hit_rate * 100).toFixed(1)}%` : '--'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {cacheMetrics?.cache_hits.toLocaleString()} hits
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Cache Miss Rate</CardDescription>
                  <CardTitle className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {cacheMetrics ? `${(cacheMetrics.miss_rate * 100).toFixed(1)}%` : '--'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {cacheMetrics?.cache_misses.toLocaleString()} misses
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Cost Saved</CardDescription>
                  <CardTitle className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {cacheMetrics ? formatCurrency(cacheMetrics.cost_saved) : '--'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    From caching
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Speed Improvement</CardDescription>
                  <CardTitle className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {cacheMetrics ? `${((1 - cacheMetrics.avg_response_time_cached / cacheMetrics.avg_response_time_uncached) * 100).toFixed(0)}%` : '--'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Faster response
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Cache Performance Details</CardTitle>
                <CardDescription>Detailed cache effectiveness metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Hit/Miss Visualization */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Cache Distribution
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {cacheMetrics?.total_requests.toLocaleString()} total requests
                      </span>
                    </div>
                    <div className="flex h-8 rounded-lg overflow-hidden">
                      <div
                        className="bg-green-500 flex items-center justify-center text-white text-sm font-medium"
                        style={{ width: `${(cacheMetrics?.hit_rate || 0) * 100}%` }}
                      >
                        {cacheMetrics && cacheMetrics.hit_rate > 0.1 && `${(cacheMetrics.hit_rate * 100).toFixed(0)}% Hits`}
                      </div>
                      <div
                        className="bg-red-500 flex items-center justify-center text-white text-sm font-medium"
                        style={{ width: `${(cacheMetrics?.miss_rate || 0) * 100}%` }}
                      >
                        {cacheMetrics && cacheMetrics.miss_rate > 0.1 && `${(cacheMetrics.miss_rate * 100).toFixed(0)}% Misses`}
                      </div>
                    </div>
                  </div>

                  {/* Response Time Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="font-medium text-green-900 dark:text-green-100">Cached Requests</span>
                      </div>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {cacheMetrics?.avg_response_time_cached}ms
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Average response time
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <span className="font-medium text-red-900 dark:text-red-100">Uncached Requests</span>
                      </div>
                      <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {cacheMetrics?.avg_response_time_uncached}ms
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Average response time
                      </div>
                    </div>
                  </div>

                  {/* Savings Calculation */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                          Total Cost Savings from Caching
                        </div>
                        <div className="text-sm text-purple-700 dark:text-purple-300">
                          Based on {cacheMetrics?.cache_hits.toLocaleString()} cached responses
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {cacheMetrics ? formatCurrency(cacheMetrics.cost_saved) : '--'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Optimizations Tab */}
          <TabsContent value="optimizations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cost Optimization Recommendations</CardTitle>
                    <CardDescription>
                      AI-powered suggestions to reduce costs and improve efficiency
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {formatCurrency(optimizations.reduce((sum, opt) => sum + opt.potential_savings, 0))} potential savings
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {optimizations.map((optimization) => (
                    <div
                      key={optimization.id}
                      className="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {optimization.title}
                            </h3>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {optimization.description}
                          </p>
                          <div className="flex items-center gap-4">
                            <Badge className={getPriorityColor(optimization.priority)}>
                              {optimization.priority} priority
                            </Badge>
                            <Badge className={getEffortColor(optimization.implementation_effort)}>
                              {optimization.implementation_effort} effort
                            </Badge>
                            <Badge variant="outline">
                              {optimization.type}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                            {formatCurrency(optimization.potential_savings)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {optimization.savings_percent.toFixed(1)}% savings
                          </div>
                          <Button size="sm" className="w-full">
                            <Target className="w-4 h-4 mr-2" />
                            Implement
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Optimization Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>High Priority</CardDescription>
                  <CardTitle className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {optimizations.filter(o => o.priority === 'high').length}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(optimizations.filter(o => o.priority === 'high').reduce((sum, o) => sum + o.potential_savings, 0))} potential
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Easy Wins</CardDescription>
                  <CardTitle className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {optimizations.filter(o => o.implementation_effort === 'easy').length}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Quick implementations
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Potential</CardDescription>
                  <CardTitle className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {optimizations.reduce((sum, o) => sum + o.savings_percent, 0).toFixed(1)}%
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Cost reduction
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ROI Analysis Tab */}
          <TabsContent value="roi" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Return on Investment Analysis</CardTitle>
                <CardDescription>
                  Business value generated by AI investments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roiMetrics.map((metric, index) => (
                    <div
                      key={index}
                      className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {metric.category}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {metric.description}
                          </p>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">AI Cost</div>
                              <div className="text-xl font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(metric.ai_cost)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Business Value</div>
                              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(metric.business_value)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">ROI</div>
                              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                                {metric.roi_percent.toFixed(0)}%
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                            {(metric.business_value / metric.ai_cost).toFixed(1)}x
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Return Multiple
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ROI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total AI Investment</CardDescription>
                  <CardTitle className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(roiMetrics.reduce((sum, m) => sum + m.ai_cost, 0))}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Current period
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Business Value</CardDescription>
                  <CardTitle className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(roiMetrics.reduce((sum, m) => sum + m.business_value, 0))}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Generated value
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Average ROI</CardDescription>
                  <CardTitle className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {(roiMetrics.reduce((sum, m) => sum + m.roi_percent, 0) / roiMetrics.length).toFixed(0)}%
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Across all categories
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ROI Chart */}
            <Card>
              <CardHeader>
                <CardTitle>ROI Comparison by Category</CardTitle>
                <CardDescription>Visual comparison of return on investment</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={roiMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="ai_cost" fill="#ef4444" name="AI Cost ($)" />
                    <Bar dataKey="business_value" fill="#10b981" name="Business Value ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Model Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Efficiency Comparison</CardTitle>
                <CardDescription>
                  Compare cost, accuracy, and speed across different AI models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                          Model
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                          Total Cost
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                          Cost/Call
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                          Avg Confidence
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                          Avg Speed
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                          Total Calls
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                          Efficiency Score
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {costData?.by_model.map((model, index) => {
                        // Calculate efficiency score (higher confidence, lower cost, faster speed = better)
                        const avgConfidence = 0.85; // Mock - would come from API
                        const avgSpeed = 250; // Mock - would come from API
                        const efficiencyScore = (avgConfidence * 100) - (model.cost_per_call * 1000) - (avgSpeed / 10);
                        
                        return (
                          <tr
                            key={model.model_name}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {model.model_name}
                                </span>
                              </div>
                            </td>
                            <td className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(model.cost)}
                            </td>
                            <td className="text-center py-4 px-4 text-gray-600 dark:text-gray-400">
                              ${model.cost_per_call.toFixed(4)}
                            </td>
                            <td className="text-center py-4 px-4">
                              <Badge className={cn(
                                avgConfidence >= 0.8 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                avgConfidence >= 0.6 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              )}>
                                {avgConfidence.toFixed(2)}
                              </Badge>
                            </td>
                            <td className="text-center py-4 px-4">
                              <Badge className={cn(
                                avgSpeed < 200 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                avgSpeed < 500 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              )}>
                                {avgSpeed}ms
                              </Badge>
                            </td>
                            <td className="text-center py-4 px-4 text-gray-600 dark:text-gray-400">
                              {model.calls.toLocaleString()}
                            </td>
                            <td className="text-center py-4 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className={cn(
                                      'h-2 rounded-full',
                                      efficiencyScore >= 70 ? 'bg-green-500' :
                                      efficiencyScore >= 50 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    )}
                                    style={{ width: `${Math.min(100, Math.max(0, efficiencyScore))}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {efficiencyScore.toFixed(0)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Model Recommendations */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <CardTitle className="text-blue-900 dark:text-blue-100">
                      Model Selection Recommendations
                    </CardTitle>
                    <CardDescription className="text-blue-700 dark:text-blue-300">
                      Optimize your model usage based on use case
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white mb-1">
                          High-accuracy tasks
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Use <strong>gemini-pro</strong> for medical report analysis and critical classifications
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white mb-1">
                          Speed-critical tasks
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Use <strong>gemini-pro-flash</strong> for simple document type detection and quick classifications
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white mb-1">
                          Cost-sensitive tasks
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Enable caching and batch processing for repetitive operations
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Help Button */}
      <FloatingHelpButton />
    </div>
  );
}
