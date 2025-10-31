"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PatientForm } from "@/components/patients/PatientForm";
import { PatientService } from "@/services/database/patients";
import type { Patient } from "@/types/database";

export default function EditPatientPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      loadPatient();
    }
  }, [patientId]);

  const loadPatient = async () => {
    try {
      setLoading(true);
      const patientData = await PatientService.getPatientById(patientId);
      
      if (!patientData) {
        router.push("/patients");
        return;
      }

      setPatient(patientData);
    } catch (error) {
      console.error("Error loading patient:", error);
      router.push("/patients");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading patient...</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Patient</h1>
          <p className="text-muted-foreground">
            Update patient information for {patient.firstName} {patient.lastName}
          </p>
        </div>
      </div>

      {/* Form */}
      <PatientForm patient={patient} />
    </div>
  );
}
