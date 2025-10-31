# AI Control Center - API Endpoints Specification

## Base URL
```
/api/ai-control
```

## Authentication
All endpoints require authentication with one of the following roles:
- `AI_ADMIN` - Full access
- `AI_OPERATOR` - Read and execute operations
- `AI_AUDITOR` - Read-only access

Critical operations require MFA verification.

## Endpoints

### 1. System Status

#### GET `/api/ai-control/status`
Get real-time status of all AI models and system health.

**Authorization**: AI_ADMIN, AI_OPERATOR, AI_AUDITOR

**Response**:
```json
{
  "timestamp": "2025-10-31T10:00:00Z",
  "systemHealth": "healthy",
  "models": [
    {
      "model_id": "doc-classifier-v2",
      "model_name": "Document Classifier",
      "version": "2.1.0",
      "status": "active",
      "health": "healthy",
      "avg_response_ms": 120,
      "error_rate": 0.02,
      "avg_confidence": 0.87,
      "last_call": "2025-10-31T09:58:30Z",
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
  }
}
```

---

### 2. Activity Logs

#### GET `/api/ai-control/logs`
Retrieve AI activity logs with filtering and pagination.

**Authorization**: AI_ADMIN, AI_OPERATOR, AI_AUDITOR

**Query Parameters**:
```typescript
{
  start_date?: string;        // ISO 8601 format
  end_date?: string;          // ISO 8601 format
  model_name?: string;        // Filter by model
  user_id?: string;           // Filter by user
  operation_type?: string;    // classify, extract, analyze, etc.
  min_confidence?: number;    // 0-1
  max_confidence?: number;    // 0-1
  status?: string;            // success, error, timeout, rejected
  page?: number;              // Default: 1
  page_size?: number;         // Default: 50, Max: 200
  sort?: string;              // timestamp_desc, timestamp_asc, confidence_desc
}
```

**Response**:
```json
{
  "logs": [
    {
      "id": "b1a2c3d4-...",
      "timestamp": "2025-10-31T10:05:00Z",
      "model_name": "doc-classifier-v2",
      "model_version": "2.1.0",
      "operation_type": "classify",
      "user_id": "user-123",
      "input_hash": "sha256:abcd...",
      "output_summary": "cardiology report -> category:A",
      "confidence_score": 0.82,
      "execution_time": 145,
      "status": "success",
      "sensitive_flag": false,
      "cost_estimate": 0.0012
    }
  ],
  "pagination": {
    "total": 15234,
    "page": 1,
    "page_size": 50,
    "total_pages": 305
  }
}
```

---

#### GET `/api/ai-control/logs/:id`
Get detailed information for a specific log entry.

**Authorization**: AI_ADMIN, AI_OPERATOR, AI_AUDITOR

**Response**:
```json
{
  "id": "b1a2c3d4-...",
  "timestamp": "2025-10-31T10:05:00Z",
  "model_name": "doc-classifier-v2",
  "model_version": "2.1.0",
  "operation_type": "classify",
  "user_id": "user-123",
  "user_name": "Dr. Ahmed",
  "input_data": "{sanitized input}",
  "input_hash": "sha256:abcd...",
  "output_data": "{full output}",
  "confidence_score": 0.82,
  "confidence_breakdown": {
    "category_a": 0.82,
    "category_b": 0.15,
    "category_c": 0.03
  },
  "execution_time": 145,
  "status": "success",
  "metadata": {
    "source": "document_upload",
    "document_id": "doc-789"
  },
  "sensitive_flag": false,
  "cost_estimate": 0.0012,
  "related_logs": ["log-id-1", "log-id-2"]
}
```

---

#### POST `/api/ai-control/logs/export`
Export activity logs in various formats.

**Authorization**: AI_ADMIN, AI_AUDITOR

**Request Body**:
```json
{
  "filters": {
    "start_date": "2025-10-01T00:00:00Z",
    "end_date": "2025-10-31T23:59:59Z",
    "model_name": "doc-classifier-v2"
  },
  "format": "csv",
  "columns": ["timestamp", "model_name", "confidence_score", "status"],
  "include_sensitive": false
}
```

**Response**: File download (CSV, JSON, or Excel)

---

### 3. Configuration Management

#### GET `/api/ai-control/settings`
Get current AI configuration.

**Authorization**: AI_ADMIN, AI_OPERATOR

**Response**:
```json
{
  "models": {
    "doc-classifier-v2": {
      "enabled": true,
      "version": "2.1.0",
      "endpoint": "https://api.gemini.google.com/v1/models/gemini-pro",
      "timeout_ms": 30000,
      "max_retries": 3,
      "rate_limit": {
        "requests_per_minute": 60,
        "requests_per_hour": 3000,
        "daily_quota": 50000
      },
      "confidence_threshold": {
        "auto_approve": 0.85,
        "require_review": 0.60,
        "auto_reject": 0.40
      },
      "cost_limits": {
        "daily_budget": 50.00,
        "alert_threshold": 40.00
      }
    }
  },
  "security": {
    "phi_sanitization_enabled": true,
    "encryption_in_transit": true,
    "data_retention_days": 365,
    "require_mfa_for_critical": true
  },
  "performance": {
    "cache_enabled": true,
    "cache_duration_seconds": 3600,
    "batch_processing_enabled": true
  }
}
```

