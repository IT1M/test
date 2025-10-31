'use client';

// Gemini API Analytics Component - Display API usage statistics
// Requirements: 7.5

import { useEffect, useState } from 'react';
import { db } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Activity, DollarSign, Clock, AlertCircle, TrendingUp } from 'lucide-react';

type TimePeriod = 'daily' | 'weekly' | 'monthly';

interface APIMetrics {
  totalCalls: number;
  tokenUsage: number;
  avgResponseTime: number;
  errorRate: number;
  estimatedCost: number;
}

interface ChartData {
  date: string;
  calls: number;
  errors: number;
  avgTime: number;
}

export default function GeminiAPIAnalytics() {
  const [period, setPeriod] = useState<TimePeriod>('daily');
  const [metrics, setMetrics] = useState<APIMetrics>({
    totalCalls: 0,
    tokenUsage: 0,
    avgResponseTime: 0,
    errorRate: 0,
    estimatedCost: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAPIAnalytics();
  }, [period]);

  const loadAPIAnalytics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate: Date;

      // Determine date range based on period
      switch (period) {
        case 'daily':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      // Get all Gemini API related logs
      const apiLogs = await db.systemLogs
        .where('action')
        .anyOf(['gemini_api_call', 'generateContent', 'analyzeImage'])
        .and(log => log.timestamp >= startDate)
        .toArray();

      // Calculate metrics
      const totalCalls = apiLogs.length;
      
      // Count errors
      const errorLogs = apiLogs.filter(log => log.status === 'error');
      const errorRate = totalCalls > 0 ? (errorLogs.length / totalCalls) * 100 : 0;

      // Calculate average response time from performance logs
      const perfLogs = await db.systemLogs
        .where('action')
        .equals('performance_metric')
        .and(log => 
          log.timestamp >= startDate && 
          log.details.includes('api_')
        )
        .toArray();

      const responseTimes = perfLogs.map(log => {
        try {
          const details = JSON.parse(log.details);
          return details.value || 0;
        } catch {
          return 0;
        }
      });

      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

      // Estimate token usage (rough estimation based on call count)
      // Assuming average of 500 tokens per call
      const tokenUsage = totalCalls * 500;

      // Estimate cost
      // Gemini Pro: $0.00025 per 1K input tokens, $0.0005 per 1K output tokens
      // Simplified: $0.000375 per 1K tokens average
      const estimatedCost = (tokenUsage / 1000) * 0.000375;

      setMetrics({
        totalCalls,
        tokenUsage,
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        estimatedCost: Math.round(estimatedCost * 100) / 100,
      });

      // Prepare chart data
      const chartDataMap = new Map<string, { calls: number; errors: number; times: number[] }>();

      apiLogs.forEach(log => {
        const date = new Date(log.timestamp);
        let dateKey: string;

        if (period === 'daily') {
          dateKey = `${date.getHours()}:00`;
        } else if (period === 'weekly') {
          dateKey = date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
          dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        if (!chartDataMap.has(dateKey)) {
          chartDataMap.set(dateKey, { calls: 0, errors: 0, times: [] });
        }

        const data = chartDataMap.get(dateKey)!;
        data.calls++;
        if (log.status === 'error') {
          data.errors++;
        }
      });

      // Add response times to chart data
      perfLogs.forEach(log => {
        const date = new Date(log.timestamp);
        let dateKey: string;

        if (period === 'daily') {
          dateKey = `${date.getHours()}:00`;
        } else if (period === 'weekly') {
          dateKey = date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
          dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        if (chartDataMap.has(dateKey)) {
          try {
            const details = JSON.parse(log.details);
            chartDataMap.get(dateKey)!.times.push(details.value || 0);
          } catch {
            // Ignore parse errors
          }
        }
      });

      const formattedChartData: ChartData[] = Array.from(chartDataMap.entries()).map(([date, data]) => ({
        date,
        calls: data.calls,
        errors: data.errors,
        avgTime: data.times.length > 0
          ? Math.round(data.times.reduce((sum, t) => sum + t, 0) / data.times.length)
          : 0,
      }));

      setChartData(formattedChartData);
    } catch (error) {
      console.error('Error loading API analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gemini API Analytics</h2>
        <Select value={period} onValueChange={(value) => setPeriod(value as TimePeriod)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Last 24 Hours</SelectItem>
            <SelectItem value="weekly">Last 7 Days</SelectItem>
            <SelectItem value="monthly">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total API Calls</p>
                <p className="text-2xl font-bold mt-1">
                  {loading ? '...' : metrics.totalCalls.toLocaleString()}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Token Usage</p>
                <p className="text-2xl font-bold mt-1">
                  {loading ? '...' : `${(metrics.tokenUsage / 1000).toFixed(1)}K`}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold mt-1">
                  {loading ? '...' : `${metrics.avgResponseTime}ms`}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold mt-1">
                  {loading ? '...' : `${metrics.errorRate}%`}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estimated Cost</p>
                <p className="text-2xl font-bold mt-1">
                  {loading ? '...' : `$${metrics.estimatedCost.toFixed(2)}`}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Calls Chart */}
      <Card>
        <CardHeader>
          <CardTitle>API Calls Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-500">Loading chart data...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-500">No data available for this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="calls" fill="#3b82f6" name="Total Calls" />
                <Bar dataKey="errors" fill="#ef4444" name="Errors" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Response Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Average Response Time</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-500">Loading chart data...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-500">No data available for this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgTime"
                  stroke="#10b981"
                  name="Avg Response Time (ms)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Input Tokens (estimated)</span>
              <span className="font-semibold">
                {(metrics.tokenUsage * 0.6 / 1000).toFixed(1)}K
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Output Tokens (estimated)</span>
              <span className="font-semibold">
                {(metrics.tokenUsage * 0.4 / 1000).toFixed(1)}K
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Input Cost ($0.00025/1K tokens)</span>
              <span className="font-semibold">
                ${((metrics.tokenUsage * 0.6 / 1000) * 0.00025).toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Output Cost ($0.0005/1K tokens)</span>
              <span className="font-semibold">
                ${((metrics.tokenUsage * 0.4 / 1000) * 0.0005).toFixed(4)}
              </span>
            </div>
            <div className="border-t pt-4 flex justify-between items-center">
              <span className="font-semibold">Total Estimated Cost</span>
              <span className="text-xl font-bold text-blue-600">
                ${metrics.estimatedCost.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Enable response caching to reduce redundant API calls and save costs
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Monitor error rate - high error rates may indicate API quota issues or network problems
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Consider implementing rate limiting if you're approaching API quotas
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Optimize prompts to reduce token usage while maintaining quality
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
