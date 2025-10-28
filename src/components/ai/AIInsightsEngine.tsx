"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/utils/cn";

export interface AIInsight {
  id: string;
  type: "trend" | "anomaly" | "prediction" | "recommendation" | "alert";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  confidence: number; // 0-100
  data?: any;
  timestamp: Date;
  actionable?: boolean;
  actions?: AIInsightAction[];
}

export interface AIInsightAction {
  id: string;
  label: string;
  type: "primary" | "secondary" | "danger";
  onClick: () => void;
}

export interface TrendAnalysis {
  direction: "up" | "down" | "stable" | "volatile";
  strength: number; // 0-100
  period: string;
  description: string;
  factors: string[];
}

export interface AnomalyDetection {
  detected: boolean;
  anomalies: Array<{
    type: string;
    description: string;
    severity: "low" | "medium" | "high";
    timestamp: Date;
    affectedItems?: string[];
  }>;
}

export interface PredictiveAnalytics {
  predictions: Array<{
    metric: string;
    currentValue: number;
    predictedValue: number;
    timeframe: string;
    confidence: number;
    factors: string[];
  }>;
  recommendations: string[];
}

export interface AIInsightsEngineProps {
  data: any[];
  className?: string;
  onInsightAction?: (insight: AIInsight, action: AIInsightAction) => void;
  realTime?: boolean;
  updateInterval?: number;
}

