// Medical Records Service - CRUD operations and business logic for medical records

import { db } from '@/lib/db/schema';
import type { MedicalRecord, RecordType, Attachment, Medication, GeminiAnalysis, PaginatedResult } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Medical record filters for search and filtering
 */
export interface MedicalRecordFilters {
  patientId?: string;
  recordType?: RecordType;
  doctorName?: string;
  hospitalName?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

/**
 * Medical record creation data
 */
export interface CreateMedicalRecordData {
  patientId: string;
  recordType: RecordType;
  title: string;
  content: string;
  diagnosis?: string;
  medications?: Medication[];
  doctorName?: string;
  hospitalName?: string;
  visitDate: Date;
  attachments?: Attachment[];
  geminiAnalysis?: GeminiAnalysis;
  linkedProductIds?: string[];
}

/**
 * MedicalRecordsService - Handles all medical record-related database operations
 */
export class MedicalRecordsService {
  /**
   * Get all medical records with optional filters
   */
  static async getMedicalRecords(filters?: MedicalRecordFilters): Promise<MedicalRecord[]> {
    try {
      let query = db.medicalRecords.toCollection();

      // Apply filters
      if (filters?.patientId) {
        query = query.filter(r => r.patientId === filters.patientId);
      }

      if (filters?.recordType) {
        query = query.filter(r => r.recordType === filters.recordType);
      }

      if (filters?.doctorName) {
        query = query.filter(r => r.doctorName ? r.doctorName.toLowerCase().includes(filters.doctorName!.toLowerCase()) : false);
      }

      if (filters?.hospitalName) {
        query = query.filter(r => r.hospitalName ? r.hospitalName.toLowerCase().includes(filters.hospitalName!.toLowerCase()) : false);
      }

      if (filters?.startDate) {
        query = query.filter(r => r.visitDate >= filters.startDate!);
      }

      if (filters?.endDate) {
        query = query.filter(r => r.visitDate <= filters.endDate!);
      }

      if (filters?.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        query = query.filter(r => 
          r.title.toLowerCase().includes(searchLower) ||
          r.content.toLowerCase().includes(searchLower) ||
          r.diagnosis?.toLowerCase().includes(searchLower) ||
          r.recordId.toLowerCase().includes(searchLower)
        );
      }

      return await query.reverse().sortBy('visitDate');
    } catch (error) {
      console.error('Error getting medical records:', error);
      throw new Error('Failed to retrieve medical records');
    }
  }

