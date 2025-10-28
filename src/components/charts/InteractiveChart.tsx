"use client";

import { ReactNode, useState, useRef, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
  ReferenceArea,
  ScatterChart,
  Scatter,
  ComposedChart,
} from "recharts";
import { cn } from "@/utils/cn";

export interface ChartData {
  [key: string]: any;
}

export interface ChartCustomization {
  colors?: string[];
  animations?: boolean;
  zoom?: boolean;
  brush?: boolean;
  crossfilter?: boolean;
  grid?: boolean;
  legend?: boolean;
  tooltip?: boolean;
  responsive?: boolean;
}

export interface InteractiveChartProps {
  data: ChartData[];
  type: "line" | "bar" | "area" | "pie" | "scatter" | "composed";
  dataKeys: string[];
  xAxisKey?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  height?: number;
  interactive?: boolean;
  realTime?: boolean;
  exportable?: boolean;
  aiInsights?: boolean;
  customizations?: ChartCustomization;
  onDataPointClick?: (data: any, index: number) => void;
  onExport?: (format: "png" | "svg" | "pdf") => void;
  onZoom?: (domain: [number, number]) => void;
  loading?: boolean;
  error?: string;
}

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
];

export function InteractiveChart({
  data,
  type,
  dataKeys,
  xAxisKey = "name",
  title,
  subtitle,
  className,
  height = 400,
  interactive = true,
  realTime = false,
  exportable = true,
  aiInsights = false,
  customizations = {},
  onDataPointClick,
  onExport,
  onZoom,
  loading = false,
  error,
}: InteractiveChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);

  const {
    colors = DEFAULT_COLORS,
    animations = true,
    zoom = interactive,
    brush = interactive && type !== "pie",
    crossfilter = interactive,
    grid = true,
    legend = true,
    tooltip = true,
    responsive = true,
  } = customizations;

  const handleDataPointClick = useCallback((data: any, index: number) => {
    setSelectedData(data);
    onDataPointClick?.(data, index);
  }, [onDataPointClick]);

  const handleZoom = useCallback((domain: [number, number]) => {
    setZoomDomain(domain);
    onZoom?.(domain);
  }, [onZoom]);

  const handleBrushChange = useCallback((domain: any) => {
    if (domain && domain.startIndex !== undefined && domain.endIndex !== undefined) {
      const newDomain: [number, number] = [domain.startIndex, domain.endIndex];
      setBrushDomain(newDomain);
      handleZoom(newDomain);
    }
  }, [handleZoom]);

  const exportChart = useCallback((format: "png" | "svg" | "pdf") => {
    if (!chartRef.current) return;
    
    // Implementation would depend on the export library
    // For now, we'll just call the callback
    onExport?.(format);
  }, [onExport]);

  const resetZoom = useCallback(() => {
    setZoomDomain(null);
    setBrushDomain(null);
  }, []);

  if (loading) {
    return (
      <div className={cn("bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-secondary-500 dark:text-secondary-400">
            <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            Loading chart data...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-danger-200 dark:border-danger-700 p-6", className)}>
        <div className="flex items-center justify-center h-64 text-danger-600 dark:text-danger-400">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">Failed to load chart</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={cn("bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6", className)}>
        <ChartHeader
          title={title}
          subtitle={subtitle}
          exportable={exportable}
          onExport={exportChart}
          realTime={realTime}
        />
        <div className="flex items-center justify-center h-64 text-secondary-500 dark:text-secondary-400">
          No data available
        </div>
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data: zoomDomain ? data.slice(zoomDomain[0], zoomDomain[1] + 1) : data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case "line":
        return (
          <LineChart {...commonProps}>
            {grid && <CartesianGrid strokeDasharray="3 3" className="stroke-secondary-200 dark:stroke-secondary-700" />}
            <XAxis
              dataKey={xAxisKey}
              className="text-xs text-secondary-600 dark:text-secondary-400"
              tick={{ fill: "currentColor" }}
            />
            <YAxis
              className="text-xs text-secondary-600 dark:text-secondary-400"
              tick={{ fill: "currentColor" }}
            />
            {tooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--toast-bg)",
                  border: "1px solid var(--toast-border)",
                  borderRadius: "0.5rem",
                  color: "var(--toast-color)",
                }}
              />
            )}
            {legend && <Legend />}
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[index % colors.length], r: 4 }}
                activeDot={{ r: 6, onClick: handleDataPointClick }}
                animationDuration={animations ? 1000 : 0}
              />
            ))}
            {brush && (
              <Brush
                dataKey={xAxisKey}
                height={30}
                stroke={colors[0]}
                onChange={handleBrushChange}
              />
            )}
          </LineChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            {grid && <CartesianGrid strokeDasharray="3 3" className="stroke-secondary-200 dark:stroke-secondary-700" />}
            <XAxis
              dataKey={xAxisKey}
              className="text-xs text-secondary-600 dark:text-secondary-400"
              tick={{ fill: "currentColor" }}
            />
            <YAxis
              className="text-xs text-secondary-600 dark:text-secondary-400"
              tick={{ fill: "currentColor" }}
            />
            {tooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--toast-bg)",
                  border: "1px solid var(--toast-border)",
                  borderRadius: "0.5rem",
                  color: "var(--toast-color)",
                }}
              />
            )}
            {legend && <Legend />}
            {dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                onClick={handleDataPointClick}
                animationDuration={animations ? 1000 : 0}
              />
            ))}
            {brush && (
              <Brush
                dataKey={xAxisKey}
                height={30}
                stroke={colors[0]}
                onChange={handleBrushChange}
              />
            )}
          </BarChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            {grid && <CartesianGrid strokeDasharray="3 3" className="stroke-secondary-200 dark:stroke-secondary-700" />}
            <XAxis
              dataKey={xAxisKey}
              className="text-xs text-secondary-600 dark:text-secondary-400"
              tick={{ fill: "currentColor" }}
            />
            <YAxis
              className="text-xs text-secondary-600 dark:text-secondary-400"
              tick={{ fill: "currentColor" }}
            />
            {tooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--toast-bg)",
                  border: "1px solid var(--toast-border)",
                  borderRadius: "0.5rem",
                  color: "var(--toast-color)",
                }}
              />
            )}
            {legend && <Legend />}
            {dataKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
                onClick={handleDataPointClick}
                animationDuration={animations ? 1000 : 0}
              />
            ))}
            {brush && (
              <Brush
                dataKey={xAxisKey}
                height={30}
                stroke={colors[0]}
                onChange={handleBrushChange}
              />
            )}
          </AreaChart>
        );

      case "pie":
        return (
          <PieChart {...commonProps}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey={dataKeys[0]}
              onClick={handleDataPointClick}
              animationDuration={animations ? 1000 : 0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {tooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--toast-bg)",
                  border: "1px solid var(--toast-border)",
                  borderRadius: "0.5rem",
                  color: "var(--toast-color)",
                }}
              />
            )}
            {legend && <Legend />}
          </PieChart>
        );

      case "scatter":
        return (
          <ScatterChart {...commonProps}>
            {grid && <CartesianGrid strokeDasharray="3 3" className="stroke-secondary-200 dark:stroke-secondary-700" />}
            <XAxis
              dataKey={xAxisKey}
              className="text-xs text-secondary-600 dark:text-secondary-400"
              tick={{ fill: "currentColor" }}
            />
            <YAxis
              className="text-xs text-secondary-600 dark:text-secondary-400"
              tick={{ fill: "currentColor" }}
            />
            {tooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--toast-bg)",
                  border: "1px solid var(--toast-border)",
                  borderRadius: "0.5rem",
                  color: "var(--toast-color)",
                }}
              />
            )}
            {legend && <Legend />}
            {dataKeys.map((key, index) => (
              <Scatter
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                onClick={handleDataPointClick}
              />
            ))}
          </ScatterChart>
        );

      case "composed":
        return (
          <ComposedChart {...commonProps}>
            {grid && <CartesianGrid strokeDasharray="3 3" className="stroke-secondary-200 dark:stroke-secondary-700" />}
            <XAxis
              dataKey={xAxisKey}
              className="text-xs text-secondary-600 dark:text-secondary-400"
              tick={{ fill: "currentColor" }}
            />
            <YAxis
              className="text-xs text-secondary-600 dark:text-secondary-400"
              tick={{ fill: "currentColor" }}
            />
            {tooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--toast-bg)",
                  border: "1px solid var(--toast-border)",
                  borderRadius: "0.5rem",
                  color: "var(--toast-color)",
                }}
              />
            )}
            {legend && <Legend />}
            {dataKeys.slice(0, Math.ceil(dataKeys.length / 2)).map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                onClick={handleDataPointClick}
              />
            ))}
            {dataKeys.slice(Math.ceil(dataKeys.length / 2)).map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[(index + Math.ceil(dataKeys.length / 2)) % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[(index + Math.ceil(dataKeys.length / 2)) % colors.length] }}
              />
            ))}
            {brush && (
              <Brush
                dataKey={xAxisKey}
                height={30}
                stroke={colors[0]}
                onChange={handleBrushChange}
              />
            )}
          </ComposedChart>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={chartRef}
      className={cn("bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6", className)}
    >
      <ChartHeader
        title={title}
        subtitle={subtitle}
        exportable={exportable}
        onExport={exportChart}
        realTime={realTime}
        zoomActive={!!zoomDomain}
        onResetZoom={resetZoom}
      />

      <div style={{ height }}>
        {responsive ? (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        ) : (
          renderChart()
        )}
      </div>

      {selectedData && (
        <div className="mt-4 p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
          <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2">
            Selected Data Point
          </h4>
          <div className="text-xs text-secondary-600 dark:text-secondary-400">
            {Object.entries(selectedData).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="capitalize">{key}:</span>
                <span className="font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {aiInsights && (
        <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-700">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
              AI Insights
            </span>
          </div>
          <p className="text-xs text-primary-700 dark:text-primary-300">
            AI-powered insights will be displayed here based on the chart data patterns.
          </p>
        </div>
      )}
    </div>
  );
}

