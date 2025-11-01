# Integration Example: AIActivityLogger with Gemini Service

## How to Integrate AIActivityLogger with Existing Services

### Example 1: Update Gemini Client to Log Operations

```typescript
// services/gemini/client.ts
import { AIActivityLogger } from '@/services/ai';

export class GeminiService {
  // ... existing code ...

  async generateContent(prompt: string, useCache: boolean = true): Promise<string> {
    const startTime = Date.now();
    let status: 'success' | 'error' | 'timeout' | 'rate-limited' = 'success';
    let result = '';
    let errorMessage: string | undefined;
    let errorCode: string | undefined;

    try {
      // Check cache first
      if (useCache) {
        const cached = this.getFromCache(prompt);
        if (cached !== null) {
          await this.logAPICall('generateContent', 'cache_hit', prompt.length, cached.length);
          
          // Log to AIActivityLogger
          await AIActivityLogger.logAIOperation({
            userId: 'system', // Replace with actual user ID
            modelName: 'gemini-pro',
            operationType: 'other',
            inputData: { prompt: prompt.substring(0, 1000) }, // Truncate for storage
            outputData: { result: cached.substring(0, 1000) },
            executionTime: Date.now() - startTime,
            status: 'success',
            metadata: { cached: true },
          });
          
          return cached;
        }
      }

      // Rate limiting
      await this.rateLimiter.acquire();

      result = await this.retryWithBackoff(async () => {
        const response = await this.model.generateContent(prompt);
        return response.response.text();
      });

      // Cache the response
      if (useCache) {
        this.setCache(prompt, result);
      }

      // Log successful API call
      await this.logAPICall('generateContent', 'success', prompt.length, result.length);

    } catch (error: any) {
      status = 'error';
      errorMessage = error.message;
      errorCode = error.code;
      
      await this.logError('generateContent', error as Error, { prompt: prompt.substring(0, 100) });
      throw error;
      
    } finally {
      const executionTime = Date.now() - startTime;
      
      // Log to AIActivityLogger
      await AIActivityLogger.logAIOperation({
        userId: 'system', // Replace with actual user ID from context
        modelName: 'gemini-pro',
        operationType: 'other',
        inputData: { prompt: prompt.substring(0, 1000) },
        outputData: { result: result.substring(0, 1000) },
        executionTime,
        status,
        errorMessage,
        errorCode,
        estimatedCost: this.estimateCost(prompt.length, result.length),
      });
    }

    return result;
  }

  private estimateCost(inputLength: number, outputLength: number): number {
    // Rough estimation: $0.00025 per 1K characters
    const totalChars = inputLength + outputLength;
    return (totalChars / 1000) * 0.00025;
  }
}
```

### Example 2: Forecasting Service Integration

```typescript
// services/gemini/forecasting.ts
import { AIActivityLogger } from '@/services/ai';

export class ForecastingService {
  async forecastDemand(productId: string): Promise<DemandForecast> {
    const startTime = Date.now();
    const userId = getCurrentUserId(); // Get from auth context
    
    try {
      // ... existing forecasting logic ...
      const forecast = await this.generateForecast(productId);
      
      // Log the operation
      await AIActivityLogger.logAIOperation({
        userId,
        modelName: 'gemini-pro',
        operationType: 'forecast',
        operationDescription: 'Product demand forecasting',
        inputData: { productId },
        outputData: { forecast },
        confidenceScore: forecast.confidence,
        executionTime: Date.now() - startTime,
        status: 'success',
        entityType: 'product',
        entityId: productId,
        estimatedCost: 0.001, // Estimated cost
      });
      
      return forecast;
      
    } catch (error: any) {
      // Log the error
      await AIActivityLogger.logAIOperation({
        userId,
        modelName: 'gemini-pro',
        operationType: 'forecast',
        operationDescription: 'Product demand forecasting',
        inputData: { productId },
        outputData: {},
        executionTime: Date.now() - startTime,
        status: 'error',
        errorMessage: error.message,
        entityType: 'product',
        entityId: productId,
      });
      
      throw error;
    }
  }
}
```

### Example 3: Medical Analysis Service Integration

```typescript
// services/gemini/medical.ts
import { AIActivityLogger } from '@/services/ai';

export class MedicalAnalysisService {
  async analyzeMedicalReport(reportText: string, patientId: string): Promise<MedicalAnalysis> {
    const startTime = Date.now();
    const userId = getCurrentUserId();
    
    try {
      const analysis = await this.performAnalysis(reportText);
      
      // Log with PHI sanitization (automatic)
      await AIActivityLogger.logAIOperation({
        userId,
        modelName: 'gemini-pro',
        operationType: 'medical-analysis',
        operationDescription: 'Medical report analysis',
        inputData: { 
          reportText, // Will be automatically sanitized
          patientId 
        },
        outputData: { analysis },
        confidenceScore: analysis.confidence,
        executionTime: Date.now() - startTime,
        status: 'success',
        entityType: 'patient',
        entityId: patientId,
        metadata: {
          reportLength: reportText.length,
          diagnosisCount: analysis.diagnosis ? 1 : 0,
        },
      });
      
      return analysis;
      
    } catch (error: any) {
      await AIActivityLogger.logAIOperation({
        userId,
        modelName: 'gemini-pro',
        operationType: 'medical-analysis',
        inputData: { patientId },
        outputData: {},
        executionTime: Date.now() - startTime,
        status: 'error',
        errorMessage: error.message,
        entityType: 'patient',
        entityId: patientId,
      });
      
      throw error;
    }
  }
}
```

### Example 4: Search Service Integration

