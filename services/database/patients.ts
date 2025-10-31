// Patient Service - CRUD operations and business logic for patients

import { db } from '@/lib/db/schema';
import type { Patient, Gender, PaginatedResult } from '@/types/database';
import { calculateAge } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Patient filters for search and filtering
 */
export interface PatientFilters {
  gender?: Gender;
  linkedCustomerId?: string;
  minAge?: number;
  maxAge?: number;
  searchTerm?: string;
  bloodType?: string;
}

/**
 * PatientService - Handles all patient-related database operations
 */
export class PatientService {
  /**
   * Get all patients with optional filters
   */
  static async getPatients(filters?: PatientFilters): Promise<Patient[]> {
    try {
      let query = db.patients.toCollection();

      // Apply filters
      if (filters?.gender) {
        query = query.filter(p => p.gender === filters.gender);
      }

      if (filters?.linkedCustomerId) {
        query = query.filter(p => p.linkedCustomerId === filters.linkedCustomerId);
      }

      if (filters?.bloodType) {
        query = query.filter(p => p.bloodType === filters.bloodType);
      }

      if (filters?.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        query = query.filter(p => 
          p.firstName.toLowerCase().includes(searchLower) ||
          p.lastName.toLowerCase().includes(searchLower) ||
          p.nationalId.includes(searchLower) ||
          p.patientId.toLowerCase().includes(searchLower) ||
          p.phone.includes(searchLower) ||
          (p.email?.toLowerCase().includes(searchLower) ?? false)
        );
      }

      let patients = await query.toArray();

      // Apply age filters
      if (filters?.minAge !== undefined || filters?.maxAge !== undefined) {
        patients = patients.filter(p => {
          const age = calculateAge(p.dateOfBirth);
          if (filters.minAge !== undefined && age < filters.minAge) return false;
          if (filters.maxAge !== undefined && age > filters.maxAge) return false;
          return true;
        });
      }

      // Enrich with computed age
      return patients.map(p => this.enrichPatient(p));
    } catch (error) {
      console.error('Error getting patients:', error);
      throw new Error('Failed to retrieve patients');
    }
  }

  /**
   * Get paginated patients
   */
  static async getPaginatedPatients(
    page: number = 1,
    pageSize: number = 20,
    filters?: PatientFilters
  ): Promise<PaginatedResult<Patient>> {
    try {
      const allPatients = await this.getPatients(filters);
      const total = allPatients.length;
      const totalPages = Math.ceil(total / pageSize);
      const offset = (page - 1) * pageSize;
      const data = allPatients.slice(offset, offset + pageSize);

      return {
        data,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error('Error getting paginated patients:', error);
      throw new Error('Failed to retrieve paginated patients');
    }
  }

  /**
   * Get a single patient by ID
   */
  static async getPatientById(id: string): Promise<Patient | undefined> {
    try {
      const patient = await db.patients.get(id);
      return patient ? this.enrichPatient(patient) : undefined;
    } catch (error) {
      console.error('Error getting patient by ID:', error);
      throw new Error(`Failed to retrieve patient with ID: ${id}`);
    }
  }

  /**
   * Get a patient by patient ID (business ID)
   */
  static async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    try {
      const patient = await db.patients.where({ patientId }).first();
      return patient ? this.enrichPatient(patient) : undefined;
    } catch (error) {
      console.error('Error getting patient by patient ID:', error);
      throw new Error(`Failed to retrieve patient with patient ID: ${patientId}`);
    }
  }

  /**
   * Get a patient by national ID
   */
  static async getPatientByNationalId(nationalId: string): Promise<Patient | undefined> {
    try {
      const patient = await db.patients.where({ nationalId }).first();
      return patient ? this.enrichPatient(patient) : undefined;
    } catch (error) {
      console.error('Error getting patient by national ID:', error);
      throw new Error(`Failed to retrieve patient with national ID: ${nationalId}`);
    }
  }

