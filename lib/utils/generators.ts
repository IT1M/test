// ID and Code Generators
// Utility functions for generating unique identifiers and codes

/**
 * Generate a unique ID using timestamp and random string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a business-friendly ID with prefix
 * @param prefix - Prefix for the ID (e.g., 'ORD', 'CUST', 'INV')
 * @param length - Length of the numeric part (default: 6)
 */
export function generateBusinessId(prefix: string, length: number = 6): string {
  const timestamp = Date.now().toString().slice(-length);
  const random = Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
  const combined = (parseInt(timestamp) + parseInt(random)).toString().slice(-length).padStart(length, '0');
  return `${prefix}-${combined}`;
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a SKU code
 * @param category - Product category
 * @param sequence - Sequence number
 */
export function generateSKU(category: string, sequence: number): string {
  const categoryCode = category.substring(0, 3).toUpperCase();
  const sequenceStr = sequence.toString().padStart(4, '0');
  return `${categoryCode}-${sequenceStr}`;
}

/**
 * Generate a batch number
 */
export function generateBatchNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BATCH-${year}${month}-${random}`;
}

/**
 * Generate a reference number
 * @param prefix - Prefix for the reference
 */
export function generateReferenceNumber(prefix: string = 'REF'): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}
