// Leaves Database Service

import { db } from '@/lib/db/schema';
import { SystemIntegrationManager } from '@/lib/db/integrations';
import type { Leave } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

export class LeavesService {
  static async getLeaves(filters?: { employeeId?: string; status?: string }): Promise<Leave[]> {
    let query = db.leaves.toCollection();

    if (filters?.employeeId) {
      query = db.leaves.where({ employeeId: filters.employeeId });
    }

    if (filters?.status) {
      query = query.and(l => l.status === filters.status);
    }

    return await query.reverse().sortBy('requestDate');
  }

  static async createLeave(data: Omit<Leave, 'id' | 'createdAt' | 'updatedAt'>): Promise<Leave> {
    const leave: Leave = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.leaves.add(leave);
    return leave;
  }

  static async approveLeave(id: string, approvedBy: string): Promise<void> {
    await db.leaves.update(id, {
      status: 'approved',
      approvedBy,
      approvalDate: new Date(),
      updatedAt: new Date(),
    });

    const leave = await db.leaves.get(id);
    if (leave) {
      await SystemIntegrationManager.onLeaveApproved(leave);
    }
  }

  static async rejectLeave(id: string, reason: string): Promise<void> {
    await db.leaves.update(id, {
      status: 'rejected',
      rejectionReason: reason,
      updatedAt: new Date(),
    });
  }
}
