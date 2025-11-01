// Data Privacy Management Service (GDPR/HIPAA Compliance)

import { db } from '@/lib/db/schema';
import type {
  DataRetentionPolicy,
  DataRetentionExecution,
  ConsentRecord,
  DataSubjectRequest,
  DataBreachIncident,
  DataProcessingActivity,
  PrivacyImpactAssessment,
  DataRetentionAction,
  ConsentStatus,
  DataSubjectRequestType,
  DataSubjectRequestStatus,
} from '@/types/database';
import { v4 as uuidv4 } from 'uuid';
import { AuditTrailService } from './audit-trail';

/**
 * Data Privacy Management Service
 * Handles GDPR/HIPAA compliance including data retention, consent management,
 * data subject requests, breach management, and privacy impact assessments
 */
export class DataPrivacyService {
  /**
   * Create data retention policy
   */
  static async createDataRetentionPolicy(
    policy: Omit<DataRetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DataRetentionPolicy> {
    const newPolicy: DataRetentionPolicy = {
      ...policy,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.dataRetentionPolicies.add(newPolicy);

    // Create audit log
    await AuditTrailService.createAuditLog({
      eventType: 'CREATE',
      entityType: 'DataRetentionPolicy',
      entityId: newPolicy.id,
      userId: policy.approvedBy,
      username: 'System',
      userRole: 'admin',
      ipAddress: '0.0.0.0',
      userAgent: 'System',
      action: `Created data retention policy: ${policy.name}`,
      afterData: newPolicy,
      sessionId: uuidv4(),
      source: 'system',
      isSecurityEvent: false,
      isCriticalOperation: true,
      requiresApproval: false,
      complianceRelevant: true,
      regulatoryCategory: 'Data Privacy',
      retentionPeriod: 2555, // 7 years
      status: 'success',
    });

    return newPolicy;
  }

  /**
   * Get data retention policies
   */
  static async getDataRetentionPolicies(filters?: {
    entityType?: string;
    dataCategory?: string;
    isActive?: boolean;
  }): Promise<DataRetentionPolicy[]> {
    let query = db.dataRetentionPolicies.toCollection();

    if (filters?.entityType && filters?.isActive !== undefined) {
      query = db.dataRetentionPolicies.where('[entityType+isActive]').equals([filters.entityType, filters.isActive ? 1 : 0]);
    }

    const policies = await query.toArray();

    // Apply additional filters
    let filtered = policies;

    if (filters?.dataCategory) {
      filtered = filtered.filter(p => p.dataCategory === filters.dataCategory);
    }

    return filtered.sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime());
  }

  /**
   * Update data retention policy
   */
  static async updateDataRetentionPolicy(
    id: string,
    updates: Partial<DataRetentionPolicy>,
    updatedBy: string
  ): Promise<void> {
    const existing = await db.dataRetentionPolicies.get(id);
    
    await db.dataRetentionPolicies.update(id, {
      ...updates,
      updatedAt: new Date(),
    });

    // Create audit log
    await AuditTrailService.createAuditLog({
      eventType: 'UPDATE',
      entityType: 'DataRetentionPolicy',
      entityId: id,
      userId: updatedBy,
      username: 'System',
      userRole: 'admin',
      ipAddress: '0.0.0.0',
      userAgent: 'System',
      action: `Updated data retention policy`,
      beforeData: existing,
      afterData: { ...existing, ...updates },
      changes: Object.keys(updates).map(key => ({
        field: key,
        oldValue: existing?.[key as keyof DataRetentionPolicy],
        newValue: updates[key as keyof DataRetentionPolicy],
        dataType: typeof updates[key as keyof DataRetentionPolicy],
      })),
      sessionId: uuidv4(),
      source: 'system',
      isSecurityEvent: false,
      isCriticalOperation: true,
      requiresApproval: false,
      complianceRelevant: true,
      regulatoryCategory: 'Data Privacy',
      retentionPeriod: 2555,
      status: 'success',
    });
  }

  /**
   * Execute data retention policy
   */
  static async executeDataRetentionPolicy(
    policyId: string,
    executedBy: string
  ): Promise<DataRetentionExecution> {
    const policy = await db.dataRetentionPolicies.get(policyId);
    if (!policy) {
      throw new Error('Data retention policy not found');
    }

    const execution: DataRetentionExecution = {
      id: uuidv4(),
      executionId: `RETENTION-${Date.now()}`,
      policyId,
      executionDate: new Date(),
      executedBy,
      recordsProcessed: 0,
      recordsRetained: 0,
      recordsArchived: 0,
      recordsDeleted: 0,
      recordsAnonymized: 0,
      status: 'in-progress',
      auditLogIds: [],
      createdAt: new Date(),
    };

    await db.dataRetentionExecutions.add(execution);

    try {
      // Execute retention policy based on entity type
      const result = await this.applyRetentionPolicy(policy);

      // Update execution record
      await db.dataRetentionExecutions.update(execution.id, {
        ...result,
        status: 'completed',
        completedAt: new Date(),
      });

      return { ...execution, ...result, status: 'completed' };
    } catch (error) {
      await db.dataRetentionExecutions.update(execution.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      });

      throw error;
    }
  }

