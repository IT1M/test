# Implementation Plan

## Overview

This implementation plan breaks down the Medical Products Company Management System into discrete, actionable coding tasks. Each task builds incrementally on previous work, ensuring a systematic development approach. Tasks are organized by feature area and include references to specific requirements from the requirements document.

## Task List

- [x] 1. Project Setup and Core Infrastructure
  - Initialize Next.js 14 project with TypeScript, Tailwind CSS, and shadcn/ui
  - Install all required dependencies (@google/generative-ai, dexie, zustand, recharts, lucide-react, react-hot-toast, date-fns, xlsx)
  - Configure environment variables and create .env.local file with Gemini API key
  - Set up folder structure (/app, /components, /lib, /types, /hooks, /services, /store)
  - Configure TypeScript with strict mode and path aliases
  - Set up Tailwind CSS with custom theme configuration
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Database Schema and Core Types
  - [x] 2.1 Define TypeScript interfaces for all database entities
    - Create types/database.ts with interfaces for Product, Customer, Order, Inventory, Sale, Patient, MedicalRecord, Quotation, Invoice, Payment, StockMovement, PurchaseOrder, SearchHistory, SystemLog, and User
    - Define supporting types (OrderItem, Medication, Attachment, GeminiAnalysis, ExpiryBatch)
    - Add computed field types and enums for statuses
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_
  
  - [x] 2.2 Implement Dexie.js database schema
    - Create lib/db/schema.ts with MedicalProductsDB class extending Dexie
    - Define all database tables with appropriate indexes
    - Set up compound indexes for common query patterns
    - Export database instance
    - _Requirements: 2.1, 2.11_
  
  - [x] 2.3 Create database relationship manager
    - Implement lib/db/relationships.ts with RelationshipManager class
    - Add methods for cascade operations (onOrderCreated, onOrderCancelled, onPaymentRecorded, onProductPriceChanged, onLowStockDetected, onProductExpired)
    - Implement automatic inventory reservation and release
    - Add customer stats update logic
    - _Requirements: 2.12, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 21.8, 21.9, 21.10, 21.11, 21.12, 21.13, 21.14, 21.15_

- [x] 3. Gemini AI Service Foundation
  - [x] 3.1 Create base Gemini AI client
    - Implement services/gemini/client.ts with GeminiService class
    - Set up API client initialization with gemini-pro and gemini-pro-vision models
    - Implement rate limiting (60 requests per minute)
    - Add response caching with Map-based cache
    - Create API call logging to SystemLogs
    - Add error handling with retry logic
    - _Requirements: 3.9, 3.10, 3.11_
  
  - [x] 3.2 Implement demand forecasting service
    - Create services/gemini/forecasting.ts with ForecastingService class
    - Implement forecastDemand() method that analyzes historical sales and predicts future demand
    - Add detectTrendingProducts() method for identifying products with increasing demand
    - Calculate optimal reorder points and quantities
    - Implement seasonal pattern detection
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9, 17.10, 17.11_
  
  - [x] 3.3 Implement pricing optimization service
    - Create services/gemini/pricing.ts with PricingService class
    - Implement optimizePricing() method that recommends optimal prices
    - Add price elasticity calculation
    - Implement suggestBundles() for product bundle recommendations
    - Add dynamic pricing for slow-moving products
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9, 18.10, 18.11_
  
  - [x] 3.4 Implement business intelligence service
    - Create services/gemini/insights.ts with InsightsService class
    - Implement generateMorningBriefing() for daily business summaries
    - Add detectAnomalies() for identifying unusual patterns
    - Implement answerBusinessQuestion() for conversational AI queries
    - Add pattern recognition and opportunity identification
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8, 19.9, 19.10, 19.11_
  
  - [x] 3.5 Implement medical analysis service
    - Create services/gemini/medical.ts with MedicalAnalysisService class
    - Implement analyzeMedicalReport() for extracting structured data from medical reports
    - Add linkMedicalRecordsToProducts() to match medications with products
    - Implement predictProductDemandFromMedicalTrends() for demand prediction based on medical data
    - _Requirements: 3.1, 3.8, 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.9, 20.10, 20.11_
  
  - [x] 3.6 Implement OCR processing service
    - Create services/gemini/ocr.ts with OCRService class
    - Implement processDocument() for document type detection and data extraction
    - Add support for invoices, purchase orders, medical reports, prescriptions, lab results
    - Create extraction prompts for each document type
    - Implement file-to-base64 conversion
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11, 9.12, 9.13_


