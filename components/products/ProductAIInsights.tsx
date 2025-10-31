"use client";

import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, DollarSign, Package, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGeminiService } from "@/services/gemini/client";
import { PricingService } from "@/services/gemini/pricing";
import { ForecastingService } from "@/services/gemini/forecasting";
import { db } from "@/lib/db/schema";
import type { Product, PricingRecommendation, DemandForecast } from "@/types/database";
import { formatCurrency, formatPercentage } from "@/lib/utils/formatters";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import toast from "react-hot-toast";

interface ProductAIInsightsProps {
  product: Product;
}

export function ProductAIInsights({ product }: ProductAIInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [pricingRec, setPricingRec] = useState<PricingRecommendation | null>(null);
  const [demandForecast, setDemandForecast] = useState<DemandForecast | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState("pricing");

  useEffect(() => {
    loadAIInsights();
  }, [product.id]);

  const loadAIInsights = async () => {
    setLoading(true);
    try {
      const gemini = getGeminiService();
      const pricingService = new PricingService(gemini);
      const forecastingService = new ForecastingService(gemini);

      // Load all insights in parallel
      const [pricing, forecast, similar] = await Promise.all([
        pricingService.optimizePricing(product.id).catch(() => null),
        forecastingService.forecastDemand(product.id, 30).catch(() => null),
        findSimilarProducts(product),
      ]);

      setPricingRec(pricing);
      setDemandForecast(forecast);
      setSimilarProducts(similar);
    } catch (error) {
      console.error("Error loading AI insights:", error);
      toast.error("Failed to load AI insights");
    } finally {
      setLoading(false);
    }
  };

  const findSimilarProducts = async (product: Product): Promise<Product[]> => {
    // Find products in the same category
    const products = await db.products
      .where("category")
      .equals(product.category)
      .and(p => p.id !== product.id && p.isActive)
      .limit(5)
      .toArray();

    return products;
  };

  const applyPricingRecommendation = async () => {
    if (!pricingRec) return;

    try {
      await db.products.update(product.id, {
        unitPrice: pricingRec.recommendedPrice,
        updatedAt: new Date(),
      });
      toast.success("Pricing recommendation applied!");
      window.location.reload();
    } catch (error) {
      console.error("Error applying pricing:", error);
      toast.error("Failed to apply pricing recommendation");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-muted-foreground">Loading AI insights...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          AI-Powered Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="forecast">Demand Forecast</TabsTrigger>
            <TabsTrigger value="similar">Similar Products</TabsTrigger>
            <TabsTrigger value="analysis">Profit Analysis</TabsTrigger>
          </TabsList>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-4">
            {pricingRec ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Current Price</span>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(product.unitPrice)}</p>
                  </div>

                  <div className="p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-blue-900 font-medium">Recommended Price</span>
                      <Sparkles className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(pricingRec.recommendedPrice)}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {pricingRec.recommendedPrice > product.unitPrice ? "+" : ""}
                      {formatCurrency(pricingRec.recommendedPrice - product.unitPrice)} change
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-900">Expected Sales Increase</span>
                    <Badge className="bg-green-600">{pricingRec.expectedSalesIncrease}</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-900">Expected Profit Increase</span>
                    <Badge className="bg-green-600">{pricingRec.expectedProfitIncrease}</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-900">Confidence Level</span>
                    <Badge className="bg-blue-600">
                      {formatPercentage(pricingRec.confidence)}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-2">AI Reasoning</h4>
                  <p className="text-sm text-muted-foreground">{pricingRec.reasoning}</p>
                </div>

                <Button onClick={applyPricingRecommendation} className="w-full">
                  Apply Recommended Price
                </Button>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No pricing recommendations available
              </div>
            )}
          </TabsContent>

          {/* Demand Forecast Tab */}
          <TabsContent value="forecast" className="space-y-4">
            {demandForecast ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Trend</span>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Badge
                      variant={
                        demandForecast.trend === "increasing"
                          ? "default"
                          : demandForecast.trend === "decreasing"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {demandForecast.trend.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Reorder Point</span>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{demandForecast.reorderPoint}</p>
                    <p className="text-xs text-muted-foreground mt-1">units</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Reorder Quantity</span>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{demandForecast.reorderQuantity}</p>
                    <p className="text-xs text-muted-foreground mt-1">units</p>
                  </div>
                </div>

                {/* Forecast Chart */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">30-Day Demand Forecast</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={demandForecast.forecast.slice(0, 30)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => new Date(value).getDate().toString()}
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: any) => [value, "Predicted Quantity"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="predictedQuantity"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-2">Seasonal Pattern</h4>
                  <p className="text-sm text-muted-foreground">{demandForecast.seasonalPattern}</p>
                </div>

                <div className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-2">Key Factors</h4>
                  <ul className="space-y-1">
                    {demandForecast.factors.map((factor, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>

                {product.stockQuantity < demandForecast.reorderPoint && (
                  <div className="p-4 border border-yellow-300 rounded-lg bg-yellow-50 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Reorder Recommended</h4>
                      <p className="text-sm text-yellow-800 mt-1">
                        Current stock ({product.stockQuantity} units) is below the recommended reorder
                        point ({demandForecast.reorderPoint} units). Consider ordering{" "}
                        {demandForecast.reorderQuantity} units.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No demand forecast available
              </div>
            )}
          </TabsContent>

          {/* Similar Products Tab */}
          <TabsContent value="similar" className="space-y-4">
            {similarProducts.length > 0 ? (
              <div className="space-y-3">
                {similarProducts.map((similar) => (
                  <div
                    key={similar.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => (window.location.href = `/products/${similar.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{similar.name}</h4>
                        <p className="text-sm text-muted-foreground">{similar.manufacturer}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(similar.unitPrice)}</p>
                        <p className="text-sm text-muted-foreground">
                          Stock: {similar.stockQuantity}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No similar products found
              </div>
            )}
          </TabsContent>

          {/* Profit Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="text-sm text-muted-foreground mb-2">Current Profit Margin</h4>
                <p className="text-3xl font-bold text-green-600">
                  {product.profitMargin?.toFixed(2)}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {formatCurrency(product.unitPrice - product.costPrice)} per unit
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="text-sm text-muted-foreground mb-2">Total Inventory Value</h4>
                <p className="text-3xl font-bold">
                  {formatCurrency(product.unitPrice * product.stockQuantity)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {product.stockQuantity} units in stock
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="text-sm text-muted-foreground mb-2">Cost Value</h4>
                <p className="text-2xl font-bold">
                  {formatCurrency(product.costPrice * product.stockQuantity)}
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="text-sm text-muted-foreground mb-2">Potential Profit</h4>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    (product.unitPrice - product.costPrice) * product.stockQuantity
                  )}
                </p>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-blue-50">
              <h4 className="font-medium text-blue-900 mb-2">Profit Optimization Tips</h4>
              <ul className="space-y-2">
                <li className="text-sm text-blue-800 flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  {product.profitMargin && product.profitMargin < 20
                    ? "Consider increasing price to improve profit margin"
                    : "Profit margin is healthy"}
                </li>
                <li className="text-sm text-blue-800 flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  {product.stockQuantity > product.reorderLevel * 3
                    ? "High stock levels - consider promotional pricing"
                    : "Stock levels are optimal"}
                </li>
                <li className="text-sm text-blue-800 flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  Monitor competitor pricing to maintain market competitiveness
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={loadAIInsights} className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            Refresh AI Insights
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
