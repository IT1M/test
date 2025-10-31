'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Package, Calendar, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getGeminiService } from '@/services/gemini/client';
import { ForecastingService } from '@/services/gemini/forecasting';
import type { DemandForecast } from '@/types/database';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DemandForecastProps {
  productId: string;
  productName: string;
  days?: number;
}

/**
 * Demand Forecast Component
 * Displays AI-powered demand predictions for a product
 */
export function DemandForecast({ productId, productName, days = 30 }: DemandForecastProps) {
  const [forecast, setForecast] = useState<DemandForecast | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadForecast();
  }, [productId, days]);

  const loadForecast = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const gemini = getGeminiService();
      const forecastingService = new ForecastingService(gemini);

      const demandForecast = await forecastingService.forecastDemand(productId, days);
      setForecast(demandForecast);
    } catch (err) {
      console.error('Failed to load forecast:', err);
      setError('Failed to load demand forecast');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !forecast) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <Button onClick={loadForecast} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecast) return null;

  // Prepare chart data
  const chartData = forecast.forecast.map(f => ({
    date: new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    quantity: f.predictedQuantity,
    confidence: f.confidence * 100,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Demand Forecast - {productName}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadForecast}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Reorder Point</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {forecast.reorderPoint} units
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Reorder Quantity</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {forecast.reorderQuantity} units
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Trend</span>
              </div>
              <div className="text-2xl font-bold text-purple-900 capitalize">
                {forecast.trend}
              </div>
            </div>
          </div>

          {/* Forecast Chart */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">
              {days}-Day Demand Forecast
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="quantity"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Predicted Quantity"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Insights</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Badge>{(forecast.confidence * 100).toFixed(0)}% confidence</Badge>
                <span className="text-sm text-gray-700">
                  Forecast confidence level
                </span>
              </div>

              {forecast.seasonalPattern && (
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    Seasonal Pattern:
                  </div>
                  <div className="text-sm text-gray-700">
                    {forecast.seasonalPattern}
                  </div>
                </div>
              )}

              {forecast.factors && forecast.factors.length > 0 && (
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    Influencing Factors:
                  </div>
                  <ul className="space-y-1">
                    {forecast.factors.map((factor, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
