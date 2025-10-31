'use client';

import dynamic from 'next/dynamic';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';

// Lazy load the heavy sales analytics component
const SalesAnalyticsDashboard = dynamic(() => import('@/components/analytics/SalesAnalyticsDashboard'), {
  loading: () => <DashboardSkeleton />,
  ssr: false
});

export default function SalesAnalyticsPage() {
  return <SalesAnalyticsDashboard />;
}
  const [period, setPeriod] = useState<Period>('monthly');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSalesData();
  }, [period]);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = getDateRange(period);

      const [
        topProducts,
        salesByCustomer,
        salesBySalesPerson,
        salesPipeline,
        salesTrend,
        seasonalPatterns,
      ] = await Promise.all([
        SalesAnalyticsService.getTopProducts(startDate, endDate, 10),
        SalesAnalyticsService.getSalesByCustomer(startDate, endDate, 10),
        SalesAnalyticsService.getSalesBySalesPerson(startDate, endDate),
        SalesAnalyticsService.getSalesPipeline(),
        SalesAnalyticsService.getSalesTrend(startDate, endDate, 'daily'),
        SalesAnalyticsService.detectSeasonalPatterns(startDate, endDate),
      ]);

      setData({
        topProducts,
        salesByCustomer,
        salesBySalesPerson,
        salesPipeline,
        salesTrend,
        seasonalPatterns,
      });
    } catch (err) {
      console.error('Error loading sales data:', err);
      setError('Failed to load sales analytics. Please try again.');
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
          <p className="mt-4 text-gray-600">Loading sales analytics...</p>
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
            onClick={loadSalesData}
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

  const totalRevenue = data.topProducts.reduce((sum: number, p: any) => sum + p.revenue, 0);
  const totalVolume = data.topProducts.reduce((sum: number, p: any) => sum + p.salesVolume, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Analytics</h1>
            <p className="text-gray-600 mt-1">Sales performance and trends analysis</p>
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

        {/* Sales Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Quotations</p>
                  <h3 className="text-2xl font-bold mt-2 text-yellow-600">
                    {data.salesPipeline.quotations.count}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatCurrency(data.salesPipeline.quotations.value)}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <h3 className="text-2xl font-bold mt-2 text-blue-600">
                    {data.salesPipeline.pendingOrders.count}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatCurrency(data.salesPipeline.pendingOrders.value)}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expected Revenue</p>
                  <h3 className="text-2xl font-bold mt-2 text-green-600">
                    {formatCurrency(data.salesPipeline.expectedRevenue)}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Projected
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
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <h3 className="text-2xl font-bold mt-2 text-purple-600">
                    {formatPercentage(data.salesPipeline.conversionRate / 100)}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Quote to order
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Trend Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'sales') return formatCurrency(value);
                    if (name === 'averageOrderValue') return formatCurrency(value);
                    return value;
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Sales"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Rank</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">SKU</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Volume</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Revenue</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Profit</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((product: any, index: number) => (
                    <tr key={product.productId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{product.productName}</td>
                      <td className="py-3 px-4 text-gray-600">{product.sku}</td>
                      <td className="py-3 px-4 text-right">{formatNumber(product.salesVolume)}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(product.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600">
                        {formatCurrency(product.profit)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {formatPercentage(product.profitMargin / 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Customer and Sales Person */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.salesByCustomer}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="customerName" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Sales Person</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.salesBySalesPerson}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="salesPerson" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Sales Person Performance Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sales Person Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Sales Person</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Orders</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Revenue</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Profit</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Commission</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Avg Order Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.salesBySalesPerson.map((person: any) => (
                    <tr key={person.salesPerson} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{person.salesPerson}</td>
                      <td className="py-3 px-4 text-right">{person.orderCount}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(person.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600">
                        {formatCurrency(person.profit)}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-600">
                        {formatCurrency(person.commission)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {formatCurrency(person.averageOrderValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Seasonal Patterns */}
        {data.seasonalPatterns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.seasonalPatterns.map((pattern: any) => (
                  <div 
                    key={pattern.month}
                    className={`p-4 rounded-lg border ${
                      pattern.pattern === 'Peak Season' 
                        ? 'bg-green-50 border-green-200' 
                        : pattern.pattern === 'Low Season'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900">{pattern.month}</p>
                    <p className="text-lg font-bold mt-1">
                      {formatCurrency(pattern.averageSales)}
                    </p>
                    <p className={`text-xs mt-1 ${
                      pattern.pattern === 'Peak Season'
                        ? 'text-green-600'
                        : pattern.pattern === 'Low Season'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      {pattern.pattern}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
