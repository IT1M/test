"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { CustomerService } from "@/services/database/customers";
import type { Customer } from "@/types/database";

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerId) {
      loadCustomer();
    }
  }, [customerId]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const data = await CustomerService.getCustomerById(customerId);
      if (!data) {
        router.push("/customers");
        return;
      }
      setCustomer(data);
    } catch (error) {
      console.error("Error loading customer:", error);
      router.push("/customers");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading customer...</div>
        </div>
      </div>
    );
  }

  if (!customer) {
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
          <h1 className="text-3xl font-bold">Edit Customer</h1>
          <p className="text-muted-foreground">
            Update customer information for {customer.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <CustomerForm customer={customer} />
    </div>
  );
}
