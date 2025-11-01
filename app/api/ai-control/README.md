# AI Control Center API Documentation

This directory contains all API endpoints for the AI Control Center, providing comprehensive monitoring, management, and analytics capabilities for AI operations.

## Endpoints Overview

### 1. Status Endpoint
**GET** `/api/ai-control/status`

Get comprehensive dashboard status including model health, system metrics, and aggregated statistics.

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "systemHealth": "healthy",
  "models": [
    {
      "model_id": "gemini-pro",
      "model_name": "Gemini Pro",
      "version": "1.0.0",
      "status": "active",
      "health": "healthy",
      "avg_response_ms": 250,
      "error_rate": 0.02,
      "avg_confidence": 0.85,
      "last_call": "2024-01-15T10:29:00Z",
      "calls_today": 1247,
      "cost_today": 2.45
    }
  ],
  "aggregates": {
    "total_calls_24h": 5432,
    "total_calls_7d": 38901,
    "avg_confidence": 0.84,
    "total_cost_today": 12.45,
    "active_models": 5,
    "error_rate": 0.03
  },
  "alerts": {
    "active_count": 3,
    "critical_count": 1
  }
}
```

---

### 2. Settings Endpoints
**GET** `/api/ai-control/settings`

Get current AI Control Center configuration.

**Response:**
```json
{
  "success": true,
  "config": {
    "enableActivityLogging": true,
    "logRetentionDays": 90,
    "enablePHISanitization": true,
    "rateLimitPerMinute": 60,
    "enableCostTracking": true,
    "costPerInputToken": 0.00001,
    "costPerOutputToken": 0.00003,
    "monthlyCostLimit": 1000
  }
}
```

**POST** `/api/ai-control/settings`

Update AI Control Center configuration.

**Request Body:**
```json
{
  "config": {
    "enableActivityLogging": true,
    "logRetentionDays": 90,
    "rateLimitPerMinute": 60
  }
}
```

---

### 3. Logs Endpoints
**GET** `/api/ai-control/logs`

Get AI activity logs with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `page_size` (number): Items per page (default: 50)
- `start_date` (ISO date): Filter logs from this date
- `end_date` (ISO date): Filter logs until this date
- `model_name` (string): Filter by model name
- `operation_type` (string): Filter by operation type
- `user_id` (string): Filter by user ID
- `status` (string): Filter by status (success, error, timeout, rate-limited)
- `min_confidence` (number): Minimum confidence score (0-100)
- `max_confidence` (number): Maximum confidence score (0-100)
- `entity_type` (string): Filter by entity type
- `entity_id` (string): Filter by entity ID

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": "log-123",
      "timestamp": "2024-01-15T10:30:00Z",
      "model_name": "Gemini Pro",
      "operation_type": "classification",
      "user_id": "user-456",
      "confidence_score": 0.87,
      "execution_time": 250,
      "status": "success",
      "cost_estimate": 0.002
    }
  ],
  "pagination": {
    "total": 1523,
    "page": 1,
    "page_size": 50,
    "total_pages": 31,
    "has_next": true,
    "has_prev": false
  }
}
```

**POST** `/api/ai-control/logs/export`

Export activity logs in specified format.

**Request Body:**
```json
{
  "format": "csv",
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-01-31T23:59:59Z",
  "model_name": "Gemini Pro"
}
```

**Supported Formats:**
- `csv`: Comma-separated values
- `json`: JSON format
- `excel`: Excel spreadsheet (.xlsx)

**Response:** File download with appropriate content type

---

### 4. Metrics Endpoint
**GET** `/api/ai-control/metrics`

Get performance metrics and analytics for AI operations.

**Query Parameters:**
- `start_date` (ISO date): Start of analysis period (default: 24 hours ago)
- `end_date` (ISO date): End of analysis period (default: now)
- `model_name` (string): Filter by model name
- `operation_type` (string): Filter by operation type
- `lookback_hours` (number): Hours to look back for anomaly detection (default: 24)

