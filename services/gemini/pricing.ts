// Pricing Optimization Service
// AI-powered pricing recommendations and bundle suggestions

import { GeminiService } from './client';
import { db } from '@/lib/db/schema';
import type { PricingRecommendation, BundleRecommendation, Product } from '@/types/database';

/**
 * Price history data point
 */
interface PriceHistoryPoint {
  date: string;
  price: number;
  quantity: number;
  revenue: number;
}

/**
 * Competitor price information
 */
interface CompetitorPrice {
  competitor: string;
  price: number;
  source: string;
}

/**
 * Pricing Service Class
 * Provides AI-powered pricing optimization and bundle recommendations
 */
export class PricingService {
  constructor(private gemini: GeminiService) {}

  /**
   * Optimize pricing for a specific product
   */
  async optimizePricing(productId: string): Promise<PricingRecommendation> {
    // 1. Get product information
    const product = await db.products.get(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // 2. Get sales history at different prices
    const salesHistory = await this.getSalesAtDifferentPrices(productId);

    // 3. Calculate price elasticity
    const elasticity = this.calculatePriceElasticity(salesHistory);

    // 4. Get inventory information
    const inventory = await db.inventory.where({ productId }).first();

    // 5. Get competitor prices (simulated for now)
    const competitorPrices = await this.getCompetitorPrices(product.name);

    // 6. Prepare prompt for Gemini
    const prompt = `
Optimize pricing for this medical product:

Product Information:
- Name: ${product.name}
- Category: ${product.category}
- Current Price: $${product.unitPrice}
- Cost Price: $${product.costPrice}
- Current Profit Margin: ${((product.unitPrice - product.costPrice) / product.unitPrice * 100).toFixed(1)}%
- Current Stock: ${inventory?.quantity || 0} units
- Stock Status: ${product.stockStatus || 'unknown'}

Price Elasticity: ${elasticity.toFixed(2)}
(Elasticity interpretation: ${this.interpretElasticity(elasticity)})

Sales History at Different Prices:
${JSON.stringify(salesHistory, null, 2)}

Competitor Prices:
${JSON.stringify(competitorPrices, null, 2)}

Consider:
- Profit margin optimization (minimum 20% margin required)
- Market positioning and competitiveness
- Stock levels (suggest discount if overstocked, premium if low stock)
- Demand elasticity (how price changes affect sales volume)
- Category standards and customer expectations
- Seasonal factors

Recommend optimal price that maximizes profit while remaining competitive.

Return JSON format:
{
  "recommendedPrice": number,
  "expectedSalesIncrease": "percentage as string (e.g., '15%')",
  "expectedProfitIncrease": "percentage as string (e.g., '10%')",
  "reasoning": "detailed explanation of recommendation",
  "confidence": number (0-1),
  "priceRange": {
    "min": number,
    "max": number,
    "optimal": number
  }
}

Return ONLY the JSON object, no additional text.
`;

    // 7. Get AI recommendation
    const response = await this.gemini.generateJSON<PricingRecommendation>(prompt);

    // 8. Add product ID to response
    return {
      ...response,
      productId,
      currentPrice: product.unitPrice,
    };
  }

  /**
   * Suggest product bundles based on purchase patterns
   */
  async suggestBundles(minSupport: number = 0.1): Promise<BundleRecommendation[]> {
    // 1. Get all orders
    const orders = await db.orders
      .where('status')
      .notEqual('cancelled')
      .toArray();

    // 2. Analyze products frequently bought together
    const productPairs = new Map<string, number>();

    orders.forEach(order => {
      const items = order.items;
      
      // Create pairs of products
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const pair = [items[i].productId, items[j].productId].sort().join('|');
          productPairs.set(pair, (productPairs.get(pair) || 0) + 1);
        }
      }
    });

