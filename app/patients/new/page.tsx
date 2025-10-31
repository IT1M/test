"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PatientForm } from "@/components/patients/PatientForm";

export default function NewPatientPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Patient</h1>
          <p className="text-muted-foreground">
            Register a new patient in the system
          </p>
        </div>
      </div>

      {/* Form */}
      <PatientForm />
    </div>
  );
}
