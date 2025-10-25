"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";

export interface AIInsight {
  findings: string[];
  alerts: string[];
  recommendations: string[];
  predictions: string[];
}

export interface AIInsightsPanelProps {
  insights: AIInsight | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onAskQuestion?: (question: string) => void;
  className?: string;
}

export function AIInsightsPanel({
  insights,
  loading,
  error,
  onRefresh,
  onAskQuestion,
  className,
}: AIInsightsPanelProps) {
  const [question, setQuestion] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);

  const handleAskQuestion = async () => {
    if (!question.trim() || !onAskQuestion) return;
    
    setIsAskingQuestion(true);
    try {
      await onAskQuestion(question);
      setQuestion("");
    } finally {
      setIsAskingQuestion(false);
    }
  };

  return (
    <div className={cn("bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            AI-Powered Insights
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          isLoading={loading}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-secondary-200 dark:border-secondary-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-secondary-600 dark:text-secondary-400 text-sm">
            Analyzing inventory data with AI...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-danger-800 dark:text-danger-200 mb-1">
                Failed to generate insights
              </h4>
              <p className="text-sm text-danger-700 dark:text-danger-300">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {insights && !loading && !error && (
        <div className="space-y-6">
          {/* Findings */}
          {insights.findings && insights.findings.length > 0 && (
            <InsightSection
              title="Key Findings"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              items={insights.findings}
              variant="primary"
            />
          )}

          {/* Alerts */}
          {insights.alerts && insights.alerts.length > 0 && (
            <InsightSection
              title="Alerts"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
              items={insights.alerts}
              variant="warning"
            />
          )}

          {/* Recommendations */}
          {insights.recommendations && insights.recommendations.length > 0 && (
            <InsightSection
              title="Recommendations"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              }
              items={insights.recommendations}
              variant="success"
            />
          )}

          {/* Predictions */}
          {insights.predictions && insights.predictions.length > 0 && (
            <InsightSection
              title="Predictions"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              items={insights.predictions}
              variant="secondary"
            />
          )}

          {/* Follow-up Question Input */}
          {onAskQuestion && (
            <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Ask a follow-up question
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAskQuestion();
                    }
                  }}
                  placeholder="e.g., What items should we restock?"
                  className="flex-1 px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isAskingQuestion}
                />
                <Button
                  onClick={handleAskQuestion}
                  disabled={!question.trim() || isAskingQuestion}
                  isLoading={isAskingQuestion}
                >
                  Ask
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {!insights && !loading && !error && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-secondary-400 dark:text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-secondary-600 dark:text-secondary-400 mb-4">
            Click refresh to generate AI insights
          </p>
        </div>
      )}
    </div>
  );
}

interface InsightSectionProps {
  title: string;
  icon: React.ReactNode;
  items: string[];
  variant: "primary" | "warning" | "success" | "secondary";
}

function InsightSection({ title, icon, items, variant }: InsightSectionProps) {
  const variantStyles = {
    primary: "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300",
    warning: "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800 text-warning-700 dark:text-warning-300",
    success: "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800 text-success-700 dark:text-success-300",
    secondary: "bg-secondary-50 dark:bg-secondary-900/20 border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300",
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("p-1.5 rounded-lg", variantStyles[variant])}>
          {icon}
        </div>
        <h4 className="font-semibold text-secondary-900 dark:text-secondary-100">
          {title}
        </h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-secondary-700 dark:text-secondary-300">
            <span className="text-primary-500 dark:text-primary-400 mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
