'use client';

import dynamic from 'next/dynamic';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';

// Lazy load the heavy inventory analytics component
const InventoryAnalyticsDashboard = dynamic(() => import('@/components/analytics/InventoryAnalyticsDashboard'), {
  loading: () => <DashboardSkeleton />,
  ssr: false
});

export default function InventoryAnalyticsPage() {
  return <InventoryAnalyticsDashboard />;
}
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 3);

      const [
        valuation,
        expiringProducts,
        slowMovingProducts,
        stockTurnover,
        healthScore,
      ] = await Promise.all([
        InventoryAnalyticsService.getInventoryValuation(),
        InventoryAnalyticsService.getExpiringProducts(90),
        InventoryAnalyticsService.getSlowMovingProducts(90),
        InventoryAnalyticsService.getStockTurnover(startDate, endDate),
        InventoryAnalyticsService.getInventoryHealthScore(),
      ]);

      setData({
        valuation,
        expiringProducts,
        slowMovingProducts,
        stockTurnover: stockTurnover.slice(0, 15),
        healthScore,
      });
    } catch (err) {
      console.error('Error loading inventory data:', err);
      setError('Failed to load inventory analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button onClick={loadInventoryData} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Analytics</h1>
            <p className="text-gray-600 mt-1">Stock levels, valuation, and turnover analysis</p>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Inventory Value</p>
                  <h3 className="text-2xl font-bold mt-2">{formatCurrency(data.valuation.totalValue)}</h3>
                  <p className="text-sm text-gray-500 mt-1">At selling price</p>
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
                  <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <h3 className="text-2xl font-bold mt-2 text-orange-600">{data.expiringProducts.length}</h3>
                  <p className="text-sm text-gray-500 mt-1">Within 90 days</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Slow Moving</p>
                  <h3 className="text-2xl font-bold mt-2 text-red-600">{data.slowMovingProducts.length}</h3>
                  <p className="text-sm text-gray-500 mt-1">No sales in 90 days</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Health Score */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Inventory Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-medium">Overall Health</span>
                <span className="text-3xl font-bold text-blue-600">{data.healthScore.score}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
                    data.healthScore.score >= 80 ? 'bg-green-600' : data.healthScore.score >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${data.healthScore.score}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {data.healthScore.factors.map((factor: any) => (
                <div key={factor.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{factor.name}</span>
                    <span className="text-sm text-gray-600">{Math.round(factor.score)}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${factor.score}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {data.healthScore.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {data.healthScore.recommendations.map((rec: string, index: number) => (
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

        {/* Stock Turnover */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Stock Turnover Rate (Top 15 Products)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.stockTurnover} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="productName" type="category" width={150} />
                <Tooltip formatter={(value: number) => formatNumber(value, 2)} />
                <Legend />
                <Bar dataKey="turnoverRate" fill="#3b82f6" name="Turnover Rate" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expiring Products */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Products Near Expiry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">SKU</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Quantity</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Expiry Date</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Days Left</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Severity</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Est. Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expiringProducts.slice(0, 10).map((product: any) => (
                    <tr key={product.productId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{product.productName}</td>
                      <td className="py-3 px-4 text-gray-600">{product.sku}</td>
                      <td className="py-3 px-4 text-right">{product.quantity}</td>
                      <td className="py-3 px-4">{formatDate(product.expiryDate)}</td>
                      <td className="py-3 px-4 text-right">{product.daysUntilExpiry}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          product.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          product.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {product.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-red-600">{formatCurrency(product.estimatedLoss)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Slow Moving Products */}
        <Card>
          <CardHeader>
            <CardTitle>Slow Moving Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">SKU</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Quantity</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Days Since Sale</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Value</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slowMovingProducts.slice(0, 10).map((product: any) => (
                    <tr key={product.productId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{product.productName}</td>
                      <td className="py-3 px-4 text-gray-600">{product.sku}</td>
                      <td className="py-3 px-4 text-right">{product.quantity}</td>
                      <td className="py-3 px-4 text-right">{product.daysSinceLastSale}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(product.inventoryValue)}</td>
                      <td className="py-3 px-4 text-sm text-blue-600">{product.recommendedAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
