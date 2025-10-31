// Sales Service - Sales tracking and analytics

import { db } from '@/lib/db/schema';
import type { Sale, Order, PaginatedResult } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sales filters for search and filtering
 */
export interface SalesFilters {
  customerId?: string;
  salesPerson?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * SalesService - Handles all sales-related database operations
 */
export class SalesService {
  /**
   * Get all sales with optional filters
   */
  static async getSales(filters?: SalesFilters): Promise<Sale[]> {
    try {
      let query = db.sales.toCollection();

      // Apply filters
      if (filters?.customerId) {
        query = query.filter(s => s.customerId === filters.customerId);
      }

      if (filters?.salesPerson) {
        query = query.filter(s => s.salesPerson === filters.salesPerson);
      }

      if (filters?.startDate) {
        query = query.filter(s => s.saleDate >= filters.startDate!);
      }

      if (filters?.endDate) {
        query = query.filter(s => s.saleDate <= filters.endDate!);
      }

      if (filters?.minAmount !== undefined) {
        query = query.filter(s => s.totalAmount >= filters.minAmount!);
      }

      if (filters?.maxAmount !== undefined) {
        query = query.filter(s => s.totalAmount <= filters.maxAmount!);
      }

      return await query.reverse().sortBy('saleDate');
    } catch (error) {
      console.error('Error getting sales:', error);
      throw new Error('Failed to retrieve sales');
    }
  }

