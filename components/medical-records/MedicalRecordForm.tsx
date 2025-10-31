"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MedicalRecordsService } from "@/services/database/medical-records";
import { PatientService } from "@/services/database/patients";
import type { MedicalRecord, RecordType, Patient, Medication } from "@/types/database";
import { AlertCircle, X, Plus, Upload } from "lucide-react";

interface MedicalRecordFormProps {
  record?: MedicalRecord;
  preselectedPatientId?: string;
  onSuccess?: (record: MedicalRecord) => void;
}

export function MedicalRecordForm({ record, preselectedPatientId, onSuccess }: MedicalRecordFormProps) {
  const router = useRouter();
  const isEditing = !!record;

  const [formData, setFormData] = useState({
    patientId: record?.patientId || preselectedPatientId || "",
    recordType: record?.recordType || ("consultation" as RecordType),
    title: record?.title || "",
    content: record?.content || "",
    diagnosis: record?.diagnosis || "",
    doctorName: record?.doctorName || "",
    hospitalName: record?.hospitalName || "",
    visitDate: record?.visitDate 
      ? new Date(record.visitDate).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0],
    medications: record?.medications || [],
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string>("");

  // Medication form state
  const [medicationForm, setMedicationForm] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
  });

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processingFiles, setProcessingFiles] = useState(false);

  // Load patients
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const allPatients = await PatientService.getPatients();
      setPatients(allPatients);
    } catch (error) {
      console.error("Error loading patients:", error);
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (!isEditing) {
      const timer = setTimeout(() => {
        localStorage.setItem("medicalRecordFormDraft", JSON.stringify(formData));
      }, 30000); // Auto-save every 30 seconds

      return () => clearTimeout(timer);
    }
  }, [formData, isEditing]);

  // Load draft on mount for new records
  useEffect(() => {
    if (!isEditing && !preselectedPatientId) {
      const draft = localStorage.getItem("medicalRecordFormDraft");
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          setFormData(parsedDraft);
        } catch (error) {
          console.error("Error loading draft:", error);
        }
      }
    }
  }, [isEditing, preselectedPatientId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.patientId) {
      newErrors.patientId = "Patient is required";
    }
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    }
    if (!formData.visitDate) {
      newErrors.visitDate = "Visit date is required";
    }

    // Visit date validation (cannot be in the future)
    if (formData.visitDate) {
      const visitDate = new Date(formData.visitDate);
      if (visitDate > new Date()) {
        newErrors.visitDate = "Visit date cannot be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setGeneralError("");

    try {
      const recordData = {
        patientId: formData.patientId,
        recordType: formData.recordType,
        title: formData.title,
        content: formData.content,
        diagnosis: formData.diagnosis || undefined,
        medications: formData.medications.length > 0 ? formData.medications : undefined,
        doctorName: formData.doctorName || undefined,
        hospitalName: formData.hospitalName || undefined,
        visitDate: new Date(formData.visitDate),
      };

      let savedRecord: MedicalRecord;

      if (isEditing && record) {
        savedRecord = await MedicalRecordsService.updateMedicalRecord(record.id, recordData);
      } else {
        savedRecord = await MedicalRecordsService.createMedicalRecord(recordData);
        // Clear draft after successful creation
        localStorage.removeItem("medicalRecordFormDraft");
      }

      if (onSuccess) {
        onSuccess(savedRecord);
      } else {
        router.push(`/medical-records/${savedRecord.id}`);
      }
    } catch (error: any) {
      console.error("Error saving medical record:", error);
      setGeneralError(error.message || "Failed to save medical record");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addMedication = () => {
    if (medicationForm.name.trim() && medicationForm.dosage.trim()) {
      setFormData((prev) => ({
        ...prev,
        medications: [...prev.medications, { ...medicationForm }],
      }));
      setMedicationForm({
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
      });
    }
  };

  const removeMedication = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
    });

    if (validFiles.length === 0) {
      setGeneralError("Please upload valid files (PDF, JPG, PNG) under 10MB");
      return;
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
    
    // Note: OCR processing would be implemented here with Gemini Vision API
    // For now, we just store the file references
    setProcessingFiles(true);
    setTimeout(() => {
      setProcessingFiles(false);
      // In a real implementation, this would extract data and populate form fields
    }, 1000);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName} (${patient.patientId})` : "";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {generalError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <div className="font-medium text-red-900">Error</div>
            <div className="text-sm text-red-700">{generalError}</div>
          </div>
        </div>
      )}

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Document Upload (Optional)
          </CardTitle>
          <CardDescription>
            Upload medical documents for OCR processing and automatic field extraction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={processingFiles}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, JPG, PNG up to 10MB
              </p>
            </label>
          </div>

          {processingFiles && (
            <div className="text-center text-sm text-muted-foreground">
              Processing files with OCR...
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Files</Label>
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm truncate">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Enter the medical record's basic details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">
                Patient <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.patientId}
                onValueChange={(value) => handleChange("patientId", value)}
                disabled={!!preselectedPatientId}
              >
                <SelectTrigger id="patientId" className={errors.patientId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} ({patient.patientId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.patientId && (
                <p className="text-sm text-red-500">{errors.patientId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recordType">
                Record Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.recordType}
                onValueChange={(value) => handleChange("recordType", value)}
              >
                <SelectTrigger id="recordType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="lab-result">Lab Result</SelectItem>
                  <SelectItem value="prescription">Prescription</SelectItem>
                  <SelectItem value="imaging">Imaging</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Enter record title"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitDate">
              Visit Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="visitDate"
              type="date"
              value={formData.visitDate}
              onChange={(e) => handleChange("visitDate", e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={errors.visitDate ? "border-red-500" : ""}
            />
            {errors.visitDate && (
              <p className="text-sm text-red-500">{errors.visitDate}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Medical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Details</CardTitle>
          <CardDescription>
            Enter diagnosis and medical content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Input
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => handleChange("diagnosis", e.target.value)}
              placeholder="Enter diagnosis"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">
              Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="Enter detailed medical information"
              rows={8}
              className={errors.content ? "border-red-500" : ""}
            />
            {errors.content && (
              <p className="text-sm text-red-500">{errors.content}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Healthcare Provider Information */}
      <Card>
        <CardHeader>
          <CardTitle>Healthcare Provider Information</CardTitle>
          <CardDescription>
            Enter doctor and hospital details (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doctorName">Doctor Name</Label>
              <Input
                id="doctorName"
                value={formData.doctorName}
                onChange={(e) => handleChange("doctorName", e.target.value)}
                placeholder="Dr. John Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hospitalName">Hospital/Clinic Name</Label>
              <Input
                id="hospitalName"
                value={formData.hospitalName}
                onChange={(e) => handleChange("hospitalName", e.target.value)}
                placeholder="General Hospital"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medications */}
      <Card>
        <CardHeader>
          <CardTitle>Medications</CardTitle>
          <CardDescription>
            Add prescribed medications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="medName">Medication Name</Label>
              <Input
                id="medName"
                value={medicationForm.name}
                onChange={(e) => setMedicationForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Aspirin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medDosage">Dosage</Label>
              <Input
                id="medDosage"
                value={medicationForm.dosage}
                onChange={(e) => setMedicationForm(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="e.g., 100mg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medFrequency">Frequency</Label>
              <Input
                id="medFrequency"
                value={medicationForm.frequency}
                onChange={(e) => setMedicationForm(prev => ({ ...prev, frequency: e.target.value }))}
                placeholder="e.g., Twice daily"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medDuration">Duration</Label>
              <Input
                id="medDuration"
                value={medicationForm.duration}
                onChange={(e) => setMedicationForm(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g., 7 days"
              />
            </div>
          </div>

          <Button type="button" onClick={addMedication} variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Medication
          </Button>

          {formData.medications.length > 0 && (
            <div className="space-y-2">
              <Label>Added Medications</Label>
              {formData.medications.map((med, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{med.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {med.dosage} • {med.frequency} • {med.duration}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMedication(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEditing ? "Update Record" : "Create Record"}
        </Button>
      </div>
    </form>
  );
}
