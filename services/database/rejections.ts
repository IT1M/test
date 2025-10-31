// Rejection Management Service

import { db } from '@/lib/db/schema';
import type { Rejection, RejectionReason, QualityInspection } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all rejections with optional filters
 */
export async function getRejections(filters?: {
  productId?: string;
  supplierId?: string;
  status?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<Rejection[]> {
  let query = db.rejections.toCollection();

  if (filters?.productId) {
    query = db.rejections.where('productId').equals(filters.productId);
  }

  if (filters?.status) {
    query = query.filter(r => r.status === filters.status);
  }

  if (filters?.severity) {
    query = query.filter(r => r.severity === filters.severity);
  }

  if (filters?.startDate && filters?.endDate) {
    query = query.filter(r => 
      r.rejectionDate >= filters.startDate! && 
      r.rejectionDate <= filters.endDate!
    );
  }

  const rejections = await query.reverse().sortBy('rejectionDate');
  return rejections;
}

/**
 * Get rejection by ID
 */
export async function getRejectionById(id: string): Promise<Rejection | undefined> {
  return await db.rejections.get(id);
}

/**
 * Get rejection by rejection ID
 */
export async function getRejectionByRejectionId(rejectionId: string): Promise<Rejection | undefined> {
  return await db.rejections.where('rejectionId').equals(rejectionId).first();
}

/**
 * Create a new rejection
 */
export async function createRejection(
  rejectionData: Omit<Rejection, 'id' | 'rejectionId' | 'createdAt' | 'updatedAt'>
): Promise<Rejection> {
  const id = uuidv4();
  
  // Generate rejection ID
  const count = await db.rejections.count();
  const rejectionId = `REJ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const rejection: Rejection = {
    ...rejectionData,
    id,
    rejectionId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.rejections.add(rejection);
  
  // Log the action
  await db.systemLogs.add({
    id: uuidv4(),
    action: 'CREATE_REJECTION',
    entityType: 'rejection',
    entityId: id,
    details: `Created rejection ${rejectionId} for item ${rejectionData.itemCode}`,
    userId: rejectionData.inspectorId,
    timestamp: new Date(),
    status: 'success',
  });

  return rejection;
}

/**
 * Update rejection
 */
export async function updateRejection(
  id: string,
  updates: Partial<Omit<Rejection, 'id' | 'rejectionId' | 'createdAt'>>
): Promise<void> {
  const existing = await db.rejections.get(id);
  if (!existing) {
    throw new Error('Rejection not found');
  }

  await db.rejections.update(id, {
    ...updates,
    updatedAt: new Date(),
  });

  // Log the action
  await db.systemLogs.add({
    id: uuidv4(),
    action: 'UPDATE_REJECTION',
    entityType: 'rejection',
    entityId: id,
    details: `Updated rejection ${existing.rejectionId}`,
    userId: updates.inspectorId || existing.inspectorId,
    timestamp: new Date(),
    status: 'success',
  });
}

/**
 * Delete rejection
 */
export async function deleteRejection(id: string, userId: string): Promise<void> {
  const rejection = await db.rejections.get(id);
  if (!rejection) {
    throw new Error('Rejection not found');
  }

  await db.rejections.delete(id);

  // Log the action
  await db.systemLogs.add({
    id: uuidv4(),
    action: 'DELETE_REJECTION',
    entityType: 'rejection',
    entityId: id,
    details: `Deleted rejection ${rejection.rejectionId}`,
    userId,
    timestamp: new Date(),
    status: 'success',
  });
}

/**
 * Get rejections by product
 */
export async function getRejectionsByProduct(productId: string): Promise<Rejection[]> {
  return await db.rejections
    .where('productId')
    .equals(productId)
    .reverse()
    .sortBy('rejectionDate');
}

/**
 * Get rejections by batch number
 */
export async function getRejectionsByBatch(batchNumber: string): Promise<Rejection[]> {
  return await db.rejections
    .where('batchNumber')
    .equals(batchNumber)
    .reverse()
    .sortBy('rejectionDate');
}

/**
 * Get rejections by supplier
 */
export async function getRejectionsBySupplier(supplierId: string): Promise<Rejection[]> {
  return await db.rejections
    .where('supplierId')
    .equals(supplierId)
    .reverse()
    .sortBy('rejectionDate');
}

/**
 * Get rejection statistics
 */
export async function getRejectionStats(startDate?: Date, endDate?: Date): Promise<{
  totalRejections: number;
  totalQuantity: number;
  totalCostImpact: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  rejectionRate: number;
}> {
  let rejections = await db.rejections.toArray();

  if (startDate && endDate) {
    rejections = rejections.filter(r => 
      r.rejectionDate >= startDate && r.rejectionDate <= endDate
    );
  }

  const totalRejections = rejections.length;
  const totalQuantity = rejections.reduce((sum, r) => sum + r.quantity, 0);
  const totalCostImpact = rejections.reduce((sum, r) => sum + r.costImpact, 0);

  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  rejections.forEach(r => {
    byType[r.rejectionType] = (byType[r.rejectionType] || 0) + 1;
    bySeverity[r.severity] = (bySeverity[r.severity] || 0) + 1;
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  });

  // Calculate rejection rate (rejections / total inspections)
  const totalInspections = await db.qualityInspections.count();
  const rejectionRate = totalInspections > 0 ? (totalRejections / totalInspections) * 100 : 0;

  return {
    totalRejections,
    totalQuantity,
    totalCostImpact,
    byType,
    bySeverity,
    byStatus,
    rejectionRate,
  };
}

// ============================================================================
// REJECTION REASONS MANAGEMENT
// ============================================================================

/**
 * Get all rejection reasons
 */
export async function getRejectionReasons(activeOnly: boolean = true): Promise<RejectionReason[]> {
  if (activeOnly) {
    return await db.rejectionReasons.where('isActive').equals(true).toArray();
  }
  return await db.rejectionReasons.toArray();
}

/**
 * Get rejection reason by ID
 */
export async function getRejectionReasonById(id: string): Promise<RejectionReason | undefined> {
  return await db.rejectionReasons.get(id);
}

/**
 * Create rejection reason
 */
export async function createRejectionReason(
  reasonData: Omit<RejectionReason, 'id'>
): Promise<RejectionReason> {
  const id = uuidv4();
  const reason: RejectionReason = {
    ...reasonData,
    id,
  };

  await db.rejectionReasons.add(reason);
  return reason;
}

/**
 * Update rejection reason
 */
export async function updateRejectionReason(
  id: string,
  updates: Partial<Omit<RejectionReason, 'id'>>
): Promise<void> {
  await db.rejectionReasons.update(id, updates);
}

/**
 * Delete rejection reason
 */
export async function deleteRejectionReason(id: string): Promise<void> {
  await db.rejectionReasons.delete(id);
}

// ============================================================================
// QUALITY INSPECTIONS MANAGEMENT
// ============================================================================

/**
 * Get all quality inspections
 */
export async function getQualityInspections(filters?: {
  productId?: string;
  status?: string;
  inspectionType?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<QualityInspection[]> {
  let query = db.qualityInspections.toCollection();

  if (filters?.productId) {
    query = db.qualityInspections.where('productId').equals(filters.productId);
  }

  if (filters?.status) {
    query = query.filter(i => i.status === filters.status);
  }

  if (filters?.inspectionType) {
    query = query.filter(i => i.inspectionType === filters.inspectionType);
  }

  if (filters?.startDate && filters?.endDate) {
    query = query.filter(i => 
      i.inspectionDate >= filters.startDate! && 
      i.inspectionDate <= filters.endDate!
    );
  }

  const inspections = await query.reverse().sortBy('inspectionDate');
  return inspections;
}

/**
 * Get quality inspection by ID
 */
export async function getQualityInspectionById(id: string): Promise<QualityInspection | undefined> {
  return await db.qualityInspections.get(id);
}

/**
 * Create quality inspection
 */
export async function createQualityInspection(
  inspectionData: Omit<QualityInspection, 'id' | 'inspectionId' | 'createdAt'>
): Promise<QualityInspection> {
  const id = uuidv4();
  
  // Generate inspection ID
  const count = await db.qualityInspections.count();
  const inspectionId = `QI-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const inspection: QualityInspection = {
    ...inspectionData,
    id,
    inspectionId,
    createdAt: new Date(),
  };

  await db.qualityInspections.add(inspection);
  
  // Log the action
  await db.systemLogs.add({
    id: uuidv4(),
    action: 'CREATE_QUALITY_INSPECTION',
    entityType: 'quality_inspection',
    entityId: id,
    details: `Created quality inspection ${inspectionId} for batch ${inspectionData.batchNumber}`,
    userId: inspectionData.inspectorId,
    timestamp: new Date(),
    status: 'success',
  });

  return inspection;
}

/**
 * Update quality inspection
 */
export async function updateQualityInspection(
  id: string,
  updates: Partial<Omit<QualityInspection, 'id' | 'inspectionId' | 'createdAt'>>
): Promise<void> {
  await db.qualityInspections.update(id, updates);
}

/**
 * Delete quality inspection
 */
export async function deleteQualityInspection(id: string, userId: string): Promise<void> {
  const inspection = await db.qualityInspections.get(id);
  if (!inspection) {
    throw new Error('Quality inspection not found');
  }

  await db.qualityInspections.delete(id);

  // Log the action
  await db.systemLogs.add({
    id: uuidv4(),
    action: 'DELETE_QUALITY_INSPECTION',
    entityType: 'quality_inspection',
    entityId: id,
    details: `Deleted quality inspection ${inspection.inspectionId}`,
    userId,
    timestamp: new Date(),
    status: 'success',
  });
}

/**
 * Get quality inspections by product
 */
export async function getQualityInspectionsByProduct(productId: string): Promise<QualityInspection[]> {
  return await db.qualityInspections
    .where('productId')
    .equals(productId)
    .reverse()
    .sortBy('inspectionDate');
}

/**
 * Get quality inspections by batch
 */
export async function getQualityInspectionsByBatch(batchNumber: string): Promise<QualityInspection[]> {
  return await db.qualityInspections
    .where('batchNumber')
    .equals(batchNumber)
    .reverse()
    .sortBy('inspectionDate');
}
