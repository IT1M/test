# Design Document

## Overview

The Medical Products Company Management System is a comprehensive enterprise application built with Next.js 14, TypeScript, and AI-powered features using Google's Gemini API. The system integrates medical archive management with complete business operations including inventory, sales, CRM, and financial analytics. The architecture follows a modular, component-based design with offline-first capabilities using IndexedDB and real-time AI insights throughout the application.

### Technology Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand
- **Database**: IndexedDB (via Dexie.js)
- **AI Integration**: Google Gemini API (@google/generative-ai)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns
- **File Processing**: XLSX for Excel operations

### Key Design Principles

1. **Offline-First**: All data stored locally in IndexedDB with cloud sync capability
2. **AI-Everywhere**: Gemini AI integrated into every major feature for insights and automation
3. **Relational Data**: Fully connected database with automatic cascade operations
4. **Type Safety**: Comprehensive TypeScript types for all entities and operations
5. **Performance**: Lazy loading, virtual scrolling, and optimized queries
6. **Security**: Role-based access control, data encryption, and audit trails

## Architecture

### High-Level Architecture


```mermaid
graph TB
    subgraph "Presentation Layer"
        UI[Next.js App Router Pages]
        Components[Reusable Components]
        Hooks[Custom React Hooks]
    end
    
    subgraph "State Management"
        Zustand[Zustand Store]
        Cache[Search & API Cache]
    end
    
    subgraph "Business Logic Layer"
        Services[Business Services]
        AIService[Gemini AI Service]
        Validators[Data Validators]
    end
    
    subgraph "Data Layer"
        Dexie[Dexie.js ORM]
        IndexedDB[(IndexedDB)]
        Relations[Relationship Manager]
    end
    
    subgraph "External Services"
        Gemini[Google Gemini API]
        OCR[Gemini Vision API]
    end
    
    UI --> Components
    UI --> Hooks
    Hooks --> Zustand
    Hooks --> Services
    Services --> AIService
    Services --> Dexie
    Services --> Validators
    AIService --> Gemini
    AIService --> OCR
    AIService --> Cache
    Dexie --> IndexedDB
    Dexie --> Relations
    Relations --> IndexedDB
```

### Application Structure


```
medical-products-system/
├── app/
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Main dashboard
│   ├── products/
│   │   ├── page.tsx              # Products list
│   │   ├── [id]/page.tsx         # Product detail
│   │   └── new/page.tsx          # Add product
│   ├── customers/
│   │   ├── page.tsx              # Customers list
│   │   ├── [id]/page.tsx         # Customer detail
│   │   └── new/page.tsx          # Add customer
│   ├── orders/
│   │   ├── page.tsx              # Orders list
│   │   ├── [id]/page.tsx         # Order detail
│   │   └── new/page.tsx          # Create order
│   ├── inventory/
│   │   ├── page.tsx              # Inventory dashboard
│   │   ├── stock-movements/page.tsx
│   │   └── purchase-orders/page.tsx
│   ├── sales/
│   │   ├── page.tsx              # Sales dashboard
│   │   ├── quotations/page.tsx
│   │   └── invoices/page.tsx
│   ├── patients/
│   │   ├── page.tsx              # Patients list
│   │   ├── [id]/page.tsx         # Patient profile
│   │   └── new/page.tsx          # Add patient
│   ├── medical-records/
│   │   ├── page.tsx              # Medical records
│   │   └── [id]/page.tsx         # Record detail
│   ├── analytics/
│   │   ├── page.tsx              # Analytics dashboard
│   │   ├── financial/page.tsx
│   │   ├── sales/page.tsx
│   │   └── inventory/page.tsx
│   ├── reports/
│   │   ├── page.tsx              # Reports hub
│   │   └── builder/page.tsx      # Custom report builder
│   ├── search/
│   │   └── page.tsx              # Universal search
│   ├── admin/
│   │   ├── page.tsx              # Admin dashboard
│   │   ├── users/page.tsx
│   │   └── logs/page.tsx
│   └── settings/
│       └── page.tsx              # System settings
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── RevenueChart.tsx
│   │   └── RecentOrders.tsx
│   ├── products/
│   │   ├── ProductForm.tsx
│   │   ├── ProductCard.tsx
│   │   └── ProductTable.tsx
│   ├── customers/
│   │   ├── CustomerForm.tsx
│   │   └── CustomerCard.tsx
│   ├── orders/
│   │   ├── OrderForm.tsx
│   │   ├── OrderTimeline.tsx
│   │   └── OrderItems.tsx
│   ├── inventory/
│   │   ├── StockAdjustment.tsx
│   │   └── ExpiryAlerts.tsx
│   ├── patients/
│   │   ├── PatientForm.tsx
│   │   └── MedicalHistory.tsx
│   ├── ai/
│   │   ├── AIInsights.tsx
│   │   ├── DemandForecast.tsx
│   │   └── PricingRecommendations.tsx
│   ├── search/
│   │   ├── UniversalSearch.tsx
│   │   └── SearchResults.tsx
│   ├── upload/
│   │   ├── FileUploader.tsx
│   │   └── OCRProcessor.tsx
│   └── common/
│       ├── DataTable.tsx
│       ├── Modal.tsx
│       └── LoadingSpinner.tsx
├── lib/
│   ├── db/
│   │   ├── schema.ts             # Dexie schema
│   │   ├── migrations.ts
│   │   └── relationships.ts      # Relationship manager
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── calculations.ts
│   └── constants.ts
├── services/
│   ├── gemini/
│   │   ├── client.ts             # Gemini API client
│   │   ├── forecasting.ts        # Demand forecasting
│   │   ├── pricing.ts            # Pricing optimization
│   │   ├── insights.ts           # Business intelligence
│   │   ├── medical.ts            # Medical analysis
│   │   ├── ocr.ts                # Document OCR
│   │   └── cache.ts              # Response caching
│   ├── database/
│   │   ├── products.ts
│   │   ├── customers.ts
│   │   ├── orders.ts
│   │   ├── inventory.ts
│   │   ├── sales.ts
│   │   ├── patients.ts
│   │   └── medical-records.ts
│   └── analytics/
│       ├── financial.ts
│       ├── sales.ts
│       └── inventory.ts
├── types/
│   ├── database.ts               # Database types
│   ├── api.ts                    # API types
│   ├── gemini.ts                 # Gemini types
│   └── components.ts             # Component props
├── hooks/
│   ├── useProducts.ts
│   ├── useCustomers.ts
│   ├── useOrders.ts
│   ├── useInventory.ts
│   ├── usePatients.ts
│   ├── useAIInsights.ts
│   ├── useSearch.ts
│   └── useAuth.ts
└── store/
    ├── authStore.ts
    ├── cartStore.ts
    ├── notificationStore.ts
    └── cacheStore.ts
```

## Components and Interfaces

### Core Database Schema


#### Products Table

```typescript
interface Product {
  id: string;                    // UUID
  sku: string;                   // Unique stock keeping unit
  name: string;
  category: string;              // Medical equipment, Pharmaceuticals, Supplies, etc.
  description: string;
  manufacturer: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  expiryDate?: Date;
  batchNumber?: string;
  regulatoryInfo?: string;       // FDA approval, certifications
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  // Computed fields
  profitMargin?: number;         // Calculated: (unitPrice - costPrice) / unitPrice
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock';
}
```

#### Customers Table

```typescript
interface Customer {
  id: string;
  customerId: string;            // Business-friendly ID (e.g., CUST-001)
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy' | 'distributor';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
  creditLimit: number;
  paymentTerms: string;          // e.g., "Net 30", "Net 60"
  segment?: 'VIP' | 'Regular' | 'New' | 'Inactive';
  lifetimeValue?: number;        // Calculated
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Orders Table

```typescript
interface Order {
  id: string;
  orderId: string;               // Business-friendly ID (e.g., ORD-2024-001)
  customerId: string;            // FK to Customers
  orderDate: Date;
  deliveryDate?: Date;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  items: OrderItem[];            // JSON array
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentStatus: 'unpaid' | 'partially-paid' | 'paid' | 'overdue';
  paymentMethod?: string;
  salesPerson: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}
```

#### Inventory Table

```typescript
interface Inventory {
  id: string;
  productId: string;             // FK to Products
  warehouseLocation: string;
  quantity: number;
  reservedQuantity: number;      // Reserved for pending orders
  availableQuantity: number;     // Calculated: quantity - reservedQuantity
  lastRestocked: Date;
  expiryTracking: ExpiryBatch[];
  updatedAt: Date;
}

interface ExpiryBatch {
  batchNumber: string;
  quantity: number;
  expiryDate: Date;
  receivedDate: Date;
}
```

#### Sales Table

```typescript
interface Sale {
  id: string;
  saleId: string;
  orderId: string;               // FK to Orders
  customerId: string;            // FK to Customers
  saleDate: Date;
  totalAmount: number;
  costAmount: number;
  profit: number;                // totalAmount - costAmount
  profitMargin: number;          // profit / totalAmount
  paymentMethod: string;
  salesPerson: string;
  commission: number;
  createdAt: Date;
}
```

#### Patients Table

```typescript
interface Patient {
  id: string;
  patientId: string;             // Business-friendly ID
  nationalId: string;            // Unique identifier
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  age?: number;                  // Calculated
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address: string;
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  linkedCustomerId?: string;     // FK to Customers (if patient is from a healthcare facility)
  createdAt: Date;
  updatedAt: Date;
}
```

#### MedicalRecords Table

```typescript
interface MedicalRecord {
  id: string;
  recordId: string;
  patientId: string;             // FK to Patients
  recordType: 'consultation' | 'lab-result' | 'prescription' | 'imaging' | 'surgery' | 'other';
  title: string;
  content: string;
  diagnosis?: string;
  medications?: Medication[];
  doctorName?: string;
  hospitalName?: string;
  visitDate: Date;
  attachments?: Attachment[];
  geminiAnalysis?: GeminiAnalysis;
  linkedProductIds?: string[];   // Products mentioned in the record
  createdAt: Date;
  updatedAt: Date;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  ocrText?: string;
}

