"use client";

import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/utils/cn";

export interface TrendData {
  direction: "up" | "down" | "neutral";
  percentage: number;
  period: string;
  isGood?: boolean; // For context-aware coloring
}

export interface KPICardProps {
  title: string;
  value: number | string;
  trend?: TrendData | null;
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
  sparklineData?: number[];
  loading?: boolean;
  error?: string;
  formatter?: (value: number) => string;
  subtitle?: string;
  actions?: ActionButton[];
  realTimeUpdate?: boolean;
  updateInterval?: number; // in milliseconds
  onRefresh?: () => Promise<void>;
}

export interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost";
  icon?: ReactNode;
}

export function KPICard({
  title,
  value,
  trend,
  icon,
  onClick,
  className,
  sparklineData,
  loading = false,
  error,
  formatter,
  subtitle,
  actions,
  realTimeUpdate = false,
  updateInterval = 30000, // 30 seconds default
  onRefresh,
}: KPICardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const isClickable = !!onClick;

  // Real-time update effect
  useEffect(() => {
    if (!realTimeUpdate || !onRefresh) return;

    const interval = setInterval(async () => {
      try {
        setIsRefreshing(true);
        await onRefresh();
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to refresh KPI data:", error);
      } finally {
        setIsRefreshing(false);
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [realTimeUpdate, onRefresh, updateInterval]);

  const getTrendColor = () => {
    if (!trend) return "";
    
    // Use explicit isGood flag if provided
    if (trend.isGood !== undefined) {
      if (trend.isGood) return "text-success-600 dark:text-success-400";
      return "text-danger-600 dark:text-danger-400";
    }
    
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

  const formatValue = (val: number | string) => {
    if (typeof val === "string") return val;
    if (formatter) return formatter(val);
    return val.toLocaleString();
  };

  const handleManualRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      await onRefresh();
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to refresh KPI data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (error) {
    return (
      <div className={cn(
        "bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-danger-200 dark:border-danger-700 p-6",
        className
      )}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
            {title}
          </p>
          <div className="w-12 h-12 rounded-lg bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center text-danger-600 dark:text-danger-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>
        {onRefresh && (
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50"
          >
            {isRefreshing ? "Retrying..." : "Retry"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6 transition-all relative",
        isClickable && "cursor-pointer hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600",
        loading && "opacity-75",
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
      {/* Loading indicator */}
      {(loading || isRefreshing) && (
        <div className="absolute top-2 right-2">
          <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Real-time indicator */}
      {realTimeUpdate && (
        <div className="absolute top-2 left-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isRefreshing ? "bg-warning-500 animate-pulse" : "bg-success-500"
          )}></div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
              {title}
            </p>
            {onRefresh && !realTimeUpdate && (
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="text-xs text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 disabled:opacity-50"
                title="Refresh data"
              >
                <svg className={cn("w-3 h-3", isRefreshing && "animate-spin")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
          
          {subtitle && (
            <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-2">
              {subtitle}
            </p>
          )}
          
          <p className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            {loading ? "..." : formatValue(value)}
          </p>
          
          {trend && !loading && (
            <div className={cn("flex items-center gap-1 mt-2 text-sm font-medium", getTrendColor())}>
              {getTrendIcon()}
              <span>
                {Math.abs(trend.percentage).toFixed(1)}%
              </span>
              <span className="text-secondary-500 dark:text-secondary-400 font-normal">
                {trend.period || "vs previous period"}
              </span>
            </div>
          )}

          {realTimeUpdate && (
            <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
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

      {sparklineData && sparklineData.length > 0 && !loading && (
        <div className="mt-4">
          <MiniSparkline data={sparklineData} />
        </div>
      )}

      {/* Action buttons */}
      {actions && actions.length > 0 && (
        <div className="mt-4 flex gap-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                action.variant === "primary" && "bg-primary-600 text-white hover:bg-primary-700",
                action.variant === "secondary" && "bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-600",
                (!action.variant || action.variant === "ghost") && "text-secondary-600 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-700"
              )}
            >
              {action.icon && <span className="mr-1">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface MiniSparklineProps {
  data: number[];
  height?: number;
  showArea?: boolean;
  color?: "primary" | "success" | "danger" | "warning";
}

function MiniSparkline({ data, height = 48, showArea = false, color }: MiniSparklineProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  // Determine color based on trend or explicit color
  let strokeColor = "stroke-primary-500 dark:stroke-primary-400";
  let fillColor = "fill-primary-100 dark:fill-primary-900/30";
  
  if (color) {
    switch (color) {
      case "success":
        strokeColor = "stroke-success-500 dark:stroke-success-400";
        fillColor = "fill-success-100 dark:fill-success-900/30";
        break;
      case "danger":
        strokeColor = "stroke-danger-500 dark:stroke-danger-400";
        fillColor = "fill-danger-100 dark:fill-danger-900/30";
        break;
      case "warning":
        strokeColor = "stroke-warning-500 dark:stroke-warning-400";
        fillColor = "fill-warning-100 dark:fill-warning-900/30";
        break;
    }
  } else {
    // Auto-determine color based on trend
    const firstValue = data[0];
    const lastValue = data[data.length - 1];
    const isPositive = lastValue >= firstValue;
    strokeColor = isPositive 
      ? "stroke-success-500 dark:stroke-success-400" 
      : "stroke-danger-500 dark:stroke-danger-400";
    fillColor = isPositive
      ? "fill-success-100 dark:fill-success-900/30"
      : "fill-danger-100 dark:fill-danger-900/30";
  }

  // Create area path for filled sparkline
  const areaPoints = showArea ? `0,100 ${points} 100,100` : points;

  return (
    <div className="relative">
      <svg
        className="w-full"
        style={{ height }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {showArea && (
          <polygon
            points={areaPoints}
            className={cn("opacity-30", fillColor)}
          />
        )}
        <polyline
          points={points}
          fill="none"
          className={cn("stroke-2", strokeColor)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Add dots for data points on hover */}
        {data.map((value, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((value - min) / range) * 100;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="1.5"
              className={cn("opacity-0 hover:opacity-100 transition-opacity", strokeColor.replace('stroke-', 'fill-'))}
            />
          );
        })}
      </svg>
      
      {/* Tooltip on hover */}
      <div className="absolute inset-0 flex items-end justify-between px-1 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-xs text-secondary-500 dark:text-secondary-400">
          {data[0]?.toLocaleString()}
        </span>
        <span className="text-xs text-secondary-500 dark:text-secondary-400">
          {data[data.length - 1]?.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
