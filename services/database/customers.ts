// Customer Service - CRUD operations and business logic for customers

import { db } from '@/lib/db/schema';
import type { Customer, CustomerType, CustomerSegment, PaginatedResult } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';
import { useCacheStore, generateCacheKey } from '@/store/cacheStore';
import { DataEncryption } from '@/lib/security/encryption';

/**
 * Customer filters for search and filtering
 */
export interface CustomerFilters {
  type?: CustomerType;
  segment?: CustomerSegment;
  isActive?: boolean;
  searchTerm?: string;
  city?: string;
  country?: string;
}

/**
 * CustomerService - Handles all customer-related database operations
 */
export class CustomerService {
  /**
   * Get all customers with optional filters (with caching)
   */
  static async getCustomers(filters?: CustomerFilters): Promise<Customer[]> {
    try {
      // Generate cache key from filters
      const cacheKey = generateCacheKey('customers', filters || {});
      
      // Check cache first
      const cached = useCacheStore.getState().getSearchCache(cacheKey);
      if (cached) {
        return cached;
      }

      let query = db.customers.toCollection();

      // Apply filters
      if (filters?.isActive !== undefined) {
        query = query.filter(c => c.isActive === filters.isActive);
      }

      if (filters?.type) {
        query = query.filter(c => c.type === filters.type);
      }

      if (filters?.segment) {
        query = query.filter(c => c.segment === filters.segment);
      }

      if (filters?.city) {
        query = query.filter(c => c.city === filters.city);
      }

      if (filters?.country) {
        query = query.filter(c => c.country === filters.country);
      }

      if (filters?.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        query = query.filter(c => 
          c.name.toLowerCase().includes(searchLower) ||
          c.customerId.toLowerCase().includes(searchLower) ||
          c.email.toLowerCase().includes(searchLower) ||
          c.phone.includes(searchLower) ||
          c.contactPerson.toLowerCase().includes(searchLower)
        );
      }

      const customers = await query.toArray();
      
      // Decrypt sensitive data for all customers
      const decryptedCustomers = customers.map(customer => 
        DataEncryption.decryptCustomerData(customer)
      );
      
      // Cache the decrypted results
      useCacheStore.getState().setSearchCache(cacheKey, decryptedCustomers);
      
      return decryptedCustomers;
    } catch (error) {
      console.error('Error getting customers:', error);
      throw new Error('Failed to retrieve customers');
    }
  }

  /**
   * Get paginated customers
   */
  static async getPaginatedCustomers(
    page: number = 1,
    pageSize: number = 20,
    filters?: CustomerFilters
  ): Promise<PaginatedResult<Customer>> {
    try {
      const allCustomers = await this.getCustomers(filters);
      const total = allCustomers.length;
      const totalPages = Math.ceil(total / pageSize);
      const offset = (page - 1) * pageSize;
      const data = allCustomers.slice(offset, offset + pageSize);

      return {
        data,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error('Error getting paginated customers:', error);
      throw new Error('Failed to retrieve paginated customers');
    }
  }

  /**
   * Get a single customer by ID (with caching)
   */
  static async getCustomerById(id: string): Promise<Customer | undefined> {
    try {
      // Check cache first
      const cached = useCacheStore.getState().getCustomerCache(id);
      if (cached) {
        return cached;
      }

      const customer = await db.customers.get(id);
      
      if (!customer) {
        return undefined;
      }

      // Decrypt sensitive data
      const decryptedCustomer = DataEncryption.decryptCustomerData(customer);
      
      // Cache the decrypted result
      useCacheStore.getState().setCustomerCache(id, decryptedCustomer);
      
      return decryptedCustomer;
    } catch (error) {
      console.error('Error getting customer by ID:', error);
      throw new Error(`Failed to retrieve customer with ID: ${id}`);
    }
  }

  /**
   * Get a customer by customer ID (business ID)
   */
  static async getCustomerByCustomerId(customerId: string): Promise<Customer | undefined> {
    try {
      return await db.customers.where({ customerId }).first();
    } catch (error) {
      console.error('Error getting customer by customer ID:', error);
      throw new Error(`Failed to retrieve customer with customer ID: ${customerId}`);
    }
  }

  /**
   * Get a customer by email
   */
  static async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    try {
      return await db.customers.where({ email }).first();
    } catch (error) {
      console.error('Error getting customer by email:', error);
      throw new Error(`Failed to retrieve customer with email: ${email}`);
    }
  }