- [x] 4. Database Service Layer
  - [x] 4.1 Create product service
    - Implement services/database/products.ts with CRUD operations
    - Add getProducts(), getProductById(), createProduct(), updateProduct(), deleteProduct()
    - Implement searchProducts() with filters
    - Add getLowStockProducts() and getExpiringProducts()
    - Integrate with RelationshipManager for cascade operations
    - _Requirements: 5.1, 5.9, 5.11_
  
  - [x] 4.2 Create customer service
    - Implement services/database/customers.ts with CRUD operations
    - Add getCustomers(), getCustomerById(), createCustomer(), updateCustomer()
    - Implement customer segmentation logic (VIP, Regular, New, Inactive)
    - Add calculateLifetimeValue() method
    - Implement duplicate detection based on customer ID
    - _Requirements: 5.2, 5.9, 5.11_
  
  - [x] 4.3 Create order service
    - Implement services/database/orders.ts with CRUD operations
    - Add createOrder() with automatic inventory reservation
    - Implement updateOrderStatus() with workflow validation
    - Add cancelOrder() with inventory release
    - Implement order total calculations (subtotal, tax, discount, total)
    - _Requirements: 5.3, 5.4, 5.11, 13.1, 13.2, 13.3, 13.4_
  
  - [x] 4.4 Create inventory service
    - Implement services/database/inventory.ts with stock management
    - Add reserveInventory() and releaseInventory() methods
    - Implement adjustStock() for manual adjustments
    - Add getInventoryByProduct() and getInventoryByLocation()
    - Implement expiry batch tracking
    - _Requirements: 14.1, 14.2, 14.5, 14.6, 14.8, 14.10_
  
  - [x] 4.5 Create sales service
    - Implement services/database/sales.ts for sales tracking
    - Add recordSale() method that creates Sale record from Order
    - Implement profit calculation (totalAmount - costAmount)
    - Add getSalesByPeriod() and getSalesBySalesPerson()
    - Calculate sales commission
    - _Requirements: 13.11_
  
  - [x] 4.6 Create patient service
    - Implement services/database/patients.ts with CRUD operations
    - Add getPatients(), getPatientById(), createPatient(), updatePatient()
    - Implement duplicate detection based on national ID
    - Add linkPatientToCustomer() for healthcare facility associations
    - Calculate age from date of birth
    - _Requirements: 5.5, 5.9, 5.11_
  
  - [x] 4.7 Create medical records service
    - Implement services/database/medical-records.ts with CRUD operations
    - Add createMedicalRecord() with file attachment support
    - Implement getMedicalRecordsByPatient()
    - Add updateMedicalRecord() with version history
    - Link medical records to products mentioned
    - _Requirements: 5.6, 5.11_

- [-] 5. State Management with Zustand
  - [x] 5.1 Create authentication store
    - Implement store/authStore.ts with user session management
    - Add login(), logout(), and getCurrentUser() methods
    - Store user role and permissions
    - Implement session timeout (30 minutes)
    - _Requirements: 12.8, 12.15_
  
  - [x] 5.2 Create cache store
    - Implement store/cacheStore.ts for search and AI response caching
    - Add searchCache, aiResponseCache, and productCache Maps
    - Implement cache expiration (5 minutes)
    - Add clearCache() method
    - _Requirements: 3.10, 12.1_
  
  - [x] 5.3 Create notification store
    - Implement store/notificationStore.ts for real-time notifications
    - Add notification queue with priority levels
    - Implement addNotification(), removeNotification(), clearAll()
    - Add notification types (success, error, warning, info)
    - _Requirements: 4.10_
  
  - [x] 5.4 Create cart store (for order creation)
    - Implement store/cartStore.ts for order item management
    - Add addItem(), removeItem(), updateQuantity(), clearCart()
    - Calculate cart totals automatically
    - Persist cart to localStorage
    - _Requirements: 12.1_

- [x] 6. Utility Functions and Helpers
  - [x] 6.1 Create validation utilities
    - Implement lib/utils/validators.ts with input validation functions
    - Add validateEmail(), validatePhone(), validateSKU(), validatePrice()
    - Implement form validation schemas using Zod
    - Add business rule validators (credit limit, stock quantity, etc.)
    - _Requirements: 5.10, 12.13_
  
  - [x] 6.2 Create formatting utilities
    - Implement lib/utils/formatters.ts for data formatting
    - Add formatCurrency(), formatDate(), formatPhone(), formatPercentage()
    - Implement number formatting with locale support
    - Add relative date formatting (e.g., "2 days ago")
    - _Requirements: 11.1_
  
  - [x] 6.3 Create calculation utilities
    - Implement lib/utils/calculations.ts for business calculations
    - Add calculateOrderTotal(), calculateProfit(), calculateMargin()
    - Implement tax calculations
    - Add discount calculations (percentage and fixed amount)
    - _Requirements: 5.4, 16.3_
  
  - [x] 6.4 Create error handling utilities
    - Implement lib/utils/errorHandler.ts with ErrorHandler class
    - Add handle() method for centralized error handling
    - Implement getUserFriendlyMessage() for error translation
    - Add retry logic with exponential backoff
    - Create GlobalErrorBoundary component
    - _Requirements: 12.9, 12.10, 12.11_
  
  - [x] 6.5 Create security utilities
    - Implement lib/security/encryption.ts with DataEncryption class
    - Add encrypt() and decrypt() methods using CryptoJS
    - Implement lib/security/sanitization.ts with InputSanitizer class
    - Add sanitizeString() and sanitizeObject() methods
    - Implement lib/security/audit.ts with AuditLogger class
    - _Requirements: 12.5, 12.7, 12.14_
  
  - [x] 6.6 Create RBAC utilities
    - Implement lib/auth/rbac.ts with permission definitions
    - Define Permission enum with all system permissions
    - Create RolePermissions mapping for each role
    - Add hasPermission() and requirePermission() functions
    - _Requirements: 12.8_

