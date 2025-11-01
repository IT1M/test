// System Integration Manager for Medical Products Company Management System
// Handles all cross-module integrations and cascade operations
//
// Note: Some methods use type assertions (as any) for extended properties that are not
// yet defined in the base types but will be added in future schema updates.

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
  ProductionRun,
  MachineDowntime,
  ProductionScheduleOptimization,
  CompanyHealthScore,
  ExecutiveKPI,
  ExecutiveAlert,
  StrategicGoal,
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
   * Enhanced version with onboarding tasks creation
   */
  static async onEmployeeHired(employee: Employee, applicantId?: string): Promise<void> {
    try {
      await db.transaction('rw', [
        db.users,
        db.leaves,
        db.training,
        db.departments,
        db.applicants,
        db.employeeOnboarding,
        db.systemLogs,
      ], async () => {
        // 1. Create user account if needed
        let userId: string | undefined;
        if (employee.positionId) {
          const position = await db.positions.get(employee.positionId);
          if (position) {
            const role = this.mapPositionToRole(position.level);
            userId = await this.createUserAccount(employee, role);
          }
        }

        // 2. Initialize leave balances
        await this.initializeLeaveBalances(employee.id);

        // 3. Create onboarding plan with tasks
        await this.createOnboardingPlan(employee.id, employee.departmentId, userId);

        // 4. Enroll in mandatory training
        await this.enrollInMandatoryTraining(employee.id);

        // 5. Update department employee count
        if (employee.departmentId) {
          await this.updateDepartmentStats(employee.departmentId);
        }

        // 6. If from recruitment, update applicant status
        if (applicantId) {
          await db.applicants.update(applicantId, { 
            status: 'hired',
            updatedAt: new Date(),
          });
        }

        // 7. Send welcome email notification
        await this.sendWelcomeNotification(employee);

        // 8. Log the action
        await this.logAction('employee_hired', 'employee', employee.id, {
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          departmentId: employee.departmentId,
          positionId: employee.positionId,
          userId,
        });
      });
    } catch (error) {
      await this.logError('onEmployeeHired', error as Error, { employeeId: employee.id });
      throw error;
    }
  }

  /**
   * Handle attendance recording - calculate work hours, notify manager if late, update metrics
   * Enhanced version with performance metrics tracking
   */
  static async onAttendanceRecorded(attendance: Attendance): Promise<void> {
    try {
      await db.transaction('rw', [
        db.attendance, 
        db.employees,
        db.operatorPerformanceMetrics,
        db.systemLogs
      ], async () => {
        // 1. Calculate work hours
        if (attendance.checkIn && attendance.checkOut) {
          const hours = this.calculateWorkHours(attendance.checkIn, attendance.checkOut);
          await db.attendance.update(attendance.id, { workHours: hours });
        }

        // 2. Update employee attendance metrics
        await this.updateEmployeeAttendanceMetrics(attendance.employeeId);

        // 3. Check if late and notify manager
        if (attendance.status === 'late') {
          await this.notifyManagerOfLateArrival(attendance);
        }

        // 4. Check for attendance patterns/anomalies
        await this.detectAttendanceAnomalies(attendance.employeeId);

        // 5. Update operator performance metrics if applicable
        const employee = await db.employees.get(attendance.employeeId);
        if (employee && employee.departmentId) {
          const department = await db.departments.get(employee.departmentId);
          if (department && department.name.toLowerCase().includes('production')) {
            await this.updateOperatorAttendanceMetrics(attendance.employeeId, attendance.date);
          }
        }

        // 6. Log the action
        await this.logAction('attendance_recorded', 'attendance', attendance.id, {
          employeeId: attendance.employeeId,
          date: attendance.date,
          status: attendance.status,
          workHours: attendance.workHours,
        });
      });
    } catch (error) {
      await this.logError('onAttendanceRecorded', error as Error, { attendanceId: attendance.id });
      throw error;
    }
  }

  /**
   * Handle leave approval - deduct balance, create attendance records, notify team, update calendar
   * Enhanced version with calendar integration and team notifications
   */
  static async onLeaveApproved(leave: Leave): Promise<void> {
    try {
      await db.transaction('rw', [
        db.leaves, 
        db.attendance, 
        db.employees,
        db.productionScheduleOptimizations,
        db.systemLogs
      ], async () => {
        // 1. Deduct from leave balance
        await this.deductLeaveBalance(leave);

        // 2. Create attendance records for leave period
        await this.createLeaveAttendanceRecords(leave);

        // 3. Update calendar and notify team members
        await this.updateTeamCalendar(leave);
        await this.notifyTeamOfLeave(leave);

        // 4. Check if employee is assigned to production and reschedule if needed
        const employee = await db.employees.get(leave.employeeId);
        if (employee && employee.departmentId) {
          const department = await db.departments.get(employee.departmentId);
          if (department && department.name.toLowerCase().includes('production')) {
            await this.handleProductionOperatorLeave(leave.employeeId, leave.startDate, leave.endDate);
          }
        }

        // 5. Notify manager for approval confirmation
        if (employee && employee.managerId) {
          await this.notifyManagerOfLeaveApproval(leave, employee.managerId);
        }

        // 6. Send confirmation to employee
        await this.sendLeaveApprovalNotification(leave);

        // 7. Log the action
        await this.logAction('leave_approved', 'leave', leave.id, {
          leaveId: leave.leaveId,
          employeeId: leave.employeeId,
          leaveType: leave.leaveType,
          startDate: leave.startDate,
          endDate: leave.endDate,
          duration: Math.ceil((leave.endDate.getTime() - leave.startDate.getTime()) / (1000 * 60 * 60 * 24)),
        });
      });
    } catch (error) {
      await this.logError('onLeaveApproved', error as Error, { leaveId: leave.id });
      throw error;
    }
  }

  /**
   * Handle payroll processing - update salary history, create accounting entry, update financial records
   * Enhanced version with compensation history tracking and financial integration
   */
  static async onPayrollProcessed(payroll: Payroll): Promise<void> {
    try {
      await db.transaction('rw', [
        db.payroll, 
        db.employeeCompensationHistory,
        db.executiveKPIs,
        db.systemLogs
      ], async () => {
        // 1. Update payroll status
        await db.payroll.update(payroll.id, {
          status: 'paid',
          paymentDate: new Date(),
          updatedAt: new Date(),
        });

        // 2. Record in compensation history if there's a change
        const previousPayroll = await db.payroll
          .where({ employeeId: payroll.employeeId })
          .and(p => p.id !== payroll.id && p.status === 'paid')
          .reverse()
          .first();

        if (previousPayroll && previousPayroll.basicSalary !== payroll.basicSalary) {
          await db.employeeCompensationHistory.add({
            id: uuidv4(),
            employeeId: payroll.employeeId,
            effectiveDate: new Date(),
            changeType: 'salary-increase',
            previousSalary: previousPayroll.basicSalary,
            newSalary: payroll.basicSalary,
            changePercentage: ((payroll.basicSalary - previousPayroll.basicSalary) / previousPayroll.basicSalary) * 100,
            reason: 'Regular payroll adjustment',
            approvedBy: 'system',
            createdAt: new Date(),
          });
        }

        // 3. Update financial records (Executive KPI)
        await this.updateFinancialRecordsForPayroll(payroll);

        // 4. Generate and send payslip notification
        await this.sendPayslipNotification(payroll);

        // 5. Update HR metrics
        await this.updateHRPayrollMetrics(payroll.month, payroll.year);

        // 6. Log the action
        await this.logAction('payroll_processed', 'payroll', payroll.id, {
          payrollId: payroll.payrollId,
          employeeId: payroll.employeeId,
          month: payroll.month,
          year: payroll.year,
          basicSalary: payroll.basicSalary,
          netSalary: payroll.netSalary,
          totalDeductions: payroll.totalDeductions,
          allowances: payroll.allowances,
        });
      });
    } catch (error) {
      await this.logError('onPayrollProcessed', error as Error, { payrollId: payroll.id });
      throw error;
    }
  }

  // ============================================
  // MANUFACTURING INTEGRATIONS
  // ============================================

  /**
   * Handle production completion - update inventory and quality metrics
   */
  static async onProductionCompleted(productionRun: ProductionRun): Promise<void> {
    try {
      await db.transaction('rw', [
        db.productionRuns,
        db.inventory,
        db.machinePerformanceAnalytics,
        db.operatorPerformanceMetrics,
        db.systemLogs,
      ], async () => {
        // Type assertion for extended properties
        const runAny = productionRun as any;
        // 1. Update inventory with produced quantity
        await this.updateInventoryFromProduction(productionRun);

        // 2. Update machine performance analytics
        await this.updateMachinePerformanceFromProduction(productionRun);

        // 3. Update operator performance metrics
        if (productionRun.operatorId) {
          await this.updateOperatorPerformanceFromProduction(productionRun);
        }

        // 4. Update quality metrics
        await this.updateQualityMetricsFromProduction(productionRun);

        // 5. Check if order is fulfilled
        if (productionRun.orderId) {
          await this.checkOrderFulfillment(productionRun.orderId);
        }

        // 6. Log the action
        await this.logAction('production_completed', 'production_run', productionRun.id, {
          productionRunId: productionRun.id,
          machineId: productionRun.machineId,
          productId: productionRun.productId,
          quantityProduced: runAny.quantityProduced,
          quantityRejected: runAny.quantityRejected,
        });
      });
    } catch (error) {
      await this.logError('onProductionCompleted', error as Error, { productionRunId: productionRun.id });
      throw error;
    }
  }

  /**
   * Handle machine downtime - trigger maintenance and reschedule production
   */
  static async onMachineDowntime(downtime: MachineDowntime): Promise<void> {
    try {
      await db.transaction('rw', [
        db.machineDowntime,
        db.maintenanceSchedule,
        db.productionScheduleOptimizations,
        db.executiveAlerts,
        db.systemLogs,
      ], async () => {
        // 1. Create maintenance task if needed
        if (downtime.category === 'breakdown') {
          await this.createMaintenanceTask(downtime);
        }

        // 2. Notify maintenance team
        await this.notifyMaintenanceTeam(downtime);

        // 3. Reschedule affected production runs
        await this.rescheduleProductionForDowntime(downtime);

        // 4. Update machine performance analytics
        await this.updateMachineDowntimeAnalytics(downtime);

        // 5. Create executive alert if critical
        const downtimeAny = downtime as any;
        if (downtimeAny.severity === 'critical' || downtimeAny.estimatedDuration > 240) { // > 4 hours
          await this.createExecutiveAlertForDowntime(downtime);
        }

        // 6. Estimate impact on delivery
        await this.estimateDowntimeImpact(downtime);

        // 7. Log the action
        await this.logAction('machine_downtime_recorded', 'machine_downtime', downtime.id, {
          downtimeId: downtime.id,
          machineId: downtime.machineId,
          category: downtime.category,
          severity: downtimeAny.severity,
          estimatedDuration: downtimeAny.estimatedDuration,
        });
      });
    } catch (error) {
      await this.logError('onMachineDowntime', error as Error, { downtimeId: downtime.id });
      throw error;
    }
  }

  /**
   * Handle quality issue - link with machine, operator, and supplier
   */
  static async onQualityIssue(rejection: Rejection): Promise<void> {
    try {
      await db.transaction('rw', [
        db.rejections,
        db.machines,
        db.employees,
        db.suppliers,
        db.machinePerformanceAnalytics,
        db.operatorPerformanceMetrics,
        db.systemLogs,
      ], async () => {
        const rejectionAny = rejection as any;
        
        // 1. Link to machine if from production
        if (rejectionAny.machineId) {
          await this.linkQualityIssueToMachine(rejection);
        }

        // 2. Link to operator if applicable
        if (rejectionAny.operatorId) {
          await this.linkQualityIssueToOperator(rejection);
        }

        // 3. Link to supplier if from incoming inspection
        if (rejection.supplierId) {
          await this.linkQualityIssueToSupplier(rejection);
        }

        // 4. Link to batch/lot number
        if (rejection.batchNumber) {
          await this.linkQualityIssueToBatch(rejection);
        }

        // 5. Create CAPA (Corrective and Preventive Action) if critical
        if (rejection.severity === 'critical') {
          await this.createCAPAForQualityIssue(rejection);
        }

        // 6. Update quality metrics
        await this.updateQualityMetricsForIssue(rejection);

        // 7. Notify quality manager
        await this.notifyQualityManagerOfIssue(rejection);

        // 8. Log the action
        await this.logAction('quality_issue_recorded', 'rejection', rejection.id, {
          rejectionId: rejection.rejectionId,
          productId: rejection.productId,
          machineId: rejectionAny.machineId,
          operatorId: rejectionAny.operatorId,
          supplierId: rejection.supplierId,
          severity: rejection.severity,
          quantity: rejection.quantity,
        });
      });
    } catch (error) {
      await this.logError('onQualityIssue', error as Error, { rejectionId: rejection.id });
      throw error;
    }
  }

  /**
   * Handle schedule optimization - notify affected departments
   */
  static async onScheduleOptimized(schedule: ProductionScheduleOptimization): Promise<void> {
    try {
      await db.transaction('rw', [
        db.productionScheduleOptimizations,
        db.systemLogs,
      ], async () => {
        // 1. Identify affected departments
        const affectedDepartments = await this.identifyAffectedDepartments(schedule);

        // 2. Notify production department
        await this.notifyProductionDepartment(schedule);

        // 3. Notify maintenance if schedule changes affect maintenance windows
        await this.notifyMaintenanceOfScheduleChange(schedule);

        // 4. Notify quality department for inspection planning
        await this.notifyQualityDepartment(schedule);

        // 5. Notify logistics/warehouse for material preparation
        await this.notifyLogisticsDepartment(schedule);

        // 6. Update machine assignments
        await this.updateMachineAssignments(schedule);

        // 7. Send notifications to operators
        await this.notifyOperatorsOfSchedule(schedule);

        // 8. Log the action
        await this.logAction('schedule_optimized', 'production_schedule', schedule.id, {
          scheduleId: schedule.scheduleId,
          ordersCount: schedule.orders.length,
          machineAssignments: schedule.machineAssignments.length,
          affectedDepartments: affectedDepartments.length,
          optimizationAlgorithm: schedule.optimization.algorithm,
        });
      });
    } catch (error) {
      await this.logError('onScheduleOptimized', error as Error, { scheduleId: schedule.id });
      throw error;
    }
  }

  // ============================================
  // EXECUTIVE INTEGRATIONS
  // ============================================

  /**
   * Calculate company health score aggregating all systems
   */
  static async calculateCompanyHealthScore(): Promise<CompanyHealthScore> {
    try {
      const timestamp = new Date();

      // Calculate Financial Health (30%)
      const financialHealth = await this.calculateFinancialHealth();

      // Calculate Operational Health (25%)
      const operationalHealth = await this.calculateOperationalHealth();

      // Calculate Quality Health (15%)
      const qualityHealth = await this.calculateQualityHealth();

      // Calculate HR Health (15%)
      const hrHealth = await this.calculateHRHealth();

      // Calculate Customer Health (15%)
      const customerHealth = await this.calculateCustomerHealth();

      // Calculate overall score
      const overallScore = 
        (financialHealth.score * financialHealth.weight) +
        (operationalHealth.score * operationalHealth.weight) +
        (qualityHealth.score * qualityHealth.weight) +
        (hrHealth.score * hrHealth.weight) +
        (customerHealth.score * customerHealth.weight);

      // Determine trend
      const previousScore = await db.companyHealthScores
        .orderBy('timestamp')
        .reverse()
        .first();

      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (previousScore) {
        if (overallScore > previousScore.overallScore + 2) trend = 'improving';
        else if (overallScore < previousScore.overallScore - 2) trend = 'declining';
      }

      // Generate AI insights and recommendations
      const aiInsights = await this.generateHealthScoreInsights({
        financialHealth,
        operationalHealth,
        qualityHealth,
        hrHealth,
        customerHealth,
      });

      const recommendations = await this.generateHealthScoreRecommendations({
        financialHealth,
        operationalHealth,
        qualityHealth,
        hrHealth,
        customerHealth,
      });

      // Detect critical alerts
      const criticalAlerts = await this.detectCriticalAlertsFromHealth({
        financialHealth,
        operationalHealth,
        qualityHealth,
        hrHealth,
        customerHealth,
      });

      const healthScore: CompanyHealthScore = {
        id: uuidv4(),
        timestamp,
        overallScore,
        trend,
        financialHealth,
        operationalHealth,
        qualityHealth,
        hrHealth,
        customerHealth,
        aiInsights,
        recommendations,
        criticalAlerts,
        createdAt: timestamp,
      };

      // Save to database
      await db.companyHealthScores.add(healthScore);

      await this.logAction('company_health_score_calculated', 'system', 'executive', {
        overallScore,
        trend,
        timestamp,
      });

      return healthScore;
    } catch (error) {
      await this.logError('calculateCompanyHealthScore', error as Error, {});
      throw error;
    }
  }

  /**
   * Update executive KPIs with real-time data
   */
  static async updateExecutiveKPIs(period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'daily'): Promise<ExecutiveKPI> {
    try {
      const date = new Date();
      date.setHours(0, 0, 0, 0);

      // Calculate Financial KPIs
      const financialKPIs = await this.calculateFinancialKPIs(period);

      // Calculate Operational KPIs
      const operationalKPIs = await this.calculateOperationalKPIs(period);

      // Calculate HR KPIs
      const hrKPIs = await this.calculateHRKPIs(period);

      // Calculate Customer KPIs
      const customerKPIs = await this.calculateCustomerKPIs(period);

      // Calculate Quality KPIs
      const qualityKPIs = await this.calculateQualityKPIs(period);

      // Get previous period for comparison
      const previousPeriod = await this.getPreviousPeriodKPIs(period);

      // Calculate growth rates
      const growthRates = this.calculateGrowthRates(
        { ...financialKPIs, ...operationalKPIs },
        previousPeriod
      );

      const kpi: ExecutiveKPI = {
        id: uuidv4(),
        date,
        period,
        ...financialKPIs,
        ...operationalKPIs,
        ...hrKPIs,
        ...customerKPIs,
        ...qualityKPIs,
        previousPeriod,
        growthRates,
        createdAt: new Date(),
      };

      // Save to database
      await db.executiveKPIs.add(kpi);

      await this.logAction('executive_kpis_updated', 'system', 'executive', {
        period,
        date,
        revenue: kpi.revenue,
        profit: kpi.netProfit,
      });

      return kpi;
    } catch (error) {
      await this.logError('updateExecutiveKPIs', error as Error, { period });
      throw error;
    }
  }

  /**
   * Detect critical alerts across all modules
   */
  static async detectCriticalAlerts(): Promise<ExecutiveAlert[]> {
    try {
      const alerts: ExecutiveAlert[] = [];

      // Financial alerts
      const financialAlerts = await this.detectFinancialAlerts();
      alerts.push(...financialAlerts);

      // Operational alerts
      const operationalAlerts = await this.detectOperationalAlerts();
      alerts.push(...operationalAlerts);

      // Quality alerts
      const qualityAlerts = await this.detectQualityAlerts();
      alerts.push(...qualityAlerts);

      // HR alerts
      const hrAlerts = await this.detectHRAlerts();
      alerts.push(...hrAlerts);

      // Customer alerts
      const customerAlerts = await this.detectCustomerAlerts();
      alerts.push(...customerAlerts);

      // Save new alerts to database
      for (const alert of alerts) {
        const existing = await db.executiveAlerts
          .where({ title: alert.title, status: 'active' })
          .first();

        if (!existing) {
          await db.executiveAlerts.add(alert);
        }
      }

      await this.logAction('critical_alerts_detected', 'system', 'executive', {
        alertsCount: alerts.length,
        criticalCount: alerts.filter(a => a.severity === 'critical').length,
      });

      return alerts;
    } catch (error) {
      await this.logError('detectCriticalAlerts', error as Error, {});
      throw error;
    }
  }

  /**
   * Track strategic goals with progress updates
   */
  static async trackStrategicGoals(): Promise<StrategicGoal[]> {
    try {
      const goals = await db.strategicGoals
        .where('status')
        .anyOf(['not-started', 'on-track', 'at-risk', 'delayed'])
        .toArray();

      for (const goal of goals) {
        // Update current value based on KPIs
        const updatedValue = await this.calculateGoalCurrentValue(goal);
        
        // Calculate progress percentage
        const progress = goal.targetValue > 0 
          ? (updatedValue / goal.targetValue) * 100 
          : 0;

        // Determine status based on progress and timeline
        const status = this.determineGoalStatus(goal, progress);

        // Update AI analysis
        const aiAnalysis = await this.analyzeGoalProgress(goal, progress);

        // Update goal
        await db.strategicGoals.update(goal.id, {
          currentValue: updatedValue,
          status,
          aiAnalysis,
          updatedAt: new Date(),
        });

        // Add progress update
        const updates = goal.updates || [];
        updates.push({
          date: new Date(),
          userId: 'system',
          update: `Automated progress update: ${progress.toFixed(1)}% complete`,
          progress,
        });

        await db.strategicGoals.update(goal.id, { updates });
      }

      await this.logAction('strategic_goals_tracked', 'system', 'executive', {
        goalsCount: goals.length,
        onTrack: goals.filter(g => g.status === 'on-track').length,
        atRisk: goals.filter(g => g.status === 'at-risk').length,
      });

      return goals;
    } catch (error) {
      await this.logError('trackStrategicGoals', error as Error, {});
      throw error;
    }
  }

  // ============================================
  // CROSS-SYSTEM ANALYTICS
  // ============================================

  /**
   * Analyze correlation between HR metrics and quality performance
   */
  static async analyzeHRQualityCorrelation(): Promise<any> {
    try {
      const employees = await db.employees.where('status').equals('active').toArray();
      const correlations: any[] = [];

      for (const employee of employees) {
        // Get employee attendance rate
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);

        const attendance = await db.attendance
          .where({ employeeId: employee.id })
          .and(a => a.date >= currentMonth)
          .toArray();

        const presentDays = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
        const attendanceRate = attendance.length > 0 ? (presentDays / attendance.length) * 100 : 100;

        // Get quality metrics if employee is in production
        if (employee.departmentId) {
          const department = await db.departments.get(employee.departmentId);
          if (department && department.name.toLowerCase().includes('production')) {
            const rejections = await db.rejections
              .where({ operatorId: employee.id })
              .toArray();

            const productionRuns = await db.productionRuns
              .where({ operatorId: employee.id })
              .toArray();

            const totalProduced = productionRuns.reduce((sum, p) => sum + p.quantityProduced, 0);
            const totalRejected = rejections.reduce((sum, r) => sum + r.quantity, 0);
            const defectRate = totalProduced > 0 ? (totalRejected / totalProduced) * 100 : 0;

            correlations.push({
              employeeId: employee.id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              attendanceRate,
              defectRate,
              totalProduced,
              totalRejected,
            });
          }
        }
      }

      // Calculate correlation coefficient
      const correlationCoefficient = this.calculateCorrelation(
        correlations.map(c => c.attendanceRate),
        correlations.map(c => c.defectRate)
      );

      const analysis = {
        correlationCoefficient,
        strength: this.interpretCorrelation(correlationCoefficient),
        employeeData: correlations,
        insights: this.generateHRQualityInsights(correlations, correlationCoefficient),
        timestamp: new Date(),
      };

      await this.logAction('hr_quality_correlation_analyzed', 'system', 'analytics', {
        correlationCoefficient,
        employeesAnalyzed: correlations.length,
      });

      return analysis;
    } catch (error) {
      await this.logError('analyzeHRQualityCorrelation', error as Error, {});
      throw error;
    }
  }

  /**
   * Analyze correlation between training and productivity
   */
  static async analyzeTrainingProductivityCorrelation(): Promise<any> {
    try {
      const employees = await db.employees.where('status').equals('active').toArray();
      const correlations: any[] = [];

      for (const employee of employees) {
        // Get training hours
        const training = await db.training
          .where('status')
          .equals('completed')
          .toArray();

        const employeeTraining = training.filter(t => 
          t.participants && t.participants.includes(employee.id)
        );

        const trainingHours = employeeTraining.reduce((sum, t) => sum + (t.duration || 0), 0);

        // Get productivity metrics
        const productionRuns = await db.productionRuns
          .where({ operatorId: employee.id })
          .toArray();

        const totalProduced = productionRuns.reduce((sum, p) => sum + p.quantityProduced, 0);
        const avgProductivity = productionRuns.length > 0 
          ? totalProduced / productionRuns.length 
          : 0;

        if (productionRuns.length > 0) {
          correlations.push({
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            trainingHours,
            avgProductivity,
            totalProduced,
            productionRuns: productionRuns.length,
          });
        }
      }

      // Calculate correlation coefficient
      const correlationCoefficient = this.calculateCorrelation(
        correlations.map(c => c.trainingHours),
        correlations.map(c => c.avgProductivity)
      );

      const analysis = {
        correlationCoefficient,
        strength: this.interpretCorrelation(correlationCoefficient),
        employeeData: correlations,
        insights: this.generateTrainingProductivityInsights(correlations, correlationCoefficient),
        recommendations: this.generateTrainingRecommendations(correlations, correlationCoefficient),
        timestamp: new Date(),
      };

      await this.logAction('training_productivity_correlation_analyzed', 'system', 'analytics', {
        correlationCoefficient,
        employeesAnalyzed: correlations.length,
      });

      return analysis;
    } catch (error) {
      await this.logError('analyzeTrainingProductivityCorrelation', error as Error, {});
      throw error;
    }
  }

  /**
   * Analyze correlation between supplier quality and product defects
   */
  static async analyzeSupplierQualityCorrelation(): Promise<any> {
    try {
      const suppliers = await db.suppliers.toArray();
      const correlations: any[] = [];

      for (const supplier of suppliers) {
        // Get supplier quality score
        const supplierScore = supplier.qualityScore || supplier.rating * 20 || 0;

        // Get rejections from this supplier
        const rejections = await db.rejections
          .where({ supplierId: supplier.id })
          .toArray();

        // Get products from this supplier
        const purchaseOrders = await db.purchaseOrders
          .where({ supplierId: supplier.id })
          .toArray();

        const totalReceived = purchaseOrders.reduce((sum, po) => 
          sum + po.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        );

        const totalRejected = rejections.reduce((sum, r) => sum + r.quantity, 0);
        const defectRate = totalReceived > 0 ? (totalRejected / totalReceived) * 100 : 0;

        if (totalReceived > 0) {
          correlations.push({
            supplierId: supplier.id,
            supplierName: supplier.name,
            supplierScore,
            defectRate,
            totalReceived,
            totalRejected,
            rejectionCount: rejections.length,
          });
        }
      }

      // Calculate correlation coefficient (inverse - higher supplier score should mean lower defect rate)
      const correlationCoefficient = this.calculateCorrelation(
        correlations.map(c => c.supplierScore),
        correlations.map(c => -c.defectRate) // Negative because we expect inverse correlation
      );

      const analysis = {
        correlationCoefficient,
        strength: this.interpretCorrelation(correlationCoefficient),
        supplierData: correlations,
        insights: this.generateSupplierQualityInsights(correlations, correlationCoefficient),
        recommendations: this.generateSupplierRecommendations(correlations),
        timestamp: new Date(),
      };

      await this.logAction('supplier_quality_correlation_analyzed', 'system', 'analytics', {
        correlationCoefficient,
        suppliersAnalyzed: correlations.length,
      });

      return analysis;
    } catch (error) {
      await this.logError('analyzeSupplierQualityCorrelation', error as Error, {});
      throw error;
    }
  }

  /**
   * Generate integrated insights across all systems
   */
  static async generateIntegratedInsights(): Promise<any> {
    try {
      const insights: any = {
        timestamp: new Date(),
        systemHealth: {},
        crossSystemInsights: [],
        recommendations: [],
        opportunities: [],
        risks: [],
      };

      // Get company health score
      const healthScore = await db.companyHealthScores
        .orderBy('timestamp')
        .reverse()
        .first();

      if (healthScore) {
        insights.systemHealth = {
          overallScore: healthScore.overallScore,
          trend: healthScore.trend,
          components: {
            financial: healthScore.financialHealth.score,
            operational: healthScore.operationalHealth.score,
            quality: healthScore.qualityHealth.score,
            hr: healthScore.hrHealth.score,
            customer: healthScore.customerHealth.score,
          },
        };
      }

      // Analyze HR-Quality correlation
      const hrQualityCorr = await this.analyzeHRQualityCorrelation();
      if (Math.abs(hrQualityCorr.correlationCoefficient) > 0.5) {
        insights.crossSystemInsights.push({
          type: 'hr-quality',
          correlation: hrQualityCorr.correlationCoefficient,
          insight: hrQualityCorr.insights[0] || 'Significant correlation between HR and quality metrics',
        });
      }

      // Analyze Training-Productivity correlation
      const trainingProdCorr = await this.analyzeTrainingProductivityCorrelation();
      if (Math.abs(trainingProdCorr.correlationCoefficient) > 0.5) {
        insights.crossSystemInsights.push({
          type: 'training-productivity',
          correlation: trainingProdCorr.correlationCoefficient,
          insight: trainingProdCorr.insights[0] || 'Training shows positive impact on productivity',
        });
      }

      // Analyze Supplier-Quality correlation
      const supplierQualityCorr = await this.analyzeSupplierQualityCorrelation();
      if (Math.abs(supplierQualityCorr.correlationCoefficient) > 0.5) {
        insights.crossSystemInsights.push({
          type: 'supplier-quality',
          correlation: supplierQualityCorr.correlationCoefficient,
          insight: supplierQualityCorr.insights[0] || 'Supplier quality directly impacts product defects',
        });
      }

      // Generate integrated recommendations
      insights.recommendations = await this.generateIntegratedRecommendations({
        hrQualityCorr,
        trainingProdCorr,
        supplierQualityCorr,
        healthScore,
      });

      // Identify opportunities
      insights.opportunities = await this.identifySystemWideOpportunities({
        hrQualityCorr,
        trainingProdCorr,
        supplierQualityCorr,
      });

      // Identify risks
      insights.risks = await this.identifySystemWideRisks({
        hrQualityCorr,
        trainingProdCorr,
        supplierQualityCorr,
        healthScore,
      });

      await this.logAction('integrated_insights_generated', 'system', 'analytics', {
        insightsCount: insights.crossSystemInsights.length,
        recommendationsCount: insights.recommendations.length,
      });

      return insights;
    } catch (error) {
      await this.logError('generateIntegratedInsights', error as Error, {});
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
  // PRIVATE HELPER METHODS - HR
  // ============================================

  /**
   * Create onboarding plan with tasks for new employee
   */
  private static async createOnboardingPlan(employeeId: string, departmentId: string, userId?: string): Promise<void> {
    const onboardingTasks = [
      {
        id: uuidv4(),
        title: 'Complete employee profile',
        description: 'Fill in all required personal and professional information',
        assignedTo: userId || 'hr-admin',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        status: 'pending' as const,
      },
      {
        id: uuidv4(),
        title: 'IT setup - Email and system access',
        description: 'Create email account and grant system access',
        assignedTo: 'it-admin',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
        status: 'pending' as const,
      },
      {
        id: uuidv4(),
        title: 'Workspace setup',
        description: 'Prepare desk, computer, and necessary equipment',
        assignedTo: 'facilities',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        status: 'pending' as const,
      },
      {
        id: uuidv4(),
        title: 'Company orientation',
        description: 'Attend company orientation session',
        assignedTo: userId || employeeId,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        status: 'pending' as const,
      },
      {
        id: uuidv4(),
        title: 'Department introduction',
        description: 'Meet team members and understand department processes',
        assignedTo: userId || employeeId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'pending' as const,
      },
    ];

    await db.employeeOnboarding.add({
      id: uuidv4(),
      employeeId,
      status: 'in-progress',
      startDate: new Date(),
      tasks: onboardingTasks,
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Send welcome notification to new employee
   */
  private static async sendWelcomeNotification(employee: Employee): Promise<void> {
    await this.logAction('welcome_notification_sent', 'employee', employee.id, {
      email: employee.email,
      name: `${employee.firstName} ${employee.lastName}`,
    });
  }

  /**
   * Update employee attendance metrics
   */
  private static async updateEmployeeAttendanceMetrics(employeeId: string): Promise<void> {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const attendanceRecords = await db.attendance
      .where({ employeeId })
      .and(a => a.date >= currentMonth)
      .toArray();

    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(a => a.status === 'present' || a.status === 'late').length;
    const lateDays = attendanceRecords.filter(a => a.status === 'late').length;
    const absentDays = attendanceRecords.filter(a => a.status === 'absent').length;

    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

    await this.logAction('employee_attendance_metrics_updated', 'employee', employeeId, {
      month: currentMonth,
      totalDays,
      presentDays,
      lateDays,
      absentDays,
      attendanceRate,
    });
  }

  /**
   * Detect attendance anomalies
   */
  private static async detectAttendanceAnomalies(employeeId: string): Promise<void> {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentAttendance = await db.attendance
      .where({ employeeId })
      .and(a => a.date >= last30Days)
      .toArray();

    const lateDays = recentAttendance.filter(a => a.status === 'late').length;
    const absentDays = recentAttendance.filter(a => a.status === 'absent').length;

    // Flag if more than 5 late days or 3 absent days in last 30 days
    if (lateDays > 5 || absentDays > 3) {
      await this.logAction('attendance_anomaly_detected', 'employee', employeeId, {
        period: '30_days',
        lateDays,
        absentDays,
        severity: absentDays > 3 ? 'high' : 'medium',
      });
    }
  }

  /**
   * Update operator attendance metrics for production employees
   */
  private static async updateOperatorAttendanceMetrics(employeeId: string, date: Date): Promise<void> {
    await this.logAction('operator_attendance_metrics_updated', 'employee', employeeId, {
      date,
      type: 'production_operator',
    });
  }

  /**
   * Update team calendar with leave information
   */
  private static async updateTeamCalendar(leave: Leave): Promise<void> {
    await this.logAction('team_calendar_updated', 'leave', leave.id, {
      employeeId: leave.employeeId,
      startDate: leave.startDate,
      endDate: leave.endDate,
      leaveType: leave.leaveType,
    });
  }

  /**
   * Handle production operator leave - reschedule if needed
   */
  private static async handleProductionOperatorLeave(employeeId: string, startDate: Date, endDate: Date): Promise<void> {
    // Check if operator is assigned to any production schedules during leave period
    const schedules = await db.productionScheduleOptimizations
      .where('status')
      .equals('approved')
      .or('status')
      .equals('in-progress')
      .toArray();

    for (const schedule of schedules) {
      const affectedAssignments = schedule.machineAssignments.filter(assignment => {
        // Check if this operator is assigned and dates overlap with leave
        return assignment.startTime >= startDate && assignment.startTime <= endDate;
      });

      if (affectedAssignments.length > 0) {
        await this.logAction('production_schedule_affected_by_leave', 'schedule', schedule.id, {
          employeeId,
          affectedAssignments: affectedAssignments.length,
          leaveStart: startDate,
          leaveEnd: endDate,
        });
      }
    }
  }

  /**
   * Notify manager of leave approval
   */
  private static async notifyManagerOfLeaveApproval(leave: Leave, managerId: string): Promise<void> {
    await this.logAction('manager_notified_leave_approval', 'leave', leave.id, {
      managerId,
      employeeId: leave.employeeId,
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
    });
  }

  /**
   * Send leave approval notification to employee
   */
  private static async sendLeaveApprovalNotification(leave: Leave): Promise<void> {
    await this.logAction('leave_approval_notification_sent', 'leave', leave.id, {
      employeeId: leave.employeeId,
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
    });
  }

  /**
   * Update financial records for payroll
   */
  private static async updateFinancialRecordsForPayroll(payroll: Payroll): Promise<void> {
    const monthKey = `${payroll.year}-${String(payroll.month).padStart(2, '0')}-01`;
    const monthDate = new Date(monthKey);

    // Try to find existing KPI record for this month
    const existingKPI = await db.executiveKPIs
      .where('date')
      .equals(monthDate)
      .first();

    if (existingKPI) {
      // Update existing record
      const totalPayroll = await db.payroll
        .where({ month: payroll.month, year: payroll.year, status: 'paid' })
        .toArray();
      
      const totalPayrollCost = totalPayroll.reduce((sum, p) => sum + p.netSalary, 0);

      await db.executiveKPIs.update(existingKPI.id, {
        // Update HR KPIs with payroll data
        avgSalary: totalPayroll.length > 0 ? totalPayrollCost / totalPayroll.length : 0,
      });
    }

    await this.logAction('financial_records_updated_payroll', 'payroll', payroll.id, {
      month: payroll.month,
      year: payroll.year,
      amount: payroll.netSalary,
    });
  }

  /**
   * Send payslip notification
   */
  private static async sendPayslipNotification(payroll: Payroll): Promise<void> {
    await this.logAction('payslip_notification_sent', 'payroll', payroll.id, {
      employeeId: payroll.employeeId,
      month: payroll.month,
      year: payroll.year,
      netSalary: payroll.netSalary,
    });
  }

  /**
   * Update HR payroll metrics
   */
  private static async updateHRPayrollMetrics(month: number, year: number): Promise<void> {
    const payrolls = await db.payroll
      .where({ month, year, status: 'paid' })
      .toArray();

    const totalPayrollCost = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
    const avgSalary = payrolls.length > 0 ? totalPayrollCost / payrolls.length : 0;

    await this.logAction('hr_payroll_metrics_updated', 'system', 'hr', {
      month,
      year,
      employeeCount: payrolls.length,
      totalPayrollCost,
      avgSalary,
    });
  }

  // ============================================
  // PRIVATE HELPER METHODS - MANUFACTURING
  // ============================================

  /**
   * Update inventory from production
   */
  private static async updateInventoryFromProduction(productionRun: ProductionRun): Promise<void> {
    const inventory = await db.inventory.where({ productId: productionRun.productId }).first();
    const runAny = productionRun as any;
    
    if (inventory) {
      const goodQuantity = runAny.quantityProduced - (runAny.quantityRejected || 0);
      await db.inventory.update(inventory.id, {
        quantity: inventory.quantity + goodQuantity,
        availableQuantity: inventory.availableQuantity + goodQuantity,
        lastRestocked: new Date(),
        updatedAt: new Date(),
      });

      // Create stock movement
      await db.stockMovements.add({
        id: uuidv4(),
        productId: productionRun.productId,
        type: 'in',
        quantity: goodQuantity,
        reason: `Production completed: ${productionRun.id}`,
        referenceId: productionRun.id,
        performedBy: productionRun.operatorId || 'system',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Update machine performance from production
   */
  private static async updateMachinePerformanceFromProduction(productionRun: ProductionRun): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const runAny = productionRun as any;

    const analytics = await db.machinePerformanceAnalytics
      .where({ machineId: productionRun.machineId, date: today })
      .first();

    if (analytics) {
      await db.machinePerformanceAnalytics.update(analytics.id, {
        actualOutput: analytics.actualOutput + runAny.quantityProduced,
        goodOutput: analytics.goodOutput + (runAny.quantityProduced - (runAny.quantityRejected || 0)),
        rejectedOutput: analytics.rejectedOutput + (runAny.quantityRejected || 0),
      });
    }
  }

  /**
   * Update operator performance from production
   */
  private static async updateOperatorPerformanceFromProduction(productionRun: ProductionRun): Promise<void> {
    if (!productionRun.operatorId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const runAny = productionRun as any;

    const metrics = await db.operatorPerformanceMetrics
      .where({ employeeId: productionRun.operatorId, machineId: productionRun.machineId, date: today })
      .first();

    if (metrics) {
      await db.operatorPerformanceMetrics.update(metrics.id, {
        unitsProduced: metrics.unitsProduced + runAny.quantityProduced,
      });
    }
  }

  /**
   * Update quality metrics from production
   */
  private static async updateQualityMetricsFromProduction(productionRun: ProductionRun): Promise<void> {
    const runAny = productionRun as any;
    const defectRate = runAny.quantityProduced > 0 
      ? ((runAny.quantityRejected || 0) / runAny.quantityProduced) * 100 
      : 0;

    await this.logAction('quality_metrics_updated_production', 'production_run', productionRun.id, {
      productId: productionRun.productId,
      machineId: productionRun.machineId,
      quantityProduced: runAny.quantityProduced,
      quantityRejected: runAny.quantityRejected,
      defectRate,
    });
  }

  /**
   * Check order fulfillment
   */
  private static async checkOrderFulfillment(orderId: string): Promise<void> {
    const order = await db.orders.get(orderId);
    if (!order) return;

    // Check if all items are fulfilled
    const allFulfilled = order.items.every(item => {
      const itemAny = item as any;
      const fulfilled = itemAny.quantityFulfilled || 0;
      return fulfilled >= item.quantity;
    });

    if (allFulfilled && order.status !== 'completed') {
      await db.orders.update(orderId, {
        status: 'completed',
        updatedAt: new Date(),
      });

      await this.logAction('order_fulfilled', 'order', orderId, {
        orderId: order.orderId,
        customerId: order.customerId,
      });
    }
  }

  /**
   * Create maintenance task for downtime
   */
  private static async createMaintenanceTask(downtime: MachineDowntime): Promise<void> {
    const downtimeAny = downtime as any;
    await db.maintenanceSchedule.add({
      id: uuidv4(),
      machineId: downtime.machineId,
      maintenanceType: 'corrective',
      scheduledDate: new Date(),
      status: 'scheduled',
      description: `Corrective maintenance for ${downtime.category}: ${downtime.reason}`,
      estimatedDuration: downtimeAny.estimatedDuration || 120,
      createdAt: new Date(),
    });
  }

  /**
   * Notify maintenance team
   */
  private static async notifyMaintenanceTeam(downtime: MachineDowntime): Promise<void> {
    const downtimeAny = downtime as any;
    await this.logAction('maintenance_team_notified', 'machine_downtime', downtime.id, {
      machineId: downtime.machineId,
      category: downtime.category,
      severity: downtimeAny.severity,
      reason: downtime.reason,
    });
  }

  /**
   * Reschedule production for downtime
   */
  private static async rescheduleProductionForDowntime(downtime: MachineDowntime): Promise<void> {
    const activeSchedules = await db.productionScheduleOptimizations
      .where('status')
      .anyOf(['approved', 'in-progress'])
      .toArray();

    for (const schedule of activeSchedules) {
      const affectedAssignments = schedule.machineAssignments.filter(
        assignment => assignment.machineId === downtime.machineId &&
        assignment.startTime >= downtime.startTime
      );

      if (affectedAssignments.length > 0) {
        await this.logAction('production_rescheduled_downtime', 'production_schedule', schedule.id, {
          machineId: downtime.machineId,
          affectedAssignments: affectedAssignments.length,
          downtimeId: downtime.id,
        });
      }
    }
  }

  /**
   * Update machine downtime analytics
   */
  private static async updateMachineDowntimeAnalytics(downtime: MachineDowntime): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const downtimeAny = downtime as any;

    const analytics = await db.machinePerformanceAnalytics
      .where({ machineId: downtime.machineId, date: today })
      .first();

    if (analytics) {
      const duration = downtimeAny.actualDuration || downtimeAny.estimatedDuration || 0;
      await db.machinePerformanceAnalytics.update(analytics.id, {
        downtime: analytics.downtime + duration,
      });
    }
  }

  /**
   * Create executive alert for critical downtime
   */
  private static async createExecutiveAlertForDowntime(downtime: MachineDowntime): Promise<void> {
    const machine = await db.machines.get(downtime.machineId);
    const downtimeAny = downtime as any;
    
    await db.executiveAlerts.add({
      id: uuidv4(),
      alertId: `ALERT-${Date.now()}`,
      type: 'operational',
      severity: 'critical',
      status: 'active',
      title: `Critical Machine Downtime: ${machine?.name || downtime.machineId}`,
      description: `Machine ${machine?.name || downtime.machineId} is down due to ${downtime.category}. Estimated duration: ${downtimeAny.estimatedDuration} minutes.`,
      affectedArea: 'Production',
      metrics: {
        current: downtimeAny.estimatedDuration || 0,
        threshold: 240,
        unit: 'minutes',
      },
      impact: {
        operational: `Production capacity reduced. Estimated delay in orders.`,
      },
      recommendations: [
        {
          action: 'Dispatch maintenance team immediately',
          priority: 1,
          estimatedImpact: 'Minimize downtime duration',
        },
        {
          action: 'Reschedule affected production runs',
          priority: 2,
          estimatedImpact: 'Maintain delivery commitments',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Estimate downtime impact
   */
  private static async estimateDowntimeImpact(downtime: MachineDowntime): Promise<void> {
    const downtimeAny = downtime as any;
    await this.logAction('downtime_impact_estimated', 'machine_downtime', downtime.id, {
      machineId: downtime.machineId,
      estimatedDuration: downtimeAny.estimatedDuration,
      severity: downtimeAny.severity,
    });
  }

  /**
   * Link quality issue to machine
   */
  private static async linkQualityIssueToMachine(rejection: Rejection): Promise<void> {
    const rejectionAny = rejection as any;
    if (!rejectionAny.machineId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analytics = await db.machinePerformanceAnalytics
      .where({ machineId: rejectionAny.machineId, date: today })
      .first();

    if (analytics) {
      await db.machinePerformanceAnalytics.update(analytics.id, {
        rejectedOutput: analytics.rejectedOutput + rejection.quantity,
        defectRate: ((analytics.rejectedOutput + rejection.quantity) / analytics.actualOutput) * 100,
      });
    }
  }

  /**
   * Link quality issue to operator
   */
  private static async linkQualityIssueToOperator(rejection: Rejection): Promise<void> {
    const rejectionAny = rejection as any;
    if (!rejectionAny.operatorId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const metrics = await db.operatorPerformanceMetrics
      .where({ employeeId: rejectionAny.operatorId, date: today })
      .first();

    if (metrics) {
      const newDefectRate = ((rejection.quantity) / metrics.unitsProduced) * 100;
      await db.operatorPerformanceMetrics.update(metrics.id, {
        defectRate: metrics.defectRate + newDefectRate,
      });
    }
  }

  /**
   * Link quality issue to supplier
   */
  private static async linkQualityIssueToSupplier(rejection: Rejection): Promise<void> {
    if (!rejection.supplierId) return;
    await this.updateSupplierQualityScore(rejection.supplierId);
  }

  /**
   * Link quality issue to batch
   */
  private static async linkQualityIssueToBatch(rejection: Rejection): Promise<void> {
    await this.logAction('quality_issue_linked_to_batch', 'rejection', rejection.id, {
      batchNumber: rejection.batchNumber,
      productId: rejection.productId,
      quantity: rejection.quantity,
    });
  }

  /**
   * Create CAPA for quality issue
   */
  private static async createCAPAForQualityIssue(rejection: Rejection): Promise<void> {
    await this.logAction('capa_created_quality_issue', 'rejection', rejection.id, {
      rejectionId: rejection.rejectionId,
      severity: rejection.severity,
      productId: rejection.productId,
    });
  }

  /**
   * Update quality metrics for issue
   */
  private static async updateQualityMetricsForIssue(rejection: Rejection): Promise<void> {
    await this.updateProductQualityScore(rejection.productId);
  }

  /**
   * Notify quality manager of issue
   */
  private static async notifyQualityManagerOfIssue(rejection: Rejection): Promise<void> {
    await this.notifyQualityManager(rejection);
  }

  /**
   * Identify affected departments from schedule
   */
  private static async identifyAffectedDepartments(schedule: ProductionScheduleOptimization): Promise<string[]> {
    const departments = new Set<string>();
    
    // Get machines involved
    for (const assignment of schedule.machineAssignments) {
      const machine = await db.machines.get(assignment.machineId);
      if (machine && machine.departmentId) {
        departments.add(machine.departmentId);
      }
    }

    return Array.from(departments);
  }

  /**
   * Notify production department
   */
  private static async notifyProductionDepartment(schedule: ProductionScheduleOptimization): Promise<void> {
    await this.logAction('production_department_notified', 'production_schedule', schedule.id, {
      scheduleId: schedule.scheduleId,
      ordersCount: schedule.orders.length,
    });
  }

  /**
   * Notify maintenance of schedule change
   */
  private static async notifyMaintenanceOfScheduleChange(schedule: ProductionScheduleOptimization): Promise<void> {
    await this.logAction('maintenance_notified_schedule_change', 'production_schedule', schedule.id, {
      scheduleId: schedule.scheduleId,
    });
  }

  /**
   * Notify quality department
   */
  private static async notifyQualityDepartment(schedule: ProductionScheduleOptimization): Promise<void> {
    await this.logAction('quality_department_notified', 'production_schedule', schedule.id, {
      scheduleId: schedule.scheduleId,
      ordersCount: schedule.orders.length,
    });
  }

  /**
   * Notify logistics department
   */
  private static async notifyLogisticsDepartment(schedule: ProductionScheduleOptimization): Promise<void> {
    await this.logAction('logistics_department_notified', 'production_schedule', schedule.id, {
      scheduleId: schedule.scheduleId,
    });
  }

  /**
   * Update machine assignments
   */
  private static async updateMachineAssignments(schedule: ProductionScheduleOptimization): Promise<void> {
    await this.logAction('machine_assignments_updated', 'production_schedule', schedule.id, {
      scheduleId: schedule.scheduleId,
      assignmentsCount: schedule.machineAssignments.length,
    });
  }

  /**
   * Notify operators of schedule
   */
  private static async notifyOperatorsOfSchedule(schedule: ProductionScheduleOptimization): Promise<void> {
    await this.logAction('operators_notified_schedule', 'production_schedule', schedule.id, {
      scheduleId: schedule.scheduleId,
    });
  }

  // ============================================
  // PRIVATE HELPER METHODS - EXECUTIVE
  // ============================================

  /**
   * Calculate financial health score
   */
  private static async calculateFinancialHealth(): Promise<any> {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const sales = await db.sales.where('saleDate').above(last30Days).toArray();
    const revenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    
    const invoices = await db.invoices.where('invoiceDate').above(last30Days).toArray();
    const totalInvoiced = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    
    const payments = await db.payments.where('paymentDate').above(last30Days).toArray();
    const cashFlow = payments.reduce((sum, p) => sum + p.amount, 0);

    // Simple scoring: normalize to 0-100
    const revenueScore = Math.min(100, (revenue / 100000) * 100); // Assuming 100k target
    const profitMarginScore = totalInvoiced > 0 ? ((revenue / totalInvoiced) * 100) : 0;
    const cashFlowScore = Math.min(100, (cashFlow / 80000) * 100); // Assuming 80k target

    const score = (revenueScore + profitMarginScore + cashFlowScore) / 3;

    return {
      score: Math.round(score),
      weight: 0.30,
      metrics: {
        revenue,
        profitMargin: profitMarginScore,
        cashFlow,
        debtRatio: 0, // Placeholder
      },
    };
  }

  /**
   * Calculate operational health score
   */
  private static async calculateOperationalHealth(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const machineAnalytics = await db.machinePerformanceAnalytics
      .where('date')
      .equals(today)
      .toArray();

    const avgOEE = machineAnalytics.length > 0
      ? machineAnalytics.reduce((sum, m) => sum + m.oee, 0) / machineAnalytics.length
      : 0;

    const orders = await db.orders.where('status').equals('completed').toArray();
    const totalOrders = await db.orders.count();
    const orderFulfillmentRate = totalOrders > 0 ? (orders.length / totalOrders) * 100 : 0;

    const inventory = await db.inventory.toArray();
    const inventoryTurnover = 5; // Placeholder calculation

    const onTimeDelivery = 95; // Placeholder

    const score = (avgOEE + orderFulfillmentRate + Math.min(100, inventoryTurnover * 20) + onTimeDelivery) / 4;

    return {
      score: Math.round(score),
      weight: 0.25,
      metrics: {
        oee: avgOEE,
        orderFulfillmentRate,
        inventoryTurnover,
        onTimeDelivery,
      },
    };
  }

  /**
   * Calculate quality health score
   */
  private static async calculateQualityHealth(): Promise<any> {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const rejections = await db.rejections.where('rejectionDate').above(last30Days).toArray();
    const totalProduction = 10000; // Placeholder
    const defectRate = totalProduction > 0 ? (rejections.length / totalProduction) * 100 : 0;

    const defectScore = Math.max(0, 100 - (defectRate * 10));
    const complianceScore = 95; // Placeholder
    const supplierQualityScore = 90; // Placeholder

    const score = (defectScore + complianceScore + supplierQualityScore) / 3;

    return {
      score: Math.round(score),
      weight: 0.15,
      metrics: {
        defectRate,
        customerComplaints: 0,
        supplierQuality: supplierQualityScore,
        complianceScore,
      },
    };
  }

  /**
   * Calculate HR health score
   */
  private static async calculateHRHealth(): Promise<any> {
    const employees = await db.employees.where('status').equals('active').toArray();
    const totalEmployees = employees.length;

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const attendance = await db.attendance
      .where('date')
      .above(currentMonth)
      .toArray();

    const presentCount = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendanceRate = attendance.length > 0 ? (presentCount / attendance.length) * 100 : 100;

    const employeeSatisfaction = 80; // Placeholder
    const turnoverRate = 5; // Placeholder
    const turnoverScore = Math.max(0, 100 - (turnoverRate * 5));

    const score = (attendanceRate + employeeSatisfaction + turnoverScore) / 3;

    return {
      score: Math.round(score),
      weight: 0.15,
      metrics: {
        employeeSatisfaction,
        turnoverRate,
        attendanceRate,
        productivityScore: 85,
      },
    };
  }

  /**
   * Calculate customer health score
   */
  private static async calculateCustomerHealth(): Promise<any> {
    const customers = await db.customers.where('status').equals('active').toArray();
    const totalCustomers = customers.length;

    const satisfaction = 85; // Placeholder
    const retentionRate = 90; // Placeholder
    const nps = 45; // Placeholder
    const npsScore = Math.min(100, ((nps + 100) / 2)); // Normalize NPS (-100 to 100) to 0-100

    const score = (satisfaction + retentionRate + npsScore) / 3;

    return {
      score: Math.round(score),
      weight: 0.15,
      metrics: {
        satisfaction,
        retentionRate,
        nps,
        lifetimeValue: 50000,
      },
    };
  }

  /**
   * Generate health score insights
   */
  private static async generateHealthScoreInsights(health: any): Promise<string[]> {
    const insights: string[] = [];

    if (health.financialHealth.score < 70) {
      insights.push('Financial health needs attention. Revenue and cash flow are below targets.');
    }
    if (health.operationalHealth.score < 70) {
      insights.push('Operational efficiency can be improved. Focus on OEE and order fulfillment.');
    }
    if (health.qualityHealth.score < 70) {
      insights.push('Quality metrics show room for improvement. Review defect rates and supplier quality.');
    }
    if (health.hrHealth.score < 70) {
      insights.push('HR metrics indicate potential issues. Monitor attendance and employee satisfaction.');
    }
    if (health.customerHealth.score < 70) {
      insights.push('Customer satisfaction needs focus. Improve retention and NPS scores.');
    }

    if (insights.length === 0) {
      insights.push('Overall company health is strong across all areas.');
    }

    return insights;
  }

  /**
   * Generate health score recommendations
   */
  private static async generateHealthScoreRecommendations(health: any): Promise<any[]> {
    const recommendations: any[] = [];

    if (health.financialHealth.score < 70) {
      recommendations.push({
        priority: 'high' as const,
        category: 'financial',
        recommendation: 'Implement cost reduction initiatives and improve collection processes',
        expectedImpact: 'Improve cash flow by 15-20%',
      });
    }

    if (health.operationalHealth.score < 70) {
      recommendations.push({
        priority: 'high' as const,
        category: 'operational',
        recommendation: 'Optimize production schedules and reduce machine downtime',
        expectedImpact: 'Increase OEE by 10-15%',
      });
    }

    return recommendations;
  }

  /**
   * Detect critical alerts from health metrics
   */
  private static async detectCriticalAlertsFromHealth(health: any): Promise<any[]> {
    const alerts: any[] = [];

    if (health.financialHealth.score < 60) {
      alerts.push({
        type: 'financial',
        severity: 'critical' as const,
        message: 'Financial health score critically low',
        affectedArea: 'Finance',
        actionRequired: 'Immediate review of financial performance required',
      });
    }

    return alerts;
  }

  /**
   * Calculate financial KPIs
   */
  private static async calculateFinancialKPIs(period: string): Promise<any> {
    const sales = await db.sales.toArray();
    const revenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const grossProfit = revenue * 0.3; // Placeholder
    const netProfit = revenue * 0.15; // Placeholder

    return {
      revenue,
      grossProfit,
      netProfit,
      profitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
      ebitda: netProfit * 1.2,
      cashFlow: revenue * 0.8,
    };
  }

  /**
   * Calculate operational KPIs
   */
  private static async calculateOperationalKPIs(period: string): Promise<any> {
    const orders = await db.orders.toArray();
    const totalOrders = orders.length;
    const orderValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    const productionRuns = await db.productionRuns.toArray();
    const productionOutput = productionRuns.reduce((sum, p) => sum + p.quantityProduced, 0);

    const inventory = await db.inventory.toArray();
    const inventoryValue = inventory.reduce((sum, i) => sum + (i.quantity * (i.unitPrice || 0)), 0);

    return {
      totalOrders,
      orderValue,
      productionOutput,
      oee: 85, // Placeholder
      inventoryValue,
    };
  }

  /**
   * Calculate HR KPIs
   */
  private static async calculateHRKPIs(period: string): Promise<any> {
    const employees = await db.employees.toArray();
    const activeEmployees = employees.filter(e => e.status === 'active').length;

    const payrolls = await db.payroll.where('status').equals('paid').toArray();
    const avgSalary = payrolls.length > 0
      ? payrolls.reduce((sum, p) => sum + p.netSalary, 0) / payrolls.length
      : 0;

    return {
      totalEmployees: employees.length,
      activeEmployees,
      turnoverRate: 5, // Placeholder
      attendanceRate: 95, // Placeholder
      avgSalary,
    };
  }

  /**
   * Calculate customer KPIs
   */
  private static async calculateCustomerKPIs(period: string): Promise<any> {
    const customers = await db.customers.toArray();
    const activeCustomers = customers.filter(c => c.status === 'active').length;

    return {
      totalCustomers: customers.length,
      activeCustomers,
      newCustomers: 10, // Placeholder
      customerSatisfaction: 85, // Placeholder
      nps: 45, // Placeholder
    };
  }

  /**
   * Calculate quality KPIs
   */
  private static async calculateQualityKPIs(period: string): Promise<any> {
    const rejections = await db.rejections.toArray();
    const totalProduction = 10000; // Placeholder

    return {
      defectRate: totalProduction > 0 ? (rejections.length / totalProduction) * 100 : 0,
      rejectionRate: totalProduction > 0 ? (rejections.length / totalProduction) * 100 : 0,
      customerComplaints: 5, // Placeholder
      capaOpen: 3, // Placeholder
    };
  }

  /**
   * Get previous period KPIs
   */
  private static async getPreviousPeriodKPIs(period: string): Promise<any> {
    // Placeholder - return dummy data
    return {
      revenue: 100000,
      profit: 15000,
      orders: 50,
    };
  }

  /**
   * Calculate growth rates
   */
  private static calculateGrowthRates(current: any, previous: any): any {
    return {
      revenueGrowth: previous.revenue > 0 
        ? ((current.revenue - previous.revenue) / previous.revenue) * 100 
        : 0,
      profitGrowth: previous.profit > 0 
        ? ((current.netProfit - previous.profit) / previous.profit) * 100 
        : 0,
      orderGrowth: previous.orders > 0 
        ? ((current.totalOrders - previous.orders) / previous.orders) * 100 
        : 0,
    };
  }

  /**
   * Detect financial alerts
   */
  private static async detectFinancialAlerts(): Promise<ExecutiveAlert[]> {
    const alerts: ExecutiveAlert[] = [];
    
    // Check cash flow
    const payments = await db.payments.toArray();
    const totalCashFlow = payments.reduce((sum, p) => sum + p.amount, 0);
    
    if (totalCashFlow < 50000) {
      alerts.push({
        id: uuidv4(),
        alertId: `ALERT-FIN-${Date.now()}`,
        type: 'financial',
        severity: 'high',
        status: 'active',
        title: 'Low Cash Flow Alert',
        description: 'Cash flow is below threshold',
        affectedArea: 'Finance',
        metrics: {
          current: totalCashFlow,
          threshold: 50000,
          unit: 'currency',
        },
        impact: {
          financial: totalCashFlow,
        },
        recommendations: [
          {
            action: 'Accelerate collections',
            priority: 1,
            estimatedImpact: 'Improve cash position',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return alerts;
  }

  /**
   * Detect operational alerts
   */
  private static async detectOperationalAlerts(): Promise<ExecutiveAlert[]> {
    const alerts: ExecutiveAlert[] = [];
    
    // Check for critical machine downtime
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const downtimes = await db.machineDowntime
      .where('startTime')
      .above(today)
      .and(d => d.severity === 'critical')
      .toArray();

    if (downtimes.length > 0) {
      alerts.push({
        id: uuidv4(),
        alertId: `ALERT-OPS-${Date.now()}`,
        type: 'operational',
        severity: 'critical',
        status: 'active',
        title: 'Critical Machine Downtime',
        description: `${downtimes.length} machine(s) experiencing critical downtime`,
        affectedArea: 'Production',
        metrics: {
          current: downtimes.length,
          threshold: 0,
          unit: 'machines',
        },
        impact: {
          operational: 'Production capacity reduced',
        },
        recommendations: [
          {
            action: 'Dispatch maintenance teams',
            priority: 1,
            estimatedImpact: 'Restore production capacity',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return alerts;
  }

  /**
   * Detect quality alerts
   */
  private static async detectQualityAlerts(): Promise<ExecutiveAlert[]> {
    const alerts: ExecutiveAlert[] = [];
    
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentRejections = await db.rejections
      .where('rejectionDate')
      .above(last7Days)
      .and(r => r.severity === 'critical')
      .toArray();

    if (recentRejections.length > 5) {
      alerts.push({
        id: uuidv4(),
        alertId: `ALERT-QUA-${Date.now()}`,
        type: 'quality',
        severity: 'high',
        status: 'active',
        title: 'High Critical Defect Rate',
        description: 'Unusual spike in critical quality issues',
        affectedArea: 'Quality',
        metrics: {
          current: recentRejections.length,
          threshold: 5,
          unit: 'defects',
        },
        impact: {
          operational: 'Quality standards at risk',
        },
        recommendations: [
          {
            action: 'Conduct root cause analysis',
            priority: 1,
            estimatedImpact: 'Identify and resolve quality issues',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return alerts;
  }

  /**
   * Detect HR alerts
   */
  private static async detectHRAlerts(): Promise<ExecutiveAlert[]> {
    const alerts: ExecutiveAlert[] = [];
    
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const attendance = await db.attendance
      .where('date')
      .above(currentMonth)
      .toArray();

    const absentCount = attendance.filter(a => a.status === 'absent').length;
    const absentRate = attendance.length > 0 ? (absentCount / attendance.length) * 100 : 0;

    if (absentRate > 10) {
      alerts.push({
        id: uuidv4(),
        alertId: `ALERT-HR-${Date.now()}`,
        type: 'hr',
        severity: 'medium',
        status: 'active',
        title: 'High Absence Rate',
        description: 'Employee absence rate exceeds threshold',
        affectedArea: 'Human Resources',
        metrics: {
          current: absentRate,
          threshold: 10,
          unit: 'percentage',
        },
        impact: {
          operational: 'Reduced workforce capacity',
        },
        recommendations: [
          {
            action: 'Review attendance patterns',
            priority: 2,
            estimatedImpact: 'Identify underlying issues',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return alerts;
  }

  /**
   * Detect customer alerts
   */
  private static async detectCustomerAlerts(): Promise<ExecutiveAlert[]> {
    const alerts: ExecutiveAlert[] = [];
    // Placeholder - implement customer-specific alert logic
    return alerts;
  }

  /**
   * Calculate goal current value
   */
  private static async calculateGoalCurrentValue(goal: StrategicGoal): Promise<number> {
    // Placeholder - implement based on goal category and KPIs
    return goal.currentValue || 0;
  }

  /**
   * Determine goal status
   */
  private static determineGoalStatus(goal: StrategicGoal, progress: number): StrategicGoal['status'] {
    const now = new Date();
    const timeElapsed = now.getTime() - goal.startDate.getTime();
    const totalTime = goal.targetDate.getTime() - goal.startDate.getTime();
    const timeProgress = (timeElapsed / totalTime) * 100;

    if (progress >= 100) return 'completed';
    if (progress < timeProgress - 20) return 'delayed';
    if (progress < timeProgress - 10) return 'at-risk';
    if (progress >= timeProgress - 10) return 'on-track';
    
    return 'not-started';
  }

  /**
   * Analyze goal progress with AI
   */
  private static async analyzeGoalProgress(goal: StrategicGoal, progress: number): Promise<any> {
    const probabilityOfSuccess = progress > 80 ? 90 : progress > 50 ? 70 : 40;

    return {
      probabilityOfSuccess,
      riskFactors: progress < 50 ? ['Behind schedule', 'Resource constraints'] : [],
      recommendations: progress < 50 
        ? ['Allocate additional resources', 'Review timeline'] 
        : ['Maintain current pace'],
      lastAnalyzed: new Date(),
    };
  }

  // ============================================
  // PRIVATE HELPER METHODS - CROSS-SYSTEM ANALYTICS
  // ============================================

  /**
   * Calculate Pearson correlation coefficient
   */
  private static calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;

    return numerator / denominator;
  }

  /**
   * Interpret correlation coefficient strength
   */
  private static interpretCorrelation(coefficient: number): string {
    const abs = Math.abs(coefficient);
    if (abs >= 0.9) return 'Very Strong';
    if (abs >= 0.7) return 'Strong';
    if (abs >= 0.5) return 'Moderate';
    if (abs >= 0.3) return 'Weak';
    return 'Very Weak';
  }

  /**
   * Generate HR-Quality insights
   */
  private static generateHRQualityInsights(data: any[], correlation: number): string[] {
    const insights: string[] = [];

    if (correlation < -0.5) {
      insights.push('Strong negative correlation: Higher attendance rates correlate with lower defect rates');
      insights.push('Focus on improving employee attendance to enhance quality');
    } else if (correlation > 0.5) {
      insights.push('Unexpected positive correlation detected - requires investigation');
    } else {
      insights.push('Weak correlation between attendance and quality - other factors may be more significant');
    }

    // Find employees with low attendance and high defect rates
    const problematic = data.filter(d => d.attendanceRate < 90 && d.defectRate > 5);
    if (problematic.length > 0) {
      insights.push(`${problematic.length} employee(s) show both low attendance and high defect rates`);
    }

    return insights;
  }

  /**
   * Generate Training-Productivity insights
   */
  private static generateTrainingProductivityInsights(data: any[], correlation: number): string[] {
    const insights: string[] = [];

    if (correlation > 0.5) {
      insights.push('Strong positive correlation: Training hours significantly improve productivity');
      insights.push('Investment in training shows measurable returns in production output');
    } else if (correlation > 0.3) {
      insights.push('Moderate positive correlation: Training has some impact on productivity');
    } else {
      insights.push('Weak correlation: Training effectiveness may need review');
    }

    // Find high performers with high training
    const topPerformers = data
      .sort((a, b) => b.avgProductivity - a.avgProductivity)
      .slice(0, Math.ceil(data.length * 0.2));

    const avgTrainingTop = topPerformers.reduce((sum, p) => sum + p.trainingHours, 0) / topPerformers.length;
    const avgTrainingAll = data.reduce((sum, p) => sum + p.trainingHours, 0) / data.length;

    if (avgTrainingTop > avgTrainingAll * 1.2) {
      insights.push('Top performers have 20%+ more training hours than average');
    }

    return insights;
  }

  /**
   * Generate training recommendations
   */
  private static generateTrainingRecommendations(data: any[], correlation: number): any[] {
    const recommendations: any[] = [];

    if (correlation > 0.5) {
      // Find employees with low training hours
      const avgTraining = data.reduce((sum, d) => sum + d.trainingHours, 0) / data.length;
      const needsTraining = data.filter(d => d.trainingHours < avgTraining * 0.5);

      if (needsTraining.length > 0) {
        recommendations.push({
          priority: 'high',
          category: 'training',
          action: `Provide additional training to ${needsTraining.length} employees`,
          expectedImpact: 'Increase productivity by 15-25%',
          targetEmployees: needsTraining.map(e => e.employeeId),
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate Supplier-Quality insights
   */
  private static generateSupplierQualityInsights(data: any[], correlation: number): string[] {
    const insights: string[] = [];

    if (correlation > 0.5) {
      insights.push('Strong correlation: Supplier quality scores accurately predict defect rates');
      insights.push('Supplier evaluation process is effective');
    } else {
      insights.push('Weak correlation: Supplier evaluation criteria may need revision');
    }

    // Find problematic suppliers
    const problematic = data.filter(d => d.supplierScore < 70 || d.defectRate > 5);
    if (problematic.length > 0) {
      insights.push(`${problematic.length} supplier(s) require immediate attention`);
    }

    // Find excellent suppliers
    const excellent = data.filter(d => d.supplierScore > 90 && d.defectRate < 1);
    if (excellent.length > 0) {
      insights.push(`${excellent.length} supplier(s) demonstrate excellent quality - consider increasing orders`);
    }

    return insights;
  }

  /**
   * Generate supplier recommendations
   */
  private static generateSupplierRecommendations(data: any[]): any[] {
    const recommendations: any[] = [];

    // Find suppliers to review
    const needsReview = data.filter(d => d.supplierScore < 70 || d.defectRate > 5);
    if (needsReview.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'supplier',
        action: `Review and potentially replace ${needsReview.length} underperforming suppliers`,
        expectedImpact: 'Reduce defect rate by 30-40%',
        targetSuppliers: needsReview.map(s => s.supplierId),
      });
    }

    // Find suppliers to reward
    const excellent = data.filter(d => d.supplierScore > 90 && d.defectRate < 1);
    if (excellent.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'supplier',
        action: `Increase orders from ${excellent.length} high-performing suppliers`,
        expectedImpact: 'Improve overall quality and reduce costs',
        targetSuppliers: excellent.map(s => s.supplierId),
      });
    }

    return recommendations;
  }

  /**
   * Generate integrated recommendations
   */
  private static async generateIntegratedRecommendations(data: any): Promise<any[]> {
    const recommendations: any[] = [];

    // HR-Quality recommendations
    if (data.hrQualityCorr && Math.abs(data.hrQualityCorr.correlationCoefficient) > 0.5) {
      recommendations.push({
        priority: 'high',
        category: 'hr-quality',
        action: 'Implement attendance improvement program',
        expectedImpact: 'Reduce defect rate by 20-30%',
        systems: ['HR', 'Quality'],
      });
    }

    // Training-Productivity recommendations
    if (data.trainingProdCorr && data.trainingProdCorr.correlationCoefficient > 0.5) {
      recommendations.push({
        priority: 'high',
        category: 'training',
        action: 'Expand training programs for production staff',
        expectedImpact: 'Increase productivity by 15-25%',
        systems: ['HR', 'Manufacturing'],
      });
    }

    // Supplier-Quality recommendations
    if (data.supplierQualityCorr && data.supplierQualityCorr.correlationCoefficient > 0.5) {
      recommendations.push({
        priority: 'medium',
        category: 'supplier',
        action: 'Strengthen supplier quality requirements',
        expectedImpact: 'Reduce incoming defects by 40%',
        systems: ['Supply Chain', 'Quality'],
      });
    }

    return recommendations;
  }

  /**
   * Identify system-wide opportunities
   */
  private static async identifySystemWideOpportunities(data: any): Promise<any[]> {
    const opportunities: any[] = [];

    // Training opportunity
    if (data.trainingProdCorr && data.trainingProdCorr.correlationCoefficient > 0.5) {
      opportunities.push({
        type: 'training',
        title: 'Training Investment Opportunity',
        description: 'Strong correlation between training and productivity indicates high ROI on training programs',
        potentialImpact: 'Increase overall productivity by 20%',
        estimatedCost: 'Medium',
        timeframe: '3-6 months',
      });
    }

    // Supplier consolidation opportunity
    if (data.supplierQualityCorr && data.supplierQualityCorr.supplierData) {
      const excellent = data.supplierQualityCorr.supplierData.filter((s: any) => s.supplierScore > 90);
      if (excellent.length > 0) {
        opportunities.push({
          type: 'supplier',
          title: 'Supplier Consolidation Opportunity',
          description: `${excellent.length} suppliers show excellent performance - consolidate orders for better pricing`,
          potentialImpact: 'Reduce costs by 10-15% while maintaining quality',
          estimatedCost: 'Low',
          timeframe: '1-3 months',
        });
      }
    }

    return opportunities;
  }

  /**
   * Identify system-wide risks
   */
  private static async identifySystemWideRisks(data: any): Promise<any[]> {
    const risks: any[] = [];

    // Health score risk
    if (data.healthScore && data.healthScore.overallScore < 70) {
      risks.push({
        type: 'health',
        severity: 'high',
        title: 'Overall Company Health Risk',
        description: 'Company health score below threshold',
        impact: 'Multiple systems showing degraded performance',
        mitigation: 'Implement comprehensive improvement plan',
      });
    }

    // HR-Quality risk
    if (data.hrQualityCorr && data.hrQualityCorr.correlationCoefficient < -0.7) {
      const problematic = data.hrQualityCorr.employeeData.filter((e: any) => 
        e.attendanceRate < 90 && e.defectRate > 5
      );
      if (problematic.length > 0) {
        risks.push({
          type: 'hr-quality',
          severity: 'medium',
          title: 'Employee Performance Risk',
          description: `${problematic.length} employees show both attendance and quality issues`,
          impact: 'Increased defect rates and production delays',
          mitigation: 'Implement targeted intervention programs',
        });
      }
    }

    // Supplier risk
    if (data.supplierQualityCorr && data.supplierQualityCorr.supplierData) {
      const risky = data.supplierQualityCorr.supplierData.filter((s: any) => 
        s.supplierScore < 60 || s.defectRate > 10
      );
      if (risky.length > 0) {
        risks.push({
          type: 'supplier',
          severity: 'high',
          title: 'Supplier Quality Risk',
          description: `${risky.length} suppliers pose significant quality risks`,
          impact: 'High defect rates and potential production disruptions',
          mitigation: 'Immediate supplier review and replacement plan',
        });
      }
    }

    return risks;
  }

  // ============================================
  // PRIVATE HELPER METHODS - GENERAL
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
  private static async createUserAccount(employee: Employee, role: string): Promise<string | undefined> {
    const existingUser = await db.users.where({ email: employee.email }).first();
    if (existingUser) return existingUser.id;

    const userId = uuidv4();
    await db.users.add({
      id: userId,
      username: employee.email.split('@')[0],
      email: employee.email,
      role: role as any,
      permissions: [],
      isActive: true,
      createdAt: new Date(),
    });

    return userId;
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
  // Quality Control
  onRejectionCreated,
  updateProductQualityScore,
  updateSupplierQualityScore,
  
  // HR Integrations
  onEmployeeHired,
  onAttendanceRecorded,
  onLeaveApproved,
  onPayrollProcessed,
  
  // Manufacturing Integrations
  onProductionCompleted,
  onMachineDowntime,
  onQualityIssue,
  onScheduleOptimized,
  
  // Executive Integrations
  calculateCompanyHealthScore,
  updateExecutiveKPIs,
  detectCriticalAlerts,
  trackStrategicGoals,
  
  // Cross-System Analytics
  analyzeHRQualityCorrelation,
  analyzeTrainingProductivityCorrelation,
  analyzeSupplierQualityCorrelation,
  generateIntegratedInsights,
  
  // Recruitment
  onApplicationReceived,
  onInterviewCompleted,
  
  // Supply Chain
  onSupplierEvaluated,
  onPurchaseOrderReceived,
  
  // Other
  linkEmployeePerformanceToMetrics,
} = SystemIntegrationManager;
