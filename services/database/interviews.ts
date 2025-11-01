// Interviews Database Service

import { db } from '@/lib/db/schema';
import { SystemIntegrationManager } from '@/lib/db/integrations';
import type { Interview } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

export class InterviewsService {
  static async getInterviews(filters?: { applicantId?: string; status?: string }): Promise<Interview[]> {
    let query = db.interviews.toCollection();
    if (filters?.applicantId) query = db.interviews.where({ applicantId: filters.applicantId });
    if (filters?.status) query = query.and(i => i.status === filters.status);
    return await query.reverse().sortBy('scheduledDate');
  }

  static async createInterview(data: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>): Promise<Interview> {
    const interview: Interview = { ...data, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() };
    await db.interviews.add(interview);
    return interview;
  }

  static async completeInterview(id: string, updates: Partial<Interview>): Promise<void> {
    await db.interviews.update(id, { ...updates, status: 'completed', updatedAt: new Date() });
    const interview = await db.interviews.get(id);
    if (interview) {
      await SystemIntegrationManager.onInterviewCompleted(interview);
    }
  }
}
