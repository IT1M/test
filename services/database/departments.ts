// Departments Database Service

import { db } from '@/lib/db/schema';
import type { Department } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

export class DepartmentsService {
  static async getDepartments(): Promise<Department[]> {
    return await db.departments.where({ isActive: true }).toArray();
  }

  static async getDepartmentById(id: string): Promise<Department | undefined> {
    return await db.departments.get(id);
  }

  static async createDepartment(data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department> {
    const department: Department = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.departments.add(department);
    return department;
  }

  static async updateDepartment(id: string, updates: Partial<Department>): Promise<void> {
    await db.departments.update(id, { ...updates, updatedAt: new Date() });
  }

  static async deleteDepartment(id: string): Promise<void> {
    await db.departments.update(id, { isActive: false, updatedAt: new Date() });
  }
}
