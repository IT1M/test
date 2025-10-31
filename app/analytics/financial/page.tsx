'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar,
  Download
} from 'lucide-react';
import { FinancialAnalyticsService } from '@/services/analytics/financial';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/utils/formatters';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type Period = 'monthly' | 'quarterly' | 'yearly';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function FinancialAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('monthly');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFinancialData();
  }, [period]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = getDateRange(period);

      const [
        metrics,
        revenueBreakdown,
        kpis,
        cashFlowProjection,
        revenueTrend,
      ] = await Promise.all([
        FinancialAnalyticsService.getFinancialMetrics(startDate, endDate),
        FinancialAnalyticsService.getRevenueBreakdown(startDate, endDate),
        FinancialAnalyticsService.getKPIs(startDate, endDate),
        FinancialAnalyticsService.getCashFlowProjection(90),
        FinancialAnalyticsService.getRevenueTrend(startDate, endDate, 'daily'),
      ]);

      setData({
        metrics,
        revenueBreakdown,
        kpis,
        cashFlowProjection,
        revenueTrend,
      });
    } catch (err) {
      console.error('Error loading financial data:', err);
      setError('Failed to load financial analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (period: Period): { startDate: Date; endDate: Date } => {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'yearly':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading financial analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadFinancialData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive financial performance and insights</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Key Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <h3 className="text-2xl font-bold mt-2">
                    {formatCurrency(data.metrics.revenue)}
                  </h3>
                  <div className="flex items-center mt-2">
                    {data.metrics.revenueGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      data.metrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(Math.abs(data.metrics.revenueGrowth / 100))}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gross Profit</p>
                  <h3 className="text-2xl font-bold mt-2 text-green-600">
                    {formatCurrency(data.metrics.grossProfit)}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Margin: {formatPercentage(data.metrics.profitMargin / 100)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Profit</p>
                  <h3 className="text-2xl font-bold mt-2 text-green-600">
                    {formatCurrency(data.metrics.netProfit)}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">
                    After expenses
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                  <h3 className="text-2xl font-bold mt-2">
                    {formatPercentage(data.metrics.profitMargin / 100)}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Net margin
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <PieChart className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Trend Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Revenue & Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Profit"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Cost of Goods Sold (COGS)</span>
                    <span className="text-sm font-bold">{formatCurrency(data.metrics.cogs)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ 
                        width: `${(data.metrics.cogs / data.metrics.revenue) * 100}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPercentage((data.metrics.cogs / data.metrics.revenue))} of revenue
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Operating Expenses</span>
                    <span className="text-sm font-bold">
                      {formatCurrency(data.metrics.operatingExpenses)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full"
                      style={{ 
                        width: `${(data.metrics.operatingExpenses / data.metrics.revenue) * 100}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPercentage((data.metrics.operatingExpenses / data.metrics.revenue))} of revenue
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cost Per Order</span>
                    <span className="text-sm font-bold">
                      {formatCurrency(data.metrics.costPerOrder)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie
                    data={data.revenueBreakdown.byCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.category}: ${formatPercentage(entry.percentage / 100)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {data.revenueBreakdown.byCategory.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Customer Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.revenueBreakdown.byCustomerType.map((item: any) => (
                  <div key={item.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{item.type}</span>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(item.revenue)} ({formatPercentage(item.percentage / 100)})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Sales Person</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.revenueBreakdown.bySalesPerson.map((item: any) => (
                  <div key={item.salesPerson}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.salesPerson}</span>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(item.revenue)} ({formatPercentage(item.percentage / 100)})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Performance Indicators */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Key Performance Indicators (KPIs)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Inventory Turnover</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatNumber(data.kpis.inventoryTurnover, 2)}x
                </p>
                <p className="text-xs text-gray-500 mt-1">Times per period</p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Days Sales Outstanding</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatNumber(data.kpis.dso, 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Days</p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Order Fulfillment Rate</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatPercentage(data.kpis.orderFulfillmentRate / 100)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Completed on time</p>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Customer Acquisition Cost</p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatCurrency(data.kpis.customerAcquisitionCost)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per customer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Projection */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.cashFlowProjection.map((projection: any) => (
                <div key={projection.period} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">{projection.period}</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Expected Inflow</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(projection.expectedInflow)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Expected Outflow</span>
                      <span className="text-sm font-medium text-red-600">
                        {formatCurrency(projection.expectedOutflow)}
                      </span>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Net Cash Flow</span>
                        <span className={`text-sm font-bold ${
                          projection.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(projection.netCashFlow)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
