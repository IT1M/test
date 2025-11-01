# AI Control Center Integration Guide

## Overview

This document describes how the AI Control Center is integrated with all AI services in the Medical Products Company Management System. The integration provides comprehensive monitoring, control, and governance over all AI operations.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   AI Control Center                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Activity   │  │    Alert     │  │     PHI      │     │
│  │   Logger     │  │   Manager    │  │   Detector   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     Cost     │  │  Performance │  │     Rate     │     │
│  │   Tracking   │  │   Metrics    │  │   Limiter    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Gemini AI Client                            │
│  • Automatic activity logging                                │
│  • PHI/PII sanitization                                      │
│  • Cost calculation                                          │
│  • Performance monitoring                                    │
│  • Automation triggers                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              All AI Services (Forecasting,                   │
│         Pricing, Medical Analysis, OCR, etc.)                │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Activity Logging

Every AI operation is automatically logged with:
- **Input/Output Data**: Sanitized for PHI/PII
- **Token Usage**: Input and output token counts
- **Execution Time**: Performance metrics
- **Cost**: Estimated cost per operation
- **Status**: Success, error, timeout, rate-limited
- **Confidence Score**: Model confidence (when available)
- **Metadata**: Additional context and parameters

### 2. PHI/PII Sanitization

All data sent to AI models is automatically scanned and sanitized:
- **Email addresses** → `[EMAIL_REDACTED]`
- **Phone numbers** → `[PHONE_REDACTED]`
- **National IDs** → `[ID_REDACTED]`
- **Medical record numbers** → `[MRN_REDACTED]`
- **Credit card numbers** → `[CARD_REDACTED]`
- **IP addresses** → `[IP_REDACTED]`

### 3. Rate Limiting

Configurable rate limiting prevents API quota exhaustion:
- Default: 60 requests per minute
- Token bucket algorithm with automatic refill
- Queue-based request handling
- Configurable via AI Control Center

### 4. Cost Tracking

Real-time cost monitoring and budgeting:
- Per-operation cost calculation
- Monthly cost aggregation
- Budget alerts and limits
- Cost breakdown by model and operation type

### 5. Performance Monitoring

Comprehensive performance metrics:
- Response time tracking
- Error rate monitoring
- Confidence score analysis
- Anomaly detection

### 6. Automation & Alerts

Intelligent alert system with automation rules:
- **Model Failure Alerts**: Automatic detection and notification
- **High Error Rate Alerts**: Threshold-based monitoring
- **Cost Spike Alerts**: Budget overrun warnings
- **Performance Degradation**: Response time alerts
- **Custom Rules**: User-defined alert conditions

## Configuration

### AI Control Center Configuration

The `AIControlConfigManager` provides centralized configuration:

```typescript
import { AIControlConfigManager } from '@/services/ai/ai-control-config';

// Load configuration
const config = await AIControlConfigManager.loadConfig();

// Update settings
await AIControlConfigManager.updateSetting('rateLimitPerMinute', 100);

// Check if feature is enabled
const loggingEnabled = AIControlConfigManager.isFeatureEnabled('enableActivityLogging');

// Get cost settings
const costSettings = AIControlConfigManager.getCostSettings();

// Check monthly cost limit
const costStatus = await AIControlConfigManager.checkCostLimit();
if (costStatus.exceeded) {
  console.warn(`Monthly cost limit exceeded: $${costStatus.currentCost}`);
}
```

### Configuration Options

```typescript
interface AIControlConfig {
  // Activity Logging
  enableActivityLogging: boolean;
  logRetentionDays: number;
  
  // PHI/PII Protection
  enablePHISanitization: boolean;
  autoRedactPHI: boolean;
  
  // Rate Limiting
  rateLimitPerMinute: number;
  enableRateLimiting: boolean;
  
  // Cost Tracking
  enableCostTracking: boolean;
  costPerInputToken: number;
  costPerOutputToken: number;
  monthlyCostLimit?: number;
  
  // Performance Monitoring
  enablePerformanceMetrics: boolean;
  performanceThresholds: {
    maxResponseTime: number;
    minConfidenceScore: number;
    maxErrorRate: number;
  };
  
  // Automation & Alerts
  enableAutomationTriggers: boolean;
  enableAlerts: boolean;
  alertChannels: Array<'in-app' | 'email' | 'sms' | 'webhook'>;
  
  // Caching
  enableCaching: boolean;
  cacheDuration: number;
  
  // Retry Logic
  enableRetry: boolean;
  maxRetries: number;
}
```

