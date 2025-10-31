// Sales Analytics Service

import { db } from '@/lib/db/schema';
import type { Sale, Order, Product, Customer } from '@/types/database';

export interface TopProduct {
  productId: string;
  productName: string;
  sku: string;
  salesVolume: number;
  revenue: number;
  profit: number;
  profitMargin: number;
}

export interface SalesByCustomer {
  customerId: string;
  customerName: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
}

export interface SalesBySalesPerson {
  salesPerson: string;
  orderCount: number;
  revenue: number;
  profit: number;
  commission: number;
  averageOrderValue: number;
}

export interface SalesPipeline {
  quotations: {
    count: number;
    value: number;
  };
  pendingOrders: {
    count: number;
    value: number;
  };
  expectedRevenue: number;
  conversionRate: number;
}

export interface SalesTrend {
  date: string;
  sales: number;
  orders: number;
  averageOrderValue: number;
}

export class SalesAnalyticsService {
  /**
   * Get top-selling products
   */
  static async getTopProducts(
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<TopProduct[]> {
    try {
      const orders = await db.orders
        .where('orderDate')
        .between(startDate, endDate, true, true)
        .toArray();

      const products = await db.products.toArray();
      const productSales = new Map<string, {
        volume: number;
        revenue: number;
        cost: number;
      }>();

      // Aggregate sales by product
      for (const order of orders) {
        for (const item of order.items) {
          const current = productSales.get(item.productId) || {
            volume: 0,
            revenue: 0,
            cost: 0,
          };

          const product = products.find(p => p.id === item.productId);
          const cost = product ? product.costPrice * item.quantity : 0;

          productSales.set(item.productId, {
            volume: current.volume + item.quantity,
            revenue: current.revenue + item.total,
            cost: current.cost + cost,
          });
        }
      }

      // Convert to array and sort by revenue
      const topProducts: TopProduct[] = Array.from(productSales.entries())
        .map(([productId, data]) => {
          const product = products.find(p => p.id === productId);
          const profit = data.revenue - data.cost;
          const profitMargin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;

          return {
            productId,
            productName: product?.name || 'Unknown',
            sku: product?.sku || 'N/A',
            salesVolume: data.volume,
            revenue: data.revenue,
            profit,
            profitMargin,
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);

      return topProducts;
    } catch (error) {
      console.error('Error getting top products:', error);
      throw new Error('Failed to retrieve top products');
    }
  }

  /**
   * Get sales by customer
   */
  static async getSalesByCustomer(
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<SalesByCustomer[]> {
    try {
      const sales = await db.sales
        .where('saleDate')
        .between(startDate, endDate, true, true)
        .toArray();

      const customers = await db.customers.toArray();
      const customerSales = new Map<string, {
        orderCount: number;
        revenue: number;
      }>();

      // Aggregate sales by customer
      for (const sale of sales) {
        const current = customerSales.get(sale.customerId) || {
          orderCount: 0,
          revenue: 0,
        };

        customerSales.set(sale.customerId, {
          orderCount: current.orderCount + 1,
          revenue: current.revenue + sale.totalAmount,
        });
      }

      // Convert to array and sort by revenue
      const salesByCustomer: SalesByCustomer[] = Array.from(customerSales.entries())
        .map(([customerId, data]) => {
          const customer = customers.find(c => c.id === customerId);
          const averageOrderValue = data.orderCount > 0 ? data.revenue / data.orderCount : 0;

          return {
            customerId,
            customerName: customer?.name || 'Unknown',
            orderCount: data.orderCount,
            revenue: data.revenue,
            averageOrderValue,
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);

      return salesByCustomer;
    } catch (error) {
      console.error('Error getting sales by customer:', error);
      throw new Error('Failed to retrieve sales by customer');
    }
  }

  /**
   * Get sales by sales person
   */
  static async getSalesBySalesPerson(
    startDate: Date,
    endDate: Date
  ): Promise<SalesBySalesPerson[]> {
    try {
      const sales = await db.sales
        .where('saleDate')
        .between(startDate, endDate, true, true)
        .toArray();

      const salesPersonData = new Map<string, {
        orderCount: number;
        revenue: number;
        profit: number;
        commission: number;
      }>();

      // Aggregate sales by sales person
      for (const sale of sales) {
        const current = salesPersonData.get(sale.salesPerson) || {
          orderCount: 0,
          revenue: 0,
          profit: 0,
          commission: 0,
        };

        salesPersonData.set(sale.salesPerson, {
          orderCount: current.orderCount + 1,
          revenue: current.revenue + sale.totalAmount,
          profit: current.profit + sale.profit,
          commission: current.commission + sale.commission,
        });
      }

      // Convert to array and sort by revenue
      const salesBySalesPerson: SalesBySalesPerson[] = Array.from(salesPersonData.entries())
        .map(([salesPerson, data]) => {
          const averageOrderValue = data.orderCount > 0 ? data.revenue / data.orderCount : 0;

          return {
            salesPerson,
            orderCount: data.orderCount,
            revenue: data.revenue,
            profit: data.profit,
            commission: data.commission,
            averageOrderValue,
          };
        })
        .sort((a, b) => b.revenue - a.revenue);

      return salesBySalesPerson;
    } catch (error) {
      console.error('Error getting sales by sales person:', error);
      throw new Error('Failed to retrieve sales by sales person');
    }
  }

  /**
   * Get sales pipeline data
   */
  static async getSalesPipeline(): Promise<SalesPipeline> {
    try {
      const quotations = await db.quotations
        .where('status')
        .anyOf(['draft', 'sent'])
        .toArray();

      const pendingOrders = await db.orders
        .where('status')
        .anyOf(['pending', 'confirmed'])
        .toArray();

      const allQuotations = await db.quotations.toArray();
      const convertedQuotations = allQuotations.filter(q => q.convertedToOrderId).length;
      const conversionRate = allQuotations.length > 0 
        ? (convertedQuotations / allQuotations.length) * 100 
        : 0;

      const quotationsValue = quotations.reduce((sum, q) => sum + q.totalAmount, 0);
      const pendingOrdersValue = pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      return {
        quotations: {
          count: quotations.length,
          value: quotationsValue,
        },
        pendingOrders: {
          count: pendingOrders.length,
          value: pendingOrdersValue,
        },
        expectedRevenue: quotationsValue * (conversionRate / 100) + pendingOrdersValue,
        conversionRate,
      };
    } catch (error) {
      console.error('Error getting sales pipeline:', error);
      throw new Error('Failed to retrieve sales pipeline');
    }
  }

  /**
   * Get sales trend data
   */
  static async getSalesTrend(
    startDate: Date,
    endDate: Date,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<SalesTrend[]> {
    try {
      const sales = await db.sales
        .where('saleDate')
        .between(startDate, endDate, true, true)
        .toArray();

      const orders = await db.orders
        .where('orderDate')
        .between(startDate, endDate, true, true)
        .toArray();

      const dataMap = new Map<string, {
        sales: number;
        orders: number;
        totalValue: number;
      }>();

      // Aggregate sales data
      for (const sale of sales) {
        const dateKey = this.getDateKey(sale.saleDate, interval);
        const current = dataMap.get(dateKey) || {
          sales: 0,
          orders: 0,
          totalValue: 0,
        };

        dataMap.set(dateKey, {
          sales: current.sales + sale.totalAmount,
          orders: current.orders + 1,
          totalValue: current.totalValue + sale.totalAmount,
        });
      }

      // Convert to array and calculate averages
      const trend: SalesTrend[] = Array.from(dataMap.entries())
        .map(([date, data]) => ({
          date,
          sales: data.sales,
          orders: data.orders,
          averageOrderValue: data.orders > 0 ? data.totalValue / data.orders : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return trend;
    } catch (error) {
      console.error('Error getting sales trend:', error);
      throw new Error('Failed to retrieve sales trend');
    }
  }

  /**
   * Detect seasonal patterns in sales
   */
  static async detectSeasonalPatterns(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ month: string; averageSales: number; pattern: string }>> {
    try {
      const sales = await db.sales
        .where('saleDate')
        .between(startDate, endDate, true, true)
        .toArray();

      const monthlyData = new Map<number, number[]>();

      // Group sales by month
      for (const sale of sales) {
        const month = new Date(sale.saleDate).getMonth();
        if (!monthlyData.has(month)) {
          monthlyData.set(month, []);
        }
        monthlyData.get(month)!.push(sale.totalAmount);
      }

      // Calculate averages and detect patterns
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      const patterns = Array.from(monthlyData.entries()).map(([month, values]) => {
        const averageSales = values.reduce((sum, v) => sum + v, 0) / values.length;
        const allAverages = Array.from(monthlyData.values()).map(vals => 
          vals.reduce((sum, v) => sum + v, 0) / vals.length
        );
        const overallAverage = allAverages.reduce((sum, v) => sum + v, 0) / allAverages.length;

        let pattern = 'Normal';
        if (averageSales > overallAverage * 1.2) {
          pattern = 'Peak Season';
        } else if (averageSales < overallAverage * 0.8) {
          pattern = 'Low Season';
        }

        return {
          month: monthNames[month],
          averageSales,
          pattern,
        };
      });

      return patterns.sort((a, b) => 
        monthNames.indexOf(a.month) - monthNames.indexOf(b.month)
      );
    } catch (error) {
      console.error('Error detecting seasonal patterns:', error);
      throw new Error('Failed to detect seasonal patterns');
    }
  }

  /**
   * Helper to format date based on interval
   */
  private static getDateKey(date: Date, interval: 'daily' | 'weekly' | 'monthly'): string {
    const d = new Date(date);
    
    if (interval === 'daily') {
      return d.toISOString().split('T')[0];
    } else if (interval === 'weekly') {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      return weekStart.toISOString().split('T')[0];
    } else {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
  }
}

export const {
  getTopProducts,
  getSalesByCustomer,
  getSalesBySalesPerson,
  getSalesPipeline,
  getSalesTrend,
  detectSeasonalPatterns,
} = SalesAnalyticsService;
