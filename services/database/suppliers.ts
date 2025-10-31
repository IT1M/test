// Supplier Database Service

import { db } from '@/lib/db/schema';
import type { Supplier, SupplierEvaluation, SupplierContract } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Supplier Service - Handles all supplier-related database operations
 */
export class SupplierService {
  /**
   * Get all suppliers with optional filtering
   */
  static async getSuppliers(filters?: {
    type?: string;
    status?: string;
    country?: string;
    isPreferred?: boolean;
    minRating?: number;
  }): Promise<Supplier[]> {
    let query = db.suppliers.toCollection();

    if (filters?.type) {
      query = db.suppliers.where('type').equals(filters.type);
    }

    if (filters?.status) {
      query = db.suppliers.where('status').equals(filters.status);
    }

    if (filters?.country) {
      query = db.suppliers.where('country').equals(filters.country);
    }

    let suppliers = await query.toArray();

    // Apply additional filters
    if (filters?.isPreferred !== undefined) {
      suppliers = suppliers.filter(s => s.isPreferred === filters.isPreferred);
    }

    if (filters?.minRating !== undefined) {
      suppliers = suppliers.filter(s => s.rating >= filters.minRating);
    }

    return suppliers.sort((a, b) => b.rating - a.rating);
  }

  /**
   * Get supplier by ID
   */
  static async getSupplierById(id: string): Promise<Supplier | undefined> {
    return await db.suppliers.get(id);
  }

  /**
   * Get supplier by supplier ID (business-friendly ID)
   */
  static async getSupplierBySupplierId(supplierId: string): Promise<Supplier | undefined> {
    return await db.suppliers.where('supplierId').equals(supplierId).first();
  }

  /**
   * Create a new supplier
   */
  static async createSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    const supplier: Supplier = {
      ...supplierData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.suppliers.add(supplier);
    return supplier;
  }

