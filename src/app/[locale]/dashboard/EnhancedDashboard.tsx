"use client";

import { useState, useMemo } from "react";
import { KPICard, TrendData } from "@/components/charts/KPICard";
import { DashboardGrid, GridItem, useDashboardLayout } from "@/components/layout/DashboardGrid";
import { InventoryTrendChart } from "@/components/charts/InventoryTrendChart";
import { useKPIData, useSparklineData } from "@/hooks/useRealTimeData";
import { useRealtimeConnection, useRealtimeKPIUpdates } from "@/services/realtime";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EnhancedDashboardProps {
  user: User;
}

export function EnhancedDashboard({ user }: EnhancedDashboardProps) {
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [enableRealtime, setEnableRealtime] = useState(true);
  
  // Real-time connection status
  const isConnected = useRealtimeConnection();
  
  // Fetch KPI data with real-time updates
  const {
    data: kpiData,
    loading: kpiLoading,
    error: kpiError,
    refresh: refreshKPI,
  } = useKPIData({
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
    interval: enableRealtime ? 30000 : 0, // 30 seconds if enabled
    enabled: true,
  });

  // Fetch sparkline data
  const {
    data: sparklineData,
    loading: sparklineLoading,
  } = useSparklineData({
    days: 7,
    interval: enableRealtime ? 60000 : 0, // 1 minute if enabled
    enabled: true,
  });

  // Dashboard layout management
  const { layout, saveLayout } = useDashboardLayout(user.id, "main-dashboard");

  // Listen for real-time KPI updates
  useRealtimeKPIUpdates((updatedKPIs) => {
    // The useKPIData hook will automatically refresh, but we could also
    // update local state here for immediate feedback
    console.log("Received real-time KPI update:", updatedKPIs);
  });

  // Format trend data
  const formatTrend = (value: number | null, isRejectRate = false): TrendData | null => {
    if (value === null) return null;
    
    return {
      direction: value > 0 ? "up" : value < 0 ? "down" : "neutral",
      percentage: Math.abs(value),
      period: "vs last period",
      isGood: isRejectRate ? value < 0 : value > 0, // For reject rate, decrease is good
    };
  };

  // Create grid items
  const gridItems: GridItem[] = useMemo(() => {
    const items: GridItem[] = [];

    // KPI Cards
    if (kpiData) {
      items.push(
        {
          id: "kpi-total-items",
          size: "sm",
          component: (
            <KPICard
              title="Total Items"
              value={kpiData.totalItems.value}
              trend={formatTrend(kpiData.totalItems.trend)}
              sparklineData={sparklineData?.totalItems}
              loading={kpiLoading}
              error={kpiError || undefined}
              realTimeUpdate={enableRealtime}
              onRefresh={refreshKPI}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              actions={[
                {
                  label: "View Details",
                  onClick: () => console.log("View items details"),
                  variant: "ghost",
                },
              ]}
            />
          ),
        },
        {
          id: "kpi-total-quantity",
          size: "sm",
          component: (
            <KPICard
              title="Total Quantity"
              value={kpiData.totalQuantity.value}
              trend={formatTrend(kpiData.totalQuantity.trend)}
              sparklineData={sparklineData?.totalQuantity}
              loading={kpiLoading}
              error={kpiError || undefined}
              realTimeUpdate={enableRealtime}
              onRefresh={refreshKPI}
              formatter={(value) => value.toLocaleString()}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              }
            />
          ),
        },
        {
          id: "kpi-reject-rate",
          size: "sm",
          component: (
            <KPICard
              title="Reject Rate"
              value={`${kpiData.rejectRate.value}%`}
              trend={formatTrend(kpiData.rejectRate.trend, true)}
              sparklineData={sparklineData?.rejectRate}
              loading={kpiLoading}
              error={kpiError || undefined}
              realTimeUpdate={enableRealtime}
              onRefresh={refreshKPI}
              subtitle="Quality metric"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          ),
        },
        {
          id: "kpi-active-users",
          size: "sm",
          component: (
            <KPICard
              title="Active Users"
              value={kpiData.activeUsers.value}
              loading={kpiLoading}
              error={kpiError || undefined}
              realTimeUpdate={enableRealtime}
              onRefresh={refreshKPI}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              }
            />
          ),
        }
      );
    }

    // Inventory Trend Chart
    items.push({
      id: "inventory-trend-chart",
      size: "lg",
      component: (
        <InventoryTrendChart
          data={[]} // This would be populated with actual trend data
          onExport={() => console.log("Export chart")}
        />
      ),
    });

    // Quick Actions Panel
    items.push({
      id: "quick-actions",
      size: "md",
      component: (
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6 h-full">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-secondary-900 dark:text-secondary-100">Add New Item</p>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">Quick inventory entry</p>
                </div>
              </div>
            </button>
            
            <button className="w-full text-left p-3 rounded-lg bg-success-50 dark:bg-success-900/20 hover:bg-success-100 dark:hover:bg-success-900/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-success-600 text-white flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-secondary-900 dark:text-secondary-100">Generate Report</p>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">Export current data</p>
                </div>
              </div>
            </button>
            
            <button className="w-full text-left p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20 hover:bg-warning-100 dark:hover:bg-warning-900/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-warning-600 text-white flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h10a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-secondary-900 dark:text-secondary-100">Bulk Import</p>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">Upload Excel/CSV</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      ),
    });

    return items;
  }, [kpiData, sparklineData, kpiLoading, kpiError, enableRealtime, refreshKPI]);

  return (
    <div className="mt-8 space-y-6">
      {/* Dashboard Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success-500' : 'bg-danger-500'}`}></div>
            <span className="text-sm text-secondary-600 dark:text-secondary-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enableRealtime}
              onChange={(e) => setEnableRealtime(e.target.checked)}
              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-secondary-600 dark:text-secondary-400">
              Real-time updates
            </span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshKPI}
            className="px-3 py-2 text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 border border-secondary-300 dark:border-secondary-600 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <DashboardGrid
        items={gridItems}
        enableDragDrop={true}
        savedLayout={layout}
        onLayoutChange={saveLayout}
      />
    </div>
  );
}