```typescript
// services/gemini/search.ts
import { AIActivityLogger } from '@/services/ai';

export class SearchService {
  async performNaturalLanguageSearch(query: string): Promise<SearchResults> {
    const startTime = Date.now();
    const userId = getCurrentUserId();
    
    try {
      const results = await this.search(query);
      
      await AIActivityLogger.logAIOperation({
        userId,
        modelName: 'gemini-pro',
        operationType: 'search',
        operationDescription: 'Natural language search',
        inputData: { query },
        outputData: { 
          resultCount: results.length,
          topResults: results.slice(0, 5).map(r => r.id),
        },
        confidenceScore: this.calculateAverageConfidence(results),
        executionTime: Date.now() - startTime,
        status: 'success',
        metadata: {
          queryLength: query.length,
          resultCount: results.length,
        },
      });
      
      return results;
      
    } catch (error: any) {
      await AIActivityLogger.logAIOperation({
        userId,
        modelName: 'gemini-pro',
        operationType: 'search',
        inputData: { query },
        outputData: {},
        executionTime: Date.now() - startTime,
        status: 'error',
        errorMessage: error.message,
      });
      
      throw error;
    }
  }
}
```

### Example 5: Monitoring Dashboard Component

```typescript
// components/admin/AIActivityMonitor.tsx
'use client';

import { useEffect, useState } from 'react';
import { AIActivityLogger, ActivityAnalytics } from '@/services/ai';

export function AIActivityMonitor() {
  const [analytics, setAnalytics] = useState<ActivityAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await AIActivityLogger.getActivityAnalytics({
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      });
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!analytics) return <div>No data available</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="stat-card">
        <h3>Total Operations</h3>
        <p className="text-3xl">{analytics.totalOperations}</p>
      </div>
      
      <div className="stat-card">
        <h3>Success Rate</h3>
        <p className="text-3xl">{analytics.successRate.toFixed(1)}%</p>
      </div>
      
      <div className="stat-card">
        <h3>Avg Confidence</h3>
        <p className="text-3xl">{analytics.averageConfidence.toFixed(1)}</p>
      </div>
      
      <div className="stat-card">
        <h3>Total Cost</h3>
        <p className="text-3xl">${analytics.totalCost.toFixed(2)}</p>
      </div>
    </div>
  );
}
```

### Example 6: Anomaly Alert Component

```typescript
// components/admin/AnomalyAlerts.tsx
'use client';

import { useEffect, useState } from 'react';
import { AIActivityLogger, AnomalousActivity } from '@/services/ai';

export function AnomalyAlerts() {
  const [anomalies, setAnomalies] = useState<AnomalousActivity[]>([]);

  useEffect(() => {
    checkAnomalies();
    
    // Check every 5 minutes
    const interval = setInterval(checkAnomalies, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkAnomalies = async () => {
    try {
      const detected = await AIActivityLogger.detectAnomalousActivity(24);
      setAnomalies(detected);
    } catch (error) {
      console.error('Failed to check anomalies:', error);
    }
  };

  if (anomalies.length === 0) {
    return <div className="text-green-600">No anomalies detected</div>;
  }

  return (
    <div className="space-y-4">
      {anomalies.map(anomaly => (
        <div 
          key={anomaly.id}
          className={`alert alert-${anomaly.severity}`}
        >
          <h4>{anomaly.type.replace(/_/g, ' ').toUpperCase()}</h4>
          <p>{anomaly.description}</p>
          <p className="text-sm text-gray-600">
            Recommendation: {anomaly.recommendation}
          </p>
        </div>
      ))}
    </div>
  );
}
```

### Example 7: Export Functionality

```typescript
// components/admin/ExportLogs.tsx
'use client';

import { AIActivityLogger } from '@/services/ai';

export function ExportLogs() {
  const handleExport = async (format: 'csv' | 'json' | 'excel') => {
    try {
      const data = await AIActivityLogger.exportActivityLogs(
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
        format
      );

      // Create download
      let blob: Blob;
      let filename: string;

      if (format === 'excel') {
        blob = data as Blob;
        filename = `ai-activity-logs-${new Date().toISOString()}.xlsx`;
      } else {
        blob = new Blob([data as string], { 
          type: format === 'csv' ? 'text/csv' : 'application/json' 
        });
        filename = `ai-activity-logs-${new Date().toISOString()}.${format}`;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="flex gap-2">
      <button onClick={() => handleExport('csv')}>Export CSV</button>
      <button onClick={() => handleExport('json')}>Export JSON</button>
      <button onClick={() => handleExport('excel')}>Export Excel</button>
    </div>
  );
}
```

## Best Practices for Integration

1. **Always wrap AI calls in try-catch**: Ensure logging happens even on errors
2. **Use finally blocks**: Log in finally to guarantee execution
3. **Truncate large inputs**: Store only first 1000 chars to save space
4. **Include entity context**: Always provide entityType and entityId when available
5. **Estimate costs**: Calculate and log estimated costs for budget tracking
6. **Use appropriate operation types**: Choose the correct type for better analytics
7. **Add metadata**: Include relevant context in metadata field
8. **Get user from context**: Always use actual user ID, not 'system'
9. **Handle async logging**: Don't block main flow if logging fails
10. **Monitor regularly**: Set up dashboards to monitor AI operations

## Testing Integration

```typescript
// __tests__/ai-integration.test.ts
import { AIActivityLogger } from '@/services/ai';

describe('AI Integration', () => {
  it('should log operations correctly', async () => {
    const logId = await AIActivityLogger.logAIOperation({
      userId: 'test-user',
      modelName: 'gemini-pro',
      operationType: 'search',
      inputData: { query: 'test' },
      outputData: { results: [] },
      executionTime: 100,
      status: 'success',
    });

    expect(logId).toBeDefined();

    const logs = await AIActivityLogger.getActivityLogs({ limit: 1 });
    expect(logs[0].id).toBe(logId);
  });
});
```