  /**
   * Get paginated medical records
   */
  static async getPaginatedMedicalRecords(
    page: number = 1,
    pageSize: number = 20,
    filters?: MedicalRecordFilters
  ): Promise<PaginatedResult<MedicalRecord>> {
    try {
      const allRecords = await this.getMedicalRecords(filters);
      const total = allRecords.length;
      const totalPages = Math.ceil(total / pageSize);
      const offset = (page - 1) * pageSize;
      const data = allRecords.slice(offset, offset + pageSize);

      return {
        data,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error('Error getting paginated medical records:', error);
      throw new Error('Failed to retrieve paginated medical records');
    }
  }

  /**
   * Get a single medical record by ID
   */
  static async getMedicalRecordById(id: string): Promise<MedicalRecord | undefined> {
    try {
      return await db.medicalRecords.get(id);
    } catch (error) {
      console.error('Error getting medical record by ID:', error);
      throw new Error(`Failed to retrieve medical record with ID: ${id}`);
    }
  }

  /**
   * Get a medical record by record ID (business ID)
   */
  static async getMedicalRecordByRecordId(recordId: string): Promise<MedicalRecord | undefined> {
    try {
      return await db.medicalRecords.where({ recordId }).first();
    } catch (error) {
      console.error('Error getting medical record by record ID:', error);
      throw new Error(`Failed to retrieve medical record with record ID: ${recordId}`);
    }
  }

  /**
   * Create a new medical record with file attachment support
   */
  static async createMedicalRecord(recordData: CreateMedicalRecordData): Promise<MedicalRecord> {
    try {
      // Validate patient exists
      const patient = await db.patients.get(recordData.patientId);
      if (!patient) {
        throw new Error(`Patient with ID ${recordData.patientId} not found`);
      }

      const record: MedicalRecord = {
        id: uuidv4(),
        recordId: `MR-${Date.now()}`,
        patientId: recordData.patientId,
        recordType: recordData.recordType,
        title: recordData.title,
        content: recordData.content,
        diagnosis: recordData.diagnosis,
        medications: recordData.medications || [],
        doctorName: recordData.doctorName,
        hospitalName: recordData.hospitalName,
        visitDate: recordData.visitDate,
        attachments: recordData.attachments || [],
        geminiAnalysis: recordData.geminiAnalysis,
        linkedProductIds: recordData.linkedProductIds || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.medicalRecords.add(record);

      // Log the action
      await this.logAction('medical_record_created', record.id, {
        recordId: record.recordId,
        patientId: record.patientId,
        recordType: record.recordType,
        title: record.title,
      });

      return record;
    } catch (error) {
      console.error('Error creating medical record:', error);
      throw error;
    }
  }

  /**
   * Update an existing medical record with version history
   */
  static async updateMedicalRecord(id: string, updates: Partial<MedicalRecord>): Promise<MedicalRecord> {
    try {
      const existing = await db.medicalRecords.get(id);
      if (!existing) {
        throw new Error(`Medical record with ID ${id} not found`);
      }

      // Store version history in system logs
      await this.logAction('medical_record_version', id, {
        version: new Date().toISOString(),
        previousState: existing,
        changes: updates,
      });

      await db.medicalRecords.update(id, {
        ...updates,
        updatedAt: new Date(),
      });

      const updated = await db.medicalRecords.get(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated medical record');
      }

      // Log the action
      await this.logAction('medical_record_updated', id, {
        recordId: existing.recordId,
        changes: updates,
      });

      return updated;
    } catch (error) {
      console.error('Error updating medical record:', error);
      throw error;
    }
  }

  /**
   * Delete a medical record
   */
  static async deleteMedicalRecord(id: string): Promise<void> {
    try {
      const record = await db.medicalRecords.get(id);
      if (!record) {
        throw new Error(`Medical record with ID ${id} not found`);
      }

      // Archive the record in system logs before deletion
      await this.logAction('medical_record_archived', id, {
        recordId: record.recordId,
        archivedRecord: record,
      });

      await db.medicalRecords.delete(id);

      // Log the action
      await this.logAction('medical_record_deleted', id, {
        recordId: record.recordId,
        patientId: record.patientId,
      });
    } catch (error) {
      console.error('Error deleting medical record:', error);
      throw error;
    }
  }

  /**
   * Get medical records by patient
   */
  static async getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]> {
    try {
      return await db.medicalRecords
        .where({ patientId })
        .reverse()
        .sortBy('visitDate');
    } catch (error) {
      console.error('Error getting medical records by patient:', error);
      throw new Error(`Failed to retrieve medical records for patient: ${patientId}`);
    }
  }

  /**
   * Get medical records by type
   */
  static async getMedicalRecordsByType(recordType: RecordType): Promise<MedicalRecord[]> {
    try {
      return await db.medicalRecords
        .where({ recordType })
        .reverse()
        .sortBy('visitDate');
    } catch (error) {
      console.error('Error getting medical records by type:', error);
      throw new Error(`Failed to retrieve medical records of type: ${recordType}`);
    }
  }

  /**
   * Get medical records by doctor
   */
  static async getMedicalRecordsByDoctor(doctorName: string): Promise<MedicalRecord[]> {
    try {
      return await db.medicalRecords
        .where({ doctorName })
        .reverse()
        .sortBy('visitDate');
    } catch (error) {
      console.error('Error getting medical records by doctor:', error);
      throw new Error(`Failed to retrieve medical records for doctor: ${doctorName}`);
    }
  }

  /**
   * Get medical records by hospital
   */
  static async getMedicalRecordsByHospital(hospitalName: string): Promise<MedicalRecord[]> {
    try {
      return await db.medicalRecords
        .where({ hospitalName })
        .reverse()
        .sortBy('visitDate');
    } catch (error) {
      console.error('Error getting medical records by hospital:', error);
      throw new Error(`Failed to retrieve medical records for hospital: ${hospitalName}`);
    }
  }

  /**
   * Get medical records by date range
   */
  static async getMedicalRecordsByDateRange(startDate: Date, endDate: Date): Promise<MedicalRecord[]> {
    try {
      return await db.medicalRecords
        .where('visitDate')
        .between(startDate, endDate, true, true)
        .reverse()
        .sortBy('visitDate');
    } catch (error) {
      console.error('Error getting medical records by date range:', error);
      throw new Error('Failed to retrieve medical records by date range');
    }
  }

  /**
   * Add attachment to medical record
   */
  static async addAttachment(recordId: string, attachment: Attachment): Promise<MedicalRecord> {
    try {
      const record = await db.medicalRecords.get(recordId);
      if (!record) {
        throw new Error(`Medical record with ID ${recordId} not found`);
      }

      const updatedAttachments = [...(record.attachments || []), attachment];

      await db.medicalRecords.update(recordId, {
        attachments: updatedAttachments,
        updatedAt: new Date(),
      });

      const updated = await db.medicalRecords.get(recordId);
      if (!updated) {
        throw new Error('Failed to retrieve updated medical record');
      }

      // Log the action
      await this.logAction('attachment_added', recordId, {
        recordId: record.recordId,
        attachmentId: attachment.id,
        fileName: attachment.fileName,
      });

      return updated;
    } catch (error) {
      console.error('Error adding attachment:', error);
      throw error;
    }
  }

  /**
   * Remove attachment from medical record
   */
  static async removeAttachment(recordId: string, attachmentId: string): Promise<MedicalRecord> {
    try {
      const record = await db.medicalRecords.get(recordId);
      if (!record) {
        throw new Error(`Medical record with ID ${recordId} not found`);
      }

      const updatedAttachments = (record.attachments || []).filter(a => a.id !== attachmentId);

      await db.medicalRecords.update(recordId, {
        attachments: updatedAttachments,
        updatedAt: new Date(),
      });

      const updated = await db.medicalRecords.get(recordId);
      if (!updated) {
        throw new Error('Failed to retrieve updated medical record');
      }

      // Log the action
      await this.logAction('attachment_removed', recordId, {
        recordId: record.recordId,
        attachmentId,
      });

      return updated;
    } catch (error) {
      console.error('Error removing attachment:', error);
      throw error;
    }
  }

  /**
   * Link products to medical record
   */
  static async linkProducts(recordId: string, productIds: string[]): Promise<MedicalRecord> {
    try {
      const record = await db.medicalRecords.get(recordId);
      if (!record) {
        throw new Error(`Medical record with ID ${recordId} not found`);
      }

      // Validate products exist
      for (const productId of productIds) {
        const product = await db.products.get(productId);
        if (!product) {
          throw new Error(`Product with ID ${productId} not found`);
        }
      }

      // Merge with existing linked products (avoid duplicates)
      const existingIds = record.linkedProductIds || [];
      const updatedProductIds = [...new Set([...existingIds, ...productIds])];

      await db.medicalRecords.update(recordId, {
        linkedProductIds: updatedProductIds,
        updatedAt: new Date(),
      });

      const updated = await db.medicalRecords.get(recordId);
      if (!updated) {
        throw new Error('Failed to retrieve updated medical record');
      }

      // Log the action
      await this.logAction('products_linked', recordId, {
        recordId: record.recordId,
        productIds,
      });

      return updated;
    } catch (error) {
      console.error('Error linking products:', error);
      throw error;
    }
  }

  /**
   * Unlink products from medical record
   */
  static async unlinkProducts(recordId: string, productIds: string[]): Promise<MedicalRecord> {
    try {
      const record = await db.medicalRecords.get(recordId);
      if (!record) {
        throw new Error(`Medical record with ID ${recordId} not found`);
      }

      const updatedProductIds = (record.linkedProductIds || []).filter(id => !productIds.includes(id));

      await db.medicalRecords.update(recordId, {
        linkedProductIds: updatedProductIds,
        updatedAt: new Date(),
      });

      const updated = await db.medicalRecords.get(recordId);
      if (!updated) {
        throw new Error('Failed to retrieve updated medical record');
      }

      // Log the action
      await this.logAction('products_unlinked', recordId, {
        recordId: record.recordId,
        productIds,
      });

      return updated;
    } catch (error) {
      console.error('Error unlinking products:', error);
      throw error;
    }
  }

  /**
   * Update Gemini analysis for a medical record
   */
  static async updateGeminiAnalysis(recordId: string, analysis: GeminiAnalysis): Promise<MedicalRecord> {
    try {
      const record = await db.medicalRecords.get(recordId);
      if (!record) {
        throw new Error(`Medical record with ID ${recordId} not found`);
      }

      await db.medicalRecords.update(recordId, {
        geminiAnalysis: analysis,
        updatedAt: new Date(),
      });

      const updated = await db.medicalRecords.get(recordId);
      if (!updated) {
        throw new Error('Failed to retrieve updated medical record');
      }

      // Log the action
      await this.logAction('gemini_analysis_updated', recordId, {
        recordId: record.recordId,
        confidence: analysis.confidence,
      });

      return updated;
    } catch (error) {
      console.error('Error updating Gemini analysis:', error);
      throw error;
    }
  }

  /**
   * Search medical records
   */
  static async searchMedicalRecords(searchTerm: string, filters?: MedicalRecordFilters): Promise<MedicalRecord[]> {
    return this.getMedicalRecords({
      ...filters,
      searchTerm,
    });
  }

  /**
   * Get medical record statistics
   */
  static async getMedicalRecordStats(): Promise<{
    total: number;
    byType: Record<RecordType, number>;
    withAttachments: number;
    withGeminiAnalysis: number;
    linkedToProducts: number;
    byDoctor: Record<string, number>;
    byHospital: Record<string, number>;
  }> {
    try {
      const allRecords = await db.medicalRecords.toArray();

      const byType: Record<RecordType, number> = {
        consultation: 0,
        'lab-result': 0,
        prescription: 0,
        imaging: 0,
        surgery: 0,
        other: 0,
      };

      const byDoctor: Record<string, number> = {};
      const byHospital: Record<string, number> = {};

      let withAttachments = 0;
      let withGeminiAnalysis = 0;
      let linkedToProducts = 0;

      for (const record of allRecords) {
        byType[record.recordType]++;

        if (record.attachments && record.attachments.length > 0) withAttachments++;
        if (record.geminiAnalysis) withGeminiAnalysis++;
        if (record.linkedProductIds && record.linkedProductIds.length > 0) linkedToProducts++;

        if (record.doctorName) {
          byDoctor[record.doctorName] = (byDoctor[record.doctorName] || 0) + 1;
        }

        if (record.hospitalName) {
          byHospital[record.hospitalName] = (byHospital[record.hospitalName] || 0) + 1;
        }
      }

      return {
        total: allRecords.length,
        byType,
        withAttachments,
        withGeminiAnalysis,
        linkedToProducts,
        byDoctor,
        byHospital,
      };
    } catch (error) {
      console.error('Error getting medical record stats:', error);
      throw new Error('Failed to retrieve medical record statistics');
    }
  }

  /**
   * Get common diagnoses
   */
  static async getCommonDiagnoses(limit: number = 10): Promise<Array<{ diagnosis: string; count: number }>> {
    try {
      const records = await db.medicalRecords.toArray();
      const diagnosisCounts: Record<string, number> = {};

      for (const record of records) {
        if (record.diagnosis) {
          diagnosisCounts[record.diagnosis] = (diagnosisCounts[record.diagnosis] || 0) + 1;
        }
      }

      return Object.entries(diagnosisCounts)
        .map(([diagnosis, count]) => ({ diagnosis, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting common diagnoses:', error);
      throw new Error('Failed to retrieve common diagnoses');
    }
  }

  /**
   * Get common medications
   */
  static async getCommonMedications(limit: number = 10): Promise<Array<{ medication: string; count: number }>> {
    try {
      const records = await db.medicalRecords.toArray();
      const medicationCounts: Record<string, number> = {};

      for (const record of records) {
        if (record.medications) {
          for (const med of record.medications) {
            medicationCounts[med.name] = (medicationCounts[med.name] || 0) + 1;
          }
        }
      }

      return Object.entries(medicationCounts)
        .map(([medication, count]) => ({ medication, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting common medications:', error);
      throw new Error('Failed to retrieve common medications');
    }
  }

  /**
   * Get version history for a medical record
   */
  static async getVersionHistory(recordId: string): Promise<any[]> {
    try {
      const logs = await db.systemLogs
        .where({ entityId: recordId, action: 'medical_record_version' })
        .reverse()
        .sortBy('timestamp');

      return logs.map(log => ({
        timestamp: log.timestamp,
        details: JSON.parse(log.details),
      }));
    } catch (error) {
      console.error('Error getting version history:', error);
      throw new Error(`Failed to retrieve version history for record: ${recordId}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Log an action to system logs
   */
  private static async logAction(action: string, entityId: string, details: any): Promise<void> {
    try {
      await db.systemLogs.add({
        id: uuidv4(),
        action,
        entityType: 'medical_record',
        entityId,
        details: JSON.stringify(details),
        userId: 'system', // In real implementation, get from auth context
        timestamp: new Date(),
        status: 'success',
      });
    } catch (error) {
      console.error('Error logging action:', error);
      // Don't throw - logging failures shouldn't break the main operation
    }
  }
}

// Export convenience functions
export const {
  getMedicalRecords,
  getPaginatedMedicalRecords,
  getMedicalRecordById,
  getMedicalRecordByRecordId,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  getMedicalRecordsByPatient,
  getMedicalRecordsByType,
  getMedicalRecordsByDoctor,
  getMedicalRecordsByHospital,
  getMedicalRecordsByDateRange,
  addAttachment,
  removeAttachment,
  linkProducts,
  unlinkProducts,
  updateGeminiAnalysis,
  searchMedicalRecords,
  getMedicalRecordStats,
  getCommonDiagnoses,
  getCommonMedications,
  getVersionHistory,
} = MedicalRecordsService;
