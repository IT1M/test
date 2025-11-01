# AI Alert Manager - Comprehensive Documentation

## Overview

The AI Alert Manager is a comprehensive notification and alert system designed for the AI Control Center. It provides real-time alert generation, intelligent notification routing, alert lifecycle management, and advanced analytics.

## Features

### 1. Real-time Alert Generation
- Automatic alert creation based on configurable rules
- Support for multiple alert types (model failure, high error rate, budget exceeded, etc.)
- Severity levels: low, medium, high, critical
- Contextual metadata and affected operations tracking

### 2. Configurable Alert Channels
- **In-app notifications**: Real-time browser notifications
- **Email**: Integration-ready for email services (SendGrid, AWS SES)
- **SMS**: Integration-ready for SMS services (Twilio, AWS SNS)
- **Webhook**: Custom webhook integration for external systems

### 3. Alert Rule Configuration
- Visual rule builder UI
- Condition types:
  - **Threshold**: Numeric comparisons (>, <, >=, <=, =, between)
  - **Pattern**: Regular expression matching
  - **Anomaly**: ML-based anomaly detection
  - **Custom**: JavaScript expressions for complex logic
- Dynamic message templates with variable interpolation
- Multi-channel notification support per rule

### 4. Alert Aggregation (Notification Fatigue Prevention)
- Configurable aggregation windows (default: 5 minutes)
- Maximum alerts per window (default: 3)
- Intelligent grouping of similar alerts
- Prevents notification spam during incidents

### 5. Alert Lifecycle Management
- **Active**: Newly created alerts requiring attention
- **Acknowledged**: User has seen the alert
- **Resolved**: Issue has been fixed
- **Snoozed**: Temporarily hidden with automatic re-activation

### 6. Alert Snoozing
- Snooze alerts for custom durations (15m, 30m, 1h, 4h, 24h)
- Automatic re-activation when snooze period expires
- Background monitoring for snoozed alerts

### 7. Alert Analytics Dashboard
- Total alerts, active alerts, resolved alerts
- Average resolution time (ART)
- Mean Time To Resolution (MTTR)
- Alerts by type, severity, and model
- Resolution trends over time
- Top triggering alert rules

### 8. Alert History & Audit Trail
- Complete history of all alerts
- Acknowledgment and resolution tracking
- User attribution for all actions
- Integration with AI Activity Logger

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Alert Manager                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Alert Rules  │  │ Alert Engine │  │ Notification │      │
│  │   Manager    │→ │  Evaluator   │→ │   Router     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                  ↓              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Condition   │  │ Aggregation  │  │   Channel    │      │
│  │   Builder    │  │    Engine    │  │  Handlers    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                     Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  aiAlerts    │  │aiAlertRules  │  │ Activity Log │      │
│  │   (Dexie)    │  │   (Dexie)    │  │   (Dexie)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Usage Examples

### Creating Alerts Programmatically

```typescript
import { AlertManager, alertHelpers } from '@/services/ai/alert-manager';

// Using helper functions
await alertHelpers.modelFailure(
  'doc-classifier-v2',
  'Connection timeout',
  ['classify-document-123', 'classify-document-124']
);

await alertHelpers.highErrorRate(
  'ocr-extractor',
  0.35, // 35% error rate
  0.20  // 20% threshold
);

await alertHelpers.budgetExceeded(
  'Monthly AI Budget',
  1250.00, // current spend
  1000.00  // budget limit
);

// Using the main API
await AlertManager.createAlert({
  alertType: 'performance-degradation',
  severity: 'high',
  title: 'Slow Response Time',
  message: 'Model response time exceeded 2000ms',
  modelName: 'medical-nlp',
  notificationChannels: ['in-app', 'email'],
  metadata: {
    responseTime: 2150,
    threshold: 2000,
  },
});
```

### Creating Alert Rules

```typescript
import { AlertManager } from '@/services/ai/alert-manager';

await AlertManager.createAlertRule({
  ruleName: 'High Error Rate Alert',
  description: 'Trigger when error rate exceeds 20%',
  conditionType: 'threshold',
  condition: {
    type: 'threshold',
    field: 'errorRate',
    operator: 'gt',
    value: 0.20,
  },
  alertType: 'high-error-rate',
  severity: 'high',
  messageTemplate: 'Error rate is {{errorRate}}% for model {{modelName}}',
  notificationChannels: ['in-app', 'email'],
  aggregationWindow: 5, // 5 minutes
  maxAlertsPerWindow: 3,
  escalationEnabled: true,
  escalationDelay: 30, // 30 minutes
});
```

### Evaluating Alert Rules

```typescript
import { AlertManager } from '@/services/ai/alert-manager';

// Evaluate rules against current context
await AlertManager.evaluateAlertRules({
  modelName: 'doc-classifier-v2',
  operationType: 'classify',
  errorRate: 0.25, // 25% error rate
  responseTime: 1500,
  confidenceScore: 0.65,
  cost: 0.05,
});
```

### Managing Alerts

```typescript
import { AlertManager } from '@/services/ai/alert-manager';

// Get active alerts
const activeAlerts = await AlertManager.getActiveAlerts({
  severity: 'critical',
  modelName: 'doc-classifier-v2',
});

// Acknowledge an alert
await AlertManager.acknowledgeAlert(
  'alert-123',
  'user-456',
  'John Doe'
);

// Snooze an alert for 30 minutes
await AlertManager.snoozeAlert(
  'alert-123',
  'user-456',
  'John Doe',
  30
);

// Resolve an alert
await AlertManager.resolveAlert(
  'alert-123',
  'user-456',
  'John Doe',
  'Fixed by restarting the model service'
);
```

