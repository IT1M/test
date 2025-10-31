// ID and Code Generators

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique ID using UUID v4
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generate a unique order ID
 */
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `ORD-${timestamp}-${random}`.toUpperCase();
}

/**
 * Generate a unique customer ID
 */
export function generateCustomerId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `CUST-${timestamp}-${random}`.toUpperCase();
}

/**
 * Generate a unique invoice ID
 */
export function generateInvoiceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `INV-${timestamp}-${random}`.toUpperCase();
}

/**
 * Generate a unique patient ID
 */
export function generatePatientId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `PAT-${timestamp}-${random}`.toUpperCase();
}

/**
 * Generate a unique SKU
 */
export function generateSKU(prefix: string = 'PRD'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}
