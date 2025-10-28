"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { cn } from "@/utils/cn";

export interface TrendDataPoint {
  date: string;
  totalQuantity: number;
  totalRejects: number;
  rejectRate: number;
  itemCount: number;
}

export interface InventoryTrendChartProps {
  data: TrendDataPoint[];
  className?: string;
  onExport?: () => void;
}

export function InventoryTrendChart({ data, className, onExport }: InventoryTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Inventory Trends
          </h3>
        </div>
        <div className="flex items-center justify-center h-64 text-secondary-500 dark:text-secondary-400">
          No data available for the selected period
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          Inventory Trends Over Time
        </h3>
        {onExport && (
          <button
            onClick={onExport}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            Export PNG
          </button>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-secondary-200 dark:stroke-secondary-700" />
          <XAxis
            dataKey="date"
            className="text-xs text-secondary-600 dark:text-secondary-400"
            tick={{ fill: "currentColor" }}
          />
          <YAxis
            className="text-xs text-secondary-600 dark:text-secondary-400"
            tick={{ fill: "currentColor" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--toast-bg)",
              border: "1px solid var(--toast-border)",
              borderRadius: "0.5rem",
              color: "var(--toast-color)",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="totalQuantity"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Total Quantity"
            dot={{ fill: "#3b82f6" }}
          />
          <Line
            type="monotone"
            dataKey="itemCount"
            stroke="#10b981"
            strokeWidth={2}
            name="Item Count"
            dot={{ fill: "#10b981" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