- [x] 7. Reusable UI Components
  - [x] 7.1 Create base UI components from shadcn/ui
    - Install and configure shadcn/ui components (Button, Card, Input, Select, Table, Dialog, Tabs, Badge, Alert)
    - Customize theme colors and typography
    - Add dark mode support
    - _Requirements: 1.1, 11.1_
  
  - [x] 7.2 Create data table component
    - Implement components/common/DataTable.tsx with sorting, filtering, pagination
    - Add column configuration with custom renderers
    - Implement row selection and bulk actions
    - Add export to CSV/Excel functionality
    - _Requirements: 6.9_
  
  - [x] 7.3 Create virtual table component
    - Implement components/common/VirtualTable.tsx using @tanstack/react-virtual
    - Add virtual scrolling for large datasets (1000+ rows)
    - Implement dynamic row height calculation
    - _Requirements: 12.3_
  
  - [x] 7.4 Create stat card component
    - Implement components/dashboard/StatCard.tsx for metric display
    - Add value, change percentage, trend indicator (up/down)
    - Include icon support
    - Add loading skeleton state
    - _Requirements: 4.2_
  
  - [x] 7.5 Create chart components
    - Implement components/dashboard/RevenueChart.tsx using Recharts
    - Create TopProductsChart.tsx for bar chart visualization
    - Add InventoryStatusChart.tsx for stock level visualization
    - Implement responsive chart sizing
    - _Requirements: 4.3, 4.4, 10.2_
  
  - [x] 7.6 Create file uploader component
    - Implement components/upload/FileUploader.tsx with drag-and-drop
    - Add file type validation (PDF, JPG, PNG, DOCX, XLSX)
    - Show upload progress with progress bar
    - Display file preview thumbnails
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [x] 7.7 Create search component
    - Implement components/search/UniversalSearch.tsx with autocomplete
    - Add search history dropdown
    - Implement debounced search input
    - Add entity type filters
    - _Requirements: 4.4, 6.1, 6.2_
  
  - [x] 7.8 Create form wizard component
    - Implement components/common/FormWizard.tsx for multi-step forms
    - Add progress indicator with step numbers
    - Implement navigation (next, previous, skip)
    - Add auto-save functionality every 30 seconds
    - _Requirements: 5.7_


- [ ] 8. Main Dashboard Page
  - [ ] 8.1 Create dashboard layout
    - Implement app/layout.tsx with root layout, providers, and global styles
    - Add header with system name, navigation menu, and user profile dropdown
    - Implement responsive navigation with mobile menu
    - Add notification bell with real-time updates
    - _Requirements: 4.1_
  
  - [ ] 8.2 Implement dashboard statistics
    - Create app/page.tsx with main dashboard
    - Add statistics cards for total revenue, active orders, low stock alerts, total customers, total products, pending deliveries
    - Implement real-time data fetching from database
    - Add comparison with previous period
    - _Requirements: 4.2_
  
  - [ ] 8.3 Add dashboard charts
    - Implement revenue trend chart with daily/weekly/monthly views
    - Add top-selling products bar chart
    - Create inventory status overview with color-coded stock levels
    - Add period selector for all charts
    - _Requirements: 4.3, 4.4, 4.5_
  
  - [ ] 8.4 Create recent orders table
    - Implement recent orders table showing last 10 orders
    - Display order ID, customer name, amount, status, and quick actions
    - Add status badges with color coding
    - Implement click-to-view order details
    - _Requirements: 4.6_
  
  - [ ] 8.5 Add AI insights panel
    - Create AI insights card showing Gemini-generated recommendations
    - Display upcoming expiry alerts for products expiring within 90 days
    - Add low stock alerts with reorder recommendations
    - Implement real-time notifications for new orders and alerts
    - _Requirements: 4.7, 4.10_
  
  - [ ] 8.6 Implement quick actions
    - Add quick action buttons for creating new orders, adding products, registering customers, adding patients
    - Implement universal search bar with Gemini AI integration
    - Add keyboard shortcuts for common actions
    - _Requirements: 4.8, 4.9_

- [ ] 9. Product Management
  - [ ] 9.1 Create products list page
    - Implement app/products/page.tsx with product table
    - Add filters for category, stock status, manufacturer
    - Implement search functionality
    - Add sorting by name, price, stock quantity
    - Show stock status indicators (in-stock, low-stock, out-of-stock)
    - _Requirements: 5.1_
  
  - [ ] 9.2 Create product detail page
    - Implement app/products/[id]/page.tsx with product information
    - Display SKU, name, category, description, manufacturer, pricing, stock levels
    - Show warehouse location, expiry date, batch number, regulatory info
    - Add sales history chart
    - Implement inline editing with auto-save
    - _Requirements: 8.1, 8.6_
  
  - [ ] 9.3 Create product form
    - Implement app/products/new/page.tsx and components/products/ProductForm.tsx
    - Add fields for all product attributes
    - Implement validation for SKU uniqueness, pricing, stock quantity
    - Add image upload functionality
    - Implement Gemini AI suggestions for product categorization
    - _Requirements: 5.1, 5.8, 5.9, 5.10, 5.11_
  
  - [ ] 9.4 Add product AI features
    - Implement AI-powered pricing recommendations on product detail page
    - Add demand forecast visualization
    - Show similar products suggestions
    - Display profit margin analysis
    - _Requirements: 8.5, 18.1_

