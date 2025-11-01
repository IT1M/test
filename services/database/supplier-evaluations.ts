// Supplier Evaluations Database Service

import { db } from '@/lib/db/schema';
import { SystemIntegrationManager } from '@/lib/db/integrations';
import type { SupplierEvaluation } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

export class SupplierEvaluationsService {
  static async getEvaluations(supplierId?: string): Promise<SupplierEvaluation[]> {
    if (supplierId) {
      return await db.supplierEvaluations.where({ supplierId }).reverse().sortBy('evaluationDate');
    }
    return await db.supplierEvaluations.reverse().sortBy('evaluationDate').toArray();
  }

  static async createEvaluation(data: Omit<SupplierEvaluation, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupplierEvaluation> {
    const evaluation: SupplierEvaluation = { ...data, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() };
    await db.supplierEvaluations.add(evaluation);
    await SystemIntegrationManager.onSupplierEvaluated(evaluation);
    return evaluation;
  }

  static async updateEvaluation(id: string, updates: Partial<SupplierEvaluation>): Promise<void> {
    await db.supplierEvaluations.update(id, { ...updates, updatedAt: new Date() });
  }
}
