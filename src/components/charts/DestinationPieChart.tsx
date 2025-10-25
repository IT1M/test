"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { cn } from "@/utils/cn";

export interface DestinationData {
  MAIS: number;
  FOZAN: number;
}

export interface DestinationPieChartProps {
  data: DestinationData;
  className?: string;
  onExport?: () => void;
}

const COLORS = {
  MAIS: "#3b82f6", // blue
  FOZAN: "#10b981", // green
};

export function DestinationPieChart({ data, className, onExport }: DestinationPieChartProps) {
  const chartData = [
    { name: "MAIS", value: data.MAIS },
    { name: "FOZAN", value: data.FOZAN },
  ];

  const total = data.MAIS + data.FOZAN;

  if (total === 0) {
    return (
      <div className={cn("bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Distribution by Destination
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
          Distribution by Destination
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
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props: any) => `${props.name}: ${(props.percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--toast-bg)",
              border: "1px solid var(--toast-border)",
              borderRadius: "0.5rem",
              color: "var(--toast-color)",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            {data.MAIS.toLocaleString()}
          </div>
          <div className="text-sm text-secondary-600 dark:text-secondary-400 flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.MAIS }} />
            MAIS ({((data.MAIS / total) * 100).toFixed(1)}%)
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            {data.FOZAN.toLocaleString()}
          </div>
          <div className="text-sm text-secondary-600 dark:text-secondary-400 flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.FOZAN }} />
            FOZAN ({((data.FOZAN / total) * 100).toFixed(1)}%)
          </div>
        </div>
      </div>
    </div>
  );
}
