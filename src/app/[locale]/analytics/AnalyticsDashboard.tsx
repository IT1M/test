"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { KPICard } from "@/components/charts";
import { DashboardFilters, type DashboardFilterState } from "@/components/filters/DashboardFilters";
import toast from "react-hot-toast";

// Dynamically import heavy chart components
const InventoryTrendChart = dynamic(
  () => import("@/components/charts").then((mod) => ({ default: mod.InventoryTrendChart })),
  { 
    loading: () => <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />,
    ssr: false 
  }
);

const DestinationPieChart = dynamic(
  () => import("@/components/charts").then((mod) => ({ default: mod.DestinationPieChart })),
  { 
    loading: () => <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />,
    ssr: false 
  }
);

const CategoryBarChart = dynamic(
  () => import("@/components/charts").then((mod) => ({ default: mod.CategoryBarChart })),
  { 
    loading: () => <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />,
    ssr: false 
  }
);

const RejectAnalysisChart = dynamic(
  () => import("@/components/charts").then((mod) => ({ default: mod.RejectAnalysisChart })),
  { 
    loading: () => <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />,
    ssr: false 
  }
);

const AIInsightsPanel = dynamic(
  () => import("@/components/charts").then((mod) => ({ default: mod.AIInsightsPanel })),
  { 
    loading: () => <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />,
    ssr: false 
  }
);

interface KPIData {
  totalItems: { value: number; trend: number | null };
  totalQuantity: { value: number; trend: number | null };
  rejectRate: { value: number; trend: number | null };
  activeUsers: { value: number; trend: number | null };
}

interface TrendsData {
  trends: Array<{
    date: string;
    totalQuantity: number;
    totalRejects: number;
    rejectRate: number;
    itemCount: number;
  }>;
  destinationDistribution: {
    MAIS: number;
    FOZAN: number;
  };
  categoryDistribution: Array<{
    name: string;
    count: number;
  }>;
  rejectAnalysis: {
    none: number;
    low: number;
    medium: number;
    high: number;
  };
}

interface AIInsightsData {
  findings: string[];
  alerts: string[];
  recommendations: string[];
  predictions: string[];
}