- [ ] 10. Customer Management
  - [ ] 10.1 Create customers list page
    - Implement app/customers/page.tsx with customer table
    - Add filters for customer type, segment, payment status
    - Implement search by name, email, phone
    - Show customer segment badges (VIP, Regular, New, Inactive)
    - Display lifetime value for each customer
    - _Requirements: 5.2_
  
  - [ ] 10.2 Create customer detail page
    - Implement app/customers/[id]/page.tsx with customer information
    - Display contact details, order history, total revenue contribution
    - Show payment history and outstanding balance
    - Add credit status indicator
    - Implement customer interaction timeline
    - _Requirements: 8.2, 15.3_
  
  - [ ] 10.3 Create customer form
    - Implement app/customers/new/page.tsx and components/customers/CustomerForm.tsx
    - Add fields for customer information, contact details, payment terms
    - Implement validation for email, phone, tax ID
    - Add duplicate detection based on customer ID
    - _Requirements: 5.2, 5.9, 5.10, 5.11_
  
  - [ ] 10.4 Add customer analytics
    - Implement customer lifetime value calculation and display
    - Add customer segmentation visualization
    - Show purchase patterns and frequently bought products
    - Display customer retention metrics
    - _Requirements: 15.1, 15.2, 15.5, 15.6_
  
  - [ ] 10.5 Implement customer communication
    - Create customer communication interface for emails and SMS
    - Add templates for order updates, payment reminders, promotions
    - Implement communication history tracking
    - _Requirements: 15.4_

- [ ] 11. Order Management
  - [ ] 11.1 Create orders list page
    - Implement app/orders/page.tsx with orders table
    - Add filters for status, payment status, date range, customer
    - Implement search by order ID, customer name
    - Show status badges and payment status indicators
    - Add bulk actions (export, print)
    - _Requirements: 5.3_
  
  - [ ] 11.2 Create order detail page
    - Implement app/orders/[id]/page.tsx with order information
    - Display order ID, customer info, ordered items with quantities and prices
    - Show order status timeline with timestamps
    - Add delivery information and tracking
    - Display payment status and invoice link
    - Implement print invoice functionality
    - _Requirements: 8.3_
  
  - [ ] 11.3 Create order form
    - Implement app/orders/new/page.tsx with order creation wizard
    - Add customer selection with search
    - Implement product selection with quantity input
    - Show real-time inventory availability
    - Calculate totals automatically (subtotal, discount, tax, total)
    - Add delivery date picker and payment terms selection
    - _Requirements: 5.3, 5.4, 5.11_
  
  - [ ] 11.4 Implement order workflow
    - Add order status update functionality (pending → confirmed → processing → shipped → delivered → completed)
    - Implement order cancellation with inventory release
    - Add delivery note generation when status changes to "shipped"
    - Automatically generate invoice when status changes to "delivered"
    - _Requirements: 13.4, 13.5_
  
  - [ ] 11.5 Add order AI features
    - Implement AI-powered product suggestions during order creation
    - Add cross-sell recommendations based on selected products
    - Show similar orders from the same customer
    - _Requirements: 18.5, 8.5_

- [ ] 12. Inventory Management
  - [ ] 12.1 Create inventory dashboard
    - Implement app/inventory/page.tsx with inventory overview
    - Display stock levels by product with color coding
    - Show products near expiry (within 90 days)
    - Add low stock alerts with reorder recommendations
    - Display inventory valuation using FIFO method
    - _Requirements: 14.7, 14.8_
  
  - [ ] 12.2 Create stock adjustment interface
    - Implement stock adjustment form for additions, removals, transfers, corrections
    - Add reason code selection
    - Implement batch number and expiry date tracking
    - Create stock movement history log
    - _Requirements: 14.1, 14.5_
  
  - [ ] 12.3 Create purchase order management
    - Implement app/inventory/purchase-orders/page.tsx for PO list
    - Add PO creation form with supplier selection and product items
    - Implement goods receipt interface for receiving POs
    - Update inventory quantities and record batch numbers on receipt
    - _Requirements: 14.3, 14.4_
  
  - [ ] 12.4 Implement stock take functionality
    - Create stock take interface for physical inventory counting
    - Add variance reporting (expected vs actual)
    - Implement adjustment creation from stock take results
    - _Requirements: 14.6_
  
  - [ ] 12.5 Add inventory AI features
    - Implement AI-powered reorder recommendations
    - Add demand forecast for each product
    - Show slow-moving product identification with clearance suggestions
    - Display optimal stock levels based on sales velocity
    - _Requirements: 17.6, 17.7, 17.9_

- [ ] 13. Sales and Financial Management
  - [ ] 13.1 Create quotations management
    - Implement quotation creation interface with customer and product selection
    - Add validity period and terms and conditions
    - Implement quotation status workflow (draft → sent → approved/rejected/expired)
    - Add convert-to-order functionality with one click
    - _Requirements: 13.1, 13.2, 13.3_
  
  - [ ] 13.2 Create invoices management
    - Implement app/sales/invoices/page.tsx with invoice list
    - Add automatic invoice generation from delivered orders
    - Display payment terms and due dates
    - Show payment status (unpaid, partially paid, paid, overdue)
    - Implement invoice printing and PDF export
    - _Requirements: 13.6_
  
  - [ ] 13.3 Create payment recording interface
    - Implement payment recording form with invoice selection
    - Add payment method, reference number, and date fields
    - Automatically update invoice and customer balance on payment
    - Send payment confirmation notifications
    - _Requirements: 13.9, 13.8_
  
  - [ ] 13.4 Create accounts receivable dashboard
    - Display accounts receivable aging report (0-30, 31-60, 61-90, 90+ days)
    - Show outstanding amounts by customer
    - Implement automated payment reminders for overdue invoices
    - Add customer statements generation
    - _Requirements: 13.10, 13.8, 15.9_
  
  - [ ] 13.5 Implement sales commission tracking
    - Calculate sales commission for each sales person based on completed orders
    - Display commission reports by period
    - _Requirements: 13.11_


