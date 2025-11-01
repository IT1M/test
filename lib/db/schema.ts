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
  Supplier,
  SupplierEvaluation,
  SupplierContract,
  ComplianceRequirement,
  ComplianceReport,
  ComplianceAlert,
  AuditLog,
  AuditTrailExport,
  AuditSchedule,
  AuditFinding,
  DataRetentionPolicy,
  DataRetentionExecution,
  ConsentRecord,
  DataSubjectRequest,
  DataBreachIncident,
  DataProcessingActivity,
  PrivacyImpactAssessment,
  AIActivityLog,
  AIConfigurationHistory,
  AIConfigurationSnapshot,
  AIAutomationRule,
  AIModelMetrics,
  SecurityAuditLog,
  AIAlert,
  AIAlertRule,
  AICostBudget,
  Machine,
  ProductionRun,
  MachineDowntime,
  MaintenanceSchedule,
  MachineMetrics,
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
  suppliers!: Table<Supplier, string>;
  supplierEvaluations!: Table<SupplierEvaluation, string>;
  supplierContracts!: Table<SupplierContract, string>;
  complianceRequirements!: Table<ComplianceRequirement, string>;
  complianceReports!: Table<ComplianceReport, string>;
  complianceAlerts!: Table<ComplianceAlert, string>;
  auditLogs!: Table<AuditLog, string>;
  auditTrailExports!: Table<AuditTrailExport, string>;
  auditSchedules!: Table<AuditSchedule, string>;
  auditFindings!: Table<AuditFinding, string>;
  dataRetentionPolicies!: Table<DataRetentionPolicy, string>;
  dataRetentionExecutions!: Table<DataRetentionExecution, string>;
  consentRecords!: Table<ConsentRecord, string>;
  dataSubjectRequests!: Table<DataSubjectRequest, string>;
  dataBreachIncidents!: Table<DataBreachIncident, string>;
  dataProcessingActivities!: Table<DataProcessingActivity, string>;
  privacyImpactAssessments!: Table<PrivacyImpactAssessment, string>;
  
  // AI Control Center tables
  aiActivityLogs!: Table<AIActivityLog, string>;
  aiConfigurationHistory!: Table<AIConfigurationHistory, string>;
  aiConfigurationSnapshots!: Table<AIConfigurationSnapshot, string>;
  aiAutomationRules!: Table<AIAutomationRule, string>;
  aiModelMetrics!: Table<AIModelMetrics, string>;
  securityAuditLogs!: Table<SecurityAuditLog, string>;
  aiAlerts!: Table<AIAlert, string>;
  aiAlertRules!: Table<AIAlertRule, string>;
  aiCostBudgets!: Table<AICostBudget, string>;
  
  // Manufacturing Operations tables
  machines!: Table<Machine, string>;
  productionRuns!: Table<ProductionRun, string>;
  machineDowntime!: Table<MachineDowntime, string>;
  maintenanceSchedule!: Table<MaintenanceSchedule, string>;
  machineMetrics!: Table<MachineMetrics, string>;

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
      
      // Supply Chain Management tables
      // Suppliers table with indexes for supplier management
      suppliers: 'id, supplierId, name, type, email, phone, country, status, isPreferred, rating, createdAt, [type+status], [status+isPreferred], [country+status], [rating+status]',
      
      // Supplier evaluations table with indexes for performance tracking
      supplierEvaluations: 'id, supplierId, evaluationDate, evaluatorId, period, status, overallScore, createdAt, [supplierId+evaluationDate], [supplierId+status], [evaluatorId+evaluationDate], [status+evaluationDate]',
      
      // Supplier contracts table with indexes for contract management
      supplierContracts: 'id, contractId, supplierId, contractType, startDate, endDate, status, renewalDate, createdAt, [supplierId+status], [status+endDate], [contractType+status], [endDate+status]',
      
      // Compliance and Regulatory Management tables
      // Compliance requirements table with indexes for tracking
      complianceRequirements: 'id, requirementId, title, category, priority, regulatoryBody, region, status, complianceDeadline, nextReviewDate, ownerId, createdAt, [category+status], [priority+status], [regulatoryBody+status], [region+status], [status+complianceDeadline], [ownerId+status], [nextReviewDate+status]',
      
      // Compliance reports table with indexes for reporting
      complianceReports: 'id, reportId, reportType, reportingPeriodStart, reportingPeriodEnd, generatedDate, generatedBy, status, createdAt, [reportType+status], [generatedDate+status], [generatedBy+generatedDate], [status+generatedDate]',
      
      // Compliance alerts table with indexes for notifications
      complianceAlerts: 'id, requirementId, alertType, severity, dueDate, acknowledgedBy, createdAt, [requirementId+alertType], [alertType+severity], [severity+dueDate], [acknowledgedBy+createdAt]',
      
      // Enhanced audit logs table with indexes for comprehensive tracking
      auditLogs: 'id, logId, timestamp, eventType, entityType, entityId, userId, username, userRole, ipAddress, source, isSecurityEvent, isCriticalOperation, complianceRelevant, status, createdAt, [timestamp+entityType], [entityType+entityId], [userId+timestamp], [eventType+timestamp], [isSecurityEvent+timestamp], [isCriticalOperation+timestamp], [complianceRelevant+timestamp], [status+timestamp]',
      
      // Audit trail exports table with indexes for export management
      auditTrailExports: 'id, exportId, requestedBy, requestDate, startDate, endDate, status, createdAt, [requestedBy+requestDate], [status+requestDate], [startDate+endDate]',
      
      // Audit schedules table with indexes for audit planning
      auditSchedules: 'id, scheduleId, auditType, scheduledDate, leadAuditorId, status, createdAt, [auditType+status], [scheduledDate+status], [leadAuditorId+scheduledDate], [status+scheduledDate]',
      
      // Audit findings table with indexes for tracking
      auditFindings: 'id, findingId, auditScheduleId, severity, category, assignedTo, dueDate, status, createdAt, [auditScheduleId+status], [severity+status], [assignedTo+dueDate], [status+dueDate]',
      
      // Data retention policies table with indexes for policy management
      dataRetentionPolicies: 'id, policyId, name, entityType, dataCategory, retentionPeriod, actionAfterRetention, isActive, effectiveDate, reviewDate, createdAt, [entityType+isActive], [dataCategory+isActive], [isActive+reviewDate]',
      
      // Data retention executions table with indexes for tracking
      dataRetentionExecutions: 'id, executionId, policyId, executionDate, executedBy, status, createdAt, [policyId+executionDate], [executionDate+status], [executedBy+executionDate]',
      
      // Consent records table with indexes for consent management
      consentRecords: 'id, consentId, subjectType, subjectId, consentType, status, grantedDate, withdrawnDate, expiryDate, createdAt, [subjectType+subjectId], [subjectId+consentType], [consentType+status], [status+expiryDate]',
      
      // Data subject requests table with indexes for GDPR/HIPAA compliance
      dataSubjectRequests: 'id, requestId, subjectType, subjectId, requestType, requestDate, status, dueDate, assignedTo, createdAt, [subjectType+subjectId], [subjectId+requestType], [requestType+status], [status+dueDate], [assignedTo+status]',
      
      // Data breach incidents table with indexes for incident management
      dataBreachIncidents: 'id, incidentId, discoveredDate, occurredDate, severity, breachType, riskLevel, investigationStatus, status, incidentLeadId, createdAt, [severity+status], [breachType+status], [riskLevel+status], [investigationStatus+status], [incidentLeadId+discoveredDate]',
      
      // Data processing activities table with indexes for GDPR compliance
      dataProcessingActivities: 'id, activityId, name, entityType, purpose, legalBasis, isActive, lastReviewDate, nextReviewDate, createdAt, [entityType+isActive], [purpose+isActive], [isActive+nextReviewDate]',
      
      // Privacy impact assessments table with indexes for risk management
      privacyImpactAssessments: 'id, assessmentId, title, assessmentDate, assessorId, overallRiskLevel, residualRiskLevel, status, nextReviewDate, createdAt, [assessorId+assessmentDate], [overallRiskLevel+status], [status+nextReviewDate]',
      
      // AI Control Center tables
      // AI activity logs table with indexes for monitoring and analysis
      aiActivityLogs: 'id, timestamp, userId, modelName, operationType, status, confidenceScore, executionTime, entityType, entityId, createdAt, [timestamp+modelName], [modelName+operationType], [userId+timestamp], [operationType+status], [status+timestamp], [modelName+status], [entityType+entityId]',
      
      // AI configuration history table with indexes for audit trail
      aiConfigurationHistory: 'id, timestamp, userId, settingName, settingCategory, impactLevel, approvedBy, createdAt, [timestamp+settingName], [userId+timestamp], [settingCategory+timestamp], [settingName+timestamp]',
      
      // AI configuration snapshots table with indexes for rollback
      aiConfigurationSnapshots: 'id, snapshotName, createdAt, createdBy, isAutomatic, restoredAt, [createdAt+isAutomatic], [createdBy+createdAt]',
      
      // AI automation rules table with indexes for rule management
      aiAutomationRules: 'id, ruleName, triggerType, aiOperation, modelName, status, isActive, lastExecution, successRate, createdAt, updatedAt, [status+isActive], [triggerType+isActive], [modelName+isActive], [lastExecution+status], [successRate+isActive]',
      
      // AI model metrics table with indexes for performance tracking
      aiModelMetrics: 'id, modelName, date, totalCalls, successfulCalls, failedCalls, avgResponseTime, avgConfidence, totalCost, createdAt, [modelName+date], [date+modelName], [modelName+totalCalls]',
      
      // Security audit logs table with indexes for security monitoring
      securityAuditLogs: 'id, timestamp, userId, username, userRole, action, actionCategory, resourceType, outcome, isSuspicious, requiresMFA, createdAt, [timestamp+userId], [userId+action], [action+outcome], [actionCategory+timestamp], [resourceType+action], [outcome+timestamp], [isSuspicious+timestamp]',
      
      // AI alerts table with indexes for alert management
      aiAlerts: 'id, alertId, alertType, severity, status, modelName, createdAt, updatedAt, acknowledgedAt, resolvedAt, snoozedUntil, [alertType+status], [severity+status], [status+createdAt], [modelName+alertType], [createdAt+severity]',
      
      // AI alert rules table with indexes for rule management
      aiAlertRules: 'id, ruleName, conditionType, alertType, severity, isActive, lastTriggered, triggerCount, createdAt, updatedAt, [isActive+conditionType], [alertType+isActive], [lastTriggered+isActive]',
      
      // AI cost budgets table with indexes for budget tracking
      aiCostBudgets: 'id, budgetName, periodType, periodStart, periodEnd, scope, status, percentageUsed, createdAt, updatedAt, [periodType+status], [scope+periodStart], [status+percentageUsed], [periodEnd+status]',
      
      // Manufacturing Operations tables
      // Machines table with indexes for machine management
      machines: 'id, machineId, name, type, manufacturer, model, serialNumber, location, status, operatorId, installDate, lastMaintenanceDate, nextMaintenanceDate, createdAt, updatedAt, [type+status], [location+status], [status+operatorId], [nextMaintenanceDate+status]',
      
      // Production runs table with indexes for production tracking
      productionRuns: 'id, runId, machineId, productId, orderId, startTime, endTime, status, operatorId, createdAt, [machineId+status], [productId+startTime], [orderId+status], [operatorId+startTime], [status+startTime], [machineId+startTime]',
      
      // Machine downtime table with indexes for downtime analysis
      machineDowntime: 'id, machineId, startTime, endTime, category, resolvedBy, createdAt, [machineId+startTime], [category+startTime], [machineId+category], [resolvedBy+startTime]',
      
      // Maintenance schedule table with indexes for maintenance planning
      maintenanceSchedule: 'id, machineId, maintenanceType, scheduledDate, completedDate, technician, status, createdAt, [machineId+status], [maintenanceType+status], [scheduledDate+status], [technician+scheduledDate], [status+scheduledDate]',
      
      // Machine metrics table with indexes for performance tracking
      machineMetrics: 'id, machineId, timestamp, oee, availability, performance, quality, createdAt, [machineId+timestamp], [timestamp+machineId], [machineId+oee]',
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

    // Supply Chain Management hooks
    this.suppliers.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.status === undefined) obj.status = 'active';
      if (obj.isPreferred === undefined) obj.isPreferred = false;
      if (obj.rating === undefined) obj.rating = 0;
      if (obj.qualityScore === undefined) obj.qualityScore = 0;
      if (obj.deliveryScore === undefined) obj.deliveryScore = 0;
      if (obj.priceScore === undefined) obj.priceScore = 0;
      if (obj.overallScore === undefined) obj.overallScore = 0;
    });

    this.suppliers.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.supplierEvaluations.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (!obj.evaluationDate) obj.evaluationDate = new Date();
      if (obj.status === undefined) obj.status = 'draft';
    });

    this.supplierEvaluations.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.supplierContracts.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.status === undefined) obj.status = 'draft';
    });

    this.supplierContracts.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    // Compliance and Regulatory Management hooks
    this.complianceRequirements.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.status === undefined) obj.status = 'pending-review';
      if (obj.nonComplianceCount === undefined) obj.nonComplianceCount = 0;
    });

    this.complianceRequirements.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.complianceReports.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (!obj.generatedDate) obj.generatedDate = new Date();
      if (obj.status === undefined) obj.status = 'draft';
    });

    this.complianceReports.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.complianceAlerts.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
    });

    this.auditLogs.hook('creating', (primKey, obj) => {
      if (!obj.timestamp) obj.timestamp = new Date();
      if (!obj.createdAt) obj.createdAt = new Date();
      if (obj.isSecurityEvent === undefined) obj.isSecurityEvent = false;
      if (obj.isCriticalOperation === undefined) obj.isCriticalOperation = false;
      if (obj.complianceRelevant === undefined) obj.complianceRelevant = false;
      if (obj.status === undefined) obj.status = 'success';
    });

    this.auditTrailExports.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.requestDate) obj.requestDate = new Date();
      if (obj.status === undefined) obj.status = 'pending';
    });

    this.auditSchedules.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.status === undefined) obj.status = 'scheduled';
    });

    this.auditSchedules.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.auditFindings.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.status === undefined) obj.status = 'open';
    });

    this.auditFindings.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.dataRetentionPolicies.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.isActive === undefined) obj.isActive = true;
    });

    this.dataRetentionPolicies.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.dataRetentionExecutions.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.executionDate) obj.executionDate = new Date();
      if (obj.status === undefined) obj.status = 'pending';
    });

    this.consentRecords.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.status === undefined) obj.status = 'granted';
    });

    this.consentRecords.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.dataSubjectRequests.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (!obj.requestDate) obj.requestDate = new Date();
      if (obj.status === undefined) obj.status = 'pending';
      if (obj.identityVerified === undefined) obj.identityVerified = false;
      // Set due date to 30 days from request date (GDPR requirement)
      if (!obj.dueDate) {
        const dueDate = new Date(obj.requestDate);
        dueDate.setDate(dueDate.getDate() + 30);
        obj.dueDate = dueDate;
      }
    });

    this.dataSubjectRequests.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.dataBreachIncidents.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (!obj.discoveredDate) obj.discoveredDate = new Date();
      if (obj.status === undefined) obj.status = 'open';
      if (obj.investigationStatus === undefined) obj.investigationStatus = 'open';
    });

    this.dataBreachIncidents.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.dataProcessingActivities.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.isActive === undefined) obj.isActive = true;
      if (obj.automatedDecisionMaking === undefined) obj.automatedDecisionMaking = false;
      if (obj.profiling === undefined) obj.profiling = false;
      if (obj.internationalTransfers === undefined) obj.internationalTransfers = false;
      if (obj.encryptionEnabled === undefined) obj.encryptionEnabled = false;
      if (obj.dpiaRequired === undefined) obj.dpiaRequired = false;
    });

    this.dataProcessingActivities.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.privacyImpactAssessments.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (!obj.assessmentDate) obj.assessmentDate = new Date();
      if (obj.status === undefined) obj.status = 'draft';
      if (obj.dpoConsulted === undefined) obj.dpoConsulted = false;
    });

    this.privacyImpactAssessments.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    // AI Control Center hooks
    this.aiActivityLogs.hook('creating', (primKey, obj) => {
      if (!obj.timestamp) obj.timestamp = new Date();
      if (!obj.createdAt) obj.createdAt = new Date();
      if (obj.status === undefined) obj.status = 'success';
    });

    this.aiConfigurationHistory.hook('creating', (primKey, obj) => {
      if (!obj.timestamp) obj.timestamp = new Date();
      if (!obj.createdAt) obj.createdAt = new Date();
      if (obj.impactLevel === undefined) obj.impactLevel = 'medium';
    });

    this.aiConfigurationSnapshots.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (obj.isAutomatic === undefined) obj.isAutomatic = false;
    });

    this.aiAutomationRules.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.status === undefined) obj.status = 'active';
      if (obj.isActive === undefined) obj.isActive = true;
      if (obj.executionCount === undefined) obj.executionCount = 0;
      if (obj.successCount === undefined) obj.successCount = 0;
      if (obj.errorCount === undefined) obj.errorCount = 0;
      if (obj.successRate === undefined) obj.successRate = 0;
    });

    this.aiAutomationRules.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.aiModelMetrics.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.date) obj.date = new Date();
    });

    this.securityAuditLogs.hook('creating', (primKey, obj) => {
      if (!obj.timestamp) obj.timestamp = new Date();
      if (!obj.createdAt) obj.createdAt = new Date();
      if (obj.isSuspicious === undefined) obj.isSuspicious = false;
      if (obj.requiresMFA === undefined) obj.requiresMFA = false;
      if (obj.mfaCompleted === undefined) obj.mfaCompleted = false;
      if (obj.outcome === undefined) obj.outcome = 'success';
    });

    this.aiAlerts.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.status === undefined) obj.status = 'active';
      if (obj.notificationsSent === undefined) obj.notificationsSent = 0;
      if (obj.escalationLevel === undefined) obj.escalationLevel = 0;
    });

    this.aiAlerts.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.aiAlertRules.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.isActive === undefined) obj.isActive = true;
      if (obj.triggerCount === undefined) obj.triggerCount = 0;
      if (obj.escalationEnabled === undefined) obj.escalationEnabled = false;
    });

    this.aiAlertRules.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.aiCostBudgets.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.status === undefined) obj.status = 'active';
      if (obj.currentSpend === undefined) obj.currentSpend = 0;
      if (obj.percentageUsed === undefined) obj.percentageUsed = 0;
    });

    this.aiCostBudgets.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    // Manufacturing Operations hooks
    this.machines.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
      if (obj.status === undefined) obj.status = 'idle';
      if (!obj.installDate) obj.installDate = new Date();
    });

    this.machines.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.productionRuns.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.startTime) obj.startTime = new Date();
      if (obj.status === undefined) obj.status = 'scheduled';
      if (obj.actualQuantity === undefined) obj.actualQuantity = 0;
      if (obj.goodQuantity === undefined) obj.goodQuantity = 0;
      if (obj.rejectedQuantity === undefined) obj.rejectedQuantity = 0;
    });

    this.machineDowntime.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.startTime) obj.startTime = new Date();
    });

    this.maintenanceSchedule.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (obj.status === undefined) obj.status = 'scheduled';
      if (!obj.tasks) obj.tasks = [];
    });

    this.machineMetrics.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.timestamp) obj.timestamp = new Date();
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
      this.suppliers,
      this.supplierEvaluations,
      this.supplierContracts,
      this.complianceRequirements,
      this.complianceReports,
      this.complianceAlerts,
      this.auditLogs,
      this.auditTrailExports,
      this.auditSchedules,
      this.auditFindings,
      this.dataRetentionPolicies,
      this.dataRetentionExecutions,
      this.consentRecords,
      this.dataSubjectRequests,
      this.dataBreachIncidents,
      this.dataProcessingActivities,
      this.privacyImpactAssessments,
      this.aiActivityLogs,
      this.aiConfigurationHistory,
      this.aiConfigurationSnapshots,
      this.aiAutomationRules,
      this.aiModelMetrics,
      this.securityAuditLogs,
      this.aiAlerts,
      this.aiAlertRules,
      this.aiCostBudgets,
      this.machines,
      this.productionRuns,
      this.machineDowntime,
      this.maintenanceSchedule,
      this.machineMetrics,
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
        this.suppliers.clear(),
        this.supplierEvaluations.clear(),
        this.supplierContracts.clear(),
        this.complianceRequirements.clear(),
        this.complianceReports.clear(),
        this.complianceAlerts.clear(),
        this.auditLogs.clear(),
        this.auditTrailExports.clear(),
        this.auditSchedules.clear(),
        this.auditFindings.clear(),
        this.dataRetentionPolicies.clear(),
        this.dataRetentionExecutions.clear(),
        this.consentRecords.clear(),
        this.dataSubjectRequests.clear(),
        this.dataBreachIncidents.clear(),
        this.dataProcessingActivities.clear(),
        this.privacyImpactAssessments.clear(),
        this.aiActivityLogs.clear(),
        this.aiConfigurationHistory.clear(),
        this.aiConfigurationSnapshots.clear(),
        this.aiAutomationRules.clear(),
        this.aiModelMetrics.clear(),
        this.securityAuditLogs.clear(),
        this.aiAlerts.clear(),
        this.aiAlertRules.clear(),
        this.aiCostBudgets.clear(),
        this.machines.clear(),
        this.productionRuns.clear(),
        this.machineDowntime.clear(),
        this.maintenanceSchedule.clear(),
        this.machineMetrics.clear(),
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
    suppliers: number;
    complianceRequirements: number;
    auditLogs: number;
    dataSubjectRequests: number;
    aiActivityLogs: number;
    aiAutomationRules: number;
    aiAlerts: number;
    machines: number;
    productionRuns: number;
    machineDowntime: number;
    maintenanceSchedule: number;
    machineMetrics: number;
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
      suppliersCount,
      complianceRequirementsCount,
      auditLogsCount,
      dataSubjectRequestsCount,
      aiActivityLogsCount,
      aiAutomationRulesCount,
      aiAlertsCount,
      machinesCount,
      productionRunsCount,
      machineDowntimeCount,
      maintenanceScheduleCount,
      machineMetricsCount,
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
      this.suppliers.count(),
      this.complianceRequirements.count(),
      this.auditLogs.count(),
      this.dataSubjectRequests.count(),
      this.aiActivityLogs.count(),
      this.aiAutomationRules.count(),
      this.aiAlerts.count(),
      this.machines.count(),
      this.productionRuns.count(),
      this.machineDowntime.count(),
      this.maintenanceSchedule.count(),
      this.machineMetrics.count(),
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
      suppliers: suppliersCount,
      complianceRequirements: complianceRequirementsCount,
      auditLogs: auditLogsCount,
      dataSubjectRequests: dataSubjectRequestsCount,
      aiActivityLogs: aiActivityLogsCount,
      aiAutomationRules: aiAutomationRulesCount,
      aiAlerts: aiAlertsCount,
      machines: machinesCount,
      productionRuns: productionRunsCount,
      machineDowntime: machineDowntimeCount,
      maintenanceSchedule: maintenanceScheduleCount,
      machineMetrics: machineMetricsCount,
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
      suppliers,
      supplierEvaluations,
      supplierContracts,
      complianceRequirements,
      complianceReports,
      complianceAlerts,
      auditLogs,
      auditTrailExports,
      auditSchedules,
      auditFindings,
      dataRetentionPolicies,
      dataRetentionExecutions,
      consentRecords,
      dataSubjectRequests,
      dataBreachIncidents,
      dataProcessingActivities,
      privacyImpactAssessments,
      aiActivityLogs,
      aiConfigurationHistory,
      aiConfigurationSnapshots,
      aiAutomationRules,
      aiModelMetrics,
      securityAuditLogs,
      aiAlerts,
      aiAlertRules,
      aiCostBudgets,
      machines,
      productionRuns,
      machineDowntime,
      maintenanceSchedule,
      machineMetrics,
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
      this.suppliers.toArray(),
      this.supplierEvaluations.toArray(),
      this.supplierContracts.toArray(),
      this.complianceRequirements.toArray(),
      this.complianceReports.toArray(),
      this.complianceAlerts.toArray(),
      this.auditLogs.toArray(),
      this.auditTrailExports.toArray(),
      this.auditSchedules.toArray(),
      this.auditFindings.toArray(),
      this.dataRetentionPolicies.toArray(),
      this.dataRetentionExecutions.toArray(),
      this.consentRecords.toArray(),
      this.dataSubjectRequests.toArray(),
      this.dataBreachIncidents.toArray(),
      this.dataProcessingActivities.toArray(),
      this.privacyImpactAssessments.toArray(),
      this.aiActivityLogs.toArray(),
      this.aiConfigurationHistory.toArray(),
      this.aiConfigurationSnapshots.toArray(),
      this.aiAutomationRules.toArray(),
      this.aiModelMetrics.toArray(),
      this.securityAuditLogs.toArray(),
      this.aiAlerts.toArray(),
      this.aiAlertRules.toArray(),
      this.aiCostBudgets.toArray(),
      this.machines.toArray(),
      this.productionRuns.toArray(),
      this.machineDowntime.toArray(),
      this.maintenanceSchedule.toArray(),
      this.machineMetrics.toArray(),
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
        suppliers,
        supplierEvaluations,
        supplierContracts,
        complianceRequirements,
        complianceReports,
        complianceAlerts,
        auditLogs,
        auditTrailExports,
        auditSchedules,
        auditFindings,
        dataRetentionPolicies,
        dataRetentionExecutions,
        consentRecords,
        dataSubjectRequests,
        dataBreachIncidents,
        dataProcessingActivities,
        privacyImpactAssessments,
        aiActivityLogs,
        aiConfigurationHistory,
        aiConfigurationSnapshots,
        aiAutomationRules,
        aiModelMetrics,
        securityAuditLogs,
        aiAlerts,
        aiAlertRules,
        aiCostBudgets,
        machines,
        productionRuns,
        machineDowntime,
        maintenanceSchedule,
        machineMetrics,
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
      this.suppliers,
      this.supplierEvaluations,
      this.supplierContracts,
      this.complianceRequirements,
      this.complianceReports,
      this.complianceAlerts,
      this.auditLogs,
      this.auditTrailExports,
      this.auditSchedules,
      this.auditFindings,
      this.dataRetentionPolicies,
      this.dataRetentionExecutions,
      this.consentRecords,
      this.dataSubjectRequests,
      this.dataBreachIncidents,
      this.dataProcessingActivities,
      this.privacyImpactAssessments,
      this.aiActivityLogs,
      this.aiConfigurationHistory,
      this.aiConfigurationSnapshots,
      this.aiAutomationRules,
      this.aiModelMetrics,
      this.securityAuditLogs,
      this.aiAlerts,
      this.aiAlertRules,
      this.aiCostBudgets,
      this.machines,
      this.productionRuns,
      this.machineDowntime,
      this.maintenanceSchedule,
      this.machineMetrics,
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
      if (data.suppliers) await this.suppliers.bulkPut(data.suppliers);
      if (data.supplierEvaluations) await this.supplierEvaluations.bulkPut(data.supplierEvaluations);
      if (data.supplierContracts) await this.supplierContracts.bulkPut(data.supplierContracts);
      if (data.complianceRequirements) await this.complianceRequirements.bulkPut(data.complianceRequirements);
      if (data.complianceReports) await this.complianceReports.bulkPut(data.complianceReports);
      if (data.complianceAlerts) await this.complianceAlerts.bulkPut(data.complianceAlerts);
      if (data.auditLogs) await this.auditLogs.bulkPut(data.auditLogs);
      if (data.auditTrailExports) await this.auditTrailExports.bulkPut(data.auditTrailExports);
      if (data.auditSchedules) await this.auditSchedules.bulkPut(data.auditSchedules);
      if (data.auditFindings) await this.auditFindings.bulkPut(data.auditFindings);
      if (data.dataRetentionPolicies) await this.dataRetentionPolicies.bulkPut(data.dataRetentionPolicies);
      if (data.dataRetentionExecutions) await this.dataRetentionExecutions.bulkPut(data.dataRetentionExecutions);
      if (data.consentRecords) await this.consentRecords.bulkPut(data.consentRecords);
      if (data.dataSubjectRequests) await this.dataSubjectRequests.bulkPut(data.dataSubjectRequests);
      if (data.dataBreachIncidents) await this.dataBreachIncidents.bulkPut(data.dataBreachIncidents);
      if (data.dataProcessingActivities) await this.dataProcessingActivities.bulkPut(data.dataProcessingActivities);
      if (data.privacyImpactAssessments) await this.privacyImpactAssessments.bulkPut(data.privacyImpactAssessments);
      if (data.aiActivityLogs) await this.aiActivityLogs.bulkPut(data.aiActivityLogs);
      if (data.aiConfigurationHistory) await this.aiConfigurationHistory.bulkPut(data.aiConfigurationHistory);
      if (data.aiConfigurationSnapshots) await this.aiConfigurationSnapshots.bulkPut(data.aiConfigurationSnapshots);
      if (data.aiAutomationRules) await this.aiAutomationRules.bulkPut(data.aiAutomationRules);
      if (data.aiModelMetrics) await this.aiModelMetrics.bulkPut(data.aiModelMetrics);
      if (data.securityAuditLogs) await this.securityAuditLogs.bulkPut(data.securityAuditLogs);
      if (data.aiAlerts) await this.aiAlerts.bulkPut(data.aiAlerts);
      if (data.aiAlertRules) await this.aiAlertRules.bulkPut(data.aiAlertRules);
      if (data.aiCostBudgets) await this.aiCostBudgets.bulkPut(data.aiCostBudgets);
      if (data.machines) await this.machines.bulkPut(data.machines);
      if (data.productionRuns) await this.productionRuns.bulkPut(data.productionRuns);
      if (data.machineDowntime) await this.machineDowntime.bulkPut(data.machineDowntime);
      if (data.maintenanceSchedule) await this.maintenanceSchedule.bulkPut(data.maintenanceSchedule);
      if (data.machineMetrics) await this.machineMetrics.bulkPut(data.machineMetrics);
    });
  }
}

// Create and export the database instance
export const db = new MedicalProductsDB();

// Export type for use in other files
export type DB = MedicalProductsDB;
