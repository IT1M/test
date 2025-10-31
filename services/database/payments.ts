// Payments Database Service

import { db } from '@/lib/db/schema';
import { InvoicesService } from './invoices';
import type { Payment } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Payments Service
 * Handles all database operations for payments
 */
export class PaymentsService {
  /**
   * Get all payments with optional filtering
   */
  static async getPayments(filters?: {
    customerId?: string;
    invoiceId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<Payment[]> {
    let query = db.payments.toCollection();

    if (filters?.customerId) {
      query = db.payments.where({ customerId: filters.customerId });
    } else if (filters?.invoiceId) {
      query = db.payments.where({ invoiceId: filters.invoiceId });
    }

    let payments = await query.toArray();

    // Apply additional filters
    if (filters?.fromDate) {
      payments = payments.filter(p => new Date(p.paymentDate) >= filters.fromDate!);
    }

    if (filters?.toDate) {
      payments = payments.filter(p => new Date(p.paymentDate) <= filters.toDate!);
    }

    // Sort by payment date (newest first)
    payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    return payments;
  }

  /**
   * Get a single payment by ID
   */
  static async getPaymentById(id: string): Promise<Payment | undefined> {
    return await db.payments.get(id);
  }

  /**
   * Get payments by invoice ID
   */
  static async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    return await db.payments
      .where({ invoiceId })
      .reverse()
      .sortBy('paymentDate');
  }

  /**
   * Get payments by customer ID
   */
  static async getPaymentsByCustomer(customerId: string): Promise<Payment[]> {
    return await db.payments
      .where({ customerId })
      .reverse()
      .sortBy('paymentDate');
  }

  /**
   * Record a new payment
   */
  static async recordPayment(data: {
    invoiceId: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: string;
    referenceNumber: string;
    notes?: string;
  }): Promise<Payment> {
    // Get invoice
    const invoice = await db.invoices.get(data.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Validate payment amount
    if (data.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    if (data.amount > invoice.balanceAmount) {
      throw new Error('Payment amount exceeds invoice balance');
    }

    // Generate payment ID
    const paymentId = await this.generatePaymentId();

    // Create payment record
    const payment: Payment = {
      id: uuidv4(),
      paymentId,
      invoiceId: data.invoiceId,
      customerId: invoice.customerId,
      amount: data.amount,
      paymentDate: data.paymentDate,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      notes: data.notes,
      createdAt: new Date(),
    };

    await db.payments.add(payment);

    // Update invoice
    await InvoicesService.updateInvoicePayment(data.invoiceId, data.amount);

    // Update customer balance
    await this.updateCustomerBalance(invoice.customerId);

    // Update order payment status
    await this.updateOrderPaymentStatus(invoice.orderId);

    // Send notification
    await this.sendPaymentConfirmation(payment);

    // Log action
    await this.logAction('payment_recorded', payment.id, payment);

    return payment;
  }

  /**
   * Update customer balance
   */
  private static async updateCustomerBalance(customerId: string): Promise<void> {
    // Calculate total outstanding balance
    const invoices = await db.invoices.where({ customerId }).toArray();
    const totalOutstanding = invoices
      .filter(i => i.status !== 'paid')
      .reduce((sum, i) => sum + i.balanceAmount, 0);

    // Update customer record (if you have a balance field)
    // This is a placeholder - implement based on your customer schema
    await this.logAction('customer_balance_updated', customerId, {
      totalOutstanding,
    });
  }

  /**
   * Update order payment status
   */
  private static async updateOrderPaymentStatus(orderId: string): Promise<void> {
    const invoice = await db.invoices.where({ orderId }).first();
    if (!invoice) return;

    const order = await db.orders.get(orderId);
    if (!order) return;

    let paymentStatus: 'unpaid' | 'partially-paid' | 'paid' | 'overdue';

    if (invoice.status === 'paid') {
      paymentStatus = 'paid';
    } else if (invoice.paidAmount > 0) {
      paymentStatus = 'partially-paid';
    } else if (invoice.status === 'overdue') {
      paymentStatus = 'overdue';
    } else {
      paymentStatus = 'unpaid';
    }

    await db.orders.update(orderId, { paymentStatus });
  }

  /**
   * Send payment confirmation notification
   */
  private static async sendPaymentConfirmation(payment: Payment): Promise<void> {
    // Get invoice and customer
    const invoice = await db.invoices.get(payment.invoiceId);
    if (!invoice) return;

    const customer = await db.customers.get(payment.customerId);
    if (!customer) return;

    // Log notification (in a real app, this would send an email/SMS)
    await this.logAction('payment_confirmation_sent', payment.id, {
      customerId: customer.id,
      customerEmail: customer.email,
      amount: payment.amount,
      invoiceId: invoice.invoiceId,
    });
  }

  /**
   * Get payment statistics
   */
  static async getPaymentStats(customerId?: string): Promise<{
    totalPayments: number;
    totalAmount: number;
    averagePayment: number;
    paymentsByMethod: Record<string, number>;
  }> {
    let payments: Payment[];

    if (customerId) {
      payments = await db.payments.where({ customerId }).toArray();
    } else {
      payments = await db.payments.toArray();
    }

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const averagePayment = payments.length > 0 ? totalAmount / payments.length : 0;

    // Group by payment method
    const paymentsByMethod: Record<string, number> = {};
    payments.forEach(payment => {
      paymentsByMethod[payment.paymentMethod] =
        (paymentsByMethod[payment.paymentMethod] || 0) + payment.amount;
    });

    return {
      totalPayments: payments.length,
      totalAmount,
      averagePayment,
      paymentsByMethod,
    };
  }

  /**
   * Generate unique payment ID
   */
  private static async generatePaymentId(): Promise<string> {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const prefix = `PAY-${year}${month}-`;

    // Get the last payment for this month
    const lastPayment = await db.payments
      .where('paymentId')
      .startsWith(prefix)
      .last();

    let nextNumber = 1;
    if (lastPayment) {
      const lastNumber = parseInt(lastPayment.paymentId.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Log action to system logs
   */
  private static async logAction(action: string, entityId: string, details: any): Promise<void> {
    try {
      await db.systemLogs.add({
        id: uuidv4(),
        action,
        entityType: 'payment',
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
