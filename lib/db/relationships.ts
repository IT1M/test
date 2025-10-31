// Database Relationship Manager for Medical Products Company Management System

import { db } from './schema';
import type {
  Order,
  Payment,
  Customer,
  Product,
  Inventory,
  StockMovement,
  Invoice,
  Sale,
  SystemLog,
  PurchaseOrder,
} from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * RelationshipManager handles all cascade operations and data synchronization
 * across related database entities to maintain referential integrity.
 */
export class RelationshipManager {
  /**
   * Handle order creation - reserve inventory and create stock movements
   */
  static async onOrderCreated(order: Order): Promise<void> {
    try {
      await db.transaction('rw', [db.inventory, db.stockMovements, db.customers, db.systemLogs], async () => {
        // 1. Reserve inventory for each order item
        for (const item of order.items) {
          await this.reserveInventory(item.productId, item.quantity, order.orderId);
        }

        // 2. Create stock movements for tracking
        await this.createStockMovements(order);

        // 3. Update customer stats
        await this.updateCustomerStats(order.customerId);

        // 4. Log the action
        await this.logAction('order_created', 'order', order.id, {
          orderId: order.orderId,
          customerId: order.customerId,
          totalAmount: order.totalAmount,
          itemCount: order.items.length,
        });
      });
    } catch (error) {
      await this.logError('onOrderCreated', error as Error, { orderId: order.id });
      throw error;
    }
  }

  /**
   * Handle order cancellation - release reserved inventory
   */
  static async onOrderCancelled(order: Order): Promise<void> {
    try {
      await db.transaction('rw', [db.inventory, db.stockMovements, db.customers, db.systemLogs], async () => {
        // 1. Release reserved inventory
        for (const item of order.items) {
          await this.releaseInventory(item.productId, item.quantity, order.orderId);
        }

        // 2. Reverse stock movements
        await this.reverseStockMovements(order);

        // 3. Update customer stats
        await this.updateCustomerStats(order.customerId);

        // 4. Log the action
        await this.logAction('order_cancelled', 'order', order.id, {
          orderId: order.orderId,
          customerId: order.customerId,
          reason: 'Order cancelled by user',
        });
      });
    } catch (error) {
      await this.logError('onOrderCancelled', error as Error, { orderId: order.id });
      throw error;
    }
  }

  /**
   * Handle payment recording - update invoice and customer balance
   */
  static async onPaymentRecorded(payment: Payment): Promise<void> {
    try {
      await db.transaction('rw', [db.invoices, db.customers, db.orders, db.systemLogs], async () => {
        // 1. Update invoice status
        await this.updateInvoiceStatus(payment.invoiceId, payment.amount);

        // 2. Update customer balance
        await this.updateCustomerBalance(payment.customerId, payment.amount);

        // 3. Check if order is fully paid
        await this.checkOrderPaymentStatus(payment.invoiceId);

        // 4. Log the action
        await this.logAction('payment_recorded', 'payment', payment.id, {
          paymentId: payment.paymentId,
          invoiceId: payment.invoiceId,
          amount: payment.amount,
        });
      });
    } catch (error) {
      await this.logError('onPaymentRecorded', error as Error, { paymentId: payment.id });
      throw error;
    }
  }

  /**
   * Handle product price change - maintain price history
   */
  static async onProductPriceChanged(productId: string, oldPrice: number, newPrice: number, userId: string): Promise<void> {
    try {
      await db.transaction('rw', [db.systemLogs], async () => {
        // Save price history in system logs
        await this.logAction('product_price_changed', 'product', productId, {
          oldPrice,
          newPrice,
          changePercentage: ((newPrice - oldPrice) / oldPrice * 100).toFixed(2) + '%',
          changedBy: userId,
        });
      });
    } catch (error) {
      await this.logError('onProductPriceChanged', error as Error, { productId });
      throw error;
    }
  }

