// Job Postings Database Service

import { db } from '@/lib/db/schema';
import type { JobPosting } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

export class JobPostingsService {
  static async getJobPostings(status?: string): Promise<JobPosting[]> {
    if (status) {
      return await db.jobPostings.where({ status }).reverse().sortBy('postedDate');
    }
    return await db.jobPostings.reverse().sortBy('postedDate').toArray();
  }

  static async createJobPosting(data: Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobPosting> {
    const job: JobPosting = { ...data, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() };
    await db.jobPostings.add(job);
    return job;
  }

  static async updateJobPosting(id: string, updates: Partial<JobPosting>): Promise<void> {
    await db.jobPostings.update(id, { ...updates, updatedAt: new Date() });
  }
}