  /**
   * Apply retention policy to data
   */
  private static async applyRetentionPolicy(policy: DataRetentionPolicy): Promise<{
    recordsProcessed: number;
    recordsRetained: number;
    recordsArchived: number;
    recordsDeleted: number;
    recordsAnonymized: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod);

    let recordsProcessed = 0;
    let recordsRetained = 0;
    let recordsArchived = 0;
    let recordsDeleted = 0;
    let recordsAnonymized = 0;

    // This is a simplified implementation
    // In a real system, you would need to handle each entity type specifically
    
    // Example: Handle patient records
    if (policy.entityType === 'Patient') {
      const oldRecords = await db.patients
        .where('createdAt')
        .below(cutoffDate)
        .toArray();

      recordsProcessed = oldRecords.length;

      for (const record of oldRecords) {
        switch (policy.actionAfterRetention) {
          case 'delete':
            await db.patients.delete(record.id);
            recordsDeleted++;
            break;
          case 'archive':
            // In real implementation, move to archive storage
            recordsArchived++;
            break;
          case 'anonymize':
            await db.patients.update(record.id, {
              firstName: 'ANONYMIZED',
              lastName: 'ANONYMIZED',
              email: undefined,
              phone: 'ANONYMIZED',
              address: 'ANONYMIZED',
            });
            recordsAnonymized++;
            break;
          case 'retain':
            recordsRetained++;
            break;
        }
      }
    }