## Usage Examples

### Basic AI Operation with Full Integration

```typescript
import { getGeminiService } from '@/services/gemini/client';

const gemini = getGeminiService();

// All AI Control Center features are automatically applied
const result = await gemini.generateContent(
  'Analyze this medical report...',
  true, // use cache
  'user-123' // user ID for logging
);

// Behind the scenes:
// 1. PHI/PII is detected and sanitized
// 2. Rate limiting is applied
// 3. Operation is logged to AIActivityLog
// 4. Cost is calculated and tracked
// 5. Performance metrics are collected
// 6. Automation rules are evaluated
// 7. Alerts are triggered if thresholds are exceeded
```

### Querying Activity Logs

```typescript
import { AIActivityLogger } from '@/services/ai';

// Get recent activity
const logs = await AIActivityLogger.getActivityLogs({
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
  modelName: 'gemini-2.0-flash-exp',
  status: 'success',
  limit: 100,
});

// Get analytics
const analytics = await AIActivityLogger.getActivityAnalytics({
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
});

console.log(`Total operations: ${analytics.totalOperations}`);
console.log(`Success rate: ${analytics.successRate.toFixed(2)}%`);
console.log(`Average confidence: ${analytics.averageConfidence.toFixed(2)}`);
console.log(`Total cost: $${analytics.totalCost.toFixed(2)}`);

// Detect anomalies
const anomalies = await AIActivityLogger.detectAnomalousActivity(24);
anomalies.forEach(anomaly => {
  console.warn(`${anomaly.type}: ${anomaly.description}`);
  console.warn(`Recommendation: ${anomaly.recommendation}`);
});
```

### Managing Alerts

```typescript
import { AlertManager } from '@/services/ai';

// Get active alerts
const activeAlerts = await AlertManager.getActiveAlerts({
  severity: 'critical',
});

// Acknowledge an alert
await AlertManager.acknowledgeAlert(
  alertId,
  'user-123',
  'John Doe'
);

// Resolve an alert
await AlertManager.resolveAlert(
  alertId,
  'user-123',
  'John Doe',
  'Fixed by restarting the service'
);

// Create custom alert rule
await AlertManager.createAlertRule({
  ruleName: 'High Response Time',
  description: 'Alert when response time exceeds 10 seconds',
  conditionType: 'threshold',
  condition: {
    type: 'threshold',
    field: 'responseTime',
    operator: 'gt',
    value: 10000,
  },
  alertType: 'performance-degradation',
  severity: 'high',
  messageTemplate: 'Response time is {{responseTime}}ms (threshold: 10000ms)',
  notificationChannels: ['in-app', 'email'],
});
```

### Data Retention and Archival

```typescript
import { DataRetentionService } from '@/services/ai';

// Execute retention policy
const result = await DataRetentionService.executeRetentionPolicy({
  id: 'policy-1',
  name: 'Standard Retention',
  retentionDays: 90,
  archiveBeforeDelete: true,
  compressionEnabled: true,
  enabled: true,
  executionSchedule: 'daily',
});

console.log(`Archived: ${result.archivedLogs} logs`);
console.log(`Deleted: ${result.deletedLogs} logs`);
console.log(`Archive size: ${(result.archiveSize / 1024 / 1024).toFixed(2)} MB`);

// Run integrity check
const integrityCheck = await DataRetentionService.runIntegrityCheck();
if (integrityCheck.corruptedLogs > 0) {
  console.error(`Found ${integrityCheck.corruptedLogs} corrupted logs`);
  integrityCheck.issues.forEach(issue => {
    console.error(`${issue.logId}: ${issue.issue} (${issue.severity})`);
  });
}
```

