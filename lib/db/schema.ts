// Dexie.js Database Schema for Medical Products Company Management System

import Dexie, { Table } from 'dexie';
import type {
  Product,
  Customer,
  Order,
  Inventory,
  Sale,
  Patient,
  MedicalRecord,
  Quotation,
  Invoice,
  Payment,
  StockMovement,
  PurchaseOrder,
  SearchHistory,
  SystemLog,
  User,
} from '@/types/database';

/**
 * MedicalProductsDB - Main database class extending Dexie
 * 
 * This class defines the complete database schema with all tables and indexes
 * for the Medical Products Company Management System.
 */
export class MedicalProductsDB extends Dexie {
  // Table declarations with TypeScript types
  products!: Table<Product, string>;
  customers!: Table<Customer, string>;
  orders!: Table<Order, string>;
  inventory!: Table<Inventory, string>;
  sales!: Table<Sale, string>;
  patients!: Table<Patient, string>;
  medicalRecords!: Table<MedicalRecord, string>;
  quotations!: Table<Quotation, string>;
  invoices!: Table<Invoice, string>;
  payments!: Table<Payment, string>;
  stockMovements!: Table<StockMovement, string>;
  purchaseOrders!: Table<PurchaseOrder, string>;
  searchHistory!: Table<SearchHistory, string>;
  systemLogs!: Table<SystemLog, string>;
  users!: Table<User, string>;