  /**
   * Handle low stock detection - create draft purchase order
   */
  static async onLowStockDetected(productId: string): Promise<void> {
    try {
      const product = await db.products.get(productId);
      if (!product) return;

      await db.transaction('rw', [db.purchaseOrders, db.systemLogs], async () => {
        // Create draft purchase order
        const reorderQuantity = Math.max(product.reorderLevel * 2, 100); // Order 2x reorder level or minimum 100

        const purchaseOrder: PurchaseOrder = {
          id: uuidv4(),
          poId: `PO-${Date.now()}`,
          supplierId: product.manufacturer, // Using manufacturer as supplier for now
          items: [{
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: reorderQuantity,
            unitPrice: product.costPrice,
            discount: 0,
            total: product.costPrice * reorderQuantity,
          }],
          subtotal: product.costPrice * reorderQuantity,
          tax: 0,
          totalAmount: product.costPrice * reorderQuantity,
          orderDate: new Date(),
          expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.purchaseOrders.add(purchaseOrder);

        // Log the action
        await this.logAction('low_stock_detected', 'product', productId, {
          productName: product.name,
          currentStock: product.stockQuantity,
          reorderLevel: product.reorderLevel,
          poId: purchaseOrder.poId,
          reorderQuantity,
        });
      });
    } catch (error) {
      await this.logError('onLowStockDetected', error as Error, { productId });
      throw error;
    }
  }

  /**
   * Handle product expiry - mark batch as unavailable
   */
  static async onProductExpired(productId: string, batchNumber: string): Promise<void> {
    try {
      await db.transaction('rw', [db.inventory, db.stockMovements, db.systemLogs], async () => {
        // Get inventory record
        const inventory = await db.inventory.where({ productId }).first();
        if (!inventory) return;

        // Find the expired batch
        const expiredBatch = inventory.expiryTracking.find(b => b.batchNumber === batchNumber);
        if (!expiredBatch) return;

        // Mark batch as unavailable by removing it from tracking
        const updatedTracking = inventory.expiryTracking.filter(b => b.batchNumber !== batchNumber);
        
        // Adjust inventory quantity
        const newQuantity = inventory.quantity - expiredBatch.quantity;

        await db.inventory.update(inventory.id, {
          quantity: newQuantity,
          availableQuantity: newQuantity - inventory.reservedQuantity,
          expiryTracking: updatedTracking,
          updatedAt: new Date(),
        });

        // Create stock movement for expiry
        const movement: StockMovement = {
          id: uuidv4(),
          productId,
          type: 'out',
          quantity: expiredBatch.quantity,
          fromLocation: inventory.warehouseLocation,
          reason: `Product expired - Batch: ${batchNumber}`,
          performedBy: 'system',
          timestamp: new Date(),
        };

        await db.stockMovements.add(movement);

        // Log the action
        await this.logAction('product_expired', 'product', productId, {
          batchNumber,
          quantity: expiredBatch.quantity,
          expiryDate: expiredBatch.expiryDate,
        });
      });
    } catch (error) {
      await this.logError('onProductExpired', error as Error, { productId, batchNumber });
      throw error;
    }
  }

  /**
   * Handle order delivery - create invoice and sale record
   */
  static async onOrderDelivered(order: Order): Promise<void> {
    try {
      await db.transaction('rw', [db.invoices, db.sales, db.inventory, db.systemLogs], async () => {
        // 1. Create invoice
        const invoice: Invoice = {
          id: uuidv4(),
          invoiceId: `INV-${Date.now()}`,
          orderId: order.id,
          customerId: order.customerId,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          totalAmount: order.totalAmount,
          paidAmount: 0,
          balanceAmount: order.totalAmount,
          status: 'unpaid',
          paymentTerms: 'Net 30',
          createdAt: new Date(),
        };

        await db.invoices.add(invoice);

        // 2. Create sale record
        const costAmount = await this.calculateOrderCost(order);
        const sale: Sale = {
          id: uuidv4(),
          saleId: `SALE-${Date.now()}`,
          orderId: order.id,
          customerId: order.customerId,
          saleDate: new Date(),
          totalAmount: order.totalAmount,
          costAmount,
          profit: order.totalAmount - costAmount,
          profitMargin: ((order.totalAmount - costAmount) / order.totalAmount) * 100,
          paymentMethod: order.paymentMethod || 'pending',
          salesPerson: order.salesPerson,
          commission: (order.totalAmount * 0.05), // 5% commission
          createdAt: new Date(),
        };

        await db.sales.add(sale);

        // 3. Convert reserved inventory to actual deduction
        for (const item of order.items) {
          const inventory = await db.inventory.where({ productId: item.productId }).first();
          if (inventory) {
            await db.inventory.update(inventory.id, {
              quantity: inventory.quantity - item.quantity,
              reservedQuantity: inventory.reservedQuantity - item.quantity,
              availableQuantity: (inventory.quantity - item.quantity) - (inventory.reservedQuantity - item.quantity),
              updatedAt: new Date(),
            });
          }
        }

        // 4. Log the action
        await this.logAction('order_delivered', 'order', order.id, {
          orderId: order.orderId,
          invoiceId: invoice.invoiceId,
          saleId: sale.saleId,
        });
      });
    } catch (error) {
      await this.logError('onOrderDelivered', error as Error, { orderId: order.id });
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Reserve inventory for an order
   */
  private static async reserveInventory(productId: string, quantity: number, orderId: string): Promise<void> {
    const inventory = await db.inventory.where({ productId }).first();
    
    if (!inventory) {
      throw new Error(`Inventory not found for product: ${productId}`);
    }

    if (inventory.availableQuantity < quantity) {
      throw new Error(`Insufficient inventory for product: ${productId}. Available: ${inventory.availableQuantity}, Required: ${quantity}`);
    }

    await db.inventory.update(inventory.id, {
      reservedQuantity: inventory.reservedQuantity + quantity,
      availableQuantity: inventory.availableQuantity - quantity,
      updatedAt: new Date(),
    });
  }

  /**
   * Release reserved inventory
   */
  private static async releaseInventory(productId: string, quantity: number, orderId: string): Promise<void> {
    const inventory = await db.inventory.where({ productId }).first();
    
    if (!inventory) return;

    await db.inventory.update(inventory.id, {
      reservedQuantity: Math.max(0, inventory.reservedQuantity - quantity),
      availableQuantity: inventory.availableQuantity + quantity,
      updatedAt: new Date(),
    });
  }

  /**
   * Create stock movements for an order
   */
  private static async createStockMovements(order: Order): Promise<void> {
    const movements: StockMovement[] = order.items.map(item => ({
      id: uuidv4(),
      productId: item.productId,
      type: 'out' as const,
      quantity: item.quantity,
      reason: `Order ${order.orderId}`,
      referenceId: order.id,
      performedBy: order.salesPerson,
      timestamp: new Date(),
    }));

    await db.stockMovements.bulkAdd(movements);
  }

  /**
   * Reverse stock movements for a cancelled order
   */
  private static async reverseStockMovements(order: Order): Promise<void> {
    const movements: StockMovement[] = order.items.map(item => ({
      id: uuidv4(),
      productId: item.productId,
      type: 'in' as const,
      quantity: item.quantity,
      reason: `Order ${order.orderId} cancelled`,
      referenceId: order.id,
      performedBy: 'system',
      timestamp: new Date(),
    }));

    await db.stockMovements.bulkAdd(movements);
  }

  /**
   * Update customer statistics
   */
  private static async updateCustomerStats(customerId: string): Promise<void> {
    const customer = await db.customers.get(customerId);
    if (!customer) return;

    // Calculate lifetime value from completed orders
    const orders = await db.orders
      .where({ customerId })
      .and(order => order.status === 'completed' || order.status === 'delivered')
      .toArray();

    const lifetimeValue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Determine segment based on lifetime value and order count
    let segment: Customer['segment'] = 'Regular';
    if (orders.length === 0) {
      segment = 'New';
    } else if (lifetimeValue > 100000) {
      segment = 'VIP';
    } else if (orders.length > 0 && orders[orders.length - 1].orderDate < new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)) {
      segment = 'Inactive';
    }

    await db.customers.update(customerId, {
      lifetimeValue,
      segment,
      updatedAt: new Date(),
    });
  }

  /**
   * Update invoice status after payment
   */
  private static async updateInvoiceStatus(invoiceId: string, paymentAmount: number): Promise<void> {
    const invoice = await db.invoices.get(invoiceId);
    if (!invoice) return;

    const newPaidAmount = invoice.paidAmount + paymentAmount;
    const newBalanceAmount = invoice.totalAmount - newPaidAmount;

    let status: Invoice['status'] = 'unpaid';
    if (newBalanceAmount === 0) {
      status = 'paid';
    } else if (newPaidAmount > 0) {
      status = 'partially-paid';
    } else if (new Date() > invoice.dueDate) {
      status = 'overdue';
    }

    await db.invoices.update(invoiceId, {
      paidAmount: newPaidAmount,
      balanceAmount: newBalanceAmount,
      status,
    });
  }

  /**
   * Update customer balance
   */
  private static async updateCustomerBalance(customerId: string, paymentAmount: number): Promise<void> {
    // This would update customer's outstanding balance
    // For now, we'll just log it
    await this.logAction('customer_balance_updated', 'customer', customerId, {
      paymentAmount,
      timestamp: new Date(),
    });
  }

  /**
   * Check if order is fully paid and update status
   */
  private static async checkOrderPaymentStatus(invoiceId: string): Promise<void> {
    const invoice = await db.invoices.get(invoiceId);
    if (!invoice) return;

    const order = await db.orders.get(invoice.orderId);
    if (!order) return;

    if (invoice.status === 'paid') {
      await db.orders.update(order.id, {
        paymentStatus: 'paid',
        updatedAt: new Date(),
      });
    } else if (invoice.status === 'partially-paid') {
      await db.orders.update(order.id, {
        paymentStatus: 'partially-paid',
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Calculate total cost of an order
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
   * Log an action to system logs
   */
  private static async logAction(action: string, entityType: string, entityId: string, details: any): Promise<void> {
    const log: SystemLog = {
      id: uuidv4(),
      action,
      entityType,
      entityId,
      details: JSON.stringify(details),
      userId: 'system', // In real implementation, get from auth context
      timestamp: new Date(),
      status: 'success',
    };

    await db.systemLogs.add(log);
  }

  /**
   * Log an error to system logs
   */
  private static async logError(action: string, error: Error, context: any): Promise<void> {
    const log: SystemLog = {
      id: uuidv4(),
      action,
      entityType: 'system',
      details: JSON.stringify(context),
      userId: 'system',
      timestamp: new Date(),
      status: 'error',
      errorMessage: error.message,
    };

    await db.systemLogs.add(log);
  }
}

// Export convenience functions
export const {
  onOrderCreated,
  onOrderCancelled,
  onPaymentRecorded,
  onProductPriceChanged,
  onLowStockDetected,
  onProductExpired,
  onOrderDelivered,
} = RelationshipManager;
