'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { FinancialAnalyticsService } from '@/services/analytics/financial';
import { SalesAnalyticsService } from '@/services/analytics/sales';
import { InventoryAnalyticsService } from '@/services/analytics/inventory';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/formatters';

type Period = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  trend?: 'up' | 'down';
  icon: React.ReactNode;
  description?: string;
}

function MetricCard({ title, value, change, trend, icon, description }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>
            {change !== undefined && (
              <div className="flex items-center mt-2">
                {trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(Math.abs(change))}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs previous period</span>
              </div>
            )}
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          <div className="ml-4 p-3 bg-blue-50 rounded-lg">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('monthly');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = getDateRange(period);

      // Load all analytics data
      const [
        financialMetrics,
        revenueBreakdown,
        kpis,
        topProducts,
        salesByCustomer,
        salesPipeline,
        inventoryValuation,
        inventoryHealth,
      ] = await Promise.all([
        FinancialAnalyticsService.getFinancialMetrics(startDate, endDate),
        FinancialAnalyticsService.getRevenueBreakdown(startDate, endDate),
        FinancialAnalyticsService.getKPIs(startDate, endDate),
        SalesAnalyticsService.getTopProducts(startDate, endDate, 5),
        SalesAnalyticsService.getSalesByCustomer(startDate, endDate, 5),
        SalesAnalyticsService.getSalesPipeline(),
        InventoryAnalyticsService.getInventoryValuation(),
        InventoryAnalyticsService.getInventoryHealthScore(),
      ]);

      setMetrics({
        financial: financialMetrics,
        revenueBreakdown,
        kpis,
        topProducts,
        salesByCustomer,
        salesPipeline,
        inventoryValuation,
        inventoryHealth,
      });
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (period: Period): { startDate: Date; endDate: Date } => {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'daily':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
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
          <p className="mt-4 text-gray-600">Loading analytics...</p>
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
            onClick={loadAnalytics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive business analytics and insights</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(metrics.financial.revenue)}
            change={metrics.financial.revenueGrowth}
            trend={metrics.financial.revenueGrowth >= 0 ? 'up' : 'down'}
            icon={<DollarSign className="w-6 h-6 text-blue-600" />}
          />
          
          <MetricCard
            title="Gross Profit"
            value={formatCurrency(metrics.financial.grossProfit)}
            description={`Margin: ${formatPercentage(metrics.financial.profitMargin)}`}
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          />
          
          <MetricCard
            title="Average Order Value"
            value={formatCurrency(metrics.kpis.averageOrderValue)}
            icon={<ShoppingCart className="w-6 h-6 text-purple-600" />}
          />
          
          <MetricCard
            title="Inventory Value"
            value={formatCurrency(metrics.inventoryValuation.totalValue)}
            description={`Health Score: ${metrics.inventoryHealth.score}/100`}
            icon={<Package className="w-6 h-6 text-orange-600" />}
          />
        </div>

        {/* Tabs for Different Analytics Views */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-lg shadow-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPIs Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Inventory Turnover
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatNumber(metrics.kpis.inventoryTurnover, 2)}x
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Times per period</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Days Sales Outstanding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatNumber(metrics.kpis.dso, 0)} days
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Average collection time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Order Fulfillment Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatPercentage(metrics.kpis.orderFulfillmentRate)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Orders completed on time</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Products and Customers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.topProducts.map((product: any, index: number) => (
                      <div key={product.productId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{product.productName}</p>
                            <p className="text-sm text-gray-500">{product.sku}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(product.revenue)}</p>
                          <p className="text-sm text-gray-500">{formatNumber(product.salesVolume)} units</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.salesByCustomer.map((customer: any, index: number) => (
                      <div key={customer.customerId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-green-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{customer.customerName}</p>
                            <p className="text-sm text-gray-500">{customer.orderCount} orders</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(customer.revenue)}</p>
                          <p className="text-sm text-gray-500">
                            Avg: {formatCurrency(customer.averageOrderValue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sales Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Quotations</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {metrics.salesPipeline.quotations.count}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(metrics.salesPipeline.quotations.value)}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Pending Orders</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {metrics.salesPipeline.pendingOrders.count}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(metrics.salesPipeline.pendingOrders.value)}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Expected Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(metrics.salesPipeline.expectedRevenue)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Conversion: {formatPercentage(metrics.salesPipeline.conversionRate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.financial.revenue)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cost of Goods Sold</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.financial.cogs)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Operating Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(metrics.financial.operatingExpenses)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Gross Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(metrics.financial.grossProfit)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Net Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(metrics.financial.netProfit)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Profit Margin</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatPercentage(metrics.financial.profitMargin)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.revenueBreakdown.byCategory.map((item: any) => (
                    <div key={item.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.category}</span>
                        <span className="text-sm text-gray-600">
                          {formatCurrency(item.revenue)} ({formatPercentage(item.percentage)})
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
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-6">
            <p className="text-gray-600">
              Detailed sales analytics will be displayed here. Navigate to the Sales Analytics page for more details.
            </p>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Inventory Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(metrics.inventoryValuation.totalValue)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(metrics.inventoryValuation.totalCost)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Potential Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(metrics.inventoryValuation.totalProfit)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Health Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-medium">Overall Health</span>
                    <span className="text-3xl font-bold text-blue-600">
                      {metrics.inventoryHealth.score}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full ${
                        metrics.inventoryHealth.score >= 80
                          ? 'bg-green-600'
                          : metrics.inventoryHealth.score >= 60
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${metrics.inventoryHealth.score}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Health Factors</h4>
                  {metrics.inventoryHealth.factors.map((factor: any) => (
                    <div key={factor.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{factor.name}</span>
                        <span className="text-sm font-medium">{Math.round(factor.score)}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${factor.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {metrics.inventoryHealth.recommendations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="space-y-2">
                      {metrics.inventoryHealth.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <p className="text-gray-600">
              Detailed customer analytics will be displayed here. Navigate to the Customer Analytics page for more details.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