  constructor() {
    super('MedicalProductsDB');
    
    // Define database schema version 1
    this.version(1).stores({
      // Products table with indexes for common queries
      products: 'id, sku, name, category, manufacturer, stockQuantity, expiryDate, isActive, createdAt, [category+isActive], [manufacturer+isActive], [stockQuantity+isActive]',
      
      // Customers table with indexes for searching and filtering
      customers: 'id, customerId, name, type, email, phone, segment, isActive, createdAt, [type+isActive], [segment+isActive]',
      
      // Orders table with compound indexes for common queries
      orders: 'id, orderId, customerId, orderDate, status, paymentStatus, salesPerson, createdAt, [customerId+status], [customerId+orderDate], [status+orderDate], [salesPerson+orderDate]',
      
      // Inventory table with indexes for stock management
      inventory: 'id, productId, warehouseLocation, quantity, lastRestocked, [productId+warehouseLocation], [quantity+productId]',
      
      // Sales table with indexes for analytics
      sales: 'id, saleId, orderId, customerId, saleDate, salesPerson, createdAt, [customerId+saleDate], [salesPerson+saleDate], [saleDate+salesPerson]',
      
      // Patients table with indexes for medical records
      patients: 'id, patientId, nationalId, firstName, lastName, linkedCustomerId, createdAt, [firstName+lastName], [linkedCustomerId+createdAt]',
      
      // Medical records table with indexes for patient history
      medicalRecords: 'id, recordId, patientId, recordType, visitDate, doctorName, hospitalName, createdAt, [patientId+visitDate], [patientId+recordType], [recordType+visitDate]',
      
      // Quotations table with indexes for sales workflow
      quotations: 'id, quotationId, customerId, status, validUntil, createdAt, [customerId+status], [status+validUntil]',
      
      // Invoices table with indexes for financial tracking
      invoices: 'id, invoiceId, orderId, customerId, dueDate, status, createdAt, [customerId+status], [status+dueDate], [orderId+status]',
      
      // Payments table with indexes for financial records
      payments: 'id, paymentId, invoiceId, customerId, paymentDate, createdAt, [invoiceId+paymentDate], [customerId+paymentDate]',
      
      // Stock movements table with indexes for inventory tracking
      stockMovements: 'id, productId, type, timestamp, performedBy, [productId+timestamp], [type+timestamp], [performedBy+timestamp]',
      
      // Purchase orders table with indexes for procurement
      purchaseOrders: 'id, poId, supplierId, orderDate, status, expectedDeliveryDate, createdAt, [supplierId+status], [status+orderDate]',
      
      // Search history table with indexes for analytics
      searchHistory: 'id, query, entityType, timestamp, userId, [userId+timestamp], [entityType+timestamp]',
      
      // System logs table with indexes for monitoring
      systemLogs: 'id, action, entityType, entityId, timestamp, userId, status, [entityType+timestamp], [userId+timestamp], [status+timestamp], [action+timestamp]',
      
      // Users table with indexes for authentication
      users: 'id, username, email, role, isActive, lastLogin, createdAt, [role+isActive]',
    });

    // Add hooks for automatic field updates
    this.products.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.isActive === undefined) obj.isActive = true;
    });

    this.products.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.customers.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.isActive === undefined) obj.isActive = true;
    });

    this.customers.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.orders.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (!obj.orderDate) obj.orderDate = new Date();
    });

    this.orders.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.inventory.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.patients.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
    });

    this.patients.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.medicalRecords.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
    });

    this.medicalRecords.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.quotations.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
    });

    this.quotations.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.purchaseOrders.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
    });

    this.purchaseOrders.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.users.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (obj.isActive === undefined) obj.isActive = true;
    });
  }

  /**
   * Clear all data from the database (useful for testing and reset)
   */
  async clearAllData(): Promise<void> {
    await this.transaction('rw', [
      this.products,
      this.customers,
      this.orders,
      this.inventory,
      this.sales,
      this.patients,
      this.medicalRecords,
      this.quotations,
      this.invoices,
      this.payments,
      this.stockMovements,
      this.purchaseOrders,
      this.searchHistory,
      this.systemLogs,
      this.users,
    ], async () => {
      await Promise.all([
        this.products.clear(),
        this.customers.clear(),
        this.orders.clear(),
        this.inventory.clear(),
        this.sales.clear(),
        this.patients.clear(),
        this.medicalRecords.clear(),
        this.quotations.clear(),
        this.invoices.clear(),
        this.payments.clear(),
        this.stockMovements.clear(),
        this.purchaseOrders.clear(),
        this.searchHistory.clear(),
        this.systemLogs.clear(),
        this.users.clear(),
      ]);
    });
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    products: number;
    customers: number;
    orders: number;
    patients: number;
    medicalRecords: number;
    totalSize: number;
  }> {
    const [
      productsCount,
      customersCount,
      ordersCount,
      patientsCount,
      medicalRecordsCount,
    ] = await Promise.all([
      this.products.count(),
      this.customers.count(),
      this.orders.count(),
      this.patients.count(),
      this.medicalRecords.count(),
    ]);

    // Estimate database size (rough calculation)
    const totalSize = await this.estimateSize();

    return {
      products: productsCount,
      customers: customersCount,
      orders: ordersCount,
      patients: patientsCount,
      medicalRecords: medicalRecordsCount,
      totalSize,
    };
  }

  /**
   * Estimate database size in bytes
   */
  private async estimateSize(): Promise<number> {
    // This is a rough estimation
    // In a real implementation, you might use navigator.storage.estimate()
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }

  /**
   * Export all data for backup
   */
  async exportAllData(): Promise<any> {
    const [
      products,
      customers,
      orders,
      inventory,
      sales,
      patients,
      medicalRecords,
      quotations,
      invoices,
      payments,
      stockMovements,
      purchaseOrders,
      searchHistory,
      systemLogs,
      users,
    ] = await Promise.all([
      this.products.toArray(),
      this.customers.toArray(),
      this.orders.toArray(),
      this.inventory.toArray(),
      this.sales.toArray(),
      this.patients.toArray(),
      this.medicalRecords.toArray(),
      this.quotations.toArray(),
      this.invoices.toArray(),
      this.payments.toArray(),
      this.stockMovements.toArray(),
      this.purchaseOrders.toArray(),
      this.searchHistory.toArray(),
      this.systemLogs.toArray(),
      this.users.toArray(),
    ]);

    return {
      version: 1,
      exportDate: new Date().toISOString(),
      data: {
        products,
        customers,
        orders,
        inventory,
        sales,
        patients,
        medicalRecords,
        quotations,
        invoices,
        payments,
        stockMovements,
        purchaseOrders,
        searchHistory,
        systemLogs,
        users,
      },
    };
  }

  /**
   * Import data from backup
   */
  async importAllData(backup: any): Promise<void> {
    await this.transaction('rw', [
      this.products,
      this.customers,
      this.orders,
      this.inventory,
      this.sales,
      this.patients,
      this.medicalRecords,
      this.quotations,
      this.invoices,
      this.payments,
      this.stockMovements,
      this.purchaseOrders,
      this.searchHistory,
      this.systemLogs,
      this.users,
    ], async () => {
      const data = backup.data;

      if (data.products) await this.products.bulkPut(data.products);
      if (data.customers) await this.customers.bulkPut(data.customers);
      if (data.orders) await this.orders.bulkPut(data.orders);
      if (data.inventory) await this.inventory.bulkPut(data.inventory);
      if (data.sales) await this.sales.bulkPut(data.sales);
      if (data.patients) await this.patients.bulkPut(data.patients);
      if (data.medicalRecords) await this.medicalRecords.bulkPut(data.medicalRecords);
      if (data.quotations) await this.quotations.bulkPut(data.quotations);
      if (data.invoices) await this.invoices.bulkPut(data.invoices);
      if (data.payments) await this.payments.bulkPut(data.payments);
      if (data.stockMovements) await this.stockMovements.bulkPut(data.stockMovements);
      if (data.purchaseOrders) await this.purchaseOrders.bulkPut(data.purchaseOrders);
      if (data.searchHistory) await this.searchHistory.bulkPut(data.searchHistory);
      if (data.systemLogs) await this.systemLogs.bulkPut(data.systemLogs);
      if (data.users) await this.users.bulkPut(data.users);
    });
  }
}

// Create and export the database instance
export const db = new MedicalProductsDB();

// Export type for use in other files
export type DB = MedicalProductsDB;
