"use client";

import { useState, useCallback, useEffect } from "react";
import { EnhancedInventoryTrendChart, EnhancedTrendDataPoint } from "./EnhancedInventoryTrendChart";
import { EnhancedCategoryChart, CategoryAnalysisData } from "./EnhancedCategoryChart";
import { InteractiveChart, ChartData } from "./InteractiveChart";
import { KPICard, TrendData } from "./KPICard";
import { cn } from "@/utils/cn";

export interface AnalyticsDashboardProps {
  className?: string;
  realTimeUpdates?: boolean;
  updateInterval?: number;
  onExport?: (chartType: string, format: "png" | "svg" | "pdf") => void;
}

export interface DashboardData {
  kpis: {
    totalItems: { value: number; trend: TrendData };
    totalValue: { value: number; trend: TrendData };
    rejectRate: { value: number; trend: TrendData };
    efficiency: { value: number; trend: TrendData };
  };
  trends: EnhancedTrendDataPoint[];
  categories: CategoryAnalysisData[];
  destinations: ChartData[];
  recentActivity: ChartData[];
}

// Mock data generator for demonstration
const generateMockData = (): DashboardData => {
  const now = new Date();
  const trends: EnhancedTrendDataPoint[] = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    trends.push({
      date: date.toISOString().split('T')[0],
      totalQuantity: Math.floor(Math.random() * 1000) + 500,
      totalRejects: Math.floor(Math.random() * 50) + 10,
      rejectRate: Math.random() * 0.1 + 0.02,
      itemCount: Math.floor(Math.random() * 100) + 50,
      averageValue: Math.floor(Math.random() * 500) + 100,
      efficiency: Math.random() * 0.3 + 0.7,
    });
  }

  const categories: CategoryAnalysisData[] = [
    {
      name: "Medical Supplies",
      count: 450,
      value: 125000,
      rejectCount: 15,
      rejectRate: 0.033,
      trend: "up",
      trendPercentage: 12.5,
    },
    {
      name: "Surgical Equipment",
      count: 280,
      value: 89000,
      rejectCount: 8,
      rejectRate: 0.029,
      trend: "down",
      trendPercentage: -5.2,
    },
    {
      name: "Pharmaceuticals",
      count: 320,
      value: 156000,
      rejectCount: 22,
      rejectRate: 0.069,
      trend: "up",
      trendPercentage: 8.7,
    },
    {
      name: "Diagnostic Tools",
      count: 180,
      value: 67000,
      rejectCount: 5,
      rejectRate: 0.028,
      trend: "neutral",
      trendPercentage: 1.2,
    },
  ];

  const destinations: ChartData[] = [
    { name: "Hospital A", value: 35, count: 245 },
    { name: "Hospital B", value: 28, count: 196 },
    { name: "Clinic C", value: 22, count: 154 },
    { name: "Emergency D", value: 15, count: 105 },
  ];

  const recentActivity: ChartData[] = [];
  for (let i = 23; i >= 0; i--) {
    const hour = new Date();
    hour.setHours(hour.getHours() - i);
    
    recentActivity.push({
      time: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      entries: Math.floor(Math.random() * 20) + 5,
      updates: Math.floor(Math.random() * 15) + 2,
      exports: Math.floor(Math.random() * 5),
    });
  }

  return {
    kpis: {
      totalItems: {
        value: 1230,
        trend: { direction: "up", percentage: 8.5, period: "vs last month", isGood: true }
      },
      totalValue: {
        value: 437000,
        trend: { direction: "up", percentage: 12.3, period: "vs last month", isGood: true }
      },
      rejectRate: {
        value: 3.2,
        trend: { direction: "down", percentage: 15.7, period: "vs last month", isGood: true }
      },
      efficiency: {
        value: 94.8,
        trend: { direction: "up", percentage: 5.2, period: "vs last month", isGood: true }
      },
    },
    trends,
    categories,
    destinations,
    recentActivity,
  };
};

