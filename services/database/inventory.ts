// Inventory Service - Stock management and inventory operations

import { db } from '@/lib/db/schema';
import type { Inventory, ExpiryBatch, StockMovement, StockMovementType } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Inventory filters for search and filtering
 */
export interface InventoryFilters {
  warehouseLocation?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
  searchTerm?: string;
}

/**
 * Stock adjustment data
 */
export interface StockAdjustmentData {
  productId: string;
  quantity: number;
  type: StockMovementType;
  reason: string;
  fromLocation?: string;
  toLocation?: string;
  performedBy: string;
  batchNumber?: string;
  expiryDate?: Date;
}

/**
 * InventoryService - Handles all inventory-related database operations
 */
export class InventoryService {
  /**
   * Get all inventory records with optional filters
   */
  static async getInventory(filters?: InventoryFilters): Promise<Inventory[]> {
    try {
      let query = db.inventory.toCollection();

      // Apply synchronous filters
      if (filters?.warehouseLocation) {
        query = query.filter(i => i.warehouseLocation === filters.warehouseLocation);
      }

      if (filters?.outOfStock) {
        query = query.filter(i => i.quantity === 0);
      }

      let results = await query.toArray();

      // Apply async filters after fetching
      if (filters?.lowStock) {
        const filtered = await Promise.all(
          results.map(async i => {
            const product = await db.products.get(i.productId);
            return product && i.quantity <= product.reorderLevel ? i : null;
          })
        );
        results = filtered.filter((i): i is Inventory => i !== null);
      }

      if (filters?.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const filtered = await Promise.all(
          results.map(async i => {
            const product = await db.products.get(i.productId);
            return product && (
              product.name.toLowerCase().includes(searchLower) ||
              product.sku.toLowerCase().includes(searchLower)
            ) ? i : null;
          })
        );
        results = filtered.filter((i): i is Inventory => i !== null);
      }

      return results;
    } catch (error) {
      console.error('Error getting inventory:', error);
      throw new Error('Failed to retrieve inventory');
    }
  }

  /**
   * Get inventory by product ID
   */
  static async getInventoryByProduct(productId: string): Promise<Inventory | undefined> {
    try {
      return await db.inventory.where({ productId }).first();
    } catch (error) {
      console.error('Error getting inventory by product:', error);
      throw new Error(`Failed to retrieve inventory for product: ${productId}`);
    }
  }

  /**
   * Get inventory by location
   */
  static async getInventoryByLocation(warehouseLocation: string): Promise<Inventory[]> {
    try {
      return await db.inventory.where({ warehouseLocation }).toArray();
    } catch (error) {
      console.error('Error getting inventory by location:', error);
      throw new Error(`Failed to retrieve inventory for location: ${warehouseLocation}`);
    }
  }

  /**
   * Create inventory record for a product
   */
  static async createInventory(inventoryData: Omit<Inventory, 'id' | 'updatedAt' | 'availableQuantity'>): Promise<Inventory> {
    try {
      // Check if inventory already exists for this product
      const existing = await this.getInventoryByProduct(inventoryData.productId);
      if (existing) {
        throw new Error(`Inventory already exists for product: ${inventoryData.productId}`);
      }

      const inventory: Inventory = {
        ...inventoryData,
        id: uuidv4(),
        availableQuantity: inventoryData.quantity - inventoryData.reservedQuantity,
        updatedAt: new Date(),
      };

      await db.inventory.add(inventory);

      // Log the action
      await this.logAction('inventory_created', inventory.id, {
        productId: inventory.productId,
        quantity: inventory.quantity,
        warehouseLocation: inventory.warehouseLocation,
      });

      return inventory;
    } catch (error) {
      console.error('Error creating inventory:', error);
      throw error;
    }
  }

