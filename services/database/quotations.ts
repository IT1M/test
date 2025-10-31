// Quotations Database Service

import { db } from '@/lib/db/schema';
import type { Quotation, QuotationStatus, OrderItem } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Quotations Service
 * Handles all database operations for quotations
 */
export class QuotationsService {
  /**
   * Get all quotations with optional filtering
   */
  static async getQuotations(filters?: {
    customerId?: string;
    status?: QuotationStatus;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<Quotation[]> {
    let query = db.quotations.toCollection();

    if (filters?.customerId) {
      query = db.quotations.where({ customerId: filters.customerId });
    }

    let quotations = await query.toArray();

    // Apply additional filters
    if (filters?.status) {
      quotations = quotations.filter(q => q.status === filters.status);
    }

    if (filters?.fromDate) {
      quotations = quotations.filter(q => new Date(q.createdAt) >= filters.fromDate!);
    }

    if (filters?.toDate) {
      quotations = quotations.filter(q => new Date(q.createdAt) <= filters.toDate!);
    }

    // Sort by creation date (newest first)
    quotations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return quotations;
  }

  /**
   * Get a single quotation by ID
   */
  static async getQuotationById(id: string): Promise<Quotation | undefined> {
    return await db.quotations.get(id);
  }

  /**
   * Get quotations by customer ID
   */
  static async getQuotationsByCustomer(customerId: string): Promise<Quotation[]> {
    return await db.quotations
      .where({ customerId })
      .reverse()
      .sortBy('createdAt');
  }

  /**
   * Create a new quotation
   */
  static async createQuotation(data: {
    customerId: string;
    items: OrderItem[];
    discount?: number;
    tax?: number;
    validityDays?: number;
    termsAndConditions?: string;
  }): Promise<Quotation> {
    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
    const discount = data.discount || 0;
    const tax = data.tax || 0;
    const totalAmount = subtotal - discount + tax;

    // Calculate validity date (default 30 days)
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (data.validityDays || 30));

    // Generate quotation ID
    const quotationId = await this.generateQuotationId();

    const quotation: Quotation = {
      id: uuidv4(),
      quotationId,
      customerId: data.customerId,
      items: data.items,
      subtotal,
      discount,
      tax,
      totalAmount,
      validUntil,
      status: 'draft',
      termsAndConditions: data.termsAndConditions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.quotations.add(quotation);

    // Log action
    await this.logAction('quotation_created', quotation.id, quotation);

    return quotation;
  }

  /**
   * Update quotation
   */
  static async updateQuotation(
    id: string,
    updates: Partial<Omit<Quotation, 'id' | 'quotationId' | 'createdAt'>>
  ): Promise<Quotation> {
    const existing = await db.quotations.get(id);
    if (!existing) {
      throw new Error('Quotation not found');
    }

    // Recalculate totals if items changed
    if (updates.items) {
      const subtotal = updates.items.reduce((sum, item) => sum + item.total, 0);
      const discount = updates.discount ?? existing.discount;
      const tax = updates.tax ?? existing.tax;
      updates.subtotal = subtotal;
      updates.totalAmount = subtotal - discount + tax;
    }

    await db.quotations.update(id, {
      ...updates,
      updatedAt: new Date(),
    });

    const updated = await db.quotations.get(id);
    
    // Log action
    await this.logAction('quotation_updated', id, { before: existing, after: updated });

    return updated!;
  }

  /**
   * Update quotation status
   */
  static async updateQuotationStatus(id: string, status: QuotationStatus): Promise<Quotation> {
    const quotation = await db.quotations.get(id);
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    // Validate status transition
    this.validateStatusTransition(quotation.status, status);

    await db.quotations.update(id, {
      status,
      updatedAt: new Date(),
    });

    const updated = await db.quotations.get(id);

    // Log action
    await this.logAction('quotation_status_changed', id, {
      from: quotation.status,
      to: status,
    });

    return updated!;
  }

  /**
   * Convert quotation to order
   */
  static async convertToOrder(quotationId: string, orderId: string): Promise<void> {
    const quotation = await db.quotations.get(quotationId);
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    if (quotation.status !== 'approved') {
      throw new Error('Only approved quotations can be converted to orders');
    }

    await db.quotations.update(quotationId, {
      convertedToOrderId: orderId,
      updatedAt: new Date(),
    });

    // Log action
    await this.logAction('quotation_converted', quotationId, { orderId });
  }

  /**
   * Delete quotation (only drafts can be deleted)
   */
  static async deleteQuotation(id: string): Promise<void> {
    const quotation = await db.quotations.get(id);
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    if (quotation.status !== 'draft') {
      throw new Error('Only draft quotations can be deleted');
    }

    await db.quotations.delete(id);

    // Log action
    await this.logAction('quotation_deleted', id, quotation);
  }

  /**
   * Check and update expired quotations
   */
  static async checkExpiredQuotations(): Promise<number> {
    const now = new Date();
    const quotations = await db.quotations
      .where('status')
      .equals('sent')
      .toArray();

    let expiredCount = 0;

    for (const quotation of quotations) {
      if (new Date(quotation.validUntil) < now) {
        await this.updateQuotationStatus(quotation.id, 'expired');
        expiredCount++;
      }
    }

    return expiredCount;
  }

  /**
   * Get quotation statistics
   */
  static async getQuotationStats(customerId?: string): Promise<{
    total: number;
    draft: number;
    sent: number;
    approved: number;
    rejected: number;
    expired: number;
    conversionRate: number;
  }> {
    let quotations: Quotation[];

    if (customerId) {
      quotations = await db.quotations.where({ customerId }).toArray();
    } else {
      quotations = await db.quotations.toArray();
    }

    const stats = {
      total: quotations.length,
      draft: quotations.filter(q => q.status === 'draft').length,
      sent: quotations.filter(q => q.status === 'sent').length,
      approved: quotations.filter(q => q.status === 'approved').length,
      rejected: quotations.filter(q => q.status === 'rejected').length,
      expired: quotations.filter(q => q.status === 'expired').length,
      conversionRate: 0,
    };

    // Calculate conversion rate (approved / (sent + approved + rejected + expired))
    const totalProcessed = stats.sent + stats.approved + stats.rejected + stats.expired;
    if (totalProcessed > 0) {
      stats.conversionRate = (stats.approved / totalProcessed) * 100;
    }

    return stats;
  }

  /**
   * Generate unique quotation ID
   */
  private static async generateQuotationId(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `QUO-${year}-`;

    // Get the last quotation for this year
    const lastQuotation = await db.quotations
      .where('quotationId')
      .startsWith(prefix)
      .last();

    let nextNumber = 1;
    if (lastQuotation) {
      const lastNumber = parseInt(lastQuotation.quotationId.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Validate status transition
   */
  private static validateStatusTransition(from: QuotationStatus, to: QuotationStatus): void {
    const validTransitions: Record<QuotationStatus, QuotationStatus[]> = {
      draft: ['sent', 'rejected'],
      sent: ['approved', 'rejected', 'expired'],
      approved: [],
      rejected: [],
      expired: [],
    };

    if (!validTransitions[from].includes(to)) {
      throw new Error(`Invalid status transition from ${from} to ${to}`);
    }
  }

  /**
   * Log action to system logs
   */
  private static async logAction(action: string, entityId: string, details: any): Promise<void> {
    try {
      await db.systemLogs.add({
        id: uuidv4(),
        action,
        entityType: 'quotation',
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
