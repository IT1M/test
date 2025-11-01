// System Integration Manager for Medical Products Company Management System
// Handles all cross-module integrations and cascade operations

import { db } from './schema';
import type {
  Rejection,
  Employee,
  Leave,
  Payroll,
  Applicant,
  Interview,
  SupplierEvaluation,
  PurchaseOrder,
  Attendance,
  JobPosting,
} from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * SystemIntegrationManager handles all cross-module integrations
 * and automatic cascade operations between different system modules
 */
export class SystemIntegrationManager {
  // ============================================
  // QUALITY CONTROL INTEGRATIONS
  // ============================================

  /**
   * Handle rejection creation - update product quality, supplier rating, inventory
   */
  static async onRejectionCreated(rejection: Rejection): Promise<void> {
    try {
      await db.transaction('rw', [
        db.products,
        db.suppliers,
        db.inventory,
        db.systemLogs,
      ], async () => {
        // 1. Update product quality metrics
        await this.updateProductQualityScore(rejection.productId);

        // 2. Update supplier rating if from supplier
        if (rejection.supplierId) {
          await this.updateSupplierQualityScore(rejection.supplierId);
        }

        // 3. Adjust inventory (remove rejected items)
        await this.adjustInventoryForRejection(rejection);

        // 4. Create notification for quality manager
        await this.notifyQualityManager(rejection);

        // 5. If critical, notify executive team
        if (rejection.severity === 'critical') {
          await this.notifyExecutiveTeam('critical_rejection', rejection);
        }

        // 6. Link to related order if applicable
        if (rejection.orderId) {
          await this.linkRejectionToOrder(rejection);
        }

        // 7. Log the action
        await this.logAction('rejection_created', 'rejection', rejection.id, {
          rejectionId: rejection.rejectionId,
          productId: rejection.productId,
          severity: rejection.severity,
          quantity: rejection.quantity,
        });
      });
    } catch (error) {
      await this.logError('onRejectionCreated', error as Error, { rejectionId: rejection.id });
      throw error;
    }
  }

  /**
   * Update product quality score based on rejection history
   */
  static async updateProductQualityScore(productId: string): Promise<void> {
    const rejections = await db.rejections
      .where({ productId })
      .and(r => r.status !== 'resolved')
      .toArray();

    const totalRejections = rejections.length;
    const criticalRejections = rejections.filter(r => r.severity === 'critical').length;

    // Calculate quality score (0-100, lower is worse)
    const qualityScore = Math.max(0, 100 - (totalRejections * 5) - (criticalRejections * 15));

    await this.logAction('product_quality_updated', 'product', productId, {
      qualityScore,
      totalRejections,
      criticalRejections,
    });
  }

  /**
   * Update supplier quality score based on rejection history
   */
  static async updateSupplierQualityScore(supplierId: string): Promise<void> {
    const rejections = await db.rejections
      .where({ supplierId })
      .toArray();

    const totalRejections = rejections.length;
    const criticalRejections = rejections.filter(r => r.severity === 'critical').length;

    // Calculate quality score (0-100)
    const qualityScore = Math.max(0, 100 - (totalRejections * 3) - (criticalRejections * 10));

    await db.suppliers.update(supplierId, {
      qualityScore,
      updatedAt: new Date(),
    });
  }

  /**
   * Adjust inventory for rejected items
   */
  private static async adjustInventoryForRejection(rejection: Rejection): Promise<void> {
    const inventory = await db.inventory.where({ productId: rejection.productId }).first();
    if (!inventory) return;

    await db.inventory.update(inventory.id, {
      quantity: Math.max(0, inventory.quantity - rejection.quantity),
      availableQuantity: Math.max(0, inventory.availableQuantity - rejection.quantity),
      updatedAt: new Date(),
    });

    // Create stock movement
    await db.stockMovements.add({
      id: uuidv4(),
      productId: rejection.productId,
      type: 'out',
      quantity: rejection.quantity,
      reason: `Rejection: ${rejection.rejectionReason}`,
      referenceId: rejection.id,
      performedBy: rejection.inspectorId,
      timestamp: new Date(),
    });
  }

  /**
   * Notify quality manager about rejection
   */
  private static async notifyQualityManager(rejection: Rejection): Promise<void> {
    // In a real implementation, this would send notifications
    await this.logAction('quality_manager_notified', 'rejection', rejection.id, {
      severity: rejection.severity,
      productId: rejection.productId,
    });
  }

