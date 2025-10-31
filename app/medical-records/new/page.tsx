"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MedicalRecordForm } from "@/components/medical-records/MedicalRecordForm";

export default function NewMedicalRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add Medical Record</h1>
          <p className="text-muted-foreground">
            Create a new medical record with document upload support
          </p>
        </div>
      </div>

      {/* Form */}
      <MedicalRecordForm preselectedPatientId={patientId || undefined} />
    </div>
  );
}
