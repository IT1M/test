'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Target, RefreshCw, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getGeminiService } from '@/services/gemini/client';
import { PricingService } from '@/services/gemini/pricing';
import type { PricingRecommendation } from '@/types/database';

interface PricingRecommendationsProps {
  productId: string;
  productName: string;
  currentPrice: number;
}

/**
 * Pricing Recommendations Component
 * Displays AI-powered pricing optimization suggestions
 */
export function PricingRecommendations({
  productId,
  productName,
  currentPrice,
}: PricingRecommendationsProps) {
  const [recommendation, setRecommendation] = useState<PricingRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendation();
  }, [productId]);

  const loadRecommendation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const gemini = getGeminiService();
      const pricingService = new PricingService(gemini);

      const pricingRec = await pricingService.optimizePricing(productId);
      setRecommendation(pricingRec);
    } catch (err) {
      console.error('Failed to load pricing recommendation:', err);
      setError('Failed to load pricing recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !recommendation) {
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
            <Button onClick={loadRecommendation} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendation) return null;

  const priceChange = recommendation.recommendedPrice - recommendation.currentPrice;
  const priceChangePercent = (priceChange / recommendation.currentPrice) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Pricing Optimization - {productName}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadRecommendation}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Price Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-600 mb-2">
                Current Price
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ${recommendation.currentPrice.toFixed(2)}
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm font-medium text-green-600 mb-2">
                Recommended Price
              </div>
              <div className="text-3xl font-bold text-green-900">
                ${recommendation.recommendedPrice.toFixed(2)}
              </div>
              <div className="mt-2">
                <Badge
                  variant={priceChange > 0 ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {priceChange > 0 ? '+' : ''}
                  {priceChangePercent.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>

          {/* Expected Impact */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Expected Impact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Sales Increase
                  </span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {recommendation.expectedSalesIncrease}
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">
                    Profit Increase
                  </span>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {recommendation.expectedProfitIncrease}
                </div>
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Recommendation Reasoning
                </div>
                <p className="text-sm text-gray-700">{recommendation.reasoning}</p>
              </div>
            </div>
          </div>

          {/* Confidence */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-900">
              Confidence Level
            </span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${recommendation.confidence * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold text-blue-900">
                {(recommendation.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <Button className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Apply Recommended Price
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
