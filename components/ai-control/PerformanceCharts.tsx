'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartDataPoint {
  timestamp: string;
  response_time?: number;
  confidence?: number;
  error_rate?: number;
  cost?: number;
  calls?: number;
}

interface PerformanceChartsProps {
  responseTimeData: ChartDataPoint[];
  confidenceData: ChartDataPoint[];
  errorRateData: ChartDataPoint[];
  costTrendData: ChartDataPoint[];
}

export function PerformanceCharts({
  responseTimeData,
  confidenceData,
  errorRateData,
  costTrendData
}: PerformanceChartsProps) {
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Charts</CardTitle>
        <CardDescription>Real-time performance metrics visualization</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="response-time" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="response-time">Response Time</TabsTrigger>
            <TabsTrigger value="confidence">Confidence</TabsTrigger>
            <TabsTrigger value="error-rate">Error Rate</TabsTrigger>
            <TabsTrigger value="cost">Cost Trends</TabsTrigger>
          </TabsList>

          {/* Response Time Chart */}
          <TabsContent value="response-time" className="mt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={responseTimeData}>
                  <defs>
                    <linearGradient id="colorResponseTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                    className="text-xs text-gray-600 dark:text-gray-400"
                  />
                  <YAxis 
                    label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
                    className="text-xs text-gray-600 dark:text-gray-400"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="response_time"
                    name="Response Time (ms)"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorResponseTime)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400">Average</div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {responseTimeData.length > 0 
                    ? Math.round(responseTimeData.reduce((sum, d) => sum + (d.response_time || 0), 0) / responseTimeData.length)
                    : 0}ms
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400">Min</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {responseTimeData.length > 0 
                    ? Math.min(...responseTimeData.map(d => d.response_time || Infinity))
                    : 0}ms
                </div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400">Max</div>
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                  {responseTimeData.length > 0 
                    ? Math.max(...responseTimeData.map(d => d.response_time || 0))
                    : 0}ms
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Confidence Chart */}
          <TabsContent value="confidence" className="mt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={confidenceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                    className="text-xs text-gray-600 dark:text-gray-400"
                  />
                  <YAxis 
                    domain={[0, 1]}
                    label={{ value: 'Confidence Score', angle: -90, position: 'insideLeft' }}
                    className="text-xs text-gray-600 dark:text-gray-400"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    name="Confidence Score"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400">Average</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {confidenceData.length > 0 
                    ? (confidenceData.reduce((sum, d) => sum + (d.confidence || 0), 0) / confidenceData.length).toFixed(2)
                    : '0.00'}
                </div>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400">Above 0.8</div>
                <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {confidenceData.length > 0 
                    ? Math.round((confidenceData.filter(d => (d.confidence || 0) >= 0.8).length / confidenceData.length) * 100)
                    : 0}%
                </div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400">Trend</div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {confidenceData.length >= 2 && (confidenceData[confidenceData.length - 1].confidence || 0) > (confidenceData[0].confidence || 0)
                    ? '↑ Improving'
                    : '→ Stable'}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Error Rate Chart */}
          <TabsContent value="error-rate" className="mt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorRateData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                    className="text-xs text-gray-600 dark:text-gray-400"
                  />
                  <YAxis 
                    label={{ value: 'Error Rate (%)', angle: -90, position: 'insideLeft' }}
                    className="text-xs text-gray-600 dark:text-gray-400"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="error_rate"
                    name="Error Rate (%)"
                    fill="#ef4444"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400">Average</div>
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                  {errorRateData.length > 0 
                    ? (errorRateData.reduce((sum, d) => sum + (d.error_rate || 0), 0) / errorRateData.length).toFixed(2)
                    : '0.00'}%
                </div>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400">Peak</div>
                <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {errorRateData.length > 0 
                    ? Math.max(...errorRateData.map(d => d.error_rate || 0)).toFixed(2)
                    : '0.00'}%
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {errorRateData.length > 0 && (errorRateData[errorRateData.length - 1].error_rate || 0) < 5
                    ? '✓ Healthy'
                    : '⚠ Warning'}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Cost Trends Chart */}
          <TabsContent value="cost" className="mt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={costTrendData}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                    className="text-xs text-gray-600 dark:text-gray-400"
                  />
                  <YAxis 
                    label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }}
                    className="text-xs text-gray-600 dark:text-gray-400"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    name="Cost ($)"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorCost)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  ${costTrendData.length > 0 
                    ? costTrendData.reduce((sum, d) => sum + (d.cost || 0), 0).toFixed(2)
                    : '0.00'}
                </div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400">Avg per Hour</div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  ${costTrendData.length > 0 
                    ? (costTrendData.reduce((sum, d) => sum + (d.cost || 0), 0) / costTrendData.length).toFixed(2)
                    : '0.00'}
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400">Budget Used</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {costTrendData.length > 0 
                    ? ((costTrendData.reduce((sum, d) => sum + (d.cost || 0), 0) / 50) * 100).toFixed(1)
                    : '0.0'}%
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
