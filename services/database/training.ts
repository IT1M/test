// Training Database Service

import { db } from '@/lib/db/schema';
import type { Training } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

export class TrainingService {
  static async getTraining(filters?: { category?: string; status?: string }): Promise<Training[]> {
    let query = db.training.toCollection();
    if (filters?.category) query = query.and(t => t.category === filters.category);
    if (filters?.status) query = query.and(t => t.status === filters.status);
    return await query.reverse().sortBy('startDate');
  }

  static async createTraining(data: Omit<Training, 'id' | 'createdAt' | 'updatedAt'>): Promise<Training> {
    const training: Training = { ...data, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() };
    await db.training.add(training);
    return training;
  }

  static async updateTraining(id: string, updates: Partial<Training>): Promise<void> {
    await db.training.update(id, { ...updates, updatedAt: new Date() });
  }
}
