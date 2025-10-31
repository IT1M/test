// Order Service - CRUD operations and business logic for orders

import { db } from '@/lib/db/schema';
import { RelationshipManager } from '@/lib/db/relationships';
import type { Order, OrderItem, OrderStatus, PaymentStatus, PaginatedResult } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Order filters for search and filtering
 */
export interface OrderFilters {
  customerId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  salesPerson?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

/**
 * Order creation data
 */
export interface CreateOrderData {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    discount?: number;
  }>;
  deliveryDate?: Date;
  salesPerson: string;
  notes?: string;
  discount?: number;
  tax?: number;
}

/**
 * OrderService - Handles all order-related database operations
 */
export class OrderService {
  /**
   * Get all orders with optional filters
   */
  static async getOrders(filters?: OrderFilters): Promise<Order[]> {
    try {
      let query = db.orders.toCollection();

      // Apply filters
      if (filters?.customerId) {
        query = query.filter(o => o.customerId === filters.customerId);
      }

      if (filters?.status) {
        query = query.filter(o => o.status === filters.status);
      }

      if (filters?.paymentStatus) {
        query = query.filter(o => o.paymentStatus === filters.paymentStatus);
      }

      if (filters?.salesPerson) {
        query = query.filter(o => o.salesPerson === filters.salesPerson);
      }

      if (filters?.startDate) {
        query = query.filter(o => o.orderDate >= filters.startDate!);
      }

      if (filters?.endDate) {
        query = query.filter(o => o.orderDate <= filters.endDate!);
      }

      if (filters?.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        query = query.filter(o => 
          o.orderId.toLowerCase().includes(searchLower) ||
          (o.notes?.toLowerCase().includes(searchLower) ?? false)
        );
      }

      return await query.reverse().sortBy('orderDate');
    } catch (error) {
      console.error('Error getting orders:', error);
      throw new Error('Failed to retrieve orders');
    }
  }

