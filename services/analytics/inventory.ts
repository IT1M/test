// Inventory Analytics Service

import { db } from '@/lib/db/schema';
import type { Product, Inventory, StockMovement } from '@/types/database';

export interface InventoryValuation {
  totalValue: number;
  totalCost: number;
  totalProfit: number;
  byCategory: Array<{
    category: string;
    value: number;
    quantity: number;
    percentage: number;
  }>;
}

export interface ExpiringProduct {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  expiryDate: Date;
  daysUntilExpiry: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  estimatedLoss: number;
}

export interface SlowMovingProduct {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  lastSaleDate?: Date;
  daysSinceLastSale: number;
  inventoryValue: number;
  recommendedAction: string;
}

export interface StockTurnoverData {
  productId: string;
  productName: string;
  category: string;
  turnoverRate: number;
  daysInStock: number;
  status: 'fast-moving' | 'normal' | 'slow-moving';
}

export class InventoryAnalyticsService {
  /**
   * Calculate inventory valuation
   */
  static async getInventoryValuation(): Promise<InventoryValuation> {
    try {
      const products = await db.products.where({ isActive: true }).toArray();
      const inventory = await db.inventory.toArray();

      let totalValue = 0;
      let totalCost = 0;
      const categoryData = new Map<string, { value: number; quantity: number }>();

      for (const product of products) {
        const inv = inventory.find(i => i.productId === product.id);
        const quantity = inv?.quantity || product.stockQuantity;
        
        const value = product.unitPrice * quantity;
        const cost = product.costPrice * quantity;

        totalValue += value;
        totalCost += cost;

        // Aggregate by category
        const current = categoryData.get(product.category) || { value: 0, quantity: 0 };
        categoryData.set(product.category, {
          value: current.value + value,
          quantity: current.quantity + quantity,
        });
      }

      const totalProfit = totalValue - totalCost;

      const byCategory = Array.from(categoryData.entries())
        .map(([category, data]) => ({
          category,
          value: data.value,
          quantity: data.quantity,
          percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value);

      return {
        totalValue,
        totalCost,
        totalProfit,
        byCategory,
      };
    } catch (error) {
      console.error('Error calculating inventory valuation:', error);
      throw new Error('Failed to calculate inventory valuation');
    }
  }

  /**
   * Get products near expiry
   */
  static async getExpiringProducts(daysThreshold: number = 90): Promise<ExpiringProduct[]> {
    try {
      const today = new Date();
      const cutoffDate = new Date(today);
      cutoffDate.setDate(cutoffDate.getDate() + daysThreshold);

      const products = await db.products
        .where('isActive')
        .equals(1)
        .and(p => p.expiryDate !== undefined && p.expiryDate <= cutoffDate)
        .toArray();

      const expiringProducts: ExpiringProduct[] = products.map(product => {
        const daysUntilExpiry = Math.floor(
          (product.expiryDate!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        let severity: 'critical' | 'high' | 'medium' | 'low';
        if (daysUntilExpiry <= 7) {
          severity = 'critical';
        } else if (daysUntilExpiry <= 30) {
          severity = 'high';
        } else if (daysUntilExpiry <= 60) {
          severity = 'medium';
        } else {
          severity = 'low';
        }

        const estimatedLoss = product.costPrice * product.stockQuantity;

        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: product.stockQuantity,
          expiryDate: product.expiryDate!,
          daysUntilExpiry,
          severity,
          estimatedLoss,
        };
      });

      return expiringProducts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    } catch (error) {
      console.error('Error getting expiring products:', error);
      throw new Error('Failed to retrieve expiring products');
    }
  }

  /**
   * Identify slow-moving products
   */
  static async getSlowMovingProducts(daysThreshold: number = 90): Promise<SlowMovingProduct[]> {
    try {
      const today = new Date();
      const cutoffDate = new Date(today);
      cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

      const products = await db.products.where({ isActive: true }).toArray();
      const sales = await db.sales.toArray();
      const orders = await db.orders.toArray();

      const slowMovingProducts: SlowMovingProduct[] = [];

      for (const product of products) {
        // Find last sale for this product
        let lastSaleDate: Date | undefined;
        
        for (const order of orders) {
          const hasProduct = order.items.some(item => item.productId === product.id);
          if (hasProduct) {
            if (!lastSaleDate || order.orderDate > lastSaleDate) {
              lastSaleDate = order.orderDate;
            }
          }
        }

        // If no sales or last sale was before cutoff date
        if (!lastSaleDate || lastSaleDate < cutoffDate) {
          const daysSinceLastSale = lastSaleDate
            ? Math.floor((today.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          const inventoryValue = product.unitPrice * product.stockQuantity;

          let recommendedAction = 'Monitor';
          if (daysSinceLastSale > 180) {
            recommendedAction = 'Clearance Sale - 50% off';
          } else if (daysSinceLastSale > 120) {
            recommendedAction = 'Promotional Discount - 30% off';
          } else if (daysSinceLastSale > 90) {
            recommendedAction = 'Bundle with Popular Products';
          }

          slowMovingProducts.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: product.stockQuantity,
            lastSaleDate,
            daysSinceLastSale,
            inventoryValue,
            recommendedAction,
          });
        }
      }

      return slowMovingProducts.sort((a, b) => b.daysSinceLastSale - a.daysSinceLastSale);
    } catch (error) {
      console.error('Error identifying slow-moving products:', error);
      throw new Error('Failed to identify slow-moving products');
    }
  }

  /**
   * Calculate stock turnover rate
   */
  static async getStockTurnover(
    startDate: Date,
    endDate: Date
  ): Promise<StockTurnoverData[]> {
    try {
      const products = await db.products.where({ isActive: true }).toArray();
      const sales = await db.sales
        .where('saleDate')
        .between(startDate, endDate, true, true)
        .toArray();

      const orders = await db.orders
        .where('orderDate')
        .between(startDate, endDate, true, true)
        .toArray();

      const periodDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

      const turnoverData: StockTurnoverData[] = [];

      for (const product of products) {
        // Calculate total quantity sold
        let totalSold = 0;
        for (const order of orders) {
          const item = order.items.find(i => i.productId === product.id);
          if (item) {
            totalSold += item.quantity;
          }
        }

        // Calculate turnover rate (times per period)
        const averageStock = product.stockQuantity;
        const turnoverRate = averageStock > 0 ? totalSold / averageStock : 0;

        // Calculate days in stock
        const daysInStock = turnoverRate > 0 ? periodDays / turnoverRate : periodDays;

        // Determine status
        let status: 'fast-moving' | 'normal' | 'slow-moving';
        if (turnoverRate >= 4) {
          status = 'fast-moving';
        } else if (turnoverRate >= 1) {
          status = 'normal';
        } else {
          status = 'slow-moving';
        }

        turnoverData.push({
          productId: product.id,
          productName: product.name,
          category: product.category,
          turnoverRate,
          daysInStock,
          status,
        });
      }

      return turnoverData.sort((a, b) => b.turnoverRate - a.turnoverRate);
    } catch (error) {
      console.error('Error calculating stock turnover:', error);
      throw new Error('Failed to calculate stock turnover');
    }
  }

  /**
   * Get stock level trends
   */
  static async getStockLevelTrends(
    productId: string,
    days: number = 30
  ): Promise<Array<{ date: string; quantity: number; type: string }>> {
    try {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - days);

      const movements = await db.stockMovements
        .where('[productId+timestamp]')
        .between([productId, startDate], [productId, today], true, true)
        .toArray();

      const product = await db.products.get(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Build timeline
      const timeline: Array<{ date: string; quantity: number; type: string }> = [];
      let currentQuantity = product.stockQuantity;

      // Work backwards from current quantity
      for (let i = movements.length - 1; i >= 0; i--) {
        const movement = movements[i];
        const dateKey = movement.timestamp.toISOString().split('T')[0];

        if (movement.type === 'in') {
          currentQuantity -= movement.quantity;
        } else if (movement.type === 'out') {
          currentQuantity += movement.quantity;
        }

        timeline.unshift({
          date: dateKey,
          quantity: currentQuantity,
          type: movement.type,
        });
      }

      // Add current quantity
      timeline.push({
        date: today.toISOString().split('T')[0],
        quantity: product.stockQuantity,
        type: 'current',
      });

      return timeline;
    } catch (error) {
      console.error('Error getting stock level trends:', error);
      throw new Error('Failed to retrieve stock level trends');
    }
  }

  /**
   * Get inventory health score
   */
  static async getInventoryHealthScore(): Promise<{
    score: number;
    factors: Array<{ name: string; score: number; weight: number }>;
    recommendations: string[];
  }> {
    try {
      const products = await db.products.where({ isActive: true }).toArray();
      const expiringProducts = await this.getExpiringProducts(90);
      const slowMovingProducts = await this.getSlowMovingProducts(90);

      // Calculate factors
      const outOfStockCount = products.filter(p => p.stockQuantity === 0).length;
      const lowStockCount = products.filter(p => 
        p.stockQuantity > 0 && p.stockQuantity <= p.reorderLevel
      ).length;

      const outOfStockScore = products.length > 0 
        ? Math.max(0, 100 - (outOfStockCount / products.length) * 100)
        : 100;

      const lowStockScore = products.length > 0
        ? Math.max(0, 100 - (lowStockCount / products.length) * 100)
        : 100;

      const expiryScore = products.length > 0
        ? Math.max(0, 100 - (expiringProducts.length / products.length) * 100)
        : 100;

      const slowMovingScore = products.length > 0
        ? Math.max(0, 100 - (slowMovingProducts.length / products.length) * 100)
        : 100;

      const factors = [
        { name: 'Stock Availability', score: outOfStockScore, weight: 0.3 },
        { name: 'Stock Levels', score: lowStockScore, weight: 0.25 },
        { name: 'Expiry Management', score: expiryScore, weight: 0.25 },
        { name: 'Inventory Turnover', score: slowMovingScore, weight: 0.2 },
      ];

      const score = factors.reduce((sum, f) => sum + (f.score * f.weight), 0);

      // Generate recommendations
      const recommendations: string[] = [];
      if (outOfStockScore < 80) {
        recommendations.push('Restock out-of-stock products immediately');
      }
      if (lowStockScore < 80) {
        recommendations.push('Review and adjust reorder levels for low-stock items');
      }
      if (expiryScore < 80) {
        recommendations.push('Implement promotional campaigns for products near expiry');
      }
      if (slowMovingScore < 80) {
        recommendations.push('Consider clearance sales for slow-moving inventory');
      }

      return {
        score: Math.round(score),
        factors,
        recommendations,
      };
    } catch (error) {
      console.error('Error calculating inventory health score:', error);
      throw new Error('Failed to calculate inventory health score');
    }
  }
}

export const {
  getInventoryValuation,
  getExpiringProducts,
  getSlowMovingProducts,
  getStockTurnover,
  getStockLevelTrends,
  getInventoryHealthScore,
} = InventoryAnalyticsService;
