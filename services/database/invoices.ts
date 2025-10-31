// Invoices Database Service

import { db } from '@/lib/db/schema';
import type { Invoice, InvoiceStatus, Order } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Invoices Service
 * Handles all database operations for invoices
 */
export class InvoicesService {
  /**
   * Get all invoices with optional filtering
   */
  static async getInvoices(filters?: {
    customerId?: string;
    status?: InvoiceStatus;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<Invoice[]> {
    let query = db.invoices.toCollection();

    if (filters?.customerId) {
      query = db.invoices.where({ customerId: filters.customerId });
    }

    let invoices = await query.toArray();

    // Apply additional filters
    if (filters?.status) {
      invoices = invoices.filter(i => i.status === filters.status);
    }

    if (filters?.fromDate) {
      invoices = invoices.filter(i => new Date(i.issueDate) >= filters.fromDate!);
    }

    if (filters?.toDate) {
      invoices = invoices.filter(i => new Date(i.issueDate) <= filters.toDate!);
    }

    // Sort by issue date (newest first)
    invoices.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

    return invoices;
  }

  /**
   * Get a single invoice by ID
   */
  static async getInvoiceById(id: string): Promise<Invoice | undefined> {
    return await db.invoices.get(id);
  }

  /**
   * Get invoice by order ID
   */
  static async getInvoiceByOrderId(orderId: string): Promise<Invoice | undefined> {
    return await db.invoices.where({ orderId }).first();
  }

  /**
   * Get invoices by customer ID
   */
  static async getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    return await db.invoices
      .where({ customerId })
      .reverse()
      .sortBy('issueDate');
  }

  /**
   * Create invoice from order
   */
  static async createInvoiceFromOrder(order: Order): Promise<Invoice> {
    // Check if invoice already exists
    const existing = await this.getInvoiceByOrderId(order.id);
    if (existing) {
      throw new Error('Invoice already exists for this order');
    }

    // Get customer to determine payment terms
    const customer = await db.customers.get(order.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Calculate due date based on payment terms
    const dueDate = this.calculateDueDate(customer.paymentTerms);

    // Generate invoice ID
    const invoiceId = await this.generateInvoiceId();

    const invoice: Invoice = {
      id: uuidv4(),
      invoiceId,
      orderId: order.id,
      customerId: order.customerId,
      issueDate: new Date(),
      dueDate,
      totalAmount: order.totalAmount,
      paidAmount: 0,
      balanceAmount: order.totalAmount,
      status: 'unpaid',
      paymentTerms: customer.paymentTerms,
      createdAt: new Date(),
    };

    await db.invoices.add(invoice);

    // Log action
    await this.logAction('invoice_created', invoice.id, invoice);

    return invoice;
  }

  /**
   * Create invoice manually
   */
  static async createInvoice(data: {
    orderId: string;
    customerId: string;
    totalAmount: number;
    paymentTerms: string;
    dueDate?: Date;
  }): Promise<Invoice> {
    const dueDate = data.dueDate || this.calculateDueDate(data.paymentTerms);
    const invoiceId = await this.generateInvoiceId();

    const invoice: Invoice = {
      id: uuidv4(),
      invoiceId,
      orderId: data.orderId,
      customerId: data.customerId,
      issueDate: new Date(),
      dueDate,
      totalAmount: data.totalAmount,
      paidAmount: 0,
      balanceAmount: data.totalAmount,
      status: 'unpaid',
      paymentTerms: data.paymentTerms,
      createdAt: new Date(),
    };

    await db.invoices.add(invoice);

    // Log action
    await this.logAction('invoice_created', invoice.id, invoice);

    return invoice;
  }

  /**
   * Update invoice payment
   */
  static async updateInvoicePayment(invoiceId: string, paymentAmount: number): Promise<Invoice> {
    const invoice = await db.invoices.get(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const newPaidAmount = invoice.paidAmount + paymentAmount;
    const newBalanceAmount = invoice.totalAmount - newPaidAmount;

    // Determine new status
    let newStatus: InvoiceStatus;
    if (newBalanceAmount <= 0) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partially-paid';
    } else {
      newStatus = invoice.status;
    }

    await db.invoices.update(invoiceId, {
      paidAmount: newPaidAmount,
      balanceAmount: Math.max(0, newBalanceAmount),
      status: newStatus,
    });

    const updated = await db.invoices.get(invoiceId);

    // Log action
    await this.logAction('invoice_payment_updated', invoiceId, {
      paymentAmount,
      newPaidAmount,
      newBalanceAmount,
      newStatus,
    });

    return updated!;
  }

  /**
   * Check and update overdue invoices
   */
  static async checkOverdueInvoices(): Promise<number> {
    const now = new Date();
    const invoices = await db.invoices
      .where('status')
      .anyOf(['unpaid', 'partially-paid'])
      .toArray();

    let overdueCount = 0;

    for (const invoice of invoices) {
      if (new Date(invoice.dueDate) < now && invoice.status !== 'overdue') {
        await db.invoices.update(invoice.id, { status: 'overdue' });
        overdueCount++;

        // Log action
        await this.logAction('invoice_marked_overdue', invoice.id, {
          dueDate: invoice.dueDate,
          balanceAmount: invoice.balanceAmount,
        });
      }
    }

    return overdueCount;
  }

  /**
   * Get invoice statistics
   */
  static async getInvoiceStats(customerId?: string): Promise<{
    total: number;
    unpaid: number;
    partiallyPaid: number;
    paid: number;
    overdue: number;
    totalOutstanding: number;
    totalOverdue: number;
  }> {
    let invoices: Invoice[];

    if (customerId) {
      invoices = await db.invoices.where({ customerId }).toArray();
    } else {
      invoices = await db.invoices.toArray();
    }

    const stats = {
      total: invoices.length,
      unpaid: invoices.filter(i => i.status === 'unpaid').length,
      partiallyPaid: invoices.filter(i => i.status === 'partially-paid').length,
      paid: invoices.filter(i => i.status === 'paid').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      totalOutstanding: invoices
        .filter(i => i.status !== 'paid')
        .reduce((sum, i) => sum + i.balanceAmount, 0),
      totalOverdue: invoices
        .filter(i => i.status === 'overdue')
        .reduce((sum, i) => sum + i.balanceAmount, 0),
    };

    return stats;
  }

  /**
   * Get accounts receivable aging report
   */
  static async getAgingReport(): Promise<{
    current: number; // 0-30 days
    days31to60: number;
    days61to90: number;
    over90: number;
  }> {
    const now = new Date();
    const invoices = await db.invoices
      .where('status')
      .anyOf(['unpaid', 'partially-paid', 'overdue'])
      .toArray();

    const aging = {
      current: 0,
      days31to60: 0,
      days61to90: 0,
      over90: 0,
    };

    for (const invoice of invoices) {
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysOverdue <= 30) {
        aging.current += invoice.balanceAmount;
      } else if (daysOverdue <= 60) {
        aging.days31to60 += invoice.balanceAmount;
      } else if (daysOverdue <= 90) {
        aging.days61to90 += invoice.balanceAmount;
      } else {
        aging.over90 += invoice.balanceAmount;
      }
    }

    return aging;
  }

  /**
   * Generate unique invoice ID
   */
  private static async generateInvoiceId(): Promise<string> {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const prefix = `INV-${year}${month}-`;

    // Get the last invoice for this month
    const lastInvoice = await db.invoices
      .where('invoiceId')
      .startsWith(prefix)
      .last();

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceId.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate due date from payment terms
   */
  private static calculateDueDate(paymentTerms: string): Date {
    const dueDate = new Date();

    // Parse payment terms (e.g., "Net 30", "Net 60")
    const match = paymentTerms.match(/\d+/);
    if (match) {
      const days = parseInt(match[0]);
      dueDate.setDate(dueDate.getDate() + days);
    } else {
      // Default to 30 days
      dueDate.setDate(dueDate.getDate() + 30);
    }

    return dueDate;
  }

  /**
   * Log action to system logs
   */
  private static async logAction(action: string, entityId: string, details: any): Promise<void> {
    try {
      await db.systemLogs.add({
        id: uuidv4(),
        action,
        entityType: 'invoice',
        entityId,
        details: JSON.stringify(details),
        userId: 'system', // TODO: Get from auth context
        timestamp: new Date(),
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  }
}