**Response:**
```json
{
  "success": true,
  "metrics": {
    "total_operations": 5432,
    "success_rate": 97.5,
    "error_rate": 2.5,
    "average_confidence": 0.84,
    "average_execution_time": 280,
    "total_cost": 12.45
  },
  "breakdown": {
    "by_operation_type": {
      "classification": 2500,
      "extraction": 1800,
      "analysis": 1132
    },
    "by_model": {
      "Gemini Pro": 3200,
      "Gemini Vision": 2232
    },
    "confidence_distribution": {
      "high": 4200,
      "medium": 1100,
      "low": 132
    }
  },
  "errors": {
    "top_errors": [
      {
        "message": "Rate limit exceeded",
        "count": 45
      }
    ]
  },
  "usage_patterns": {
    "peak_usage_hours": [
      { "hour": 14, "count": 850 },
      { "hour": 10, "count": 720 }
    ]
  },
  "anomalies": [
    {
      "id": "anomaly-123",
      "type": "high_error_rate",
      "severity": "high",
      "description": "Error rate is 8.5% (threshold: 5%)",
      "affected_logs_count": 45,
      "detected_at": "2024-01-15T10:30:00Z",
      "recommendation": "Check API connectivity and review error messages"
    }
  ]
}
```

---

### 5. Automation Rules Endpoints
**GET** `/api/ai-control/automation-rules`

Get all automation/alert rules.

**Query Parameters:**
- `is_active` (boolean): Filter by active status
- `alert_type` (string): Filter by alert type

**Response:**
```json
{
  "success": true,
  "rules": [
    {
      "id": "rule-123",
      "rule_name": "High Error Rate Alert",
      "description": "Alert when error rate exceeds 5%",
      "condition_type": "threshold",
      "condition": {
        "field": "error_rate",
        "operator": "gt",
        "value": 0.05
      },
      "alert_type": "high-error-rate",
      "severity": "high",
      "is_active": true,
      "trigger_count": 12
    }
  ],
  "total": 15
}
```

**POST** `/api/ai-control/automation-rules`

Create or update an automation/alert rule.

**Request Body (Create):**
```json
{
  "rule_name": "High Error Rate Alert",
  "description": "Alert when error rate exceeds 5%",
  "condition_type": "threshold",
  "condition": {
    "field": "error_rate",
    "operator": "gt",
    "value": 0.05
  },
  "alert_type": "high-error-rate",
  "severity": "high",
  "message_template": "Error rate is {{error_rate}}% (threshold: 5%)",
  "notification_channels": ["in-app", "email"],
  "aggregation_window": 5,
  "max_alerts_per_window": 3
}
```

**Request Body (Update):**
```json
{
  "rule_id": "rule-123",
  "is_active": false
}
```

**DELETE** `/api/ai-control/automation-rules?rule_id=rule-123`

Delete an automation/alert rule.

---

### 6. Diagnostics Endpoint
**POST** `/api/ai-control/diagnostics/test`

Run health checks and diagnostics on AI Control Center.

**Request Body:**
```json
{
  "test_type": "all"
}
```

**Test Types:**
- `all`: Run all tests
- `config`: Configuration check
- `database`: Database connectivity
- `api_key`: API key validation
- `rate_limit`: Rate limiting check
- `cost`: Cost tracking check
- `alerts`: Alert system check
- `performance`: Performance check

**Response:**
```json
{
  "success": true,
  "diagnostics": {
    "timestamp": "2024-01-15T10:30:00Z",
    "overall_status": "healthy",
    "tests": {
      "configuration": {
        "status": "passed",
        "message": "Configuration loaded successfully"
      },
      "database": {
        "status": "passed",
        "message": "Database connectivity verified",
        "details": {
          "activity_logs_count": 5432,
          "alerts_count": 15
        }
      },
      "api_key": {
        "status": "passed",
        "message": "API key format is valid"
      },
      "performance": {
        "status": "warning",
        "message": "Performance issues detected: High average response time",
        "details": {
          "avg_execution_time": 890,
          "error_rate": 2.5
        }
      }
    }
  }
}
```

---

### 7. Cost Analytics Endpoint
**GET** `/api/ai-control/cost-analytics`

Get cost analytics and spending data for AI operations.

**Query Parameters:**
- `period` (string): Time period (day, week, month, year) - default: month
- `model_name` (string): Filter by model name