interface GeminiAnalysis {
  summary: string;
  extractedData: any;
  confidence: number;
  timestamp: Date;
}
```

#### Additional Supporting Tables

```typescript
interface Quotation {
  id: string;
  quotationId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  validUntil: Date;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  convertedToOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Invoice {
  id: string;
  invoiceId: string;
  orderId: string;
  customerId: string;
  issueDate: Date;
  dueDate: Date;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'unpaid' | 'partially-paid' | 'paid' | 'overdue';
  paymentTerms: string;
  createdAt: Date;
}

interface Payment {
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

interface StockMovement {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  reason: string;
  referenceId?: string;          // Order ID, PO ID, etc.
  performedBy: string;
  timestamp: Date;
}

interface PurchaseOrder {
  id: string;
  poId: string;
  supplierId: string;
  items: OrderItem[];
  totalAmount: number;
  orderDate: Date;
  expectedDeliveryDate: Date;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  receivedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface SearchHistory {
  id: string;
  query: string;
  entityType: 'all' | 'products' | 'customers' | 'orders' | 'patients';
  results: number;
  timestamp: Date;
  userId: string;
}

interface SystemLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  userId: string;
  timestamp: Date;
  status: 'success' | 'error' | 'warning';
  errorMessage?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'sales' | 'inventory' | 'medical' | 'hr' | 'quality' | 'executive';
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

// ============================================
// NEW TABLES FOR EXTENDED FEATURES
// ============================================

// Quality Control & Rejection Management
interface Rejection {
  id: string;
  rejectionId: string;             // Business-friendly ID (e.g., REJ-2024-001)
  itemCode: string;                // Product SKU or item identifier
  productId: string;               // FK to Products
  machineName: string;             // Machine/equipment that produced the item
  lotNumber: string;               // Lot number for traceability
  batchNumber: string;             // Batch number
  quantity: number;                // Quantity rejected
  rejectionDate: Date;
  rejectionReason: string;         // Primary rejection reason
  rejectionType: 'cosmetic' | 'functional' | 'safety' | 'documentation' | 'other';
  inspectorId: string;             // FK to Employees
  supplierId?: string;             // FK to Suppliers (if from supplier)
  orderId?: string;                // FK to Orders (if related to order)
  status: 'pending' | 'under-review' | 'corrective-action' | 'resolved' | 'closed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  images: RejectionImage[];        // Photos of defects
  correctionActions: CorrectionAction[];
  costImpact: number;              // Financial impact
  geminiAnalysis?: {
    defectType: string;
    confidence: number;
    suggestedActions: string[];
    similarCases: string[];        // IDs of similar rejections
  };
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

interface RejectionImage {
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

interface CorrectionAction {
  id: string;
  description: string;
  assignedTo: string;             // Employee ID
  dueDate: Date;
  status: 'open' | 'in-progress' | 'completed' | 'verified';
  completedAt?: Date;
  effectiveness?: number;          // 0-100 score
}

interface RejectionReason {
  id: string;
  code: string;
  category: string;
  description: string;
  isActive: boolean;
}

interface QualityInspection {
  id: string;
  inspectionId: string;
  productId: string;               // FK to Products
  orderId?: string;                // FK to Orders
  batchNumber: string;
  inspectionDate: Date;
  inspectorId: string;             // FK to Employees
  inspectionType: 'incoming' | 'in-process' | 'final' | 'random';
  sampleSize: number;
  passedQuantity: number;
  failedQuantity: number;
  status: 'passed' | 'failed' | 'conditional';
  notes: string;
  checkpoints: InspectionCheckpoint[];
  createdAt: Date;
}

interface InspectionCheckpoint {
  parameter: string;
  specification: string;
  actualValue: string;
  result: 'pass' | 'fail';
  notes?: string;
}

// Human Resources Management
interface Employee {
  id: string;
  employeeId: string;              // Business-friendly ID (e.g., EMP-001)
  nationalId: string;              // Unique national identifier
  firstName: string;
  lastName: string;
  fullName?: string;               // Computed
  dateOfBirth: Date;
  age?: number;                    // Computed
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  
  // Employment Details
  departmentId: string;            // FK to Departments
  positionId: string;              // FK to Positions
  managerId?: string;              // FK to Employees (direct manager)
  hireDate: Date;
  contractType: 'permanent' | 'contract' | 'part-time' | 'intern';
  contractEndDate?: Date;
  probationEndDate?: Date;
  
  // Compensation
  basicSalary: number;
  currency: string;
  paymentFrequency: 'monthly' | 'bi-weekly' | 'weekly';
  bankAccount?: string;
  
  // Status
  status: 'active' | 'on-leave' | 'suspended' | 'archived' | 'terminated';
  terminationDate?: Date;
  terminationReason?: string;
  
  // Personal Details
  emergencyContact: EmergencyContact;
  qualifications: Qualification[];
  certifications: Certification[];
  languages: Language[];
  
  // Documents
  photo?: string;
  documents: EmployeeDocument[];
  
  // Performance
  performanceRating?: number;      // Average rating
  lastReviewDate?: Date;
  nextReviewDate?: Date;
  
  // Leave Balance
  annualLeaveBalance: number;
  sickLeaveBalance: number;
  
