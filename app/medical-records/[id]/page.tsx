"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  Calendar, 
  User, 
  Stethoscope,
  Building2,
  Pill,
  Paperclip,
  Package,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MedicalRecordsService } from "@/services/database/medical-records";
import { PatientService } from "@/services/database/patients";
import type { MedicalRecord, Patient, Product } from "@/types/database";
import { formatDate } from "@/lib/utils/formatters";
import { db } from "@/lib/db/schema";

export default function MedicalRecordDetailPage() {
  const router = useRouter();
  const params = useParams();
  const recordId = params.id as string;

  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [linkedProducts, setLinkedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (recordId) {
      loadRecordData();
    }
  }, [recordId]);

  const loadRecordData = async () => {
    try {
      setLoading(true);
      const recordData = await MedicalRecordsService.getMedicalRecordById(recordId);

      if (!recordData) {
        router.push("/medical-records");
        return;
      }

      setRecord(recordData);

      // Load patient
      const patientData = await PatientService.getPatientById(recordData.patientId);
      setPatient(patientData || null);

      // Load linked products
      if (recordData.linkedProductIds && recordData.linkedProductIds.length > 0) {
        const products = await Promise.all(
          recordData.linkedProductIds.map(id => db.products.get(id))
        );
        setLinkedProducts(products.filter(Boolean) as Product[]);
      }
    } catch (error) {
      console.error("Error loading medical record:", error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading medical record...</div>
        </div>
      </div>
    );
  }

  if (!record || !patient) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/medical-records")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{record.title}</h1>
              {getRecordTypeBadge(record.recordType)}
            </div>
            <p className="text-muted-foreground">
              {record.recordId} • {formatDate(record.visitDate)}
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/medical-records/${record.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Record
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="text-lg font-bold cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => router.push(`/patients/${patient.id}`)}
            >
              {patient.firstName} {patient.lastName}
            </div>
            <div className="text-sm text-muted-foreground">
              {patient.patientId}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Visit Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatDate(record.visitDate)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Doctor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {record.doctorName ? `Dr. ${record.doctorName}` : <span className="text-muted-foreground">Not specified</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Hospital
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {record.hospitalName || <span className="text-muted-foreground">Not specified</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Record Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Diagnosis */}
          {record.diagnosis && (
            <Card>
              <CardHeader>
                <CardTitle>Diagnosis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-lg">{record.diagnosis}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Record Content</CardTitle>
              <CardDescription>
                Detailed medical information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{record.content}</p>
              </div>
            </CardContent>
          </Card>

          {/* Medications */}
          {record.medications && record.medications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {record.medications.map((med, idx) => (
                    <div key={idx} className="border-l-2 border-blue-500 pl-4 py-2">
                      <div className="font-medium text-lg">{med.name}</div>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Dosage:</span>
                          <div className="font-medium">{med.dosage}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Frequency:</span>
                          <div className="font-medium">{med.frequency}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <div className="font-medium">{med.duration}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gemini AI Analysis */}
          {record.geminiAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Analysis
                </CardTitle>
                <CardDescription>
                  Gemini AI-generated insights (Confidence: {(record.geminiAnalysis.confidence * 100).toFixed(0)}%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="data">Extracted Data</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="whitespace-pre-wrap">{record.geminiAnalysis.summary}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="data" className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <pre className="text-sm overflow-auto">
                        {JSON.stringify(record.geminiAnalysis.extractedData, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Attachments & Products */}
        <div className="space-y-6">
          {/* Document Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Attachments
              </CardTitle>
              <CardDescription>
                {record.attachments?.length || 0} file(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!record.attachments || record.attachments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No attachments
                </div>
              ) : (
                <div className="space-y-3">
                  {record.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{attachment.fileName}</div>
                          <div className="text-sm text-muted-foreground">
                            {attachment.fileType} • {(attachment.fileSize / 1024).toFixed(2)} KB
                          </div>
                          {attachment.ocrText && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              OCR Processed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Linked Products
              </CardTitle>
              <CardDescription>
                Products mentioned in this record
              </CardDescription>
            </CardHeader>
            <CardContent>
              {linkedProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No linked products
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => router.push(`/products/${product.id}`)}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.sku} • {product.category}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {product.manufacturer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Record Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Record Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Record ID</div>
                <div className="font-mono text-sm">{record.recordId}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Record Type</div>
                <div>{getRecordTypeBadge(record.recordType)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="text-sm">{formatDate(record.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Last Updated</div>
                <div className="text-sm">{formatDate(record.updatedAt)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