  /**
   * Notify executive team about critical issues
   */
  private static async notifyExecutiveTeam(type: string, data: any): Promise<void> {
    await this.logAction('executive_team_notified', 'system', 'executive', {
      type,
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Link rejection to related order
   */
  private static async linkRejectionToOrder(rejection: Rejection): Promise<void> {
    await this.logAction('rejection_linked_to_order', 'rejection', rejection.id, {
      orderId: rejection.orderId,
    });
  }

  // ============================================
  // HR INTEGRATIONS
  // ============================================

  /**
   * Handle employee hiring - create user account, initialize leave balances, enroll in training
   */
  static async onEmployeeHired(employee: Employee, applicantId?: string): Promise<void> {
    try {
      await db.transaction('rw', [
        db.users,
        db.leaves,
        db.training,
        db.departments,
        db.applicants,
        db.systemLogs,
      ], async () => {
        // 1. Create user account if needed
        if (employee.positionId) {
          const position = await db.positions.get(employee.positionId);
          if (position) {
            const role = this.mapPositionToRole(position.level);
            await this.createUserAccount(employee, role);
          }
        }

        // 2. Initialize leave balances
        await this.initializeLeaveBalances(employee.id);

        // 3. Enroll in mandatory training
        await this.enrollInMandatoryTraining(employee.id);

        // 4. Update department employee count
        if (employee.departmentId) {
          await this.updateDepartmentStats(employee.departmentId);
        }

        // 5. If from recruitment, update applicant status
        if (applicantId) {
          await db.applicants.update(applicantId, { 
            status: 'hired',
            updatedAt: new Date(),
          });
        }

        // 6. Log the action
        await this.logAction('employee_hired', 'employee', employee.id, {
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          departmentId: employee.departmentId,
          positionId: employee.positionId,
        });
      });
    } catch (error) {
      await this.logError('onEmployeeHired', error as Error, { employeeId: employee.id });
      throw error;
    }
  }

  /**
   * Handle attendance recording - calculate work hours, notify manager if late
   */
  static async onAttendanceRecorded(attendance: Attendance): Promise<void> {
    try {
      await db.transaction('rw', [db.attendance, db.systemLogs], async () => {
        // 1. Calculate work hours
        if (attendance.checkIn && attendance.checkOut) {
          const hours = this.calculateWorkHours(attendance.checkIn, attendance.checkOut);
          await db.attendance.update(attendance.id, { workHours: hours });
        }

        // 2. Check if late and notify manager
        if (attendance.status === 'late') {
          await this.notifyManagerOfLateArrival(attendance);
        }

        // 3. Log the action
        await this.logAction('attendance_recorded', 'attendance', attendance.id, {
          employeeId: attendance.employeeId,
          date: attendance.date,
          status: attendance.status,
        });
      });
    } catch (error) {
      await this.logError('onAttendanceRecorded', error as Error, { attendanceId: attendance.id });
      throw error;
    }
  }

  /**
   * Handle leave approval - deduct balance, create attendance records, notify team
   */
  static async onLeaveApproved(leave: Leave): Promise<void> {
    try {
      await db.transaction('rw', [db.leaves, db.attendance, db.systemLogs], async () => {
        // 1. Deduct from leave balance
        await this.deductLeaveBalance(leave);

        // 2. Create attendance records for leave period
        await this.createLeaveAttendanceRecords(leave);

        // 3. Notify team members
        await this.notifyTeamOfLeave(leave);

        // 4. Log the action
        await this.logAction('leave_approved', 'leave', leave.id, {
          leaveId: leave.leaveId,
          employeeId: leave.employeeId,
          leaveType: leave.leaveType,
          startDate: leave.startDate,
          endDate: leave.endDate,
        });
      });
    } catch (error) {
      await this.logError('onLeaveApproved', error as Error, { leaveId: leave.id });
      throw error;
    }
  }

  /**
   * Handle payroll processing - update salary history, create accounting entry
   */
  static async onPayrollProcessed(payroll: Payroll): Promise<void> {
    try {
      await db.transaction('rw', [db.payroll, db.systemLogs], async () => {
        // 1. Update payroll status
        await db.payroll.update(payroll.id, {
          status: 'paid',
          paymentDate: new Date(),
          updatedAt: new Date(),
        });

        // 2. Log the action
        await this.logAction('payroll_processed', 'payroll', payroll.id, {
          payrollId: payroll.payrollId,
          employeeId: payroll.employeeId,
          month: payroll.month,
          year: payroll.year,
          netSalary: payroll.netSalary,
        });
      });
    } catch (error) {
      await this.logError('onPayrollProcessed', error as Error, { payrollId: payroll.id });
      throw error;
    }
  }

  // ============================================
  // RECRUITMENT INTEGRATIONS
  // ============================================

  /**
   * Handle application received - parse resume, calculate compatibility score
   */
  static async onApplicationReceived(applicant: Applicant): Promise<void> {
    try {
      await db.transaction('rw', [db.applicants, db.jobPostings, db.systemLogs], async () => {
        // 1. Update job posting application count
        const job = await db.jobPostings.get(applicant.jobId);
        if (job) {
          await db.jobPostings.update(applicant.jobId, {
            applicationsCount: (job.applicationsCount || 0) + 1,
            updatedAt: new Date(),
          });
        }

        // 2. Log the action
        await this.logAction('application_received', 'applicant', applicant.id, {
          applicantId: applicant.applicantId,
          jobId: applicant.jobId,
          name: `${applicant.firstName} ${applicant.lastName}`,
        });
      });
    } catch (error) {
      await this.logError('onApplicationReceived', error as Error, { applicantId: applicant.id });
      throw error;
    }
  }

  /**
   * Handle interview completion - calculate overall rating, update applicant status
   */
  static async onInterviewCompleted(interview: Interview): Promise<void> {
    try {
      await db.transaction('rw', [db.interviews, db.applicants, db.systemLogs], async () => {
        // 1. Calculate overall rating from all interviewers
        const overallRating = this.calculateOverallInterviewRating(interview);
        await db.interviews.update(interview.id, { 
          overallRating,
          updatedAt: new Date(),
        });

        // 2. Update applicant status based on recommendation
        if (interview.recommendation === 'strong-hire') {
          await db.applicants.update(interview.applicantId, {
            status: 'offer',
            updatedAt: new Date(),
          });
        }

        // 3. Log the action
        await this.logAction('interview_completed', 'interview', interview.id, {
          interviewId: interview.interviewId,
          applicantId: interview.applicantId,
          recommendation: interview.recommendation,
          overallRating,
        });
      });
    } catch (error) {
      await this.logError('onInterviewCompleted', error as Error, { interviewId: interview.id });
      throw error;
    }
  }

  // ============================================
  // SUPPLY CHAIN INTEGRATIONS
  // ============================================

  /**
   * Handle supplier evaluation - update supplier score, flag low performers
   */
  static async onSupplierEvaluated(evaluation: SupplierEvaluation): Promise<void> {
    try {
      await db.transaction('rw', [db.suppliers, db.systemLogs], async () => {
        // 1. Update supplier overall score
        await db.suppliers.update(evaluation.supplierId, {
          rating: evaluation.overallScore / 20, // Convert to 5-point scale
          qualityScore: evaluation.qualityScore,
          deliveryScore: evaluation.deliveryScore,
          priceScore: evaluation.priceScore,
          overallScore: evaluation.overallScore,
          updatedAt: new Date(),
        });

        // 2. If score is low, flag for review
        if (evaluation.overallScore < 60) {
          await this.flagSupplierForReview(evaluation.supplierId);
        }

        // 3. Log the action
        await this.logAction('supplier_evaluated', 'supplier', evaluation.supplierId, {
          evaluationId: evaluation.id,
          overallScore: evaluation.overallScore,
          period: evaluation.period,
        });
      });
    } catch (error) {
      await this.logError('onSupplierEvaluated', error as Error, { evaluationId: evaluation.id });
      throw error;
    }
  }

  /**
   * Handle purchase order received - update inventory, trigger quality inspection
   */
  static async onPurchaseOrderReceived(po: PurchaseOrder): Promise<void> {
    try {
      await db.transaction('rw', [
        db.purchaseOrders,
        db.inventory,
        db.qualityInspections,
        db.systemLogs,
      ], async () => {
        // 1. Update PO status
        await db.purchaseOrders.update(po.id, {
          status: 'received',
          receivedDate: new Date(),
          updatedAt: new Date(),
        });

        // 2. Update inventory
        for (const item of po.items) {
          const inventory = await db.inventory.where({ productId: item.productId }).first();
          if (inventory) {
            await db.inventory.update(inventory.id, {
              quantity: inventory.quantity + item.quantity,
              availableQuantity: inventory.availableQuantity + item.quantity,
              lastRestocked: new Date(),
              updatedAt: new Date(),
            });
          }
        }

        // 3. Create quality inspections
        for (const item of po.items) {
          await db.qualityInspections.add({
            id: uuidv4(),
            inspectionId: `QI-${Date.now()}-${item.productId.substring(0, 8)}`,
            productId: item.productId,
            orderId: po.id,
            batchNumber: `BATCH-${Date.now()}`,
            inspectionDate: new Date(),
            inspectorId: 'system',
            inspectionType: 'incoming',
            sampleSize: Math.min(item.quantity, 10),
            passedQuantity: 0,
            failedQuantity: 0,
            status: 'pending',
            notes: `Incoming inspection for PO ${po.poId}`,
            checkpoints: [],
            createdAt: new Date(),
          });
        }

        // 4. Log the action
        await this.logAction('purchase_order_received', 'purchase_order', po.id, {
          poId: po.poId,
          supplierId: po.supplierId,
          itemCount: po.items.length,
        });
      });
    } catch (error) {
      await this.logError('onPurchaseOrderReceived', error as Error, { poId: po.id });
      throw error;
    }
  }

  // ============================================
  // CROSS-MODULE INTEGRATIONS
  // ============================================

  /**
   * Link employee performance to business metrics
   */
  static async linkEmployeePerformanceToMetrics(employeeId: string): Promise<any> {
    const employee = await db.employees.get(employeeId);
    if (!employee) return null;

    // If sales employee, link to sales performance
    if (employee.departmentId) {
      const department = await db.departments.get(employee.departmentId);
      if (department && department.name.toLowerCase().includes('sales')) {
        const sales = await db.sales
          .where({ salesPerson: employeeId })
          .toArray();
        const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
        return { totalRevenue, salesCount: sales.length };
      }
    }

    // If quality inspector, link to rejection rates
    const inspections = await db.qualityInspections
      .where({ inspectorId: employeeId })
      .toArray();
    const rejections = await db.rejections
      .where({ inspectorId: employeeId })
      .toArray();

    return { 
      inspectionsCount: inspections.length, 
      rejectionsFound: rejections.length 
    };
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Map position level to user role
   */
  private static mapPositionToRole(level: string): string {
    const roleMap: Record<string, string> = {
      'executive': 'executive',
      'director': 'manager',
      'manager': 'manager',
      'lead': 'manager',
      'senior': 'sales',
      'mid': 'sales',
      'junior': 'sales',
      'entry': 'sales',
    };
    return roleMap[level] || 'sales';
  }

  /**
   * Create user account for employee
   */
  private static async createUserAccount(employee: Employee, role: string): Promise<void> {
    const existingUser = await db.users.where({ email: employee.email }).first();
    if (existingUser) return;

    await db.users.add({
      id: uuidv4(),
      username: employee.email.split('@')[0],
      email: employee.email,
      role: role as any,
      permissions: [],
      isActive: true,
      createdAt: new Date(),
    });
  }

  /**
   * Initialize leave balances for new employee
   */
  private static async initializeLeaveBalances(employeeId: string): Promise<void> {
    await db.employees.update(employeeId, {
      annualLeaveBalance: 21, // 21 days annual leave
      sickLeaveBalance: 10,   // 10 days sick leave
      updatedAt: new Date(),
    });
  }

  /**
   * Enroll employee in mandatory training
   */
  private static async enrollInMandatoryTraining(employeeId: string): Promise<void> {
    // Get all mandatory training programs
    const mandatoryTraining = await db.training
      .where({ status: 'planned' })
      .toArray();

    // In a real implementation, this would enroll the employee
    await this.logAction('employee_enrolled_in_training', 'employee', employeeId, {
      trainingCount: mandatoryTraining.length,
    });
  }

  /**
   * Update department statistics
   */
  private static async updateDepartmentStats(departmentId: string): Promise<void> {
    const employees = await db.employees
      .where({ departmentId })
      .and(e => e.status === 'active')
      .toArray();

    await db.departments.update(departmentId, {
      employeeCount: employees.length,
      updatedAt: new Date(),
    });
  }

  /**
   * Calculate work hours from check-in and check-out times
   */
  private static calculateWorkHours(checkIn: Date, checkOut: Date): number {
    const diff = checkOut.getTime() - checkIn.getTime();
    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // Hours with 2 decimal places
  }

  /**
   * Notify manager of late arrival
   */
  private static async notifyManagerOfLateArrival(attendance: Attendance): Promise<void> {
    const employee = await db.employees.get(attendance.employeeId);
    if (!employee || !employee.managerId) return;

    await this.logAction('manager_notified_late_arrival', 'attendance', attendance.id, {
      employeeId: attendance.employeeId,
      managerId: employee.managerId,
      date: attendance.date,
    });
  }

  /**
   * Deduct leave balance
   */
  private static async deductLeaveBalance(leave: Leave): Promise<void> {
    const employee = await db.employees.get(leave.employeeId);
    if (!employee) return;

    const days = Math.ceil((leave.endDate.getTime() - leave.startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (leave.leaveType === 'annual') {
      await db.employees.update(leave.employeeId, {
        annualLeaveBalance: Math.max(0, employee.annualLeaveBalance - days),
        updatedAt: new Date(),
      });
    } else if (leave.leaveType === 'sick') {
      await db.employees.update(leave.employeeId, {
        sickLeaveBalance: Math.max(0, employee.sickLeaveBalance - days),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Create attendance records for leave period
   */
  private static async createLeaveAttendanceRecords(leave: Leave): Promise<void> {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    const records: Attendance[] = [];

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      records.push({
        id: uuidv4(),
        employeeId: leave.employeeId,
        date: new Date(date),
        status: 'on-leave',
        notes: `${leave.leaveType} leave`,
        createdAt: new Date(),
      });
    }

    if (records.length > 0) {
      await db.attendance.bulkAdd(records);
    }
  }

  /**
   * Notify team of leave
   */
  private static async notifyTeamOfLeave(leave: Leave): Promise<void> {
    const employee = await db.employees.get(leave.employeeId);
    if (!employee) return;

    await this.logAction('team_notified_of_leave', 'leave', leave.id, {
      employeeId: leave.employeeId,
      departmentId: employee.departmentId,
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
    });
  }

  /**
   * Calculate overall interview rating
   */
  private static calculateOverallInterviewRating(interview: Interview): number {
    if (!interview.interviewers || interview.interviewers.length === 0) return 0;

    const totalRating = interview.interviewers.reduce((sum, i) => sum + i.rating, 0);
    return Math.round((totalRating / interview.interviewers.length) * 100) / 100;
  }

  /**
   * Flag supplier for review
   */
  private static async flagSupplierForReview(supplierId: string): Promise<void> {
    await this.logAction('supplier_flagged_for_review', 'supplier', supplierId, {
      reason: 'Low evaluation score',
      timestamp: new Date(),
    });
  }

  /**
   * Log an action to system logs
   */
  private static async logAction(action: string, entityType: string, entityId: string, details: any): Promise<void> {
    await db.systemLogs.add({
      id: uuidv4(),
      action,
      entityType,
      entityId,
      details: JSON.stringify(details),
      userId: 'system',
      timestamp: new Date(),
      status: 'success',
    });
  }

  /**
   * Log an error to system logs
   */
  private static async logError(action: string, error: Error, context: any): Promise<void> {
    await db.systemLogs.add({
      id: uuidv4(),
      action,
      entityType: 'system',
      details: JSON.stringify(context),
      userId: 'system',
      timestamp: new Date(),
      status: 'error',
      errorMessage: error.message,
    });
  }
}

// Export convenience functions
export const {
  onRejectionCreated,
  updateProductQualityScore,
  updateSupplierQualityScore,
  onEmployeeHired,
  onAttendanceRecorded,
  onLeaveApproved,
  onPayrollProcessed,
  onApplicationReceived,
  onInterviewCompleted,
  onSupplierEvaluated,
  onPurchaseOrderReceived,
  linkEmployeePerformanceToMetrics,
} = SystemIntegrationManager;
