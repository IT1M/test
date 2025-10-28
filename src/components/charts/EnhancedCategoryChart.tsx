"use client";

import { useState, useCallback } from "react";
import { InteractiveChart, ChartData } from "./InteractiveChart";
import { cn } from "@/utils/cn";

export interface CategoryAnalysisData {
  name: string;
  count: number;
  value: number;
  rejectCount: number;
  rejectRate: number;
  trend: "up" | "down" | "neutral";
  trendPercentage: number;
  subcategories?: CategoryAnalysisData[];
}

export interface EnhancedCategoryChartProps {
  data: CategoryAnalysisData[];
  className?: string;
  onExport?: (format: "png" | "svg" | "pdf") => void;
  onCategoryClick?: (category: CategoryAnalysisData) => void;
  interactive?: boolean;
  showSubcategories?: boolean;
  height?: number;
  chartType?: "bar" | "pie" | "treemap";
}

export function EnhancedCategoryChart({
  data,
  className,
  onExport,
  onCategoryClick,
  interactive = true,
  showSubcategories = false,
  height = 400,
  chartType = "bar",
}: EnhancedCategoryChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryAnalysisData | null>(null);
  const [viewMode, setViewMode] = useState<"count" | "value" | "rejectRate">("count");
  const [sortBy, setSortBy] = useState<"name" | "count" | "value" | "rejectRate">("count");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleCategoryClick = useCallback((data: any, index: number) => {
    const category = data as CategoryAnalysisData;
    setSelectedCategory(category);
    onCategoryClick?.(category);
  }, [onCategoryClick]);

  const sortedData = [...data].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortBy) {
      case "name":
        aValue = a.name;
        bValue = b.name;
        break;
      case "count":
        aValue = a.count;
        bValue = b.count;
        break;
      case "value":
        aValue = a.value;
        bValue = b.value;
        break;
      case "rejectRate":
        aValue = a.rejectRate;
        bValue = b.rejectRate;
        break;
      default:
        aValue = a.count;
        bValue = b.count;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    return sortOrder === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
  });

  const processedData: ChartData[] = sortedData.map(item => ({
    name: item.name,
    count: item.count,
    value: item.value,
    rejectCount: item.rejectCount,
    rejectRate: item.rejectRate * 100, // Convert to percentage
    trend: item.trend,
    trendPercentage: item.trendPercentage,
  }));

  const getDataKey = () => {
    switch (viewMode) {
      case "count":
        return "count";
      case "value":
        return "value";
      case "rejectRate":
        return "rejectRate";
      default:
        return "count";
    }
  };

  const getTitle = () => {
    switch (viewMode) {
      case "count":
        return "Items by Category";
      case "value":
        return "Value by Category";
      case "rejectRate":
        return "Reject Rate by Category";
      default:
        return "Category Analysis";
    }
  };

  const customizations = {
    colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"],
    animations: true,
    zoom: interactive && chartType !== "pie",
    brush: interactive && chartType === "bar",
    crossfilter: interactive,
    grid: chartType === "bar",
    legend: chartType === "pie",
    tooltip: true,
    responsive: true,
  };

  if (!data || data.length === 0) {
    return (
      <div className={cn("bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Category Analysis
          </h3>
        </div>
        <div className="flex items-center justify-center h-64 text-secondary-500 dark:text-secondary-400">
          No category data available
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Chart Controls */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* View Mode Selection */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              View:
            </span>
            <div className="flex rounded-lg border border-secondary-300 dark:border-secondary-600 overflow-hidden">
              {[
                { key: "count", label: "Count" },
                { key: "value", label: "Value" },
                { key: "rejectRate", label: "Reject %" },
              ].map(option => (
                <button
                  key={option.key}
                  onClick={() => setViewMode(option.key as any)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium transition-colors",
                    viewMode === option.key
                      ? "bg-primary-600 text-white"
                      : "bg-white dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Type Selection */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Chart:
            </span>
            <select
              value={chartType}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="px-3 py-1 text-sm border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
            >
              <option value="bar">Bar Chart</option>
              <option value="pie">Pie Chart</option>
            </select>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 text-sm border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
            >
              <option value="name">Name</option>
              <option value="count">Count</option>
              <option value="value">Value</option>
              <option value="rejectRate">Reject Rate</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-1 text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200"
            >
              <svg className={cn("w-4 h-4 transition-transform", sortOrder === "desc" && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Chart */}
      <InteractiveChart
        data={processedData}
        type={chartType}
        dataKeys={[getDataKey()]}
        xAxisKey="name"
        title={getTitle()}
        subtitle={`${data.length} categories • Sorted by ${sortBy} (${sortOrder})`}
        height={height}
        interactive={interactive}
        exportable={true}
        aiInsights={true}
        customizations={customizations}
        onDataPointClick={handleCategoryClick}
        onExport={onExport}
        className="bg-white dark:bg-secondary-800"
      />

      {/* Category Details */}
      {selectedCategory && (
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              {selectedCategory.name} Details
            </h4>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {selectedCategory.count.toLocaleString()}
              </div>
              <div className="text-xs text-secondary-600 dark:text-secondary-400">
                Total Items
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600 dark:text-success-400">
                ${selectedCategory.value.toLocaleString()}
              </div>
              <div className="text-xs text-secondary-600 dark:text-secondary-400">
                Total Value
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-danger-600 dark:text-danger-400">
                {selectedCategory.rejectCount.toLocaleString()}
              </div>
              <div className="text-xs text-secondary-600 dark:text-secondary-400">
                Rejects
              </div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-2xl font-bold flex items-center justify-center gap-1",
                selectedCategory.trend === "up" ? "text-success-600 dark:text-success-400" :
                selectedCategory.trend === "down" ? "text-danger-600 dark:text-danger-400" :
                "text-secondary-600 dark:text-secondary-400"
              )}>
                {selectedCategory.trend === "up" && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                )}
                {selectedCategory.trend === "down" && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                {Math.abs(selectedCategory.trendPercentage).toFixed(1)}%
              </div>
              <div className="text-xs text-secondary-600 dark:text-secondary-400">
                Trend
              </div>
            </div>
          </div>

          {/* Subcategories */}
          {showSubcategories && selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                Subcategories
              </h5>
              <div className="space-y-2">
                {selectedCategory.subcategories.map((sub, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-secondary-50 dark:bg-secondary-700 rounded-lg"
                  >
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">
                      {sub.name}
                    </span>
                    <div className="flex items-center gap-4 text-xs text-secondary-600 dark:text-secondary-400">
                      <span>{sub.count} items</span>
                      <span>${sub.value.toLocaleString()}</span>
                      <span className={cn(
                        "font-medium",
                        sub.rejectRate > 0.1 ? "text-danger-600 dark:text-danger-400" : "text-success-600 dark:text-success-400"
                      )}>
                        {(sub.rejectRate * 100).toFixed(1)}% rejects
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Statistics */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-4">
        <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
          Category Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-primary-600 dark:text-primary-400">
              {data.length}
            </div>
            <div className="text-xs text-secondary-600 dark:text-secondary-400">
              Total Categories
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-success-600 dark:text-success-400">
              {data.reduce((sum, cat) => sum + cat.count, 0).toLocaleString()}
            </div>
            <div className="text-xs text-secondary-600 dark:text-secondary-400">
              Total Items
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-warning-600 dark:text-warning-400">
              ${data.reduce((sum, cat) => sum + cat.value, 0).toLocaleString()}
            </div>
            <div className="text-xs text-secondary-600 dark:text-secondary-400">
              Total Value
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-danger-600 dark:text-danger-400">
              {((data.reduce((sum, cat) => sum + cat.rejectRate, 0) / data.length) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-secondary-600 dark:text-secondary-400">
              Avg Reject Rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}