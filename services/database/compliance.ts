// Compliance and Regulatory Management Service

import { db } from '@/lib/db/schema';
import type {
  ComplianceRequirement,
  ComplianceReport,
  ComplianceAlert,
  ComplianceStatus,
  ComplianceCategory,
  CompliancePriority,
} from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Compliance Service
 * Handles all compliance and regulatory management operations
 */
export class ComplianceService {
  /**
   * Get all compliance requirements
   */
  static async getComplianceRequirements(filters?: {
    category?: ComplianceCategory;
    status?: ComplianceStatus;
    priority?: CompliancePriority;
    region?: string;
    regulatoryBody?: string;
  }): Promise<ComplianceRequirement[]> {
    let query = db.complianceRequirements.toCollection();

    if (filters?.category) {
      query = db.complianceRequirements.where('[category+status]').between(
        [filters.category, ''],
        [filters.category, '\uffff']
      );
    }

    if (filters?.status) {
      query = db.complianceRequirements.where('status').equals(filters.status);
    }

    if (filters?.priority) {
      query = db.complianceRequirements.where('[priority+status]').between(
        [filters.priority, ''],
        [filters.priority, '\uffff']
      );
    }

    const requirements = await query.toArray();

    // Apply additional filters
    let filtered = requirements;

    if (filters?.region) {
      filtered = filtered.filter(r => r.region === filters.region || r.applicableCountries.includes(filters.region));
    }

    if (filters?.regulatoryBody) {
      filtered = filtered.filter(r => r.regulatoryBody === filters.regulatoryBody);
    }

    return filtered.sort((a, b) => {
      // Sort by priority (critical first) then by deadline
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      if (a.complianceDeadline && b.complianceDeadline) {
        return a.complianceDeadline.getTime() - b.complianceDeadline.getTime();
      }
      
      return 0;
    });
  }

  /**
   * Get compliance requirement by ID
   */
  static async getComplianceRequirementById(id: string): Promise<ComplianceRequirement | undefined> {
    return await db.complianceRequirements.get(id);
  }