export function AnalyticsDashboard({
  className,
  realTimeUpdates = false,
  updateInterval = 30000,
  onExport,
}: AnalyticsDashboardProps) {
  const [data, setData] = useState<DashboardData>(generateMockData());
  const [selectedTimeRange, setSelectedTimeRange] = useState<"24h" | "7d" | "30d" | "90d">("30d");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Real-time updates
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      setIsLoading(true);
      // Simulate API call delay
      setTimeout(() => {
        setData(generateMockData());
        setLastUpdated(new Date());
        setIsLoading(false);
      }, 500);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [realTimeUpdates, updateInterval]);

  const handleTimeRangeChange = useCallback((range: "24h" | "7d" | "30d" | "90d") => {
    setSelectedTimeRange(range);
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setData(generateMockData());
      setIsLoading(false);
    }, 500);
  }, []);

  const handleExport = useCallback((chartType: string, format: "png" | "svg" | "pdf") => {
    onExport?.(chartType, format);
  }, [onExport]);

  const handleRefreshData = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setData(generateMockData());
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Dashboard Header */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
              Analytics Dashboard
            </h1>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
              Comprehensive inventory analytics and insights
              {realTimeUpdates && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                  Live updates
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex rounded-lg border border-secondary-300 dark:border-secondary-600 overflow-hidden">
              {[
                { key: "24h", label: "24H" },
                { key: "7d", label: "7D" },
                { key: "30d", label: "30D" },
                { key: "90d", label: "90D" },
              ].map(option => (
                <button
                  key={option.key}
                  onClick={() => handleTimeRangeChange(option.key as any)}
                  className={cn(
                    "px-3 py-1 text-sm font-medium transition-colors",
                    selectedTimeRange === option.key
                      ? "bg-primary-600 text-white"
                      : "bg-white dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefreshData}
              disabled={isLoading}
              className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200 disabled:opacity-50"
              title="Refresh data"
            >
              <svg className={cn("w-5 h-5", isLoading && "animate-spin")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Last Updated */}
            <span className="text-xs text-secondary-500 dark:text-secondary-400">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Items"
          value={data.kpis.totalItems.value}
          trend={data.kpis.totalItems.trend}
          formatter={(value) => value.toLocaleString()}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          loading={isLoading}
          realTimeUpdate={realTimeUpdates}
          onRefresh={handleRefreshData}
        />

        <KPICard
          title="Total Value"
          value={data.kpis.totalValue.value}
          trend={data.kpis.totalValue.trend}
          formatter={(value) => `$${value.toLocaleString()}`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
          loading={isLoading}
          realTimeUpdate={realTimeUpdates}
          onRefresh={handleRefreshData}
        />

        <KPICard
          title="Reject Rate"
          value={data.kpis.rejectRate.value}
          trend={data.kpis.rejectRate.trend}
          formatter={(value) => `${value.toFixed(1)}%`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          loading={isLoading}
          realTimeUpdate={realTimeUpdates}
          onRefresh={handleRefreshData}
        />

        <KPICard
          title="Efficiency"
          value={data.kpis.efficiency.value}
          trend={data.kpis.efficiency.trend}
          formatter={(value) => `${value.toFixed(1)}%`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          loading={isLoading}
          realTimeUpdate={realTimeUpdates}
          onRefresh={handleRefreshData}
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Inventory Trends */}
        <div className="xl:col-span-2">
          <EnhancedInventoryTrendChart
            data={data.trends}
            realTime={realTimeUpdates}
            interactive={true}
            showPredictions={true}
            height={400}
            onExport={(format) => handleExport("trends", format)}
          />
        </div>

        {/* Category Analysis */}
        <EnhancedCategoryChart
          data={data.categories}
          interactive={true}
          showSubcategories={true}
          height={400}
          onExport={(format) => handleExport("categories", format)}
        />

        {/* Destination Distribution */}
        <InteractiveChart
          data={data.destinations}
          type="pie"
          dataKeys={["value"]}
          title="Distribution by Destination"
          subtitle="Percentage breakdown of inventory destinations"
          height={400}
          interactive={true}
          exportable={true}
          aiInsights={true}
          onExport={(format) => handleExport("destinations", format)}
          loading={isLoading}
        />
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <InteractiveChart
          data={data.recentActivity}
          type="area"
          dataKeys={["entries", "updates", "exports"]}
          xAxisKey="time"
          title="Recent Activity (24 Hours)"
          subtitle="System activity over the last 24 hours"
          height={300}
          interactive={true}
          exportable={true}
          customizations={{
            colors: ["#3b82f6", "#10b981", "#f59e0b"],
            animations: true,
            zoom: true,
            brush: false,
            grid: true,
            legend: true,
          }}
          onExport={(format) => handleExport("activity", format)}
          loading={isLoading}
        />

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">
                Data Processing Speed
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                  <div className="w-4/5 h-full bg-success-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  85%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">
                System Reliability
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-success-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  99.9%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">
                Data Accuracy
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                  <div className="w-11/12 h-full bg-success-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  97.8%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">
                User Satisfaction
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                  <div className="w-5/6 h-full bg-primary-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  92%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}