---

#### POST `/api/ai-control/settings`
Update AI configuration.

**Authorization**: AI_ADMIN (requires MFA for critical settings)

**Request Body**:
```json
{
  "setting_path": "models.doc-classifier-v2.enabled",
  "new_value": false,
  "reason": "Maintenance - updating to v2.2.0",
  "requires_approval": false
}
```

**Response**:
```json
{
  "success": true,
  "change_id": "change-123",
  "applied_at": "2025-10-31T10:15:00Z",
  "requires_mfa": false,
  "rollback_available": true,
  "snapshot_id": "snapshot-456"
}
```

---

#### GET `/api/ai-control/settings/history`
Get configuration change history.

**Authorization**: AI_ADMIN, AI_AUDITOR

**Query Parameters**: `start_date`, `end_date`, `user_id`, `setting_name`

**Response**:
```json
{
  "changes": [
    {
      "id": "change-123",
      "timestamp": "2025-10-31T10:15:00Z",
      "user_id": "admin-001",
      "user_name": "System Admin",
      "setting_name": "models.doc-classifier-v2.enabled",
      "old_value": true,
      "new_value": false,
      "reason": "Maintenance - updating to v2.2.0",
      "approved_by": "admin-001",
      "ip_address": "192.168.1.100"
    }
  ]
}
```

---

#### POST `/api/ai-control/settings/rollback`
Rollback to a previous configuration snapshot.

**Authorization**: AI_ADMIN (requires MFA)

**Request Body**:
```json
{
  "snapshot_id": "snapshot-456",
  "reason": "Reverting due to performance issues",
  "mfa_token": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "rolled_back_to": "2025-10-30T14:30:00Z",
  "changes_reverted": 5,
  "new_snapshot_id": "snapshot-789"
}
```

---

### 4. Automation Rules

#### GET `/api/ai-control/automation-rules`
List all automation rules.

**Authorization**: AI_ADMIN, AI_OPERATOR

**Response**:
```json
{
  "rules": [
    {
      "id": "rule-001",
      "rule_name": "Auto-classify uploaded documents",
      "description": "Automatically classify medical documents on upload",
      "trigger_type": "event",
      "trigger_condition": {
        "event": "document.uploaded",
        "filters": {
          "document_type": "medical"
        }
      },
      "ai_operation": {
        "model_name": "doc-classifier-v2",
        "operation_type": "classify",
        "confidence_threshold": 0.75
      },
      "action_type": "update_db",
      "action_config": {
        "update_field": "category",
        "notify_user": true
      },
      "status": "active",
      "last_execution": "2025-10-31T09:45:00Z",
      "success_rate": 0.94,
      "execution_count": 1523
    }
  ]
}
```

---

#### POST `/api/ai-control/automation-rules`
Create a new automation rule.

**Authorization**: AI_ADMIN

**Request Body**:
```json
{
  "rule_name": "Alert on low confidence",
  "description": "Send alert when AI confidence is below threshold",
  "trigger_type": "condition",
  "trigger_condition": {
    "check": "ai_operation_completed",
    "condition": "confidence < 0.60"
  },
  "action_type": "send_notification",
  "action_config": {
    "notification_type": "email",
    "recipients": ["admin@example.com"],
    "template": "low_confidence_alert"
  },
  "status": "active"
}
```

---

#### PUT `/api/ai-control/automation-rules/:id`
Update an automation rule.

**Authorization**: AI_ADMIN

---

#### DELETE `/api/ai-control/automation-rules/:id`
Delete an automation rule.

**Authorization**: AI_ADMIN

---

#### POST `/api/ai-control/automation-rules/:id/test`
Test an automation rule with sample data.

**Authorization**: AI_ADMIN, AI_OPERATOR

**Request Body**:
```json
{
  "test_data": {
    "document_id": "doc-123",
    "document_type": "medical"
  }
}
```

**Response**:
```json
{
  "test_result": "success",
  "trigger_matched": true,
  "ai_operation_result": {
    "classification": "cardiology",
    "confidence": 0.82
  },
  "action_executed": true,
  "execution_time": 234
}
```

---

### 5. Diagnostics

#### POST `/api/ai-control/diagnostics/test`
Run health check on AI models.

**Authorization**: AI_ADMIN, AI_OPERATOR

**Request Body**:
```json
{
  "model_name": "doc-classifier-v2",
  "test_type": "connection",
  "include_latency": true,
  "include_accuracy": false
}
```

