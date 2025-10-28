"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/utils/cn";

export interface CategoryData {
  name: string;
  count: number;
}

export interface CategoryBarChartProps {
  data: CategoryData[];
  className?: string;
  onExport?: () => void;
}

export function CategoryBarChart({ data, className, onExport }: CategoryBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Items by Category
          </h3>
        </div>
        <div className="flex items-center justify-center h-64 text-secondary-500 dark:text-secondary-400">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          Items by Category
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
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-secondary-200 dark:stroke-secondary-700" />
          <XAxis
            dataKey="name"
            className="text-xs text-secondary-600 dark:text-secondary-400"
            tick={{ fill: "currentColor" }}
            angle={-45}
            textAnchor="end"
            height={80}
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
          <Bar dataKey="count" fill="#3b82f6" name="Item Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