  /**
   * Get paginated sales
   */
  static async getPaginatedSales(
    page: number = 1,
    pageSize: number = 20,
    filters?: SalesFilters
  ): Promise<PaginatedResult<Sale>> {
    try {
      const allSales = await this.getSales(filters);
      const total = allSales.length;
      const totalPages = Math.ceil(total / pageSize);
      const offset = (page - 1) * pageSize;
      const data = allSales.slice(offset, offset + pageSize);

      return {
        data,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error('Error getting paginated sales:', error);
      throw new Error('Failed to retrieve paginated sales');
    }
  }

  /**
   * Get a single sale by ID
   */
  static async getSaleById(id: string): Promise<Sale | undefined> {
    try {
      return await db.sales.get(id);
    } catch (error) {
      console.error('Error getting sale by ID:', error);
      throw new Error(`Failed to retrieve sale with ID: ${id}`);
    }
  }

  /**
   * Get sale by order ID
   */
  static async getSaleByOrderId(orderId: string): Promise<Sale | undefined> {
    try {
      return await db.sales.where({ orderId }).first();
    } catch (error) {
      console.error('Error getting sale by order ID:', error);
      throw new Error(`Failed to retrieve sale for order: ${orderId}`);
    }
  }

  /**
   * Record a sale from an order
   */
  static async recordSale(order: Order): Promise<Sale> {
    try {
      // Check if sale already exists for this order
      const existing = await this.getSaleByOrderId(order.id);
      if (existing) {
        throw new Error(`Sale already recorded for order: ${order.orderId}`);
      }

      // Calculate cost amount
      const costAmount = await this.calculateOrderCost(order);

      // Calculate profit and margin
      const profit = order.totalAmount - costAmount;
      const profitMargin = order.totalAmount > 0 ? (profit / order.totalAmount) * 100 : 0;

      // Calculate commission (5% of total amount)
      const commission = order.totalAmount * 0.05;

      const sale: Sale = {
        id: uuidv4(),
        saleId: `SALE-${Date.now()}`,
        orderId: order.id,
        customerId: order.customerId,
        saleDate: new Date(),
        totalAmount: order.totalAmount,
        costAmount,
        profit,
        profitMargin,
        paymentMethod: order.paymentMethod || 'pending',
        salesPerson: order.salesPerson,
        commission,
        createdAt: new Date(),
      };

      await db.sales.add(sale);

      // Log the action
      await this.logAction('sale_recorded', sale.id, {
        saleId: sale.saleId,
        orderId: order.orderId,
        totalAmount: sale.totalAmount,
        profit: sale.profit,
      });

      return sale;
    } catch (error) {
      console.error('Error recording sale:', error);
      throw error;
    }
  }

  /**
   * Get sales by period
   */
  static async getSalesByPeriod(startDate: Date, endDate: Date): Promise<Sale[]> {
    try {
      return await db.sales
        .where('saleDate')
        .between(startDate, endDate, true, true)
        .reverse()
        .sortBy('saleDate');
    } catch (error) {
      console.error('Error getting sales by period:', error);
      throw new Error('Failed to retrieve sales by period');
    }
  }

  /**
   * Get sales by sales person
   */
  static async getSalesBySalesPerson(salesPerson: string): Promise<Sale[]> {
    try {
      return await db.sales
        .where({ salesPerson })
        .reverse()
        .sortBy('saleDate');
    } catch (error) {
      console.error('Error getting sales by sales person:', error);
      throw new Error(`Failed to retrieve sales for sales person: ${salesPerson}`);
    }
  }

  /**
   * Get sales by customer
   */
  static async getSalesByCustomer(customerId: string): Promise<Sale[]> {
    try {
      return await db.sales
        .where({ customerId })
        .reverse()
        .sortBy('saleDate');
    } catch (error) {
      console.error('Error getting sales by customer:', error);
      throw new Error(`Failed to retrieve sales for customer: ${customerId}`);
    }
  }

  /**
   * Calculate total revenue for a period
   */
  static async calculateRevenue(startDate: Date, endDate: Date): Promise<number> {
    try {
      const sales = await this.getSalesByPeriod(startDate, endDate);
      return sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    } catch (error) {
      console.error('Error calculating revenue:', error);
      throw new Error('Failed to calculate revenue');
    }
  }

  /**
   * Calculate total profit for a period
   */
  static async calculateProfit(startDate: Date, endDate: Date): Promise<number> {
    try {
      const sales = await this.getSalesByPeriod(startDate, endDate);
      return sales.reduce((sum, sale) => sum + sale.profit, 0);
    } catch (error) {
      console.error('Error calculating profit:', error);
      throw new Error('Failed to calculate profit');
    }
  }

  /**
   * Calculate average profit margin for a period
   */
  static async calculateAverageProfitMargin(startDate: Date, endDate: Date): Promise<number> {
    try {
      const sales = await this.getSalesByPeriod(startDate, endDate);
      if (sales.length === 0) return 0;

      const totalMargin = sales.reduce((sum, sale) => sum + sale.profitMargin, 0);
      return totalMargin / sales.length;
    } catch (error) {
      console.error('Error calculating average profit margin:', error);
      throw new Error('Failed to calculate average profit margin');
    }
  }

  /**
   * Get sales person performance
   */
  static async getSalesPersonPerformance(salesPerson: string, startDate?: Date, endDate?: Date): Promise<{
    totalSales: number;
    totalRevenue: number;
    totalProfit: number;
    totalCommission: number;
    averageOrderValue: number;
    profitMargin: number;
  }> {
    try {
      let sales = await this.getSalesBySalesPerson(salesPerson);

      // Filter by date range if provided
      if (startDate) {
        sales = sales.filter(s => s.saleDate >= startDate);
      }
      if (endDate) {
        sales = sales.filter(s => s.saleDate <= endDate);
      }

      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
      const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
      const totalCommission = sales.reduce((sum, s) => sum + s.commission, 0);
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      return {
        totalSales,
        totalRevenue,
        totalProfit,
        totalCommission,
        averageOrderValue,
        profitMargin,
      };
    } catch (error) {
      console.error('Error getting sales person performance:', error);
      throw new Error(`Failed to retrieve performance for sales person: ${salesPerson}`);
    }
  }

  /**
   * Get top sales people by revenue
   */
  static async getTopSalesPeople(limit: number = 10, startDate?: Date, endDate?: Date): Promise<Array<{
    salesPerson: string;
    totalRevenue: number;
    totalSales: number;
    totalCommission: number;
  }>> {
    try {
      let sales = await db.sales.toArray();

      // Filter by date range if provided
      if (startDate) {
        sales = sales.filter(s => s.saleDate >= startDate);
      }
      if (endDate) {
        sales = sales.filter(s => s.saleDate <= endDate);
      }

      // Group by sales person
      const salesByPerson: Record<string, Sale[]> = {};
      for (const sale of sales) {
        if (!salesByPerson[sale.salesPerson]) {
          salesByPerson[sale.salesPerson] = [];
        }
        salesByPerson[sale.salesPerson].push(sale);
      }

      // Calculate totals for each sales person
      const results = Object.entries(salesByPerson).map(([salesPerson, personSales]) => ({
        salesPerson,
        totalRevenue: personSales.reduce((sum, s) => sum + s.totalAmount, 0),
        totalSales: personSales.length,
        totalCommission: personSales.reduce((sum, s) => sum + s.commission, 0),
      }));

      // Sort by revenue and limit
      return results
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top sales people:', error);
      throw new Error('Failed to retrieve top sales people');
    }
  }

  /**
   * Get sales statistics
   */
  static async getSalesStats(startDate?: Date, endDate?: Date): Promise<{
    totalSales: number;
    totalRevenue: number;
    totalProfit: number;
    totalCost: number;
    averageOrderValue: number;
    averageProfitMargin: number;
    totalCommission: number;
  }> {
    try {
      let sales = await db.sales.toArray();

      // Filter by date range if provided
      if (startDate) {
        sales = sales.filter(s => s.saleDate >= startDate);
      }
      if (endDate) {
        sales = sales.filter(s => s.saleDate <= endDate);
      }

      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
      const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
      const totalCost = sales.reduce((sum, s) => sum + s.costAmount, 0);
      const totalCommission = sales.reduce((sum, s) => sum + s.commission, 0);
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
      const averageProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      return {
        totalSales,
        totalRevenue,
        totalProfit,
        totalCost,
        averageOrderValue,
        averageProfitMargin,
        totalCommission,
      };
    } catch (error) {
      console.error('Error getting sales stats:', error);
      throw new Error('Failed to retrieve sales statistics');
    }
  }

  /**
   * Get sales trend data (daily, weekly, or monthly)
   */
  static async getSalesTrend(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{
    period: string;
    revenue: number;
    profit: number;
    salesCount: number;
  }>> {
    try {
      const sales = await this.getSalesByPeriod(startDate, endDate);
      const trendData: Record<string, { revenue: number; profit: number; salesCount: number }> = {};

      for (const sale of sales) {
        const period = this.formatPeriod(sale.saleDate, groupBy);
        
        if (!trendData[period]) {
          trendData[period] = { revenue: 0, profit: 0, salesCount: 0 };
        }

        trendData[period].revenue += sale.totalAmount;
        trendData[period].profit += sale.profit;
        trendData[period].salesCount++;
      }

      return Object.entries(trendData)
        .map(([period, data]) => ({ period, ...data }))
        .sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
      console.error('Error getting sales trend:', error);
      throw new Error('Failed to retrieve sales trend');
    }
  }

  /**
   * Get top selling products
   */
  static async getTopSellingProducts(limit: number = 10, startDate?: Date, endDate?: Date): Promise<Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>> {
    try {
      let sales = await db.sales.toArray();

      // Filter by date range if provided
      if (startDate) {
        sales = sales.filter(s => s.saleDate >= startDate);
      }
      if (endDate) {
        sales = sales.filter(s => s.saleDate <= endDate);
      }

      // Get orders for these sales
      const orderIds = sales.map(s => s.orderId);
      const orders = await db.orders.bulkGet(orderIds);

      // Aggregate product sales
      const productSales: Record<string, { productName: string; quantitySold: number; revenue: number }> = {};

      for (const order of orders) {
        if (!order) continue;

        for (const item of order.items) {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              productName: item.productName,
              quantitySold: 0,
              revenue: 0,
            };
          }

          productSales[item.productId].quantitySold += item.quantity;
          productSales[item.productId].revenue += item.total;
        }
      }

      // Convert to array and sort
      return Object.entries(productSales)
        .map(([productId, data]) => ({ productId, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top selling products:', error);
      throw new Error('Failed to retrieve top selling products');
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Calculate order cost from products
   */
  private static async calculateOrderCost(order: Order): Promise<number> {
    let totalCost = 0;

    for (const item of order.items) {
      const product = await db.products.get(item.productId);
      if (product) {
        totalCost += product.costPrice * item.quantity;
      }
    }

    return totalCost;
  }

  /**
   * Format date period for trend analysis
   */
  private static formatPeriod(date: Date, groupBy: 'day' | 'week' | 'month'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (groupBy) {
      case 'day':
        return `${year}-${month}-${day}`;
      case 'week':
        const weekNumber = this.getWeekNumber(date);
        return `${year}-W${String(weekNumber).padStart(2, '0')}`;
      case 'month':
        return `${year}-${month}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }

  /**
   * Get week number of the year
   */
  private static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Log an action to system logs
   */
  private static async logAction(action: string, entityId: string, details: any): Promise<void> {
    try {
      await db.systemLogs.add({
        id: uuidv4(),
        action,
        entityType: 'sale',
        entityId,
        details: JSON.stringify(details),
        userId: 'system', // In real implementation, get from auth context
        timestamp: new Date(),
        status: 'success',
      });
    } catch (error) {
      console.error('Error logging action:', error);
      // Don't throw - logging failures shouldn't break the main operation
    }
  }
}

// Export convenience functions
export const {
  getSales,
  getPaginatedSales,
  getSaleById,
  getSaleByOrderId,
  recordSale,
  getSalesByPeriod,
  getSalesBySalesPerson,
  getSalesByCustomer,
  calculateRevenue,
  calculateProfit,
  calculateAverageProfitMargin,
  getSalesPersonPerformance,
  getTopSalesPeople,
  getSalesStats,
  getSalesTrend,
  getTopSellingProducts,
} = SalesService;
