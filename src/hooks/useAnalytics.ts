'use client';

import { useQuery } from '@tanstack/react-query';

interface AnalyticsSummaryParams {
  dateFrom?: string;
  dateTo?: string;
}

interface AnalyticsTrendsParams extends AnalyticsSummaryParams {
  groupBy?: 'day' | 'week' | 'month';
}

/**
 * Hook to fetch analytics summary with automatic caching
 */
export function useAnalyticsSummary(params: AnalyticsSummaryParams = {}) {
  return useQuery({
    queryKey: ['analytics', 'summary', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.set('dateTo', params.dateTo);

      const response = await fetch(`/api/analytics/summary?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics summary');
      }
      return response.json();
    },
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch analytics trends with automatic caching
 */
export function useAnalyticsTrends(params: AnalyticsTrendsParams = {}) {
  return useQuery({
    queryKey: ['analytics', 'trends', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.set('dateTo', params.dateTo);
      if (params.groupBy) searchParams.set('groupBy', params.groupBy);

      const response = await fetch(`/api/analytics/trends?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics trends');
      }
      return response.json();
    },
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch AI insights with automatic caching
 */
export function useAIInsights(params: AnalyticsSummaryParams & { query?: string } = {}) {
  return useQuery({
    queryKey: ['analytics', 'ai-insights', params],
    queryFn: async () => {
      const response = await fetch('/api/analytics/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch AI insights');
      }
      return response.json();
    },
    // Cache for 30 minutes (AI responses are expensive)
    staleTime: 30 * 60 * 1000,
    // Don't automatically refetch
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
