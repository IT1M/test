// Purchase Order Service - Procurement and goods receipt management

import { db } from '@/lib/db/schema';
import { InventoryService } from './inventory';
import type { PurchaseOrder, PurchaseOrderStatus, OrderItem } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Purchase Order filters
 */
export interface PurchaseOrderFilters {
  supplierId?: string;
  status?: PurchaseOrderStatus;
  startDate?: Date;
  endDate?: Date;
}

/**
 * PurchaseOrderService - Handles all purchase order operations
 */
export class PurchaseOrderService {
  /**
   * Get all purchase orders with optional filters
   */
  static async getPurchaseOrders(filters?: PurchaseOrderFilters): Promise<PurchaseOrder[]> {
    try {
      let query = db.purchaseOrders.toCollection();

      if (filters?.supplierId) {
        query = query.filter(po => po.supplierId === filters.supplierId);
      }

      if (filters?.status) {
        query = query.filter(po => po.status === filters.status);
      }

      if (filters?.startDate && filters?.endDate) {
        query = query.filter(po => 
          po.orderDate >= filters.startDate! && po.orderDate <= filters.endDate!
        );
      }

      const orders = await query.toArray();
      return orders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
    } catch (error) {
      console.error('Error getting purchase orders:', error);
      throw new Error('Failed to retrieve purchase orders');
    }
  }

  /**
   * Get purchase order by ID
   */
  static async getPurchaseOrderById(id: string): Promise<PurchaseOrder | undefined> {
    try {
      return await db.purchaseOrders.get(id);
    } catch (error) {
      console.error('Error getting purchase order:', error);
      throw new Error(`Failed to retrieve purchase order: ${id}`);
    }
  }

  /**
   * Get purchase order by PO ID
   */
  static async getPurchaseOrderByPoId(poId: string): Promise<PurchaseOrder | undefined> {
    try {
      return await db.purchaseOrders.where({ poId }).first();
    } catch (error) {
      console.error('Error getting purchase order by PO ID:', error);
      throw new Error(`Failed to retrieve purchase order: ${poId}`);
    }
  }

