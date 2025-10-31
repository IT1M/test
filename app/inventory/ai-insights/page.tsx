'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  DollarSign,
  Target
} from 'lucide-react';
import { ForecastingService } from '@/services/gemini/forecasting';
import { GeminiService } from '@/services/gemini/client';
import { ProductService } from '@/services/database/products';
import { InventoryService } from '@/services/database/inventory';
import { formatCurrency } from '@/lib/utils/formatters';
import type { Product, DemandForecast } from '@/types/database';
import toast from 'react-hot-toast';

interface ProductWithForecast {
  product: Product;
  forecast: DemandForecast;
  currentStock: number;
  daysOfStock: number;
  reorderRecommendation: 'urgent' | 'soon' | 'normal' | 'sufficient';
}

interface SlowMovingProduct {
  product: Product;
  avgDailySales: number;
  daysOfStock: number;
  suggestedAction: string;
}

export default function AIInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [forecastingService, setForecastingService] = useState<ForecastingService | null>(null);
  const [productsWithForecasts, setProductsWithForecasts] = useState<ProductWithForecast[]>([]);
  const [slowMovingProducts, setSlowMovingProducts] = useState<SlowMovingProduct[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
  const [expiryRisks, setExpiryRisks] = useState<any[]>([]);

  useEffect(() => {
    initializeService();
  }, []);

  const initializeService = async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        toast.error('Gemini API key not configured');
        setLoading(false);
        return;
      }

      const geminiService = new GeminiService({ apiKey });
      const service = new ForecastingService(geminiService);
      setForecastingService(service);

      await loadInsights(service);
    } catch (error) {
      console.error('Error initializing service:', error);
      toast.error('Failed to initialize AI service');
      setLoading(false);
    }
  };

  const loadInsights = async (service: ForecastingService) => {
    try {
      setLoading(true);

      // Get all active products
      const products = await ProductService.getProducts({ isActive: true });

      // Limit to top 10 products for demo
      const topProducts = products.slice(0, 10);

      // Generate forecasts for products
      const forecasts = await Promise.all(
        topProducts.map(async (product) => {
          try {
            const forecast = await service.forecastDemand(product.id, 30);
            const inventory = await InventoryService.getInventoryByProduct(product.id);
            const currentStock = inventory?.quantity || 0;

            // Calculate average daily demand
            const avgDailyDemand = forecast.forecast.reduce((sum, day) => sum + day.predictedQuantity, 0) / 30;
            const daysOfStock = avgDailyDemand > 0 ? currentStock / avgDailyDemand : 999;

            // Determine reorder recommendation
            let reorderRecommendation: 'urgent' | 'soon' | 'normal' | 'sufficient';
            if (daysOfStock < 7) {
              reorderRecommendation = 'urgent';
            } else if (daysOfStock < 14) {
              reorderRecommendation = 'soon';
            } else if (daysOfStock < 30) {
              reorderRecommendation = 'normal';
            } else {
              reorderRecommendation = 'sufficient';
            }

            return {
              product,
              forecast,
              currentStock,
              daysOfStock,
              reorderRecommendation,
            };
          } catch (error) {
            console.error(`Error forecasting for ${product.name}:`, error);
            return null;
          }
        })
      );

      const validForecasts = forecasts.filter((f): f is ProductWithForecast => f !== null);
      setProductsWithForecasts(validForecasts);

      // Identify slow-moving products
      const slowMoving = await service.identifySlowMovingProducts(90);
      const slowMovingWithDetails = await Promise.all(
        slowMoving.slice(0, 10).map(async (product) => {
          const inventory = await InventoryService.getInventoryByProduct(product.id);
          const currentStock = inventory?.quantity || 0;

          return {
            product,
            avgDailySales: 0.05, // Placeholder
            daysOfStock: currentStock / 0.05,
            suggestedAction: currentStock > 50 ? 'Consider clearance sale' : 'Monitor closely',
          };
        })
      );
      setSlowMovingProducts(slowMovingWithDetails);

      // Detect trending products
      const trending = await service.detectTrendingProducts(0.2);
      setTrendingProducts(trending.slice(0, 10));

      // Predict expiry risks
      const risks = await service.predictExpiryRisk(90);
      setExpiryRisks(risks.slice(0, 10));

    } catch (error) {
      console.error('Error loading insights:', error);
      toast.error('Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  const refreshInsights = async () => {
    if (!forecastingService) {
      toast.error('AI service not initialized');
      return;
    }

    setAnalyzing(true);
    try {
      await loadInsights(forecastingService);
      toast.success('Insights refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh insights');
    } finally {
      setAnalyzing(false);
    }
  };

  const getReorderBadge = (recommendation: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-300',
      soon: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      normal: 'bg-blue-100 text-blue-800 border-blue-300',
      sufficient: 'bg-green-100 text-green-800 border-green-300',
    };

    const labels = {
      urgent: 'Urgent Reorder',
      soon: 'Reorder Soon',
      normal: 'Normal Reorder',
      sufficient: 'Stock Sufficient',
    };

    return (
      <Badge className={colors[recommendation as keyof typeof colors]}>
        {labels[recommendation as keyof typeof labels]}
      </Badge>
    );
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (trend === 'decreasing') {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Brain className="w-12 h-12 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Analyzing inventory with AI...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-600" />
            AI Inventory Insights
          </h1>
          <p className="text-gray-600 mt-1">
            AI-powered demand forecasting and inventory optimization
          </p>
        </div>
        <Button onClick={refreshInsights} disabled={analyzing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analyzing...' : 'Refresh Insights'}
        </Button>
      </div>

      {/* Reorder Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Reorder Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productsWithForecasts.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No forecast data available. Click refresh to generate insights.
            </p>
          ) : (
            <div className="space-y-3">
              {productsWithForecasts
                .sort((a, b) => a.daysOfStock - b.daysOfStock)
                .map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{item.product.name}</p>
                        {getTrendIcon(item.forecast.trend)}
                      </div>
                      <p className="text-sm text-gray-600">
                        SKU: {item.product.sku} • Current Stock: {item.currentStock} units
                      </p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="text-sm text-gray-600">Days of Stock</p>
                      <p className="text-lg font-semibold">
                        {item.daysOfStock < 999 ? Math.round(item.daysOfStock) : '∞'}
                      </p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="text-sm text-gray-600">Recommended Order</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {item.forecast.reorderQuantity} units
                      </p>
                    </div>
                    <div>{getReorderBadge(item.reorderRecommendation)}</div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Trending Products (High Demand Growth)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trendingProducts.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg bg-green-50"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      SKU: {item.sku} • Category: {item.category}
                    </p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm text-gray-600">Growth Rate</p>
                    <p className="text-lg font-semibold text-green-600">
                      +{(item.growthRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm text-gray-600">Recent Sales</p>
                    <p className="text-lg font-semibold">{item.recentSales} units</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Current Stock</p>
                    <p className="text-lg font-semibold">{item.stockQuantity} units</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slow-Moving Products */}
      {slowMovingProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Slow-Moving Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {slowMovingProducts.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-600">
                      SKU: {item.product.sku} • Category: {item.product.category}
                    </p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm text-gray-600">Avg Daily Sales</p>
                    <p className="text-lg font-semibold">{item.avgDailySales.toFixed(2)}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm text-gray-600">Days of Stock</p>
                    <p className="text-lg font-semibold">{Math.round(item.daysOfStock)}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {item.suggestedAction}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiry Risk Products */}
      {expiryRisks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Products at Risk of Expiry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiryRisks.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    item.riskLevel === 'high'
                      ? 'bg-red-50 border-red-200'
                      : item.riskLevel === 'medium'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-600">
                      SKU: {item.product.sku} • Expires: {new Date(item.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm text-gray-600">Current Stock</p>
                    <p className="text-lg font-semibold">{item.currentStock} units</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm text-gray-600">Predicted Sales</p>
                    <p className="text-lg font-semibold text-green-600">
                      {Math.round(item.predictedSales)} units
                    </p>
                  </div>
                  <div>
                    <Badge
                      className={
                        item.riskLevel === 'high'
                          ? 'bg-red-100 text-red-800'
                          : item.riskLevel === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }
                    >
                      {item.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimal Stock Levels Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Optimal Stock Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Products Analyzed</p>
              <p className="text-2xl font-bold text-blue-600">{productsWithForecasts.length}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Require Attention</p>
              <p className="text-2xl font-bold text-yellow-600">
                {productsWithForecasts.filter(p => p.reorderRecommendation !== 'sufficient').length}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Trending Products</p>
              <p className="text-2xl font-bold text-green-600">{trendingProducts.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