  /**
   * Reserve inventory for an order
   */
  static async reserveInventory(productId: string, quantity: number, orderId: string): Promise<void> {
    try {
      const inventory = await this.getInventoryByProduct(productId);
      if (!inventory) {
        throw new Error(`Inventory not found for product: ${productId}`);
      }

      if (inventory.availableQuantity < quantity) {
        throw new Error(`Insufficient inventory. Available: ${inventory.availableQuantity}, Required: ${quantity}`);
      }

      await db.inventory.update(inventory.id, {
        reservedQuantity: inventory.reservedQuantity + quantity,
        availableQuantity: inventory.availableQuantity - quantity,
        updatedAt: new Date(),
      });

      // Log the action
      await this.logAction('inventory_reserved', inventory.id, {
        productId,
        quantity,
        orderId,
      });
    } catch (error) {
      console.error('Error reserving inventory:', error);
      throw error;
    }
  }

  /**
   * Release reserved inventory
   */
  static async releaseInventory(productId: string, quantity: number, orderId: string): Promise<void> {
    try {
      const inventory = await this.getInventoryByProduct(productId);
      if (!inventory) {
        throw new Error(`Inventory not found for product: ${productId}`);
      }

      await db.inventory.update(inventory.id, {
        reservedQuantity: Math.max(0, inventory.reservedQuantity - quantity),
        availableQuantity: inventory.availableQuantity + quantity,
        updatedAt: new Date(),
      });

      // Log the action
      await this.logAction('inventory_released', inventory.id, {
        productId,
        quantity,
        orderId,
      });
    } catch (error) {
      console.error('Error releasing inventory:', error);
      throw error;
    }
  }

  /**
   * Adjust stock (manual adjustment)
   */
  static async adjustStock(adjustmentData: StockAdjustmentData): Promise<void> {
    try {
      const inventory = await this.getInventoryByProduct(adjustmentData.productId);
      if (!inventory) {
        throw new Error(`Inventory not found for product: ${adjustmentData.productId}`);
      }

      let newQuantity = inventory.quantity;

      switch (adjustmentData.type) {
        case 'in':
          newQuantity += adjustmentData.quantity;
          
          // Add to expiry tracking if batch info provided
          if (adjustmentData.batchNumber && adjustmentData.expiryDate) {
            const newBatch: ExpiryBatch = {
              batchNumber: adjustmentData.batchNumber,
              quantity: adjustmentData.quantity,
              expiryDate: adjustmentData.expiryDate,
              receivedDate: new Date(),
            };
            inventory.expiryTracking.push(newBatch);
          }
          break;

        case 'out':
          newQuantity -= adjustmentData.quantity;
          if (newQuantity < 0) {
            throw new Error('Adjustment would result in negative inventory');
          }
          break;

        case 'adjustment':
          newQuantity = adjustmentData.quantity;
          break;

        case 'transfer':
          if (!adjustmentData.toLocation) {
            throw new Error('Transfer requires toLocation');
          }
          newQuantity -= adjustmentData.quantity;
          if (newQuantity < 0) {
            throw new Error('Insufficient quantity for transfer');
          }
          break;
      }

      // Update inventory
      await db.inventory.update(inventory.id, {
        quantity: newQuantity,
        availableQuantity: newQuantity - inventory.reservedQuantity,
        expiryTracking: inventory.expiryTracking,
        lastRestocked: adjustmentData.type === 'in' ? new Date() : inventory.lastRestocked,
        updatedAt: new Date(),
      });

      // Create stock movement record
      const movement: StockMovement = {
        id: uuidv4(),
        productId: adjustmentData.productId,
        type: adjustmentData.type,
        quantity: adjustmentData.quantity,
        fromLocation: adjustmentData.fromLocation || inventory.warehouseLocation,
        toLocation: adjustmentData.toLocation,
        reason: adjustmentData.reason,
        performedBy: adjustmentData.performedBy,
        timestamp: new Date(),
      };

      await db.stockMovements.add(movement);

      // If transfer, create inventory at destination
      if (adjustmentData.type === 'transfer' && adjustmentData.toLocation) {
        const destInventory = await db.inventory
          .where({ productId: adjustmentData.productId, warehouseLocation: adjustmentData.toLocation })
          .first();

        if (destInventory) {
          await db.inventory.update(destInventory.id, {
            quantity: destInventory.quantity + adjustmentData.quantity,
            availableQuantity: destInventory.availableQuantity + adjustmentData.quantity,
            updatedAt: new Date(),
          });
        } else {
          await this.createInventory({
            productId: adjustmentData.productId,
            warehouseLocation: adjustmentData.toLocation,
            quantity: adjustmentData.quantity,
            reservedQuantity: 0,
            lastRestocked: new Date(),
            expiryTracking: [],
          });
        }
      }

      // Log the action
      await this.logAction('stock_adjusted', inventory.id, {
        productId: adjustmentData.productId,
        type: adjustmentData.type,
        quantity: adjustmentData.quantity,
        reason: adjustmentData.reason,
      });
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw error;
    }
  }

