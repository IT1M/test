"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { KPICard } from "@/components/charts";
import { DashboardFilters, type DashboardFilterState } from "@/components/filters/DashboardFilters";
import { AIAnalyticsDashboard } from "@/components/ai/AIAnalyticsDashboard";
import { ReportTemplatesManager } from "@/components/reports/ReportTemplatesManager";
import { ReportBuilder, ReportTemplate } from "@/components/reports/ReportBuilder";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

// Dynamically import heavy chart components
const AnalyticsDashboardCharts = dynamic(
  () => import("@/components/charts").then((mod) => ({ default: mod.AnalyticsDashboard })),
  { 
    loading: () => <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />,
    ssr: false 
  }
);

const EnhancedInventoryTrendChart = dynamic(
  () => import("@/components/charts").then((mod) => ({ default: mod.EnhancedInventoryTrendChart })),
  { 
    loading: () => <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />,
    ssr: false 
  }
);

const EnhancedCategoryChart = dynamic(
  () => import("@/components/charts").then((mod) => ({ default: mod.EnhancedCategoryChart })),
  { 
    loading: () => <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />,
    ssr: false 
  }
);

const InteractiveChart = dynamic(
  () => import("@/components/charts").then((mod) => ({ default: mod.InteractiveChart })),
  { 
    loading: () => <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />,
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

  // New state for enhanced features
  const [activeTab, setActiveTab] = useState<"dashboard" | "ai-analytics" | "reports" | "builder">("dashboard");
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState(false);

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

  // Handle report template actions
  const handleTemplateSelect = useCallback((template: ReportTemplate) => {
    setSelectedTemplate(template);
    setActiveTab("builder");
  }, []);

  const handleCreateNewTemplate = useCallback(() => {
    setSelectedTemplate(null);
    setActiveTab("builder");
  }, []);

  const handleExportReport = useCallback((chartType: string, format: "png" | "svg" | "pdf") => {
    toast.success(`Exporting ${chartType} as ${format.toUpperCase()}...`);
    // Implement actual export logic here
  }, []);

  if (selectedTemplate !== null || activeTab === "builder") {
    return (
      <ReportBuilder
        initialTemplate={selectedTemplate || undefined}
        onSave={(template) => {
          toast.success("Report template saved successfully");
          setActiveTab("reports");
          setSelectedTemplate(null);
        }}
        onPreview={(template) => {
          toast.success("Report preview generated");
        }}
        onExport={(template, format) => {
          toast.success(`Exporting report as ${format.toUpperCase()}...`);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Navigation */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
              Advanced Analytics
            </h2>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
              Comprehensive insights with AI-powered analytics and interactive reporting
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time Toggle */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={realTimeUpdates}
                onChange={(e) => setRealTimeUpdates(e.target.checked)}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-secondary-700 dark:text-secondary-300">Real-time</span>
            </label>

            {/* Export All Button */}
            <button
              onClick={() => handleExportReport("all", "pdf")}
              className="px-4 py-2 text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200 border border-secondary-300 dark:border-secondary-600 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-700"
            >
              Export All
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 border-b border-secondary-200 dark:border-secondary-700">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { key: "dashboard", label: "Dashboard", icon: "📊" },
              { key: "ai-analytics", label: "AI Analytics", icon: "🤖" },
              { key: "reports", label: "Reports", icon: "📋" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  "py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2",
                  activeTab === tab.key
                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-secondary-400 dark:hover:text-secondary-300"
                )}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Filters */}
          <DashboardFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableCategories={availableCategories}
          />

          {/* Enhanced Analytics Dashboard */}
          <AnalyticsDashboardCharts
            realTimeUpdates={realTimeUpdates}
            onExport={handleExportReport}
          />
        </div>
      )}

      {activeTab === "ai-analytics" && (
        <AIAnalyticsDashboard
          data={trendsData?.trends || []}
          onInsightAction={(insight, action) => {
            toast.success(`Executing action: ${action.label}`);
            action.onClick();
          }}
        />
      )}

      {activeTab === "reports" && (
        <ReportTemplatesManager
          onSelectTemplate={handleTemplateSelect}
          onCreateNew={handleCreateNewTemplate}
          onEditTemplate={handleTemplateSelect}
          onDeleteTemplate={(templateId) => {
            toast.success("Template deleted successfully");
          }}
          onDuplicateTemplate={(template) => {
            toast.success("Template duplicated successfully");
          }}
        />
      )}
    </div>
  );
}
