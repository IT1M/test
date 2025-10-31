"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db/schema";

interface InventoryDataPoint {
  category: string;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

interface InventoryStatusChartProps {
  className?: string;
  height?: number;
}

const COLORS = {
  inStock: "hsl(142, 76%, 36%)", // green
  lowStock: "hsl(48, 96%, 53%)", // yellow
  outOfStock: "hsl(0, 84%, 60%)", // red
};

export function InventoryStatusChart({
  className,
  height = 300,
}: InventoryStatusChartProps) {
  const [data, setData] = React.useState<InventoryDataPoint[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadInventoryStatus();
  }, []);

  const loadInventoryStatus = async () => {
    try {
      setLoading(true);
      
      // Get all active products
      const products = await db.products.where('isActive').equals(1).toArray();

      // Group by category and count stock status
      const categoryMap = new Map<string, InventoryDataPoint>();

      for (const product of products) {
        const category = product.category || 'Uncategorized';
        const existing = categoryMap.get(category) || {
          category,
          inStock: 0,
          lowStock: 0,
          outOfStock: 0,
        };

        if (product.stockQuantity === 0) {
          existing.outOfStock++;
        } else if (product.stockQuantity <= product.reorderLevel) {
          existing.lowStock++;
        } else {
          existing.inStock++;
        }

        categoryMap.set(category, existing);
      }

      const inventoryData = Array.from(categoryMap.values());
      setData(inventoryData);
    } catch (error) {
      console.error('Failed to load inventory status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-muted-foreground">Loading chart...</div>
      </div>
    );
  }

  // Transform data for stacked bar chart
  const chartData = data.map((item) => ({
    category: item.category,
    "In Stock": item.inStock,
    "Low Stock": item.lowStock,
    "Out of Stock": item.outOfStock,
  }));

  // Calculate totals for legend
  const totals = data.reduce(
    (acc, item) => ({
      inStock: acc.inStock + item.inStock,
      lowStock: acc.lowStock + item.lowStock,
      outOfStock: acc.outOfStock + item.outOfStock,
    }),
    { inStock: 0, lowStock: 0, outOfStock: 0 }
  );

  return (
    <div className={className}>
      <div className="mb-4">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS.inStock }}
            />
            <span className="text-sm text-muted-foreground">
              In Stock ({totals.inStock})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS.lowStock }}
            />
            <span className="text-sm text-muted-foreground">
              Low Stock ({totals.lowStock})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS.outOfStock }}
            />
            <span className="text-sm text-muted-foreground">
              Out of Stock ({totals.outOfStock})
            </span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="category"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                      <div className="font-bold mb-2">{data.category}</div>
                      <div className="grid gap-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-muted-foreground">
                            In Stock:
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-green-500/10 text-green-600 border-green-500/20"
                          >
                            {data["In Stock"]}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-muted-foreground">
                            Low Stock:
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                          >
                            {data["Low Stock"]}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-muted-foreground">
                            Out of Stock:
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-red-500/10 text-red-600 border-red-500/20"
                          >
                            {data["Out of Stock"]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="In Stock" stackId="a" fill={COLORS.inStock} radius={[0, 0, 0, 0]} />
            <Bar dataKey="Low Stock" stackId="a" fill={COLORS.lowStock} radius={[0, 0, 0, 0]} />
            <Bar dataKey="Out of Stock" stackId="a" fill={COLORS.outOfStock} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
