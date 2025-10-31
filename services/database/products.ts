// Product Service - CRUD operations and business logic for products

import { db } from '@/lib/db/schema';
import { RelationshipManager } from '@/lib/db/relationships';
import type { Product, StockStatus, PaginatedResult } from '@/types/database';
import { calculateProfitMargin, calculateStockStatus } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';
import { useCacheStore, generateCacheKey } from '@/store/cacheStore';

/**
 * Product filters for search and filtering
 */
export interface ProductFilters {
  category?: string;
  manufacturer?: string;
  stockStatus?: StockStatus;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
}

/**
 * ProductService - Handles all product-related database operations
 */
export class ProductService {
  /**
   * Get all products with optional filters (with caching)
   */
  static async getProducts(filters?: ProductFilters): Promise<Product[]> {
    try {
      // Generate cache key from filters
      const cacheKey = generateCacheKey('products', filters || {});
      
      // Check cache first
      const cached = useCacheStore.getState().getSearchCache(cacheKey);
      if (cached) {
        return cached;
      }

      let query = db.products.toCollection();

      // Apply filters
      if (filters?.isActive !== undefined) {
        query = query.filter(p => p.isActive === filters.isActive);
      }

      if (filters?.category) {
        query = query.filter(p => p.category === filters.category);
      }

      if (filters?.manufacturer) {
        query = query.filter(p => p.manufacturer === filters.manufacturer);
      }

      if (filters?.minPrice !== undefined) {
        query = query.filter(p => p.unitPrice >= filters.minPrice!);
      }

      if (filters?.maxPrice !== undefined) {
        query = query.filter(p => p.unitPrice <= filters.maxPrice!);
      }

      if (filters?.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        query = query.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
        );
      }

      const products = await query.toArray();

      // Calculate computed fields
      const enrichedProducts = products.map(p => this.enrichProduct(p));
      
      // Cache the results
      useCacheStore.getState().setSearchCache(cacheKey, enrichedProducts);
      
      return enrichedProducts;
    } catch (error) {
      console.error('Error getting products:', error);
      throw new Error('Failed to retrieve products');
    }
  }

  /**
   * Get paginated products
   */
  static async getPaginatedProducts(
    page: number = 1,
    pageSize: number = 20,
    filters?: ProductFilters
  ): Promise<PaginatedResult<Product>> {
    try {
      const allProducts = await this.getProducts(filters);
      const total = allProducts.length;
      const totalPages = Math.ceil(total / pageSize);
      const offset = (page - 1) * pageSize;
      const data = allProducts.slice(offset, offset + pageSize);

      return {
        data,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error('Error getting paginated products:', error);
      throw new Error('Failed to retrieve paginated products');
    }
  }

  /**
   * Get a single product by ID (with caching)
   */
  static async getProductById(id: string): Promise<Product | undefined> {
    try {
      // Check cache first
      const cached = useCacheStore.getState().getProductCache(id);
      if (cached) {
        return cached;
      }

      const product = await db.products.get(id);
      const enriched = product ? this.enrichProduct(product) : undefined;
      
      // Cache the result
      if (enriched) {
        useCacheStore.getState().setProductCache(id, enriched);
      }
      
      return enriched;
    } catch (error) {
      console.error('Error getting product by ID:', error);
      throw new Error(`Failed to retrieve product with ID: ${id}`);
    }
  }

  /**
   * Get a product by SKU
   */
  static async getProductBySKU(sku: string): Promise<Product | undefined> {
    try {
      const product = await db.products.where({ sku }).first();
      return product ? this.enrichProduct(product) : undefined;
    } catch (error) {
      console.error('Error getting product by SKU:', error);
      throw new Error(`Failed to retrieve product with SKU: ${sku}`);
    }
  }

  /**
   * Create a new product
   */
  static async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
      // Check for duplicate SKU
      const existing = await this.getProductBySKU(productData.sku);
      if (existing) {
        throw new Error(`Product with SKU ${productData.sku} already exists`);
      }

      const product: Product = {
        ...productData,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.products.add(product);

      // Log the action
      await this.logAction('product_created', product.id, {
        sku: product.sku,
        name: product.name,
        category: product.category,
      });

      return this.enrichProduct(product);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Update an existing product
   */
  static async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    try {
      const existing = await db.products.get(id);
      if (!existing) {
        throw new Error(`Product with ID ${id} not found`);
      }

      // Check for SKU uniqueness if SKU is being updated
      if (updates.sku && updates.sku !== existing.sku) {
        const duplicate = await this.getProductBySKU(updates.sku);
        if (duplicate) {
          throw new Error(`Product with SKU ${updates.sku} already exists`);
        }
      }

      // Track price changes
      if (updates.unitPrice && updates.unitPrice !== existing.unitPrice) {
        await RelationshipManager.onProductPriceChanged(
          id,
          existing.unitPrice,
          updates.unitPrice,
          updates.createdBy || 'system'
        );
      }

      await db.products.update(id, {
        ...updates,
        updatedAt: new Date(),
      });

      const updated = await db.products.get(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated product');
      }

      // Invalidate cache for this product
      useCacheStore.getState().clearProductCache();

      // Log the action
      await this.logAction('product_updated', id, {
        changes: updates,
      });

      return this.enrichProduct(updated);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  /**
   * Delete a product (soft delete by setting isActive to false)
   */
  static async deleteProduct(id: string): Promise<void> {
    try {
      const product = await db.products.get(id);
      if (!product) {
        throw new Error(`Product with ID ${id} not found`);
      }

      // Check if product is used in any active orders
      const activeOrders = await db.orders
        .filter(order => 
          order.items.some(item => item.productId === id) &&
          ['pending', 'confirmed', 'processing'].includes(order.status)
        )
        .count();

      if (activeOrders > 0) {
        throw new Error('Cannot delete product that is used in active orders');
      }

      // Soft delete
      await db.products.update(id, {
        isActive: false,
        updatedAt: new Date(),
      });

      // Log the action
      await this.logAction('product_deleted', id, {
        sku: product.sku,
        name: product.name,
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  /**
   * Search products by term
   */
  static async searchProducts(searchTerm: string, filters?: ProductFilters): Promise<Product[]> {
    return this.getProducts({
      ...filters,
      searchTerm,
    });
  }

  /**
   * Get products with low stock
   */
  static async getLowStockProducts(): Promise<Product[]> {
    try {
      const products = await db.products
        .where('isActive')
        .equals(1)
        .toArray();

      const lowStockProducts = products.filter(p => 
        p.stockQuantity > 0 && p.stockQuantity <= p.reorderLevel
      );

      // Trigger low stock detection for each product
      for (const product of lowStockProducts) {
        await RelationshipManager.onLowStockDetected(product.id);
      }

      return lowStockProducts.map(p => this.enrichProduct(p));
    } catch (error) {
      console.error('Error getting low stock products:', error);
      throw new Error('Failed to retrieve low stock products');
    }
  }

  /**
   * Get products expiring within specified days
   */
  static async getExpiringProducts(daysUntilExpiry: number = 90): Promise<Product[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysUntilExpiry);

      const products = await db.products
        .where('isActive')
        .equals(1)
        .and(p => p.expiryDate !== undefined && p.expiryDate <= cutoffDate)
        .toArray();

      return products.map(p => this.enrichProduct(p));
    } catch (error) {
      console.error('Error getting expiring products:', error);
      throw new Error('Failed to retrieve expiring products');
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const products = await db.products
        .where('[category+isActive]')
        .equals([category, 1])
        .toArray();

      return products.map(p => this.enrichProduct(p));
    } catch (error) {
      console.error('Error getting products by category:', error);
      throw new Error(`Failed to retrieve products in category: ${category}`);
    }
  }

  /**
   * Get products by manufacturer
   */
  static async getProductsByManufacturer(manufacturer: string): Promise<Product[]> {
    try {
      const products = await db.products
        .where('[manufacturer+isActive]')
        .equals([manufacturer, 1])
        .toArray();

      return products.map(p => this.enrichProduct(p));
    } catch (error) {
      console.error('Error getting products by manufacturer:', error);
      throw new Error(`Failed to retrieve products by manufacturer: ${manufacturer}`);
    }
  }

  /**
   * Get all unique categories
   */
  static async getCategories(): Promise<string[]> {
    try {
      const products = await db.products.toArray();
      const categories = [...new Set(products.map(p => p.category))];
      return categories.sort();
    } catch (error) {
      console.error('Error getting categories:', error);
      throw new Error('Failed to retrieve categories');
    }
  }

  /**
   * Get all unique manufacturers
   */
  static async getManufacturers(): Promise<string[]> {
    try {
      const products = await db.products.toArray();
      const manufacturers = [...new Set(products.map(p => p.manufacturer))];
      return manufacturers.sort();
    } catch (error) {
      console.error('Error getting manufacturers:', error);
      throw new Error('Failed to retrieve manufacturers');
    }
  }

  /**
   * Bulk update products
   */
  static async bulkUpdateProducts(updates: Array<{ id: string; data: Partial<Product> }>): Promise<void> {
    try {
      await db.transaction('rw', db.products, async () => {
        for (const update of updates) {
          await this.updateProduct(update.id, update.data);
        }
      });

      // Log the action
      await this.logAction('products_bulk_updated', 'bulk', {
        count: updates.length,
      });
    } catch (error) {
      console.error('Error bulk updating products:', error);
      throw new Error('Failed to bulk update products');
    }
  }

  /**
   * Get product statistics
   */
  static async getProductStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
    outOfStock: number;
    expiringSoon: number;
    totalValue: number;
  }> {
    try {
      const allProducts = await db.products.toArray();
      const lowStockProducts = await this.getLowStockProducts();
      const expiringProducts = await this.getExpiringProducts();

      const active = allProducts.filter(p => p.isActive).length;
      const outOfStock = allProducts.filter(p => p.stockQuantity === 0).length;
      const totalValue = allProducts.reduce((sum, p) => sum + (p.unitPrice * p.stockQuantity), 0);

      return {
        total: allProducts.length,
        active,
        inactive: allProducts.length - active,
        lowStock: lowStockProducts.length,
        outOfStock,
        expiringSoon: expiringProducts.length,
        totalValue,
      };
    } catch (error) {
      console.error('Error getting product stats:', error);
      throw new Error('Failed to retrieve product statistics');
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Enrich product with computed fields
   */
  private static enrichProduct(product: Product): Product {
    return {
      ...product,
      profitMargin: calculateProfitMargin(product.unitPrice, product.costPrice),
      stockStatus: calculateStockStatus(product.stockQuantity, product.reorderLevel),
    };
  }

  /**
   * Log an action to system logs
   */
  private static async logAction(action: string, entityId: string, details: any): Promise<void> {
    try {
      await db.systemLogs.add({
        id: uuidv4(),
        action,
        entityType: 'product',
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
  getProducts,
  getPaginatedProducts,
  getProductById,
  getProductBySKU,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getLowStockProducts,
  getExpiringProducts,
  getProductsByCategory,
  getProductsByManufacturer,
  getCategories,
  getManufacturers,
  bulkUpdateProducts,
  getProductStats,
} = ProductService;
