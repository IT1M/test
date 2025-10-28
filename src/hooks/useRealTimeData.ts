"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export interface UseRealTimeDataOptions<T> {
  fetchData: () => Promise<T>;
  interval?: number; // in milliseconds
  enabled?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => void;
}

export interface UseRealTimeDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
}

export function useRealTimeData<T>({
  fetchData,
  interval = 30000, // 30 seconds default
  enabled = true,
  onError,
  onSuccess,
}: UseRealTimeDataOptions<T>): UseRealTimeDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setIsRefreshing(true);
      setError(null);
      
      const result = await fetchData();
      
      if (mountedRef.current) {
        setData(result);
        setLastUpdated(new Date());
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [fetchData, onError, onSuccess]);

  // Initial data fetch
  useEffect(() => {
    if (enabled) {
      refresh();
    }
  }, [enabled, refresh]);

  // Set up interval for real-time updates
  useEffect(() => {
    if (!enabled || interval <= 0) return;

    intervalRef.current = setInterval(refresh, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, refresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    isRefreshing,
  };
}

// Hook specifically for KPI data
export interface KPIData {
  totalItems: { value: number; trend: number | null };
  totalQuantity: { value: number; trend: number | null };
  rejectRate: { value: number; trend: number | null };
  activeUsers: { value: number; trend: number | null };
}

export function useKPIData(options?: {
  dateFrom?: string;
  dateTo?: string;
  interval?: number;
  enabled?: boolean;
}) {
  const fetchKPIData = useCallback(async (): Promise<KPIData> => {
    const params = new URLSearchParams();
    if (options?.dateFrom) params.set("dateFrom", options.dateFrom);
    if (options?.dateTo) params.set("dateTo", options.dateTo);
    
    const response = await fetch(`/api/analytics/summary?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch KPI data: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || "Failed to fetch KPI data");
    }
    
    return result.data.kpis;
  }, [options?.dateFrom, options?.dateTo]);

  return useRealTimeData({
    fetchData: fetchKPIData,
    interval: options?.interval,
    enabled: options?.enabled,
  });
}

// Hook for sparkline data
export interface SparklineData {
  [key: string]: number[];
}

export function useSparklineData(options?: {
  days?: number;
  interval?: number;
  enabled?: boolean;
}) {
  const fetchSparklineData = useCallback(async (): Promise<SparklineData> => {
    const days = options?.days || 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const params = new URLSearchParams({
      dateFrom: startDate.toISOString().split('T')[0],
      dateTo: endDate.toISOString().split('T')[0],
    });
    
    const response = await fetch(`/api/analytics/trends?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sparkline data: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || "Failed to fetch sparkline data");
    }
    
    // Transform the data into sparkline format
    const sparklineData: SparklineData = {
      totalItems: [],
      totalQuantity: [],
      rejectRate: [],
    };
    
    if (result.data && Array.isArray(result.data)) {
      result.data.forEach((item: any) => {
        sparklineData.totalItems.push(item.itemCount || 0);
        sparklineData.totalQuantity.push(item.totalQuantity || 0);
        sparklineData.rejectRate.push(item.rejectRate || 0);
      });
    }
    
    return sparklineData;
  }, [options?.days]);

  return useRealTimeData({
    fetchData: fetchSparklineData,
    interval: options?.interval || 60000, // 1 minute for sparkline data
    enabled: options?.enabled,
  });
}