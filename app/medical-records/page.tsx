"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Filter, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DataTable, createSortableHeader } from "@/components/common/DataTable";
import { MedicalRecordsService } from "@/services/database/medical-records";
import { PatientService } from "@/services/database/patients";
import type { MedicalRecord, RecordType, Patient } from "@/types/database";
import { formatDate } from "@/lib/utils/formatters";
import { ColumnDef } from "@tanstack/react-table";

export default function MedicalRecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Map<string, Patient>>(new Map());
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedType, setSelectedType] = useState<RecordType | "all">("all");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [selectedPatient, setSelectedPatient] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [doctors, setDoctors] = useState<string[]>([]);
  const [patientsList, setPatientsList] = useState<Patient[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadRecords();
  }, [selectedType, selectedDoctor, selectedPatient, startDate, endDate]);

  const loadInitialData = async () => {
    try {
      // Load all patients
      const allPatients = await PatientService.getPatients();
      setPatientsList(allPatients);
      
      // Create patient map for quick lookup
      const patientMap = new Map();
      allPatients.forEach(p => patientMap.set(p.id, p));
      setPatients(patientMap);

      // Load all records to get unique doctors
      const allRecords = await MedicalRecordsService.getMedicalRecords();
      const uniqueDoctors = [...new Set(allRecords.map(r => r.doctorName).filter(Boolean))];
      setDoctors(uniqueDoctors as string[]);
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (selectedType !== "all") {
        filters.recordType = selectedType;
      }
      
      if (selectedDoctor !== "all") {
        filters.doctorName = selectedDoctor;
      }
      
      if (selectedPatient !== "all") {
        filters.patientId = selectedPatient;
      }
      
      if (startDate) {
        filters.startDate = new Date(startDate);
      }
      
      if (endDate) {
        filters.endDate = new Date(endDate);
      }
      
      const data = await MedicalRecordsService.getMedicalRecords(filters);
      setRecords(data);
    } catch (error) {
      console.error("Error loading medical records:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRecordTypeBadge = (type: RecordType) => {
    const variants: Record<RecordType, { className: string; label: string }> = {
      consultation: { className: "bg-blue-500", label: "Consultation" },
      "lab-result": { className: "bg-purple-500", label: "Lab Result" },
      prescription: { className: "bg-green-500", label: "Prescription" },
      imaging: { className: "bg-orange-500", label: "Imaging" },
      surgery: { className: "bg-red-500", label: "Surgery" },
      other: { className: "bg-gray-500", label: "Other" },
    };
    
    const config = variants[type];
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.get(patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : "Unknown";
  };

  const columns: ColumnDef<MedicalRecord>[] = [
    {
      accessorKey: "recordId",
      header: createSortableHeader("Record ID"),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.recordId}</span>
      ),
    },
    {
      accessorKey: "recordType",
      header: "Type",
      cell: ({ row }) => getRecordTypeBadge(row.original.recordType),
    },
    {
      accessorKey: "title",
      header: createSortableHeader("Title"),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.title}</div>
          {row.original.diagnosis && (
            <div className="text-sm text-muted-foreground">
              Diagnosis: {row.original.diagnosis}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "patientId",
      header: "Patient",
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">{getPatientName(row.original.patientId)}</div>
          <div className="text-muted-foreground font-mono">
            {patients.get(row.original.patientId)?.patientId}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "visitDate",
      header: createSortableHeader("Visit Date"),
      cell: ({ row }) => (
        <span className="text-sm">{formatDate(row.original.visitDate)}</span>
      ),
    },
    {
      accessorKey: "doctorName",
      header: "Doctor",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.doctorName ? `Dr. ${row.original.doctorName}` : <span className="text-muted-foreground">-</span>}
        </span>
      ),
    },
    {
      accessorKey: "hospitalName",
      header: "Hospital",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.hospitalName || <span className="text-muted-foreground">-</span>}
        </span>
      ),
    },
    {
      accessorKey: "attachments",
      header: "Attachments",
      cell: ({ row }) => {
        const count = row.original.attachments?.length || 0;
        return count > 0 ? (
          <Badge variant="outline">{count} file{count > 1 ? 's' : ''}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">None</span>
        );
      },
    },
    {
      accessorKey: "medications",
      header: "Medications",
      cell: ({ row }) => {
        const meds = row.original.medications;
        if (!meds || meds.length === 0) {
          return <span className="text-muted-foreground text-sm">None</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {meds.slice(0, 2).map((med, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {med.name}
              </Badge>
            ))}
            {meds.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{meds.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Medical Records
          </h1>
          <p className="text-muted-foreground">
            Manage patient medical records and documents
          </p>
        </div>
        <Button onClick={() => router.push("/medical-records/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Record
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Record Type</label>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as RecordType | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="lab-result">Lab Result</SelectItem>
                  <SelectItem value="prescription">Prescription</SelectItem>
                  <SelectItem value="imaging">Imaging</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Patient</label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="All Patients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patients</SelectItem>
                  {patientsList.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} ({patient.patientId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Doctor</label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger>
                  <SelectValue placeholder="All Doctors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor} value={doctor}>
                      Dr. {doctor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Records Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading medical records...</div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={records}
              searchKey="title"
              searchPlaceholder="Search records by title, diagnosis, or record ID..."
              onRowClick={(record) => router.push(`/medical-records/${record.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