**Response:**
```json
{
  "success": true,
  "period": {
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-01-31T23:59:59Z",
    "period_type": "month"
  },
  "summary": {
    "total_cost": 245.67,
    "total_operations": 125000,
    "avg_cost_per_operation": 0.00197,
    "cost_per_successful_operation": 0.00201,
    "total_input_tokens": 5000000,
    "total_output_tokens": 2500000
  },
  "budget": {
    "monthly_limit": 1000,
    "current_month_cost": 245.67,
    "projected_monthly_cost": 350.50,
    "budget_utilization_percent": 24.57,
    "days_until_limit": 45
  },
  "breakdown": {
    "by_model": [
      { "model": "Gemini Pro", "cost": 180.45 },
      { "model": "Gemini Vision", "cost": 65.22 }
    ],
    "by_operation_type": [
      { "operation_type": "classification", "cost": 120.30 },
      { "operation_type": "extraction", "cost": 85.15 }
    ],
    "by_user": [
      { "user_id": "user-123", "cost": 45.20 }
    ]
  },
  "trends": {
    "daily_costs": [
      { "date": "2024-01-01", "cost": 8.50 },
      { "date": "2024-01-02", "cost": 9.20 }
    ],
    "avg_daily_cost": 7.92
  },
  "top_expensive_operations": [
    {
      "id": "log-456",
      "timestamp": "2024-01-15T10:30:00Z",
      "model_name": "Gemini Pro",
      "operation_type": "analysis",
      "cost": 0.15,
      "input_tokens": 5000,
      "output_tokens": 3000
    }
  ],
  "recommendations": [
    "Enable caching to reduce costs by up to 50%",
    "Consider optimizing prompts to reduce token usage"
  ]
}
```

---

### 8. Alerts Endpoints
**GET** `/api/ai-control/alerts`

Get active alerts with optional filtering.

**Query Parameters:**
- `severity` (string): Filter by severity (low, medium, high, critical)
- `alert_type` (string): Filter by alert type
- `model_name` (string): Filter by model name
- `status` (string): Filter by status (active, acknowledged, resolved, all)

**Response:**
```json
{
  "success": true,
  "alerts": [
    {
      "id": "alert-123",
      "alert_type": "high-error-rate",
      "severity": "high",
      "title": "High Error Rate Detected",
      "message": "Error rate is 8.5% (threshold: 5%)",
      "model_name": "Gemini Pro",
      "status": "active",
      "acknowledged": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 3
}
```

**POST** `/api/ai-control/alerts`

Acknowledge or resolve an alert.

**Request Body (Acknowledge):**
```json
{
  "alert_id": "alert-123",
  "action": "acknowledge",
  "user_id": "user-456",
  "user_name": "John Doe"
}
```

**Request Body (Resolve):**
```json
{
  "alert_id": "alert-123",
  "action": "resolve",
  "user_id": "user-456",
  "user_name": "John Doe",
  "resolution_notes": "Fixed by restarting the service"
}
```

**Request Body (Snooze):**
```json
{
  "alert_id": "alert-123",
  "action": "snooze",
  "user_id": "user-456",
  "user_name": "John Doe",
  "snooze_duration": 60
}
```

---

### 9. Live Feed Endpoint (Server-Sent Events)
**GET** `/api/ai-control/live`

Real-time streaming of AI Control Center updates using Server-Sent Events (SSE).

**Event Types:**
- `connected`: Initial connection confirmation
- `activity_logs`: New activity logs
- `alerts`: New alerts
- `status_update`: Periodic status updates
- `heartbeat`: Keep-alive heartbeat
- `error`: Error messages

**Example Usage (JavaScript):**
```javascript
const eventSource = new EventSource('/api/ai-control/live');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'activity_logs':
      console.log('New logs:', data.data);
      break;
    case 'alerts':
      console.log('New alerts:', data.data);
      break;
    case 'status_update':
      console.log('Status update:', data.data);
      break;
  }
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
};
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `500`: Internal Server Error

---

## Authentication

Currently, these endpoints do not require authentication. In production, implement:
- API key authentication
- JWT token validation
- Role-based access control (RBAC)

---

## Rate Limiting

API endpoints respect the configured rate limits in AI Control Center settings. Default: 60 requests per minute.

---

## Best Practices

1. **Pagination**: Always use pagination for large datasets
2. **Filtering**: Apply filters to reduce response size
3. **Caching**: Cache responses when appropriate
4. **Error Handling**: Implement proper error handling and retries
5. **Real-time Updates**: Use the live feed endpoint for real-time monitoring
6. **Cost Monitoring**: Regularly check cost analytics to optimize spending

---

## Examples

### Get Recent High-Severity Alerts
```bash
curl "http://localhost:3000/api/ai-control/alerts?severity=high&status=active"
```

### Export Last Month's Logs
```bash
curl -X POST "http://localhost:3000/api/ai-control/logs/export" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-01-31T23:59:59Z"
  }' \
  --output logs.csv
```

### Run Full Diagnostics
```bash
curl -X POST "http://localhost:3000/api/ai-control/diagnostics/test" \
  -H "Content-Type: application/json" \
  -d '{"test_type": "all"}'
```

### Get Cost Analytics for Current Month
```bash
curl "http://localhost:3000/api/ai-control/cost-analytics?period=month"
```

---

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