  /**
   * Create a new customer
   */
  static async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'lifetimeValue' | 'segment'>): Promise<Customer> {
    try {
      // Check for duplicate customer ID
      const existingById = await this.getCustomerByCustomerId(customerData.customerId);
      if (existingById) {
        throw new Error(`Customer with ID ${customerData.customerId} already exists`);
      }

      // Check for duplicate email
      const existingByEmail = await this.getCustomerByEmail(customerData.email);
      if (existingByEmail) {
        throw new Error(`Customer with email ${customerData.email} already exists`);
      }

      const customer: Customer = {
        ...customerData,
        id: uuidv4(),
        segment: 'New', // New customers start as 'New' segment
        lifetimeValue: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Encrypt sensitive data before storing
      const encryptedCustomer = DataEncryption.encryptCustomerData(customer);

      await db.customers.add(encryptedCustomer);

      // Log the action
      await this.logAction('customer_created', customer.id, {
        customerId: customer.customerId,
        name: customer.name,
        type: customer.type,
      });

      // Return unencrypted data to the caller
      return customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Update an existing customer
   */
  static async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    try {
      const existing = await db.customers.get(id);
      if (!existing) {
        throw new Error(`Customer with ID ${id} not found`);
      }

      // Decrypt existing data
      const decryptedExisting = DataEncryption.decryptCustomerData(existing);

      // Check for customer ID uniqueness if being updated
      if (updates.customerId && updates.customerId !== decryptedExisting.customerId) {
        const duplicate = await this.getCustomerByCustomerId(updates.customerId);
        if (duplicate) {
          throw new Error(`Customer with ID ${updates.customerId} already exists`);
        }
      }

      // Check for email uniqueness if being updated
      if (updates.email && updates.email !== decryptedExisting.email) {
        const duplicate = await this.getCustomerByEmail(updates.email);
        if (duplicate) {
          throw new Error(`Customer with email ${updates.email} already exists`);
        }
      }

      // Encrypt sensitive fields in updates
      const encryptedUpdates = DataEncryption.encryptCustomerData({
        ...updates,
        updatedAt: new Date(),
      });

      await db.customers.update(id, encryptedUpdates);

      const updated = await db.customers.get(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated customer');
      }

      // Log the action
      await this.logAction('customer_updated', id, {
        changes: Object.keys(updates),
      });

      // Return decrypted data
      return DataEncryption.decryptCustomerData(updated);
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Delete a customer (soft delete by setting isActive to false)
   */
  static async deleteCustomer(id: string): Promise<void> {
    try {
      const customer = await db.customers.get(id);
      if (!customer) {
        throw new Error(`Customer with ID ${id} not found`);
      }

      // Check if customer has active orders
      const activeOrders = await db.orders
        .where({ customerId: id })
        .and(order => ['pending', 'confirmed', 'processing'].includes(order.status))
        .count();

      if (activeOrders > 0) {
        throw new Error('Cannot delete customer with active orders');
      }

      // Soft delete
      await db.customers.update(id, {
        isActive: false,
        updatedAt: new Date(),
      });

      // Log the action
      await this.logAction('customer_deleted', id, {
        customerId: customer.customerId,
        name: customer.name,
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  /**
   * Calculate customer lifetime value
   */
  static async calculateLifetimeValue(customerId: string): Promise<number> {
    try {
      const orders = await db.orders
        .where({ customerId })
        .and(order => order.status === 'completed' || order.status === 'delivered')
        .toArray();

      const lifetimeValue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

      // Update customer record
      await db.customers.update(customerId, {
        lifetimeValue,
        updatedAt: new Date(),
      });

      return lifetimeValue;
    } catch (error) {
      console.error('Error calculating lifetime value:', error);
      throw new Error(`Failed to calculate lifetime value for customer: ${customerId}`);
    }
  }

  /**
   * Update customer segmentation
   */
  static async updateCustomerSegmentation(customerId: string): Promise<CustomerSegment> {
    try {
      const customer = await db.customers.get(customerId);
      if (!customer) {
        throw new Error(`Customer with ID ${customerId} not found`);
      }

      const orders = await db.orders
        .where({ customerId })
        .toArray();

      const completedOrders = orders.filter(o => 
        o.status === 'completed' || o.status === 'delivered'
      );

      const lifetimeValue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);

      // Determine segment based on lifetime value and order count
      let segment: CustomerSegment = 'Regular';

      if (completedOrders.length === 0) {
        segment = 'New';
      } else if (lifetimeValue > 100000) {
        segment = 'VIP';
      } else if (completedOrders.length > 0) {
        const lastOrderDate = new Date(Math.max(...completedOrders.map(o => o.orderDate.getTime())));
        const daysSinceLastOrder = (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLastOrder > 180) {
          segment = 'Inactive';
        } else {
          segment = 'Regular';
        }
      }

      // Update customer
      await db.customers.update(customerId, {
        segment,
        lifetimeValue,
        updatedAt: new Date(),
      });

      return segment;
    } catch (error) {
      console.error('Error updating customer segmentation:', error);
      throw new Error(`Failed to update segmentation for customer: ${customerId}`);
    }
  }

  /**
   * Get customers by segment
   */
  static async getCustomersBySegment(segment: CustomerSegment): Promise<Customer[]> {
    try {
      return await db.customers
        .where('[segment+isActive]')
        .equals([segment, 1])
        .toArray();
    } catch (error) {
      console.error('Error getting customers by segment:', error);
      throw new Error(`Failed to retrieve customers in segment: ${segment}`);
    }
  }

  /**
   * Get customers by type
   */
  static async getCustomersByType(type: CustomerType): Promise<Customer[]> {
    try {
      return await db.customers
        .where('[type+isActive]')
        .equals([type, 1])
        .toArray();
    } catch (error) {
      console.error('Error getting customers by type:', error);
      throw new Error(`Failed to retrieve customers of type: ${type}`);
    }
  }

  /**
   * Get top customers by lifetime value
   */
  static async getTopCustomers(limit: number = 10): Promise<Customer[]> {
    try {
      const customers = await db.customers
        .where('isActive')
        .equals(1)
        .toArray();

      return customers
        .sort((a, b) => (b.lifetimeValue || 0) - (a.lifetimeValue || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top customers:', error);
      throw new Error('Failed to retrieve top customers');
    }
  }

  /**
   * Get customer order history
   */
  static async getCustomerOrderHistory(customerId: string): Promise<any[]> {
    try {
      return await db.orders
        .where({ customerId })
        .reverse()
        .sortBy('orderDate');
    } catch (error) {
      console.error('Error getting customer order history:', error);
      throw new Error(`Failed to retrieve order history for customer: ${customerId}`);
    }
  }

  /**
   * Get customer payment history
   */
  static async getCustomerPaymentHistory(customerId: string): Promise<any[]> {
    try {
      return await db.payments
        .where({ customerId })
        .reverse()
        .sortBy('paymentDate');
    } catch (error) {
      console.error('Error getting customer payment history:', error);
      throw new Error(`Failed to retrieve payment history for customer: ${customerId}`);
    }
  }

  /**
   * Get customer outstanding balance
   */
  static async getCustomerOutstandingBalance(customerId: string): Promise<number> {
    try {
      const invoices = await db.invoices
        .where({ customerId })
        .and(invoice => invoice.status !== 'paid')
        .toArray();

      return invoices.reduce((sum, invoice) => sum + invoice.balanceAmount, 0);
    } catch (error) {
      console.error('Error getting customer outstanding balance:', error);
      throw new Error(`Failed to retrieve outstanding balance for customer: ${customerId}`);
    }
  }

  /**
   * Search customers
   */
  static async searchCustomers(searchTerm: string, filters?: CustomerFilters): Promise<Customer[]> {
    return this.getCustomers({
      ...filters,
      searchTerm,
    });
  }

  /**
   * Get customer statistics
   */
  static async getCustomerStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<CustomerType, number>;
    bySegment: Record<CustomerSegment, number>;
    totalLifetimeValue: number;
    averageLifetimeValue: number;
  }> {
    try {
      const allCustomers = await db.customers.toArray();
      const activeCustomers = allCustomers.filter(c => c.isActive);

      const byType: Record<CustomerType, number> = {
        hospital: 0,
        clinic: 0,
        pharmacy: 0,
        distributor: 0,
      };

      const bySegment: Record<CustomerSegment, number> = {
        VIP: 0,
        Regular: 0,
        New: 0,
        Inactive: 0,
      };

      let totalLifetimeValue = 0;

      for (const customer of activeCustomers) {
        byType[customer.type]++;
        if (customer.segment) {
          bySegment[customer.segment]++;
        }
        totalLifetimeValue += customer.lifetimeValue || 0;
      }

      return {
        total: allCustomers.length,
        active: activeCustomers.length,
        inactive: allCustomers.length - activeCustomers.length,
        byType,
        bySegment,
        totalLifetimeValue,
        averageLifetimeValue: activeCustomers.length > 0 ? totalLifetimeValue / activeCustomers.length : 0,
      };
    } catch (error) {
      console.error('Error getting customer stats:', error);
      throw new Error('Failed to retrieve customer statistics');
    }
  }

  /**
   * Bulk update customer segmentation
   */
  static async bulkUpdateSegmentation(): Promise<void> {
    try {
      const customers = await db.customers.where('isActive').equals(1).toArray();

      await db.transaction('rw', db.customers, async () => {
        for (const customer of customers) {
          await this.updateCustomerSegmentation(customer.id);
        }
      });

      // Log the action
      await this.logAction('customers_bulk_segmentation_updated', 'bulk', {
        count: customers.length,
      });
    } catch (error) {
      console.error('Error bulk updating customer segmentation:', error);
      throw new Error('Failed to bulk update customer segmentation');
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
        entityType: 'customer',
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
  getCustomers,
  getPaginatedCustomers,
  getCustomerById,
  getCustomerByCustomerId,
  getCustomerByEmail,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  calculateLifetimeValue,
  updateCustomerSegmentation,
  getCustomersBySegment,
  getCustomersByType,
  getTopCustomers,
  getCustomerOrderHistory,
  getCustomerPaymentHistory,
  getCustomerOutstandingBalance,
  searchCustomers,
  getCustomerStats,
  bulkUpdateSegmentation,
} = CustomerService;
