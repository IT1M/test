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
export type RejectionType = 'cosmetic' | 'functional' | 'safety' | 'documentation' | 'other';
export type RejectionStatus = 'pending' | 'under-review' | 'corrective-action' | 'resolved' | 'closed';
export type RejectionSeverity = 'low' | 'medium' | 'high' | 'critical';
export type CorrectionActionStatus = 'open' | 'in-progress' | 'completed' | 'verified';
export type InspectionType = 'incoming' | 'in-process' | 'final' | 'random';
export type InspectionStatus = 'passed' | 'failed' | 'conditional';
export type InspectionResult = 'pass' | 'fail';
export type EmployeeStatus = 'active' | 'on-leave' | 'suspended' | 'archived' | 'terminated';
export type ContractType = 'permanent' | 'contract' | 'part-time' | 'intern';
export type LeaveType = 'annual' | 'sick' | 'emergency' | 'unpaid' | 'maternity' | 'paternity' | 'bereavement' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type PayrollStatus = 'draft' | 'approved' | 'paid' | 'cancelled';
export type PerformanceReviewStatus = 'draft' | 'submitted' | 'acknowledged' | 'completed';
export type TrainingStatus = 'planned' | 'ongoing' | 'completed' | 'cancelled';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half-day' | 'on-leave' | 'holiday';
export type PositionLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director' | 'executive';
export type JobPostingStatus = 'draft' | 'active' | 'closed' | 'filled' | 'cancelled';
export type ApplicantStatus = 'applied' | 'screening' | 'interview' | 'assessment' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
export type ApplicantSource = 'website' | 'linkedin' | 'referral' | 'job-board' | 'other';
export type InterviewType = 'phone' | 'video' | 'in-person' | 'technical' | 'panel';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';
export type HiringRecommendation = 'strong-hire' | 'hire' | 'maybe' | 'no-hire';
export type WorkType = 'on-site' | 'remote' | 'hybrid';
export type SupplierType = 'manufacturer' | 'distributor' | 'wholesaler' | 'service-provider';
export type SupplierStatus = 'active' | 'inactive' | 'blacklisted';
export type SupplierEvaluationStatus = 'draft' | 'completed' | 'approved';
export type SupplierContractType = 'supply-agreement' | 'service-agreement' | 'framework-agreement';
export type SupplierContractStatus = 'draft' | 'active' | 'expired' | 'terminated';
export type ComplianceStatus = 'compliant' | 'non-compliant' | 'pending-review' | 'at-risk' | 'expired';
export type ComplianceCategory = 'regulatory' | 'quality' | 'safety' | 'environmental' | 'data-privacy' | 'financial' | 'operational';
export type CompliancePriority = 'low' | 'medium' | 'high' | 'critical';
export type AuditType = 'internal' | 'external' | 'regulatory' | 'supplier' | 'customer';
export type AuditStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
export type AuditFindingSeverity = 'minor' | 'major' | 'critical';
export type AuditFindingStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type DataRetentionAction = 'retain' | 'archive' | 'delete' | 'anonymize';
export type ConsentStatus = 'granted' | 'denied' | 'withdrawn' | 'expired';
export type DataSubjectRequestType = 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
export type DataSubjectRequestStatus = 'pending' | 'in-progress' | 'completed' | 'rejected';

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
// QUALITY CONTROL AND REJECTION MANAGEMENT
// ============================================================================

export interface RejectionImage {
  id: string;
  url: string;
  fileName: string;
  capturedAt: Date;
  analysisResults?: {
    defectType: string;
    severity: string;
    confidence: number;
  };
}

export interface CorrectionAction {
  id: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  status: CorrectionActionStatus;
  completedAt?: Date;
  effectiveness?: number;
}

