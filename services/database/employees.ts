// Employees Database Service

import { db } from '@/lib/db/schema';
import { SystemIntegrationManager } from '@/lib/db/integrations';
import type { Employee } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

export class EmployeesService {
  /**
   * Get all employees with optional filters
   */
  static async getEmployees(filters?: {
    departmentId?: string;
    positionId?: string;
    status?: string;
    search?: string;
  }): Promise<Employee[]> {
    let query = db.employees.toCollection();

    if (filters?.departmentId) {
      query = db.employees.where({ departmentId: filters.departmentId });
    }

    if (filters?.positionId) {
      query = query.and(e => e.positionId === filters.positionId);
    }

    if (filters?.status) {
      query = query.and(e => e.status === filters.status);
    }

    let employees = await query.reverse().sortBy('createdAt');

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      employees = employees.filter(e => 
        e.firstName.toLowerCase().includes(searchLower) ||
        e.lastName.toLowerCase().includes(searchLower) ||
        e.employeeId.toLowerCase().includes(searchLower) ||
        e.email.toLowerCase().includes(searchLower)
      );
    }

    return employees;
  }

  /**
   * Get employee by ID
   */
  static async getEmployeeById(id: string): Promise<Employee | undefined> {
    return await db.employees.get(id);
  }

  /**
   * Get employee by employee ID
   */
  static async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    return await db.employees.where({ employeeId }).first();
  }

  /**
   * Create new employee
   */
  static async createEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>, applicantId?: string): Promise<Employee> {
    const employee: Employee = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.employees.add(employee);

    // Trigger integration manager
    await SystemIntegrationManager.onEmployeeHired(employee, applicantId);

    return employee;
  }

  /**
   * Update employee
   */
  static async updateEmployee(id: string, updates: Partial<Employee>): Promise<void> {
    await db.employees.update(id, { ...updates, updatedAt: new Date() });
  }

  /**
   * Archive employee (soft delete)
   */
  static async archiveEmployee(id: string, reason?: string): Promise<void> {
    await db.employees.update(id, {
      status: 'archived',
      archivedAt: new Date(),
      terminationReason: reason,
      updatedAt: new Date(),
    });
  }

  /**
   * Get active employees
   */
  static async getActiveEmployees(): Promise<Employee[]> {
    return await db.employees
      .where({ status: 'active' })
      .reverse()
      .sortBy('hireDate');
  }

  /**
   * Get employees by department
   */
  static async getEmployeesByDepartment(departmentId: string): Promise<Employee[]> {
    return await db.employees
      .where({ departmentId })
      .and(e => e.status === 'active')
      .reverse()
      .sortBy('hireDate');
  }

  /**
   * Get employees by manager
   */
  static async getEmployeesByManager(managerId: string): Promise<Employee[]> {
    return await db.employees
      .where({ managerId })
      .and(e => e.status === 'active')
      .toArray();
  }

  /**
   * Get employee statistics
   */
  static async getEmployeeStats(): Promise<{
    total: number;
    active: number;
    onLeave: number;
    archived: number;
    byDepartment: Record<string, number>;
  }> {
    const employees = await db.employees.toArray();
    const departments = await db.departments.toArray();

    const total = employees.length;
    const active = employees.filter(e => e.status === 'active').length;
    const onLeave = employees.filter(e => e.status === 'on-leave').length;
    const archived = employees.filter(e => e.status === 'archived').length;

    const byDepartment: Record<string, number> = {};
    for (const dept of departments) {
      byDepartment[dept.name] = employees.filter(e => 
        e.departmentId === dept.id && e.status === 'active'
      ).length;
    }

    return { total, active, onLeave, archived, byDepartment };
  }
}