  /**
   * Create a new purchase order
   */
  static async createPurchaseOrder(
    poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PurchaseOrder> {
    try {
      // Generate PO ID if not provided
      if (!poData.poId) {
        const count = await db.purchaseOrders.count();
        poData.poId = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
      }

      const purchaseOrder: PurchaseOrder = {
        ...poData,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.purchaseOrders.add(purchaseOrder);

      // Log the action
      await this.logAction('purchase_order_created', purchaseOrder.id, {
        poId: purchaseOrder.poId,
        supplierId: purchaseOrder.supplierId,
        totalAmount: purchaseOrder.totalAmount,
      });

      return purchaseOrder;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  }

  /**
   * Update purchase order
   */
  static async updatePurchaseOrder(
    id: string,
    updates: Partial<PurchaseOrder>
  ): Promise<PurchaseOrder> {
    try {
      const existing = await db.purchaseOrders.get(id);
      if (!existing) {
        throw new Error(`Purchase order with ID ${id} not found`);
      }

      await db.purchaseOrders.update(id, {
        ...updates,
        updatedAt: new Date(),
      });

      const updated = await db.purchaseOrders.get(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated purchase order');
      }

      // Log the action
      await this.logAction('purchase_order_updated', id, {
        changes: updates,
      });

      return updated;
    } catch (error) {
      console.error('Error updating purchase order:', error);
      throw error;
    }
  }

  /**
   * Update purchase order status
   */
  static async updateStatus(
    id: string,
    status: PurchaseOrderStatus
  ): Promise<void> {
    try {
      await this.updatePurchaseOrder(id, { status });

      // Log the action
      await this.logAction('purchase_order_status_changed', id, {
        newStatus: status,
      });
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      throw error;
    }
  }

  /**
   * Receive goods from purchase order
   */
  static async receiveGoods(
    id: string,
    receivedItems: Array<{
      productId: string;
      quantity: number;
      batchNumber?: string;
      expiryDate?: Date;
    }>
  ): Promise<void> {
    try {
      const po = await db.purchaseOrders.get(id);
      if (!po) {
        throw new Error(`Purchase order with ID ${id} not found`);
      }

      if (po.status !== 'confirmed') {
        throw new Error('Can only receive goods from confirmed purchase orders');
      }

      // Update inventory for each received item
      for (const item of receivedItems) {
        const inventory = await InventoryService.getInventoryByProduct(item.productId);
        
        if (!inventory) {
          throw new Error(`Inventory not found for product: ${item.productId}`);
        }

        // Adjust stock (add received quantity)
        await InventoryService.adjustStock({
          productId: item.productId,
          quantity: item.quantity,
          type: 'in',
          reason: `Goods received from PO: ${po.poId}`,
          fromLocation: inventory.warehouseLocation,
          performedBy: 'system',
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
        });
      }

      // Update PO status to received
      await db.purchaseOrders.update(id, {
        status: 'received',
        receivedDate: new Date(),
        updatedAt: new Date(),
      });

      // Log the action
      await this.logAction('goods_received', id, {
        poId: po.poId,
        itemsReceived: receivedItems.length,
      });
    } catch (error) {
      console.error('Error receiving goods:', error);
      throw error;
    }
  }

  /**
   * Cancel purchase order
   */
  static async cancelPurchaseOrder(id: string, reason: string): Promise<void> {
    try {
      const po = await db.purchaseOrders.get(id);
      if (!po) {
        throw new Error(`Purchase order with ID ${id} not found`);
      }

      if (po.status === 'received') {
        throw new Error('Cannot cancel a purchase order that has been received');
      }

      await db.purchaseOrders.update(id, {
        status: 'cancelled',
        updatedAt: new Date(),
      });

      // Log the action
      await this.logAction('purchase_order_cancelled', id, {
        poId: po.poId,
        reason,
      });
    } catch (error) {
      console.error('Error cancelling purchase order:', error);
      throw error;
    }
  }

  /**
   * Get purchase orders by supplier
   */
  static async getPurchaseOrdersBySupplier(supplierId: string): Promise<PurchaseOrder[]> {
    try {
      return await db.purchaseOrders
        .where({ supplierId })
        .reverse()
        .sortBy('orderDate');
    } catch (error) {
      console.error('Error getting purchase orders by supplier:', error);
      throw new Error(`Failed to retrieve purchase orders for supplier: ${supplierId}`);
    }
  }

  /**
   * Get pending purchase orders
   */
  static async getPendingPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      return await db.purchaseOrders
        .where('status')
        .anyOf(['draft', 'sent', 'confirmed'])
        .reverse()
        .sortBy('orderDate');
    } catch (error) {
      console.error('Error getting pending purchase orders:', error);
      throw new Error('Failed to retrieve pending purchase orders');
    }
  }

  /**
   * Get overdue purchase orders
   */
  static async getOverduePurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const today = new Date();
      const orders = await db.purchaseOrders
        .where('status')
        .equals('confirmed')
        .toArray();

      return orders.filter(po => po.expectedDeliveryDate < today);
    } catch (error) {
      console.error('Error getting overdue purchase orders:', error);
      throw new Error('Failed to retrieve overdue purchase orders');
    }
  }

  /**
   * Get purchase order statistics
   */
  static async getPurchaseOrderStats(): Promise<{
    total: number;
    draft: number;
    sent: number;
    confirmed: number;
    received: number;
    cancelled: number;
    totalValue: number;
    overdue: number;
  }> {
    try {
      const allOrders = await db.purchaseOrders.toArray();
      const overdue = await this.getOverduePurchaseOrders();

      const stats = {
        total: allOrders.length,
        draft: allOrders.filter(po => po.status === 'draft').length,
        sent: allOrders.filter(po => po.status === 'sent').length,
        confirmed: allOrders.filter(po => po.status === 'confirmed').length,
        received: allOrders.filter(po => po.status === 'received').length,
        cancelled: allOrders.filter(po => po.status === 'cancelled').length,
        totalValue: allOrders
          .filter(po => po.status !== 'cancelled')
          .reduce((sum, po) => sum + po.totalAmount, 0),
        overdue: overdue.length,
      };

      return stats;
    } catch (error) {
      console.error('Error getting purchase order stats:', error);
      throw new Error('Failed to retrieve purchase order statistics');
    }
  }

  /**
   * Generate purchase order from low stock products
   */
  static async generatePurchaseOrderFromLowStock(
    supplierId: string,
    productIds: string[]
  ): Promise<PurchaseOrder> {
    try {
      const items: OrderItem[] = [];

      for (const productId of productIds) {
        const product = await db.products.get(productId);
        if (!product) continue;

        // Calculate reorder quantity (2x reorder level)
        const quantity = product.reorderLevel * 2;

        items.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity,
          unitPrice: product.costPrice,
          discount: 0,
          total: product.costPrice * quantity,
        });
      }

      if (items.length === 0) {
        throw new Error('No valid products found for purchase order');
      }

      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.1; // 10% tax
      const totalAmount = subtotal + tax;

      // Set expected delivery date to 7 days from now
      const expectedDeliveryDate = new Date();
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);

      const poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'> = {
        poId: '', // Will be generated
        supplierId,
        items,
        subtotal,
        tax,
        totalAmount,
        orderDate: new Date(),
        expectedDeliveryDate,
        status: 'draft',
      };

      return await this.createPurchaseOrder(poData);
    } catch (error) {
      console.error('Error generating purchase order:', error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Log an action to system logs
   */
  private static async logAction(action: string, entityId: string, details: any): Promise<void> {
    try {
      await db.systemLogs.add({
        id: uuidv4(),
        action,
        entityType: 'purchase_order',
        entityId,
        details: JSON.stringify(details),
        userId: 'system',
        timestamp: new Date(),
        status: 'success',
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }
}

// Export convenience functions
export const {
  getPurchaseOrders,
  getPurchaseOrderById,
  getPurchaseOrderByPoId,
  createPurchaseOrder,
  updatePurchaseOrder,
  updateStatus,
  receiveGoods,
  cancelPurchaseOrder,
  getPurchaseOrdersBySupplier,
  getPendingPurchaseOrders,
  getOverduePurchaseOrders,
  getPurchaseOrderStats,
  generatePurchaseOrderFromLowStock,
} = PurchaseOrderService;
