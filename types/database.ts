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
