// Quality Inspections Database Service

import { db } from '@/lib/db/schema';
import type { QualityInspection } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

export class QualityInspectionsService {
  /**
   * Get all quality inspections with optional filters
   */
  static async getQualityInspections(filters?: {
    productId?: string;
    inspectorId?: string;
    status?: string;
    inspectionType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<QualityInspection[]> {
    let query = db.qualityInspections.toCollection();

    if (filters?.productId) {
      query = db.qualityInspections.where({ productId: filters.productId });
    }

    if (filters?.inspectorId) {
      query = query.and(i => i.inspectorId === filters.inspectorId);
    }

    if (filters?.status) {
      query = query.and(i => i.status === filters.status);
    }

    if (filters?.inspectionType) {
      query = query.and(i => i.inspectionType === filters.inspectionType);
    }

    if (filters?.startDate && filters?.endDate) {
      query = query.and(i => 
        i.inspectionDate >= filters.startDate! && 
        i.inspectionDate <= filters.endDate!
      );
    }

    return await query.reverse().sortBy('inspectionDate');
  }

  /**
   * Get quality inspection by ID
   */
  static async getQualityInspectionById(id: string): Promise<QualityInspection | undefined> {
    return await db.qualityInspections.get(id);
  }

  /**
   * Create new quality inspection
   */
  static async createQualityInspection(data: Omit<QualityInspection, 'id' | 'createdAt'>): Promise<QualityInspection> {
    const inspection: QualityInspection = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
    };

    await db.qualityInspections.add(inspection);
    return inspection;
  }

  /**
   * Update quality inspection
   */
  static async updateQualityInspection(id: string, updates: Partial<QualityInspection>): Promise<void> {
    await db.qualityInspections.update(id, updates);
  }

  /**
   * Delete quality inspection
   */
  static async deleteQualityInspection(id: string): Promise<void> {
    await db.qualityInspections.delete(id);
  }

  /**
   * Get inspections by product
   */
  static async getInspectionsByProduct(productId: string): Promise<QualityInspection[]> {
    return await db.qualityInspections
      .where({ productId })
      .reverse()
      .sortBy('inspectionDate');
  }

  /**
   * Get inspections by inspector
   */
  static async getInspectionsByInspector(inspectorId: string): Promise<QualityInspection[]> {
    return await db.qualityInspections
      .where({ inspectorId })
      .reverse()
      .sortBy('inspectionDate');
  }

  /**
   * Get pending inspections
   */
  static async getPendingInspections(): Promise<QualityInspection[]> {
    return await db.qualityInspections
      .where({ status: 'pending' })
      .reverse()
      .sortBy('inspectionDate');
  }

  /**
   * Get inspection statistics
   */
  static async getInspectionStats(startDate?: Date, endDate?: Date): Promise<{
    total: number;
    passed: number;
    failed: number;
    conditional: number;
    passRate: number;
  }> {
    let inspections = await db.qualityInspections.toArray();

    if (startDate && endDate) {
      inspections = inspections.filter(i => 
        i.inspectionDate >= startDate && i.inspectionDate <= endDate
      );
    }

    const total = inspections.length;
    const passed = inspections.filter(i => i.status === 'passed').length;
    const failed = inspections.filter(i => i.status === 'failed').length;
    const conditional = inspections.filter(i => i.status === 'conditional').length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    return { total, passed, failed, conditional, passRate };
  }
}
