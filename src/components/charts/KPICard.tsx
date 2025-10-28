"use client";

import { ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface KPICardProps {
  title: string;
  value: number | string;
  trend?: {
    direction: "up" | "down" | "neutral";
    percentage: number;
  } | null;
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
  sparklineData?: number[];
}

export function KPICard({
  title,
  value,
  trend,
  icon,
  onClick,
  className,
  sparklineData,
}: KPICardProps) {
  const isClickable = !!onClick;

  const getTrendColor = () => {
    if (!trend) return "";
    
    // For reject rate, down is good (green), up is bad (red)
    if (title.toLowerCase().includes("reject")) {
      if (trend.direction === "down") return "text-success-600 dark:text-success-400";
      if (trend.direction === "up") return "text-danger-600 dark:text-danger-400";
    } else {
      // For other metrics, up is good (green), down is bad (red)
      if (trend.direction === "up") return "text-success-600 dark:text-success-400";
      if (trend.direction === "down") return "text-danger-600 dark:text-danger-400";
    }
    
    return "text-secondary-500 dark:text-secondary-400";
  };

  const getTrendIcon = () => {
    if (!trend || trend.direction === "neutral") {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      );
    }

    if (trend.direction === "up") {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6 transition-all",
        isClickable && "cursor-pointer hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600",
        className
      )}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          
          {trend && (
            <div className={cn("flex items-center gap-1 mt-2 text-sm font-medium", getTrendColor())}>
              {getTrendIcon()}
              <span>
                {Math.abs(trend.percentage).toFixed(1)}%
              </span>
              <span className="text-secondary-500 dark:text-secondary-400 font-normal">
                vs previous period
              </span>
            </div>
          )}
        </div>

        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
              {icon}
            </div>
          </div>
        )}
      </div>

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-4">
          <MiniSparkline data={sparklineData} />
        </div>
      )}
    </div>
  );
}

interface MiniSparklineProps {
  data: number[];
}

function MiniSparkline({ data }: MiniSparklineProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  // Determine color based on trend
  const firstValue = data[0];
  const lastValue = data[data.length - 1];
  const isPositive = lastValue >= firstValue;
  const strokeColor = isPositive 
    ? "stroke-success-500 dark:stroke-success-400" 
    : "stroke-danger-500 dark:stroke-danger-400";

  return (
    <svg
      className="w-full h-12"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        className={cn("stroke-2", strokeColor)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
