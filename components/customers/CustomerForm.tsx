"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CustomerService } from "@/services/database/customers";
import type { Customer, CustomerType } from "@/types/database";
import { AlertCircle } from "lucide-react";

interface CustomerFormProps {
  customer?: Customer;
  onSuccess?: (customer: Customer) => void;
}

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const router = useRouter();
  const isEditing = !!customer;

  const [formData, setFormData] = useState({
    customerId: customer?.customerId || "",
    name: customer?.name || "",
    type: customer?.type || ("hospital" as CustomerType),
    contactPerson: customer?.contactPerson || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    address: customer?.address || "",
    city: customer?.city || "",
    country: customer?.country || "",
    taxId: customer?.taxId || "",
    creditLimit: customer?.creditLimit?.toString() || "0",
    paymentTerms: customer?.paymentTerms || "Net 30",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string>("");

  // Auto-save functionality
  useEffect(() => {
    if (!isEditing) return;

    const timer = setTimeout(() => {
      localStorage.setItem("customerFormDraft", JSON.stringify(formData));
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(timer);
  }, [formData, isEditing]);

  // Load draft on mount for new customers
  useEffect(() => {
    if (!isEditing) {
      const draft = localStorage.getItem("customerFormDraft");
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
    if (!formData.customerId.trim()) {
      newErrors.customerId = "Customer ID is required";
    }
    if (!formData.name.trim()) {
      newErrors.name = "Customer name is required";
    }
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = "Contact person is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }
    if (!formData.taxId.trim()) {
      newErrors.taxId = "Tax ID is required";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Phone validation (basic)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }

    // Credit limit validation
    const creditLimit = parseFloat(formData.creditLimit);
    if (isNaN(creditLimit) || creditLimit < 0) {
      newErrors.creditLimit = "Credit limit must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkDuplicates = async (): Promise<boolean> => {
    try {
      // Check customer ID duplicate
      if (!isEditing || formData.customerId !== customer?.customerId) {
        const existingById = await CustomerService.getCustomerByCustomerId(formData.customerId);
        if (existingById) {
          setDuplicateError(`Customer with ID ${formData.customerId} already exists`);
          return false;
        }
      }

      // Check email duplicate
      if (!isEditing || formData.email !== customer?.email) {
        const existingByEmail = await CustomerService.getCustomerByEmail(formData.email);
        if (existingByEmail) {
          setDuplicateError(`Customer with email ${formData.email} already exists`);
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

      const customerData = {
        ...formData,
        creditLimit: parseFloat(formData.creditLimit),
        isActive: true,
      };

      let savedCustomer: Customer;

      if (isEditing && customer) {
        savedCustomer = await CustomerService.updateCustomer(customer.id, customerData);
      } else {
        savedCustomer = await CustomerService.createCustomer(customerData);
        // Clear draft after successful creation
        localStorage.removeItem("customerFormDraft");
      }

      if (onSuccess) {
        onSuccess(savedCustomer);
      } else {
        router.push(`/customers/${savedCustomer.id}`);
      }
    } catch (error: any) {
      console.error("Error saving customer:", error);
      setDuplicateError(error.message || "Failed to save customer");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {duplicateError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <div className="font-medium text-red-900">Duplicate Customer</div>
            <div className="text-sm text-red-700">{duplicateError}</div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Enter the customer's basic details and identification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">
                Customer ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerId"
                value={formData.customerId}
                onChange={(e) => handleChange("customerId", e.target.value)}
                placeholder="CUST-001"
                disabled={isEditing}
                className={errors.customerId ? "border-red-500" : ""}
              />
              {errors.customerId && (
                <p className="text-sm text-red-500">{errors.customerId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">
                Customer Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange("type", value)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="clinic">Clinic</SelectItem>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Customer Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter customer name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPerson">
              Contact Person <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contactPerson"
              value={formData.contactPerson}
              onChange={(e) => handleChange("contactPerson", e.target.value)}
              placeholder="Enter contact person name"
              className={errors.contactPerson ? "border-red-500" : ""}
            />
            {errors.contactPerson && (
              <p className="text-sm text-red-500">{errors.contactPerson}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Enter the customer's contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Street address"
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="City"
                className={errors.city ? "border-red-500" : ""}
              />
              {errors.city && (
                <p className="text-sm text-red-500">{errors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">
                Country <span className="text-red-500">*</span>
              </Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleChange("country", e.target.value)}
                placeholder="Country"
                className={errors.country ? "border-red-500" : ""}
              />
              {errors.country && (
                <p className="text-sm text-red-500">{errors.country}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Information */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Information</CardTitle>
          <CardDescription>
            Enter payment terms and credit information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taxId">
              Tax ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="taxId"
              value={formData.taxId}
              onChange={(e) => handleChange("taxId", e.target.value)}
              placeholder="Tax identification number"
              className={errors.taxId ? "border-red-500" : ""}
            />
            {errors.taxId && (
              <p className="text-sm text-red-500">{errors.taxId}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creditLimit">
                Credit Limit <span className="text-red-500">*</span>
              </Label>
              <Input
                id="creditLimit"
                type="number"
                step="0.01"
                min="0"
                value={formData.creditLimit}
                onChange={(e) => handleChange("creditLimit", e.target.value)}
                placeholder="0.00"
                className={errors.creditLimit ? "border-red-500" : ""}
              />
              {errors.creditLimit && (
                <p className="text-sm text-red-500">{errors.creditLimit}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">
                Payment Terms <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.paymentTerms}
                onValueChange={(value) => handleChange("paymentTerms", value)}
              >
                <SelectTrigger id="paymentTerms">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Net 15">Net 15</SelectItem>
                  <SelectItem value="Net 30">Net 30</SelectItem>
                  <SelectItem value="Net 45">Net 45</SelectItem>
                  <SelectItem value="Net 60">Net 60</SelectItem>
                  <SelectItem value="Net 90">Net 90</SelectItem>
                  <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  <SelectItem value="COD">Cash on Delivery (COD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          {loading ? "Saving..." : isEditing ? "Update Customer" : "Create Customer"}
        </Button>
      </div>
    </form>
  );
}
