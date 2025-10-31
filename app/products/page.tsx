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
import { ProductService } from "@/services/database/products";
import type { Product, StockStatus } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { ColumnDef } from "@tanstack/react-table";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState<StockStatus | "all">("all");

  useEffect(() => {
    loadProducts();
    loadFilterOptions();
  }, [selectedCategory, selectedManufacturer, selectedStockStatus]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const filters: any = { isActive: true };
      
      if (selectedCategory !== "all") {
        filters.category = selectedCategory;
      }
      
      if (selectedManufacturer !== "all") {
        filters.manufacturer = selectedManufacturer;
      }
      
      const data = await ProductService.getProducts(filters);
      
      // Apply stock status filter
      let filteredData = data;
      if (selectedStockStatus !== "all") {
        filteredData = data.filter(p => p.stockStatus === selectedStockStatus);
      }
      
      setProducts(filteredData);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const [cats, mfrs] = await Promise.all([
        ProductService.getCategories(),
        ProductService.getManufacturers(),
      ]);
      setCategories(cats);
      setManufacturers(mfrs);
    } catch (error) {
      console.error("Error loading filter options:", error);
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

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "sku",
      header: createSortableHeader("SKU"),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.sku}</span>
      ),
    },
    {
      accessorKey: "name",
      header: createSortableHeader("Product Name"),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">{row.original.category}</div>
        </div>
      ),
    },
    {
      accessorKey: "manufacturer",
      header: createSortableHeader("Manufacturer"),
    },
    {
      accessorKey: "unitPrice",
      header: createSortableHeader("Price"),
      cell: ({ row }) => formatCurrency(row.original.unitPrice),
    },
    {
      accessorKey: "stockQuantity",
      header: createSortableHeader("Stock"),
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium">{row.original.stockQuantity}</div>
          <div className="text-xs text-muted-foreground">
            Reorder: {row.original.reorderLevel}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "stockStatus",
      header: "Status",
      cell: ({ row }) => getStockStatusBadge(row.original.stockStatus!),
    },
    {
      accessorKey: "expiryDate",
      header: createSortableHeader("Expiry Date"),
      cell: ({ row }) => (
        <span className={row.original.expiryDate ? "" : "text-muted-foreground"}>
          {row.original.expiryDate ? formatDate(row.original.expiryDate) : "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "profitMargin",
      header: createSortableHeader("Margin"),
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.profitMargin?.toFixed(1)}%
        </span>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your medical product inventory
          </p>
        </div>
        <Button onClick={() => router.push("/products/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
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
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Manufacturer</label>
              <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                <SelectTrigger>
                  <SelectValue placeholder="All Manufacturers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Manufacturers</SelectItem>
                  {manufacturers.map((mfr) => (
                    <SelectItem key={mfr} value={mfr}>
                      {mfr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Stock Status</label>
              <Select value={selectedStockStatus} onValueChange={(value) => setSelectedStockStatus(value as StockStatus | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading products...</div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={products}
              searchKey="name"
              searchPlaceholder="Search products by name or SKU..."
              onRowClick={(product) => router.push(`/products/${product.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