  /**
   * Get paginated orders
   */
  static async getPaginatedOrders(
    page: number = 1,
    pageSize: number = 20,
    filters?: OrderFilters
  ): Promise<PaginatedResult<Order>> {
    try {
      const allOrders = await this.getOrders(filters);
      const total = allOrders.length;
      const totalPages = Math.ceil(total / pageSize);
      const offset = (page - 1) * pageSize;
      const data = allOrders.slice(offset, offset + pageSize);

      return {
        data,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error('Error getting paginated orders:', error);
      throw new Error('Failed to retrieve paginated orders');
    }
  }

  /**
   * Get a single order by ID
   */
  static async getOrderById(id: string): Promise<Order | undefined> {
    try {
      return await db.orders.get(id);
    } catch (error) {
      console.error('Error getting order by ID:', error);
      throw new Error(`Failed to retrieve order with ID: ${id}`);
    }
  }

  /**
   * Get an order by order ID (business ID)
   */
  static async getOrderByOrderId(orderId: string): Promise<Order | undefined> {
    try {
      return await db.orders.where({ orderId }).first();
    } catch (error) {
      console.error('Error getting order by order ID:', error);
      throw new Error(`Failed to retrieve order with order ID: ${orderId}`);
    }
  }

  /**
   * Create a new order with automatic inventory reservation
   */
  static async createOrder(orderData: CreateOrderData): Promise<Order> {
    try {
      // Validate customer exists
      const customer = await db.customers.get(orderData.customerId);
      if (!customer) {
        throw new Error(`Customer with ID ${orderData.customerId} not found`);
      }

      // Build order items with product details and calculate totals
      const items: OrderItem[] = [];
      let subtotal = 0;

      for (const item of orderData.items) {
        const product = await db.products.get(item.productId);
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        if (!product.isActive) {
          throw new Error(`Product ${product.name} is not active`);
        }

        // Check inventory availability
        const inventory = await db.inventory.where({ productId: item.productId }).first();
        if (!inventory || inventory.availableQuantity < item.quantity) {
          throw new Error(`Insufficient inventory for product: ${product.name}. Available: ${inventory?.availableQuantity || 0}, Required: ${item.quantity}`);
        }

        const itemDiscount = item.discount || 0;
        const itemTotal = (product.unitPrice * item.quantity) - itemDiscount;

        items.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unitPrice: product.unitPrice,
          discount: itemDiscount,
          total: itemTotal,
        });

        subtotal += itemTotal;
      }

      // Calculate order totals
      const discount = orderData.discount || 0;
      const tax = orderData.tax || (subtotal - discount) * 0.1; // 10% tax by default
      const totalAmount = subtotal - discount + tax;

      // Create order
      const order: Order = {
        id: uuidv4(),
        orderId: `ORD-${Date.now()}`,
        customerId: orderData.customerId,
        orderDate: new Date(),
        deliveryDate: orderData.deliveryDate,
        status: 'pending',
        items,
        subtotal,
        discount,
        tax,
        totalAmount,
        paymentStatus: 'unpaid',
        salesPerson: orderData.salesPerson,
        notes: orderData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add order to database
      await db.orders.add(order);

      // Trigger relationship manager to handle inventory reservation and stock movements
      await RelationshipManager.onOrderCreated(order);

      // Log the action
      await this.logAction('order_created', order.id, {
        orderId: order.orderId,
        customerId: order.customerId,
        totalAmount: order.totalAmount,
        itemCount: order.items.length,
      });

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Update order status with workflow validation
   */
  static async updateOrderStatus(id: string, newStatus: OrderStatus): Promise<Order> {
    try {
      const order = await db.orders.get(id);
      if (!order) {
        throw new Error(`Order with ID ${id} not found`);
      }

      // Validate status transition
      this.validateStatusTransition(order.status, newStatus);

      // Update order status
      await db.orders.update(id, {
        status: newStatus,
        updatedAt: new Date(),
      });

      // Handle status-specific actions
      if (newStatus === 'delivered') {
        await RelationshipManager.onOrderDelivered(order);
      }

      const updated = await db.orders.get(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated order');
      }

      // Log the action
      await this.logAction('order_status_updated', id, {
        orderId: order.orderId,
        oldStatus: order.status,
        newStatus,
      });

      return updated;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Cancel an order with inventory release
   */
  static async cancelOrder(id: string, reason?: string): Promise<void> {
    try {
      const order = await db.orders.get(id);
      if (!order) {
        throw new Error(`Order with ID ${id} not found`);
      }

      // Can only cancel orders that are not yet delivered
      if (['delivered', 'completed', 'cancelled'].includes(order.status)) {
        throw new Error(`Cannot cancel order with status: ${order.status}`);
      }

      // Update order status
      await db.orders.update(id, {
        status: 'cancelled',
        notes: order.notes ? `${order.notes}\nCancellation reason: ${reason || 'Not specified'}` : `Cancellation reason: ${reason || 'Not specified'}`,
        updatedAt: new Date(),
      });

      // Trigger relationship manager to release inventory
      await RelationshipManager.onOrderCancelled(order);

      // Log the action
      await this.logAction('order_cancelled', id, {
        orderId: order.orderId,
        reason: reason || 'Not specified',
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  /**
   * Update order payment status
   */
  static async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order> {
    try {
      const order = await db.orders.get(id);
      if (!order) {
        throw new Error(`Order with ID ${id} not found`);
      }

      await db.orders.update(id, {
        paymentStatus,
        updatedAt: new Date(),
      });

      const updated = await db.orders.get(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated order');
      }

      // Log the action
      await this.logAction('order_payment_status_updated', id, {
        orderId: order.orderId,
        oldPaymentStatus: order.paymentStatus,
        newPaymentStatus: paymentStatus,
      });

      return updated;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Update order details
   */
  static async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    try {
      const existing = await db.orders.get(id);
      if (!existing) {
        throw new Error(`Order with ID ${id} not found`);
      }

      // Cannot update completed or cancelled orders
      if (['completed', 'cancelled'].includes(existing.status)) {
        throw new Error(`Cannot update order with status: ${existing.status}`);
      }

      await db.orders.update(id, {
        ...updates,
        updatedAt: new Date(),
      });

      const updated = await db.orders.get(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated order');
      }

      // Log the action
      await this.logAction('order_updated', id, {
        changes: updates,
      });

      return updated;
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  /**
   * Get orders by customer
   */
  static async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    try {
      return await db.orders
        .where({ customerId })
        .reverse()
        .sortBy('orderDate');
    } catch (error) {
      console.error('Error getting orders by customer:', error);
      throw new Error(`Failed to retrieve orders for customer: ${customerId}`);
    }
  }

  /**
   * Get orders by status
   */
  static async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    try {
      return await db.orders
        .where({ status })
        .reverse()
        .sortBy('orderDate');
    } catch (error) {
      console.error('Error getting orders by status:', error);
      throw new Error(`Failed to retrieve orders with status: ${status}`);
    }
  }

  /**
   * Get orders by sales person
   */
  static async getOrdersBySalesPerson(salesPerson: string): Promise<Order[]> {
    try {
      return await db.orders
        .where({ salesPerson })
        .reverse()
        .sortBy('orderDate');
    } catch (error) {
      console.error('Error getting orders by sales person:', error);
      throw new Error(`Failed to retrieve orders for sales person: ${salesPerson}`);
    }
  }

  /**
   * Get orders by date range
   */
  static async getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
    try {
      return await db.orders
        .where('orderDate')
        .between(startDate, endDate, true, true)
        .reverse()
        .sortBy('orderDate');
    } catch (error) {
      console.error('Error getting orders by date range:', error);
      throw new Error('Failed to retrieve orders by date range');
    }
  }

  /**
   * Get recent orders
   */
  static async getRecentOrders(limit: number = 10): Promise<Order[]> {
    try {
      return await db.orders
        .orderBy('orderDate')
        .reverse()
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Error getting recent orders:', error);
      throw new Error('Failed to retrieve recent orders');
    }
  }

  /**
   * Calculate order totals
   */
  static calculateOrderTotals(items: OrderItem[], discount: number = 0, taxRate: number = 0.1): {
    subtotal: number;
    tax: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * taxRate;
    const total = afterDiscount + tax;

    return {
      subtotal,
      tax,
      total,
    };
  }

  /**
   * Get order statistics
   */
  static async getOrderStats(): Promise<{
    total: number;
    byStatus: Record<OrderStatus, number>;
    byPaymentStatus: Record<PaymentStatus, number>;
    totalRevenue: number;
    averageOrderValue: number;
    pendingOrders: number;
    completedOrders: number;
  }> {
    try {
      const allOrders = await db.orders.toArray();

      const byStatus: Record<OrderStatus, number> = {
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        completed: 0,
        cancelled: 0,
      };

      const byPaymentStatus: Record<PaymentStatus, number> = {
        unpaid: 0,
        'partially-paid': 0,
        paid: 0,
        overdue: 0,
      };

      let totalRevenue = 0;
      let completedOrders = 0;

      for (const order of allOrders) {
        byStatus[order.status]++;
        byPaymentStatus[order.paymentStatus]++;

        if (order.status === 'completed' || order.status === 'delivered') {
          totalRevenue += order.totalAmount;
          completedOrders++;
        }
      }

      return {
        total: allOrders.length,
        byStatus,
        byPaymentStatus,
        totalRevenue,
        averageOrderValue: completedOrders > 0 ? totalRevenue / completedOrders : 0,
        pendingOrders: byStatus.pending + byStatus.confirmed + byStatus.processing,
        completedOrders,
      };
    } catch (error) {
      console.error('Error getting order stats:', error);
      throw new Error('Failed to retrieve order statistics');
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Validate status transition
   */
  private static validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: ['completed'],
      completed: [],
      cancelled: [],
    };

    const allowedTransitions = validTransitions[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  /**
   * Log an action to system logs
   */
  private static async logAction(action: string, entityId: string, details: any): Promise<void> {
    try {
      await db.systemLogs.add({
        id: uuidv4(),
        action,
        entityType: 'order',
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
  getOrders,
  getPaginatedOrders,
  getOrderById,
  getOrderByOrderId,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  updatePaymentStatus,
  updateOrder,
  getOrdersByCustomer,
  getOrdersByStatus,
  getOrdersBySalesPerson,
  getOrdersByDateRange,
  getRecentOrders,
  calculateOrderTotals,
  getOrderStats,
} = OrderService;