  /**
   * Update an existing supplier
   */
  static async updateSupplier(id: string, updates: Partial<Supplier>): Promise<void> {
    await db.suppliers.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  /**
   * Delete a supplier (soft delete by setting status to inactive)
   */
  static async deleteSupplier(id: string): Promise<void> {
    await db.suppliers.update(id, {
      status: 'inactive',
      updatedAt: new Date(),
    });
  }

  /**
   * Calculate overall score from individual scores
   */
  static calculateOverallScore(qualityScore: number, deliveryScore: number, priceScore: number): number {
    return Math.round((qualityScore + deliveryScore + priceScore) / 3);
  }

  /**
   * Update supplier performance scores
   */
  static async updateSupplierScores(
    id: string,
    scores: {
      qualityScore?: number;
      deliveryScore?: number;
      priceScore?: number;
    }
  ): Promise<void> {
    const supplier = await this.getSupplierById(id);
    if (!supplier) throw new Error('Supplier not found');

    const qualityScore = scores.qualityScore ?? supplier.qualityScore;
    const deliveryScore = scores.deliveryScore ?? supplier.deliveryScore;
    const priceScore = scores.priceScore ?? supplier.priceScore;
    const overallScore = this.calculateOverallScore(qualityScore, deliveryScore, priceScore);

    // Convert overall score (0-100) to rating (0-5)
    const rating = Math.round((overallScore / 100) * 5 * 10) / 10;

    await db.suppliers.update(id, {
      ...scores,
      overallScore,
      rating,
      updatedAt: new Date(),
    });
  }

  /**
   * Get suppliers by product
   */
  static async getSuppliersByProduct(productId: string): Promise<Supplier[]> {
    const allSuppliers = await db.suppliers.toArray();
    return allSuppliers.filter(s => s.suppliedProducts?.includes(productId));
  }

  /**
   * Link product to supplier
   */
  static async linkProductToSupplier(supplierId: string, productId: string): Promise<void> {
    const supplier = await this.getSupplierById(supplierId);
    if (!supplier) throw new Error('Supplier not found');

    const suppliedProducts = supplier.suppliedProducts || [];
    if (!suppliedProducts.includes(productId)) {
      suppliedProducts.push(productId);
      await db.suppliers.update(supplierId, {
        suppliedProducts,
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Unlink product from supplier
   */
  static async unlinkProductFromSupplier(supplierId: string, productId: string): Promise<void> {
    const supplier = await this.getSupplierById(supplierId);
    if (!supplier) throw new Error('Supplier not found');

    const suppliedProducts = (supplier.suppliedProducts || []).filter(id => id !== productId);
    await db.suppliers.update(supplierId, {
      suppliedProducts,
      updatedAt: new Date(),
    });
  }

  /**
   * Get preferred suppliers
   */
  static async getPreferredSuppliers(): Promise<Supplier[]> {
    return await db.suppliers.where('isPreferred').equals(1).toArray();
  }

  /**
   * Get active suppliers
   */
  static async getActiveSuppliers(): Promise<Supplier[]> {
    return await db.suppliers.where('status').equals('active').toArray();
  }

  /**
   * Search suppliers by name
   */
  static async searchSuppliers(query: string): Promise<Supplier[]> {
    const allSuppliers = await db.suppliers.toArray();
    const lowerQuery = query.toLowerCase();
    return allSuppliers.filter(s =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.supplierId.toLowerCase().includes(lowerQuery) ||
      s.email.toLowerCase().includes(lowerQuery)
    );
  }

  // ============================================================================
  // SUPPLIER EVALUATIONS
  // ============================================================================

  /**
   * Get all evaluations for a supplier
   */
  static async getSupplierEvaluations(supplierId: string): Promise<SupplierEvaluation[]> {
    return await db.supplierEvaluations
      .where('supplierId')
      .equals(supplierId)
      .reverse()
      .sortBy('evaluationDate');
  }

  /**
   * Create supplier evaluation
   */
  static async createSupplierEvaluation(
    evaluationData: Omit<SupplierEvaluation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SupplierEvaluation> {
    const evaluation: SupplierEvaluation = {
      ...evaluationData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.supplierEvaluations.add(evaluation);

    // Update supplier scores based on evaluation
    await this.updateSupplierScores(evaluationData.supplierId, {
      qualityScore: evaluationData.qualityScore,
      deliveryScore: evaluationData.deliveryScore,
      priceScore: evaluationData.priceScore,
    });

    return evaluation;
  }

  /**
   * Update supplier evaluation
   */
  static async updateSupplierEvaluation(id: string, updates: Partial<SupplierEvaluation>): Promise<void> {
    await db.supplierEvaluations.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  /**
   * Get latest evaluation for supplier
   */
  static async getLatestEvaluation(supplierId: string): Promise<SupplierEvaluation | undefined> {
    const evaluations = await this.getSupplierEvaluations(supplierId);
    return evaluations[0];
  }

  // ============================================================================
  // SUPPLIER CONTRACTS
  // ============================================================================

  /**
   * Get all contracts for a supplier
   */
  static async getSupplierContracts(supplierId: string): Promise<SupplierContract[]> {
    return await db.supplierContracts
      .where('supplierId')
      .equals(supplierId)
      .reverse()
      .sortBy('startDate');
  }

  /**
   * Create supplier contract
   */
  static async createSupplierContract(
    contractData: Omit<SupplierContract, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SupplierContract> {
    const contract: SupplierContract = {
      ...contractData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.supplierContracts.add(contract);
    return contract;
  }

  /**
   * Update supplier contract
   */
  static async updateSupplierContract(id: string, updates: Partial<SupplierContract>): Promise<void> {
    await db.supplierContracts.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  /**
   * Get active contracts for supplier
   */
  static async getActiveContracts(supplierId: string): Promise<SupplierContract[]> {
    const contracts = await this.getSupplierContracts(supplierId);
    return contracts.filter(c => c.status === 'active');
  }

  /**
   * Get expiring contracts (within specified days)
   */
  static async getExpiringContracts(days: number = 90): Promise<SupplierContract[]> {
    const allContracts = await db.supplierContracts.where('status').equals('active').toArray();
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return allContracts.filter(c => {
      const endDate = new Date(c.endDate);
      return endDate >= now && endDate <= futureDate;
    });
  }

  /**
   * Check for expired contracts and update status
   */
  static async checkExpiredContracts(): Promise<void> {
    const activeContracts = await db.supplierContracts.where('status').equals('active').toArray();
    const now = new Date();

    for (const contract of activeContracts) {
      if (new Date(contract.endDate) < now) {
        await this.updateSupplierContract(contract.id, { status: 'expired' });
      }
    }
  }

  // ============================================================================
  // ANALYTICS AND REPORTING
  // ============================================================================

  /**
   * Get supplier statistics
   */
  static async getSupplierStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    preferred: number;
    averageRating: number;
    byType: Record<string, number>;
    byCountry: Record<string, number>;
  }> {
    const allSuppliers = await db.suppliers.toArray();

    const stats = {
      total: allSuppliers.length,
      active: allSuppliers.filter(s => s.status === 'active').length,
      inactive: allSuppliers.filter(s => s.status === 'inactive').length,
      preferred: allSuppliers.filter(s => s.isPreferred).length,
      averageRating: allSuppliers.reduce((sum, s) => sum + s.rating, 0) / allSuppliers.length || 0,
      byType: {} as Record<string, number>,
      byCountry: {} as Record<string, number>,
    };

    // Count by type
    allSuppliers.forEach(s => {
      stats.byType[s.type] = (stats.byType[s.type] || 0) + 1;
      stats.byCountry[s.country] = (stats.byCountry[s.country] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get top suppliers by rating
   */
  static async getTopSuppliers(limit: number = 10): Promise<Supplier[]> {
    const suppliers = await db.suppliers.where('status').equals('active').toArray();
    return suppliers.sort((a, b) => b.rating - a.rating).slice(0, limit);
  }

  /**
   * Get supplier performance summary
   */
  static async getSupplierPerformanceSummary(supplierId: string): Promise<{
    supplier: Supplier;
    evaluationsCount: number;
    contractsCount: number;
    activeContracts: number;
    latestEvaluation?: SupplierEvaluation;
    averageScores: {
      quality: number;
      delivery: number;
      price: number;
      service: number;
      compliance: number;
    };
  }> {
    const supplier = await this.getSupplierById(supplierId);
    if (!supplier) throw new Error('Supplier not found');

    const evaluations = await this.getSupplierEvaluations(supplierId);
    const contracts = await this.getSupplierContracts(supplierId);
    const activeContracts = contracts.filter(c => c.status === 'active');

    // Calculate average scores from evaluations
    const avgScores = {
      quality: 0,
      delivery: 0,
      price: 0,
      service: 0,
      compliance: 0,
    };

    if (evaluations.length > 0) {
      evaluations.forEach(e => {
        avgScores.quality += e.qualityScore;
        avgScores.delivery += e.deliveryScore;
        avgScores.price += e.priceScore;
        avgScores.service += e.serviceScore;
        avgScores.compliance += e.complianceScore;
      });

      avgScores.quality /= evaluations.length;
      avgScores.delivery /= evaluations.length;
      avgScores.price /= evaluations.length;
      avgScores.service /= evaluations.length;
      avgScores.compliance /= evaluations.length;
    }

    return {
      supplier,
      evaluationsCount: evaluations.length,
      contractsCount: contracts.length,
      activeContracts: activeContracts.length,
      latestEvaluation: evaluations[0],
      averageScores: avgScores,
    };
  }
}