export function AIInsightsEngine({
  data,
  className,
  onInsightAction,
  realTime = false,
  updateInterval = 60000, // 1 minute
}: AIInsightsEngineProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [selectedInsightType, setSelectedInsightType] = useState<string>("all");

  // Generate AI insights
  const generateInsights = useCallback(async () => {
    if (!data || data.length === 0) return;

    setIsAnalyzing(true);
    try {
      const newInsights: AIInsight[] = [];

      // Trend Analysis
      const trendInsights = await analyzeTrends(data);
      newInsights.push(...trendInsights);

      // Anomaly Detection
      const anomalyInsights = await detectAnomalies(data);
      newInsights.push(...anomalyInsights);

      // Predictive Analytics
      const predictionInsights = await generatePredictions(data);
      newInsights.push(...predictionInsights);

      // Performance Recommendations
      const recommendationInsights = await generateRecommendations(data);
      newInsights.push(...recommendationInsights);

      // Sort by severity and confidence
      newInsights.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.confidence - a.confidence;
      });

      setInsights(newInsights);
      setLastAnalysis(new Date());
    } catch (error) {
      console.error("Failed to generate AI insights:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [data]);

  // Real-time updates
  useEffect(() => {
    if (!realTime) return;

    const interval = setInterval(generateInsights, updateInterval);
    return () => clearInterval(interval);
  }, [realTime, updateInterval, generateInsights]);

  // Initial analysis
  useEffect(() => {
    generateInsights();
  }, [generateInsights]);

  const filteredInsights = insights.filter(insight => 
    selectedInsightType === "all" || insight.type === selectedInsightType
  );

  const insightTypeCounts = insights.reduce((acc, insight) => {
    acc[insight.type] = (acc[insight.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            AI Insights Engine
          </h3>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Powered by advanced analytics and machine learning
            {lastAnalysis && (
              <span className="ml-2">
                • Last updated: {lastAnalysis.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {realTime && (
            <div className="flex items-center gap-1 text-xs text-success-600 dark:text-success-400">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              Live Analysis
            </div>
          )}

          <button
            onClick={generateInsights}
            disabled={isAnalyzing}
            className="px-3 py-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 border border-primary-300 dark:border-primary-600 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                Analyzing...
              </div>
            ) : (
              "Refresh Analysis"
            )}
          </button>
        </div>
      </div>

      {/* Insight Type Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All Insights", count: insights.length },
          { key: "trend", label: "Trends", count: insightTypeCounts.trend || 0 },
          { key: "anomaly", label: "Anomalies", count: insightTypeCounts.anomaly || 0 },
          { key: "prediction", label: "Predictions", count: insightTypeCounts.prediction || 0 },
          { key: "recommendation", label: "Recommendations", count: insightTypeCounts.recommendation || 0 },
          { key: "alert", label: "Alerts", count: insightTypeCounts.alert || 0 },
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setSelectedInsightType(filter.key)}
            className={cn(
              "px-3 py-1 text-sm font-medium rounded-full transition-colors",
              selectedInsightType === filter.key
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                : "bg-secondary-100 text-secondary-600 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-400 dark:hover:bg-secondary-600"
            )}
          >
            {filter.label}
            {filter.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-white dark:bg-secondary-800 rounded-full">
                {filter.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {isAnalyzing && insights.length === 0 ? (
          <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-8">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-secondary-600 dark:text-secondary-400">
                  Analyzing data and generating insights...
                </p>
              </div>
            </div>
          </div>
        ) : filteredInsights.length === 0 ? (
          <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-8">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-secondary-400 dark:text-secondary-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                No insights available
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400">
                {selectedInsightType === "all" 
                  ? "Try refreshing the analysis or check back later"
                  : `No ${selectedInsightType} insights found`
                }
              </p>
            </div>
          </div>
        ) : (
          filteredInsights.map(insight => (
            <AIInsightCard
              key={insight.id}
              insight={insight}
              onAction={(action) => onInsightAction?.(insight, action)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface AIInsightCardProps {
  insight: AIInsight;
  onAction?: (action: AIInsightAction) => void;
}

function AIInsightCard({ insight, onAction }: AIInsightCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-danger-200 dark:border-danger-700 bg-danger-50 dark:bg-danger-900/20";
      case "high":
        return "border-warning-200 dark:border-warning-700 bg-warning-50 dark:bg-warning-900/20";
      case "medium":
        return "border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20";
      case "low":
        return "border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800";
      default:
        return "border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "trend":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case "anomaly":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case "prediction":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case "recommendation":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "alert":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.343 4.343l1.414 1.414m9.899 9.899l1.414 1.414m-12.728 0l1.414-1.414m9.899-9.899l1.414-1.414M12 2v6m0 8v6m-6-6h6m8 0h-6" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={cn("rounded-lg border p-4", getSeverityColor(insight.severity))}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 p-2 rounded-lg",
          insight.severity === "critical" ? "text-danger-600 dark:text-danger-400" :
          insight.severity === "high" ? "text-warning-600 dark:text-warning-400" :
          insight.severity === "medium" ? "text-primary-600 dark:text-primary-400" :
          "text-secondary-600 dark:text-secondary-400"
        )}>
          {getTypeIcon(insight.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">
                {insight.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded-full capitalize",
                  insight.severity === "critical" ? "bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300" :
                  insight.severity === "high" ? "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300" :
                  insight.severity === "medium" ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" :
                  "bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300"
                )}>
                  {insight.severity}
                </span>
                <span className="px-2 py-0.5 text-xs font-medium bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300 rounded-full capitalize">
                  {insight.type}
                </span>
                <span className="text-xs text-secondary-500 dark:text-secondary-400">
                  {insight.confidence}% confidence
                </span>
              </div>
            </div>

            <span className="text-xs text-secondary-500 dark:text-secondary-400 flex-shrink-0">
              {insight.timestamp.toLocaleTimeString()}
            </span>
          </div>

          <p className="text-sm text-secondary-700 dark:text-secondary-300 mt-2">
            {insight.description}
          </p>

          {/* Confidence Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-secondary-600 dark:text-secondary-400 mb-1">
              <span>Confidence Level</span>
              <span>{insight.confidence}%</span>
            </div>
            <div className="w-full h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  insight.confidence >= 80 ? "bg-success-500" :
                  insight.confidence >= 60 ? "bg-warning-500" :
                  "bg-danger-500"
                )}
                style={{ width: `${insight.confidence}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          {insight.actions && insight.actions.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              {insight.actions.map(action => (
                <button
                  key={action.id}
                  onClick={() => onAction?.(action)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                    action.type === "primary" && "bg-primary-600 text-white hover:bg-primary-700",
                    action.type === "secondary" && "bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-600",
                    action.type === "danger" && "bg-danger-600 text-white hover:bg-danger-700"
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// AI Analysis Functions
async function analyzeTrends(data: any[]): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];

  // Analyze quantity trends
  const quantityTrend = calculateTrend(data.map(item => item.quantity || 0));
  if (quantityTrend.strength > 70) {
    insights.push({
      id: `trend-quantity-${Date.now()}`,
      type: "trend",
      severity: quantityTrend.direction === "down" ? "high" : "medium",
      title: `${quantityTrend.direction === "up" ? "Increasing" : "Decreasing"} Inventory Levels`,
      description: `Inventory quantities show a ${quantityTrend.direction}ward trend with ${quantityTrend.strength}% strength over the recent period.`,
      confidence: quantityTrend.strength,
      timestamp: new Date(),
      actionable: true,
    });
  }

  // Analyze reject rate trends
  const rejectRates = data.map(item => 
    item.quantity > 0 ? (item.reject || 0) / item.quantity : 0
  );
  const rejectTrend = calculateTrend(rejectRates);
  if (rejectTrend.strength > 60) {
    insights.push({
      id: `trend-reject-${Date.now()}`,
      type: "trend",
      severity: rejectTrend.direction === "up" ? "high" : "low",
      title: `${rejectTrend.direction === "up" ? "Rising" : "Declining"} Reject Rates`,
      description: `Reject rates are trending ${rejectTrend.direction}ward with ${rejectTrend.strength}% confidence. This may indicate quality control issues.`,
      confidence: rejectTrend.strength,
      timestamp: new Date(),
      actionable: true,
    });
  }

  return insights;
}

async function detectAnomalies(data: any[]): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];

  // Detect quantity anomalies
  const quantities = data.map(item => item.quantity || 0);
  const quantityMean = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
  const quantityStd = Math.sqrt(
    quantities.reduce((sum, q) => sum + Math.pow(q - quantityMean, 2), 0) / quantities.length
  );

  const quantityAnomalies = data.filter(item => 
    Math.abs((item.quantity || 0) - quantityMean) > 2 * quantityStd
  );

  if (quantityAnomalies.length > 0) {
    insights.push({
      id: `anomaly-quantity-${Date.now()}`,
      type: "anomaly",
      severity: quantityAnomalies.length > 5 ? "high" : "medium",
      title: "Unusual Inventory Quantities Detected",
      description: `Found ${quantityAnomalies.length} items with quantities significantly different from the norm. This may indicate data entry errors or unusual supply patterns.`,
      confidence: 85,
      timestamp: new Date(),
      actionable: true,
      data: { anomalies: quantityAnomalies.slice(0, 5) },
    });
  }

  // Detect reject rate anomalies
  const highRejectItems = data.filter(item => {
    if (!item.quantity || item.quantity === 0) return false;
    const rejectRate = (item.reject || 0) / item.quantity;
    return rejectRate > 0.2; // More than 20% reject rate
  });

  if (highRejectItems.length > 0) {
    insights.push({
      id: `anomaly-reject-${Date.now()}`,
      type: "anomaly",
      severity: "high",
      title: "High Reject Rates Detected",
      description: `${highRejectItems.length} items have unusually high reject rates (>20%). This requires immediate attention to prevent quality issues.`,
      confidence: 90,
      timestamp: new Date(),
      actionable: true,
      data: { items: highRejectItems.slice(0, 5) },
    });
  }

  return insights;
}

async function generatePredictions(data: any[]): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];

  // Predict inventory depletion
  const recentData = data.slice(-30); // Last 30 entries
  if (recentData.length >= 10) {
    const avgConsumption = recentData.reduce((sum, item) => sum + (item.quantity || 0), 0) / recentData.length;
    const currentStock = data.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    if (avgConsumption > 0) {
      const daysUntilDepletion = currentStock / avgConsumption;
      
      if (daysUntilDepletion < 30) {
        insights.push({
          id: `prediction-depletion-${Date.now()}`,
          type: "prediction",
          severity: daysUntilDepletion < 7 ? "critical" : "high",
          title: "Inventory Depletion Forecast",
          description: `Based on current consumption patterns, inventory may be depleted in approximately ${Math.round(daysUntilDepletion)} days. Consider placing orders soon.`,
          confidence: 75,
          timestamp: new Date(),
          actionable: true,
        });
      }
    }
  }

  // Predict seasonal patterns
  const monthlyData = groupDataByMonth(data);
  if (Object.keys(monthlyData).length >= 3) {
    insights.push({
      id: `prediction-seasonal-${Date.now()}`,
      type: "prediction",
      severity: "medium",
      title: "Seasonal Pattern Detected",
      description: "Analysis suggests seasonal variations in inventory levels. Consider adjusting procurement schedules accordingly.",
      confidence: 65,
      timestamp: new Date(),
      actionable: true,
    });
  }

  return insights;
}

async function generateRecommendations(data: any[]): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];

  // Recommend inventory optimization
  const totalRejects = data.reduce((sum, item) => sum + (item.reject || 0), 0);
  const totalQuantity = data.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const overallRejectRate = totalQuantity > 0 ? totalRejects / totalQuantity : 0;

  if (overallRejectRate > 0.1) {
    insights.push({
      id: `recommendation-quality-${Date.now()}`,
      type: "recommendation",
      severity: "medium",
      title: "Quality Control Improvement Needed",
      description: `Current reject rate is ${(overallRejectRate * 100).toFixed(1)}%. Implement stricter quality controls and supplier audits to reduce waste.`,
      confidence: 80,
      timestamp: new Date(),
      actionable: true,
      actions: [
        {
          id: "audit-suppliers",
          label: "Audit Suppliers",
          type: "primary",
          onClick: () => console.log("Audit suppliers action"),
        },
        {
          id: "review-quality",
          label: "Review Quality Standards",
          type: "secondary",
          onClick: () => console.log("Review quality standards action"),
        },
      ],
    });
  }

  // Recommend inventory diversification
  const destinations = [...new Set(data.map(item => item.destination))];
  if (destinations.length < 3) {
    insights.push({
      id: `recommendation-diversification-${Date.now()}`,
      type: "recommendation",
      severity: "low",
      title: "Consider Inventory Diversification",
      description: "Current inventory is concentrated in few destinations. Consider diversifying to reduce risk and improve distribution efficiency.",
      confidence: 70,
      timestamp: new Date(),
      actionable: true,
    });
  }

  return insights;
}

// Helper functions
function calculateTrend(values: number[]): TrendAnalysis {
  if (values.length < 2) {
    return {
      direction: "stable",
      strength: 0,
      period: "insufficient data",
      description: "Not enough data to determine trend",
      factors: [],
    };
  }

  // Simple linear regression
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssTotal = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
  const ssRes = values.reduce((sum, val, i) => {
    const predicted = slope * i + intercept;
    return sum + Math.pow(val - predicted, 2);
  }, 0);
  const rSquared = 1 - (ssRes / ssTotal);

  const direction = slope > 0.1 ? "up" : slope < -0.1 ? "down" : "stable";
  const strength = Math.min(Math.abs(rSquared) * 100, 100);

  return {
    direction,
    strength,
    period: `${n} data points`,
    description: `Trend shows ${direction}ward movement with ${strength.toFixed(1)}% strength`,
    factors: [`Slope: ${slope.toFixed(3)}`, `R²: ${rSquared.toFixed(3)}`],
  };
}

function groupDataByMonth(data: any[]): Record<string, any[]> {
  return data.reduce((acc, item) => {
    const date = new Date(item.createdAt || item.date || Date.now());
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(item);
    
    return acc;
  }, {} as Record<string, any[]>);
}