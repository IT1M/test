// Customer Analytics Service

import { db } from '@/lib/db/schema';
import type { Customer, Order, Sale } from '@/types/database';

export interface CustomerAcquisitionData {
  date: string;
  newCustomers: number;
  totalCustomers: number;
}

export interface CustomerRetentionData {
  period: string;
  retentionRate: number;
  churnRate: number;
  activeCustomers: number;
}

export interface TopCustomer {
  customerId: string;
  customerName: string;
  type: string;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  lifetimeValue: number;
}

export interface PaymentBehavior {
  customerId: string;
  customerName: string;
  averagePaymentDays: number;
  onTimePaymentRate: number;
  totalOutstanding: number;
  creditUtilization: number;
}

export class CustomerAnalyticsService {
  /**
   * Get customer acquisition trends
   */
  static async getCustomerAcquisitionTrends(
    startDate: Date,
    endDate: Date
  ): Promise<CustomerAcquisitionData[]> {
    try {
      const customers = await db.customers.toArray();
      const dataMap = new Map<string, number>();

      // Count new customers by date
      for (const customer of customers) {
        if (customer.createdAt >= startDate && customer.createdAt <= endDate) {
          const dateKey = customer.createdAt.toISOString().split('T')[0];
          dataMap.set(dateKey, (dataMap.get(dateKey) || 0) + 1);
        }
      }

      // Build cumulative data
      const sortedDates = Array.from(dataMap.keys()).sort();
      let totalCustomers = customers.filter(c => c.createdAt < startDate).length;

      return sortedDates.map(date => {
        const newCustomers = dataMap.get(date) || 0;
        totalCustomers += newCustomers;
        return {
          date,
          newCustomers,
          totalCustomers,
        };
      });
    } catch (error) {
      console.error('Error getting customer acquisition trends:', error);
      throw new Error('Failed to retrieve customer acquisition trends');
    }
  }

  /**
   * Calculate customer retention rate
   */
  static async getCustomerRetention(
    startDate: Date,
    endDate: Date
  ): Promise<CustomerRetentionData> {
    try {
      const customers = await db.customers.toArray();
      const orders = await db.orders
        .where('orderDate')
        .between(startDate, endDate, true, true)
        .toArray();

      // Get customers who made purchases in the period
      const activeCustomerIds = new Set(orders.map(o => o.customerId));
      const activeCustomers = activeCustomerIds.size;

      // Get customers who existed before the period
      const existingCustomers = customers.filter(c => c.createdAt < startDate).length;

      // Calculate retention rate
      const retentionRate = existingCustomers > 0 
        ? (activeCustomers / existingCustomers) * 100 
        : 0;

      const churnRate = 100 - retentionRate;

      return {
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        retentionRate,
        churnRate,
        activeCustomers,
      };
    } catch (error) {
      console.error('Error calculating customer retention:', error);
      throw new Error('Failed to calculate customer retention');
    }
  }

  /**
   * Get top customers by revenue
   */
  static async getTopCustomers(
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<TopCustomer[]> {
    try {
      const customers = await db.customers.toArray();
      const sales = await db.sales
        .where('saleDate')
        .between(startDate, endDate, true, true)
        .toArray();

      const customerData = new Map<string, {
        revenue: number;
        orderCount: number;
      }>();

      // Aggregate sales by customer
      for (const sale of sales) {
        const current = customerData.get(sale.customerId) || {
          revenue: 0,
          orderCount: 0,
        };

        customerData.set(sale.customerId, {
          revenue: current.revenue + sale.totalAmount,
          orderCount: current.orderCount + 1,
        });
      }

      // Build top customers list
      const topCustomers: TopCustomer[] = Array.from(customerData.entries())
        .map(([customerId, data]) => {
          const customer = customers.find(c => c.id === customerId);
          const averageOrderValue = data.orderCount > 0 ? data.revenue / data.orderCount : 0;

          return {
            customerId,
            customerName: customer?.name || 'Unknown',
            type: customer?.type || 'unknown',
            totalRevenue: data.revenue,
            orderCount: data.orderCount,
            averageOrderValue,
            lifetimeValue: customer?.lifetimeValue || data.revenue,
          };
        })
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit);

      return topCustomers;
    } catch (error) {
      console.error('Error getting top customers:', error);
      throw new Error('Failed to retrieve top customers');
    }
  }

