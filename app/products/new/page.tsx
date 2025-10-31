"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/products/ProductForm";
import { ProductService } from "@/services/database/products";
import type { Product } from "@/types/database";
import toast from "react-hot-toast";

export default function NewProductPage() {
  const router = useRouter();

  const handleSubmit = async (data: Partial<Product>) => {
    try {
      const product = await ProductService.createProduct(data as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
      toast.success("Product created successfully!");
      router.push(`/products/${product.id}`);
    } catch (error: any) {
      throw error; // Let the form handle the error
    }
  };

  const handleCancel = () => {
    router.push("/products");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/products")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Product</h1>
          <p className="text-muted-foreground">
            Create a new product in your inventory
          </p>
        </div>
      </div>

      {/* Form */}
      <ProductForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Create Product"
      />
    </div>
  );
}