  /**
   * Get stock movements for a product
   */
  static async getStockMovements(productId: string, limit?: number): Promise<StockMovement[]> {
    try {
      let query = db.stockMovements.where({ productId }).reverse().sortBy('timestamp');
      
      const movements = await query;
      return limit ? movements.slice(0, limit) : movements;
    } catch (error) {
      console.error('Error getting stock movements:', error);
      throw new Error(`Failed to retrieve stock movements for product: ${productId}`);
    }
  }

  /**
   * Get all stock movements by date range
   */
  static async getStockMovementsByDateRange(startDate: Date, endDate: Date): Promise<StockMovement[]> {
    try {
      return await db.stockMovements
        .where('timestamp')
        .between(startDate, endDate, true, true)
        .reverse()
        .sortBy('timestamp');
    } catch (error) {
      console.error('Error getting stock movements by date range:', error);
      throw new Error('Failed to retrieve stock movements by date range');
    }
  }

  /**
   * Get expiring batches within specified days
   */
  static async getExpiringBatches(daysUntilExpiry: number = 90): Promise<Array<{
    inventory: Inventory;
    batch: ExpiryBatch;
    product: any;
  }>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysUntilExpiry);

      const allInventory = await db.inventory.toArray();
      const expiringBatches: Array<{
        inventory: Inventory;
        batch: ExpiryBatch;
        product: any;
      }> = [];

      for (const inventory of allInventory) {
        for (const batch of inventory.expiryTracking) {
          if (batch.expiryDate <= cutoffDate) {
            const product = await db.products.get(inventory.productId);
            expiringBatches.push({
              inventory,
              batch,
              product,
            });
          }
        }
      }

      return expiringBatches.sort((a, b) => 
        a.batch.expiryDate.getTime() - b.batch.expiryDate.getTime()
      );
    } catch (error) {
      console.error('Error getting expiring batches:', error);
      throw new Error('Failed to retrieve expiring batches');
    }
  }

  /**
   * Remove expired batch from inventory
   */
  static async removeExpiredBatch(productId: string, batchNumber: string): Promise<void> {
    try {
      const inventory = await this.getInventoryByProduct(productId);
      if (!inventory) {
        throw new Error(`Inventory not found for product: ${productId}`);
      }

      const batch = inventory.expiryTracking.find(b => b.batchNumber === batchNumber);
      if (!batch) {
        throw new Error(`Batch ${batchNumber} not found`);
      }

      // Remove batch from tracking
      const updatedTracking = inventory.expiryTracking.filter(b => b.batchNumber !== batchNumber);

      // Adjust inventory quantity
      const newQuantity = inventory.quantity - batch.quantity;

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
        quantity: batch.quantity,
        fromLocation: inventory.warehouseLocation,
        reason: `Expired - Batch: ${batchNumber}`,
        performedBy: 'system',
        timestamp: new Date(),
      };

      await db.stockMovements.add(movement);

      // Log the action
      await this.logAction('expired_batch_removed', inventory.id, {
        productId,
        batchNumber,
        quantity: batch.quantity,
        expiryDate: batch.expiryDate,
      });
    } catch (error) {
      console.error('Error removing expired batch:', error);
      throw error;
    }
  }

  /**
   * Calculate inventory valuation using FIFO
   */
  static async calculateInventoryValuation(): Promise<number> {
    try {
      const allInventory = await db.inventory.toArray();
      let totalValue = 0;

      for (const inventory of allInventory) {
        const product = await db.products.get(inventory.productId);
        if (product) {
          totalValue += product.costPrice * inventory.quantity;
        }
      }

      return totalValue;
    } catch (error) {
      console.error('Error calculating inventory valuation:', error);
      throw new Error('Failed to calculate inventory valuation');
    }
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(): Promise<Array<{
    product: any;
    inventory: Inventory;
  }>> {
    try {
      const allInventory = await db.inventory.toArray();
      const lowStock: Array<{ product: any; inventory: Inventory }> = [];

      for (const inventory of allInventory) {
        const product = await db.products.get(inventory.productId);
        if (product && product.isActive && inventory.quantity > 0 && inventory.quantity <= product.reorderLevel) {
          lowStock.push({ product, inventory });
        }
      }

      return lowStock;
    } catch (error) {
      console.error('Error getting low stock products:', error);
      throw new Error('Failed to retrieve low stock products');
    }
  }

  /**
   * Get out of stock products
   */
  static async getOutOfStockProducts(): Promise<Array<{
    product: any;
    inventory: Inventory;
  }>> {
    try {
      const allInventory = await db.inventory.toArray();
      const outOfStock: Array<{ product: any; inventory: Inventory }> = [];

      for (const inventory of allInventory) {
        const product = await db.products.get(inventory.productId);
        if (product && product.isActive && inventory.quantity === 0) {
          outOfStock.push({ product, inventory });
        }
      }

      return outOfStock;
    } catch (error) {
      console.error('Error getting out of stock products:', error);
      throw new Error('Failed to retrieve out of stock products');
    }
  }

  /**
   * Get inventory statistics
   */
  static async getInventoryStats(): Promise<{
    totalProducts: number;
    totalQuantity: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    expiringBatchesCount: number;
    byLocation: Record<string, number>;
  }> {
    try {
      const allInventory = await db.inventory.toArray();
      const lowStock = await this.getLowStockProducts();
      const outOfStock = await this.getOutOfStockProducts();
      const expiringBatches = await this.getExpiringBatches();
      const totalValue = await this.calculateInventoryValuation();

      const byLocation: Record<string, number> = {};
      let totalQuantity = 0;

      for (const inventory of allInventory) {
        totalQuantity += inventory.quantity;
        byLocation[inventory.warehouseLocation] = (byLocation[inventory.warehouseLocation] || 0) + inventory.quantity;
      }

      return {
        totalProducts: allInventory.length,
        totalQuantity,
        totalValue,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        expiringBatchesCount: expiringBatches.length,
        byLocation,
      };
    } catch (error) {
      console.error('Error getting inventory stats:', error);
      throw new Error('Failed to retrieve inventory statistics');
    }
  }

  /**
   * Get all warehouse locations
   */
  static async getWarehouseLocations(): Promise<string[]> {
    try {
      const inventory = await db.inventory.toArray();
      const locations = [...new Set(inventory.map(i => i.warehouseLocation))];
      return locations.sort();
    } catch (error) {
      console.error('Error getting warehouse locations:', error);
      throw new Error('Failed to retrieve warehouse locations');
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
        entityType: 'inventory',
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
  getInventory,
  getInventoryByProduct,
  getInventoryByLocation,
  createInventory,
  reserveInventory,
  releaseInventory,
  adjustStock,
  getStockMovements,
  getStockMovementsByDateRange,
  getExpiringBatches,
  removeExpiredBatch,
  calculateInventoryValuation,
  getLowStockProducts,
  getOutOfStockProducts,
  getInventoryStats,
  getWarehouseLocations,
} = InventoryService;