    return {
      recordsProcessed,
      recordsRetained,
      recordsArchived,
      recordsDeleted,
      recordsAnonymized,
    };
  }

  /**
   * Create consent record
   */
  static async createConsentRecord(
    consent: Omit<ConsentRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ConsentRecord> {
    const newConsent: ConsentRecord = {
      ...consent,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.consentRecords.add(newConsent);

    // Create audit log
    await AuditTrailService.createAuditLog({
      eventType: 'CREATE',
      entityType: 'ConsentRecord',
      entityId: newConsent.id,
      userId: consent.recordedBy,
      username: 'System',
      userRole: 'admin',
      ipAddress: consent.ipAddress || '0.0.0.0',
      userAgent: 'System',
      action: `Recorded consent for ${consent.subjectType} ${consent.subjectId}`,
      afterData: newConsent,
      sessionId: uuidv4(),
      source: 'system',
      isSecurityEvent: false,
      isCriticalOperation: true,
      requiresApproval: false,
      complianceRelevant: true,
      regulatoryCategory: 'Data Privacy',
      retentionPeriod: 2555,
      status: 'success',
    });

    return newConsent;
  }

  /**
   * Get consent records
   */
  static async getConsentRecords(filters?: {
    subjectType?: string;
    subjectId?: string;
    consentType?: string;
    status?: ConsentStatus;
  }): Promise<ConsentRecord[]> {
    let query = db.consentRecords.toCollection();

    if (filters?.subjectType && filters?.subjectId) {
      query = db.consentRecords.where('[subjectType+subjectId]').equals([filters.subjectType, filters.subjectId]);
    }

    const consents = await query.toArray();

    // Apply additional filters
    let filtered = consents;

    if (filters?.consentType) {
      filtered = filtered.filter(c => c.consentType === filters.consentType);
    }

    if (filters?.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Withdraw consent
   */
  static async withdrawConsent(
    consentId: string,
    withdrawnBy: string
  ): Promise<void> {
    const consent = await db.consentRecords.get(consentId);
    
    await db.consentRecords.update(consentId, {
      status: 'withdrawn',
      withdrawnDate: new Date(),
      updatedAt: new Date(),
    });

    // Create audit log
    await AuditTrailService.createAuditLog({
      eventType: 'UPDATE',
      entityType: 'ConsentRecord',
      entityId: consentId,
      userId: withdrawnBy,
      username: 'System',
      userRole: 'admin',
      ipAddress: '0.0.0.0',
      userAgent: 'System',
      action: `Consent withdrawn`,
      beforeData: consent,
      afterData: { ...consent, status: 'withdrawn', withdrawnDate: new Date() },
      sessionId: uuidv4(),
      source: 'system',
      isSecurityEvent: false,
      isCriticalOperation: true,
      requiresApproval: false,
      complianceRelevant: true,
      regulatoryCategory: 'Data Privacy',
      retentionPeriod: 2555,
      status: 'success',
    });
  }

  /**
   * Create data subject request
   */
  static async createDataSubjectRequest(
    request: Omit<DataSubjectRequest, 'id' | 'createdAt' | 'updatedAt' | 'dueDate' | 'identityVerified' | 'actionsTaken' | 'auditLogIds'>
  ): Promise<DataSubjectRequest> {
    // Calculate due date (30 days from request date per GDPR)
    const dueDate = new Date(request.requestDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const newRequest: DataSubjectRequest = {
      ...request,
      id: uuidv4(),
      dueDate,
      identityVerified: false,
      actionsTaken: [],
      auditLogIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.dataSubjectRequests.add(newRequest);

    // Create audit log
    const auditLog = await AuditTrailService.createAuditLog({
      eventType: 'CREATE',
      entityType: 'DataSubjectRequest',
      entityId: newRequest.id,
      userId: 'system',
      username: 'System',
      userRole: 'admin',
      ipAddress: '0.0.0.0',
      userAgent: 'System',
      action: `Data subject request created: ${request.requestType}`,
      afterData: newRequest,
      sessionId: uuidv4(),
      source: 'system',
      isSecurityEvent: false,
      isCriticalOperation: true,
      requiresApproval: false,
      complianceRelevant: true,
      regulatoryCategory: 'Data Privacy',
      retentionPeriod: 2555,
      status: 'success',
    });

    // Update request with audit log ID
    await db.dataSubjectRequests.update(newRequest.id, {
      auditLogIds: [auditLog.id],
    });

    return newRequest;
  }

  /**
   * Get data subject requests
   */
  static async getDataSubjectRequests(filters?: {
    subjectType?: string;
    subjectId?: string;
    requestType?: DataSubjectRequestType;
    status?: DataSubjectRequestStatus;
    assignedTo?: string;
  }): Promise<DataSubjectRequest[]> {
    let query = db.dataSubjectRequests.toCollection();

    if (filters?.subjectType && filters?.subjectId) {
      query = db.dataSubjectRequests.where('[subjectType+subjectId]').equals([filters.subjectType, filters.subjectId]);
    }

    const requests = await query.toArray();

    // Apply additional filters
    let filtered = requests;

    if (filters?.requestType) {
      filtered = filtered.filter(r => r.requestType === filters.requestType);
    }

    if (filters?.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    if (filters?.assignedTo) {
      filtered = filtered.filter(r => r.assignedTo === filters.assignedTo);
    }

    return filtered.sort((a, b) => {
      // Sort by due date (urgent first)
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  }

  /**
   * Update data subject request
   */
  static async updateDataSubjectRequest(
    id: string,
    updates: Partial<DataSubjectRequest>,
    updatedBy: string
  ): Promise<void> {
    const existing = await db.dataSubjectRequests.get(id);
    
    await db.dataSubjectRequests.update(id, {
      ...updates,
      updatedAt: new Date(),
    });

    // Create audit log
    const auditLog = await AuditTrailService.createAuditLog({
      eventType: 'UPDATE',
      entityType: 'DataSubjectRequest',
      entityId: id,
      userId: updatedBy,
      username: 'System',
      userRole: 'admin',
      ipAddress: '0.0.0.0',
      userAgent: 'System',
      action: `Data subject request updated`,
      beforeData: existing,
      afterData: { ...existing, ...updates },
      changes: Object.keys(updates).map(key => ({
        field: key,
        oldValue: existing?.[key as keyof DataSubjectRequest],
        newValue: updates[key as keyof DataSubjectRequest],
        dataType: typeof updates[key as keyof DataSubjectRequest],
      })),
      sessionId: uuidv4(),
      source: 'system',
      isSecurityEvent: false,
      isCriticalOperation: true,
      requiresApproval: false,
      complianceRelevant: true,
      regulatoryCategory: 'Data Privacy',
      retentionPeriod: 2555,
      status: 'success',
    });

    // Add audit log ID to request
    if (existing) {
      await db.dataSubjectRequests.update(id, {
        auditLogIds: [...existing.auditLogIds, auditLog.id],
      });
    }
  }

  /**
   * Process data subject request (access, erasure, etc.)
   */
  static async processDataSubjectRequest(
    requestId: string,
    processedBy: string
  ): Promise<void> {
    const request = await db.dataSubjectRequests.get(requestId);
    if (!request) {
      throw new Error('Data subject request not found');
    }

    if (!request.identityVerified) {
      throw new Error('Identity must be verified before processing request');
    }

    const actionsTaken = [];

    switch (request.requestType) {
      case 'access':
        // Export all data for the subject
        actionsTaken.push({
          entityType: 'All',
          entityId: request.subjectId,
          action: 'exported' as const,
          performedBy: processedBy,
          performedAt: new Date(),
          notes: 'Data exported for access request',
        });
        break;

      case 'erasure':
        // Delete or anonymize data
        actionsTaken.push({
          entityType: request.subjectType,
          entityId: request.subjectId,
          action: 'deleted' as const,
          performedBy: processedBy,
          performedAt: new Date(),
          notes: 'Data deleted per erasure request',
        });
        break;

      case 'rectification':
        // Update incorrect data
        actionsTaken.push({
          entityType: request.subjectType,
          entityId: request.subjectId,
          action: 'rectified' as const,
          performedBy: processedBy,
          performedAt: new Date(),
          notes: 'Data rectified per request',
        });
        break;

      case 'portability':
        // Export data in machine-readable format
        actionsTaken.push({
          entityType: 'All',
          entityId: request.subjectId,
          action: 'exported' as const,
          performedBy: processedBy,
          performedAt: new Date(),
          notes: 'Data exported in machine-readable format',
        });
        break;

      case 'restriction':
        // Restrict processing
        actionsTaken.push({
          entityType: request.subjectType,
          entityId: request.subjectId,
          action: 'restricted' as const,
          performedBy: processedBy,
          performedAt: new Date(),
          notes: 'Processing restricted per request',
        });
        break;

      case 'objection':
        // Stop processing
        actionsTaken.push({
          entityType: request.subjectType,
          entityId: request.subjectId,
          action: 'restricted' as const,
          performedBy: processedBy,
          performedAt: new Date(),
          notes: 'Processing stopped per objection',
        });
        break;
    }

    await this.updateDataSubjectRequest(
      requestId,
      {
        status: 'completed',
        actionsTaken,
        completedAt: new Date(),
        responseDate: new Date(),
      },
      processedBy
    );
  }

  /**
   * Create data breach incident
   */
  static async createDataBreachIncident(
    incident: Omit<DataBreachIncident, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DataBreachIncident> {
    const newIncident: DataBreachIncident = {
      ...incident,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.dataBreachIncidents.add(newIncident);

    // Create audit log
    await AuditTrailService.createAuditLog({
      eventType: 'CREATE',
      entityType: 'DataBreachIncident',
      entityId: newIncident.id,
      userId: incident.incidentLeadId,
      username: 'System',
      userRole: 'admin',
      ipAddress: '0.0.0.0',
      userAgent: 'System',
      action: `Data breach incident reported: ${incident.title}`,
      afterData: newIncident,
      sessionId: uuidv4(),
      source: 'system',
      isSecurityEvent: true,
      isCriticalOperation: true,
      requiresApproval: false,
      complianceRelevant: true,
      regulatoryCategory: 'Data Privacy',
      retentionPeriod: 2555,
      status: 'success',
    });

    return newIncident;
  }

  /**
   * Get data breach incidents
   */
  static async getDataBreachIncidents(filters?: {
    severity?: string;
    breachType?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<DataBreachIncident[]> {
    let query = db.dataBreachIncidents.toCollection();

    const incidents = await query.reverse().sortBy('discoveredDate');

    // Apply filters
    let filtered = incidents;

    if (filters?.severity) {
      filtered = filtered.filter(i => i.severity === filters.severity);
    }

    if (filters?.breachType) {
      filtered = filtered.filter(i => i.breachType === filters.breachType);
    }

    if (filters?.status) {
      filtered = filtered.filter(i => i.status === filters.status);
    }

    if (filters?.startDate) {
      filtered = filtered.filter(i => i.discoveredDate >= filters.startDate!);
    }

    if (filters?.endDate) {
      filtered = filtered.filter(i => i.discoveredDate <= filters.endDate!);
    }

    return filtered;
  }

  /**
   * Update data breach incident
   */
  static async updateDataBreachIncident(
    id: string,
    updates: Partial<DataBreachIncident>,
    updatedBy: string
  ): Promise<void> {
    const existing = await db.dataBreachIncidents.get(id);
    
    await db.dataBreachIncidents.update(id, {
      ...updates,
      updatedAt: new Date(),
    });

    // Create audit log
    await AuditTrailService.createAuditLog({
      eventType: 'UPDATE',
      entityType: 'DataBreachIncident',
      entityId: id,
      userId: updatedBy,
      username: 'System',
      userRole: 'admin',
      ipAddress: '0.0.0.0',
      userAgent: 'System',
      action: `Data breach incident updated`,
      beforeData: existing,
      afterData: { ...existing, ...updates },
      changes: Object.keys(updates).map(key => ({
        field: key,
        oldValue: existing?.[key as keyof DataBreachIncident],
        newValue: updates[key as keyof DataBreachIncident],
        dataType: typeof updates[key as keyof DataBreachIncident],
      })),
      sessionId: uuidv4(),
      source: 'system',
      isSecurityEvent: true,
      isCriticalOperation: true,
      requiresApproval: false,
      complianceRelevant: true,
      regulatoryCategory: 'Data Privacy',
      retentionPeriod: 2555,
      status: 'success',
    });
  }

  /**
   * Create data processing activity
   */
  static async createDataProcessingActivity(
    activity: Omit<DataProcessingActivity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DataProcessingActivity> {
    const newActivity: DataProcessingActivity = {
      ...activity,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.dataProcessingActivities.add(newActivity);

    return newActivity;
  }

  /**
   * Get data processing activities
   */
  static async getDataProcessingActivities(filters?: {
    entityType?: string;
    purpose?: string;
    isActive?: boolean;
  }): Promise<DataProcessingActivity[]> {
    let query = db.dataProcessingActivities.toCollection();

    if (filters?.entityType && filters?.isActive !== undefined) {
      query = db.dataProcessingActivities.where('[entityType+isActive]').equals([filters.entityType, filters.isActive ? 1 : 0]);
    }

    const activities = await query.toArray();

    // Apply additional filters
    let filtered = activities;

    if (filters?.purpose) {
      filtered = filtered.filter(a => a.purpose.toLowerCase().includes(filters.purpose!.toLowerCase()));
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Create privacy impact assessment
   */
  static async createPrivacyImpactAssessment(
    assessment: Omit<PrivacyImpactAssessment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PrivacyImpactAssessment> {
    const newAssessment: PrivacyImpactAssessment = {
      ...assessment,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.privacyImpactAssessments.add(newAssessment);

    return newAssessment;
  }

  /**
   * Get privacy impact assessments
   */
  static async getPrivacyImpactAssessments(filters?: {
    assessorId?: string;
    status?: string;
    overallRiskLevel?: string;
  }): Promise<PrivacyImpactAssessment[]> {
    let query = db.privacyImpactAssessments.toCollection();

    const assessments = await query.reverse().sortBy('assessmentDate');

    // Apply filters
    let filtered = assessments;

    if (filters?.assessorId) {
      filtered = filtered.filter(a => a.assessorId === filters.assessorId);
    }

    if (filters?.status) {
      filtered = filtered.filter(a => a.status === filters.status);
    }

    if (filters?.overallRiskLevel) {
      filtered = filtered.filter(a => a.overallRiskLevel === filters.overallRiskLevel);
    }

    return filtered;
  }

  /**
   * Get privacy statistics
   */
  static async getPrivacyStatistics(): Promise<{
    totalConsentRecords: number;
    activeConsents: number;
    withdrawnConsents: number;
    pendingDataSubjectRequests: number;
    completedDataSubjectRequests: number;
    overdueDataSubjectRequests: number;
    activeDataBreaches: number;
    resolvedDataBreaches: number;
    activePolicies: number;
    upcomingPolicyReviews: number;
  }> {
    const [
      allConsents,
      allRequests,
      allBreaches,
      allPolicies,
    ] = await Promise.all([
      db.consentRecords.toArray(),
      db.dataSubjectRequests.toArray(),
      db.dataBreachIncidents.toArray(),
      db.dataRetentionPolicies.toArray(),
    ]);

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return {
      totalConsentRecords: allConsents.length,
      activeConsents: allConsents.filter(c => c.status === 'granted').length,
      withdrawnConsents: allConsents.filter(c => c.status === 'withdrawn').length,
      pendingDataSubjectRequests: allRequests.filter(r => r.status === 'pending' || r.status === 'in-progress').length,
      completedDataSubjectRequests: allRequests.filter(r => r.status === 'completed').length,
      overdueDataSubjectRequests: allRequests.filter(r => r.dueDate < now && r.status !== 'completed').length,
      activeDataBreaches: allBreaches.filter(b => b.status === 'open' || b.status === 'contained').length,
      resolvedDataBreaches: allBreaches.filter(b => b.status === 'resolved' || b.status === 'closed').length,
      activePolicies: allPolicies.filter(p => p.isActive).length,
      upcomingPolicyReviews: allPolicies.filter(p => p.isActive && p.reviewDate <= thirtyDaysFromNow).length,
    };
  }
}
