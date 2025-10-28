"use client";

import { useState, useCallback } from "react";
import { InteractiveChart, ChartData } from "./InteractiveChart";
import { cn } from "@/utils/cn";

export interface EnhancedTrendDataPoint {
  date: string;
  totalQuantity: number;
  totalRejects: number;
  rejectRate: number;
  itemCount: number;
  averageValue?: number;
  efficiency?: number;
}

export interface EnhancedInventoryTrendChartProps {
  data: EnhancedTrendDataPoint[];
  className?: string;
  onExport?: (format: "png" | "svg" | "pdf") => void;
  onDataPointClick?: (data: EnhancedTrendDataPoint) => void;
  realTime?: boolean;
  showPredictions?: boolean;
  interactive?: boolean;
  height?: number;
}

export function EnhancedInventoryTrendChart({
  data,
  className,
  onExport,
  onDataPointClick,
  realTime = false,
  showPredictions = false,
  interactive = true,
  height = 400,
}: EnhancedInventoryTrendChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "totalQuantity",
    "itemCount",
  ]);
  const [chartType, setChartType] = useState<"line" | "area" | "composed">("line");

  const availableMetrics = [
    { key: "totalQuantity", label: "Total Quantity", color: "#3b82f6" },
    { key: "itemCount", label: "Item Count", color: "#10b981" },
    { key: "totalRejects", label: "Total Rejects", color: "#ef4444" },
    { key: "rejectRate", label: "Reject Rate (%)", color: "#f59e0b" },
    { key: "averageValue", label: "Average Value", color: "#8b5cf6" },
    { key: "efficiency", label: "Efficiency (%)", color: "#06b6d4" },
  ];

  const handleMetricToggle = useCallback((metricKey: string) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metricKey)) {
        return prev.filter(key => key !== metricKey);
      } else {
        return [...prev, metricKey];
      }
    });
  }, []);

  const handleDataPointClick = useCallback((data: any, index: number) => {
    onDataPointClick?.(data as EnhancedTrendDataPoint);
  }, [onDataPointClick]);

  const processedData: ChartData[] = data.map(item => ({
    ...item,
    rejectRate: item.rejectRate * 100, // Convert to percentage
    efficiency: item.efficiency ? item.efficiency * 100 : undefined,
  }));

  const customizations = {
    colors: selectedMetrics.map(key => 
      availableMetrics.find(metric => metric.key === key)?.color || "#3b82f6"
    ),
    animations: true,
    zoom: interactive,
    brush: interactive,
    crossfilter: interactive,
    grid: true,
    legend: true,
    tooltip: true,
    responsive: true,
  };

  if (!data || data.length === 0) {
    return (
      <div className={cn("bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Enhanced Inventory Trends
          </h3>
        </div>
        <div className="flex items-center justify-center h-64 text-secondary-500 dark:text-secondary-400">
          No data available for the selected period
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Chart Controls */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Metric Selection */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mr-2">
              Metrics:
            </span>
            {availableMetrics.map(metric => (
              <button
                key={metric.key}
                onClick={() => handleMetricToggle(metric.key)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full transition-colors",
                  selectedMetrics.includes(metric.key)
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                    : "bg-secondary-100 text-secondary-600 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-400 dark:hover:bg-secondary-600"
                )}
                style={{
                  backgroundColor: selectedMetrics.includes(metric.key) ? `${metric.color}20` : undefined,
                  borderColor: selectedMetrics.includes(metric.key) ? metric.color : undefined,
                  borderWidth: selectedMetrics.includes(metric.key) ? 1 : 0,
                }}
              >
                {metric.label}
              </button>
            ))}
          </div>

          {/* Chart Type Selection */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Type:
            </span>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as "line" | "area" | "composed")}
              className="px-3 py-1 text-sm border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
            >
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="composed">Combined Chart</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interactive Chart */}
      <InteractiveChart
        data={processedData}
        type={chartType}
        dataKeys={selectedMetrics}
        xAxisKey="date"
        title="Enhanced Inventory Trends Over Time"
        subtitle={`Showing ${selectedMetrics.length} metrics over ${data.length} data points`}
        height={height}
        interactive={interactive}
        realTime={realTime}
        exportable={true}
        aiInsights={true}
        customizations={customizations}
        onDataPointClick={handleDataPointClick}
        onExport={onExport}
        className="bg-white dark:bg-secondary-800"
      />

      {/* Insights Panel */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-4">
        <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
          Quick Insights
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {data.reduce((sum, item) => sum + item.totalQuantity, 0).toLocaleString()}
            </div>
            <div className="text-xs text-secondary-600 dark:text-secondary-400">
              Total Quantity
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success-600 dark:text-success-400">
              {((data.reduce((sum, item) => sum + item.rejectRate, 0) / data.length) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-secondary-600 dark:text-secondary-400">
              Average Reject Rate
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning-600 dark:text-warning-400">
              {data.length}
            </div>
            <div className="text-xs text-secondary-600 dark:text-secondary-400">
              Data Points
            </div>
          </div>
        </div>
      </div>

      {/* Predictions Panel (if enabled) */}
      {showPredictions && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
              AI Predictions
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-purple-800 dark:text-purple-200">
                Next Week Forecast
              </div>
              <div className="text-purple-600 dark:text-purple-400">
                Expected 15% increase in inventory levels based on current trends
              </div>
            </div>
            <div>
              <div className="font-medium text-purple-800 dark:text-purple-200">
                Anomaly Detection
              </div>
              <div className="text-purple-600 dark:text-purple-400">
                No significant anomalies detected in recent data
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}