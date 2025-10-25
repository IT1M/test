"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/utils/cn";

export interface RejectAnalysisData {
  none: number;
  low: number;
  medium: number;
  high: number;
}

export interface RejectAnalysisChartProps {
  data: RejectAnalysisData;
  className?: string;
  onExport?: () => void;
}

const COLORS = {
  none: "#10b981", // green
  low: "#3b82f6", // blue
  medium: "#f59e0b", // amber
  high: "#ef4444", // red
};

const LABELS = {
  none: "No Rejects (0%)",
  low: "Low (0-5%)",
  medium: "Medium (5-15%)",
  high: "High (>15%)",
};

export function RejectAnalysisChart({ data, className, onExport }: RejectAnalysisChartProps) {
  const chartData = [
    { name: LABELS.none, value: data.none, key: "none" },
    { name: LABELS.low, value: data.low, key: "low" },
    { name: LABELS.medium, value: data.medium, key: "medium" },
    { name: LABELS.high, value: data.high, key: "high" },
  ];

  const total = data.none + data.low + data.medium + data.high;

  if (total === 0) {
    return (
      <div className={cn("bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Reject Rate Analysis
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
          Reject Rate Analysis
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
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-secondary-200 dark:stroke-secondary-700" />
          <XAxis
            dataKey="name"
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
          <Bar dataKey="value" name="Item Count">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.key as keyof typeof COLORS]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {chartData.map((item) => (
          <div key={item.key} className="text-center">
            <div className="text-xl font-bold text-secondary-900 dark:text-secondary-100">
              {item.value.toLocaleString()}
            </div>
            <div className="text-xs text-secondary-600 dark:text-secondary-400 flex items-center justify-center gap-1 mt-1">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[item.key as keyof typeof COLORS] }}
              />
              {item.name}
            </div>
            <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
              {((item.value / total) * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