interface ChartHeaderProps {
  title?: string;
  subtitle?: string;
  exportable?: boolean;
  onExport?: (format: "png" | "svg" | "pdf") => void;
  realTime?: boolean;
  zoomActive?: boolean;
  onResetZoom?: () => void;
}

function ChartHeader({
  title,
  subtitle,
  exportable,
  onExport,
  realTime,
  zoomActive,
  onResetZoom,
}: ChartHeaderProps) {
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  if (!title && !exportable && !realTime) return null;

  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        {title && (
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {realTime && (
          <div className="flex items-center gap-1 text-xs text-success-600 dark:text-success-400">
            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
            Live
          </div>
        )}

        {zoomActive && onResetZoom && (
          <button
            onClick={onResetZoom}
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            Reset Zoom
          </button>
        )}

        {exportable && onExport && (
          <div className="relative">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1"
            >
              Export
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                <button
                  onClick={() => {
                    onExport("png");
                    setExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 first:rounded-t-lg"
                >
                  PNG Image
                </button>
                <button
                  onClick={() => {
                    onExport("svg");
                    setExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700"
                >
                  SVG Vector
                </button>
                <button
                  onClick={() => {
                    onExport("pdf");
                    setExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 last:rounded-b-lg"
                >
                  PDF Document
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}