## Integration with Existing Services

All existing AI services automatically benefit from AI Control Center integration:

### Forecasting Service
```typescript
import { ForecastingService } from '@/services/gemini/forecasting';

// All operations are automatically logged and monitored
const forecast = await ForecastingService.forecastDemand(productId, 30);
```

### Medical Analysis Service
```typescript
import { MedicalAnalysisService } from '@/services/gemini/medical';

// PHI is automatically sanitized before sending to AI
const analysis = await MedicalAnalysisService.analyzeMedicalReport(reportText);
```

### OCR Service
```typescript
import { OCRService } from '@/services/gemini/ocr';

// Image analysis is logged with cost tracking
const extracted = await OCRService.processDocument(imageData, 'invoice');
```

## Monitoring Dashboard

The AI Control Center provides a comprehensive dashboard at `/ai-control-center` with:

1. **Overview**: Real-time metrics and status
2. **Activity Logs**: Searchable, filterable log viewer
3. **Alerts**: Active alerts and alert history
4. **Cost Analytics**: Cost breakdown and trends
5. **Performance**: Response time and error rate charts
6. **Security**: PHI detection and audit logs
7. **Settings**: Configuration management

## Best Practices

### 1. Always Provide User Context
```typescript
// Good
await gemini.generateContent(prompt, true, userId);

// Bad
await gemini.generateContent(prompt); // Uses 'system' as default
```

### 2. Monitor Cost Regularly
```typescript
// Check cost before expensive operations
const costStatus = await AIControlConfigManager.checkCostLimit();
if (costStatus.exceeded) {
  throw new Error('Monthly cost limit exceeded');
}
```

### 3. Review Anomalies Daily
```typescript
// Schedule daily anomaly detection
const anomalies = await AIActivityLogger.detectAnomalousActivity(24);
if (anomalies.length > 0) {
  // Send notification to admin
}
```

### 4. Configure Appropriate Thresholds
```typescript
// Set realistic performance thresholds
await AIControlConfigManager.updateSetting('performanceThresholds', {
  maxResponseTime: 30000, // 30 seconds
  minConfidenceScore: 50,
  maxErrorRate: 10, // 10%
});
```

### 5. Use Alert Rules for Proactive Monitoring
```typescript
// Create alert rules for critical scenarios
await AlertManager.createAlertRule({
  ruleName: 'Daily Cost Spike',
  conditionType: 'threshold',
  condition: {
    type: 'threshold',
    field: 'cost',
    operator: 'gt',
    value: 100, // $100 per day
  },
  alertType: 'cost-spike',
  severity: 'high',
  messageTemplate: 'Daily cost exceeded $100: ${{cost}}',
  notificationChannels: ['in-app', 'email'],
});
```

## Troubleshooting

### High Error Rate
1. Check alert logs for specific error messages
2. Review recent configuration changes
3. Verify API key validity
4. Check rate limiting settings

### Cost Overruns
1. Review cost analytics dashboard
2. Identify high-cost operations
3. Enable caching for repeated queries
4. Optimize prompts to reduce token usage

### Performance Issues
1. Check response time metrics
2. Review rate limiting configuration
3. Enable caching
4. Consider upgrading API tier

### PHI Leakage Concerns
1. Review security audit logs
2. Verify PHI sanitization is enabled
3. Check for false negatives in detection
4. Update PHI patterns if needed

## API Reference

See individual service documentation:
- [AIActivityLogger](./activity-logger.ts)
- [AlertManager](./alert-manager.ts)
- [PHIPIIDetector](./phi-pii-detector.ts)
- [DataRetentionService](./data-retention.ts)
- [AIControlConfigManager](./ai-control-config.ts)

## Support

For issues or questions:
1. Check the AI Control Center diagnostics page
2. Review activity logs for error details
3. Consult this integration guide
4. Contact system administrator
