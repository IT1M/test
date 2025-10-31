// Application Constants

export const APP_NAME = "Medical Products Management System";
export const APP_VERSION = "1.0.0";

// API Configuration
export const GEMINI_API_RATE_LIMIT = 60; // requests per minute
export const GEMINI_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Auto-save Configuration
export const AUTO_SAVE_INTERVAL = 30 * 1000; // 30 seconds in milliseconds

// Session Configuration
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

// Inventory Configuration
export const DEFAULT_LOW_STOCK_THRESHOLD = 10;
export const DEFAULT_EXPIRY_ALERT_DAYS = 90;

// Pagination
export const DEFAULT_PAGE_SIZE = 50;
export const VIRTUAL_SCROLL_THRESHOLD = 1000;

// Product Categories
export const PRODUCT_CATEGORIES = [
  'Medical Equipment',
  'Pharmaceuticals',
  'Medical Supplies',
  'Diagnostic Equipment',
  'Surgical Instruments',
  'Personal Protective Equipment',
  'Laboratory Equipment',
  'Other'
] as const;

// Customer Types
export const CUSTOMER_TYPES = [
  'hospital',
  'clinic',
  'pharmacy',
  'distributor'
] as const;

// Order Statuses
export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'completed',
  'cancelled'
] as const;

// Payment Statuses
export const PAYMENT_STATUSES = [
  'unpaid',
  'partially-paid',
  'paid',
  'overdue'
] as const;

// User Roles
export const USER_ROLES = [
  'admin',
  'manager',
  'sales',
  'inventory',
  'medical'
] as const;

// Medical Record Types
export const MEDICAL_RECORD_TYPES = [
  'consultation',
  'lab-result',
  'prescription',
  'imaging',
  'surgery',
  'other'
] as const;

// Document Types
export const DOCUMENT_TYPES = [
  'invoice',
  'purchase-order',
  'medical-report',
  'prescription',
  'lab-result',
  'delivery-note'
] as const;

// Supported File Types
export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
] as const;

export const SUPPORTED_FILE_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.docx',
  '.xlsx'
] as const;
