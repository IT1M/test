# AI Services

This directory contains services for AI operations management, monitoring, and logging.

## AIActivityLogger

Comprehensive logging and monitoring service for all AI operations in the system.

### Features

- **Automatic PHI/PII Sanitization**: Removes sensitive information before logging
- **Advanced Filtering**: Filter logs by date, model, user, confidence, and more
- **Multiple Export Formats**: Export to CSV, JSON, or Excel
- **Analytics & Insights**: Aggregated statistics and trend analysis
- **Anomaly Detection**: Automatic detection of suspicious patterns
- **Retention Policies**: Automatic archival and deletion of old logs

### Usage

#### Logging an AI Operation

```typescript
import { AIActivityLogger } from '@/services/ai';

const logId = await AIActivityLogger.logAIOperation({
  userId: 'user-123',
  modelName: 'gemini-pro',
  operationType: 'search',
  inputData: { query: 'search term' },
  outputData: { results: [...] },
  confidenceScore: 85,
  executionTime: 1500,
  status: 'success',
  entityType: 'product',
  entityId: 'prod-456',
});
```

#### Retrieving Logs with Filters

```typescript
const logs = await AIActivityLogger.getActivityLogs({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  modelName: 'gemini-pro',
  userId: 'user-123',
  operationType: 'search',
  status: 'success',
  minConfidence: 70,
  limit: 100,
  offset: 0,
});
```

#### Exporting Logs

```typescript
// Export to CSV
const csv = await AIActivityLogger.exportActivityLogs(
  { startDate: new Date('2024-01-01') },
  'csv'
);

// Export to JSON
const json = await AIActivityLogger.exportActivityLogs({}, 'json');

// Export to Excel
const excelBlob = await AIActivityLogger.exportActivityLogs({}, 'excel');
```

#### Getting Analytics

```typescript
const analytics = await AIActivityLogger.getActivityAnalytics({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
});

console.log('Total Operations:', analytics.totalOperations);
console.log('Success Rate:', analytics.successRate);
console.log('Average Confidence:', analytics.averageConfidence);
console.log('Total Cost:', analytics.totalCost);
```

#### Detecting Anomalies

```typescript
const anomalies = await AIActivityLogger.detectAnomalousActivity(24); // Last 24 hours

anomalies.forEach(anomaly => {
  console.log(`${anomaly.severity}: ${anomaly.description}`);
  console.log(`Recommendation: ${anomaly.recommendation}`);
});
```

#### Applying Retention Policy

```typescript
const result = await AIActivityLogger.applyRetentionPolicy({
  retentionDays: 90,
  archiveBeforeDelete: true,
  applyToOperationTypes: ['search', 'analysis'],
});

console.log(`Archived: ${result.archived}, Deleted: ${result.deleted}`);
```

### PHI/PII Sanitization

The service automatically sanitizes the following sensitive information:

- Email addresses → `[EMAIL_REDACTED]`
- Phone numbers → `[PHONE_REDACTED]`
- Social Security Numbers → `[SSN_REDACTED]`
- National IDs → `[ID_REDACTED]`
- Credit card numbers → `[CARD_REDACTED]`
- IP addresses → `[IP_REDACTED]`
- Medical record numbers → `[MRN_REDACTED]`

### Anomaly Detection

The service detects the following anomalies:

1. **Repeated Low Confidence**: Multiple operations with confidence < 50%
2. **High Error Rate**: Error rate > 20%
3. **Unusual Patterns**: Same operation repeated > 50 times in short period
4. **Cost Spikes**: Average cost per operation > $0.10
5. **Suspicious Input**: Input data size > 50KB

### Analytics Metrics

The analytics service provides:

- Total operations count
- Success rate percentage
- Average confidence score
- Average execution time
- Total estimated cost
- Operations by type breakdown
- Operations by model breakdown
- Error rate and top errors
- Peak usage hours
- Confidence distribution (high/medium/low)

### Best Practices

1. **Always log AI operations**: Call `logAIOperation()` after every AI interaction
2. **Use appropriate operation types**: Choose the correct operation type for better analytics
3. **Include entity context**: Provide `entityType` and `entityId` for better traceability
4. **Monitor anomalies regularly**: Check for anomalies daily to catch issues early
5. **Apply retention policies**: Set up automatic retention to manage storage
6. **Export for compliance**: Regularly export logs for audit and compliance purposes

### Integration Example

```typescript
// In your AI service
import { AIActivityLogger } from '@/services/ai';

async function performAIOperation(input: any) {
  const startTime = Date.now();
  let status: 'success' | 'error' = 'success';
  let output: any;
  let error: string | undefined;

  try {
    output = await geminiService.generateContent(input);
  } catch (err) {
    status = 'error';
    error = err.message;
    throw err;
  } finally {
    const executionTime = Date.now() - startTime;
    
    await AIActivityLogger.logAIOperation({
      userId: getCurrentUserId(),
      modelName: 'gemini-pro',
      operationType: 'analysis',
      inputData: input,
      outputData: output || {},
      executionTime,
      status,
      errorMessage: error,
    });
  }

  return output;
}
```

## Requirements Mapping

This service implements the following requirements:

- **23.9**: Maintain searchable audit log (AIActivityLog table)
- **23.10**: Advanced search and filtering capabilities
- **23.11**: Display audit log entries in paginated table
- **23.12**: Detailed view modal for each log entry
- **23.13**: Export functionality (CSV, JSON, Excel)
- **23.14**: Audit log analytics
- **23.15**: Automatic flagging of suspicious activities