export interface Rejection {
  id: string;
  rejectionId: string;
  itemCode: string;
  productId: string;
  machineName: string;
  lotNumber: string;
  batchNumber: string;
  quantity: number;
  rejectionDate: Date;
  rejectionReason: string;
  rejectionType: RejectionType;
  inspectorId: string;
  supplierId?: string;
  orderId?: string;
  status: RejectionStatus;
  severity: RejectionSeverity;
  images: RejectionImage[];
  correctionActions: CorrectionAction[];
  costImpact: number;
  geminiAnalysis?: {
    defectType: string;
    confidence: number;
    suggestedActions: string[];
    similarCases: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface RejectionReason {
  id: string;
  code: string;
  category: string;
  description: string;
  isActive: boolean;
}

export interface InspectionCheckpoint {
  parameter: string;
  specification: string;
  actualValue: string;
  result: InspectionResult;
  notes?: string;
}

export interface QualityInspection {
  id: string;
  inspectionId: string;
  productId: string;
  orderId?: string;
  batchNumber: string;
  inspectionDate: Date;
  inspectorId: string;
  inspectionType: InspectionType;
  sampleSize: number;
  passedQuantity: number;
  failedQuantity: number;
  status: InspectionStatus;
  notes: string;
  checkpoints: InspectionCheckpoint[];
  createdAt: Date;
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

// ============================================================================
// HUMAN RESOURCES MANAGEMENT
// ============================================================================

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
}

export interface Qualification {
  degree: string;
  institution: string;
  fieldOfStudy: string;
  graduationYear: number;
  grade?: string;
}

export interface Certification {
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
}

export interface EmployeeDocument {
  id: string;
  type: 'contract' | 'id-copy' | 'certificate' | 'resume' | 'other';
  fileName: string;
  url: string;
  uploadDate: Date;
}

export interface Employee {
  id: string;
  employeeId: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  dateOfBirth: Date;
  age?: number;
  gender: Gender;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  
  // Employment Details
  departmentId: string;
  positionId: string;
  managerId?: string;
  hireDate: Date;
  contractType: ContractType;
  contractEndDate?: Date;
  probationEndDate?: Date;
  
  // Compensation
  basicSalary: number;
  currency: string;
  paymentFrequency: 'monthly' | 'bi-weekly' | 'weekly';
  bankAccount?: string;
  
  // Status
  status: EmployeeStatus;
  terminationDate?: Date;
  terminationReason?: string;
  
  // Personal Details
  emergencyContact: EmergencyContact;
  qualifications: Qualification[];
  certifications: Certification[];
  
  // Documents
  photo?: string;
  documents: EmployeeDocument[];
  
  // Performance
  performanceRating?: number;
  lastReviewDate?: Date;
  nextReviewDate?: Date;
  
  // Leave Balance
  annualLeaveBalance: number;
  sickLeaveBalance: number;
  
  // System
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface Department {
  id: string;
  departmentId: string;
  name: string;
  description?: string;
  managerId?: string;
  parentDepartmentId?: string;
  budget?: number;
  employeeCount?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Position {
  id: string;
  positionId: string;
  title: string;
  departmentId: string;
  level: PositionLevel;
  description: string;
  responsibilities: string[];
  requirements: string[];
  minSalary: number;
  maxSalary: number;
  requiredQualifications: string[];
  requiredSkills: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  workHours?: number;
  status: AttendanceStatus;
  lateMinutes?: number;
  earlyDepartureMinutes?: number;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  notes?: string;
  approvedBy?: string;
  createdAt: Date;
}

export interface Leave {
  id: string;
  leaveId: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  requestDate: Date;
  approvedBy?: string;
  approvalDate?: Date;
  rejectionReason?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollItem {
  description: string;
  amount: number;
  type: 'fixed' | 'variable';
}

export interface Payroll {
  id: string;
  payrollId: string;
  employeeId: string;
  month: number;
  year: number;
  
  // Earnings
  basicSalary: number;
  allowances: PayrollItem[];
  overtime: number;
  bonus: number;
  totalEarnings: number;
  
  // Deductions
  deductions: PayrollItem[];
  tax: number;
  insurance: number;
  totalDeductions: number;
  
  // Net
  netSalary: number;
  
  // Payment
  paymentDate?: Date;
  paymentMethod: 'bank-transfer' | 'cash' | 'cheque';
  paymentReference?: string;
  status: PayrollStatus;
  
  // Approval
  approvedBy?: string;
  approvalDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceRating {
  category: string;
  rating: number;
  comments?: string;
}

export interface PerformanceGoal {
  description: string;
  targetDate: Date;
  status: 'not-started' | 'in-progress' | 'completed' | 'cancelled';
  completionDate?: Date;
}

export interface PerformanceReview {
  id: string;
  reviewId: string;
  employeeId: string;
  reviewPeriodStart: Date;
  reviewPeriodEnd: Date;
  reviewDate: Date;
  reviewerId: string;
  
  // Ratings
  overallRating: number;
  ratings: PerformanceRating[];
  
  // Feedback
  strengths: string[];
  areasForImprovement: string[];
  achievements: string[];
  goals: PerformanceGoal[];
  
  // Next Steps
  developmentPlan: string;
  nextReviewDate: Date;
  
  // Status
  status: PerformanceReviewStatus;
  employeeComments?: string;
  acknowledgedDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingAttendee {
  employeeId: string;
  enrollmentDate: Date;
  status: 'enrolled' | 'attended' | 'completed' | 'failed' | 'cancelled';
  completionDate?: Date;
  score?: number;
  certificateUrl?: string;
  feedback?: string;
}

export interface Training {
  id: string;
  trainingId: string;
  title: string;
  description: string;
  category: string;
  type: 'internal' | 'external' | 'online' | 'workshop' | 'certification';
  
  // Schedule
  startDate: Date;
  endDate: Date;
  duration: number;
  location?: string;
  
  // Instructor
  instructor?: string;
  instructorType: 'internal' | 'external';
  
  // Participants
  maxParticipants?: number;
  attendees: TrainingAttendee[];
  
  // Cost
  costPerParticipant: number;
  totalCost: number;
  
  // Status
  status: TrainingStatus;
  
  // Materials
  materials: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// RECRUITMENT MANAGEMENT
// ============================================================================

export interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
  isCurrent: boolean;
}

export interface ApplicantNote {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

export interface InterviewerFeedback {
  interviewerId: string;
  rating: number;
  feedback: string;
  strengths: string[];
  concerns: string[];
  recommendation: HiringRecommendation;
  submittedAt?: Date;
}

export interface JobPosting {
  id: string;
  jobId: string;
  title: string;
  departmentId: string;
  positionId: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  qualifications: string[];
  skills: string[];
  
  // Compensation
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  benefits: string[];
  
  // Location
  location: string;
  workType: WorkType;
  
  // Dates
  postedDate: Date;
  closingDate?: Date;
  
  // Status
  status: JobPostingStatus;
  
  // Tracking
  views: number;
  applicationsCount: number;
  
  // Publishing
  publishedOn: string[];
  
  // Hiring Manager
  hiringManagerId: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Applicant {
  id: string;
  applicantId: string;
  jobId: string;
  
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  
  // Application
  applicationDate: Date;
  source: ApplicantSource;
  referredBy?: string;
  
  // Documents
  resumeUrl: string;
  coverLetterUrl?: string;
  portfolioUrl?: string;
  
  // Parsed Resume Data (from AI)
  parsedData?: {
    education: Qualification[];
    experience: WorkExperience[];
    skills: string[];
    certifications: string[];
    summary: string;
  };
  
  // Evaluation
  aiCompatibilityScore?: number;
  aiAnalysis?: {
    strengths: string[];
    concerns: string[];
    recommendation: string;
    confidence: number;
  };
  
  // Status
  status: ApplicantStatus;
  currentStage: string;
  
  // Rating
  overallRating?: number;
  
  // Notes
  notes: ApplicantNote[];
  
  // Interviews
  interviews: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Interview {
  id: string;
  interviewId: string;
  applicantId: string;
  jobId: string;
  
  // Schedule
  scheduledDate: Date;
  duration: number;
  
  // Type
  type: InterviewType;
  location?: string;
  meetingLink?: string;
  
  // Interviewers
  interviewers: InterviewerFeedback[];
  
  // Questions (AI-generated)
  suggestedQuestions?: string[];
  
  // Status
  status: InterviewStatus;
  
  // Overall Feedback
  overallRating?: number;
  recommendation: HiringRecommendation;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface RecruitmentPipeline {
  id: string;
  applicantId: string;
  jobId: string;
  stage: ApplicantStatus;
  enteredAt: Date;
  exitedAt?: Date;
  durationDays?: number;
  notes?: string;
}

// ============================================================================
// SUPPLY CHAIN AND SUPPLIER MANAGEMENT
// ============================================================================

export interface Supplier {
  id: string;
  supplierId: string;
  name: string;
  type: SupplierType;
  
  // Contact
  contactPerson: string;
  phone: string;
  email: string;
  website?: string;
  
  // Address
  address: string;
  city: string;
  country: string;
  
  // Business Terms
  paymentTerms: string;
  leadTime: number; // Days
  minimumOrderQuantity?: number;
  currency: string;
  
  // Performance
  rating: number; // 0-5 scale
  qualityScore: number; // 0-100
  deliveryScore: number; // 0-100
  priceScore: number; // 0-100
  overallScore: number; // Computed average
  
  // Compliance
  certifications: string[];
  licenses: string[];
  insuranceExpiry?: Date;
  
  // Status
  status: SupplierStatus;
  isPreferred: boolean;
  
  // Products
  suppliedProducts: string[]; // Product IDs
  
  // Financial
  totalPurchaseValue?: number; // Lifetime value
  outstandingBalance?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierEvaluation {
  id: string;
  supplierId: string;
  evaluationDate: Date;
  evaluatorId: string;
  period: string; // e.g., "Q1 2024"
  
  // Scores
  qualityScore: number;
  deliveryScore: number;
  priceScore: number;
  serviceScore: number;
  complianceScore: number;
  overallScore: number;
  
  // Details
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  
  // Action Items
  actionItems: string[];
  
  status: SupplierEvaluationStatus;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierContract {
  id: string;
  contractId: string;
  supplierId: string;
  
  // Contract Details
  title: string;
  description: string;
  contractType: SupplierContractType;
  
  // Dates
  startDate: Date;
  endDate: Date;
  renewalDate?: Date;
  
  // Terms
  paymentTerms: string;
  deliveryTerms: string;
  qualityStandards: string;
  
  // Products/Services
  coveredProducts: string[]; // Product IDs
  
  // Financial
  contractValue: number;
  currency: string;
  
  // Documents
  documentUrl: string;
  
  // Status
  status: SupplierContractStatus;
  
  // Notifications
  notifyBeforeExpiry: number; // Days
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// COMPLIANCE AND REGULATORY MANAGEMENT
// ============================================================================

export interface ComplianceRequirement {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  category: ComplianceCategory;
  priority: CompliancePriority;
  
  // Regulatory Details
  regulatoryBody: string; // e.g., "FDA", "HIPAA", "GDPR", "ISO"
  regulationReference: string; // e.g., "21 CFR Part 820", "GDPR Article 32"
  region: string; // e.g., "US", "EU", "Global"
  applicableCountries: string[];
  
  // Compliance Details
  status: ComplianceStatus;
  complianceDeadline?: Date;
  lastReviewDate?: Date;
  nextReviewDate: Date;
  reviewFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  
  // Responsible Parties
  ownerId: string; // Employee ID
  reviewerId?: string; // Employee ID
  approvedBy?: string; // Employee ID
  
  // Evidence and Documentation
  evidenceDocuments: string[]; // Document URLs
  complianceNotes: string;
  
  // Tracking
  lastComplianceDate?: Date;
  nonComplianceCount: number;
  
  // Alerts
  alertDaysBefore: number; // Days before deadline to alert
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceReport {
  id: string;
  reportId: string;
  title: string;
  reportType: 'status' | 'audit' | 'incident' | 'periodic' | 'regulatory-submission';
  
  // Report Details
  reportingPeriodStart: Date;
  reportingPeriodEnd: Date;
  generatedDate: Date;
  generatedBy: string; // Employee ID
  
  // Content
  summary: string;
  findings: ComplianceFinding[];
  recommendations: string[];
  actionItems: ComplianceActionItem[];
  
  // Metrics
  totalRequirements: number;
  compliantCount: number;
  nonCompliantCount: number;
  atRiskCount: number;
  complianceRate: number; // Percentage
  
  // Documents
  reportDocumentUrl?: string;
  attachments: string[];
  
  // Status
  status: 'draft' | 'submitted' | 'approved' | 'published';
  submittedDate?: Date;
  approvedBy?: string;
  approvalDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceFinding {
  id: string;
  requirementId: string;
  severity: AuditFindingSeverity;
  description: string;
  evidence: string;
  recommendation: string;
  status: AuditFindingStatus;
}

export interface ComplianceActionItem {
  id: string;
  description: string;
  assignedTo: string; // Employee ID
  dueDate: Date;
  priority: CompliancePriority;
  status: 'open' | 'in-progress' | 'completed' | 'overdue';
  completedDate?: Date;
}

export interface ComplianceAlert {
  id: string;
  requirementId: string;
  alertType: 'deadline-approaching' | 'overdue' | 'status-change' | 'review-required' | 'non-compliance';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  dueDate?: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
}

// ============================================================================
// ENHANCED AUDIT TRAIL
// ============================================================================

export interface AuditLog {
  id: string;
  logId: string;
  
  // Event Details
  timestamp: Date;
  eventType: string; // e.g., "CREATE", "UPDATE", "DELETE", "ACCESS", "EXPORT"
  entityType: string; // e.g., "Product", "Customer", "Order", "Patient"
  entityId: string;
  
  // User Information
  userId: string;
  username: string;
  userRole: string;
  ipAddress: string;
  userAgent: string;
  
  // Change Details
  action: string; // Human-readable description
  beforeData?: any; // JSON snapshot before change
  afterData?: any; // JSON snapshot after change
  changes?: AuditChange[]; // Detailed field-level changes
  
  // Context
  sessionId: string;
  requestId?: string;
  source: 'web' | 'api' | 'mobile' | 'system';
  
  // Security
  isSecurityEvent: boolean;
  isCriticalOperation: boolean;
  requiresApproval: boolean;
  approvedBy?: string;
  
  // Compliance
  complianceRelevant: boolean;
  regulatoryCategory?: string;
  retentionPeriod: number; // Days
  
  // Integrity
  checksum: string; // Hash of log entry for tamper detection
  previousChecksum?: string; // Chain to previous log
  
  // Status
  status: 'success' | 'failure' | 'partial';
  errorMessage?: string;
  
  createdAt: Date;
}

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  dataType: string;
}

export interface AuditTrailExport {
  id: string;
  exportId: string;
  requestedBy: string;
  requestDate: Date;
  
  // Export Parameters
  startDate: Date;
  endDate: Date;
  entityTypes?: string[];
  userIds?: string[];
  eventTypes?: string[];
  
  // Export Details
  totalRecords: number;
  fileFormat: 'json' | 'csv' | 'pdf' | 'xml';
  fileUrl: string;
  fileSize: number;
  
  // Purpose
  purpose: string; // e.g., "Regulatory Audit", "Internal Review", "Legal Request"
  
  // Security
  encryptionEnabled: boolean;
  accessPassword?: string;
  expiryDate: Date;
  
  // Status
  status: 'pending' | 'completed' | 'failed';
  completedAt?: Date;
  
  createdAt: Date;
}

export interface AuditSchedule {
  id: string;
  scheduleId: string;
  auditType: AuditType;
  title: string;
  description: string;
  
  // Schedule
  scheduledDate: Date;
  estimatedDuration: number; // Hours
  frequency: 'one-time' | 'monthly' | 'quarterly' | 'annually';
  nextScheduledDate?: Date;
  
  // Scope
  scopeDescription: string;
  entitiesInScope: string[];
  departmentsInScope: string[];
  
  // Team
  leadAuditorId: string;
  auditTeam: string[]; // Employee IDs
  
  // Status
  status: AuditStatus;
  
  // Results
  completedDate?: Date;
  auditReportId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditFinding {
  id: string;
  findingId: string;
  auditScheduleId: string;
  
  // Finding Details
  title: string;
  description: string;
  severity: AuditFindingSeverity;
  category: string;
  
  // Evidence
  evidence: string[];
  affectedEntities: string[];
  
  // Recommendation
  recommendation: string;
  correctiveAction: string;
  
  // Responsible Party
  assignedTo: string; // Employee ID
  dueDate: Date;
  
  // Status
  status: AuditFindingStatus;
  resolvedDate?: Date;
  resolutionNotes?: string;
  verifiedBy?: string;
  verificationDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// DATA PRIVACY MANAGEMENT (GDPR/HIPAA)
// ============================================================================

export interface DataRetentionPolicy {
  id: string;
  policyId: string;
  name: string;
  description: string;
  
  // Scope
  entityType: string; // e.g., "Patient", "MedicalRecord", "Order"
  dataCategory: string; // e.g., "PHI", "PII", "Financial", "Operational"
  
  // Retention Rules
  retentionPeriod: number; // Days
  retentionStartEvent: string; // e.g., "creation", "last_access", "patient_discharge"
  
  // Actions
  actionAfterRetention: DataRetentionAction;
  archiveLocation?: string;
  
  // Legal Basis
  legalBasis: string; // e.g., "HIPAA requirement", "GDPR Article 5", "Business need"
  regulatoryReference: string;
  
  // Exceptions
  exceptions: string[];
  legalHoldOverride: boolean;
  
  // Status
  isActive: boolean;
  effectiveDate: Date;
  reviewDate: Date;
  
  // Approval
  approvedBy: string;
  approvalDate: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DataRetentionExecution {
  id: string;
  executionId: string;
  policyId: string;
  
  // Execution Details
  executionDate: Date;
  executedBy: string; // System or User ID
  
  // Results
  recordsProcessed: number;
  recordsRetained: number;
  recordsArchived: number;
  recordsDeleted: number;
  recordsAnonymized: number;
  
  // Status
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  errorMessage?: string;
  
  // Audit
  auditLogIds: string[];
  
  createdAt: Date;
  completedAt?: Date;
}

export interface ConsentRecord {
  id: string;
  consentId: string;
  
  // Subject
  subjectType: 'patient' | 'customer' | 'employee' | 'supplier';
  subjectId: string;
  
  // Consent Details
  consentType: string; // e.g., "data_processing", "marketing", "data_sharing", "research"
  purpose: string;
  description: string;
  
  // Status
  status: ConsentStatus;
  grantedDate?: Date;
  withdrawnDate?: Date;
  expiryDate?: Date;
  
  // Legal Basis
  legalBasis: string; // e.g., "GDPR Article 6(1)(a)", "HIPAA Authorization"
  
  // Evidence
  consentMethod: 'written' | 'electronic' | 'verbal' | 'implied';
  evidenceDocumentUrl?: string;
  ipAddress?: string;
  
  // Scope
  dataCategories: string[]; // e.g., ["PHI", "Contact Information", "Medical History"]
  processingActivities: string[];
  
  // Third Parties
  thirdPartySharing: boolean;
  thirdParties?: string[];
  
  // Audit
  recordedBy: string;
  lastModifiedBy?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DataSubjectRequest {
  id: string;
  requestId: string;
  
  // Subject
  subjectType: 'patient' | 'customer' | 'employee' | 'supplier';
  subjectId: string;
  subjectName: string;
  subjectEmail: string;
  
  // Request Details
  requestType: DataSubjectRequestType;
  requestDate: Date;
  description: string;
  
  // Verification
  identityVerified: boolean;
  verificationMethod?: string;
  verifiedBy?: string;
  verificationDate?: Date;
  
  // Processing
  status: DataSubjectRequestStatus;
  assignedTo?: string;
  dueDate: Date; // Typically 30 days from request
  
  // Response
  responseDate?: Date;
  responseMethod?: 'email' | 'postal' | 'in-person' | 'secure-portal';
  responseNotes?: string;
  
  // Data Provided (for access/portability requests)
  dataExportUrl?: string;
  dataFormat?: 'json' | 'csv' | 'pdf' | 'xml';
  
  // Actions Taken (for erasure/rectification requests)
  actionsTaken: DataSubjectRequestAction[];
  
  // Rejection (if applicable)
  rejectionReason?: string;
  legalBasisForRejection?: string;
  
  // Audit
  auditLogIds: string[];
  
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface DataSubjectRequestAction {
  entityType: string;
  entityId: string;
  action: 'deleted' | 'anonymized' | 'rectified' | 'restricted' | 'exported';
  performedBy: string;
  performedAt: Date;
  notes?: string;
}

export interface DataBreachIncident {
  id: string;
  incidentId: string;
  
  // Incident Details
  title: string;
  description: string;
  discoveredDate: Date;
  occurredDate?: Date;
  reportedDate?: Date;
  
  // Classification
  severity: 'low' | 'medium' | 'high' | 'critical';
  breachType: 'unauthorized-access' | 'data-loss' | 'data-theft' | 'accidental-disclosure' | 'ransomware' | 'other';
  
  // Affected Data
  dataCategories: string[]; // e.g., ["PHI", "PII", "Financial"]
  affectedRecordCount: number;
  affectedIndividuals: string[]; // IDs of affected subjects
  
  // Impact Assessment
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  potentialHarm: string;
  mitigatingFactors: string[];
  
  // Response
  containmentActions: string[];
  containmentDate?: Date;
  remediationActions: string[];
  remediationDate?: Date;
  
  // Notifications
  regulatoryNotificationRequired: boolean;
  regulatoryNotificationDate?: Date;
  regulatoryBodies: string[];
  
  individualNotificationRequired: boolean;
  individualNotificationDate?: Date;
  notificationMethod?: string;
  
  // Investigation
  investigationStatus: 'open' | 'in-progress' | 'completed' | 'closed';
  rootCause?: string;
  investigationNotes?: string;
  
  // Team
  incidentLeadId: string;
  responseTeam: string[]; // Employee IDs
  
  // Documentation
  evidenceDocuments: string[];
  reportDocumentUrl?: string;
  
  // Status
  status: 'open' | 'contained' | 'resolved' | 'closed';
  closedDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DataProcessingActivity {
  id: string;
  activityId: string;
  
  // Activity Details
  name: string;
  description: string;
  purpose: string;
  legalBasis: string;
  
  // Data
  dataCategories: string[];
  dataSubjects: string[]; // e.g., ["patients", "customers", "employees"]
  
  // Processing
  processingOperations: string[]; // e.g., ["collection", "storage", "analysis", "sharing"]
  automatedDecisionMaking: boolean;
  profiling: boolean;
  
  // Parties
  dataController: string;
  dataProcessors: string[];
  
  // Transfers
  internationalTransfers: boolean;
  transferCountries?: string[];
  transferSafeguards?: string;
  
  // Security
  securityMeasures: string[];
  encryptionEnabled: boolean;
  accessControls: string[];
  
  // Retention
  retentionPeriod: number; // Days
  retentionJustification: string;
  
  // Risk Assessment
  riskLevel: 'low' | 'medium' | 'high';
  dpia Required: boolean; // Data Protection Impact Assessment
  dpiaDocumentUrl?: string;
  
  // Review
  lastReviewDate?: Date;
  nextReviewDate: Date;
  reviewedBy?: string;
  
  // Status
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PrivacyImpactAssessment {
  id: string;
  assessmentId: string;
  
  // Assessment Details
  title: string;
  description: string;
  assessmentDate: Date;
  assessorId: string;
  
  // Scope
  dataProcessingActivityId?: string;
  systemsInScope: string[];
  dataTypesInScope: string[];
  
  // Risk Assessment
  identifiedRisks: PrivacyRisk[];
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Mitigation
  mitigationMeasures: string[];
  residualRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Consultation
  stakeholdersConsulted: string[];
  dpoConsulted: boolean; // Data Protection Officer
  dpoComments?: string;
  
  // Approval
  status: 'draft' | 'under-review' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalDate?: Date;
  
  // Review
  nextReviewDate: Date;
  
  // Documentation
  documentUrl?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PrivacyRisk {
  id: string;
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  affectedDataSubjects: string[];
  mitigationMeasures: string[];
}