- [ ] 14. Patient and Medical Records Management
  - [ ] 14.1 Create patients list page
    - Implement app/patients/page.tsx with patient table
    - Add filters for age range, gender, linked customer
    - Implement search by name, national ID, phone
    - Show patient age calculated from date of birth
    - Display linked healthcare facility if applicable
    - _Requirements: 5.5_
  
  - [ ] 14.2 Create patient profile page
    - Implement app/patients/[id]/page.tsx with patient information
    - Display patient header with basic info (name, ID, age, blood type)
    - Show medical history timeline
    - Add current conditions and active medications list
    - Display allergies alert box with prominent styling
    - _Requirements: 8.4_
  
  - [ ] 14.3 Create patient form
    - Implement app/patients/new/page.tsx with patient registration form
    - Add fields for personal information, medical history, allergies, chronic conditions
    - Implement duplicate detection based on national ID
    - Add option to link patient to customer (healthcare facility)
    - _Requirements: 5.5, 5.9, 5.11_
  
  - [ ] 14.4 Create medical records management
    - Implement app/medical-records/page.tsx with records list
    - Add filters for record type, date range, patient, doctor
    - Implement search functionality
    - Show record type badges
    - _Requirements: 5.6_
  
  - [ ] 14.5 Create medical record detail page
    - Implement app/medical-records/[id]/page.tsx with record information
    - Display record type, title, content, diagnosis, medications
    - Show doctor name, hospital name, visit date
    - Add document attachments viewer
    - Display Gemini AI analysis results
    - Show linked products mentioned in the record
    - _Requirements: 8.4_
  
  - [ ] 14.6 Create medical record form
    - Implement medical record creation form with patient selection
    - Add fields for record type, title, content, diagnosis, medications
    - Implement file upload for medical documents
    - Add OCR processing for uploaded documents
    - Automatically extract and populate fields from OCR results
    - _Requirements: 5.6, 9.4, 9.5, 9.6, 9.7_
  
  - [ ] 14.7 Add medical AI features
    - Implement Gemini-generated health summary on patient profile
    - Add risk assessment based on medical history
    - Show medication interaction warnings
    - Display recommended follow-ups
    - Link medical records to relevant products automatically
    - _Requirements: 8.5, 20.1, 20.2, 20.3, 20.4, 20.10_

- [ ] 15. Universal Search and AI Features
  - [ ] 15.1 Create universal search page
    - Implement app/search/page.tsx with natural language search interface
    - Add large search input with placeholder examples
    - Implement entity type filters (all, products, customers, orders, patients)
    - Add advanced filters panel (collapsible) for date range, price range, status, category
    - _Requirements: 6.1, 6.2_
  
  - [ ] 15.2 Implement AI-powered search
    - Integrate Gemini Service for natural language query processing
    - Implement search across all entities (products, customers, orders, patients, medical records)
    - Display results grouped by entity type with match confidence scores
    - Add "similar cases" suggestions using AI
    - _Requirements: 6.3, 6.4, 6.6_
  
  - [ ] 15.3 Add search history and saved searches
    - Save all search queries to SearchHistory table
    - Display search history dropdown with recent searches
    - Implement saved searches with custom names
    - Add search analytics showing most searched terms
    - _Requirements: 6.7, 6.8, 6.10_
  
  - [ ] 15.4 Implement search results export
    - Add export functionality for search results (CSV, Excel, PDF)
    - Implement bulk actions on search results
    - _Requirements: 6.9_
  
  - [ ] 15.5 Create AI insights components
    - Implement components/ai/AIInsights.tsx for displaying AI-generated insights
    - Create components/ai/DemandForecast.tsx for demand predictions
    - Add components/ai/PricingRecommendations.tsx for pricing suggestions
    - Implement conversational AI interface for business questions
    - _Requirements: 19.9_

