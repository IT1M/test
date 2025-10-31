"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit2, Save, X, TrendingUp, Package, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductService } from "@/services/database/products";
import { db } from "@/lib/db/schema";
import type { Product, StockStatus, Sale } from "@/types/database";
import { formatCurrency, formatDate, formatPercentage } from "@/lib/utils/formatters";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ProductAIInsights } from "@/components/products/ProductAIInsights";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Partial<Product>>({});
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadProduct();
    loadSalesHistory();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await ProductService.getProductById(productId);
      if (data) {
        setProduct(data);
        setEditedProduct(data);
      } else {
        toast.error("Product not found");
        router.push("/products");
      }
    } catch (error) {
      console.error("Error loading product:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const loadSalesHistory = async () => {
    try {
      // Get sales data for this product from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const orders = await db.orders
        .where("orderDate")
        .above(thirtyDaysAgo)
        .toArray();

      // Aggregate sales by date
      const salesByDate: Record<string, number> = {};
      
      orders.forEach((order) => {
        order.items.forEach((item) => {
          if (item.productId === productId) {
            const dateKey = formatDate(order.orderDate);
            salesByDate[dateKey] = (salesByDate[dateKey] || 0) + item.quantity;
          }
        });
      });

      // Convert to chart data
      const chartData = Object.entries(salesByDate)
        .map(([date, quantity]) => ({ date, quantity }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setSalesHistory(chartData);
    } catch (error) {
      console.error("Error loading sales history:", error);
    }
  };

  const handleFieldChange = (field: keyof Product, value: any) => {
    setEditedProduct((prev) => ({ ...prev, [field]: value }));

    // Auto-save after 2 seconds of inactivity
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      handleAutoSave();
    }, 2000);

    setAutoSaveTimeout(timeout);
  };

  const handleAutoSave = async () => {
    if (!editing || !product) return;

    try {
      await ProductService.updateProduct(productId, editedProduct);
      toast.success("Changes saved automatically");
      await loadProduct();
    } catch (error) {
      console.error("Error auto-saving:", error);
      toast.error("Failed to auto-save changes");
    }
  };

  const handleSave = async () => {
    try {
      await ProductService.updateProduct(productId, editedProduct);
      toast.success("Product updated successfully");
      setEditing(false);
      await loadProduct();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(error.message || "Failed to save product");
    }
  };

  const handleCancel = () => {
    setEditedProduct(product || {});
    setEditing(false);
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
  };

  const getStockStatusBadge = (status: StockStatus) => {
    const variants: Record<StockStatus, { variant: "default" | "secondary" | "destructive"; className: string }> = {
      "in-stock": { variant: "default", className: "bg-green-500 hover:bg-green-600" },
      "low-stock": { variant: "secondary", className: "bg-yellow-500 hover:bg-yellow-600" },
      "out-of-stock": { variant: "destructive", className: "" },
    };
    
    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {status === "in-stock" ? "In Stock" : status === "low-stock" ? "Low Stock" : "Out of Stock"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading product...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/products")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Product
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock Quantity</p>
                <p className="text-2xl font-bold">{product.stockQuantity}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unit Price</p>
                <p className="text-2xl font-bold">{formatCurrency(product.unitPrice)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <p className="text-2xl font-bold">{product.profitMargin?.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock Status</p>
                <div className="mt-2">{getStockStatusBadge(product.stockStatus!)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SKU</Label>
                {editing ? (
                  <Input
                    value={editedProduct.sku || ""}
                    onChange={(e) => handleFieldChange("sku", e.target.value)}
                  />
                ) : (
                  <p className="font-mono text-sm mt-1">{product.sku}</p>
                )}
              </div>

              <div>
                <Label>Category</Label>
                {editing ? (
                  <Input
                    value={editedProduct.category || ""}
                    onChange={(e) => handleFieldChange("category", e.target.value)}
                  />
                ) : (
                  <p className="text-sm mt-1">{product.category}</p>
                )}
              </div>

              <div>
                <Label>Manufacturer</Label>
                {editing ? (
                  <Input
                    value={editedProduct.manufacturer || ""}
                    onChange={(e) => handleFieldChange("manufacturer", e.target.value)}
                  />
                ) : (
                  <p className="text-sm mt-1">{product.manufacturer}</p>
                )}
              </div>

              <div>
                <Label>Batch Number</Label>
                {editing ? (
                  <Input
                    value={editedProduct.batchNumber || ""}
                    onChange={(e) => handleFieldChange("batchNumber", e.target.value)}
                  />
                ) : (
                  <p className="text-sm mt-1">{product.batchNumber || "N/A"}</p>
                )}
              </div>
            </div>

            <div>
              <Label>Description</Label>
              {editing ? (
                <textarea
                  className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md"
                  value={editedProduct.description || ""}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                />
              ) : (
                <p className="text-sm mt-1">{product.description}</p>
              )}
            </div>

            <div>
              <Label>Regulatory Information</Label>
              {editing ? (
                <textarea
                  className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md"
                  value={editedProduct.regulatoryInfo || ""}
                  onChange={(e) => handleFieldChange("regulatoryInfo", e.target.value)}
                />
              ) : (
                <p className="text-sm mt-1">{product.regulatoryInfo || "N/A"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unit Price</Label>
                {editing ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={editedProduct.unitPrice || ""}
                    onChange={(e) => handleFieldChange("unitPrice", parseFloat(e.target.value))}
                  />
                ) : (
                  <p className="text-sm mt-1">{formatCurrency(product.unitPrice)}</p>
                )}
              </div>

              <div>
                <Label>Cost Price</Label>
                {editing ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={editedProduct.costPrice || ""}
                    onChange={(e) => handleFieldChange("costPrice", parseFloat(e.target.value))}
                  />
                ) : (
                  <p className="text-sm mt-1">{formatCurrency(product.costPrice)}</p>
                )}
              </div>

              <div>
                <Label>Stock Quantity</Label>
                {editing ? (
                  <Input
                    type="number"
                    value={editedProduct.stockQuantity || ""}
                    onChange={(e) => handleFieldChange("stockQuantity", parseInt(e.target.value))}
                  />
                ) : (
                  <p className="text-sm mt-1">{product.stockQuantity}</p>
                )}
              </div>

              <div>
                <Label>Reorder Level</Label>
                {editing ? (
                  <Input
                    type="number"
                    value={editedProduct.reorderLevel || ""}
                    onChange={(e) => handleFieldChange("reorderLevel", parseInt(e.target.value))}
                  />
                ) : (
                  <p className="text-sm mt-1">{product.reorderLevel}</p>
                )}
              </div>

              <div>
                <Label>Expiry Date</Label>
                {editing ? (
                  <Input
                    type="date"
                    value={editedProduct.expiryDate ? new Date(editedProduct.expiryDate).toISOString().split('T')[0] : ""}
                    onChange={(e) => handleFieldChange("expiryDate", e.target.value ? new Date(e.target.value) : undefined)}
                  />
                ) : (
                  <p className="text-sm mt-1">{product.expiryDate ? formatDate(product.expiryDate) : "N/A"}</p>
                )}
              </div>

              <div>
                <Label>Profit Margin</Label>
                <p className="text-sm mt-1 font-medium text-green-600">
                  {product.profitMargin?.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Total Inventory Value</span>
                <span className="font-bold">{formatCurrency(product.unitPrice * product.stockQuantity)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Cost Value</span>
                <span className="font-bold">{formatCurrency(product.costPrice * product.stockQuantity)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales History Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales History (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {salesHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="quantity" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No sales data available for the last 30 days
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights */}
        <ProductAIInsights product={product} />
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Created At:</span>
              <span className="ml-2">{formatDate(product.createdAt)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Updated At:</span>
              <span className="ml-2">{formatDate(product.updatedAt)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created By:</span>
              <span className="ml-2">{product.createdBy}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className="ml-2">
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
