# AI Control Center Components

This directory contains operational dashboard components for the AI Control Center, providing real-time monitoring and management of AI models.

## Components

### 1. ModelStatusCard
Displays detailed status information for individual AI models.

**Props:**
- `model_id`: Unique identifier for the model
- `model_name`: Display name of the model
- `version`: Model version
- `status`: 'active' | 'inactive' | 'error'
- `health`: 'healthy' | 'warning' | 'critical'
- `avg_response_ms`: Average response time in milliseconds
- `error_rate`: Error rate (0-1)
- `avg_confidence`: Average confidence score (0-1)
- `last_call`: ISO timestamp of last API call
- `calls_today`: Number of calls made today
- `cost_today`: Cost incurred today

**Usage:**
```tsx
import { ModelStatusCard } from '@/components/ai-control';

<ModelStatusCard
  model_id="doc-classifier-v2"
  model_name="Document Classifier"
  version="2.1.0"
  status="active"
  health="healthy"
  avg_response_ms={120}
  error_rate={0.02}
  avg_confidence={0.87}
  last_call="2025-10-31T09:58:30Z"
  calls_today={1247}
  cost_today={2.45}
/>
```

### 2. ActivityMetrics
Shows cumulative statistics across different time periods (24h, 7d, 30d).

**Props:**
- `metrics_24h`: Metrics for last 24 hours
- `metrics_7d`: Metrics for last 7 days
- `metrics_30d`: Metrics for last 30 days

Each metric object contains:
- `total_calls`: Total number of API calls
- `successful_calls`: Number of successful calls
- `failed_calls`: Number of failed calls
- `avg_confidence`: Average confidence score
- `avg_response_time`: Average response time
- `total_cost`: Total cost
- `error_rate`: Error rate
- `change_percent`: Percentage change (optional)

**Usage:**
```tsx
import { ActivityMetrics } from '@/components/ai-control';

<ActivityMetrics
  metrics_24h={{
    total_calls: 5432,
    successful_calls: 5321,
    failed_calls: 111,
    avg_confidence: 0.84,
    avg_response_time: 145,
    total_cost: 12.45,
    error_rate: 0.02,
    change_percent: 12.3
  }}
  metrics_7d={{...}}
  metrics_30d={{...}}
/>
```

### 3. PerformanceCharts
Visualizes performance metrics using Recharts library.

**Props:**
- `responseTimeData`: Array of response time data points
- `confidenceData`: Array of confidence score data points
- `errorRateData`: Array of error rate data points
- `costTrendData`: Array of cost trend data points

Each data point contains:
- `timestamp`: ISO timestamp
- `response_time`: Response time in ms (optional)
- `confidence`: Confidence score (optional)
- `error_rate`: Error rate percentage (optional)
- `cost`: Cost in dollars (optional)

**Usage:**
```tsx
import { PerformanceCharts } from '@/components/ai-control';

<PerformanceCharts
  responseTimeData={[
    { timestamp: "2025-10-31T10:00:00Z", response_time: 120 },
    { timestamp: "2025-10-31T11:00:00Z", response_time: 135 }
  ]}
  confidenceData={[...]}
  errorRateData={[...]}
  costTrendData={[...]}
/>
```

### 4. LiveActivityFeed
Real-time stream of AI operations with filtering and export capabilities.

**Props:**
- `initialLogs`: Initial array of activity logs (optional)
- `maxEntries`: Maximum number of entries to display (default: 50)
- `autoScroll`: Enable auto-scroll to bottom (default: true)

**Usage:**
```tsx
import { LiveActivityFeed } from '@/components/ai-control';

<LiveActivityFeed
  initialLogs={[
    {
      id: "log-123",
      timestamp: "2025-10-31T10:05:00Z",
      model_name: "doc-classifier-v2",
      operation_type: "classify",
      confidence_score: 0.82,
      status: "success",
      execution_time: 145
    }
  ]}
  maxEntries={100}
  autoScroll={true}
/>
```

### 5. RateLimitIndicator
Displays API rate limits with progress bars and countdown timers.

**Props:**
- `rateLimits`: Array of rate limit data for each model

Each rate limit object contains:
- `model_name`: Name of the model
- `requests_per_minute`: { limit, used, remaining, reset_at }
- `requests_per_hour`: { limit, used, remaining, reset_at }
- `daily_quota`: { limit, used, remaining, reset_at }