- [ ] 16. Analytics and Reports
  - [ ] 16.1 Create analytics dashboard
    - Implement app/analytics/page.tsx with comprehensive analytics overview
    - Add key metrics cards with period selector (daily, weekly, monthly, quarterly, yearly)
    - Display comparison with previous period
    - _Requirements: 10.1_
  
  - [ ] 16.2 Create financial analytics
    - Implement app/analytics/financial/page.tsx with financial dashboard
    - Display revenue, gross profit, net profit, profit margin percentage
    - Add revenue breakdown by product category, customer type, sales person
    - Show cost analysis (COGS, operating expenses, cost per order)
    - Display KPIs (inventory turnover, DSO, order fulfillment rate, customer acquisition cost)
    - Add cash flow projection for 30, 60, 90 days
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_
  
  - [ ] 16.3 Create sales analytics
    - Implement app/analytics/sales/page.tsx with sales performance dashboard
    - Display top-selling products with sales volume and revenue
    - Show revenue by customer and sales person
    - Add sales pipeline visualization (quotations, pending orders, expected revenue)
    - Display sales trends with seasonal patterns
    - _Requirements: 10.3, 16.9_
  
  - [ ] 16.4 Create inventory analytics
    - Implement app/analytics/inventory/page.tsx with inventory dashboard
    - Display stock levels and inventory valuation
    - Show products near expiry with alert severity levels
    - Add slow-moving products identification
    - Display stock turnover rate
    - _Requirements: 10.4, 14.8, 14.9_
  
  - [ ] 16.5 Create customer analytics
    - Display customer acquisition trends and retention rate
    - Show top customers by revenue
    - Add customer payment behavior patterns
    - Display customer geographic distribution on map
    - _Requirements: 10.6, 15.6, 15.11_
  
  - [ ] 16.6 Create medical analytics
    - Display patient demographics (age, gender distribution)
    - Show common diagnoses and medication usage statistics
    - Add visit frequency patterns
    - _Requirements: 10.7_
  
  - [ ] 16.7 Implement interactive charts
    - Create all chart components using Recharts library
    - Implement responsive chart sizing
    - Add tooltips with detailed information
    - Enable drill-down functionality for detailed views
    - _Requirements: 10.2_
  
  - [ ] 16.8 Add AI-powered analytics insights
    - Implement Gemini-generated summaries for all analytics dashboards
    - Add anomaly detection with explanations
    - Show predictive analytics and forecasts
    - Display business optimization recommendations
    - _Requirements: 10.10, 16.10_

- [ ] 17. Reports Management
  - [ ] 17.1 Create reports hub
    - Implement app/reports/page.tsx with reports overview
    - Display predefined reports list with descriptions
    - Add recently generated reports
    - Show scheduled reports
    - _Requirements: 10.8_
  
  - [ ] 17.2 Implement predefined reports
    - Create monthly sales report with revenue, orders, top products
    - Add inventory valuation report with FIFO calculations
    - Implement customer purchase history report
    - Create profit and loss statement
    - Add medical records summary report
    - _Requirements: 10.9_
  
  - [ ] 17.3 Create custom report builder
    - Implement app/reports/builder/page.tsx with drag-and-drop interface
    - Add data field selection from all entities
    - Implement filters, grouping, and sorting
    - Add preview functionality
    - _Requirements: 10.8_
  
  - [ ] 17.4 Implement report export
    - Add export functionality for all reports (PDF, Excel, CSV)
    - Implement print-friendly formatting
    - Add company branding to exported reports
    - _Requirements: 10.11, 16.11_
  
  - [ ] 17.5 Add scheduled reports
    - Implement scheduled report generation (daily, weekly, monthly)
    - Add email delivery options
    - Store generated reports for later access
    - _Requirements: 10.12_

- [ ] 18. Admin Dashboard and System Management
  - [ ] 18.1 Create admin dashboard
    - Implement app/admin/page.tsx with system overview
    - Display real-time system status (API health, database size, active users, uptime)
    - Show business analytics (total revenue, profit margins, sales trends)
    - Add performance metrics
    - Require password authentication to access
    - _Requirements: 7.1, 7.3, 7.10_
  
  - [ ] 18.2 Create system logs viewer
    - Implement filterable logs table with all SystemLogs entries
    - Add filters for log level (info, warning, error, critical), action, entity type, user
    - Implement search within logs
    - Add export logs functionality
    - Display logs in real-time with polling every 30 seconds
    - _Requirements: 7.2, 7.11_
  
  - [ ] 18.3 Create Gemini API analytics
    - Display API calls counter (daily, weekly, monthly)
    - Show token usage statistics
    - Add response time graphs
    - Display error rate monitoring
    - Implement cost estimation based on usage
    - _Requirements: 7.5_
  
  - [ ] 18.4 Add data operations monitor
    - Display all CRUD operations log
    - Show data entry statistics for products, customers, orders, patients
    - Add file uploads tracker
    - _Requirements: 7.4_
  
  - [ ] 18.5 Implement debug tools
    - Add clear cache button
    - Implement reset database functionality with confirmation
    - Add test Gemini connection button
    - Create generate sample data function for testing
    - Add export all data option
    - _Requirements: 7.6, 7.9_
  
  - [ ] 18.6 Create user management
    - Implement app/admin/users/page.tsx with user list
    - Add user creation form with role selection (admin, manager, sales, inventory, medical)
    - Implement permission assignment interface
    - Add user activation/deactivation
    - Display last login and activity tracking
    - _Requirements: 11.4_