    // 3. Filter pairs by minimum support
    const totalOrders = orders.length;
    const frequentPairs = Array.from(productPairs.entries())
      .filter(([_, count]) => count / totalOrders >= minSupport)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20); // Top 20 pairs

    if (frequentPairs.length === 0) {
      return [];
    }

    // 4. Get product details for frequent pairs
    const pairDetails = await Promise.all(
      frequentPairs.map(async ([pair, count]) => {
        const [productId1, productId2] = pair.split('|');
        const [product1, product2] = await Promise.all([
          db.products.get(productId1),
          db.products.get(productId2),
        ]);

        return {
          products: [product1, product2].filter(p => p !== undefined) as Product[],
          frequency: count,
          support: count / totalOrders,
        };
      })
    );

    // 5. Use AI to suggest bundle pricing and strategy
    const prompt = `
Analyze these product pairs frequently bought together and suggest bundle offers:

${pairDetails.map((detail, idx) => `
Bundle ${idx + 1}:
- Products: ${detail.products.map(p => `${p.name} ($${p.unitPrice})`).join(' + ')}
- Frequency: ${detail.frequency} times
- Support: ${(detail.support * 100).toFixed(1)}%
- Individual Total: $${detail.products.reduce((sum, p) => sum + p.unitPrice, 0).toFixed(2)}
`).join('\n')}

For each bundle, recommend:
1. Bundle price (should be 10-20% discount from individual prices)
2. Expected sales volume
3. Marketing message/value proposition
4. Target customer segment

Return JSON array:
[
  {
    "products": ["productId1", "productId2"],
    "bundlePrice": number,
    "discount": "percentage as string",
    "expectedSales": number,
    "reasoning": "why this bundle makes sense",
    "marketingMessage": "compelling value proposition",
    "targetSegment": "customer type"
  }
]

Return ONLY the JSON array, no additional text.
`;

    const bundles = await this.gemini.generateJSON<BundleRecommendation[]>(prompt);

    return bundles;
  }

  /**
   * Suggest dynamic pricing for slow-moving products
   */
  async suggestClearancePricing(daysThreshold: number = 90): Promise<Array<{
    product: Product;
    currentPrice: number;
    suggestedPrice: number;
    discountPercentage: number;
    reasoning: string;
  }>> {
    // 1. Get slow-moving products
    const products = await db.products.where('isActive').equals(true).toArray();

    const slowMoving = await Promise.all(
      products.map(async (product) => {
        const sales = await this.getRecentSales(product.id, daysThreshold);
        const totalSales = sales.reduce((sum, sale) => sum + sale.quantity, 0);
        const avgDailySales = totalSales / daysThreshold;

        return {
          product,
          avgDailySales,
          totalSales,
          daysOfStock: product.stockQuantity / (avgDailySales || 0.1),
        };
      })
    );

    // Filter products with high stock and low sales
    const needsClearance = slowMoving.filter(
      (item) => item.daysOfStock > 180 && item.product.stockQuantity > 10
    );

    if (needsClearance.length === 0) {
      return [];
    }

    // 2. Use AI to suggest clearance pricing
    const prompt = `
Suggest clearance pricing for these slow-moving medical products:

${needsClearance.slice(0, 10).map(item => `
- ${item.product.name}
  Current Price: $${item.product.unitPrice}
  Cost Price: $${item.product.costPrice}
  Current Stock: ${item.product.stockQuantity} units
  Days of Stock: ${item.daysOfStock.toFixed(0)} days
  Average Daily Sales: ${item.avgDailySales.toFixed(2)} units
`).join('\n')}

For each product, recommend:
1. Clearance price (must be above cost price)
2. Discount percentage
3. Reasoning for the discount level

Return JSON array:
[
  {
    "productId": "id",
    "suggestedPrice": number,
    "discountPercentage": number,
    "reasoning": "explanation"
  }
]

Return ONLY the JSON array, no additional text.
`;

    const recommendations = await this.gemini.generateJSON<Array<{
      productId: string;
      suggestedPrice: number;
      discountPercentage: number;
      reasoning: string;
    }>>(prompt);

    // 3. Map recommendations to products
    return recommendations.map(rec => {
      const item = needsClearance.find(i => i.product.id === rec.productId);
      return {
        product: item!.product,
        currentPrice: item!.product.unitPrice,
        suggestedPrice: rec.suggestedPrice,
        discountPercentage: rec.discountPercentage,
        reasoning: rec.reasoning,
      };
    });
  }

  /**
   * Analyze price elasticity for a product
   */
  async analyzePriceElasticity(productId: string): Promise<{
    elasticity: number;
    interpretation: string;
    recommendations: string[];
  }> {
    const salesHistory = await this.getSalesAtDifferentPrices(productId);
    const elasticity = this.calculatePriceElasticity(salesHistory);
    const interpretation = this.interpretElasticity(elasticity);

    const recommendations: string[] = [];

    if (elasticity < -1) {
      recommendations.push('Product is elastic - small price decreases can significantly increase sales');
      recommendations.push('Consider promotional pricing to boost volume');
    } else if (elasticity > -1 && elasticity < 0) {
      recommendations.push('Product is inelastic - price changes have minimal impact on sales');
      recommendations.push('Consider premium pricing to maximize profit margin');
    } else {
      recommendations.push('Unusual elasticity pattern - review data quality');
    }

    return {
      elasticity,
      interpretation,
      recommendations,
    };
  }

  /**
   * Suggest cross-sell products for an order
   */
  async suggestCrossSells(orderItems: Array<{ productId: string; quantity: number }>): Promise<Product[]> {
    if (orderItems.length === 0) {
      return [];
    }

    // 1. Get products in current order
    const currentProductIds = orderItems.map(item => item.productId);
    const currentProducts = await Promise.all(
      currentProductIds.map(id => db.products.get(id))
    );

    // 2. Find products frequently bought with these products
    const orders = await db.orders
      .where('status')
      .notEqual('cancelled')
      .toArray();

    const coOccurrences = new Map<string, number>();

    orders.forEach(order => {
      const orderProductIds = order.items.map(item => item.productId);
      const hasCurrentProduct = currentProductIds.some(id => orderProductIds.includes(id));

      if (hasCurrentProduct) {
        orderProductIds.forEach(productId => {
          if (!currentProductIds.includes(productId)) {
            coOccurrences.set(productId, (coOccurrences.get(productId) || 0) + 1);
          }
        });
      }
    });

    // 3. Get top co-occurring products
    const topCoOccurring = Array.from(coOccurrences.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId]) => productId);

    const suggestedProducts = await Promise.all(
      topCoOccurring.map(id => db.products.get(id))
    );

    return suggestedProducts.filter(p => p !== undefined) as Product[];
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Get sales history at different price points
   */
  private async getSalesAtDifferentPrices(productId: string): Promise<PriceHistoryPoint[]> {
    const orders = await db.orders
      .where('status')
      .notEqual('cancelled')
      .toArray();

    const pricePoints = new Map<number, { quantity: number; revenue: number; count: number }>();

    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.productId === productId) {
          const price = item.unitPrice;
          const existing = pricePoints.get(price) || { quantity: 0, revenue: 0, count: 0 };
          
          pricePoints.set(price, {
            quantity: existing.quantity + item.quantity,
            revenue: existing.revenue + item.total,
            count: existing.count + 1,
          });
        }
      });
    });

    return Array.from(pricePoints.entries())
      .map(([price, data]) => ({
        date: new Date().toISOString().split('T')[0],
        price,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => a.price - b.price);
  }

  /**
   * Calculate price elasticity of demand
   */
  private calculatePriceElasticity(salesHistory: PriceHistoryPoint[]): number {
    if (salesHistory.length < 2) {
      return -1; // Default elasticity
    }

    // Simple elasticity calculation using first and last data points
    const first = salesHistory[0];
    const last = salesHistory[salesHistory.length - 1];

    const priceChange = (last.price - first.price) / first.price;
    const quantityChange = (last.quantity - first.quantity) / first.quantity;

    if (priceChange === 0) {
      return -1;
    }

    return quantityChange / priceChange;
  }

  /**
   * Interpret price elasticity value
   */
  private interpretElasticity(elasticity: number): string {
    if (elasticity < -1) {
      return 'Elastic - Demand is highly sensitive to price changes';
    } else if (elasticity >= -1 && elasticity < -0.5) {
      return 'Moderately Elastic - Demand responds to price changes';
    } else if (elasticity >= -0.5 && elasticity < 0) {
      return 'Inelastic - Demand is relatively insensitive to price changes';
    } else {
      return 'Unusual pattern - Further analysis needed';
    }
  }

  /**
   * Get competitor prices (simulated)
   */
  private async getCompetitorPrices(productName: string): Promise<CompetitorPrice[]> {
    // In a real implementation, this would fetch from external sources
    // For now, return simulated data
    return [
      {
        competitor: 'Market Average',
        price: 0,
        source: 'Industry data',
      },
    ];
  }

  /**
   * Get recent sales for a product
   */
  private async getRecentSales(
    productId: string,
    days: number
  ): Promise<Array<{ date: string; quantity: number; revenue: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await db.orders
      .where('orderDate')
      .above(startDate)
      .and(order => order.status !== 'cancelled')
      .toArray();

    const sales: Array<{ date: string; quantity: number; revenue: number }> = [];

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
}