  /**
   * Create a new patient
   */
  static async createPatient(patientData: Omit<Patient, 'id' | 'patientId' | 'age' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
    try {
      // Check for duplicate national ID
      const existingByNationalId = await this.getPatientByNationalId(patientData.nationalId);
      if (existingByNationalId) {
        throw new Error(`Patient with national ID ${patientData.nationalId} already exists`);
      }

      const patient: Patient = {
        ...patientData,
        id: uuidv4(),
        patientId: `PAT-${Date.now()}`,
        age: calculateAge(patientData.dateOfBirth),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.patients.add(patient);

      // Log the action
      await this.logAction('patient_created', patient.id, {
        patientId: patient.patientId,
        nationalId: patient.nationalId,
        name: `${patient.firstName} ${patient.lastName}`,
      });

      return this.enrichPatient(patient);
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  /**
   * Update an existing patient
   */
  static async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
    try {
      const existing = await db.patients.get(id);
      if (!existing) {
        throw new Error(`Patient with ID ${id} not found`);
      }

      // Check for national ID uniqueness if being updated
      if (updates.nationalId && updates.nationalId !== existing.nationalId) {
        const duplicate = await this.getPatientByNationalId(updates.nationalId);
        if (duplicate) {
          throw new Error(`Patient with national ID ${updates.nationalId} already exists`);
        }
      }

      // Recalculate age if date of birth is updated
      if (updates.dateOfBirth) {
        updates.age = calculateAge(updates.dateOfBirth);
      }

      await db.patients.update(id, {
        ...updates,
        updatedAt: new Date(),
      });

      const updated = await db.patients.get(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated patient');
      }

      // Log the action
      await this.logAction('patient_updated', id, {
        changes: updates,
      });

      return this.enrichPatient(updated);
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  /**
   * Delete a patient (soft delete - archive medical records)
   */
  static async deletePatient(id: string): Promise<void> {
    try {
      const patient = await db.patients.get(id);
      if (!patient) {
        throw new Error(`Patient with ID ${id} not found`);
      }

      // Check if patient has medical records
      const medicalRecords = await db.medicalRecords.where({ patientId: id }).count();
      if (medicalRecords > 0) {
        throw new Error('Cannot delete patient with existing medical records. Please archive records first.');
      }

      // Delete patient
      await db.patients.delete(id);

      // Log the action
      await this.logAction('patient_deleted', id, {
        patientId: patient.patientId,
        nationalId: patient.nationalId,
        name: `${patient.firstName} ${patient.lastName}`,
      });
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  }

  /**
   * Link patient to customer (healthcare facility)
   */
  static async linkPatientToCustomer(patientId: string, customerId: string): Promise<Patient> {
    try {
      const patient = await db.patients.get(patientId);
      if (!patient) {
        throw new Error(`Patient with ID ${patientId} not found`);
      }

      const customer = await db.customers.get(customerId);
      if (!customer) {
        throw new Error(`Customer with ID ${customerId} not found`);
      }

      // Verify customer is a healthcare facility
      if (!['hospital', 'clinic'].includes(customer.type)) {
        throw new Error('Customer must be a hospital or clinic to link patients');
      }

      await db.patients.update(patientId, {
        linkedCustomerId: customerId,
        updatedAt: new Date(),
      });

      const updated = await db.patients.get(patientId);
      if (!updated) {
        throw new Error('Failed to retrieve updated patient');
      }

      // Log the action
      await this.logAction('patient_linked_to_customer', patientId, {
        customerId,
        customerName: customer.name,
      });

      return this.enrichPatient(updated);
    } catch (error) {
      console.error('Error linking patient to customer:', error);
      throw error;
    }
  }

  /**
   * Unlink patient from customer
   */
  static async unlinkPatientFromCustomer(patientId: string): Promise<Patient> {
    try {
      const patient = await db.patients.get(patientId);
      if (!patient) {
        throw new Error(`Patient with ID ${patientId} not found`);
      }

      await db.patients.update(patientId, {
        linkedCustomerId: undefined,
        updatedAt: new Date(),
      });

      const updated = await db.patients.get(patientId);
      if (!updated) {
        throw new Error('Failed to retrieve updated patient');
      }

      // Log the action
      await this.logAction('patient_unlinked_from_customer', patientId, {
        previousCustomerId: patient.linkedCustomerId,
      });

      return this.enrichPatient(updated);
    } catch (error) {
      console.error('Error unlinking patient from customer:', error);
      throw error;
    }
  }

  /**
   * Get patients by customer (healthcare facility)
   */
  static async getPatientsByCustomer(customerId: string): Promise<Patient[]> {
    try {
      const patients = await db.patients
        .where({ linkedCustomerId: customerId })
        .toArray();

      return patients.map(p => this.enrichPatient(p));
    } catch (error) {
      console.error('Error getting patients by customer:', error);
      throw new Error(`Failed to retrieve patients for customer: ${customerId}`);
    }
  }

  /**
   * Get patients by age range
   */
  static async getPatientsByAgeRange(minAge: number, maxAge: number): Promise<Patient[]> {
    try {
      return await this.getPatients({ minAge, maxAge });
    } catch (error) {
      console.error('Error getting patients by age range:', error);
      throw new Error('Failed to retrieve patients by age range');
    }
  }

  /**
   * Get patients by gender
   */
  static async getPatientsByGender(gender: Gender): Promise<Patient[]> {
    try {
      return await this.getPatients({ gender });
    } catch (error) {
      console.error('Error getting patients by gender:', error);
      throw new Error(`Failed to retrieve patients by gender: ${gender}`);
    }
  }

  /**
   * Search patients
   */
  static async searchPatients(searchTerm: string, filters?: PatientFilters): Promise<Patient[]> {
    return this.getPatients({
      ...filters,
      searchTerm,
    });
  }

  /**
   * Get patient medical history
   */
  static async getPatientMedicalHistory(patientId: string): Promise<any[]> {
    try {
      return await db.medicalRecords
        .where({ patientId })
        .reverse()
        .sortBy('visitDate');
    } catch (error) {
      console.error('Error getting patient medical history:', error);
      throw new Error(`Failed to retrieve medical history for patient: ${patientId}`);
    }
  }

  /**
   * Get patient statistics
   */
  static async getPatientStats(): Promise<{
    total: number;
    byGender: Record<Gender, number>;
    byAgeGroup: Record<string, number>;
    linkedToCustomers: number;
    averageAge: number;
    withAllergies: number;
    withChronicConditions: number;
  }> {
    try {
      const allPatients = await db.patients.toArray();

      const byGender: Record<Gender, number> = {
        male: 0,
        female: 0,
        other: 0,
      };

      const byAgeGroup: Record<string, number> = {
        '0-18': 0,
        '19-35': 0,
        '36-50': 0,
        '51-65': 0,
        '65+': 0,
      };

      let totalAge = 0;
      let linkedToCustomers = 0;
      let withAllergies = 0;
      let withChronicConditions = 0;

      for (const patient of allPatients) {
        const age = calculateAge(patient.dateOfBirth);
        
        byGender[patient.gender]++;
        totalAge += age;

        if (age <= 18) byAgeGroup['0-18']++;
        else if (age <= 35) byAgeGroup['19-35']++;
        else if (age <= 50) byAgeGroup['36-50']++;
        else if (age <= 65) byAgeGroup['51-65']++;
        else byAgeGroup['65+']++;

        if (patient.linkedCustomerId) linkedToCustomers++;
        if (patient.allergies && patient.allergies.length > 0) withAllergies++;
        if (patient.chronicConditions && patient.chronicConditions.length > 0) withChronicConditions++;
      }

      return {
        total: allPatients.length,
        byGender,
        byAgeGroup,
        linkedToCustomers,
        averageAge: allPatients.length > 0 ? totalAge / allPatients.length : 0,
        withAllergies,
        withChronicConditions,
      };
    } catch (error) {
      console.error('Error getting patient stats:', error);
      throw new Error('Failed to retrieve patient statistics');
    }
  }

  /**
   * Get all blood types
   */
  static async getBloodTypes(): Promise<string[]> {
    try {
      const patients = await db.patients.toArray();
      const bloodTypes = [...new Set(patients.map(p => p.bloodType).filter(Boolean))];
      return bloodTypes.sort() as string[];
    } catch (error) {
      console.error('Error getting blood types:', error);
      throw new Error('Failed to retrieve blood types');
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Enrich patient with computed fields
   */
  private static enrichPatient(patient: Patient): Patient {
    return {
      ...patient,
      age: calculateAge(patient.dateOfBirth),
    };
  }

  /**
   * Log an action to system logs
   */
  private static async logAction(action: string, entityId: string, details: any): Promise<void> {
    try {
      await db.systemLogs.add({
        id: uuidv4(),
        action,
        entityType: 'patient',
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
  getPatients,
  getPaginatedPatients,
  getPatientById,
  getPatientByPatientId,
  getPatientByNationalId,
  createPatient,
  updatePatient,
  deletePatient,
  linkPatientToCustomer,
  unlinkPatientFromCustomer,
  getPatientsByCustomer,
  getPatientsByAgeRange,
  getPatientsByGender,
  searchPatients,
  getPatientMedicalHistory,
  getPatientStats,
  getBloodTypes,
} = PatientService;
