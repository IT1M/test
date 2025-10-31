"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Filter, Users } from "lucide-react";
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
import { PatientService } from "@/services/database/patients";
import { CustomerService } from "@/services/database/customers";
import type { Patient, Gender, Customer } from "@/types/database";
import { formatDate, formatPhone } from "@/lib/utils/formatters";
import { calculateAge } from "@/types/database";
import { ColumnDef } from "@tanstack/react-table";

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedGender, setSelectedGender] = useState<Gender | "all">("all");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [minAge, setMinAge] = useState<string>("");
  const [maxAge, setMaxAge] = useState<string>("");

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    loadPatients();
  }, [selectedGender, selectedCustomer, minAge, maxAge]);

  const loadCustomers = async () => {
    try {
      // Load healthcare facilities (hospitals and clinics)
      const allCustomers = await CustomerService.getCustomers({ isActive: true });
      const healthcareFacilities = allCustomers.filter(
        c => c.type === 'hospital' || c.type === 'clinic'
      );
      setCustomers(healthcareFacilities);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const loadPatients = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (selectedGender !== "all") {
        filters.gender = selectedGender;
      }
      
      if (selectedCustomer !== "all") {
        filters.linkedCustomerId = selectedCustomer;
      }
      
      if (minAge) {
        filters.minAge = parseInt(minAge);
      }
      
      if (maxAge) {
        filters.maxAge = parseInt(maxAge);
      }
      
      const data = await PatientService.getPatients(filters);
      setPatients(data);
    } catch (error) {
      console.error("Error loading patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGenderBadge = (gender: Gender) => {
    const variants: Record<Gender, { className: string; label: string }> = {
      male: { className: "bg-blue-500 hover:bg-blue-600", label: "Male" },
      female: { className: "bg-pink-500 hover:bg-pink-600", label: "Female" },
      other: { className: "bg-gray-500 hover:bg-gray-600", label: "Other" },
    };
    
    const config = variants[gender];
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getCustomerName = (linkedCustomerId?: string) => {
    if (!linkedCustomerId) return null;
    const customer = customers.find(c => c.id === linkedCustomerId);
    return customer?.name;
  };

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "patientId",
      header: createSortableHeader("Patient ID"),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.patientId}</span>
      ),
    },
    {
      accessorKey: "name",
      header: createSortableHeader("Patient Name"),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.firstName} {row.original.lastName}
          </div>
          <div className="text-sm text-muted-foreground">
            ID: {row.original.nationalId}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "age",
      header: createSortableHeader("Age"),
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">{calculateAge(row.original.dateOfBirth)} years</div>
          <div className="text-muted-foreground">
            {formatDate(row.original.dateOfBirth)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => getGenderBadge(row.original.gender),
    },
    {
      accessorKey: "bloodType",
      header: "Blood Type",
      cell: ({ row }) => (
        <span className="font-medium text-sm">
          {row.original.bloodType || <span className="text-muted-foreground">-</span>}
        </span>
      ),
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{formatPhone(row.original.phone)}</div>
          {row.original.email && (
            <div className="text-muted-foreground">{row.original.email}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "linkedCustomerId",
      header: "Healthcare Facility",
      cell: ({ row }) => {
        const facilityName = getCustomerName(row.original.linkedCustomerId);
        return facilityName ? (
          <div className="text-sm">
            <Badge variant="outline">{facilityName}</Badge>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
    },
    {
      accessorKey: "allergies",
      header: "Allergies",
      cell: ({ row }) => {
        const allergies = row.original.allergies;
        if (!allergies || allergies.length === 0) {
          return <span className="text-muted-foreground text-sm">None</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {allergies.slice(0, 2).map((allergy, idx) => (
              <Badge key={idx} variant="destructive" className="text-xs">
                {allergy}
              </Badge>
            ))}
            {allergies.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{allergies.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: createSortableHeader("Registered"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Patients
          </h1>
          <p className="text-muted-foreground">
            Manage patient records and medical information
          </p>
        </div>
        <Button onClick={() => router.push("/patients/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Gender</label>
              <Select value={selectedGender} onValueChange={(value) => setSelectedGender(value as Gender | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Healthcare Facility</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="All Facilities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Facilities</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Min Age</label>
              <Input
                type="number"
                placeholder="e.g., 18"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                min="0"
                max="150"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Max Age</label>
              <Input
                type="number"
                placeholder="e.g., 65"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                min="0"
                max="150"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading patients...</div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={patients}
              searchKey="patientId"
              searchPlaceholder="Search patients by name, national ID, or phone..."
              onRowClick={(patient) => router.push(`/patients/${patient.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