  /**
   * Create a new compliance requirement
   */
  static async createComplianceRequirement(
    requirement: Omit<ComplianceRequirement, 'id' | 'createdAt' | 'updatedAt' | 'nonComplianceCount'>
  ): Promise<ComplianceRequirement> {
    const newRequirement: ComplianceRequirement = {
      ...requirement,
      id: uuidv4(),
      nonComplianceCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.complianceRequirements.add(newRequirement);

    // Create alert if deadline is approaching
    if (requirement.complianceDeadline) {
      await this.checkAndCreateDeadlineAlert(newRequirement);
    }

    return newRequirement;
  }

  /**
   * Update compliance requirement
   */
  static async updateComplianceRequirement(
    id: string,
    updates: Partial<ComplianceRequirement>
  ): Promise<void> {
    const existing = await db.complianceRequirements.get(id);
    if (!existing) {
      throw new Error('Compliance requirement not found');
    }

    await db.complianceRequirements.update(id, {
      ...updates,
      updatedAt: new Date(),
    });

    // Check if status changed to non-compliant
    if (updates.status === 'non-compliant' && existing.status !== 'non-compliant') {
      await db.complianceRequirements.update(id, {
        nonComplianceCount: existing.nonComplianceCount + 1,
      });

      // Create alert
      await this.createComplianceAlert({
        requirementId: id,
        alertType: 'non-compliance',
        severity: existing.priority === 'critical' ? 'critical' : 'warning',
        message: `Compliance requirement "${existing.title}" is now non-compliant`,
      });
    }

    // Check if deadline was updated
    if (updates.complianceDeadline) {
      const updated = await db.complianceRequirements.get(id);
      if (updated) {
        await this.checkAndCreateDeadlineAlert(updated);
      }
    }
  }

  /**
   * Delete compliance requirement
   */
  static async deleteComplianceRequirement(id: string): Promise<void> {
    await db.complianceRequirements.delete(id);
    
    // Delete associated alerts
    const alerts = await db.complianceAlerts.where('requirementId').equals(id).toArray();
    await Promise.all(alerts.map(alert => db.complianceAlerts.delete(alert.id)));
  }

  /**
   * Get upcoming compliance deadlines
   */
  static async getUpcomingDeadlines(daysAhead: number = 30): Promise<ComplianceRequirement[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const requirements = await db.complianceRequirements
      .where('complianceDeadline')
      .between(now, futureDate, true, true)
      .toArray();

    return requirements.sort((a, b) => {
      if (!a.complianceDeadline || !b.complianceDeadline) return 0;
      return a.complianceDeadline.getTime() - b.complianceDeadline.getTime();
    });
  }

  /**
   * Get overdue compliance requirements
   */
  static async getOverdueRequirements(): Promise<ComplianceRequirement[]> {
    const now = new Date();

    const requirements = await db.complianceRequirements
      .where('complianceDeadline')
      .below(now)
      .toArray();

    return requirements.filter(r => r.status !== 'compliant');
  }

  /**
   * Generate compliance report
   */
  static async generateComplianceReport(
    periodStart: Date,
    periodEnd: Date,
    generatedBy: string,
    reportType: 'status' | 'audit' | 'incident' | 'periodic' | 'regulatory-submission' = 'periodic'
  ): Promise<ComplianceReport> {
    const requirements = await this.getComplianceRequirements();

    // Calculate metrics
    const totalRequirements = requirements.length;
    const compliantCount = requirements.filter(r => r.status === 'compliant').length;
    const nonCompliantCount = requirements.filter(r => r.status === 'non-compliant').length;
    const atRiskCount = requirements.filter(r => r.status === 'at-risk').length;
    const complianceRate = totalRequirements > 0 ? (compliantCount / totalRequirements) * 100 : 0;

    // Generate findings
    const findings = requirements
      .filter(r => r.status !== 'compliant')
      .map(r => ({
        id: uuidv4(),
        requirementId: r.id,
        severity: r.priority === 'critical' ? 'critical' as const : 
                  r.priority === 'high' ? 'major' as const : 'minor' as const,
        description: `${r.title} - Status: ${r.status}`,
        evidence: r.complianceNotes || 'No evidence provided',
        recommendation: `Review and update compliance status for ${r.title}`,
        status: 'open' as const,
      }));

    // Generate recommendations
    const recommendations: string[] = [];
    if (complianceRate < 80) {
      recommendations.push('Compliance rate is below 80%. Immediate action required.');
    }
    if (nonCompliantCount > 0) {
      recommendations.push(`${nonCompliantCount} requirements are non-compliant. Prioritize remediation.`);
    }
    if (atRiskCount > 0) {
      recommendations.push(`${atRiskCount} requirements are at risk. Monitor closely.`);
    }

    // Generate action items
    const actionItems = requirements
      .filter(r => r.status !== 'compliant')
      .slice(0, 10) // Top 10 action items
      .map(r => ({
        id: uuidv4(),
        description: `Address compliance requirement: ${r.title}`,
        assignedTo: r.ownerId,
        dueDate: r.complianceDeadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        priority: r.priority,
        status: 'open' as const,
      }));

    const report: ComplianceReport = {
      id: uuidv4(),
      reportId: `COMP-${Date.now()}`,
      title: `Compliance Report - ${periodStart.toLocaleDateString()} to ${periodEnd.toLocaleDateString()}`,
      reportType,
      reportingPeriodStart: periodStart,
      reportingPeriodEnd: periodEnd,
      generatedDate: new Date(),
      generatedBy,
      summary: `Compliance report covering ${totalRequirements} requirements. Overall compliance rate: ${complianceRate.toFixed(1)}%.`,
      findings,
      recommendations,
      actionItems,
      totalRequirements,
      compliantCount,
      nonCompliantCount,
      atRiskCount,
      complianceRate,
      status: 'draft',
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.complianceReports.add(report);

    return report;
  }

  /**
   * Get compliance reports
   */
  static async getComplianceReports(filters?: {
    reportType?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ComplianceReport[]> {
    let query = db.complianceReports.toCollection();

    if (filters?.reportType && filters?.status) {
      query = db.complianceReports.where('[reportType+status]').equals([filters.reportType, filters.status]);
    } else if (filters?.status) {
      query = db.complianceReports.where('status').equals(filters.status);
    }

    const reports = await query.reverse().sortBy('generatedDate');

    // Apply date filters
    let filtered = reports;
    if (filters?.startDate) {
      filtered = filtered.filter(r => r.generatedDate >= filters.startDate!);
    }
    if (filters?.endDate) {
      filtered = filtered.filter(r => r.generatedDate <= filters.endDate!);
    }

    return filtered;
  }

  /**
   * Get compliance report by ID
   */
  static async getComplianceReportById(id: string): Promise<ComplianceReport | undefined> {
    return await db.complianceReports.get(id);
  }

  /**
   * Update compliance report
   */
  static async updateComplianceReport(
    id: string,
    updates: Partial<ComplianceReport>
  ): Promise<void> {
    await db.complianceReports.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  /**
   * Create compliance alert
   */
  static async createComplianceAlert(
    alert: Omit<ComplianceAlert, 'id' | 'createdAt'>
  ): Promise<ComplianceAlert> {
    const newAlert: ComplianceAlert = {
      ...alert,
      id: uuidv4(),
      createdAt: new Date(),
    };

    await db.complianceAlerts.add(newAlert);

    return newAlert;
  }

  /**
   * Get compliance alerts
   */
  static async getComplianceAlerts(filters?: {
    requirementId?: string;
    alertType?: string;
    severity?: string;
    acknowledged?: boolean;
  }): Promise<ComplianceAlert[]> {
    let query = db.complianceAlerts.toCollection();

    if (filters?.requirementId) {
      query = db.complianceAlerts.where('requirementId').equals(filters.requirementId);
    }

    const alerts = await query.reverse().sortBy('createdAt');

    // Apply additional filters
    let filtered = alerts;

    if (filters?.alertType) {
      filtered = filtered.filter(a => a.alertType === filters.alertType);
    }

    if (filters?.severity) {
      filtered = filtered.filter(a => a.severity === filters.severity);
    }

    if (filters?.acknowledged !== undefined) {
      filtered = filtered.filter(a => filters.acknowledged ? !!a.acknowledgedBy : !a.acknowledgedBy);
    }

    return filtered;
  }

  /**
   * Acknowledge compliance alert
   */
  static async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    await db.complianceAlerts.update(alertId, {
      acknowledgedBy,
      acknowledgedAt: new Date(),
    });
  }

  /**
   * Resolve compliance alert
   */
  static async resolveAlert(alertId: string): Promise<void> {
    await db.complianceAlerts.update(alertId, {
      resolvedAt: new Date(),
    });
  }

  /**
   * Check and create deadline alert if needed
   */
  private static async checkAndCreateDeadlineAlert(requirement: ComplianceRequirement): Promise<void> {
    if (!requirement.complianceDeadline) return;

    const now = new Date();
    const deadline = new Date(requirement.complianceDeadline);
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Check if we should create an alert
    if (daysUntilDeadline <= requirement.alertDaysBefore && daysUntilDeadline > 0) {
      // Check if alert already exists
      const existingAlerts = await db.complianceAlerts
        .where('[requirementId+alertType]')
        .equals([requirement.id, 'deadline-approaching'])
        .toArray();

      const unacknowledgedAlert = existingAlerts.find(a => !a.acknowledgedBy);

      if (!unacknowledgedAlert) {
        await this.createComplianceAlert({
          requirementId: requirement.id,
          alertType: 'deadline-approaching',
          severity: daysUntilDeadline <= 7 ? 'critical' : 'warning',
          message: `Compliance deadline approaching for "${requirement.title}" in ${daysUntilDeadline} days`,
          dueDate: deadline,
        });
      }
    } else if (daysUntilDeadline <= 0) {
      // Deadline passed
      const existingAlerts = await db.complianceAlerts
        .where('[requirementId+alertType]')
        .equals([requirement.id, 'overdue'])
        .toArray();

      const unacknowledgedAlert = existingAlerts.find(a => !a.acknowledgedBy);

      if (!unacknowledgedAlert) {
        await this.createComplianceAlert({
          requirementId: requirement.id,
          alertType: 'overdue',
          severity: 'critical',
          message: `Compliance requirement "${requirement.title}" is overdue`,
          dueDate: deadline,
        });
      }
    }
  }

  /**
   * Run compliance checks (should be run periodically)
   */
  static async runComplianceChecks(): Promise<void> {
    const requirements = await this.getComplianceRequirements();

    for (const requirement of requirements) {
      // Check deadlines
      await this.checkAndCreateDeadlineAlert(requirement);

      // Check if review is due
      if (requirement.nextReviewDate && new Date() >= requirement.nextReviewDate) {
        const existingAlerts = await db.complianceAlerts
          .where('[requirementId+alertType]')
          .equals([requirement.id, 'review-required'])
          .toArray();

        const unacknowledgedAlert = existingAlerts.find(a => !a.acknowledgedBy);

        if (!unacknowledgedAlert) {
          await this.createComplianceAlert({
            requirementId: requirement.id,
            alertType: 'review-required',
            severity: 'warning',
            message: `Compliance review required for "${requirement.title}"`,
            dueDate: requirement.nextReviewDate,
          });
        }
      }
    }
  }

  /**
   * Get compliance statistics
   */
  static async getComplianceStatistics(): Promise<{
    total: number;
    compliant: number;
    nonCompliant: number;
    atRisk: number;
    pendingReview: number;
    complianceRate: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    upcomingDeadlines: number;
    overdueRequirements: number;
  }> {
    const requirements = await this.getComplianceRequirements();

    const total = requirements.length;
    const compliant = requirements.filter(r => r.status === 'compliant').length;
    const nonCompliant = requirements.filter(r => r.status === 'non-compliant').length;
    const atRisk = requirements.filter(r => r.status === 'at-risk').length;
    const pendingReview = requirements.filter(r => r.status === 'pending-review').length;
    const complianceRate = total > 0 ? (compliant / total) * 100 : 0;

    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    requirements.forEach(r => {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
      byPriority[r.priority] = (byPriority[r.priority] || 0) + 1;
    });

    const upcomingDeadlines = (await this.getUpcomingDeadlines(30)).length;
    const overdueRequirements = (await this.getOverdueRequirements()).length;

    return {
      total,
      compliant,
      nonCompliant,
      atRisk,
      pendingReview,
      complianceRate,
      byCategory,
      byPriority,
      upcomingDeadlines,
      overdueRequirements,
    };
  }
}