export function AnalyticsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFilters] = useState<DashboardFilterState>(() => ({
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    destinations: searchParams.get("destinations")?.split(",").filter(Boolean) || [],
    categories: searchParams.get("categories")?.split(",").filter(Boolean) || [],
  }));

  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsightsData | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const [loadingKPI, setLoadingKPI] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Update URL params when filters change
  const updateURLParams = useCallback((newFilters: DashboardFilterState) => {
    const params = new URLSearchParams();
    if (newFilters.dateFrom) params.set("dateFrom", newFilters.dateFrom);
    if (newFilters.dateTo) params.set("dateTo", newFilters.dateTo);
    if (newFilters.destinations.length > 0) params.set("destinations", newFilters.destinations.join(","));
    if (newFilters.categories.length > 0) params.set("categories", newFilters.categories.join(","));
    
    router.push(`/analytics?${params.toString()}`, { scroll: false });
  }, [router]);

  // Fetch KPI data
  const fetchKPIData = useCallback(async () => {
    setLoadingKPI(true);
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);

      const response = await fetch(`/api/analytics/summary?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to fetch KPI data");
      }

      setKpiData(result.data.kpis);
    } catch (error: any) {
      console.error("Error fetching KPI data:", error);
      toast.error(error.message || "Failed to load KPI data");
    } finally {
      setLoadingKPI(false);
    }
  }, [filters.dateFrom, filters.dateTo]);

  // Fetch trends data
  const fetchTrendsData = useCallback(async () => {
    setLoadingTrends(true);
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      params.set("groupBy", "day");

      const response = await fetch(`/api/analytics/trends?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to fetch trends data");
      }

      setTrendsData(result.data);
      
      // Extract available categories
      if (result.data.categoryDistribution) {
        setAvailableCategories(result.data.categoryDistribution.map((c: any) => c.name));
      }
    } catch (error: any) {
      console.error("Error fetching trends data:", error);
      toast.error(error.message || "Failed to load trends data");
    } finally {
      setLoadingTrends(false);
    }
  }, [filters.dateFrom, filters.dateTo]);

  // Fetch AI insights
  const fetchAIInsights = useCallback(async (query?: string) => {
    setLoadingAI(true);
    setAiError(null);
    try {
      const response = await fetch("/api/analytics/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          query,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to generate AI insights");
      }

      if (query) {
        // Handle natural language query response
        toast.success("AI response generated");
        // You could display this in a modal or separate section
        console.log("AI Response:", result.data.response);
      } else {
        setAiInsights(result.data);
      }
    } catch (error: any) {
      console.error("Error fetching AI insights:", error);
      setAiError(error.message || "Failed to generate AI insights");
      toast.error(error.message || "Failed to generate AI insights");
    } finally {
      setLoadingAI(false);
    }
  }, [filters.dateFrom, filters.dateTo]);

  // Load data on mount and when filters change
  useEffect(() => {
    fetchKPIData();
    fetchTrendsData();
  }, [fetchKPIData, fetchTrendsData]);

  const handleFiltersChange = (newFilters: DashboardFilterState) => {
    setFilters(newFilters);
    updateURLParams(newFilters);
  };

  const handleKPIClick = (kpiType: string) => {
    // Navigate to data log with appropriate filters
    router.push(`/data-log?${new URLSearchParams(filters as any).toString()}`);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Filters */}
      <DashboardFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableCategories={availableCategories}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard
          title="Total Items"
          value={kpiData?.totalItems.value || 0}
          trend={
            kpiData?.totalItems.trend !== null && kpiData?.totalItems.trend !== undefined
              ? {
                  direction: kpiData.totalItems.trend > 0 ? "up" : kpiData.totalItems.trend < 0 ? "down" : "neutral",
                  percentage: Math.abs(kpiData.totalItems.trend),
                }
              : undefined
          }
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          onClick={() => handleKPIClick("items")}
        />

        <KPICard
          title="Total Quantity"
          value={kpiData?.totalQuantity.value || 0}
          trend={
            kpiData?.totalQuantity.trend !== null && kpiData?.totalQuantity.trend !== undefined
              ? {
                  direction: kpiData.totalQuantity.trend > 0 ? "up" : kpiData.totalQuantity.trend < 0 ? "down" : "neutral",
                  percentage: Math.abs(kpiData.totalQuantity.trend),
                }
              : undefined
          }
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          }
          onClick={() => handleKPIClick("quantity")}
        />

        <KPICard
          title="Reject Rate"
          value={kpiData?.rejectRate.value ? `${kpiData.rejectRate.value}%` : "0%"}
          trend={
            kpiData?.rejectRate.trend !== null && kpiData?.rejectRate.trend !== undefined
              ? {
                  direction: kpiData.rejectRate.trend > 0 ? "up" : kpiData.rejectRate.trend < 0 ? "down" : "neutral",
                  percentage: Math.abs(kpiData.rejectRate.trend),
                }
              : undefined
          }
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          onClick={() => handleKPIClick("rejects")}
        />

        <KPICard
          title="Active Users"
          value={kpiData?.activeUsers.value || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <InventoryTrendChart data={trendsData?.trends || []} />
        <DestinationPieChart data={trendsData?.destinationDistribution || { MAIS: 0, FOZAN: 0 }} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <CategoryBarChart data={trendsData?.categoryDistribution || []} />
        <RejectAnalysisChart data={trendsData?.rejectAnalysis || { none: 0, low: 0, medium: 0, high: 0 }} />
      </div>

      {/* AI Insights */}
      <AIInsightsPanel
        insights={aiInsights}
        loading={loadingAI}
        error={aiError}
        onRefresh={() => fetchAIInsights()}
        onAskQuestion={(question) => fetchAIInsights(question)}
      />
    </div>
  );
}
