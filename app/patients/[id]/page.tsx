"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  User, 
  Droplet, 
  AlertTriangle,
  Activity,
  FileText,
  Pill,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientService } from "@/services/database/patients";
import { CustomerService } from "@/services/database/customers";
import { MedicalAIInsights } from "@/components/patients/MedicalAIInsights";
import type { Patient, MedicalRecord, Customer } from "@/types/database";
import { formatDate, formatPhone, formatRelativeDate } from "@/lib/utils/formatters";
import { calculateAge } from "@/types/database";
import { db } from "@/lib/db/schema";

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalRecord[]>([]);
  const [linkedCustomer, setLinkedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      const patientData = await PatientService.getPatientById(patientId);

      if (!patientData) {
        router.push("/patients");
        return;
      }

      setPatient(patientData);

      // Load medical history
      const history = await PatientService.getPatientMedicalHistory(patientId);
      setMedicalHistory(history);

      // Load linked customer if exists
      if (patientData.linkedCustomerId) {
        const customer = await CustomerService.getCustomerById(patientData.linkedCustomerId);
        setLinkedCustomer(customer || null);
      }
    } catch (error) {
      console.error("Error loading patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGenderBadge = (gender: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      male: { className: "bg-blue-500 hover:bg-blue-600", label: "Male" },
      female: { className: "bg-pink-500 hover:bg-pink-600", label: "Female" },
      other: { className: "bg-gray-500 hover:bg-gray-600", label: "Other" },
    };
    
    const config = variants[gender] || variants.other;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getRecordTypeBadge = (type: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      consultation: { className: "bg-blue-500", label: "Consultation" },
      "lab-result": { className: "bg-purple-500", label: "Lab Result" },
      prescription: { className: "bg-green-500", label: "Prescription" },
      imaging: { className: "bg-orange-500", label: "Imaging" },
      surgery: { className: "bg-red-500", label: "Surgery" },
      other: { className: "bg-gray-500", label: "Other" },
    };
    
    const config = variants[type] || variants.other;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Get current medications from recent prescriptions
  const getCurrentMedications = () => {
    const recentRecords = medicalHistory
      .filter(r => r.recordType === 'prescription' && r.medications)
      .slice(0, 5);
    
    const medications = new Map();
    recentRecords.forEach(record => {
      record.medications?.forEach(med => {
        if (!medications.has(med.name)) {
          medications.set(med.name, med);
        }
      });
    });
    
    return Array.from(medications.values());
  };

  // Get current conditions from recent consultations
  const getCurrentConditions = () => {
    const conditions = new Set<string>();
    
    // Add chronic conditions
    patient?.chronicConditions?.forEach(condition => conditions.add(condition));
    
    // Add recent diagnoses
    medicalHistory
      .filter(r => r.diagnosis)
      .slice(0, 5)
      .forEach(record => {
        if (record.diagnosis) {
          conditions.add(record.diagnosis);
        }
      });
    
    return Array.from(conditions);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading patient details...</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  const age = calculateAge(patient.dateOfBirth);
  const currentMedications = getCurrentMedications();
  const currentConditions = getCurrentConditions();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/patients")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                {patient.firstName} {patient.lastName}
              </h1>
              {getGenderBadge(patient.gender)}
            </div>
            <p className="text-muted-foreground">
              {patient.patientId} • {age} years old • ID: {patient.nationalId}
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/patients/${patient.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Patient
        </Button>
      </div>

      {/* Allergies Alert */}
      {patient.allergies && patient.allergies.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Allergies Alert</AlertTitle>
          <AlertDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              {patient.allergies.map((allergy, idx) => (
                <Badge key={idx} variant="destructive" className="text-sm">
                  {allergy}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Patient Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Age
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{age} years</div>
            <div className="text-sm text-muted-foreground">
              Born {formatDate(patient.dateOfBirth)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Droplet className="h-4 w-4" />
              Blood Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patient.bloodType || <span className="text-muted-foreground">Unknown</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Medical Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medicalHistory.length}</div>
            <div className="text-sm text-muted-foreground">
              {medicalHistory.length > 0 
                ? `Last visit ${formatRelativeDate(medicalHistory[0].visitDate)}`
                : "No records yet"
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentConditions.length > 0 ? (
                <Badge variant="outline" className="text-base">
                  {currentConditions.length} Condition{currentConditions.length > 1 ? 's' : ''}
                </Badge>
              ) : (
                <span className="text-green-600">Healthy</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Phone</div>
                  <div className="text-sm text-muted-foreground">{formatPhone(patient.phone)}</div>
                </div>
              </div>

              {patient.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">{patient.email}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Address</div>
                  <div className="text-sm text-muted-foreground">{patient.address}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Date of Birth</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(patient.dateOfBirth)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Healthcare Facility */}
          {linkedCustomer && (
            <Card>
              <CardHeader>
                <CardTitle>Healthcare Facility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="font-medium">{linkedCustomer.name}</div>
                  <Badge variant="outline">
                    {linkedCustomer.type.charAt(0).toUpperCase() + linkedCustomer.type.slice(1)}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-2">
                    {linkedCustomer.address}<br />
                    {linkedCustomer.city}, {linkedCustomer.country}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatPhone(linkedCustomer.phone)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Current Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentConditions.length === 0 ? (
                <div className="text-sm text-muted-foreground">No current conditions</div>
              ) : (
                <div className="space-y-2">
                  {currentConditions.map((condition, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-sm">{condition}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Medications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Active Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentMedications.length === 0 ? (
                <div className="text-sm text-muted-foreground">No active medications</div>
              ) : (
                <div className="space-y-3">
                  {currentMedications.map((med, idx) => (
                    <div key={idx} className="border-l-2 border-blue-500 pl-3">
                      <div className="font-medium text-sm">{med.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {med.dosage} • {med.frequency}
                      </div>
                      {med.duration && (
                        <div className="text-xs text-muted-foreground">
                          Duration: {med.duration}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Medical History */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="history">Medical History</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Medical History</CardTitle>
                      <CardDescription>
                        {medicalHistory.length} total records
                      </CardDescription>
                    </div>
                    <Button onClick={() => router.push(`/medical-records/new?patientId=${patient.id}`)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Record
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {medicalHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No medical records yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {medicalHistory.map((record) => (
                        <div
                          key={record.id}
                          className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => router.push(`/medical-records/${record.id}`)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getRecordTypeBadge(record.recordType)}
                                <span className="font-medium">{record.title}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(record.visitDate)}
                                {record.doctorName && ` • Dr. ${record.doctorName}`}
                                {record.hospitalName && ` • ${record.hospitalName}`}
                              </div>
                            </div>
                          </div>
                          
                          {record.diagnosis && (
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              <span className="font-medium">Diagnosis: </span>
                              {record.diagnosis}
                            </div>
                          )}
                          
                          {record.medications && record.medications.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {record.medications.slice(0, 3).map((med, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {med.name}
                                </Badge>
                              ))}
                              {record.medications.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{record.medications.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Timeline</CardTitle>
                  <CardDescription>
                    Chronological view of medical events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Patient Created */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        <div className="w-0.5 h-full bg-gray-200" />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="font-medium">Patient Registered</div>
                        <div className="text-sm text-muted-foreground">
                          {formatRelativeDate(patient.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Medical Records */}
                    {medicalHistory.map((record, index) => (
                      <div key={record.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full ${
                            record.recordType === 'surgery' ? 'bg-red-600' :
                            record.recordType === 'prescription' ? 'bg-green-600' :
                            'bg-purple-600'
                          }`} />
                          {index < medicalHistory.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="font-medium">{record.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {record.recordType.charAt(0).toUpperCase() + record.recordType.slice(1)}
                            {record.doctorName && ` • Dr. ${record.doctorName}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatRelativeDate(record.visitDate)}
                          </div>
                        </div>
                      </div>
                    ))}

                    {medicalHistory.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No medical history yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai-insights" className="space-y-4">
              <MedicalAIInsights patient={patient} medicalHistory={medicalHistory} />
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Summary</CardTitle>
                  <CardDescription>
                    Overview of patient health information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Demographics */}
                  <div>
                    <h3 className="font-medium mb-2">Demographics</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Age:</span>
                        <span className="ml-2 font-medium">{age} years</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gender:</span>
                        <span className="ml-2 font-medium capitalize">{patient.gender}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Blood Type:</span>
                        <span className="ml-2 font-medium">{patient.bloodType || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">National ID:</span>
                        <span className="ml-2 font-medium font-mono">{patient.nationalId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Allergies */}
                  <div>
                    <h3 className="font-medium mb-2">Allergies</h3>
                    {patient.allergies && patient.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {patient.allergies.map((allergy, idx) => (
                          <Badge key={idx} variant="destructive">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No known allergies</div>
                    )}
                  </div>

                  {/* Chronic Conditions */}
                  <div>
                    <h3 className="font-medium mb-2">Chronic Conditions</h3>
                    {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                      <div className="space-y-2">
                        {patient.chronicConditions.map((condition, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <span className="text-sm">{condition}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No chronic conditions</div>
                    )}
                  </div>

                  {/* Medical History Summary */}
                  <div>
                    <h3 className="font-medium mb-2">Medical History Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Records:</span>
                        <span className="ml-2 font-medium">{medicalHistory.length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Visit:</span>
                        <span className="ml-2 font-medium">
                          {medicalHistory.length > 0 
                            ? formatDate(medicalHistory[0].visitDate)
                            : 'Never'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Record Types Breakdown */}
                  {medicalHistory.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Record Types</h3>
                      <div className="space-y-2">
                        {Object.entries(
                          medicalHistory.reduce((acc, record) => {
                            acc[record.recordType] = (acc[record.recordType] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between text-sm">
                            <span className="capitalize">{type.replace('-', ' ')}</span>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
