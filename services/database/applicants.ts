// Applicants Database Service

import { db } from '@/lib/db/schema';
import { SystemIntegrationManager } from '@/lib/db/integrations';
import type { Applicant } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

export class ApplicantsService {
  static async getApplicants(filters?: { jobId?: string; status?: string }): Promise<Applicant[]> {
    let query = db.applicants.toCollection();
    if (filters?.jobId) query = db.applicants.where({ jobId: filters.jobId });
    if (filters?.status) query = query.and(a => a.status === filters.status);
    return await query.reverse().sortBy('applicationDate');
  }

  static async createApplicant(data: Omit<Applicant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Applicant> {
    const applicant: Applicant = { ...data, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() };
    await db.applicants.add(applicant);
    await SystemIntegrationManager.onApplicationReceived(applicant);
    return applicant;
  }

  static async updateApplicant(id: string, updates: Partial<Applicant>): Promise<void> {
    await db.applicants.update(id, { ...updates, updatedAt: new Date() });
  }
}
