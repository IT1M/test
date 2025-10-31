import { AuditLogger } from './audit';
import { getCurrentUserId } from '@/store/authStore';

/**
 * Log entity creation
 */
export async function logEntityCreated(
  entityType: string,
  entityId: string,
  data: any
): Promise<void> {
  await AuditLogger.logAction({
    type: `${entityType}_created`,
    entityType,
    entityId,
    userId: getCurrentUserId(),
    after: data,
    metadata: {
      action: 'create',
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log entity update with before/after comparison
 */
export async function logEntityUpdated(
  entityType: string,
  entityId: string,
  before: any,
  after: any
): Promise<void> {
  const changes = AuditLogger.calculateChanges(before, after);

  await AuditLogger.logAction({
    type: `${entityType}_updated`,
    entityType,
    entityId,
    userId: getCurrentUserId(),
    before,
    after,
    changes,
    metadata: {
      action: 'update',
      changedFields: Object.keys(changes),
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log entity deletion
 */
export async function logEntityDeleted(
  entityType: string,
  entityId: string,
  data: any
): Promise<void> {
  await AuditLogger.logAction({
    type: `${entityType}_deleted`,
    entityType,
    entityId,
    userId: getCurrentUserId(),
    before: data,
    metadata: {
      action: 'delete',
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log critical price change
 */
export async function logPriceChange(
  productId: string,
  productName: string,
  oldPrice: number,
  newPrice: number
): Promise<void> {
  const percentChange = ((newPrice - oldPrice) / oldPrice) * 100;

  await AuditLogger.logCriticalAction({
    type: 'price_changed',
    entityType: 'product',
    entityId: productId,
    userId: getCurrentUserId(),
    severity: Math.abs(percentChange) > 20 ? 'high' : 'medium',
    before: { price: oldPrice },
    after: { price: newPrice },
    changes: {
      unitPrice: { old: oldPrice, new: newPrice },
    },
    metadata: {
      productName,
      percentChange: percentChange.toFixed(2),
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log order status change
 */
export async function logOrderStatusChange(
  orderId: string,
  orderNumber: string,
  oldStatus: string,
  newStatus: string,
  customerId: string
): Promise<void> {
  await AuditLogger.logAction({
    type: 'order_status_changed',
    entityType: 'order',
    entityId: orderId,
    userId: getCurrentUserId(),
    before: { status: oldStatus },
    after: { status: newStatus },
    changes: {
      status: { old: oldStatus, new: newStatus },
    },
    metadata: {
      orderNumber,
      customerId,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log customer data modification (critical)
 */
export async function logCustomerDataModified(
  customerId: string,
  customerName: string,
  before: any,
  after: any
): Promise<void> {
  const changes = AuditLogger.calculateChanges(before, after);
  const criticalFields = ['creditLimit', 'paymentTerms', 'taxId', 'email'];
  const hasCriticalChanges = Object.keys(changes).some(field =>
    criticalFields.includes(field)
  );

  await AuditLogger.logCriticalAction({
    type: 'customer_data_modified',
    entityType: 'customer',
    entityId: customerId,
    userId: getCurrentUserId(),
    severity: hasCriticalChanges ? 'high' : 'medium',
    before,
    after,
    changes,
    metadata: {
      customerName,
      criticalFieldsChanged: Object.keys(changes).filter(f =>
        criticalFields.includes(f)
      ),
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log inventory adjustment
 */
export async function logInventoryAdjustment(
  productId: string,
  productName: string,
  oldQuantity: number,
  newQuantity: number,
  reason: string
): Promise<void> {
  const difference = newQuantity - oldQuantity;

  await AuditLogger.logAction({
    type: 'inventory_adjusted',
    entityType: 'inventory',
    entityId: productId,
    userId: getCurrentUserId(),
    before: { quantity: oldQuantity },
    after: { quantity: newQuantity },
    changes: {
      quantity: { old: oldQuantity, new: newQuantity },
    },
    metadata: {
      productName,
      difference,
      reason,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log payment recorded
 */
export async function logPaymentRecorded(
  paymentId: string,
  invoiceId: string,
  customerId: string,
  amount: number,
  paymentMethod: string
): Promise<void> {
  await AuditLogger.logAction({
    type: 'payment_recorded',
    entityType: 'payment',
    entityId: paymentId,
    userId: getCurrentUserId(),
    after: {
      invoiceId,
      customerId,
      amount,
      paymentMethod,
    },
    metadata: {
      invoiceId,
      customerId,
      amount,
      paymentMethod,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log medical record access
 */
export async function logMedicalRecordAccess(
  recordId: string,
  patientId: string,
  action: 'view' | 'create' | 'update' | 'delete'
): Promise<void> {
  await AuditLogger.logCriticalAction({
    type: `medical_record_${action}`,
    entityType: 'medical_record',
    entityId: recordId,
    userId: getCurrentUserId(),
    severity: action === 'delete' ? 'high' : 'medium',
    metadata: {
      patientId,
      action,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log bulk operation
 */
export async function logBulkOperation(
  operation: string,
  entityType: string,
  affectedIds: string[],
  details?: any
): Promise<void> {
  await AuditLogger.logCriticalAction({
    type: `bulk_${operation}`,
    entityType,
    entityId: 'bulk',
    userId: getCurrentUserId(),
    severity: affectedIds.length > 100 ? 'high' : 'medium',
    metadata: {
      operation,
      affectedCount: affectedIds.length,
      affectedIds: affectedIds.slice(0, 10), // Log first 10 IDs
      details,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log data export
 */
export async function logDataExport(
  entityType: string,
  recordCount: number,
  format: string,
  filters?: any
): Promise<void> {
  await AuditLogger.logCriticalAction({
    type: 'data_exported',
    entityType,
    entityId: 'export',
    userId: getCurrentUserId(),
    severity: recordCount > 1000 ? 'high' : 'medium',
    metadata: {
      recordCount,
      format,
      filters,
      timestamp: new Date().toISOString(),
    },
  });
}
