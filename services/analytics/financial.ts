// Financial Analytics Service

import { db } from '@/lib/db/schema';
import type { Sale, Order, Invoice, Payment } from '@/types/database';

export interface FinancialMetrics {
  revenue: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  revenueGrowth: number;
  cogs: number;
  operatingExpenses: number;
  costPerOrder: number;
}

export interface RevenueBreakdown {
  byCategory: Array<{ category: string; revenue: number; percentage: number }>;
  byCustomerType: Array<{ type: string; revenue: number; percentage: number }>;
  bySalesPerson: Array<{ salesPerson: string; revenue: number; percentage: number }>;
}

export interface KPIs {
  inventoryTurnover: number;
  dso: number; // Days Sales Outstanding
  orderFulfillmentRate: number;
  customerAcquisitionCost: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
}

export interface CashFlowProjection {
  period: string;
  expectedInflow: number;
  expectedOutflow: number;
  netCashFlow: number;
}

export class FinancialAnalyticsService {
  /**
   * Get financial metrics for a period
   */
  static async getFinancialMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<FinancialMetrics> {
    try {
      const sales = await db.sales
        .where('saleDate')
        .between(startDate, endDate, true, true)
        .toArray();

      const revenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const cogs = sales.reduce((sum, sale) => sum + sale.costAmount, 0);
      const grossProfit = revenue - cogs;
      
      // Estimate operating expenses (10% of revenue for demo)
      const operatingExpenses = revenue * 0.1;
      const netProfit = grossProfit - operatingExpenses;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      // Calculate growth compared to previous period
      const periodLength = endDate.getTime() - startDate.getTime();
      const previousStart = new Date(startDate.getTime() - periodLength);
      const previousEnd = new Date(startDate);
      
      const previousSales = await db.sales
        .where('saleDate')
        .between(previousStart, previousEnd, true, true)
        .toArray();
      
      const previousRevenue = previousSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const revenueGrowth = previousRevenue > 0 
        ? ((revenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      const orders = await db.orders
        .where('orderDate')
        .between(startDate, endDate, true, true)
        .toArray();
      
      const costPerOrder = orders.length > 0 ? (cogs + operatingExpenses) / orders.length : 0;

      return {
        revenue,
        grossProfit,
        netProfit,
        profitMargin,
        revenueGrowth,
        cogs,
        operatingExpenses,
        costPerOrder,
      };
    } catch (error) {
      console.error('Error getting financial metrics:', error);
      throw new Error('Failed to retrieve financial metrics');
    }
  }

  /**
   * Get revenue breakdown by different dimensions
   */
  static async getRevenueBreakdown(
    startDate: Date,
    endDate: Date
  ): Promise<RevenueBreakdown> {
    try {
      const sales = await db.sales
        .where('saleDate')
        .between(startDate, endDate, true, true)
        .toArray();

      const orders = await db.orders
        .where('orderDate')
        .between(startDate, endDate, true, true)
        .toArray();

      const customers = await db.customers.toArray();
      const products = await db.products.toArray();

      const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

      // Revenue by category
      const categoryRevenue = new Map<string, number>();
      for (const order of orders) {
        for (const item of order.items) {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            const current = categoryRevenue.get(product.category) || 0;
            categoryRevenue.set(product.category, current + item.total);
          }
        }
      }

      const byCategory = Array.from(categoryRevenue.entries()).map(([category, revenue]) => ({
        category,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      })).sort((a, b) => b.revenue - a.revenue);

      // Revenue by customer type
      const typeRevenue = new Map<string, number>();
      for (const sale of sales) {
        const customer = customers.find(c => c.id === sale.customerId);
        if (customer) {
          const current = typeRevenue.get(customer.type) || 0;
          typeRevenue.set(customer.type, current + sale.totalAmount);
        }
      }

      const byCustomerType = Array.from(typeRevenue.entries()).map(([type, revenue]) => ({
        type,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      })).sort((a, b) => b.revenue - a.revenue);

      // Revenue by sales person
      const salesPersonRevenue = new Map<string, number>();
      for (const sale of sales) {
        const current = salesPersonRevenue.get(sale.salesPerson) || 0;
        salesPersonRevenue.set(sale.salesPerson, current + sale.totalAmount);
      }

      const bySalesPerson = Array.from(salesPersonRevenue.entries()).map(([salesPerson, revenue]) => ({
        salesPerson,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      })).sort((a, b) => b.revenue - a.revenue);

      return {
        byCategory,
        byCustomerType,
        bySalesPerson,
      };
    } catch (error) {
      console.error('Error getting revenue breakdown:', error);
      throw new Error('Failed to retrieve revenue breakdown');
    }
  }

  /**
   * Calculate key performance indicators
   */
  static async getKPIs(startDate: Date, endDate: Date): Promise<KPIs> {
    try {
      const sales = await db.sales
        .where('saleDate')
        .between(startDate, endDate, true, true)
        .toArray();

      const orders = await db.orders
        .where('orderDate')
        .between(startDate, endDate, true, true)
        .toArray();

      const invoices = await db.invoices.toArray();
      const products = await db.products.toArray();
      const inventory = await db.inventory.toArray();

      // Inventory Turnover = COGS / Average Inventory Value
      const cogs = sales.reduce((sum, sale) => sum + sale.costAmount, 0);
      const inventoryValue = inventory.reduce((sum, inv) => {
        const product = products.find(p => p.id === inv.productId);
        return sum + (product ? product.costPrice * inv.quantity : 0);
      }, 0);
      const inventoryTurnover = inventoryValue > 0 ? cogs / inventoryValue : 0;

      // Days Sales Outstanding (DSO)
      const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid');
      const totalReceivables = unpaidInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
      const revenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const periodDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const dso = revenue > 0 ? (totalReceivables / revenue) * periodDays : 0;

      // Order Fulfillment Rate
      const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
      const orderFulfillmentRate = orders.length > 0 ? (completedOrders / orders.length) * 100 : 0;

      // Customer Acquisition Cost (simplified)
      const newCustomers = await db.customers
        .where('createdAt')
        .between(startDate, endDate, true, true)
        .count();
      const marketingCost = revenue * 0.05; // Assume 5% of revenue for marketing
      const customerAcquisitionCost = newCustomers > 0 ? marketingCost / newCustomers : 0;

      // Average Order Value
      const totalOrderValue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const averageOrderValue = orders.length > 0 ? totalOrderValue / orders.length : 0;

      // Customer Lifetime Value (simplified)
      const customers = await db.customers.toArray();
      const avgLifetimeValue = customers.length > 0
        ? customers.reduce((sum, c) => sum + (c.lifetimeValue || 0), 0) / customers.length
        : 0;

      return {
        inventoryTurnover,
        dso,
        orderFulfillmentRate,
        customerAcquisitionCost,
        averageOrderValue,
        customerLifetimeValue: avgLifetimeValue,
      };
    } catch (error) {
      console.error('Error calculating KPIs:', error);
      throw new Error('Failed to calculate KPIs');
    }
  }

  /**
   * Project cash flow for future periods
   */
  static async getCashFlowProjection(days: number): Promise<CashFlowProjection[]> {
    try {
      const today = new Date();
      const projections: CashFlowProjection[] = [];

      // Get pending invoices
      const pendingInvoices = await db.invoices
        .where('status')
        .anyOf(['unpaid', 'partially-paid', 'overdue'])
        .toArray();

      // Get pending purchase orders
      const pendingPOs = await db.purchaseOrders
        .where('status')
        .anyOf(['sent', 'confirmed'])
        .toArray();

      // Project for 30, 60, 90 days
      const periods = [30, 60, 90].filter(p => p <= days);

      for (const period of periods) {
        const periodEnd = new Date(today);
        periodEnd.setDate(periodEnd.getDate() + period);

        // Expected inflow from invoices due within period
        const expectedInflow = pendingInvoices
          .filter(inv => inv.dueDate <= periodEnd)
          .reduce((sum, inv) => sum + inv.balanceAmount, 0);

        // Expected outflow from purchase orders expected within period
        const expectedOutflow = pendingPOs
          .filter(po => po.expectedDeliveryDate <= periodEnd)
          .reduce((sum, po) => sum + po.totalAmount, 0);

        projections.push({
          period: `${period} days`,
          expectedInflow,
          expectedOutflow,
          netCashFlow: expectedInflow - expectedOutflow,
        });
      }

      return projections;
    } catch (error) {
      console.error('Error projecting cash flow:', error);
      throw new Error('Failed to project cash flow');
    }
  }

  /**
   * Get revenue trend data for charts
   */
  static async getRevenueTrend(
    startDate: Date,
    endDate: Date,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<Array<{ date: string; revenue: number; profit: number }>> {
    try {
      const sales = await db.sales
        .where('saleDate')
        .between(startDate, endDate, true, true)
        .toArray();

      const dataMap = new Map<string, { revenue: number; profit: number }>();

      for (const sale of sales) {
        const dateKey = this.getDateKey(sale.saleDate, interval);
        const current = dataMap.get(dateKey) || { revenue: 0, profit: 0 };
        dataMap.set(dateKey, {
          revenue: current.revenue + sale.totalAmount,
          profit: current.profit + sale.profit,
        });
      }

      return Array.from(dataMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error getting revenue trend:', error);
      throw new Error('Failed to retrieve revenue trend');
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
  getFinancialMetrics,
  getRevenueBreakdown,
  getKPIs,
  getCashFlowProjection,
  getRevenueTrend,
} = FinancialAnalyticsService;