### Getting Alert Analytics

```typescript
import { AlertManager } from '@/services/ai/alert-manager';

const analytics = await AlertManager.getAlertAnalytics({
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31'),
});

console.log('Total Alerts:', analytics.totalAlerts);
console.log('Active Alerts:', analytics.activeAlerts);
console.log('MTTR:', analytics.mttr, 'minutes');
console.log('Alerts by Type:', analytics.alertsByType);
console.log('Alerts by Severity:', analytics.alertsBySeverity);
```

## Alert Types

| Type | Description | Default Severity |
|------|-------------|------------------|
| `model-failure` | Model is completely unavailable | critical |
| `high-error-rate` | Error rate exceeds threshold | high |
| `budget-exceeded` | Cost budget has been exceeded | critical |
| `security-incident` | Security-related issue detected | critical |
| `performance-degradation` | Response time exceeds threshold | medium |
| `rate-limit-warning` | Approaching API rate limits | medium |
| `anomaly-detected` | Unusual pattern detected | medium |
| `other` | Custom alert type | varies |

## Severity Levels

| Severity | Color | Auto-Dismiss | Escalation |
|----------|-------|--------------|------------|
| `low` | Blue | 3 seconds | No |
| `medium` | Yellow | 5 seconds | Optional |
| `high` | Orange | 7 seconds | Yes |
| `critical` | Red | Never | Yes |

## Notification Channels

### In-App Notifications
- Real-time browser notifications using Zustand store
- Priority-based display order
- Auto-dismiss based on severity
- Action buttons for quick resolution

### Email Notifications
- Integration-ready with placeholder
- Supports HTML templates
- Batch sending for aggregated alerts
- Unsubscribe management

### SMS Notifications
- Integration-ready with placeholder
- Character limit optimization
- Emergency-only by default
- Rate limiting to prevent spam

### Webhook Notifications
- POST request to configured endpoint
- JSON payload with full alert details
- Retry logic with exponential backoff
- Signature verification support

## Alert Aggregation

Alert aggregation prevents notification fatigue by grouping similar alerts:

```typescript
// Configuration
{
  aggregationWindow: 5,      // minutes
  maxAlertsPerWindow: 3,     // maximum alerts
}

// Behavior
// Time 0:00 - Alert 1 sent ✓
// Time 0:01 - Alert 2 sent ✓
// Time 0:02 - Alert 3 sent ✓
// Time 0:03 - Alert 4 aggregated (not sent)
// Time 0:04 - Alert 5 aggregated (not sent)
// Time 0:05 - Window resets, Alert 6 sent ✓
```

## Best Practices

### 1. Alert Rule Design
- Use descriptive rule names
- Set appropriate severity levels
- Include context in message templates
- Enable aggregation for high-frequency alerts
- Test rules before activating

### 2. Notification Channel Selection
- Use in-app for all alerts
- Reserve email for high/critical alerts
- Use SMS only for critical incidents
- Configure webhooks for external integrations

### 3. Alert Management
- Acknowledge alerts promptly
- Add resolution notes for future reference
- Use snooze for temporary issues
- Review alert analytics regularly

### 4. Performance Optimization
- Set reasonable aggregation windows
- Limit notification channels per rule
- Clean up old resolved alerts periodically
- Monitor alert rule trigger counts

## Integration with Other Services

### AI Activity Logger
All alert actions are logged to the AI Activity Logger for audit purposes:
- Alert creation
- Alert acknowledgment
- Alert resolution
- Alert snoozing

### Security Audit Logger
Critical alerts trigger security audit log entries:
- Security incidents
- Budget exceeded
- Model failures

### Notification Store
In-app notifications are managed through the Zustand notification store:
- Priority-based queuing
- Auto-dismiss timers
- Action button support

## Maintenance

### Cleanup Old Alerts
```typescript
// Clean up resolved alerts older than 90 days
const deletedCount = await AlertManager.cleanupOldAlerts(90);
console.log(`Deleted ${deletedCount} old alerts`);
```

### Check Snoozed Alerts
```typescript
// Manually check for snoozed alerts that need reactivation
await AlertManager.checkSnoozedAlerts();
```

### Initialize on App Startup
```typescript
// In your app initialization
await AlertManager.initialize();
```

## Troubleshooting

### Alerts Not Triggering
1. Check if alert rule is active
2. Verify condition logic
3. Review aggregation settings
4. Check alert rule trigger count

### Notifications Not Appearing
1. Verify notification channels are enabled
2. Check browser notification permissions
3. Review notification store state
4. Check for JavaScript errors in console

### High Alert Volume
1. Review alert rule conditions
2. Increase aggregation window
3. Reduce max alerts per window
4. Consider disabling noisy rules

## API Reference

See the TypeScript definitions in `services/ai/alert-manager.ts` for complete API documentation.

## Future Enhancements

- [ ] Machine learning-based anomaly detection
- [ ] Alert correlation and root cause analysis
- [ ] Custom notification templates
- [ ] Alert scheduling (quiet hours)
- [ ] Mobile push notifications
- [ ] Slack/Teams integration
- [ ] Alert playbooks and runbooks
- [ ] SLA tracking and reporting

## Support

For issues or questions, please refer to the main AI Control Center documentation or contact the development team.
