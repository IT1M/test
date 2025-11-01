// Payroll Database Service

import { db } from '@/lib/db/schema';
import { SystemIntegrationManager } from '@/lib/db/integrations';
import type { Payroll } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

export class PayrollService {
  static async getPayroll(filters?: { employeeId?: string; month?: number; year?: number }): Promise<Payroll[]> {
    let query = db.payroll.toCollection();

    if (filters?.employeeId) {
      query = db.payroll.where({ employeeId: filters.employeeId });
    }

    let records = await query.reverse().sortBy('createdAt');

    if (filters?.month !== undefined && filters?.year !== undefined) {
      records = records.filter(p => p.month === filters.month && p.year === filters.year);
    }

    return records;
  }

  static async createPayroll(data: Omit<Payroll, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payroll> {
    const payroll: Payroll = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.payroll.add(payroll);
    return payroll;
  }

  static async processPayroll(id: string): Promise<void> {
    const payroll = await db.payroll.get(id);
    if (payroll) {
      await SystemIntegrationManager.onPayrollProcessed(payroll);
    }
  }
}