**Usage:**
```tsx
import { RateLimitIndicator } from '@/components/ai-control';

<RateLimitIndicator
  rateLimits={[
    {
      model_name: "doc-classifier-v2",
      requests_per_minute: {
        limit: 60,
        used: 45,
        remaining: 15,
        reset_at: "2025-10-31T10:01:00Z"
      },
      requests_per_hour: {
        limit: 3000,
        used: 1247,
        remaining: 1753,
        reset_at: "2025-10-31T11:00:00Z"
      },
      daily_quota: {
        limit: 50000,
        used: 12450,
        remaining: 37550,
        reset_at: "2025-11-01T00:00:00Z"
      }
    }
  ]}
/>
```

### 6. QuickStatsCards
Grid of key metric cards with trend indicators.

**Props:**
- `systemHealth`: System health percentage (0-100)
- `throughput24h`: Number of API calls in last 24 hours
- `avgConfidence`: Average confidence score (0-1)
- `costToday`: Cost incurred today
- `activeModels`: Number of active models
- `errorRate`: Error rate (0-1)
- `avgResponseTime`: Average response time in ms
- `successRate`: Success rate (0-1)

**Usage:**
```tsx
import { QuickStatsCards } from '@/components/ai-control';

<QuickStatsCards
  systemHealth={98}
  throughput24h={5432}
  avgConfidence={0.84}
  costToday={12.45}
  activeModels={5}
  errorRate={0.03}
  avgResponseTime={145}
  successRate={0.97}
/>
```

## Complete Dashboard Example

```tsx
'use client';

import { useEffect, useState } from 'react';
import {
  QuickStatsCards,
  ModelStatusCard,
  ActivityMetrics,
  PerformanceCharts,
  LiveActivityFeed,
  RateLimitIndicator
} from '@/components/ai-control';

export default function AIControlDashboard() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [rateLimits, setRateLimits] = useState([]);

  useEffect(() => {
    // Fetch data from API
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const statusRes = await fetch('/api/ai-control/status');
    const statusData = await statusRes.json();
    setSystemStatus(statusData);

    // Fetch other data...
  };

  if (!systemStatus) return <div>Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      {/* Quick Stats */}
      <QuickStatsCards
        systemHealth={98}
        throughput24h={systemStatus.aggregates.total_calls_24h}
        avgConfidence={systemStatus.aggregates.avg_confidence}
        costToday={systemStatus.aggregates.total_cost_today}
        activeModels={systemStatus.aggregates.active_models}
        errorRate={systemStatus.aggregates.error_rate}
        avgResponseTime={145}
        successRate={0.97}
      />

      {/* Model Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {systemStatus.models.map(model => (
          <ModelStatusCard key={model.model_id} {...model} />
        ))}
      </div>

      {/* Activity Metrics */}
      <ActivityMetrics
        metrics_24h={metrics?.metrics_24h}
        metrics_7d={metrics?.metrics_7d}
        metrics_30d={metrics?.metrics_30d}
      />

      {/* Performance Charts */}
      <PerformanceCharts
        responseTimeData={chartData?.responseTime || []}
        confidenceData={chartData?.confidence || []}
        errorRateData={chartData?.errorRate || []}
        costTrendData={chartData?.cost || []}
      />

      {/* Live Activity and Rate Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveActivityFeed />
        <RateLimitIndicator rateLimits={rateLimits} />
      </div>
    </div>
  );
}
```

## Features

- **Real-time Updates**: Components support live data updates via WebSocket or polling
- **Responsive Design**: All components are fully responsive and mobile-friendly
- **Dark Mode**: Full dark mode support with proper color schemes
- **Accessibility**: WCAG AA compliant with proper ARIA labels
- **Performance**: Optimized rendering with React best practices
- **Type Safety**: Full TypeScript support with proper type definitions

## Requirements

These components satisfy the following requirements from the specification:
- 23.2: Real-time model status monitoring
- 23.3: Cumulative activity statistics
- 23.4: Performance visualization with charts
- 23.5: Live activity stream
- 23.6: Rate limit monitoring with countdowns
- 23.7: Quick stats display
- 23.8: Health indicators and alerts
