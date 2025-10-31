'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Package, 
  DollarSign,
  Factory,
  Users
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { getRejections, getRejectionStats } from '@/services/database/rejections';
import { getProducts } from '@/services/database/products';
import type { Rejection } from '@/types/database';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

export default function QualityAnalyticsPage() {
  const [rejections, setRejections] = useState<Rejection[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // days
  const [chartData, setChartData] = useState<any>({
    byProduct: [],
    byType: [],
    bySeverity: [],
    byMachine: [],
    trend: [],
    pareto: [],
  });

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const days = parseInt(period);
      const startDate = subDays(new Date(), days);
      const endDate = new Date();

      const [rejectionsData, statsData, products] = await Promise.all([
        getRejections({ startDate, endDate }),
        getRejectionStats(startDate, endDate),
        getProducts(),
      ]);

      setRejections(rejectionsData);
      setStats(statsData);

      // Process data for charts
      processChartData(rejectionsData, products);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (rejections: Rejection[], products: any[]) => {
    // Rejection by product
    const byProduct: Record<string, { name: string; count: number; cost: number }> = {};
    rejections.forEach(r => {
      const product = products.find(p => p.id === r.productId);
      const productName = product?.name || r.itemCode;
      
      if (!byProduct[productName]) {
        byProduct[productName] = { name: productName, count: 0, cost: 0 };
      }
      byProduct[productName].count += 1;
      byProduct[productName].cost += r.costImpact;
    });

    const byProductData = Object.values(byProduct)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Rejection by type
    const byType = Object.entries(stats?.byType || {}).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count as number,
    }));

    // Rejection by severity
    const bySeverity = Object.entries(stats?.bySeverity || {}).map(([severity, count]) => ({
      name: severity.charAt(0).toUpperCase() + severity.slice(1),
      value: count as number,
    }));

    // Rejection by machine
    const byMachine: Record<string, number> = {};
    rejections.forEach(r => {
      if (r.machineName) {
        byMachine[r.machineName] = (byMachine[r.machineName] || 0) + 1;
      }
    });

    const byMachineData = Object.entries(byMachine)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Trend over time
    const trendMap: Record<string, number> = {};
    rejections.forEach(r => {
      const date = format(new Date(r.rejectionDate), 'MMM dd');
      trendMap[date] = (trendMap[date] || 0) + 1;
    });

    const trendData = Object.entries(trendMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Pareto chart (top rejection reasons)
    const reasonMap: Record<string, { count: number; cost: number }> = {};
    rejections.forEach(r => {
      if (!reasonMap[r.rejectionReason]) {
        reasonMap[r.rejectionReason] = { count: 0, cost: 0 };
      }
      reasonMap[r.rejectionReason].count += 1;
      reasonMap[r.rejectionReason].cost += r.costImpact;
    });

    const paretoData = Object.entries(reasonMap)
      .map(([reason, data]) => ({
        reason: reason.length > 30 ? reason.substring(0, 30) + '...' : reason,
        count: data.count,
        cost: data.cost,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate cumulative percentage for Pareto
    const totalCount = paretoData.reduce((sum, item) => sum + item.count, 0);
    let cumulative = 0;
    const paretoWithCumulative = paretoData.map(item => {
      cumulative += item.count;
      return {
        ...item,
        cumulative: (cumulative / totalCount) * 100,
      };
    });

    setChartData({
      byProduct: byProductData,
      byType,
      bySeverity,
      byMachine: byMachineData,
      trend: trendData,
      pareto: paretoWithCumulative,
    });
  };

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quality Analytics</h1>
          <p className="text-gray-600 mt-1">Rejection metrics and trends</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Rejections</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRejections}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalQuantity} units rejected
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejection Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejectionRate.toFixed(1)}%</p>
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  vs inspections
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cost Impact</p>
                <p className="text-2xl font-bold text-red-600">
                  ${stats.totalCostImpact.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ${(stats.totalCostImpact / stats.totalRejections).toFixed(2)} avg
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Issues</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.bySeverity?.critical || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.bySeverity?.high || 0} high severity
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pareto Chart - Top Rejection Reasons */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Top Rejection Reasons (Pareto)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.pareto}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="reason" angle={-45} textAnchor="end" height={100} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Count" />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="cumulative" 
                stroke="#ef4444" 
                name="Cumulative %" 
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Rejection Trend */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Rejection Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Rejections"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rejection by Type */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Rejection by Type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.byType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.byType.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Rejection by Severity */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Rejection by Severity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.bySeverity}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.bySeverity.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products by Rejection */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Top Products by Rejection</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.byProduct} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#ef4444" name="Rejections" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Machines by Rejection */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Top Machines by Rejection</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.byMachine} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#f97316" name="Rejections" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Supplier Quality Scorecard */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Supplier Quality Scorecard</h2>
        <div className="text-center text-gray-500 py-8">
          <Factory className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Supplier scorecard coming soon</p>
          <p className="text-sm">Track supplier quality metrics and performance</p>
        </div>
      </Card>
    </div>
  );
}
