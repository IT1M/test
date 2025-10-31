// Demand Forecasting Service
// AI-powered demand prediction and inventory optimization

import { GeminiService } from './client';
import { db } from '@/lib/db/schema';
import type { DemandForecast, Product } from '@/types/database';

/**
 * Sales data point for analysis
 */
interface SalesDataPoint {
  date: string;
  quantity: number;
  revenue: number;
}

/**
 * Trending product information
 */
interface TrendingProduct extends Product {
  growthRate: number;
  recentSales: number;
  previousSales: number;
}

/**
 * Forecasting Service Class
 * Provides AI-powered demand forecasting and trend analysis
 */
export class ForecastingService {
  constructor(private gemini: GeminiService) {}

  /**
   * Forecast demand for a specific product
   */
  async forecastDemand(productId: string, days: number = 30): Promise<DemandForecast> {
    // 1. Get product information
    const product = await db.products.get(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // 2. Get historical sales data (last 180 days)
    const salesHistory = await this.getSalesHistory(productId, 180);

    if (salesHistory.length === 0) {
      // No historical data, return default forecast
      return this.getDefaultForecast(productId, days);
    }

    // 3. Prepare prompt for Gemini
    const prompt = `
Analyze the following sales data and forecast demand for the next ${days} days.

Product Information:
- Name: ${product.name}
- Category: ${product.category}
- Current Stock: ${product.stockQuantity}
- Reorder Level: ${product.reorderLevel}

Historical Sales Data (last 180 days):
${JSON.stringify(salesHistory, null, 2)}

Consider:
- Seasonal patterns (weekly, monthly cycles)
- Growth trends (increasing, stable, decreasing)
- Day of week patterns
- Any anomalies or outliers
- Recent trends vs historical averages

Provide forecast in JSON format:
{
  "forecast": [
    { "date": "YYYY-MM-DD", "predictedQuantity": number, "confidence": number }
  ],
  "seasonalPattern": "description of seasonal patterns observed",
  "trend": "increasing|stable|decreasing",
  "confidence": number (0-1),
  "factors": ["factor1", "factor2", "factor3"]
}

Return ONLY the JSON object, no additional text.
`;

    // 4. Get AI forecast
    const response = await this.gemini.generateJSON<{
      forecast: Array<{ date: string; predictedQuantity: number; confidence: number }>;
      seasonalPattern: string;
      trend: 'increasing' | 'stable' | 'decreasing';
      confidence: number;
      factors: string[];
    }>(prompt);

    // 5. Calculate optimal reorder point and quantity
    const avgDailyDemand = this.calculateAverageDailyDemand(response.forecast);
    const leadTime = 7; // Assume 7 days lead time
    const safetyStock = Math.ceil(avgDailyDemand * 3); // 3 days safety stock

    const reorderPoint = Math.ceil(avgDailyDemand * leadTime + safetyStock);
    const reorderQuantity = Math.ceil(avgDailyDemand * 30); // 30 days supply

    // 6. Build complete forecast object
    const forecast: DemandForecast = {
      productId,
      forecast: response.forecast,
      seasonalPattern: response.seasonalPattern,
      trend: response.trend,
      confidence: response.confidence,
      factors: response.factors,
      reorderPoint,
      reorderQuantity,
    };

    return forecast;
  }

  /**
   * Detect trending products with increasing demand
   */
  async detectTrendingProducts(minGrowthRate: number = 0.2): Promise<TrendingProduct[]> {
    // 1. Get all active products
    const products = await db.products.where('isActive').equals(1).toArray();

    // 2. Calculate growth rate for each product
    const productsWithGrowth = await Promise.all(
      products.map(async (product) => {
        const recentSales = await this.getRecentSales(product.id, 30);
        const previousSales = await this.getRecentSales(product.id, 60, 30);

        const recentTotal = recentSales.reduce((sum, sale) => sum + sale.quantity, 0);
        const previousTotal = previousSales.reduce((sum, sale) => sum + sale.quantity, 0);

        const growthRate = previousTotal > 0 
          ? (recentTotal - previousTotal) / previousTotal 
          : 0;

        return {
          ...product,
          growthRate,
          recentSales: recentTotal,
          previousSales: previousTotal,
        };
      })
    );

    // 3. Filter products with growth rate above threshold
    const trendingProducts = productsWithGrowth.filter(
      (p) => p.growthRate >= minGrowthRate && p.recentSales > 0
    );

    // 4. Sort by growth rate descending
    trendingProducts.sort((a, b) => b.growthRate - a.growthRate);

    // 5. Use AI to analyze and provide insights
    if (trendingProducts.length > 0) {
      const prompt = `
Analyze these trending products and provide insights:

${trendingProducts.slice(0, 10).map(p => `
- ${p.name} (${p.category})
  Growth Rate: ${(p.growthRate * 100).toFixed(1)}%
  Recent Sales: ${p.recentSales} units
  Previous Sales: ${p.previousSales} units
  Current Stock: ${p.stockQuantity}
`).join('\n')}

Identify:
1. Common patterns across trending products
2. Potential reasons for increased demand
3. Recommendations for inventory management
4. Products that may need immediate restocking

Return insights as JSON:
{
  "patterns": ["pattern1", "pattern2"],
  "reasons": ["reason1", "reason2"],
  "recommendations": ["rec1", "rec2"],
  "urgentRestocking": ["productId1", "productId2"]
}
`;

      try {
        const insights = await this.gemini.generateJSON<{
          patterns: string[];
          reasons: string[];
          recommendations: string[];
          urgentRestocking: string[];
        }>(prompt);

        // Log insights for later retrieval
        console.log('Trending Products Insights:', insights);
      } catch (error) {
        console.error('Failed to generate trending insights:', error);
      }
    }

    return trendingProducts;
  }

  /**
   * Identify slow-moving products
   */
  async identifySlowMovingProducts(daysThreshold: number = 90): Promise<Product[]> {
    const products = await db.products.where('isActive').equals(1).toArray();

    const slowMoving = await Promise.all(
      products.map(async (product) => {
        const sales = await this.getRecentSales(product.id, daysThreshold);
        const totalSales = sales.reduce((sum, sale) => sum + sale.quantity, 0);
        const avgDailySales = totalSales / daysThreshold;

        return {
          product,
          avgDailySales,
          totalSales,
        };
      })
    );

    // Filter products with very low sales velocity
    const threshold = 0.1; // Less than 0.1 units per day
    return slowMoving
      .filter((item) => item.avgDailySales < threshold && item.product.stockQuantity > 0)
      .map((item) => item.product);
  }

  /**
   * Calculate optimal stock levels for all products
   */
  async calculateOptimalStockLevels(): Promise<Map<string, { reorderPoint: number; reorderQuantity: number }>> {
    const products = await db.products.where('isActive').equals(1).toArray();
    const stockLevels = new Map<string, { reorderPoint: number; reorderQuantity: number }>();

    for (const product of products) {
      try {
        const forecast = await this.forecastDemand(product.id, 30);
        stockLevels.set(product.id, {
          reorderPoint: forecast.reorderPoint,
          reorderQuantity: forecast.reorderQuantity,
        });
      } catch (error) {
        console.error(`Failed to calculate stock levels for ${product.id}:`, error);
      }
    }

    return stockLevels;
  }

  /**
   * Predict products likely to expire before selling
   */
  async predictExpiryRisk(daysAhead: number = 90): Promise<Array<{
    product: Product;
    expiryDate: Date;
    currentStock: number;
    predictedSales: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>> {
    const products = await db.products
      .where('isActive')
      .equals(1)
      .and(p => p.expiryDate !== undefined)
      .toArray();

    const expiryRisks = await Promise.all(
      products.map(async (product) => {
        if (!product.expiryDate) return null;

        const daysUntilExpiry = Math.floor(
          (product.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry > daysAhead) return null;

        // Forecast sales until expiry
        const forecast = await this.forecastDemand(product.id, daysUntilExpiry);
        const predictedSales = forecast.forecast.reduce(
          (sum, day) => sum + day.predictedQuantity,
          0
        );

        // Calculate risk level
        const remainingStock = product.stockQuantity - predictedSales;
        let riskLevel: 'low' | 'medium' | 'high';

        if (remainingStock > product.stockQuantity * 0.5) {
          riskLevel = 'high';
        } else if (remainingStock > product.stockQuantity * 0.2) {
          riskLevel = 'medium';
        } else {
          riskLevel = 'low';
        }

        return {
          product,
          expiryDate: product.expiryDate,
          currentStock: product.stockQuantity,
          predictedSales,
          riskLevel,
        };
      })
    );

    return expiryRisks.filter((risk) => risk !== null) as Array<{
      product: Product;
      expiryDate: Date;
      currentStock: number;
      predictedSales: number;
      riskLevel: 'low' | 'medium' | 'high';
    }>;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Get sales history for a product
   */
  private async getSalesHistory(productId: string, days: number): Promise<SalesDataPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await db.orders
      .where('orderDate')
      .above(startDate)
      .and(order => order.status !== 'cancelled')
      .toArray();

    // Aggregate sales by date
    const salesByDate = new Map<string, { quantity: number; revenue: number }>();

    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.productId === productId) {
          const dateKey = order.orderDate.toISOString().split('T')[0];
          const existing = salesByDate.get(dateKey) || { quantity: 0, revenue: 0 };
          
          salesByDate.set(dateKey, {
            quantity: existing.quantity + item.quantity,
            revenue: existing.revenue + item.total,
          });
        }
      });
    });

    // Convert to array and sort by date
    const salesHistory: SalesDataPoint[] = Array.from(salesByDate.entries())
      .map(([date, data]) => ({
        date,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return salesHistory;
  }

  /**
   * Get recent sales for a product
   */
  private async getRecentSales(
    productId: string,
    days: number,
    offset: number = 0
  ): Promise<SalesDataPoint[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - offset);
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const orders = await db.orders
      .where('orderDate')
      .between(startDate, endDate)
      .and(order => order.status !== 'cancelled')
      .toArray();

    const sales: SalesDataPoint[] = [];

    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.productId === productId) {
          sales.push({
            date: order.orderDate.toISOString().split('T')[0],
            quantity: item.quantity,
            revenue: item.total,
          });
        }
      });
    });

    return sales;
  }

  /**
   * Calculate average daily demand from forecast
   */
  private calculateAverageDailyDemand(
    forecast: Array<{ date: string; predictedQuantity: number; confidence: number }>
  ): number {
    if (forecast.length === 0) return 0;

    const totalDemand = forecast.reduce((sum, day) => sum + day.predictedQuantity, 0);
    return totalDemand / forecast.length;
  }

  /**
   * Get default forecast when no historical data is available
   */
  private getDefaultForecast(productId: string, days: number): DemandForecast {
    const forecast: Array<{ date: string; predictedQuantity: number; confidence: number }> = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        predictedQuantity: 0,
        confidence: 0.1,
      });
    }

    return {
      productId,
      forecast,
      seasonalPattern: 'No historical data available',
      trend: 'stable',
      confidence: 0.1,
      factors: ['No historical sales data'],
      reorderPoint: 10,
      reorderQuantity: 50,
    };
  }
}
