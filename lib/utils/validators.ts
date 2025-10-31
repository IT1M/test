import { z } from 'zod';

// ============================================================================
// Basic Validation Functions
// ============================================================================

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number format (supports international formats)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates SKU format (alphanumeric with hyphens)
 */
export function validateSKU(sku: string): boolean {
  const skuRegex = /^[A-Z0-9\-]{3,20}$/;
  return skuRegex.test(sku.toUpperCase());
}

/**
 * Validates price (must be positive number with max 2 decimal places)
 */
export function validatePrice(price: number): boolean {
  if (price < 0) return false;
  const decimalPlaces = (price.toString().split('.')[1] || '').length;
  return decimalPlaces <= 2;
}

/**
 * Validates national ID format
 */
export function validateNationalId(id: string): boolean {
  const nationalIdRegex = /^[A-Z0-9]{5,20}$/;
  return nationalIdRegex.test(id.toUpperCase());
}

/**
 * Validates tax ID format
 */
export function validateTaxId(taxId: string): boolean {
  const taxIdRegex = /^[A-Z0-9\-]{5,20}$/;
  return taxIdRegex.test(taxId.toUpperCase());
}

// ============================================================================
// Business Rule Validators
// ============================================================================

/**
 * Validates credit limit (must be positive and within reasonable range)
 */
export function validateCreditLimit(limit: number): { valid: boolean; error?: string } {
  if (limit < 0) {
    return { valid: false, error: 'Credit limit cannot be negative' };
  }
  if (limit > 10000000) {
    return { valid: false, error: 'Credit limit exceeds maximum allowed value' };
  }
  return { valid: true };
}

/**
 * Validates stock quantity (must be non-negative integer)
 */
export function validateStockQuantity(quantity: number): { valid: boolean; error?: string } {
  if (quantity < 0) {
    return { valid: false, error: 'Stock quantity cannot be negative' };
  }
  if (!Number.isInteger(quantity)) {
    return { valid: false, error: 'Stock quantity must be a whole number' };
  }
  return { valid: true };
}

/**
 * Validates reorder level against stock quantity
 */
export function validateReorderLevel(
  reorderLevel: number,
  stockQuantity: number
): { valid: boolean; error?: string } {
  if (reorderLevel < 0) {
    return { valid: false, error: 'Reorder level cannot be negative' };
  }
  if (reorderLevel > stockQuantity * 2) {
    return { valid: false, error: 'Reorder level seems unusually high compared to current stock' };
  }
  return { valid: true };
}

/**
 * Validates discount (percentage or fixed amount)
 */
export function validateDiscount(
  discount: number,
  type: 'percentage' | 'fixed',
  totalAmount?: number
): { valid: boolean; error?: string } {
  if (discount < 0) {
    return { valid: false, error: 'Discount cannot be negative' };
  }
  
  if (type === 'percentage' && discount > 100) {
    return { valid: false, error: 'Discount percentage cannot exceed 100%' };
  }
  
  if (type === 'fixed' && totalAmount && discount > totalAmount) {
    return { valid: false, error: 'Discount amount cannot exceed total amount' };
  }
  
  return { valid: true };
}

/**
 * Validates expiry date (must be in the future)
 */
export function validateExpiryDate(expiryDate: Date): { valid: boolean; error?: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (expiryDate < today) {
    return { valid: false, error: 'Expiry date cannot be in the past' };
  }
  
  return { valid: true };
}

/**
 * Validates payment terms format
 */
export function validatePaymentTerms(terms: string): boolean {
  const validTerms = ['Net 15', 'Net 30', 'Net 60', 'Net 90', 'COD', 'Prepaid'];
  return validTerms.includes(terms);
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

/**
 * Product validation schema
 */
export const productSchema = z.object({
  sku: z.string()
    .min(3, 'SKU must be at least 3 characters')
    .max(20, 'SKU must not exceed 20 characters')
    .regex(/^[A-Z0-9\-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens'),
  name: z.string()
    .min(2, 'Product name must be at least 2 characters')
    .max(200, 'Product name must not exceed 200 characters'),
  category: z.string()
    .min(2, 'Category is required'),
  description: z.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  manufacturer: z.string()
    .min(2, 'Manufacturer name is required'),
  unitPrice: z.number()
    .positive('Unit price must be positive')
    .max(1000000, 'Unit price exceeds maximum allowed value'),
  costPrice: z.number()
    .positive('Cost price must be positive')
    .max(1000000, 'Cost price exceeds maximum allowed value'),
  stockQuantity: z.number()
    .int('Stock quantity must be a whole number')
    .nonnegative('Stock quantity cannot be negative'),
  reorderLevel: z.number()
    .int('Reorder level must be a whole number')
    .nonnegative('Reorder level cannot be negative'),
  expiryDate: z.date().optional(),
  batchNumber: z.string().optional(),
  regulatoryInfo: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
}).refine(
  (data) => data.unitPrice > data.costPrice,
  {
    message: 'Unit price must be greater than cost price',
    path: ['unitPrice'],
  }
);

/**
 * Customer validation schema
 */
export const customerSchema = z.object({
  customerId: z.string()
    .min(3, 'Customer ID must be at least 3 characters')
    .max(20, 'Customer ID must not exceed 20 characters'),
  name: z.string()
    .min(2, 'Customer name must be at least 2 characters')
    .max(200, 'Customer name must not exceed 200 characters'),
  type: z.enum(['hospital', 'clinic', 'pharmacy', 'distributor'], {
    message: 'Invalid customer type',
  }),
  contactPerson: z.string()
    .min(2, 'Contact person name is required'),
  phone: z.string()
    .regex(/^\+?[\d\s\-()]{10,}$/, 'Invalid phone number format'),
  email: z.string()
    .email('Invalid email address'),
  address: z.string()
    .min(5, 'Address must be at least 5 characters'),
  city: z.string()
    .min(2, 'City is required'),
  country: z.string()
    .min(2, 'Country is required'),
  taxId: z.string()
    .regex(/^[A-Z0-9\-]{5,20}$/, 'Invalid tax ID format'),
  creditLimit: z.number()
    .nonnegative('Credit limit cannot be negative')
    .max(10000000, 'Credit limit exceeds maximum allowed value'),
  paymentTerms: z.string()
    .min(3, 'Payment terms are required'),
});

/**
 * Order validation schema
 */
export const orderSchema = z.object({
  customerId: z.string()
    .min(1, 'Customer is required'),
  orderDate: z.date(),
  deliveryDate: z.date().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product is required'),
      productName: z.string(),
      sku: z.string(),
      quantity: z.number()
        .int('Quantity must be a whole number')
        .positive('Quantity must be positive'),
      unitPrice: z.number()
        .positive('Unit price must be positive'),
      discount: z.number()
        .nonnegative('Discount cannot be negative')
        .default(0),
      total: z.number(),
    })
  ).min(1, 'Order must contain at least one item'),
  discount: z.number()
    .nonnegative('Discount cannot be negative')
    .default(0),
  tax: z.number()
    .nonnegative('Tax cannot be negative')
    .default(0),
  salesPerson: z.string()
    .min(2, 'Sales person is required'),
  notes: z.string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional(),
}).refine(
  (data) => !data.deliveryDate || data.deliveryDate >= data.orderDate,
  {
    message: 'Delivery date cannot be before order date',
    path: ['deliveryDate'],
  }
);

