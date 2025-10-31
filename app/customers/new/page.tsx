"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/components/customers/CustomerForm";

export default function NewCustomerPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Customer</h1>
          <p className="text-muted-foreground">
            Create a new customer account
          </p>
        </div>
      </div>

      {/* Form */}
      <CustomerForm />
    </div>
  );
}
