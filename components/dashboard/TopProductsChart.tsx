"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { db } from "@/lib/db/schema";
import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface ProductDataPoint {
  name: string;
  sales: number;
  revenue: number;
}

interface TopProductsChartProps {
  period: 'daily' | 'weekly' | 'monthly';
  className?: string;
  height?: number;
  dataKey?: "sales" | "revenue";
}

export function TopProductsChart({
  period,
  className,
  height = 300,
  dataKey = "sales",
}: TopProductsChartProps) {
  const [data, setData] = React.useState<ProductDataPoint[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadTopProducts();
  }, [period]);

  const loadTopProducts = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      if (period === 'daily') {
        startDate = startOfDay(subDays(now, 7));
      } else if (period === 'weekly') {
        startDate = startOfWeek(subDays(now, 56)); // 8 weeks
      } else {
        startDate = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 6, 1)); // 6 months
      }

      // Get all orders in the period
      const orders = await db.orders
        .where('orderDate')
        .between(startDate, endDate)
        .and(order => order.status !== 'cancelled')
        .toArray();

      // Aggregate sales by product
      const productSales = new Map<string, { sales: number; revenue: number }>();

      for (const order of orders) {
        for (const item of order.items) {
          const existing = productSales.get(item.productName) || { sales: 0, revenue: 0 };
          productSales.set(item.productName, {
            sales: existing.sales + item.quantity,
            revenue: existing.revenue + item.total,
          });
        }
      }

      // Convert to array and sort by sales
      const topProducts = Array.from(productSales.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10); // Top 10 products

      setData(topProducts);
    } catch (error) {
      console.error('Failed to load top products:', error);
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
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) =>
                dataKey === "revenue"
                  ? `$${value.toLocaleString()}`
                  : value.toLocaleString()
              }
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Product
                          </span>
                          <span className="font-bold">
                            {payload[0].payload.name}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Sales
                          </span>
                          <span className="font-bold text-primary">
                            {payload[0].payload.sales.toLocaleString()} units
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Revenue
                          </span>
                          <span className="font-bold text-primary">
                            ${payload[0].payload.revenue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey={dataKey}
              fill="hsl(var(--primary))"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
