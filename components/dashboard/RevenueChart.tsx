"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { db } from "@/lib/db/schema";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface RevenueDataPoint {
  date: string;
  revenue: number;
  previousRevenue?: number;
}

interface RevenueChartProps {
  period: 'daily' | 'weekly' | 'monthly';
  className?: string;
  height?: number;
}

export function RevenueChart({
  period,
  className,
  height = 300,
}: RevenueChartProps) {
  const [data, setData] = React.useState<RevenueDataPoint[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadRevenueData();
  }, [period]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let dataPoints: RevenueDataPoint[] = [];

      if (period === 'daily') {
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = subDays(now, i);
          const dayStart = startOfDay(date);
          const dayEnd = endOfDay(date);

          const orders = await db.orders
            .where('orderDate')
            .between(dayStart, dayEnd)
            .and(order => order.status !== 'cancelled')
            .toArray();

          const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

          dataPoints.push({
            date: format(date, 'MMM dd'),
            revenue,
          });
        }
      } else if (period === 'weekly') {
        // Last 8 weeks
        for (let i = 7; i >= 0; i--) {
          const date = subDays(now, i * 7);
          const weekStart = startOfWeek(date);
          const weekEnd = endOfWeek(date);

          const orders = await db.orders
            .where('orderDate')
            .between(weekStart, weekEnd)
            .and(order => order.status !== 'cancelled')
            .toArray();

          const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

          dataPoints.push({
            date: format(weekStart, 'MMM dd'),
            revenue,
          });
        }
      } else {
        // Last 6 months
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStart = startOfMonth(date);
          const monthEnd = endOfMonth(date);

          const orders = await db.orders
            .where('orderDate')
            .between(monthStart, monthEnd)
            .and(order => order.status !== 'cancelled')
            .toArray();

          const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

          dataPoints.push({
            date: format(date, 'MMM yyyy'),
            revenue,
          });
        }
      }

      setData(dataPoints);
    } catch (error) {
      console.error('Failed to load revenue data:', error);
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
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Date
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0].payload.date}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Revenue
                          </span>
                          <span className="font-bold">
                            ${payload[0].value?.toLocaleString()}
                          </span>
                        </div>
                        {payload[0].payload.previousRevenue && (
                          <div className="flex flex-col col-span-2">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Previous Period
                            </span>
                            <span className="font-bold text-muted-foreground">
                              ${payload[0].payload.previousRevenue.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {data[0]?.previousRevenue !== undefined && (
              <Area
                type="monotone"
                dataKey="previousRevenue"
                stroke="hsl(var(--muted-foreground))"
                fillOpacity={1}
                fill="url(#colorPrevious)"
                strokeWidth={1}
                strokeDasharray="5 5"
              />
            )}
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
    </div>
  );
}