  /**
   * Analyze customer payment behavior
   */
  static async getPaymentBehavior(): Promise<PaymentBehavior[]> {
    try {
      const customers = await db.customers.toArray();
      const invoices = await db.invoices.toArray();
      const payments = await db.payments.toArray();

      const behaviorData: PaymentBehavior[] = [];

      for (const customer of customers) {
        const customerInvoices = invoices.filter(inv => inv.customerId === customer.id);
        const customerPayments = payments.filter(p => p.customerId === customer.id);

        if (customerInvoices.length === 0) continue;

        // Calculate average payment days
        let totalPaymentDays = 0;
        let paidInvoicesCount = 0;
        let onTimePayments = 0;

        for (const invoice of customerInvoices) {
          const invoicePayments = customerPayments.filter(p => p.invoiceId === invoice.id);
          
          if (invoicePayments.length > 0) {
            const firstPayment = invoicePayments.sort((a, b) => 
              a.paymentDate.getTime() - b.paymentDate.getTime()
            )[0];

            const paymentDays = Math.floor(
              (firstPayment.paymentDate.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            totalPaymentDays += paymentDays;
            paidInvoicesCount++;

            const dueDays = Math.floor(
              (invoice.dueDate.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (paymentDays <= dueDays) {
              onTimePayments++;
            }
          }
        }

        const averagePaymentDays = paidInvoicesCount > 0 ? totalPaymentDays / paidInvoicesCount : 0;
        const onTimePaymentRate = paidInvoicesCount > 0 ? (onTimePayments / paidInvoicesCount) * 100 : 0;

        // Calculate outstanding balance
        const totalOutstanding = customerInvoices
          .filter(inv => inv.status !== 'paid')
          .reduce((sum, inv) => sum + inv.balanceAmount, 0);

        // Calculate credit utilization
        const creditUtilization = customer.creditLimit > 0 
          ? (totalOutstanding / customer.creditLimit) * 100 
          : 0;

        behaviorData.push({
          customerId: customer.id,
          customerName: customer.name,
          averagePaymentDays,
          onTimePaymentRate,
          totalOutstanding,
          creditUtilization,
        });
      }

      return behaviorData.sort((a, b) => b.totalOutstanding - a.totalOutstanding);
    } catch (error) {
      console.error('Error analyzing payment behavior:', error);
      throw new Error('Failed to analyze payment behavior');
    }
  }

  /**
   * Get customer geographic distribution
   */
  static async getGeographicDistribution(): Promise<Array<{
    country: string;
    city: string;
    customerCount: number;
    revenue: number;
  }>> {
    try {
      const customers = await db.customers.toArray();
      const sales = await db.sales.toArray();

      const locationData = new Map<string, {
        customerCount: number;
        revenue: number;
      }>();

      for (const customer of customers) {
        const key = `${customer.country}|${customer.city}`;
        const current = locationData.get(key) || {
          customerCount: 0,
          revenue: 0,
        };

        const customerSales = sales.filter(s => s.customerId === customer.id);
        const customerRevenue = customerSales.reduce((sum, s) => sum + s.totalAmount, 0);

        locationData.set(key, {
          customerCount: current.customerCount + 1,
          revenue: current.revenue + customerRevenue,
        });
      }

      return Array.from(locationData.entries())
        .map(([key, data]) => {
          const [country, city] = key.split('|');
          return {
            country,
            city,
            customerCount: data.customerCount,
            revenue: data.revenue,
          };
        })
        .sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      console.error('Error getting geographic distribution:', error);
      throw new Error('Failed to retrieve geographic distribution');
    }
  }
}

export const {
  getCustomerAcquisitionTrends,
  getCustomerRetention,
  getTopCustomers,
  getPaymentBehavior,
  getGeographicDistribution,
} = CustomerAnalyticsService;
