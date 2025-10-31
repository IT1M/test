// Database Type Definitions for Medical Products Company Management System

// ============================================================================
// ENUMS AND STATUS TYPES
// ============================================================================

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partially-paid' | 'paid' | 'overdue';
export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';
export type CustomerType = 'hospital' | 'clinic' | 'pharmacy' | 'distributor';
export type CustomerSegment = 'VIP' | 'Regular' | 'New' | 'Inactive';
export type Gender = 'male' | 'female' | 'other';
export type RecordType = 'consultation' | 'lab-result' | 'prescription' | 'imaging' | 'surgery' | 'other';
export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
export type InvoiceStatus = 'unpaid' | 'partially-paid' | 'paid' | 'overdue';
export type PurchaseOrderStatus = 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
export type StockMovementType = 'in' | 'out' | 'adjustment' | 'transfer';
export type LogStatus = 'success' | 'error' | 'warning';
export type UserRole = 'admin' | 'manager' | 'sales' | 'inventory' | 'medical';
export type DocumentType = 'invoice' | 'purchase_order' | 'medical_report' | 'prescription' | 'lab_result' | 'delivery_note' | 'other';

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  ocrText?: string;
}

export interface GeminiAnalysis {
  summary: string;
  extractedData: any;
  confidence: number;
  timestamp: Date;
}

export interface ExpiryBatch {
  batchNumber: string;
  quantity: number;
  expiryDate: Date;
  receivedDate: Date;
}

// ============================================================================
// MAIN DATABASE ENTITIES
// ============================================================================

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  manufacturer: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  expiryDate?: Date;
  batchNumber?: string;
  regulatoryInfo?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  // Computed fields
  profitMargin?: number;
  stockStatus?: StockStatus;
}

export interface Customer {
  id: string;
  customerId: string;
  name: string;
  type: CustomerType;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
  creditLimit: number;
  paymentTerms: string;
  segment?: CustomerSegment;
  lifetimeValue?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderId: string;
  customerId: string;
  orderDate: Date;
  deliveryDate?: Date;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  salesPerson: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  id: string;
  productId: string;
  warehouseLocation: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastRestocked: Date;
  expiryTracking: ExpiryBatch[];
  updatedAt: Date;
}

export interface Sale {
  id: string;
  saleId: string;
  orderId: string;
  customerId: string;
  saleDate: Date;
  totalAmount: number;
  costAmount: number;
  profit: number;
  profitMargin: number;
  paymentMethod: string;
  salesPerson: string;
  commission: number;
  createdAt: Date;
}

export interface Patient {
  id: string;
  patientId: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  age?: number;
  gender: Gender;
  phone: string;
  email?: string;
  address: string;
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  linkedCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecord {
  id: string;
  recordId: string;
  patientId: string;
  recordType: RecordType;
  title: string;
  content: string;
  diagnosis?: string;
  medications?: Medication[];
  doctorName?: string;
  hospitalName?: string;
  visitDate: Date;
  attachments?: Attachment[];
  geminiAnalysis?: GeminiAnalysis;
  linkedProductIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Quotation {
  id: string;
  quotationId: string;
  customerId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  validUntil: Date;
  status: QuotationStatus;
  convertedToOrderId?: string;
  termsAndConditions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  invoiceId: string;
  orderId: string;
  customerId: string;
  issueDate: Date;
  dueDate: Date;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  paymentTerms: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  paymentId: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  referenceNumber: string;
  notes?: string;
  createdAt: Date;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  reason: string;
  referenceId?: string;
  performedBy: string;
  timestamp: Date;
}

export interface PurchaseOrder {
  id: string;
  poId: string;
  supplierId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  orderDate: Date;
  expectedDeliveryDate: Date;
  status: PurchaseOrderStatus;
  receivedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchHistory {
  id: string;
  query: string;
  entityType: 'all' | 'products' | 'customers' | 'orders' | 'patients';
  results: number;
  timestamp: Date;
  userId: string;
}

export interface SystemLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  userId: string;
  timestamp: Date;
  status: LogStatus;
  errorMessage?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;
  passwordSalt?: string;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

// ============================================================================
// ADDITIONAL TYPES FOR AI AND ANALYTICS
// ============================================================================

export interface DemandForecast {
  productId: string;
  forecast: Array<{
    date: string;
    predictedQuantity: number;
    confidence: number;
  }>;
  seasonalPattern: string;
  trend: 'increasing' | 'stable' | 'decreasing';
  confidence: number;
  factors: string[];
  reorderPoint: number;
  reorderQuantity: number;
}

export interface PricingRecommendation {
  productId: string;
  currentPrice: number;
  recommendedPrice: number;
  expectedSalesIncrease: string;
  expectedProfitIncrease: string;
  reasoning: string;
  confidence: number;
}

export interface BundleRecommendation {
  products: string[];
  bundlePrice: number;
  expectedSales: number;
  reasoning: string;
}

export interface DailyBriefing {
  date: Date;
  highlights: string[];
  actionsNeeded: string[];
  opportunities: string[];
  risks: string[];
  recommendations: string[];
}

export interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedEntity: string;
  recommendedAction: string;
  detectedAt: Date;
}

export interface MedicalAnalysis {
  patientInfo: {
    name?: string;
    age?: number;
    gender?: string;
  };
  diagnosis: string;
  symptoms: string[];
  medications: Medication[];
  recommendations: string[];
  followUpDate?: string;
  confidence: number;
}

export interface ProcessedDocument {
  documentType: DocumentType;
  extractedData: any;
  fullText: string;
  confidence: number;
  processedAt: Date;
}

export interface DemandPrediction {
  productId: string;
  productName: string;
  predictedDemand: number;
  confidence: number;
  reasoning: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ErrorContext {
  entityType: string;
  entityId?: string;
  userId: string;
  operation: string;
}

export interface AuditAction {
  type: string;
  entityType: string;
  entityId: string;
  before?: any;
  after?: any;
  changes?: any;
  userId: string;
}

export interface CriticalAction extends AuditAction {
  requiresApproval?: boolean;
  approvedBy?: string;
}

// ============================================================================
// COMPUTED FIELD HELPERS
// ============================================================================

export const calculateProfitMargin = (unitPrice: number, costPrice: number): number => {
  if (unitPrice === 0) return 0;
  return ((unitPrice - costPrice) / unitPrice) * 100;
};

export const calculateStockStatus = (quantity: number, reorderLevel: number): StockStatus => {
  if (quantity === 0) return 'out-of-stock';
  if (quantity <= reorderLevel) return 'low-stock';
  return 'in-stock';
};

export const calculateAge = (dateOfBirth: Date): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const calculateAvailableQuantity = (quantity: number, reservedQuantity: number): number => {
  return Math.max(0, quantity - reservedQuantity);
};

export const calculateOrderTotal = (items: OrderItem[], discount: number = 0, tax: number = 0): number => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const afterDiscount = subtotal - discount;
  return afterDiscount + tax;
};

export const calculateProfit = (totalAmount: number, costAmount: number): number => {
  return totalAmount - costAmount;
};

export const calculateProfitMarginFromAmounts = (totalAmount: number, costAmount: number): number => {
  if (totalAmount === 0) return 0;
  return ((totalAmount - costAmount) / totalAmount) * 100;
};