**Response**:
```json
{
  "test_id": "test-789",
  "model_name": "doc-classifier-v2",
  "test_type": "connection",
  "status": "passed",
  "results": {
    "connection": "success",
    "latency_ms": 145,
    "api_version": "v1",
    "rate_limit_remaining": 2847
  },
  "timestamp": "2025-10-31T10:20:00Z"
}
```

---

#### GET `/api/ai-control/diagnostics/performance`
Get detailed performance metrics.

**Authorization**: AI_ADMIN, AI_OPERATOR

**Query Parameters**: `model_name`, `time_range` (24h, 7d, 30d)

**Response**:
```json
{
  "model_name": "doc-classifier-v2",
  "time_range": "24h",
  "metrics": {
    "total_calls": 1247,
    "successful_calls": 1223,
    "failed_calls": 24,
    "avg_response_time": 145,
    "p50_response_time": 120,
    "p95_response_time": 280,
    "p99_response_time": 450,
    "avg_confidence": 0.84,
    "error_rate": 0.019,
    "timeout_rate": 0.008,
    "cost_total": 2.45
  },
  "trends": {
    "response_time": "stable",
    "confidence": "improving",
    "error_rate": "decreasing"
  }
}
```

---

### 6. Cost Analytics

#### GET `/api/ai-control/cost-analytics`
Get cost breakdown and analytics.

**Authorization**: AI_ADMIN

**Query Parameters**: `start_date`, `end_date`, `group_by` (model, operation, day)

**Response**:
```json
{
  "period": {
    "start": "2025-10-01T00:00:00Z",
    "end": "2025-10-31T23:59:59Z"
  },
  "total_cost": 387.45,
  "budget": 500.00,
  "budget_used_percent": 77.49,
  "projected_month_end": 425.30,
  "by_model": [
    {
      "model_name": "doc-classifier-v2",
      "cost": 145.20,
      "calls": 45231,
      "cost_per_call": 0.0032
    }
  ],
  "by_operation": [
    {
      "operation_type": "classify",
      "cost": 234.50,
      "calls": 38901
    }
  ],
  "daily_breakdown": [
    {
      "date": "2025-10-31",
      "cost": 12.45,
      "calls": 1247
    }
  ]
}
```

---

### 7. Alerts & Notifications

#### GET `/api/ai-control/alerts`
Get active alerts.

**Authorization**: AI_ADMIN, AI_OPERATOR

**Response**:
```json
{
  "alerts": [
    {
      "id": "alert-001",
      "type": "performance",
      "severity": "warning",
      "title": "High response time detected",
      "description": "doc-classifier-v2 response time exceeded 500ms threshold",
      "model_name": "doc-classifier-v2",
      "created_at": "2025-10-31T09:30:00Z",
      "status": "active",
      "acknowledged": false
    }
  ]
}
```

---

#### POST `/api/ai-control/alerts/:id/acknowledge`
Acknowledge an alert.

**Authorization**: AI_ADMIN, AI_OPERATOR

---

### 8. Real-time Updates

#### WebSocket `/api/ai-control/live`
Real-time updates for dashboard.

**Authorization**: AI_ADMIN, AI_OPERATOR, AI_AUDITOR

**Connection**:
```javascript
const ws = new WebSocket('wss://api.example.com/api/ai-control/live');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle real-time updates
};
```

**Message Types**:
```json
{
  "type": "status_update",
  "data": {
    "model_name": "doc-classifier-v2",
    "status": "active",
    "health": "healthy"
  }
}

{
  "type": "new_log",
  "data": {
    "log_id": "log-123",
    "model_name": "doc-classifier-v2",
    "confidence": 0.87
  }
}

{
  "type": "alert",
  "data": {
    "alert_id": "alert-002",
    "severity": "high",
    "title": "Budget threshold exceeded"
  }
}
```

---

## Error Responses

All endpoints follow a consistent error format:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Insufficient permissions to access this resource",
    "details": {
      "required_role": "AI_ADMIN",
      "current_role": "AI_OPERATOR"
    },
    "timestamp": "2025-10-31T10:25:00Z",
    "request_id": "req-abc123"
  }
}
```

### Error Codes
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid request data
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error
- `MFA_REQUIRED` (403) - MFA verification needed

---

## Rate Limiting

All API endpoints are rate-limited:
- **AI_ADMIN**: 1000 requests/hour
- **AI_OPERATOR**: 500 requests/hour
- **AI_AUDITOR**: 300 requests/hour

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1698753600
```

---

## Pagination

All list endpoints support pagination:
```
?page=1&page_size=50
```

Response includes pagination metadata:
```json
{
  "data": [...],
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

---

## Filtering & Sorting

Common query parameters:
- `sort`: Field to sort by (prefix with `-` for descending)
- `filter[field]`: Filter by field value
- `search`: Full-text search

Example:
```
GET /api/ai-control/logs?sort=-timestamp&filter[status]=success&search=cardiology
```
