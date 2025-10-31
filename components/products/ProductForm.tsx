"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductService } from "@/services/database/products";
import { getGeminiService } from "@/services/gemini/client";
import type { Product } from "@/types/database";
import toast from "react-hot-toast";

interface ProductFormProps {
  initialData?: Partial<Product>;
  onSubmit: (data: Partial<Product>) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Create Product",
}: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<Product>>({
    sku: "",
    name: "",
    category: "",
    description: "",
    manufacturer: "",
    unitPrice: 0,
    costPrice: 0,
    stockQuantity: 0,
    reorderLevel: 10,
    batchNumber: "",
    regulatoryInfo: "",
    isActive: true,
    createdBy: "system",
    ...initialData,
  });

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    category?: string;
    suggestedPrice?: number;
    reasoning?: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await ProductService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleChange = (field: keyof Product, value: any) => {
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sku?.trim()) {
      newErrors.sku = "SKU is required";
    }

    if (!formData.name?.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.category?.trim()) {
      newErrors.category = "Category is required";
    }

    if (!formData.manufacturer?.trim()) {
      newErrors.manufacturer = "Manufacturer is required";
    }

    if (!formData.unitPrice || formData.unitPrice <= 0) {
      newErrors.unitPrice = "Unit price must be greater than 0";
    }

    if (!formData.costPrice || formData.costPrice <= 0) {
      newErrors.costPrice = "Cost price must be greater than 0";
    }

    if (formData.unitPrice && formData.costPrice && formData.unitPrice < formData.costPrice) {
      newErrors.unitPrice = "Unit price should be greater than cost price";
    }

    if (formData.stockQuantity === undefined || formData.stockQuantity < 0) {
      newErrors.stockQuantity = "Stock quantity must be 0 or greater";
    }

    if (formData.reorderLevel === undefined || formData.reorderLevel < 0) {
      newErrors.reorderLevel = "Reorder level must be 0 or greater";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error: any) {
      toast.error(error.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const getAISuggestions = async () => {
    if (!formData.name || !formData.description) {
      toast.error("Please enter product name and description first");
      return;
    }

    setAiLoading(true);
    try {
      const gemini = getGeminiService();
      
      const prompt = `
        Analyze this medical product and provide categorization and pricing suggestions:
        
        Product Name: ${formData.name}
        Description: ${formData.description}
        ${formData.manufacturer ? `Manufacturer: ${formData.manufacturer}` : ""}
        ${formData.costPrice ? `Cost Price: $${formData.costPrice}` : ""}
        
        Provide suggestions in JSON format:
        {
          "category": "suggested category (e.g., Medical Equipment, Pharmaceuticals, Surgical Supplies, Diagnostic Tools, etc.)",
          "suggestedPrice": suggested retail price as a number (if cost price provided, suggest 30-50% markup),
          "reasoning": "brief explanation of your suggestions"
        }
      `;

      const suggestions = await gemini.generateJSON<{
        category: string;
        suggestedPrice: number;
        reasoning: string;
      }>(prompt);

      setAiSuggestions(suggestions);
      toast.success("AI suggestions generated!");
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      toast.error("Failed to get AI suggestions");
    } finally {
      setAiLoading(false);
    }
  };

  const applySuggestion = (field: "category" | "unitPrice") => {
    if (!aiSuggestions) return;

    if (field === "category" && aiSuggestions.category) {
      handleChange("category", aiSuggestions.category);
      toast.success("Category suggestion applied");
    } else if (field === "unitPrice" && aiSuggestions.suggestedPrice) {
      handleChange("unitPrice", aiSuggestions.suggestedPrice);
      toast.success("Price suggestion applied");
    }
  };

  const profitMargin = formData.unitPrice && formData.costPrice
    ? ((formData.unitPrice - formData.costPrice) / formData.unitPrice * 100).toFixed(2)
    : "0.00";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI Suggestions Card */}
      {aiSuggestions && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Sparkles className="h-5 w-5" />
              AI Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-blue-900">Category:</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => applySuggestion("category")}
                >
                  Apply
                </Button>
              </div>
              <Badge className="bg-blue-600">{aiSuggestions.category}</Badge>
            </div>

            {aiSuggestions.suggestedPrice && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-blue-900">Suggested Price:</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => applySuggestion("unitPrice")}
                  >
                    Apply
                  </Button>
                </div>
                <Badge className="bg-blue-600">${aiSuggestions.suggestedPrice.toFixed(2)}</Badge>
              </div>
            )}

            <div>
              <span className="text-sm font-medium text-blue-900">Reasoning:</span>
              <p className="text-sm text-blue-800 mt-1">{aiSuggestions.reasoning}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Basic Information</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getAISuggestions}
              disabled={aiLoading || !formData.name || !formData.description}
            >
              {aiLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Suggestions...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get AI Suggestions
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">
                SKU <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleChange("sku", e.target.value.toUpperCase())}
                placeholder="e.g., MED-001"
                className={errors.sku ? "border-red-500" : ""}
              />
              {errors.sku && <p className="text-sm text-red-500 mt-1">{errors.sku}</p>}
            </div>

            <div>
              <Label htmlFor="name">
                Product Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Digital Thermometer"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                placeholder="e.g., Medical Equipment"
                list="categories"
                className={errors.category ? "border-red-500" : ""}
              />
              <datalist id="categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
              {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
            </div>

            <div>
              <Label htmlFor="manufacturer">
                Manufacturer <span className="text-red-500">*</span>
              </Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => handleChange("manufacturer", e.target.value)}
                placeholder="e.g., MedTech Inc."
                className={errors.manufacturer ? "border-red-500" : ""}
              />
              {errors.manufacturer && <p className="text-sm text-red-500 mt-1">{errors.manufacturer}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Detailed product description..."
                className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="costPrice">
                Cost Price <span className="text-red-500">*</span>
              </Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => handleChange("costPrice", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.costPrice ? "border-red-500" : ""}
              />
              {errors.costPrice && <p className="text-sm text-red-500 mt-1">{errors.costPrice}</p>}
            </div>

            <div>
              <Label htmlFor="unitPrice">
                Unit Price <span className="text-red-500">*</span>
              </Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => handleChange("unitPrice", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.unitPrice ? "border-red-500" : ""}
              />
              {errors.unitPrice && <p className="text-sm text-red-500 mt-1">{errors.unitPrice}</p>}
            </div>

            <div>
              <Label>Profit Margin</Label>
              <div className="h-10 flex items-center px-3 py-2 border rounded-md bg-gray-50">
                <span className="font-medium text-green-600">{profitMargin}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stockQuantity">
                Stock Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="stockQuantity"
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => handleChange("stockQuantity", parseInt(e.target.value) || 0)}
                placeholder="0"
                className={errors.stockQuantity ? "border-red-500" : ""}
              />
              {errors.stockQuantity && <p className="text-sm text-red-500 mt-1">{errors.stockQuantity}</p>}
            </div>

            <div>
              <Label htmlFor="reorderLevel">
                Reorder Level <span className="text-red-500">*</span>
              </Label>
              <Input
                id="reorderLevel"
                type="number"
                value={formData.reorderLevel}
                onChange={(e) => handleChange("reorderLevel", parseInt(e.target.value) || 0)}
                placeholder="10"
                className={errors.reorderLevel ? "border-red-500" : ""}
              />
              {errors.reorderLevel && <p className="text-sm text-red-500 mt-1">{errors.reorderLevel}</p>}
            </div>

            <div>
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                value={formData.batchNumber}
                onChange={(e) => handleChange("batchNumber", e.target.value)}
                placeholder="e.g., BATCH-2024-001"
              />
            </div>

            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ""}
                onChange={(e) => handleChange("expiryDate", e.target.value ? new Date(e.target.value) : undefined)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regulatory Information */}
      <Card>
        <CardHeader>
          <CardTitle>Regulatory Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="regulatoryInfo">Regulatory Info</Label>
          <textarea
            id="regulatoryInfo"
            value={formData.regulatoryInfo}
            onChange={(e) => handleChange("regulatoryInfo", e.target.value)}
            placeholder="FDA approval, certifications, compliance information..."
            className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md"
          />
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