- [ ] 19. Settings and Configuration
  - [ ] 19.1 Create settings page
    - Implement app/settings/page.tsx with tabbed interface
    - Add tabs for general, API, data, users, business, notifications, customization
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_
  
  - [ ] 19.2 Implement general settings
    - Add theme selection (light, dark, auto)
    - Implement date format settings
    - Add notification preferences
    - _Requirements: 11.1_
  
  - [ ] 19.3 Implement Gemini API settings
    - Add API key management with masked display
    - Implement model selection (gemini-pro, gemini-pro-vision)
    - Add rate limiting configuration
    - Display current API usage and limits
    - _Requirements: 11.2_
  
  - [ ] 19.4 Implement data management settings
    - Add auto-save interval configuration
    - Implement backup schedule settings
    - Add data retention policies configuration
    - Create export all data functionality
    - Add import data from Excel/CSV
    - _Requirements: 11.3_
  
  - [ ] 19.5 Implement business settings
    - Add company branding (name, logo upload, color scheme, contact info)
    - Implement tax rates configuration
    - Add currency selection
    - Create payment terms templates
    - Add invoice numbering format configuration
    - _Requirements: 11.5, 11.6_
  
  - [ ] 19.6 Implement inventory settings
    - Add low stock threshold configuration
    - Implement expiry alert period setting (days before expiry)
    - Add automatic reorder rules configuration
    - _Requirements: 11.7_
  
  - [ ] 19.7 Implement notification settings
    - Add email notification toggles for low stock, order status changes, payment reminders, expiry alerts
    - Implement notification templates customization
    - _Requirements: 11.8_
  
  - [ ] 19.8 Implement custom fields
    - Add custom fields configuration for products, customers, orders, medical records
    - Implement field type selection (text, number, date, dropdown)
    - Add validation rules for custom fields
    - _Requirements: 11.9_
  
  - [ ] 19.9 Implement report templates
    - Add report templates customization for invoices, purchase orders, delivery notes, medical reports
    - Implement template editor with placeholders
    - _Requirements: 11.10_
  
  - [ ] 19.10 Add settings validation and logging
    - Implement validation for all settings changes
    - Add confirmation dialogs for critical changes
    - Log all settings modifications to SystemLogs
    - _Requirements: 11.11, 11.12_

- [ ] 20. Document Processing and OCR
  - [ ] 20.1 Create file upload interface
    - Implement components/upload/FileUploader.tsx with drag-and-drop zone
    - Add file type validation (PDF, JPG, PNG, DOCX, XLSX)
    - Display upload progress indicators
    - Show file preview thumbnails
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ] 20.2 Implement OCR processing
    - Integrate Gemini Vision API for document OCR
    - Implement document type detection (invoice, purchase order, medical report, prescription, lab result, delivery note)
    - Extract structured data based on document type
    - Display confidence scores for extracted data
    - _Requirements: 9.4, 9.5, 9.6, 9.7, 9.8_
  
  - [ ] 20.3 Create OCR results interface
    - Implement components/upload/OCRProcessor.tsx for displaying OCR results
    - Add text correction interface for manual override
    - Show extracted entities with highlighting
    - Display full extracted text
    - _Requirements: 9.9_
  
  - [ ] 20.4 Implement document auto-categorization
    - Automatically categorize documents based on type
    - Tag documents with relevant business or medical terms
    - _Requirements: 9.10_
  
  - [ ] 20.5 Add document-to-entity linking
    - Suggest creating or updating orders from invoice OCR
    - Link medical documents to patient records
    - Associate purchase orders with inventory
    - _Requirements: 9.11_
  
  - [ ] 20.6 Implement batch processing
    - Add queue system for multiple file uploads
    - Implement background processing with progress notifications
    - Display batch processing status
    - _Requirements: 9.12_
  
  - [ ] 20.7 Save processed documents
    - Store all processed documents and extracted text to IndexedDB
    - Link documents to appropriate entities (orders, patients, products)
    - Maintain document version history
    - _Requirements: 9.13_

- [ ] 21. Performance Optimization
  - [ ] 21.1 Implement lazy loading
    - Add dynamic imports for heavy components (analytics dashboards, report builder)
    - Implement route-based code splitting
    - Add loading skeletons for all lazy-loaded components
    - _Requirements: 12.2_
  
  - [ ] 21.2 Implement virtual scrolling
    - Add virtual scrolling to all large lists (products, customers, orders)
    - Use @tanstack/react-virtual for efficient rendering
    - Implement dynamic row height calculation
    - _Requirements: 12.3_
  
  - [ ] 21.3 Implement caching strategies
    - Add search result caching with 5-minute expiration
    - Implement AI response caching to minimize API calls
    - Cache frequently accessed products and customers
    - _Requirements: 3.10, 12.1_
  
  - [ ] 21.4 Optimize database queries
    - Implement compound indexes for common query patterns
    - Add batch operations for bulk updates
    - Implement pagination for large datasets
    - Use transactions for multi-table operations
    - _Requirements: 2.11_
  
  - [ ] 21.5 Add performance monitoring
    - Implement page load time measurement
    - Add API call duration tracking
    - Log performance metrics to SystemLogs
    - Create performance dashboard in admin panel
    - _Requirements: 22.1, 22.4_

- [ ] 22. Security Implementation
  - [ ] 22.1 Implement authentication
    - Create login page with username/password
    - Implement session management with Zustand
    - Add automatic session timeout after 30 minutes
    - Store user role and permissions
    - _Requirements: 12.8, 12.15_
  
  - [ ] 22.2 Implement RBAC
    - Apply permission checks to all routes and actions
    - Use requirePermission decorator for service methods
    - Hide UI elements based on user permissions
    - Display permission denied messages
    - _Requirements: 12.8_
  
  - [ ] 22.3 Implement data encryption
    - Encrypt sensitive customer data (tax ID, credit limit) before storing
    - Decrypt data when retrieving from database
    - Use CryptoJS for encryption/decryption
    - _Requirements: 12.7_
  
  - [ ] 22.4 Implement input sanitization
    - Sanitize all user inputs to prevent XSS attacks
    - Use DOMPurify for HTML sanitization
    - Validate all form inputs on both client and server side
    - _Requirements: 12.5, 12.13_
  
  - [ ] 22.5 Implement audit trail
    - Log all critical operations (order creation, price changes, customer data modifications)
    - Store before/after values for all updates
    - Display audit trail on entity detail pages
    - _Requirements: 12.14_
  
  - [ ] 22.6 Add rate limiting
    - Implement rate limiting for Gemini API calls (60 per minute)
    - Add request queuing for API calls
    - Display rate limit status to users
    - _Requirements: 3.9, 12.6_