/**
 * Patient validation schema
 */
export const patientSchema = z.object({
  nationalId: z.string()
    .regex(/^[A-Z0-9]{5,20}$/, 'Invalid national ID format'),
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(100, 'First name must not exceed 100 characters'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(100, 'Last name must not exceed 100 characters'),
  dateOfBirth: z.date()
    .max(new Date(), 'Date of birth cannot be in the future'),
  gender: z.enum(['male', 'female', 'other'], {
    message: 'Invalid gender',
  }),
  phone: z.string()
    .regex(/^\+?[\d\s\-()]{10,}$/, 'Invalid phone number format'),
  email: z.string()
    .email('Invalid email address')
    .optional(),
  address: z.string()
    .min(5, 'Address must be at least 5 characters'),
  bloodType: z.string()
    .regex(/^(A|B|AB|O)[+-]$/, 'Invalid blood type format')
    .optional(),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  linkedCustomerId: z.string().optional(),
});

/**
 * Medical Record validation schema
 */
export const medicalRecordSchema = z.object({
  patientId: z.string()
    .min(1, 'Patient is required'),
  recordType: z.enum(['consultation', 'lab-result', 'prescription', 'imaging', 'surgery', 'other'], {
    message: 'Invalid record type',
  }),
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters'),
  content: z.string()
    .min(10, 'Content must be at least 10 characters'),
  diagnosis: z.string().optional(),
  medications: z.array(
    z.object({
      name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      duration: z.string(),
    })
  ).optional(),
  doctorName: z.string().optional(),
  hospitalName: z.string().optional(),
  visitDate: z.date(),
});

/**
 * Invoice validation schema
 */
export const invoiceSchema = z.object({
  orderId: z.string()
    .min(1, 'Order is required'),
  customerId: z.string()
    .min(1, 'Customer is required'),
  issueDate: z.date(),
  dueDate: z.date(),
  totalAmount: z.number()
    .positive('Total amount must be positive'),
  paymentTerms: z.string()
    .min(3, 'Payment terms are required'),
}).refine(
  (data) => data.dueDate >= data.issueDate,
  {
    message: 'Due date cannot be before issue date',
    path: ['dueDate'],
  }
);

/**
 * Payment validation schema
 */
export const paymentSchema = z.object({
  invoiceId: z.string()
    .min(1, 'Invoice is required'),
  customerId: z.string()
    .min(1, 'Customer is required'),
  amount: z.number()
    .positive('Payment amount must be positive'),
  paymentDate: z.date()
    .max(new Date(), 'Payment date cannot be in the future'),
  paymentMethod: z.string()
    .min(2, 'Payment method is required'),
  referenceNumber: z.string()
    .min(3, 'Reference number is required'),
  notes: z.string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional(),
});

/**
 * Stock Movement validation schema
 */
export const stockMovementSchema = z.object({
  productId: z.string()
    .min(1, 'Product is required'),
  type: z.enum(['in', 'out', 'adjustment', 'transfer'], {
    message: 'Invalid movement type',
  }),
  quantity: z.number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be positive'),
  fromLocation: z.string().optional(),
  toLocation: z.string().optional(),
  reason: z.string()
    .min(3, 'Reason is required'),
  referenceId: z.string().optional(),
  performedBy: z.string()
    .min(2, 'Performed by is required'),
});

/**
 * User validation schema
 */
export const userSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string()
    .email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['admin', 'manager', 'sales', 'inventory', 'medical'], {
    message: 'Invalid role',
  }),
});

// ============================================================================
// Helper Functions for Form Validation
// ============================================================================

/**
 * Validates form data against a Zod schema and returns formatted errors
 */
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.issues.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  
  return { success: false, errors };
}

/**
 * Validates a single field against a Zod schema
 */
export function validateField<T>(
  schema: z.ZodSchema<T>,
  fieldName: string,
  value: unknown
): { valid: boolean; error?: string } {
  try {
    schema.parse({ [fieldName]: value });
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0]?.message };
    }
    return { valid: false, error: 'Validation failed' };
  }
}
