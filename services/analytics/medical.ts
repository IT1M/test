// Medical Analytics Service

import { db } from '@/lib/db/schema';
import type { Patient, MedicalRecord } from '@/types/database';

export interface PatientDemographics {
  ageGroups: Array<{ group: string; count: number; percentage: number }>;
  genderDistribution: Array<{ gender: string; count: number; percentage: number }>;
  totalPatients: number;
}

export interface CommonDiagnosis {
  diagnosis: string;
  count: number;
  percentage: number;
  averageAge: number;
}

export interface MedicationUsage {
  medicationName: string;
  prescriptionCount: number;
  patientCount: number;
  commonDosage: string;
}

export interface VisitFrequency {
  patientId: string;
  patientName: string;
  visitCount: number;
  lastVisitDate: Date;
  averageDaysBetweenVisits: number;
}

export class MedicalAnalyticsService {
  /**
   * Get patient demographics
   */
  static async getPatientDemographics(): Promise<PatientDemographics> {
    try {
      const patients = await db.patients.toArray();
      const totalPatients = patients.length;

      // Age groups
      const ageGroups = {
        '0-18': 0,
        '19-30': 0,
        '31-45': 0,
        '46-60': 0,
        '61+': 0,
      };

      for (const patient of patients) {
        const age = this.calculateAge(patient.dateOfBirth);
        if (age <= 18) ageGroups['0-18']++;
        else if (age <= 30) ageGroups['19-30']++;
        else if (age <= 45) ageGroups['31-45']++;
        else if (age <= 60) ageGroups['46-60']++;
        else ageGroups['61+']++;
      }

      const ageGroupsData = Object.entries(ageGroups).map(([group, count]) => ({
        group,
        count,
        percentage: totalPatients > 0 ? (count / totalPatients) * 100 : 0,
      }));

      // Gender distribution
      const genderCounts = new Map<string, number>();
      for (const patient of patients) {
        genderCounts.set(patient.gender, (genderCounts.get(patient.gender) || 0) + 1);
      }

      const genderDistribution = Array.from(genderCounts.entries()).map(([gender, count]) => ({
        gender,
        count,
        percentage: totalPatients > 0 ? (count / totalPatients) * 100 : 0,
      }));

      return {
        ageGroups: ageGroupsData,
        genderDistribution,
        totalPatients,
      };
    } catch (error) {
      console.error('Error getting patient demographics:', error);
      throw new Error('Failed to retrieve patient demographics');
    }
  }

  /**
   * Get common diagnoses
   */
  static async getCommonDiagnoses(limit: number = 10): Promise<CommonDiagnosis[]> {
    try {
      const records = await db.medicalRecords.toArray();
      const patients = await db.patients.toArray();

      const diagnosisCounts = new Map<string, {
        count: number;
        ages: number[];
      }>();

      for (const record of records) {
        if (!record.diagnosis) continue;

        const patient = patients.find(p => p.id === record.patientId);
        if (!patient) continue;

        const age = this.calculateAge(patient.dateOfBirth);
        const current = diagnosisCounts.get(record.diagnosis) || {
          count: 0,
          ages: [],
        };

        diagnosisCounts.set(record.diagnosis, {
          count: current.count + 1,
          ages: [...current.ages, age],
        });
      }

      const totalRecords = records.filter(r => r.diagnosis).length;

      return Array.from(diagnosisCounts.entries())
        .map(([diagnosis, data]) => ({
          diagnosis,
          count: data.count,
          percentage: totalRecords > 0 ? (data.count / totalRecords) * 100 : 0,
          averageAge: data.ages.reduce((sum, age) => sum + age, 0) / data.ages.length,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting common diagnoses:', error);
      throw new Error('Failed to retrieve common diagnoses');
    }
  }

  /**
   * Get medication usage statistics
   */
  static async getMedicationUsage(limit: number = 10): Promise<MedicationUsage[]> {
    try {
      const records = await db.medicalRecords.toArray();

      const medicationData = new Map<string, {
        prescriptionCount: number;
        patientIds: Set<string>;
        dosages: string[];
      }>();

      for (const record of records) {
        if (!record.medications) continue;

        for (const med of record.medications) {
          const current = medicationData.get(med.name) || {
            prescriptionCount: 0,
            patientIds: new Set<string>(),
            dosages: [],
          };

          current.prescriptionCount++;
          current.patientIds.add(record.patientId);
          current.dosages.push(med.dosage);

          medicationData.set(med.name, current);
        }
      }

      return Array.from(medicationData.entries())
        .map(([medicationName, data]) => {
          // Find most common dosage
          const dosageCounts = new Map<string, number>();
          for (const dosage of data.dosages) {
            dosageCounts.set(dosage, (dosageCounts.get(dosage) || 0) + 1);
          }
          const commonDosage = Array.from(dosageCounts.entries())
            .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

          return {
            medicationName,
            prescriptionCount: data.prescriptionCount,
            patientCount: data.patientIds.size,
            commonDosage,
          };
        })
        .sort((a, b) => b.prescriptionCount - a.prescriptionCount)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting medication usage:', error);
      throw new Error('Failed to retrieve medication usage');
    }
  }

  /**
   * Get visit frequency patterns
   */
  static async getVisitFrequency(limit: number = 20): Promise<VisitFrequency[]> {
    try {
      const patients = await db.patients.toArray();
      const records = await db.medicalRecords.toArray();

      const visitData: VisitFrequency[] = [];

      for (const patient of patients) {
        const patientRecords = records
          .filter(r => r.patientId === patient.id)
          .sort((a, b) => a.visitDate.getTime() - b.visitDate.getTime());

        if (patientRecords.length === 0) continue;

        const visitCount = patientRecords.length;
        const lastVisitDate = patientRecords[patientRecords.length - 1].visitDate;

        // Calculate average days between visits
        let totalDays = 0;
        for (let i = 1; i < patientRecords.length; i++) {
          const daysBetween = Math.floor(
            (patientRecords[i].visitDate.getTime() - patientRecords[i - 1].visitDate.getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          totalDays += daysBetween;
        }

        const averageDaysBetweenVisits = patientRecords.length > 1 
          ? totalDays / (patientRecords.length - 1) 
          : 0;

        visitData.push({
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`,
          visitCount,
          lastVisitDate,
          averageDaysBetweenVisits,
        });
      }

      return visitData
        .sort((a, b) => b.visitCount - a.visitCount)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting visit frequency:', error);
      throw new Error('Failed to retrieve visit frequency');
    }
  }

  /**
   * Helper to calculate age from date of birth
   */
  private static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}

export const {
  getPatientDemographics,
  getCommonDiagnoses,
  getMedicationUsage,
  getVisitFrequency,
} = MedicalAnalyticsService;
