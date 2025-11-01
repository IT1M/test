// Attendance Database Service

import { db } from '@/lib/db/schema';
import { SystemIntegrationManager } from '@/lib/db/integrations';
import type { Attendance } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

export class AttendanceService {
  static async getAttendance(employeeId?: string, startDate?: Date, endDate?: Date): Promise<Attendance[]> {
    let query = db.attendance.toCollection();

    if (employeeId) {
      query = db.attendance.where({ employeeId });
    }

    let records = await query.reverse().sortBy('date');

    if (startDate && endDate) {
      records = records.filter(r => r.date >= startDate && r.date <= endDate);
    }

    return records;
  }

  static async recordAttendance(data: Omit<Attendance, 'id' | 'createdAt'>): Promise<Attendance> {
    const attendance: Attendance = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
    };
    await db.attendance.add(attendance);
    await SystemIntegrationManager.onAttendanceRecorded(attendance);
    return attendance;
  }

  static async updateAttendance(id: string, updates: Partial<Attendance>): Promise<void> {
    await db.attendance.update(id, updates);
  }
}