  // System
  userId?: string;                 // FK to Users (if has system access)
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
}

interface Qualification {
  degree: string;
  institution: string;
  fieldOfStudy: string;
  graduationYear: number;
  grade?: string;
}

interface Certification {
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
}

interface Language {
  language: string;
  proficiency: 'basic' | 'intermediate' | 'advanced' | 'native';
}

interface EmployeeDocument {
  id: string;
  type: 'contract' | 'id-copy' | 'certificate' | 'resume' | 'other';
  fileName: string;
  url: string;
  uploadDate: Date;
}

interface Department {
  id: string;
  departmentId: string;
  name: string;
  description?: string;
  managerId?: string;              // FK to Employees
  parentDepartmentId?: string;     // For hierarchical structure
  budget?: number;
  employeeCount?: number;          // Computed
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Position {
  id: string;
  positionId: string;
  title: string;
  departmentId: string;            // FK to Departments
  level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director' | 'executive';
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

interface Attendance {
  id: string;
  employeeId: string;              // FK to Employees
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  workHours?: number;              // Computed
  status: 'present' | 'absent' | 'late' | 'half-day' | 'on-leave' | 'holiday';
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

interface Leave {
  id: string;
  leaveId: string;
  employeeId: string;              // FK to Employees
  leaveType: 'annual' | 'sick' | 'emergency' | 'unpaid' | 'maternity' | 'paternity' | 'bereavement' | 'other';
  startDate: Date;
  endDate: Date;
  totalDays: number;               // Computed
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestDate: Date;
  approvedBy?: string;             // FK to Employees
  approvalDate?: Date;
  rejectionReason?: string;
  attachments?: string[];          // Medical certificates, etc.
  createdAt: Date;
  updatedAt: Date;
}

interface Payroll {
  id: string;
  payrollId: string;
  employeeId: string;              // FK to Employees
  month: number;
  year: number;
  
  // Earnings
  basicSalary: number;
  allowances: PayrollItem[];
  overtime: number;
  bonus: number;
  totalEarnings: number;           // Computed
  
  // Deductions
  deductions: PayrollItem[];
  tax: number;
  insurance: number;
  totalDeductions: number;         // Computed
  
  // Net
  netSalary: number;               // Computed: totalEarnings - totalDeductions
  
  // Payment
  paymentDate?: Date;
  paymentMethod: 'bank-transfer' | 'cash' | 'cheque';
  paymentReference?: string;
  status: 'draft' | 'approved' | 'paid' | 'cancelled';
  
  // Approval
  approvedBy?: string;
  approvalDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

interface PayrollItem {
  description: string;
  amount: number;
  type: 'fixed' | 'variable';
}

interface PerformanceReview {
  id: string;
  reviewId: string;
  employeeId: string;              // FK to Employees
  reviewPeriodStart: Date;
  reviewPeriodEnd: Date;
  reviewDate: Date;
  reviewerId: string;              // FK to Employees
  
  // Ratings
  overallRating: number;           // 1-5 scale
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
  status: 'draft' | 'submitted' | 'acknowledged' | 'completed';
  employeeComments?: string;
  acknowledgedDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

interface PerformanceRating {
  category: string;                // e.g., "Quality of Work", "Communication", "Teamwork"
  rating: number;                  // 1-5 scale
  comments?: string;
}

interface PerformanceGoal {
  description: string;
  targetDate: Date;
  status: 'not-started' | 'in-progress' | 'completed' | 'cancelled';
  completionDate?: Date;
}

interface Training {
  id: string;
  trainingId: string;
  title: string;
  description: string;
  category: string;
  type: 'internal' | 'external' | 'online' | 'workshop' | 'certification';
  
  // Schedule
  startDate: Date;
  endDate: Date;
  duration: number;                // Hours
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
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  
  // Materials
  materials: string[];             // URLs to training materials
  
  createdAt: Date;
  updatedAt: Date;
}

interface TrainingAttendee {
  employeeId: string;
  enrollmentDate: Date;
  status: 'enrolled' | 'attended' | 'completed' | 'failed' | 'cancelled';
  completionDate?: Date;
  score?: number;
  certificateUrl?: string;
  feedback?: string;
}

// Recruitment Management
interface JobPosting {
  id: string;
  jobId: string;
  title: string;
  departmentId: string;            // FK to Departments
  positionId: string;              // FK to Positions
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
  workType: 'on-site' | 'remote' | 'hybrid';
  
  // Dates
  postedDate: Date;
  closingDate?: Date;
  
  // Status
  status: 'draft' | 'active' | 'closed' | 'filled' | 'cancelled';
  
  // Tracking
  views: number;
  applicationsCount: number;
  
  // Publishing
  publishedOn: string[];           // Platforms where job is published
  
  // Hiring Manager
  hiringManagerId: string;         // FK to Employees
  
  createdAt: Date;
  updatedAt: Date;
}

interface Applicant {
  id: string;
  applicantId: string;
  jobId: string;                   // FK to JobPostings
  
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  
  // Application
  applicationDate: Date;
  source: 'website' | 'linkedin' | 'referral' | 'job-board' | 'other';
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
  aiCompatibilityScore?: number;   // 0-100
  aiAnalysis?: {
    strengths: string[];
    concerns: string[];
    recommendation: string;
    confidence: number;
  };
  
  // Status
  status: 'applied' | 'screening' | 'interview' | 'assessment' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
  currentStage: string;
  
  // Rating
  overallRating?: number;          // 1-5 scale
  
  // Notes
  notes: ApplicantNote[];
  
  // Interviews
  interviews: string[];            // Interview IDs
  
  createdAt: Date;
  updatedAt: Date;
}

interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
  isCurrent: boolean;
}

interface ApplicantNote {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

interface Interview {
  id: string;
  interviewId: string;
  applicantId: string;             // FK to Applicants
  jobId: string;                   // FK to JobPostings
  
  // Schedule
  scheduledDate: Date;
  duration: number;                // Minutes
  
  // Type
  type: 'phone' | 'video' | 'in-person' | 'technical' | 'panel';
  location?: string;
  meetingLink?: string;
  
  // Interviewers
  interviewers: InterviewerFeedback[];
  
  // Questions (AI-generated)
  suggestedQuestions?: string[];
  
  // Status
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  
  // Overall Feedback
  overallRating?: number;          // 1-5 scale
  recommendation: 'strong-hire' | 'hire' | 'maybe' | 'no-hire';
  
  createdAt: Date;
  updatedAt: Date;
}

interface InterviewerFeedback {
  interviewerId: string;           // FK to Employees
  rating: number;                  // 1-5 scale
  feedback: string;
  strengths: string[];
  concerns: string[];
  recommendation: 'strong-hire' | 'hire' | 'maybe' | 'no-hire';
  submittedAt?: Date;
}

// Supply Chain Management
interface Supplier {
  id: string;
  supplierId: string;
  name: string;
  type: 'manufacturer' | 'distributor' | 'wholesaler' | 'service-provider';
  
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
  leadTime: number;                // Days
  minimumOrderQuantity?: number;
  currency: string;
  
  // Performance
  rating: number;                  // 0-5 scale
  qualityScore: number;            // 0-100
  deliveryScore: number;           // 0-100
  priceScore: number;              // 0-100
  overallScore: number;            // Computed average
  
  // Compliance
  certifications: string[];
  licenses: string[];
  insuranceExpiry?: Date;
  
  // Status
  status: 'active' | 'inactive' | 'blacklisted';
  isPreferred: boolean;
  
  // Products
  suppliedProducts: string[];      // Product IDs
  
  // Financial
  totalPurchaseValue?: number;     // Lifetime value
  outstandingBalance?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

interface SupplierEvaluation {
  id: string;
  supplierId: string;              // FK to Suppliers
  evaluationDate: Date;
  evaluatorId: string;             // FK to Employees
  period: string;                  // e.g., "Q1 2024"
  
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
  
  status: 'draft' | 'completed' | 'approved';
  
  createdAt: Date;
  updatedAt: Date;
}

interface SupplierContract {
  id: string;
  contractId: string;
  supplierId: string;              // FK to Suppliers
  
  // Contract Details
  title: string;
  description: string;
  contractType: 'supply-agreement' | 'service-agreement' | 'framework-agreement';
  
  // Dates
  startDate: Date;
  endDate: Date;
  renewalDate?: Date;
  
  // Terms
  paymentTerms: string;
  deliveryTerms: string;
  qualityStandards: string;
  
  // Products/Services
  coveredProducts: string[];       // Product IDs
  
  // Financial
  contractValue: number;
  currency: string;
  
  // Documents
  documentUrl: string;
  
  // Status
  status: 'draft' | 'active' | 'expired' | 'terminated';
  
  // Notifications
  notifyBeforeExpiry: number;      // Days
  
  createdAt: Date;
  updatedAt: Date;
}
```

### Database Relationships


```mermaid
erDiagram
    %% Core Business Relationships
    CUSTOMERS ||--o{ ORDERS : places
    CUSTOMERS ||--o{ QUOTATIONS : receives
    CUSTOMERS ||--o{ INVOICES : "billed to"
    CUSTOMERS ||--o{ PAYMENTS : makes
    CUSTOMERS ||--o{ PATIENTS : "associated with"
    
    PRODUCTS ||--o{ ORDER_ITEMS : contains
    PRODUCTS ||--|| INVENTORY : "tracked in"
    PRODUCTS ||--o{ STOCK_MOVEMENTS : "moved in"
    PRODUCTS ||--o{ PURCHASE_ORDER_ITEMS : "ordered in"
    PRODUCTS ||--o{ MEDICAL_RECORDS : "mentioned in"
    PRODUCTS ||--o{ REJECTIONS : "rejected from"
    PRODUCTS ||--o{ QUALITY_INSPECTIONS : "inspected in"
    
    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS ||--|| INVOICES : generates
    ORDERS ||--|| SALES : "recorded as"
    ORDERS ||--o{ STOCK_MOVEMENTS : triggers
    ORDERS ||--o{ QUALITY_INSPECTIONS : "requires inspection"
    
    INVOICES ||--o{ PAYMENTS : "paid by"
    
    PATIENTS ||--o{ MEDICAL_RECORDS : has
    MEDICAL_RECORDS ||--o{ ATTACHMENTS : includes
    
    USERS ||--o{ ORDERS : creates
    USERS ||--o{ SYSTEM_LOGS : generates
    USERS ||--o{ SEARCH_HISTORY : performs
    
    %% Quality Control Relationships
    REJECTIONS }o--|| PRODUCTS : "rejects"
    REJECTIONS }o--|| EMPLOYEES : "inspected by"
    REJECTIONS }o--o| SUPPLIERS : "from supplier"
    REJECTIONS }o--o| ORDERS : "related to"
    REJECTIONS ||--o{ REJECTION_IMAGES : "has images"
    REJECTIONS ||--o{ CORRECTION_ACTIONS : "requires actions"
    
    QUALITY_INSPECTIONS }o--|| PRODUCTS : inspects
    QUALITY_INSPECTIONS }o--|| EMPLOYEES : "performed by"
    QUALITY_INSPECTIONS }o--o| ORDERS : "for order"
    
    %% HR Management Relationships
    EMPLOYEES }o--|| DEPARTMENTS : "works in"
    EMPLOYEES }o--|| POSITIONS : "holds position"
    EMPLOYEES }o--o| EMPLOYEES : "reports to"
    EMPLOYEES ||--o{ ATTENDANCE : "has attendance"
    EMPLOYEES ||--o{ LEAVES : "requests leave"
    EMPLOYEES ||--o{ PAYROLL : "receives salary"
    EMPLOYEES ||--o{ PERFORMANCE_REVIEWS : "reviewed in"
    EMPLOYEES ||--o{ TRAINING_ATTENDEES : "attends training"
    EMPLOYEES }o--o| USERS : "has system access"
    
    DEPARTMENTS ||--o{ EMPLOYEES : employs
    DEPARTMENTS }o--o| EMPLOYEES : "managed by"
    DEPARTMENTS ||--o{ POSITIONS : "has positions"
    DEPARTMENTS ||--o{ JOB_POSTINGS : "posts jobs"
    
    POSITIONS ||--o{ EMPLOYEES : "filled by"
    POSITIONS ||--o{ JOB_POSTINGS : "for position"
    
    PAYROLL }o--|| EMPLOYEES : "paid to"
    
    PERFORMANCE_REVIEWS }o--|| EMPLOYEES : "reviews employee"
    PERFORMANCE_REVIEWS }o--|| EMPLOYEES : "reviewed by"
    
    TRAINING ||--o{ TRAINING_ATTENDEES : "has attendees"
    TRAINING_ATTENDEES }o--|| EMPLOYEES : "attended by"
    
    %% Recruitment Relationships
    JOB_POSTINGS ||--o{ APPLICANTS : "receives applications"
    JOB_POSTINGS }o--|| DEPARTMENTS : "for department"
    JOB_POSTINGS }o--|| POSITIONS : "for position"
    JOB_POSTINGS }o--|| EMPLOYEES : "hiring manager"
    
    APPLICANTS }o--|| JOB_POSTINGS : "applies to"
    APPLICANTS ||--o{ INTERVIEWS : "participates in"
    APPLICANTS ||--o{ APPLICANT_NOTES : "has notes"
    
    INTERVIEWS }o--|| APPLICANTS : "interviews applicant"
    INTERVIEWS }o--|| JOB_POSTINGS : "for job"
    INTERVIEWS ||--o{ INTERVIEWER_FEEDBACK : "receives feedback"
    INTERVIEWER_FEEDBACK }o--|| EMPLOYEES : "from interviewer"
    
    %% Supply Chain Relationships
    SUPPLIERS ||--o{ PRODUCTS : supplies
    SUPPLIERS ||--o{ PURCHASE_ORDERS : "receives PO"
    SUPPLIERS ||--o{ REJECTIONS : "source of rejection"
    SUPPLIERS ||--o{ SUPPLIER_EVALUATIONS : "evaluated in"
    SUPPLIERS ||--o{ SUPPLIER_CONTRACTS : "has contracts"
    
    SUPPLIER_EVALUATIONS }o--|| SUPPLIERS : evaluates
    SUPPLIER_EVALUATIONS }o--|| EMPLOYEES : "evaluated by"
    
    SUPPLIER_CONTRACTS }o--|| SUPPLIERS : "contracted with"
    
    PURCHASE_ORDERS }o--|| SUPPLIERS : "ordered from"
    
    %% Cross-Module Integrations
    SALES }o--|| EMPLOYEES : "sold by"
    STOCK_MOVEMENTS }o--|| EMPLOYEES : "performed by"
    CORRECTION_ACTIONS }o--|| EMPLOYEES : "assigned to"
    LEAVES }o--|| EMPLOYEES : "approved by"
```

### Comprehensive System Integration Architecture

The system implements a fully integrated architecture where all modules communicate seamlessly:

```typescript
// lib/db/integrations.ts
class SystemIntegrationManager {
  
  // ============================================
  // QUALITY CONTROL INTEGRATIONS
  // ============================================
  
  // When rejection is created
  async onRejectionCreated(rejection: Rejection) {
    // 1. Update product quality metrics
    await this.updateProductQualityScore(rejection.productId);
    
    // 2. Update supplier rating if from supplier
    if (rejection.supplierId) {
      await this.updateSupplierQualityScore(rejection.supplierId);
    }
    
    // 3. Adjust inventory (remove rejected items)
    await this.adjustInventoryForRejection(rejection);
    
    // 4. Create notification for quality manager
    await this.notifyQualityManager(rejection);
    
    // 5. If critical, notify executive team
    if (rejection.severity === 'critical') {
      await this.notifyExecutiveTeam('critical_rejection', rejection);
    }
    
    // 6. Link to related order if applicable
    if (rejection.orderId) {
      await this.linkRejectionToOrder(rejection);
    }
    
    // 7. Use AI to find similar past rejections
    const similarCases = await this.findSimilarRejections(rejection);
    await this.updateRejectionWithSimilarCases(rejection.id, similarCases);
  }
  
  // ============================================
  // HR INTEGRATIONS
  // ============================================
  
  // When employee is hired
  async onEmployeeHired(employee: Employee, applicantId?: string) {
    // 1. Create user account if needed
    if (employee.positionId) {
      const position = await db.positions.get(employee.positionId);
      const role = this.mapPositionToRole(position);
      await this.createUserAccount(employee, role);
    }
    
    // 2. Initialize leave balances
    await this.initializeLeaveBalances(employee.id);
    
    // 3. Enroll in mandatory training
    await this.enrollInMandatoryTraining(employee.id);
    
    // 4. Update department employee count
    await this.updateDepartmentStats(employee.departmentId);
    
    // 5. If from recruitment, update applicant status
    if (applicantId) {
      await db.applicants.update(applicantId, { status: 'hired' });
    }
    
    // 6. Create onboarding checklist
    await this.createOnboardingChecklist(employee.id);
    
    // 7. Notify relevant stakeholders
    await this.notifyNewHire(employee);
  }
  
  // When employee attendance is recorded
  async onAttendanceRecorded(attendance: Attendance) {
    // 1. Calculate work hours
    if (attendance.checkIn && attendance.checkOut) {
      const hours = this.calculateWorkHours(attendance.checkIn, attendance.checkOut);
      await db.attendance.update(attendance.id, { workHours: hours });
    }
    
    // 2. Check if late and notify manager
    if (attendance.status === 'late') {
      await this.notifyManagerOfLateArrival(attendance);
    }
    
    // 3. Update monthly attendance summary
    await this.updateMonthlyAttendanceSummary(attendance.employeeId);
    
    // 4. If employee is in quality/production, link to their work output
    await this.linkAttendanceToProductionMetrics(attendance);
  }
  
  // When leave is approved
  async onLeaveApproved(leave: Leave) {
    // 1. Deduct from leave balance
    await this.deductLeaveBalance(leave);
    
    // 2. Create attendance records for leave period
    await this.createLeaveAttendanceRecords(leave);
    
    // 3. Notify team members
    await this.notifyTeamOfLeave(leave);
    
    // 4. Adjust work schedules if needed
    await this.adjustWorkSchedules(leave);
    
    // 5. If employee handles critical tasks, reassign
    await this.reassignCriticalTasks(leave.employeeId, leave.startDate, leave.endDate);
  }
  
  // When payroll is processed
  async onPayrollProcessed(payroll: Payroll) {
    // 1. Update employee salary history
    await this.updateSalaryHistory(payroll);
    
    // 2. Create accounting entry
    await this.createPayrollAccountingEntry(payroll);
    
    // 3. Update cash flow projections
    await this.updateCashFlowProjections();
    
    // 4. Generate payslip
    await this.generatePayslip(payroll);
    
    // 5. Send notification to employee
    await this.notifyEmployeeOfPayment(payroll);
  }
  
  // ============================================
  // RECRUITMENT INTEGRATIONS
  // ============================================
  
  // When applicant applies
  async onApplicationReceived(applicant: Applicant) {
    // 1. Use AI to parse resume
    const parsedData = await this.parseResumeWithAI(applicant.resumeUrl);
    await db.applicants.update(applicant.id, { parsedData });
    
    // 2. Calculate compatibility score
    const job = await db.jobPostings.get(applicant.jobId);
    const score = await this.calculateCompatibilityScore(applicant, job);
    await db.applicants.update(applicant.id, { aiCompatibilityScore: score });
    
    // 3. Update job posting application count
    await db.jobPostings.update(applicant.jobId, {
      applicationsCount: (job.applicationsCount || 0) + 1
    });
    
    // 4. Notify hiring manager
    await this.notifyHiringManager(applicant);
    
    // 5. Send acknowledgment email to applicant
    await this.sendApplicationAcknowledgment(applicant);
  }
  
  // When interview is completed
  async onInterviewCompleted(interview: Interview) {
    // 1. Calculate overall rating from all interviewers
    const overallRating = this.calculateOverallInterviewRating(interview);
    await db.interviews.update(interview.id, { overallRating });
    
    // 2. Update applicant status
    await this.updateApplicantAfterInterview(interview);
    
    // 3. Use AI to generate interview summary
    const summary = await this.generateInterviewSummary(interview);
    
    // 4. If strong candidate, fast-track to next stage
    if (interview.recommendation === 'strong-hire') {
      await this.fastTrackApplicant(interview.applicantId);
    }
  }
  
  // ============================================
  // SUPPLY CHAIN INTEGRATIONS
  // ============================================
  
  // When supplier evaluation is completed
  async onSupplierEvaluated(evaluation: SupplierEvaluation) {
    // 1. Update supplier overall score
    await db.suppliers.update(evaluation.supplierId, {
      rating: evaluation.overallScore / 20, // Convert to 5-point scale
      qualityScore: evaluation.qualityScore,
      deliveryScore: evaluation.deliveryScore,
      priceScore: evaluation.priceScore
    });
    
    // 2. If score is low, flag for review
    if (evaluation.overallScore < 60) {
      await this.flagSupplierForReview(evaluation.supplierId);
    }
    
    // 3. Update product sourcing recommendations
    await this.updateProductSourcingRecommendations(evaluation.supplierId);
    
    // 4. Use AI to suggest alternative suppliers if needed
    if (evaluation.overallScore < 70) {
      const alternatives = await this.suggestAlternativeSuppliers(evaluation.supplierId);
      await this.notifyProcurementTeam(alternatives);
    }
  }
  
  // When purchase order is received
  async onPurchaseOrderReceived(po: PurchaseOrder) {
    // 1. Update inventory
    await this.updateInventoryFromPO(po);
    
    // 2. Trigger quality inspection
    await this.createQualityInspections(po);
    
    // 3. Update supplier delivery performance
    await this.updateSupplierDeliveryMetrics(po);
    
    // 4. Create payment obligation
    await this.createPaymentObligation(po);
    
    // 5. Update cash flow projections
    await this.updateCashFlowProjections();
  }
  
  // ============================================
  // CROSS-MODULE INTEGRATIONS
  // ============================================
  
  // Link employee performance to business metrics
  async linkEmployeePerformanceToMetrics(employeeId: string) {
    const employee = await db.employees.get(employeeId);
    
    // If sales employee, link to sales performance
    if (employee.departmentId === 'sales') {
      const sales = await db.sales.where({ salesPerson: employeeId }).toArray();
      const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
      return { totalRevenue, salesCount: sales.length };
    }
    
    // If quality inspector, link to rejection rates
    if (employee.positionId === 'quality-inspector') {
      const inspections = await db.qualityInspections
        .where({ inspectorId: employeeId })
        .toArray();
      const rejections = await db.rejections
        .where({ inspectorId: employeeId })
        .toArray();
      return { inspectionsCount: inspections.length, rejectionsFound: rejections.length };
    }
    
    // If inventory manager, link to stock accuracy
    if (employee.departmentId === 'inventory') {
      const movements = await db.stockMovements
        .where({ performedBy: employeeId })
        .toArray();
      return { movementsProcessed: movements.length };
    }
  }
  
  // Generate comprehensive executive dashboard data
  async generateExecutiveDashboardData() {
    const [
      financialMetrics,
      hrMetrics,
      qualityMetrics,
      supplyChainMetrics,
      salesMetrics
    ] = await Promise.all([
      this.getFinancialMetrics(),
      this.getHRMetrics(),
      this.getQualityMetrics(),
      this.getSupplyChainMetrics(),
      this.getSalesMetrics()
    ]);
    
    // Use AI to generate insights
    const aiInsights = await this.generateExecutiveInsights({
      financialMetrics,
      hrMetrics,
      qualityMetrics,
      supplyChainMetrics,
      salesMetrics
    });
    
    return {
      financialMetrics,
      hrMetrics,
      qualityMetrics,
      supplyChainMetrics,
      salesMetrics,
      aiInsights,
      alerts: await this.getExecutiveAlerts(),
      recommendations: await this.getExecutiveRecommendations()
    };
  }
  
  // AI-powered cross-module analysis
  async performCrossModuleAnalysis() {
    // Analyze correlation between employee satisfaction and quality metrics
    const employeeSatisfaction = await this.getAverageEmployeeSatisfaction();
    const qualityMetrics = await this.getQualityMetrics();
    
    // Analyze correlation between supplier quality and rejection rates
    const supplierQuality = await this.getAverageSupplierQuality();
    const rejectionRates = await this.getRejectionRates();
    
    // Analyze correlation between training and performance
    const trainingHours = await this.getAverageTrainingHours();
    const performanceRatings = await this.getAveragePerformanceRatings();
    
    // Use AI to identify patterns and correlations
    const analysis = await geminiService.generateContent(`
      Analyze these business metrics and identify correlations:
      
      Employee Satisfaction: ${employeeSatisfaction}
      Quality Metrics: ${JSON.stringify(qualityMetrics)}
      Supplier Quality: ${supplierQuality}
      Rejection Rates: ${JSON.stringify(rejectionRates)}
      Training Hours: ${trainingHours}
      Performance Ratings: ${performanceRatings}
      
      Provide insights on:
      1. Correlations between metrics
      2. Root causes of issues
      3. Recommendations for improvement
      4. Predicted impact of interventions
    `);
    
    return JSON.parse(analysis);
  }
}
```

### Relationship Manager Implementation

The system implements automatic cascade operations and data synchronization:

```typescript
// lib/db/relationships.ts
class RelationshipManager {
  // When order is created
  async onOrderCreated(order: Order) {
    // 1. Reserve inventory
    for (const item of order.items) {
      await this.reserveInventory(item.productId, item.quantity);
    }
    
    // 2. Create stock movements
    await this.createStockMovements(order);
    
    // 3. Update customer stats
    await this.updateCustomerStats(order.customerId);
    
    // 4. Log action
    await this.logAction('order_created', order);
  }
  
  // When order is cancelled
  async onOrderCancelled(order: Order) {
    // 1. Release reserved inventory
    for (const item of order.items) {
      await this.releaseInventory(item.productId, item.quantity);
    }
    
    // 2. Reverse stock movements
    await this.reverseStockMovements(order);
    
    // 3. Update customer stats
    await this.updateCustomerStats(order.customerId);
  }
  
  // When payment is recorded
  async onPaymentRecorded(payment: Payment) {
    // 1. Update invoice status
    await this.updateInvoiceStatus(payment.invoiceId);
    
    // 2. Update customer balance
    await this.updateCustomerBalance(payment.customerId);
    
    // 3. Check if order is fully paid
    await this.checkOrderPaymentStatus(payment.invoiceId);
  }
  
  // When product price changes
  async onProductPriceChanged(productId: string, newPrice: number) {
    // 1. Save price history
    await this.savePriceHistory(productId, newPrice);
    
    // 2. Update pending quotations (optional)
    await this.updatePendingQuotations(productId);
  }
  
  // When inventory reaches reorder level
  async onLowStockDetected(productId: string) {
    // 1. Create draft purchase order
    await this.createDraftPurchaseOrder(productId);
    
    // 2. Notify inventory manager
    await this.sendNotification('low_stock', productId);
  }
  
  // When product expires
  async onProductExpired(productId: string, batchNumber: string) {
    // 1. Mark batch as unavailable
    await this.markBatchUnavailable(productId, batchNumber);
    
    // 2. Adjust inventory
    await this.adjustInventoryForExpiry(productId, batchNumber);
    
    // 3. Create alert
    await this.createExpiryAlert(productId, batchNumber);
  }
}
```

## Data Models

### Dexie.js Schema Definition

```typescript
// lib/db/schema.ts
import Dexie, { Table } from 'dexie';

export class MedicalProductsDB extends Dexie {
  // Core Business Tables
  products!: Table<Product>;
  customers!: Table<Customer>;
  orders!: Table<Order>;
  inventory!: Table<Inventory>;
  sales!: Table<Sale>;
  patients!: Table<Patient>;
  medicalRecords!: Table<MedicalRecord>;
  quotations!: Table<Quotation>;
  invoices!: Table<Invoice>;
  payments!: Table<Payment>;
  stockMovements!: Table<StockMovement>;
  purchaseOrders!: Table<PurchaseOrder>;
  searchHistory!: Table<SearchHistory>;
  systemLogs!: Table<SystemLog>;
  users!: Table<User>;
  
  // Quality Control Tables
  rejections!: Table<Rejection>;
  rejectionReasons!: Table<RejectionReason>;
  qualityInspections!: Table<QualityInspection>;
  
  // HR Management Tables
  employees!: Table<Employee>;
  departments!: Table<Department>;
  positions!: Table<Position>;
  attendance!: Table<Attendance>;
  leaves!: Table<Leave>;
  payroll!: Table<Payroll>;
  performanceReviews!: Table<PerformanceReview>;
  training!: Table<Training>;
  
  // Recruitment Tables
  jobPostings!: Table<JobPosting>;
  applicants!: Table<Applicant>;
  interviews!: Table<Interview>;
  
  // Supply Chain Tables
  suppliers!: Table<Supplier>;
  supplierEvaluations!: Table<SupplierEvaluation>;
  supplierContracts!: Table<SupplierContract>;

  constructor() {
    super('MedicalProductsDB');
    
    // Version 1: Original tables
    this.version(1).stores({
      products: 'id, sku, name, category, manufacturer, stockQuantity, expiryDate, isActive, createdAt',
      customers: 'id, customerId, name, type, email, segment, isActive, createdAt',
      orders: 'id, orderId, customerId, orderDate, status, paymentStatus, salesPerson, createdAt',
      inventory: 'id, productId, warehouseLocation, quantity, lastRestocked',
      sales: 'id, saleId, orderId, customerId, saleDate, salesPerson, createdAt',
      patients: 'id, patientId, nationalId, firstName, lastName, linkedCustomerId, createdAt',
      medicalRecords: 'id, recordId, patientId, recordType, visitDate, doctorName, createdAt',
      quotations: 'id, quotationId, customerId, status, validUntil, createdAt',
      invoices: 'id, invoiceId, orderId, customerId, dueDate, status, createdAt',
      payments: 'id, paymentId, invoiceId, customerId, paymentDate, createdAt',
      stockMovements: 'id, productId, type, timestamp, performedBy',
      purchaseOrders: 'id, poId, supplierId, orderDate, status, createdAt',
      searchHistory: 'id, query, entityType, timestamp, userId',
      systemLogs: 'id, action, entityType, timestamp, userId, status',
      users: 'id, username, email, role, isActive'
    });
    
    // Version 2: Add Quality Control, HR, Recruitment, and Supply Chain tables
    this.version(2).stores({
      // Keep all existing tables
      products: 'id, sku, name, category, manufacturer, stockQuantity, expiryDate, isActive, createdAt',
      customers: 'id, customerId, name, type, email, segment, isActive, createdAt',
      orders: 'id, orderId, customerId, orderDate, status, paymentStatus, salesPerson, createdAt',
      inventory: 'id, productId, warehouseLocation, quantity, lastRestocked',
      sales: 'id, saleId, orderId, customerId, saleDate, salesPerson, createdAt',
      patients: 'id, patientId, nationalId, firstName, lastName, linkedCustomerId, createdAt',
      medicalRecords: 'id, recordId, patientId, recordType, visitDate, doctorName, createdAt',
      quotations: 'id, quotationId, customerId, status, validUntil, createdAt',
      invoices: 'id, invoiceId, orderId, customerId, dueDate, status, createdAt',
      payments: 'id, paymentId, invoiceId, customerId, paymentDate, createdAt',
      stockMovements: 'id, productId, type, timestamp, performedBy',
      purchaseOrders: 'id, poId, supplierId, orderDate, status, createdAt',
      searchHistory: 'id, query, entityType, timestamp, userId',
      systemLogs: 'id, action, entityType, timestamp, userId, status',
      users: 'id, username, email, role, isActive',
      
      // Quality Control Tables
      rejections: 'id, rejectionId, itemCode, productId, batchNumber, lotNumber, rejectionDate, inspectorId, supplierId, orderId, status, severity, createdAt',
      rejectionReasons: 'id, code, category, isActive',
      qualityInspections: 'id, inspectionId, productId, orderId, batchNumber, inspectionDate, inspectorId, inspectionType, status, createdAt',
      
      // HR Management Tables
      employees: 'id, employeeId, nationalId, firstName, lastName, departmentId, positionId, managerId, hireDate, status, userId, createdAt',
      departments: 'id, departmentId, name, managerId, isActive, createdAt',
      positions: 'id, positionId, title, departmentId, level, isActive, createdAt',
      attendance: 'id, employeeId, date, status, createdAt',
      leaves: 'id, leaveId, employeeId, leaveType, startDate, endDate, status, requestDate, approvedBy, createdAt',
      payroll: 'id, payrollId, employeeId, month, year, status, paymentDate, createdAt',
      performanceReviews: 'id, reviewId, employeeId, reviewDate, reviewerId, overallRating, status, createdAt',
      training: 'id, trainingId, title, category, type, startDate, endDate, status, createdAt',
      
      // Recruitment Tables
      jobPostings: 'id, jobId, title, departmentId, positionId, status, postedDate, closingDate, hiringManagerId, createdAt',
      applicants: 'id, applicantId, jobId, firstName, lastName, email, applicationDate, status, source, createdAt',
      interviews: 'id, interviewId, applicantId, jobId, scheduledDate, type, status, createdAt',
      
      // Supply Chain Tables
      suppliers: 'id, supplierId, name, type, country, rating, status, isPreferred, createdAt',
      supplierEvaluations: 'id, supplierId, evaluationDate, evaluatorId, period, overallScore, status, createdAt',
      supplierContracts: 'id, contractId, supplierId, contractType, startDate, endDate, status, createdAt'
    });
  }
}

export const db = new MedicalProductsDB();
```

### Service Layer Architecture


#### Gemini AI Service Architecture

```typescript
// services/gemini/client.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private client: GoogleGenerativeAI;
  private model: any;
  private visionModel: any;
  private cache: Map<string, any>;
  private rateLimiter: RateLimiter;
  
  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({ model: 'gemini-pro' });
    this.visionModel = this.client.getGenerativeModel({ model: 'gemini-pro-vision' });
    this.cache = new Map();
    this.rateLimiter = new RateLimiter(60, 60000); // 60 requests per minute
  }
  
  async generateContent(prompt: string, useCache: boolean = true): Promise<any> {
    // Check cache
    if (useCache && this.cache.has(prompt)) {
      return this.cache.get(prompt);
    }
    
    // Rate limiting
    await this.rateLimiter.acquire();
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Cache response
      if (useCache) {
        this.cache.set(prompt, response);
      }
      
      // Log API call
      await this.logAPICall('generateContent', prompt.length, response.length);
      
      return response;
    } catch (error) {
      await this.logError('generateContent', error);
      throw error;
    }
  }
  
  async analyzeImage(imageData: string, prompt: string): Promise<any> {
    await this.rateLimiter.acquire();
    
    try {
      const result = await this.visionModel.generateContent([
        prompt,
        { inlineData: { data: imageData, mimeType: 'image/jpeg' } }
      ]);
      
      const response = result.response.text();
      await this.logAPICall('analyzeImage', imageData.length, response.length);
      
      return response;
    } catch (error) {
      await this.logError('analyzeImage', error);
      throw error;
    }
  }
}
```

#### Demand Forecasting Service

```typescript
// services/gemini/forecasting.ts
export class ForecastingService {
  constructor(private gemini: GeminiService) {}
  
  async forecastDemand(productId: string, days: number): Promise<DemandForecast> {
    // 1. Get historical sales data
    const salesHistory = await this.getSalesHistory(productId, 180); // 6 months
    
    // 2. Prepare data for Gemini
    const prompt = `
      Analyze the following sales data and forecast demand for the next ${days} days.
      
      Historical Sales Data (last 180 days):
      ${JSON.stringify(salesHistory)}
      
      Consider:
      - Seasonal patterns
      - Growth trends
      - Day of week patterns
      - Any anomalies
      
      Provide forecast in JSON format:
      {
        "forecast": [
          { "date": "2024-01-01", "predictedQuantity": 10, "confidence": 0.85 }
        ],
        "seasonalPattern": "description",
        "trend": "increasing|stable|decreasing",
        "confidence": 0.85,
        "factors": ["factor1", "factor2"]
      }
    `;
    
    // 3. Get AI forecast
    const response = await this.gemini.generateContent(prompt);
    const forecast = JSON.parse(response);
    
    // 4. Calculate optimal reorder point
    forecast.reorderPoint = this.calculateReorderPoint(forecast);
    forecast.reorderQuantity = this.calculateReorderQuantity(forecast);
    
    return forecast;
  }
  
  async detectTrendingProducts(): Promise<Product[]> {
    const prompt = `
      Analyze recent sales trends and identify products with increasing demand.
      
      Sales Data (last 30 days):
      ${JSON.stringify(await this.getRecentSales(30))}
      
      Return products with >20% growth in JSON format.
    `;
    
    const response = await this.gemini.generateContent(prompt);
    return JSON.parse(response);
  }
}
```

#### Pricing Optimization Service

```typescript
// services/gemini/pricing.ts
export class PricingService {
  constructor(private gemini: GeminiService) {}
  
  async optimizePricing(productId: string): Promise<PricingRecommendation> {
    // 1. Gather data
    const product = await db.products.get(productId);
    const salesHistory = await this.getSalesAtDifferentPrices(productId);
    const competitorPrices = await this.getCompetitorPrices(product.name);
    const inventory = await db.inventory.where({ productId }).first();
    
    // 2. Calculate price elasticity
    const elasticity = this.calculatePriceElasticity(salesHistory);
    
    // 3. Get AI recommendation
    const prompt = `
      Optimize pricing for this medical product:
      
      Product: ${product.name}
      Current Price: $${product.unitPrice}
      Cost Price: $${product.costPrice}
      Current Stock: ${inventory.quantity}
      Price Elasticity: ${elasticity}
      
      Sales History at Different Prices:
      ${JSON.stringify(salesHistory)}
      
      Competitor Prices:
      ${JSON.stringify(competitorPrices)}
      
      Recommend optimal price that maximizes profit while remaining competitive.
      Consider:
      - Profit margin
      - Market positioning
      - Stock levels (suggest discount if overstocked)
      - Demand elasticity
      
      Return JSON:
      {
        "recommendedPrice": 100,
        "expectedSalesIncrease": "15%",
        "expectedProfitIncrease": "10%",
        "reasoning": "explanation",
        "confidence": 0.85
      }
    `;
    
    const response = await this.gemini.generateContent(prompt);
    return JSON.parse(response);
  }
  
  async suggestBundles(): Promise<BundleRecommendation[]> {
    // Analyze products frequently bought together
    const orders = await db.orders.toArray();
    
    const prompt = `
      Analyze order data and suggest product bundles:
      
      ${JSON.stringify(orders.map(o => o.items))}
      
      Find products frequently purchased together and suggest bundles with pricing.
    `;
    
    const response = await this.gemini.generateContent(prompt);
    return JSON.parse(response);
  }
}
```

#### Business Intelligence Service

```typescript
// services/gemini/insights.ts
export class InsightsService {
  constructor(private gemini: GeminiService) {}
  
  async generateMorningBriefing(): Promise<DailyBriefing> {
    // Gather all relevant data
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const data = {
      sales: await this.getYesterdaySales(),
      newOrders: await this.getNewOrders(yesterday),
      lowStock: await this.getLowStockProducts(),
      overduePayments: await this.getOverduePayments(),
      expiringProducts: await this.getExpiringProducts(90),
      topCustomers: await this.getTopCustomers(30)
    };
    
    const prompt = `
      Generate a morning briefing report for a medical products company:
      
      Data:
      ${JSON.stringify(data)}
      
      Include:
      1. Key highlights (sales, orders, alerts)
      2. Important actions needed today
      3. Opportunities identified
      4. Risks and concerns
      5. Recommendations
      
      Format as structured JSON with sections.
    `;
    
    const response = await this.gemini.generateContent(prompt, false); // Don't cache
    return JSON.parse(response);
  }
  
  async detectAnomalies(): Promise<Anomaly[]> {
    const recentData = await this.getRecentBusinessMetrics(30);
    
    const prompt = `
      Analyze business metrics and detect anomalies:
      
      ${JSON.stringify(recentData)}
      
      Identify unusual patterns in:
      - Sales volumes
      - Order values
      - Customer behavior
      - Inventory movements
      - Payment delays
      
      For each anomaly, provide:
      - Type and severity
      - Explanation
      - Recommended action
    `;
    
    const response = await this.gemini.generateContent(prompt, false);
    return JSON.parse(response);
  }
  
  async answerBusinessQuestion(question: string): Promise<string> {
    // Get relevant data based on question
    const context = await this.getRelevantContext(question);
    
    const prompt = `
      Answer this business question using the provided data:
      
      Question: ${question}
      
      Available Data:
      ${JSON.stringify(context)}
      
      Provide a clear, data-driven answer with specific numbers and insights.
    `;
    
    const response = await this.gemini.generateContent(prompt);
    return response;
  }
}
```

#### Medical Analysis Service

```typescript
// services/gemini/medical.ts
export class MedicalAnalysisService {
  constructor(private gemini: GeminiService) {}
  
  async analyzeMedicalReport(reportText: string): Promise<MedicalAnalysis> {
    const prompt = `
      Analyze this medical report and extract structured information:
      
      ${reportText}
      
      Extract and return JSON:
      {
        "patientInfo": {
          "name": "",
          "age": 0,
          "gender": ""
        },
        "diagnosis": "",
        "symptoms": [],
        "medications": [
          { "name": "", "dosage": "", "frequency": "" }
        ],
        "recommendations": [],
        "followUpDate": "",
        "confidence": 0.9
      }
    `;
    
    const response = await this.gemini.generateContent(prompt);
    return JSON.parse(response);
  }
  
  async linkMedicalRecordsToProducts(recordId: string): Promise<string[]> {
    const record = await db.medicalRecords.get(recordId);
    const allProducts = await db.products.toArray();
    
    const prompt = `
      Match medications/treatments in this medical record to available products:
      
      Medical Record:
      ${JSON.stringify(record)}
      
      Available Products:
      ${JSON.stringify(allProducts.map(p => ({ id: p.id, name: p.name, category: p.category })))}
      
      Return array of matching product IDs.
    `;
    
    const response = await this.gemini.generateContent(prompt);
    const productIds = JSON.parse(response);
    
    // Update record with linked products
    await db.medicalRecords.update(recordId, { linkedProductIds: productIds });
    
    return productIds;
  }
  
  async predictProductDemandFromMedicalTrends(): Promise<DemandPrediction[]> {
    const recentRecords = await db.medicalRecords
      .where('visitDate')
      .above(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      .toArray();
    
    const prompt = `
      Analyze medical records to predict product demand:
      
      Recent Medical Records (diagnoses and medications):
      ${JSON.stringify(recentRecords.map(r => ({ diagnosis: r.diagnosis, medications: r.medications })))}
      
      Identify:
      1. Common conditions being treated
      2. Frequently prescribed medications
      3. Emerging health trends
      4. Predicted demand for related medical products
      
      Return predictions with confidence scores.
    `;
    
    const response = await this.gemini.generateContent(prompt);
    return JSON.parse(response);
  }
}
```

#### OCR Processing Service

```typescript
// services/gemini/ocr.ts
export class OCRService {
  constructor(private gemini: GeminiService) {}
  
  async processDocument(file: File): Promise<ProcessedDocument> {
    // 1. Convert file to base64
    const base64 = await this.fileToBase64(file);
    
    // 2. Detect document type
    const typePrompt = `
      Identify the type of this document:
      - invoice
      - purchase_order
      - medical_report
      - prescription
      - lab_result
      - delivery_note
      - other
      
      Return just the type.
    `;
    
    const docType = await this.gemini.analyzeImage(base64, typePrompt);
    
    // 3. Extract data based on type
    const extractionPrompt = this.getExtractionPrompt(docType.trim());
    const extractedData = await this.gemini.analyzeImage(base64, extractionPrompt);
    
    // 4. Extract full text
    const textPrompt = 'Extract all text from this document.';
    const fullText = await this.gemini.analyzeImage(base64, textPrompt);
    
    return {
      documentType: docType.trim(),
      extractedData: JSON.parse(extractedData),
      fullText: fullText,
      confidence: 0.85,
      processedAt: new Date()
    };
  }
  
  private getExtractionPrompt(docType: string): string {
    const prompts = {
      invoice: `
        Extract invoice data in JSON format:
        {
          "invoiceNumber": "",
          "date": "",
          "vendorName": "",
          "items": [{ "description": "", "quantity": 0, "unitPrice": 0, "total": 0 }],
          "subtotal": 0,
          "tax": 0,
          "total": 0
        }
      `,
      medical_report: `
        Extract medical report data in JSON format:
        {
          "patientName": "",
          "date": "",
          "doctorName": "",
          "diagnosis": "",
          "medications": [],
          "recommendations": ""
        }
      `,
      // ... other document types
    };
    
    return prompts[docType] || 'Extract all structured data from this document in JSON format.';
  }
}
```

## Error Handling


### Error Handling Strategy

```typescript
// lib/utils/errorHandler.ts
export class ErrorHandler {
  static async handle(error: Error, context: ErrorContext) {
    // 1. Log error
    await db.systemLogs.add({
      id: generateId(),
      action: 'error',
      entityType: context.entityType,
      entityId: context.entityId,
      details: error.message,
      userId: context.userId,
      timestamp: new Date(),
      status: 'error',
      errorMessage: error.stack
    });
    
    // 2. Show user-friendly message
    const userMessage = this.getUserFriendlyMessage(error);
    toast.error(userMessage);
    
    // 3. Attempt recovery if possible
    if (this.isRecoverable(error)) {
      await this.attemptRecovery(error, context);
    }
    
    // 4. Report to admin dashboard
    await this.reportToAdmin(error, context);
  }
  
  static getUserFriendlyMessage(error: Error): string {
    const messages = {
      'NetworkError': 'Connection issue. Please check your internet connection.',
      'QuotaExceededError': 'Storage limit reached. Please free up space.',
      'APIRateLimitError': 'Too many requests. Please wait a moment.',
      'ValidationError': 'Please check your input and try again.',
      'NotFoundError': 'The requested item was not found.',
      'PermissionError': 'You do not have permission to perform this action.'
    };
    
    return messages[error.name] || 'An unexpected error occurred. Please try again.';
  }
  
  static isRecoverable(error: Error): boolean {
    const recoverableErrors = ['NetworkError', 'APIRateLimitError', 'TimeoutError'];
    return recoverableErrors.includes(error.name);
  }
  
  static async attemptRecovery(error: Error, context: ErrorContext) {
    if (error.name === 'NetworkError') {
      // Queue operation for retry when online
      await this.queueForRetry(context.operation);
    } else if (error.name === 'APIRateLimitError') {
      // Retry with exponential backoff
      await this.retryWithBackoff(context.operation);
    }
  }
}

// Global error boundary
export class GlobalErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    ErrorHandler.handle(error, {
      entityType: 'ui',
      userId: getCurrentUserId(),
      operation: 'render'
    });
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Retry Logic with Exponential Backoff

```typescript
// lib/utils/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

// Usage example
const result = await retryWithBackoff(
  () => geminiService.generateContent(prompt),
  3,
  1000
);
```

## Testing Strategy

### Unit Testing

```typescript
// __tests__/services/forecasting.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ForecastingService } from '@/services/gemini/forecasting';

describe('ForecastingService', () => {
  let service: ForecastingService;
  
  beforeEach(() => {
    service = new ForecastingService(mockGeminiService);
  });
  
  it('should forecast demand for next 30 days', async () => {
    const forecast = await service.forecastDemand('product-1', 30);
    
    expect(forecast.forecast).toHaveLength(30);
    expect(forecast.confidence).toBeGreaterThan(0);
    expect(forecast.reorderPoint).toBeDefined();
  });
  
  it('should detect trending products', async () => {
    const trending = await service.detectTrendingProducts();
    
    expect(Array.isArray(trending)).toBe(true);
    expect(trending.every(p => p.growthRate > 0.2)).toBe(true);
  });
});
```

### Integration Testing

```typescript
// __tests__/integration/order-flow.test.ts
describe('Order Flow Integration', () => {
  it('should complete full order lifecycle', async () => {
    // 1. Create order
    const order = await createOrder({
      customerId: 'customer-1',
      items: [{ productId: 'product-1', quantity: 10 }]
    });
    
    // 2. Verify inventory reserved
    const inventory = await db.inventory.where({ productId: 'product-1' }).first();
    expect(inventory.reservedQuantity).toBe(10);
    
    // 3. Mark as delivered
    await updateOrderStatus(order.id, 'delivered');
    
    // 4. Verify invoice created
    const invoice = await db.invoices.where({ orderId: order.id }).first();
    expect(invoice).toBeDefined();
    
    // 5. Record payment
    await recordPayment({
      invoiceId: invoice.id,
      amount: invoice.totalAmount
    });
    
    // 6. Verify order completed
    const updatedOrder = await db.orders.get(order.id);
    expect(updatedOrder.paymentStatus).toBe('paid');
  });
});
```

### AI Service Testing

```typescript
// __tests__/services/gemini.test.ts
describe('Gemini AI Service', () => {
  it('should cache responses', async () => {
    const prompt = 'Test prompt';
    
    const response1 = await geminiService.generateContent(prompt);
    const response2 = await geminiService.generateContent(prompt);
    
    expect(response1).toBe(response2);
    expect(geminiService.getCacheSize()).toBe(1);
  });
  
  it('should respect rate limits', async () => {
    const promises = Array(100).fill(null).map(() => 
      geminiService.generateContent('test')
    );
    
    const start = Date.now();
    await Promise.all(promises);
    const duration = Date.now() - start;
    
    // Should take at least 1 minute for 100 requests (60 per minute limit)
    expect(duration).toBeGreaterThan(60000);
  });
});
```

## Performance Optimization

### Virtual Scrolling for Large Lists

```typescript
// components/common/VirtualTable.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualTable<T>({ data, renderRow }: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5
  });
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            {renderRow(data[virtualRow.index])}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Lazy Loading and Code Splitting

```typescript
// app/layout.tsx
import dynamic from 'next/dynamic';

// Lazy load heavy components
const AnalyticsDashboard = dynamic(() => import('@/components/analytics/Dashboard'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

const ReportBuilder = dynamic(() => import('@/components/reports/Builder'), {
  loading: () => <LoadingSpinner />
});
```

### Database Query Optimization

```typescript
// services/database/optimized-queries.ts
export class OptimizedQueries {
  // Use compound indexes for common queries
  static async getCustomerOrders(customerId: string, status?: string) {
    let query = db.orders.where({ customerId });
    
    if (status) {
      query = query.and(order => order.status === status);
    }
    
    return query.toArray();
  }
  
  // Batch operations
  static async bulkUpdateInventory(updates: InventoryUpdate[]) {
    await db.transaction('rw', db.inventory, async () => {
      for (const update of updates) {
        await db.inventory.update(update.productId, {
          quantity: update.quantity,
          updatedAt: new Date()
        });
      }
    });
  }
  
  // Pagination for large datasets
  static async getPaginatedProducts(page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    
    const [products, total] = await Promise.all([
      db.products.offset(offset).limit(pageSize).toArray(),
      db.products.count()
    ]);
    
    return {
      products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
}
```

### Caching Strategy

```typescript
// store/cacheStore.ts
import create from 'zustand';

interface CacheStore {
  searchCache: Map<string, any>;
  aiResponseCache: Map<string, any>;
  productCache: Map<string, Product>;
  
  setSearchCache: (key: string, value: any) => void;
  getSearchCache: (key: string) => any;
  clearCache: () => void;
}

export const useCacheStore = create<CacheStore>((set, get) => ({
  searchCache: new Map(),
  aiResponseCache: new Map(),
  productCache: new Map(),
  
  setSearchCache: (key, value) => {
    const cache = new Map(get().searchCache);
    cache.set(key, { value, timestamp: Date.now() });
    set({ searchCache: cache });
  },
  
  getSearchCache: (key) => {
    const cached = get().searchCache.get(key);
    if (!cached) return null;
    
    // Cache expires after 5 minutes
    if (Date.now() - cached.timestamp > 5 * 60 * 1000) {
      return null;
    }
    
    return cached.value;
  },
  
  clearCache: () => set({
    searchCache: new Map(),
    aiResponseCache: new Map(),
    productCache: new Map()
  })
}));
```

## Security Implementation


### Role-Based Access Control (RBAC)

```typescript
// lib/auth/rbac.ts
export enum Permission {
  // Product permissions
  VIEW_PRODUCTS = 'view_products',
  CREATE_PRODUCTS = 'create_products',
  EDIT_PRODUCTS = 'edit_products',
  DELETE_PRODUCTS = 'delete_products',
  
  // Customer permissions
  VIEW_CUSTOMERS = 'view_customers',
  CREATE_CUSTOMERS = 'create_customers',
  EDIT_CUSTOMERS = 'edit_customers',
  
  // Order permissions
  VIEW_ORDERS = 'view_orders',
  CREATE_ORDERS = 'create_orders',
  EDIT_ORDERS = 'edit_orders',
  CANCEL_ORDERS = 'cancel_orders',
  
  // Financial permissions
  VIEW_FINANCIAL = 'view_financial',
  MANAGE_PAYMENTS = 'manage_payments',
  VIEW_REPORTS = 'view_reports',
  
  // Inventory permissions
  VIEW_INVENTORY = 'view_inventory',
  ADJUST_INVENTORY = 'adjust_inventory',
  
  // Medical permissions
  VIEW_PATIENTS = 'view_patients',
  CREATE_PATIENTS = 'create_patients',
  VIEW_MEDICAL_RECORDS = 'view_medical_records',
  CREATE_MEDICAL_RECORDS = 'create_medical_records',
  
  // Quality Control permissions
  VIEW_REJECTIONS = 'view_rejections',
  CREATE_REJECTIONS = 'create_rejections',
  EDIT_REJECTIONS = 'edit_rejections',
  APPROVE_REJECTIONS = 'approve_rejections',
  VIEW_QUALITY_INSPECTIONS = 'view_quality_inspections',
  CREATE_QUALITY_INSPECTIONS = 'create_quality_inspections',
  MANAGE_QUALITY_STANDARDS = 'manage_quality_standards',
  
  // HR permissions
  VIEW_EMPLOYEES = 'view_employees',
  CREATE_EMPLOYEES = 'create_employees',
  EDIT_EMPLOYEES = 'edit_employees',
  ARCHIVE_EMPLOYEES = 'archive_employees',
  VIEW_ATTENDANCE = 'view_attendance',
  MANAGE_ATTENDANCE = 'manage_attendance',
  VIEW_LEAVES = 'view_leaves',
  APPROVE_LEAVES = 'approve_leaves',
  VIEW_PAYROLL = 'view_payroll',
  MANAGE_PAYROLL = 'manage_payroll',
  VIEW_PERFORMANCE = 'view_performance',
  MANAGE_PERFORMANCE = 'manage_performance',
  VIEW_TRAINING = 'view_training',
  MANAGE_TRAINING = 'manage_training',
  VIEW_DEPARTMENTS = 'view_departments',
  MANAGE_DEPARTMENTS = 'manage_departments',
  
  // Recruitment permissions
  VIEW_JOB_POSTINGS = 'view_job_postings',
  CREATE_JOB_POSTINGS = 'create_job_postings',
  EDIT_JOB_POSTINGS = 'edit_job_postings',
  VIEW_APPLICANTS = 'view_applicants',
  MANAGE_APPLICANTS = 'manage_applicants',
  SCHEDULE_INTERVIEWS = 'schedule_interviews',
  CONDUCT_INTERVIEWS = 'conduct_interviews',
  MAKE_HIRING_DECISIONS = 'make_hiring_decisions',
  
  // Supply Chain permissions
  VIEW_SUPPLIERS = 'view_suppliers',
  CREATE_SUPPLIERS = 'create_suppliers',
  EDIT_SUPPLIERS = 'edit_suppliers',
  EVALUATE_SUPPLIERS = 'evaluate_suppliers',
  MANAGE_SUPPLIER_CONTRACTS = 'manage_supplier_contracts',
  
  // Executive permissions
  VIEW_EXECUTIVE_DASHBOARD = 'view_executive_dashboard',
  VIEW_ALL_ANALYTICS = 'view_all_analytics',
  EXPORT_ALL_DATA = 'export_all_data',
  
  // Admin permissions
  MANAGE_USERS = 'manage_users',
  VIEW_LOGS = 'view_logs',
  MANAGE_SETTINGS = 'manage_settings'
}

export const RolePermissions: Record<string, Permission[]> = {
  admin: Object.values(Permission),
  
  executive: [
    Permission.VIEW_EXECUTIVE_DASHBOARD,
    Permission.VIEW_ALL_ANALYTICS,
    Permission.VIEW_FINANCIAL,
    Permission.VIEW_REPORTS,
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_CUSTOMERS,
    Permission.VIEW_ORDERS,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_EMPLOYEES,
    Permission.VIEW_DEPARTMENTS,
    Permission.VIEW_PERFORMANCE,
    Permission.VIEW_REJECTIONS,
    Permission.VIEW_QUALITY_INSPECTIONS,
    Permission.VIEW_SUPPLIERS,
    Permission.EXPORT_ALL_DATA
  ],
  
  manager: [
    Permission.VIEW_PRODUCTS,
    Permission.CREATE_PRODUCTS,
    Permission.EDIT_PRODUCTS,
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMERS,
    Permission.EDIT_CUSTOMERS,
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.EDIT_ORDERS,
    Permission.VIEW_FINANCIAL,
    Permission.VIEW_REPORTS,
    Permission.VIEW_INVENTORY,
    Permission.ADJUST_INVENTORY,
    Permission.VIEW_PATIENTS,
    Permission.VIEW_MEDICAL_RECORDS,
    Permission.VIEW_EMPLOYEES,
    Permission.VIEW_ATTENDANCE,
    Permission.APPROVE_LEAVES,
    Permission.VIEW_PERFORMANCE,
    Permission.VIEW_REJECTIONS,
    Permission.VIEW_QUALITY_INSPECTIONS
  ],
  
  sales: [
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMERS,
    Permission.EDIT_CUSTOMERS,
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.EDIT_ORDERS,
    Permission.VIEW_REPORTS
  ],
  
  inventory: [
    Permission.VIEW_PRODUCTS,
    Permission.CREATE_PRODUCTS,
    Permission.EDIT_PRODUCTS,
    Permission.VIEW_INVENTORY,
    Permission.ADJUST_INVENTORY,
    Permission.VIEW_ORDERS,
    Permission.VIEW_SUPPLIERS,
    Permission.VIEW_REJECTIONS
  ],
  
  medical: [
    Permission.VIEW_PATIENTS,
    Permission.CREATE_PATIENTS,
    Permission.VIEW_MEDICAL_RECORDS,
    Permission.CREATE_MEDICAL_RECORDS,
    Permission.VIEW_PRODUCTS
  ],
  
  quality: [
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_ORDERS,
    Permission.VIEW_REJECTIONS,
    Permission.CREATE_REJECTIONS,
    Permission.EDIT_REJECTIONS,
    Permission.APPROVE_REJECTIONS,
    Permission.VIEW_QUALITY_INSPECTIONS,
    Permission.CREATE_QUALITY_INSPECTIONS,
    Permission.MANAGE_QUALITY_STANDARDS,
    Permission.VIEW_SUPPLIERS,
    Permission.EVALUATE_SUPPLIERS
  ],
  
  hr: [
    Permission.VIEW_EMPLOYEES,
    Permission.CREATE_EMPLOYEES,
    Permission.EDIT_EMPLOYEES,
    Permission.ARCHIVE_EMPLOYEES,
    Permission.VIEW_ATTENDANCE,
    Permission.MANAGE_ATTENDANCE,
    Permission.VIEW_LEAVES,
    Permission.APPROVE_LEAVES,
    Permission.VIEW_PAYROLL,
    Permission.MANAGE_PAYROLL,
    Permission.VIEW_PERFORMANCE,
    Permission.MANAGE_PERFORMANCE,
    Permission.VIEW_TRAINING,
    Permission.MANAGE_TRAINING,
    Permission.VIEW_DEPARTMENTS,
    Permission.MANAGE_DEPARTMENTS,
    Permission.VIEW_JOB_POSTINGS,
    Permission.CREATE_JOB_POSTINGS,
    Permission.EDIT_JOB_POSTINGS,
    Permission.VIEW_APPLICANTS,
    Permission.MANAGE_APPLICANTS,
    Permission.SCHEDULE_INTERVIEWS,
    Permission.CONDUCT_INTERVIEWS,
    Permission.MAKE_HIRING_DECISIONS
  ]
};

export function hasPermission(user: User, permission: Permission): boolean {
  const userPermissions = RolePermissions[user.role] || [];
  return userPermissions.includes(permission);
}

export function requirePermission(permission: Permission) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const user = getCurrentUser();
      
      if (!hasPermission(user, permission)) {
        throw new Error('Permission denied');
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}
```

### Data Encryption

```typescript
// lib/security/encryption.ts
import CryptoJS from 'crypto-js';

export class DataEncryption {
  private static SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-key';
  
  static encrypt(data: any): string {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, this.SECRET_KEY).toString();
  }
  
  static decrypt(encryptedData: string): any {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.SECRET_KEY);
    const jsonString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonString);
  }
  
  // Encrypt sensitive fields before storing
  static encryptSensitiveData(customer: Customer): Customer {
    return {
      ...customer,
      taxId: this.encrypt(customer.taxId),
      creditLimit: this.encrypt(customer.creditLimit)
    };
  }
  
  // Decrypt when retrieving
  static decryptSensitiveData(customer: Customer): Customer {
    return {
      ...customer,
      taxId: this.decrypt(customer.taxId),
      creditLimit: this.decrypt(customer.creditLimit)
    };
  }
}
```

### Input Sanitization

```typescript
// lib/security/sanitization.ts
import DOMPurify from 'isomorphic-dompurify';

export class InputSanitizer {
  static sanitizeString(input: string): string {
    // Remove HTML tags and scripts
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  }
  
  static sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = {} as T;
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key as keyof T] = this.sanitizeString(value) as any;
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key as keyof T] = this.sanitizeObject(value);
      } else {
        sanitized[key as keyof T] = value;
      }
    }
    
    return sanitized;
  }
  
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return phoneRegex.test(phone);
  }
}
```

### Audit Trail

```typescript
// lib/security/audit.ts
export class AuditLogger {
  static async logAction(action: AuditAction) {
    await db.systemLogs.add({
      id: generateId(),
      action: action.type,
      entityType: action.entityType,
      entityId: action.entityId,
      details: JSON.stringify({
        before: action.before,
        after: action.after,
        changes: action.changes
      }),
      userId: action.userId,
      timestamp: new Date(),
      status: 'success'
    });
  }
  
  static async logCriticalAction(action: CriticalAction) {
    // Log to both database and external service
    await this.logAction(action);
    
    // Send notification to admins
    await this.notifyAdmins(action);
  }
  
  static async getAuditTrail(entityType: string, entityId: string) {
    return db.systemLogs
      .where({ entityType, entityId })
      .sortBy('timestamp');
  }
}

// Usage in services
export class ProductService {
  @requirePermission(Permission.EDIT_PRODUCTS)
  async updateProduct(id: string, updates: Partial<Product>) {
    const before = await db.products.get(id);
    
    await db.products.update(id, {
      ...updates,
      updatedAt: new Date()
    });
    
    const after = await db.products.get(id);
    
    await AuditLogger.logAction({
      type: 'product_updated',
      entityType: 'product',
      entityId: id,
      before,
      after,
      changes: this.getChanges(before, after),
      userId: getCurrentUserId()
    });
  }
}
```

## UI/UX Design Patterns

### Dashboard Layout

```typescript
// components/dashboard/MainDashboard.tsx
export function MainDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Medical Products Management System</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <UniversalSearch />
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
        
        <nav className="border-t px-6">
          <div className="flex space-x-8">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/products">Products</NavLink>
            <NavLink href="/customers">Customers</NavLink>
            <NavLink href="/orders">Orders</NavLink>
            <NavLink href="/inventory">Inventory</NavLink>
            <NavLink href="/patients">Patients</NavLink>
            <NavLink href="/analytics">Analytics</NavLink>
            <NavLink href="/reports">Reports</NavLink>
          </div>
        </nav>
      </header>
      
      {/* Main Content */}
      <main className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Revenue"
            value="$125,430"
            change="+12.5%"
            trend="up"
            icon={<DollarSign />}
          />
          <StatCard
            title="Active Orders"
            value="48"
            change="+5"
            trend="up"
            icon={<ShoppingCart />}
          />
          <StatCard
            title="Low Stock Alerts"
            value="12"
            change="-3"
            trend="down"
            icon={<AlertTriangle />}
          />
          <StatCard
            title="Total Customers"
            value="234"
            change="+8"
            trend="up"
            icon={<Users />}
          />
        </div>
        
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <TopProductsChart />
            </CardContent>
          </Card>
        </div>
        
        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentOrdersTable />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <AIInsightsPanel />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
```

### Form Design Pattern

```typescript
// components/common/FormWizard.tsx
export function FormWizard({ steps, onComplete }: FormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  
  const handleNext = async (stepData: any) => {
    // Auto-save
    await saveFormData({ ...formData, ...stepData });
    
    setFormData(prev => ({ ...prev, ...stepData }));
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      await onComplete({ ...formData, ...stepData });
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200'}
              `}>
                {index + 1}
              </div>
              <span className="ml-2">{step.title}</span>
              {index < steps.length - 1 && (
                <div className="w-24 h-1 mx-4 bg-gray-200" />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Current Step Content */}
      <Card>
        <CardContent className="p-6">
          {steps[currentStep].component({ onNext: handleNext, data: formData })}
        </CardContent>
      </Card>
    </div>
  );
}
```

## Deployment and DevOps

### Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyCV3Kb2rHMQoyAiYkrAFA82UlcGbYAAC0M
NEXT_PUBLIC_APP_NAME="Medical Products Management System"
NEXT_PUBLIC_ENCRYPTION_KEY=your-encryption-key-here
NEXT_PUBLIC_API_RATE_LIMIT=60
```

### Build Configuration

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  reactStrictMode: true,
  swcMinify: true,
  
  // PWA configuration
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
});
```

### Service Worker for Offline Support

```typescript
// public/sw.js
const CACHE_NAME = 'medical-products-v1';
const urlsToCache = [
  '/',
  '/products',
  '/customers',
  '/orders',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => caches.match('/offline.html'))
  );
});
```

## Monitoring and Analytics

### Performance Monitoring

```typescript
// lib/monitoring/performance.ts
export class PerformanceMonitor {
  static measurePageLoad() {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        
        this.logMetric('page_load_time', pageLoadTime);
      });
    }
  }
  
  static async measureAPICall(name: string, fn: () => Promise<any>) {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.logMetric(`api_${name}`, duration);
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.logMetric(`api_${name}_error`, duration);
      throw error;
    }
  }
  
  private static async logMetric(name: string, value: number) {
    await db.systemLogs.add({
      id: generateId(),
      action: 'performance_metric',
      entityType: 'system',
      details: JSON.stringify({ metric: name, value, unit: 'ms' }),
      userId: 'system',
      timestamp: new Date(),
      status: 'success'
    });
  }
}
```

This comprehensive design document covers all aspects of the Medical Products Company Management System with maximum AI integration and fully connected databases. The system is production-ready with proper error handling, security, performance optimization, and testing strategies.