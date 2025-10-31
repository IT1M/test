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
import { PatientService } from "@/services/database/patients";
import { CustomerService } from "@/services/database/customers";
import type { Patient, Gender, Customer } from "@/types/database";
import { AlertCircle, X } from "lucide-react";

interface PatientFormProps {
  patient?: Patient;
  onSuccess?: (patient: Patient) => void;
}

export function PatientForm({ patient, onSuccess }: PatientFormProps) {
  const router = useRouter();
  const isEditing = !!patient;

  const [formData, setFormData] = useState({
    firstName: patient?.firstName || "",
    lastName: patient?.lastName || "",
    nationalId: patient?.nationalId || "",
    dateOfBirth: patient?.dateOfBirth 
      ? new Date(patient.dateOfBirth).toISOString().split('T')[0] 
      : "",
    gender: patient?.gender || ("male" as Gender),
    phone: patient?.phone || "",
    email: patient?.email || "",
    address: patient?.address || "",
    bloodType: patient?.bloodType || "",
    linkedCustomerId: patient?.linkedCustomerId || "",
    allergies: patient?.allergies || [],
    chronicConditions: patient?.chronicConditions || [],
  });

  const [allergyInput, setAllergyInput] = useState("");
  const [conditionInput, setConditionInput] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string>("");

  // Load healthcare facilities
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const allCustomers = await CustomerService.getCustomers({ isActive: true });
      const healthcareFacilities = allCustomers.filter(
        c => c.type === 'hospital' || c.type === 'clinic'
      );
      setCustomers(healthcareFacilities);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (!isEditing) {
      const timer = setTimeout(() => {
        localStorage.setItem("patientFormDraft", JSON.stringify(formData));
      }, 30000); // Auto-save every 30 seconds

      return () => clearTimeout(timer);
    }
  }, [formData, isEditing]);

  // Load draft on mount for new patients
  useEffect(() => {
    if (!isEditing) {
      const draft = localStorage.getItem("patientFormDraft");
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          setFormData(parsedDraft);
        } catch (error) {
          console.error("Error loading draft:", error);
        }
      }
    }
  }, [isEditing]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.nationalId.trim()) {
      newErrors.nationalId = "National ID is required";
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
    }

    // Phone validation (basic)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }

    // Date of birth validation (must be in the past)
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      if (dob > new Date()) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkDuplicates = async (): Promise<boolean> => {
    try {
      // Check national ID duplicate
      if (!isEditing || formData.nationalId !== patient?.nationalId) {
        const existingByNationalId = await PatientService.getPatientByNationalId(formData.nationalId);
        if (existingByNationalId) {
          setDuplicateError(`Patient with national ID ${formData.nationalId} already exists`);
          return false;
        }
      }

      setDuplicateError("");
      return true;
    } catch (error) {
      console.error("Error checking duplicates:", error);
      return true; // Continue if check fails
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setDuplicateError("");

    try {
      // Check for duplicates
      const noDuplicates = await checkDuplicates();
      if (!noDuplicates) {
        setLoading(false);
        return;
      }

      const patientData = {
        ...formData,
        dateOfBirth: new Date(formData.dateOfBirth),
        linkedCustomerId: formData.linkedCustomerId || undefined,
        email: formData.email || undefined,
        bloodType: formData.bloodType || undefined,
      };

      let savedPatient: Patient;

      if (isEditing && patient) {
        savedPatient = await PatientService.updatePatient(patient.id, patientData);
      } else {
        savedPatient = await PatientService.createPatient(patientData);
        // Clear draft after successful creation
        localStorage.removeItem("patientFormDraft");
      }

      if (onSuccess) {
        onSuccess(savedPatient);
      } else {
        router.push(`/patients/${savedPatient.id}`);
      }
    } catch (error: any) {
      console.error("Error saving patient:", error);
      setDuplicateError(error.message || "Failed to save patient");
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

  const addAllergy = () => {
    if (allergyInput.trim() && !formData.allergies.includes(allergyInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        allergies: [...prev.allergies, allergyInput.trim()],
      }));
      setAllergyInput("");
    }
  };

  const removeAllergy = (allergy: string) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((a) => a !== allergy),
    }));
  };

  const addCondition = () => {
    if (conditionInput.trim() && !formData.chronicConditions.includes(conditionInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        chronicConditions: [...prev.chronicConditions, conditionInput.trim()],
      }));
      setConditionInput("");
    }
  };

  const removeCondition = (condition: string) => {
    setFormData((prev) => ({
      ...prev,
      chronicConditions: prev.chronicConditions.filter((c) => c !== condition),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {duplicateError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <div className="font-medium text-red-900">Duplicate Patient</div>
            <div className="text-sm text-red-700">{duplicateError}</div>
          </div>
        </div>
      )}

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Enter the patient's basic personal details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="Enter first name"
                className={errors.firstName ? "border-red-500" : ""}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Enter last name"
                className={errors.lastName ? "border-red-500" : ""}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nationalId">
                National ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nationalId"
                value={formData.nationalId}
                onChange={(e) => handleChange("nationalId", e.target.value)}
                placeholder="Enter national ID"
                disabled={isEditing}
                className={errors.nationalId ? "border-red-500" : ""}
              />
              {errors.nationalId && (
                <p className="text-sm text-red-500">{errors.nationalId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={errors.dateOfBirth ? "border-red-500" : ""}
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-red-500">{errors.dateOfBirth}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">
                Gender <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleChange("gender", value)}
              >
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloodType">Blood Type</Label>
              <Select
                value={formData.bloodType}
                onValueChange={(value) => handleChange("bloodType", value)}
              >
                <SelectTrigger id="bloodType">
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unknown</SelectItem>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Enter the patient's contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="email@example.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("address", e.target.value)}
              placeholder="Enter full address"
              rows={3}
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Medical History */}
      <Card>
        <CardHeader>
          <CardTitle>Medical History</CardTitle>
          <CardDescription>
            Enter allergies and chronic conditions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Allergies */}
          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies</Label>
            <div className="flex gap-2">
              <Input
                id="allergies"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                placeholder="Enter allergy and press Add"
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAllergy();
                  }
                }}
              />
              <Button type="button" onClick={addAllergy} variant="outline">
                Add
              </Button>
            </div>
            {formData.allergies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.allergies.map((allergy, idx) => (
                  <Badge key={idx} variant="destructive" className="flex items-center gap-1">
                    {allergy}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeAllergy(allergy)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Chronic Conditions */}
          <div className="space-y-2">
            <Label htmlFor="chronicConditions">Chronic Conditions</Label>
            <div className="flex gap-2">
              <Input
                id="chronicConditions"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                placeholder="Enter condition and press Add"
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCondition();
                  }
                }}
              />
              <Button type="button" onClick={addCondition} variant="outline">
                Add
              </Button>
            </div>
            {formData.chronicConditions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.chronicConditions.map((condition, idx) => (
                  <Badge key={idx} variant="outline" className="flex items-center gap-1">
                    {condition}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeCondition(condition)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Healthcare Facility Link */}
      <Card>
        <CardHeader>
          <CardTitle>Healthcare Facility</CardTitle>
          <CardDescription>
            Link patient to a healthcare facility (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="linkedCustomerId">Healthcare Facility</Label>
            <Select
              value={formData.linkedCustomerId}
              onValueChange={(value) => handleChange("linkedCustomerId", value)}
            >
              <SelectTrigger id="linkedCustomerId">
                <SelectValue placeholder="Select facility (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} ({customer.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Link this patient to a hospital or clinic if they are associated with a healthcare facility
            </p>
          </div>
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
          {loading ? "Saving..." : isEditing ? "Update Patient" : "Create Patient"}
        </Button>
      </div>
    </form>
  );
}
