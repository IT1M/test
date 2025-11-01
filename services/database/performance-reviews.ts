// Performance Reviews Database Service

import { db } from '@/lib/db/schema';
import type { PerformanceReview } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

export class PerformanceReviewsService {
  static async getReviews(employeeId?: string): Promise<PerformanceReview[]> {
    if (employeeId) {
      return await db.performanceReviews.where({ employeeId }).reverse().sortBy('reviewDate');
    }
    return await db.performanceReviews.reverse().sortBy('reviewDate').toArray();
  }

  static async createReview(data: Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformanceReview> {
    const review: PerformanceReview = { ...data, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() };
    await db.performanceReviews.add(review);
    return review;
  }

  static async updateReview(id: string, updates: Partial<PerformanceReview>): Promise<void> {
    await db.performanceReviews.update(id, { ...updates, updatedAt: new Date() });
  }
}
