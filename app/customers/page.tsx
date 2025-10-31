"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Filter } from "lucide-react";
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
import { DataTable, createSortableHeader } from "@/components/common/DataTable";
import { VirtualTable, VirtualTableColumn } from "@/components/common/VirtualTable";
import { CustomerService } from "@/services/database/customers";
import type { Customer, CustomerType, CustomerSegment, PaymentStatus } from "@/types/database";
import { formatCurrency, formatDate, formatPhone } from "@/lib/utils/formatters";
import { ColumnDef } from "@tanstack/react-table";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(false);
  
  // Filters
  const [selectedType, setSelectedType] = useState<CustomerType | "all">("all");
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | "all">("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<"all" | "good" | "overdue">("all");

  useEffect(() => {
    loadCustomers();
  }, [selectedType, selectedSegment, selectedPaymentStatus]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const filters: any = { isActive: true };
      
      if (selectedType !== "all") {
        filters.type = selectedType;
      }
      
      if (selectedSegment !== "all") {
        filters.segment = selectedSegment;
      }
      
      let data = await CustomerService.getCustomers(filters);
      
      // Apply payment status filter
      if (selectedPaymentStatus !== "all") {
        const customersWithBalance = await Promise.all(
          data.map(async (customer) => {
            const balance = await CustomerService.getCustomerOutstandingBalance(customer.id);
            return { ...customer, outstandingBalance: balance };
          })
        );
        
        if (selectedPaymentStatus === "overdue") {
          data = customersWithBalance.filter(c => c.outstandingBalance > 0);
        } else if (selectedPaymentStatus === "good") {
          data = customersWithBalance.filter(c => c.outstandingBalance === 0);
        }
      }
      
      setCustomers(data);
      
      // Enable virtual scrolling for large datasets (>100 items)
      setUseVirtualScrolling(data.length > 100);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentBadge = (segment: CustomerSegment) => {
    const variants: Record<CustomerSegment, { variant: "default" | "secondary" | "destructive"; className: string }> = {
      "VIP": { variant: "default", className: "bg-purple-500 hover:bg-purple-600" },
      "Regular": { variant: "default", className: "bg-blue-500 hover:bg-blue-600" },
      "New": { variant: "secondary", className: "bg-green-500 hover:bg-green-600" },
      "Inactive": { variant: "destructive", className: "" },
    };
    
    const config = variants[segment];
    return (
      <Badge variant={config.variant} className={config.className}>
        {segment}
      </Badge>
    );
  };

  const getTypeBadge = (type: CustomerType) => {
    const typeLabels: Record<CustomerType, string> = {
      hospital: "Hospital",
      clinic: "Clinic",
      pharmacy: "Pharmacy",
      distributor: "Distributor",
    };
    
    return (
      <Badge variant="outline">
        {typeLabels[type]}
      </Badge>
    );
  };

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "customerId",
      header: createSortableHeader("Customer ID"),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.customerId}</span>
      ),
    },
    {
      accessorKey: "name",
      header: createSortableHeader("Customer Name"),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">{row.original.contactPerson}</div>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => getTypeBadge(row.original.type),
    },
    {
      accessorKey: "segment",
      header: "Segment",
      cell: ({ row }) => row.original.segment ? getSegmentBadge(row.original.segment) : <span className="text-muted-foreground">-</span>,
    },
    {
      accessorKey: "email",
      header: "Contact",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{row.original.email}</div>
          <div className="text-muted-foreground">{formatPhone(row.original.phone)}</div>
        </div>
      ),
    },
    {
      accessorKey: "city",
      header: createSortableHeader("Location"),
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{row.original.city}</div>
          <div className="text-muted-foreground">{row.original.country}</div>
        </div>
      ),
    },
    {
      accessorKey: "lifetimeValue",
      header: createSortableHeader("Lifetime Value"),
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.lifetimeValue || 0)}
        </span>
      ),
    },
    {
      accessorKey: "paymentTerms",
      header: "Payment Terms",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.paymentTerms}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: createSortableHeader("Created"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ];

  // Virtual table columns
  const virtualColumns: VirtualTableColumn<Customer>[] = [
    {
      key: "customerId",
      header: "Customer ID",
      width: 120,
      render: (row) => <span className="font-mono text-sm">{row.customerId}</span>,
    },
    {
      key: "name",
      header: "Customer Name",
      width: 200,
      render: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-muted-foreground">{row.contactPerson}</div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      width: 100,
      render: (row) => getTypeBadge(row.type),
    },
    {
      key: "segment",
      header: "Segment",
      width: 100,
      render: (row) => row.segment ? getSegmentBadge(row.segment) : <span className="text-muted-foreground">-</span>,
    },
    {
      key: "email",
      header: "Contact",
      width: 180,
      render: (row) => (
        <div className="text-sm">
          <div>{row.email}</div>
          <div className="text-muted-foreground">{formatPhone(row.phone)}</div>
        </div>
      ),
    },
    {
      key: "city",
      header: "Location",
      width: 150,
      render: (row) => (
        <div className="text-sm">
          <div>{row.city}</div>
          <div className="text-muted-foreground">{row.country}</div>
        </div>
      ),
    },
    {
      key: "lifetimeValue",
      header: "Lifetime Value",
      width: 130,
      render: (row) => (
        <span className="font-medium">
          {formatCurrency(row.lifetimeValue || 0)}
        </span>
      ),
    },
    {
      key: "paymentTerms",
      header: "Payment Terms",
      width: 120,
      render: (row) => <span className="text-sm">{row.paymentTerms}</span>,
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships and accounts
          </p>
        </div>
        <Button onClick={() => router.push("/customers/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Customer Type</label>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as CustomerType | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="clinic">Clinic</SelectItem>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Segment</label>
              <Select value={selectedSegment} onValueChange={(value) => setSelectedSegment(value as CustomerSegment | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="All Segments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Segments</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Payment Status</label>
              <Select value={selectedPaymentStatus} onValueChange={(value) => setSelectedPaymentStatus(value as "all" | "good" | "overdue")}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="good">Good Standing</SelectItem>
                  <SelectItem value="overdue">Has Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading customers...</div>
            </div>
          ) : useVirtualScrolling ? (
            <VirtualTable
              columns={virtualColumns}
              data={customers}
              estimateSize={60}
              overscan={10}
              onRowClick={(customer) => router.push(`/customers/${customer.id}`)}
            />
          ) : (
            <DataTable
              columns={columns}
              data={customers}
              searchKey="name"
              searchPlaceholder="Search customers by name, email, or phone..."
              onRowClick={(customer) => router.push(`/customers/${customer.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
