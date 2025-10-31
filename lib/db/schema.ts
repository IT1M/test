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
  Rejection,
  RejectionReason,
  QualityInspection,
  Employee,
  Department,
  Position,
  Attendance,
  Leave,
  Payroll,
  PerformanceReview,
  Training,
  JobPosting,
  Applicant,
  Interview,
  RecruitmentPipeline,
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
  rejections!: Table<Rejection, string>;
  rejectionReasons!: Table<RejectionReason, string>;
  qualityInspections!: Table<QualityInspection, string>;
  employees!: Table<Employee, string>;
  departments!: Table<Department, string>;
  positions!: Table<Position, string>;
  attendance!: Table<Attendance, string>;
  leaves!: Table<Leave, string>;
  payroll!: Table<Payroll, string>;
  performanceReviews!: Table<PerformanceReview, string>;
  training!: Table<Training, string>;
  jobPostings!: Table<JobPosting, string>;
  applicants!: Table<Applicant, string>;
  interviews!: Table<Interview, string>;
  recruitmentPipeline!: Table<RecruitmentPipeline, string>;

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
      
      // Rejections table with indexes for quality control
      rejections: 'id, rejectionId, itemCode, productId, machineName, lotNumber, batchNumber, rejectionDate, rejectionType, inspectorId, supplierId, status, severity, createdAt, [productId+rejectionDate], [batchNumber+rejectionDate], [lotNumber+rejectionDate], [itemCode+rejectionDate], [status+rejectionDate], [severity+status], [inspectorId+rejectionDate], [supplierId+rejectionDate]',
      
      // Rejection reasons table with indexes for categorization
      rejectionReasons: 'id, code, category, isActive, [category+isActive]',
      
      // Quality inspections table with indexes for tracking
      qualityInspections: 'id, inspectionId, productId, orderId, batchNumber, inspectionDate, inspectorId, inspectionType, status, createdAt, [productId+inspectionDate], [batchNumber+inspectionDate], [inspectorId+inspectionDate], [status+inspectionDate], [inspectionType+inspectionDate]',
      
      // HR Management tables
      // Employees table with indexes for HR operations
      employees: 'id, employeeId, nationalId, firstName, lastName, departmentId, positionId, managerId, hireDate, status, userId, createdAt, [departmentId+status], [positionId+status], [managerId+status], [status+hireDate], [firstName+lastName]',
      
      // Departments table with indexes for organizational structure
      departments: 'id, departmentId, name, managerId, parentDepartmentId, isActive, createdAt, [managerId+isActive], [parentDepartmentId+isActive]',
      
      // Positions table with indexes for job management
      positions: 'id, positionId, title, departmentId, level, isActive, createdAt, [departmentId+isActive], [level+isActive]',
      
      // Attendance table with indexes for tracking
      attendance: 'id, employeeId, date, status, createdAt, [employeeId+date], [employeeId+status], [date+status]',
      
      // Leaves table with indexes for leave management
      leaves: 'id, leaveId, employeeId, leaveType, startDate, endDate, status, requestDate, approvedBy, createdAt, [employeeId+status], [employeeId+startDate], [status+requestDate], [approvedBy+status]',
      
      // Payroll table with indexes for salary processing
      payroll: 'id, payrollId, employeeId, month, year, status, paymentDate, createdAt, [employeeId+month+year], [employeeId+status], [status+paymentDate]',
      
      // Performance reviews table with indexes for tracking
      performanceReviews: 'id, reviewId, employeeId, reviewDate, reviewerId, status, createdAt, [employeeId+reviewDate], [reviewerId+reviewDate], [status+reviewDate]',
      
      // Training table with indexes for learning management
      training: 'id, trainingId, title, category, type, startDate, endDate, status, createdAt, [category+status], [type+status], [startDate+status]',
      
      // Recruitment Management tables
      // Job postings table with indexes for recruitment
      jobPostings: 'id, jobId, title, departmentId, positionId, status, postedDate, closingDate, hiringManagerId, createdAt, [departmentId+status], [positionId+status], [status+postedDate], [hiringManagerId+status]',
      
      // Applicants table with indexes for tracking
      applicants: 'id, applicantId, jobId, firstName, lastName, email, phone, applicationDate, status, source, createdAt, [jobId+status], [jobId+applicationDate], [status+applicationDate], [source+status], [firstName+lastName]',
      
      // Interviews table with indexes for scheduling
      interviews: 'id, interviewId, applicantId, jobId, scheduledDate, type, status, createdAt, [applicantId+scheduledDate], [jobId+scheduledDate], [status+scheduledDate], [type+status]',
      
      // Recruitment pipeline table for tracking applicant journey
      recruitmentPipeline: 'id, applicantId, jobId, stage, enteredAt, exitedAt, [applicantId+stage], [jobId+stage], [stage+enteredAt]',
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

    this.rejections.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (!obj.rejectionDate) obj.rejectionDate = new Date();
    });

    this.rejections.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.qualityInspections.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.inspectionDate) obj.inspectionDate = new Date();
    });

    // HR Management hooks
    this.employees.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (!obj.hireDate) obj.hireDate = new Date();
      if (obj.status === undefined) obj.status = 'active';
    });

    this.employees.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.departments.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.isActive === undefined) obj.isActive = true;
    });

    this.departments.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.positions.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.isActive === undefined) obj.isActive = true;
    });

    this.positions.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.attendance.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.date) obj.date = new Date();
    });

    this.leaves.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (!obj.requestDate) obj.requestDate = new Date();
      if (obj.status === undefined) obj.status = 'pending';
    });

    this.leaves.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.payroll.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.status === undefined) obj.status = 'draft';
    });

    this.payroll.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.performanceReviews.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (!obj.reviewDate) obj.reviewDate = new Date();
      if (obj.status === undefined) obj.status = 'draft';
    });

    this.performanceReviews.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.training.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.status === undefined) obj.status = 'planned';
    });

    this.training.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    // Recruitment Management hooks
    this.jobPostings.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (!obj.postedDate) obj.postedDate = new Date();
      if (obj.status === undefined) obj.status = 'draft';
      if (obj.views === undefined) obj.views = 0;
      if (obj.applicationsCount === undefined) obj.applicationsCount = 0;
    });

    this.jobPostings.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.applicants.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (!obj.applicationDate) obj.applicationDate = new Date();
      if (obj.status === undefined) obj.status = 'applied';
    });

    this.applicants.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.interviews.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.status === undefined) obj.status = 'scheduled';
    });

    this.interviews.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.recruitmentPipeline.hook('creating', (primKey, obj) => {
      if (!obj.enteredAt) obj.enteredAt = new Date();
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
      this.rejections,
      this.rejectionReasons,
      this.qualityInspections,
      this.employees,
      this.departments,
      this.positions,
      this.attendance,
      this.leaves,
      this.payroll,
      this.performanceReviews,
      this.training,
      this.jobPostings,
      this.applicants,
      this.interviews,
      this.recruitmentPipeline,
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
        this.rejections.clear(),
        this.rejectionReasons.clear(),
        this.qualityInspections.clear(),
        this.employees.clear(),
        this.departments.clear(),
        this.positions.clear(),
        this.attendance.clear(),
        this.leaves.clear(),
        this.payroll.clear(),
        this.performanceReviews.clear(),
        this.training.clear(),
        this.jobPostings.clear(),
        this.applicants.clear(),
        this.interviews.clear(),
        this.recruitmentPipeline.clear(),
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
    rejections: number;
    qualityInspections: number;
    employees: number;
    departments: number;
    jobPostings: number;
    applicants: number;
    totalSize: number;
  }> {
    const [
      productsCount,
      customersCount,
      ordersCount,
      patientsCount,
      medicalRecordsCount,
      rejectionsCount,
      qualityInspectionsCount,
      employeesCount,
      departmentsCount,
      jobPostingsCount,
      applicantsCount,
    ] = await Promise.all([
      this.products.count(),
      this.customers.count(),
      this.orders.count(),
      this.patients.count(),
      this.medicalRecords.count(),
      this.rejections.count(),
      this.qualityInspections.count(),
      this.employees.count(),
      this.departments.count(),
      this.jobPostings.count(),
      this.applicants.count(),
    ]);

    // Estimate database size (rough calculation)
    const totalSize = await this.estimateSize();

    return {
      products: productsCount,
      customers: customersCount,
      orders: ordersCount,
      patients: patientsCount,
      medicalRecords: medicalRecordsCount,
      rejections: rejectionsCount,
      qualityInspections: qualityInspectionsCount,
      employees: employeesCount,
      departments: departmentsCount,
      jobPostings: jobPostingsCount,
      applicants: applicantsCount,
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
      rejections,
      rejectionReasons,
      qualityInspections,
      employees,
      departments,
      positions,
      attendance,
      leaves,
      payroll,
      performanceReviews,
      training,
      jobPostings,
      applicants,
      interviews,
      recruitmentPipeline,
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
      this.rejections.toArray(),
      this.rejectionReasons.toArray(),
      this.qualityInspections.toArray(),
      this.employees.toArray(),
      this.departments.toArray(),
      this.positions.toArray(),
      this.attendance.toArray(),
      this.leaves.toArray(),
      this.payroll.toArray(),
      this.performanceReviews.toArray(),
      this.training.toArray(),
      this.jobPostings.toArray(),
      this.applicants.toArray(),
      this.interviews.toArray(),
      this.recruitmentPipeline.toArray(),
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
        rejections,
        rejectionReasons,
        qualityInspections,
        employees,
        departments,
        positions,
        attendance,
        leaves,
        payroll,
        performanceReviews,
        training,
        jobPostings,
        applicants,
        interviews,
        recruitmentPipeline,
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
      this.rejections,
      this.rejectionReasons,
      this.qualityInspections,
      this.employees,
      this.departments,
      this.positions,
      this.attendance,
      this.leaves,
      this.payroll,
      this.performanceReviews,
      this.training,
      this.jobPostings,
      this.applicants,
      this.interviews,
      this.recruitmentPipeline,
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
      if (data.rejections) await this.rejections.bulkPut(data.rejections);
      if (data.rejectionReasons) await this.rejectionReasons.bulkPut(data.rejectionReasons);
      if (data.qualityInspections) await this.qualityInspections.bulkPut(data.qualityInspections);
      if (data.employees) await this.employees.bulkPut(data.employees);
      if (data.departments) await this.departments.bulkPut(data.departments);
      if (data.positions) await this.positions.bulkPut(data.positions);
      if (data.attendance) await this.attendance.bulkPut(data.attendance);
      if (data.leaves) await this.leaves.bulkPut(data.leaves);
      if (data.payroll) await this.payroll.bulkPut(data.payroll);
      if (data.performanceReviews) await this.performanceReviews.bulkPut(data.performanceReviews);
      if (data.training) await this.training.bulkPut(data.training);
      if (data.jobPostings) await this.jobPostings.bulkPut(data.jobPostings);
      if (data.applicants) await this.applicants.bulkPut(data.applicants);
      if (data.interviews) await this.interviews.bulkPut(data.interviews);
      if (data.recruitmentPipeline) await this.recruitmentPipeline.bulkPut(data.recruitmentPipeline);
    });
  }
}

// Create and export the database instance
export const db = new MedicalProductsDB();

// Export type for use in other files
export type DB = MedicalProductsDB;
