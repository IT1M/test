"use client";

import { useState, useCallback, useEffect } from "react";
import { AIInsightsEngine, AIInsight, AIInsightAction } from "./AIInsightsEngine";
import { InteractiveChart, ChartData } from "../charts/InteractiveChart";
import { cn } from "@/utils/cn";

export interface AIAnalyticsDashboardProps {
  data: any[];
  className?: string;
  onInsightAction?: (insight: AIInsight, action: AIInsightAction) => void;
}

interface AIAnalysisResult {
  insights: AIInsight[];
  trends: {
    inventory: TrendData;
    quality: TrendData;
    efficiency: TrendData;
  };
  predictions: {
    nextWeek: PredictionData[];
    nextMonth: PredictionData[];
  };
  recommendations: RecommendationData[];
  anomalies: AnomalyData[];
}

interface TrendData {
  direction: "up" | "down" | "stable";
  strength: number;
  description: string;
  chartData: ChartData[];
}

interface PredictionData {
  metric: string;
  current: number;
  predicted: number;
  confidence: number;
  change: number;
}

interface RecommendationData {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
  category: string;
}

interface AnomalyData {
  id: string;
  type: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  affectedItems: string[];
  detectedAt: Date;
}

export function AIAnalyticsDashboard({
  data,
  className,
  onInsightAction,
}: AIAnalyticsDashboardProps) {
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"overview" | "trends" | "predictions" | "anomalies" | "recommendations">("overview");
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  const performAIAnalysis = useCallback(async () => {
    if (!data || data.length === 0) return;

    setIsAnalyzing(true);
    try {
      // Simulate AI analysis - in real implementation, this would call the Gemini service
      const result = await simulateAIAnalysis(data);
      setAnalysisResult(result);
      setLastAnalysis(new Date());
    } catch (error) {
      console.error("AI analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [data]);

  useEffect(() => {
    performAIAnalysis();
  }, [performAIAnalysis]);

  const handleInsightAction = useCallback((insight: AIInsight, action: AIInsightAction) => {
    onInsightAction?.(insight, action);
  }, [onInsightAction]);

  if (isAnalyzing && !analysisResult) {
    return (
      <div className={cn("bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-8", className)}>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
              AI Analysis in Progress
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400">
              Analyzing {data.length} data points with advanced AI algorithms...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className={cn("bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-8", className)}>
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-secondary-400 dark:text-secondary-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
            No Analysis Available
          </h3>
          <p className="text-secondary-600 dark:text-secondary-400 mb-4">
            Unable to perform AI analysis. Please try again.
          </p>
          <button
            onClick={performAIAnalysis}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
              AI Analytics Dashboard
            </h2>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
              Advanced insights powered by artificial intelligence
              {lastAnalysis && (
                <span className="ml-2">
                  • Last analysis: {lastAnalysis.toLocaleString()}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-success-600 dark:text-success-400">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              AI Powered
            </div>
            <button
              onClick={performAIAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50"
            >
              {isAnalyzing ? "Analyzing..." : "Refresh Analysis"}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700">
        <div className="border-b border-secondary-200 dark:border-secondary-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { key: "overview", label: "Overview", count: analysisResult.insights.length },
              { key: "trends", label: "Trends", count: 3 },
              { key: "predictions", label: "Predictions", count: analysisResult.predictions.nextWeek.length + analysisResult.predictions.nextMonth.length },
              { key: "anomalies", label: "Anomalies", count: analysisResult.anomalies.length },
              { key: "recommendations", label: "Recommendations", count: analysisResult.recommendations.length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                className={cn(
                  "py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap",
                  selectedTab === tab.key
                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-secondary-400 dark:hover:text-secondary-300"
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-secondary-100 dark:bg-secondary-700 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {selectedTab === "overview" && (
            <OverviewTab analysisResult={analysisResult} onInsightAction={handleInsightAction} />
          )}
          {selectedTab === "trends" && (
            <TrendsTab trends={analysisResult.trends} />
          )}
          {selectedTab === "predictions" && (
            <PredictionsTab predictions={analysisResult.predictions} />
          )}
          {selectedTab === "anomalies" && (
            <AnomaliesTab anomalies={analysisResult.anomalies} />
          )}
          {selectedTab === "recommendations" && (
            <RecommendationsTab recommendations={analysisResult.recommendations} />
          )}
        </div>
      </div>
    </div>
  );
}

interface OverviewTabProps {
  analysisResult: AIAnalysisResult;
  onInsightAction: (insight: AIInsight, action: AIInsightAction) => void;
}

function OverviewTab({ analysisResult, onInsightAction }: OverviewTabProps) {
  const criticalInsights = analysisResult.insights.filter(i => i.severity === "critical");
  const highInsights = analysisResult.insights.filter(i => i.severity === "high");

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Trends Detected</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">3</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Anomalies Found</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{analysisResult.anomalies.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Recommendations</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{analysisResult.recommendations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Predictions</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {analysisResult.predictions.nextWeek.length + analysisResult.predictions.nextMonth.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalInsights.length > 0 && (
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 text-danger-600 dark:text-danger-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-semibold text-danger-900 dark:text-danger-100">
              Critical Issues Detected
            </h3>
          </div>
          <div className="space-y-2">
            {criticalInsights.map(insight => (
              <div key={insight.id} className="text-sm text-danger-800 dark:text-danger-200">
                • {insight.title}: {insight.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights Engine */}
      <AIInsightsEngine
        data={[]} // Pass actual data here
        onInsightAction={onInsightAction}
        realTime={false}
      />
    </div>
  );
}

interface TrendsTabProps {
  trends: AIAnalysisResult["trends"];
}

function TrendsTab({ trends }: TrendsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(trends).map(([key, trend]) => (
          <div key={key} className="space-y-4">
            <div className="bg-secondary-50 dark:bg-secondary-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 capitalize mb-2">
                {key} Trend
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  trend.direction === "up" ? "text-success-600 dark:text-success-400" :
                  trend.direction === "down" ? "text-danger-600 dark:text-danger-400" :
                  "text-secondary-600 dark:text-secondary-400"
                )}>
                  {trend.direction === "up" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                  {trend.direction === "down" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  {trend.direction === "stable" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                    </svg>
                  )}
                  {trend.direction} ({trend.strength}% strength)
                </div>
              </div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                {trend.description}
              </p>
            </div>

            <InteractiveChart
              data={trend.chartData}
              type="line"
              dataKeys={["value"]}
              title={`${key} Trend Analysis`}
              height={200}
              interactive={false}
              exportable={false}
              customizations={{
                animations: true,
                grid: true,
                tooltip: true,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface PredictionsTabProps {
  predictions: AIAnalysisResult["predictions"];
}

function PredictionsTab({ predictions }: PredictionsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
            Next Week Predictions
          </h3>
          <div className="space-y-3">
            {predictions.nextWeek.map((prediction, index) => (
              <PredictionCard key={index} prediction={prediction} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
            Next Month Predictions
          </h3>
          <div className="space-y-3">
            {predictions.nextMonth.map((prediction, index) => (
              <PredictionCard key={index} prediction={prediction} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PredictionCard({ prediction }: { prediction: PredictionData }) {
  const isIncrease = prediction.change > 0;
  
  return (
    <div className="bg-secondary-50 dark:bg-secondary-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
          {prediction.metric}
        </h4>
        <span className="text-xs text-secondary-500 dark:text-secondary-400">
          {prediction.confidence}% confidence
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-secondary-600 dark:text-secondary-400">
            Current: {prediction.current.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
            Predicted: {prediction.predicted.toLocaleString()}
          </div>
        </div>
        
        <div className={cn(
          "flex items-center gap-1 text-sm font-medium",
          isIncrease ? "text-success-600 dark:text-success-400" : "text-danger-600 dark:text-danger-400"
        )}>
          {isIncrease ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
          {Math.abs(prediction.change).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

interface AnomaliesTabProps {
  anomalies: AnomalyData[];
}

function AnomaliesTab({ anomalies }: AnomaliesTabProps) {
  return (
    <div className="space-y-4">
      {anomalies.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-success-400 dark:text-success-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
            No Anomalies Detected
          </h3>
          <p className="text-secondary-600 dark:text-secondary-400">
            All systems are operating within normal parameters
          </p>
        </div>
      ) : (
        anomalies.map(anomaly => (
          <div
            key={anomaly.id}
            className={cn(
              "rounded-lg border p-4",
              anomaly.severity === "critical" ? "border-danger-200 dark:border-danger-700 bg-danger-50 dark:bg-danger-900/20" :
              anomaly.severity === "high" ? "border-warning-200 dark:border-warning-700 bg-warning-50 dark:bg-warning-900/20" :
              "border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800"
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-secondary-900 dark:text-secondary-100">
                  {anomaly.type}
                </h4>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                  {anomaly.description}
                </p>
                {anomaly.affectedItems.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">
                      Affected items: {anomaly.affectedItems.slice(0, 3).join(", ")}
                      {anomaly.affectedItems.length > 3 && ` +${anomaly.affectedItems.length - 3} more`}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className={cn(
                  "px-2 py-1 text-xs font-medium rounded-full capitalize",
                  anomaly.severity === "critical" ? "bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300" :
                  anomaly.severity === "high" ? "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300" :
                  "bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300"
                )}>
                  {anomaly.severity}
                </span>
                <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                  {anomaly.detectedAt.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

interface RecommendationsTabProps {
  recommendations: RecommendationData[];
}

function RecommendationsTab({ recommendations }: RecommendationsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {recommendations.map(recommendation => (
        <div
          key={recommendation.id}
          className="bg-white dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded-lg p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-secondary-900 dark:text-secondary-100">
              {recommendation.title}
            </h4>
            <span className="px-2 py-1 text-xs font-medium bg-secondary-100 dark:bg-secondary-600 text-secondary-700 dark:text-secondary-300 rounded-full">
              {recommendation.category}
            </span>
          </div>
          
          <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
            {recommendation.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-secondary-500 dark:text-secondary-400">Impact:</span>
                <span className={cn(
                  "font-medium",
                  recommendation.impact === "high" ? "text-success-600 dark:text-success-400" :
                  recommendation.impact === "medium" ? "text-warning-600 dark:text-warning-400" :
                  "text-secondary-600 dark:text-secondary-400"
                )}>
                  {recommendation.impact}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-secondary-500 dark:text-secondary-400">Effort:</span>
                <span className={cn(
                  "font-medium",
                  recommendation.effort === "low" ? "text-success-600 dark:text-success-400" :
                  recommendation.effort === "medium" ? "text-warning-600 dark:text-warning-400" :
                  "text-danger-600 dark:text-danger-400"
                )}>
                  {recommendation.effort}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Simulate AI analysis - replace with actual Gemini service calls
async function simulateAIAnalysis(data: any[]): Promise<AIAnalysisResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    insights: [], // This would be populated by the AIInsightsEngine
    trends: {
      inventory: {
        direction: "up",
        strength: 75,
        description: "Inventory levels showing steady upward trend over the past month",
        chartData: Array.from({ length: 30 }, (_, i) => ({
          name: `Day ${i + 1}`,
          value: Math.floor(Math.random() * 100) + 500 + i * 2,
        })),
      },
      quality: {
        direction: "down",
        strength: 60,
        description: "Quality metrics improving with reduced reject rates",
        chartData: Array.from({ length: 30 }, (_, i) => ({
          name: `Day ${i + 1}`,
          value: Math.max(0, 20 - i * 0.3 + Math.random() * 5),
        })),
      },
      efficiency: {
        direction: "stable",
        strength: 45,
        description: "Operational efficiency maintaining steady performance",
        chartData: Array.from({ length: 30 }, (_, i) => ({
          name: `Day ${i + 1}`,
          value: 85 + Math.random() * 10,
        })),
      },
    },
    predictions: {
      nextWeek: [
        {
          metric: "Total Inventory",
          current: 1250,
          predicted: 1320,
          confidence: 85,
          change: 5.6,
        },
        {
          metric: "Reject Rate",
          current: 3.2,
          predicted: 2.8,
          confidence: 78,
          change: -12.5,
        },
      ],
      nextMonth: [
        {
          metric: "Total Inventory",
          current: 1250,
          predicted: 1450,
          confidence: 72,
          change: 16.0,
        },
        {
          metric: "Processing Efficiency",
          current: 87.5,
          predicted: 91.2,
          confidence: 68,
          change: 4.2,
        },
      ],
    },
    recommendations: [
      {
        id: "rec-1",
        title: "Optimize Inventory Rotation",
        description: "Implement FIFO system to reduce waste and improve quality control",
        impact: "high",
        effort: "medium",
        category: "Operations",
      },
      {
        id: "rec-2",
        title: "Enhance Supplier Quality",
        description: "Establish stricter quality standards with key suppliers",
        impact: "medium",
        effort: "high",
        category: "Quality",
      },
      {
        id: "rec-3",
        title: "Automate Data Entry",
        description: "Reduce manual errors through automated data capture systems",
        impact: "medium",
        effort: "low",
        category: "Technology",
      },
    ],
    anomalies: [
      {
        id: "anom-1",
        type: "Unusual Reject Pattern",
        description: "Spike in reject rates detected for specific supplier batch",
        severity: "high",
        affectedItems: ["Medical Supplies Batch #MS-2024-001", "Surgical Equipment Set #SE-2024-045"],
        detectedAt: new Date(),
      },
    ],
  };
}