- [ ] 23. Offline Support and PWA
  - [ ] 23.1 Configure PWA
    - Create manifest.json with app metadata
    - Add app icons for different sizes
    - Configure installability settings
    - _Requirements: 12.12_
  
  - [ ] 23.2 Implement service worker
    - Create service worker for offline functionality
    - Cache static assets and pages
    - Implement offline fallback page
    - Add background sync for pending operations
    - _Requirements: 12.4, 12.12_
  
  - [ ] 23.3 Add push notifications
    - Implement push notification support for business alerts
    - Add notification permission request
    - Create notification templates for different event types
    - _Requirements: 12.12_
  
  - [ ] 23.4 Implement background sync
    - Queue operations when offline
    - Sync data when connection is restored
    - Display sync status to users
    - _Requirements: 12.4_

- [ ] 24. Data Backup and Recovery
  - [ ] 24.1 Implement data backup
    - Create backup functionality that exports all database tables
    - Add scheduled automatic backups
    - Store backups with timestamps
    - Implement backup to file download
    - _Requirements: 11.3, 12.16_
  
  - [ ] 24.2 Implement data restore
    - Create restore functionality from backup file
    - Add validation for backup file format
    - Implement confirmation dialog before restore
    - Display restore progress
    - _Requirements: 12.16_
  
  - [ ] 24.3 Add data import/export
    - Implement Excel/CSV import for products, customers, patients
    - Add data validation during import
    - Create export functionality for all entities
    - Support bulk operations via import
    - _Requirements: 11.3_

- [ ] 25. AI-Powered System Optimization
  - [ ] 25.1 Implement predictive maintenance
    - Use Gemini to analyze system performance metrics
    - Predict database size growth and alert before limits
    - Detect slow queries and suggest optimizations
    - Analyze error logs for recurring issues
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.6_
  
  - [ ] 25.2 Implement data quality monitoring
    - Detect data inconsistencies and duplicates
    - Identify missing relationships
    - Suggest data cleanup actions
    - _Requirements: 22.7, 22.8_
  
  - [ ] 25.3 Add usage analytics
    - Analyze user behavior patterns
    - Suggest UI/UX improvements based on usage
    - Predict system load and recommend scaling
    - _Requirements: 22.5, 22.9_
  
  - [ ] 25.4 Implement automated health reports
    - Generate daily system health reports
    - Include proactive maintenance recommendations
    - Display in admin dashboard
    - _Requirements: 22.11_

- [ ] 26. Testing and Quality Assurance
  - [ ]* 26.1 Write unit tests for services
    - Create tests for all database services (products, customers, orders, inventory, sales, patients, medical records)
    - Test Gemini AI services (forecasting, pricing, insights, medical, OCR)
    - Test utility functions (validators, formatters, calculations)
    - Achieve 80%+ code coverage
  
  - [ ]* 26.2 Write integration tests
    - Test complete order lifecycle (create → deliver → invoice → payment)
    - Test inventory reservation and release flow
    - Test customer segmentation and lifetime value calculation
    - Test medical record creation with OCR processing
  
  - [ ]* 26.3 Write E2E tests
    - Test user authentication and authorization
    - Test complete business workflows (order creation, product management, customer management)
    - Test search functionality across all entities
    - Test report generation and export
  
  - [ ]* 26.4 Perform manual testing
    - Test all UI components for responsiveness
    - Verify dark mode functionality
    - Test offline functionality and sync
    - Verify all AI features work correctly
    - Test data import/export functionality

- [ ] 27. Documentation and Deployment
  - [ ]* 27.1 Create user documentation
    - Write user guide covering all features
    - Create video tutorials for common workflows
    - Add in-app help tooltips
    - Create FAQ section
  
  - [ ]* 27.2 Create developer documentation
    - Document API endpoints and services
    - Add code comments for complex logic
    - Create architecture diagrams
    - Document deployment process
  
  - [ ] 27.3 Prepare for deployment
    - Configure production environment variables
    - Optimize build for production
    - Set up error tracking (Sentry or similar)
    - Configure analytics (Google Analytics or similar)
  
  - [ ] 27.4 Deploy application
    - Deploy to Vercel or similar platform
    - Configure custom domain
    - Set up SSL certificate
    - Test production deployment
  
  - [ ]* 27.5 Create deployment guide
    - Document deployment steps
    - Add troubleshooting section
    - Include backup and recovery procedures
    - Document scaling considerations

## Notes

- Tasks marked with `*` are optional and focus on testing and documentation
- All other tasks are required for core functionality
- Each task should be completed and tested before moving to the next
- Refer to the requirements document for detailed acceptance criteria
- Refer to the design document for implementation details and code examples