# AI Control Center "AI Mais Co." - Quick Start Guide

## 🎯 Overview
Comprehensive AI operations management dashboard for monitoring, controlling, and optimizing all AI services in the Medical Products Management System.

## 📍 Access
- **URL**: `/ai-control-center` or `/admin/ai-maisco`
- **Required Role**: `AI_ADMIN` or `ADMIN`
- **Authentication**: Session-based with MFA for critical operations

## 🗂️ File Structure

```
app/
├── ai-control-center/
│   ├── page.tsx                    # Main dashboard
│   ├── audit-logs/
│   │   └── page.tsx               # Audit log viewer
│   ├── settings/
│   │   └── page.tsx               # Configuration panel
│   ├── automation/
│   │   └── page.tsx               # Automation rules
│   ├── diagnostics/
│   │   └── page.tsx               # Diagnostic tools
│   ├── cost-analytics/
│   │   └── page.tsx               # Cost analysis
│   ├── integrations/
│   │   └── page.tsx               # API management
│   └── reports/
│       └── page.tsx               # Reports & analytics

components/
├── ai-control/
│   ├── FloatingHelpButton.tsx     # ⭐ Floating help button
│   ├── HelpModal.tsx              # ⭐ Help modal with 6 sections
│   ├── ModelStatusCard.tsx        # Model status display
│   ├── ActivityMetrics.tsx        # Activity statistics
│   ├── PerformanceCharts.tsx      # Performance charts
│   ├── LiveActivityFeed.tsx       # Real-time activity feed
│   ├── RateLimitIndicator.tsx     # Rate limit display
│   ├── QuickStatsCards.tsx        # Quick stats
│   ├── LogDetailModal.tsx         # Log detail viewer
│   ├── AutomationRuleBuilder.tsx  # Rule builder
│   └── AutomationRuleList.tsx     # Rules list

services/
├── ai/
│   ├── activity-logger.ts         # AI activity logging
│   ├── config-manager.ts          # Configuration management
│   ├── automation-engine.ts       # Automation execution
│   ├── alert-manager.ts           # Alert system
│   ├── metrics-collector.ts       # Metrics aggregation
│   └── phi-sanitizer.ts           # PHI sanitization

lib/
└── db/
    └── ai-control-schema.ts       # AI Control Center tables

types/
└── ai-control.ts                  # TypeScript interfaces
```

## 🗄️ Database Tables

### 1. AIActivityLog
Stores all AI operations with sanitized data.
```typescript
{
  id, timestamp, userId, modelName, operationType,
  inputData, inputHash, outputData, confidenceScore,
  executionTime, status, errorMessage, metadata,
  sensitiveFlag, costEstimate, createdAt
}
```

### 2. AIConfigurationHistory
Tracks all configuration changes.
```typescript
{
  id, timestamp, userId, settingName, oldValue,
  newValue, reason, approvedBy, ipAddress, createdAt
}
```

### 3. AIConfigurationSnapshot
Stores configuration backups for rollback.
```typescript
{
  id, snapshotName, configuration, createdAt,
  createdBy, description, isAutomatic, tags
}
```

### 4. AIAutomationRule
Defines automation rules.
```typescript
{
  id, ruleName, description, triggerType,
  triggerCondition, aiOperation, actionType,
  actionConfig, status, lastExecution,
  successRate, createdAt, updatedAt
}
```

### 5. AIModelMetrics
Aggregated daily metrics per model.
```typescript
{
  id, modelName, date, totalCalls, successfulCalls,
  failedCalls, avgResponseTime, avgConfidence,
  totalCost, errorRate, createdAt
}
```

### 6. SecurityAuditLog
Security audit trail.
```typescript
{
  id, timestamp, userId, action, resourceAffected,
  ipAddress, outcome, details, severity,
  requiresMFA, mfaVerified, createdAt
}
```

## 🔌 API Endpoints

### Status & Monitoring
```
GET  /api/ai-control/status              # System status
GET  /api/ai-control/metrics             # Performance metrics
WS   /api/ai-control/live                # Real-time updates
```

### Audit Logs
```
GET  /api/ai-control/logs                # Get logs (with filters)
GET  /api/ai-control/logs/:id            # Get log details
POST /api/ai-control/logs/export         # Export logs
```

### Configuration
```
GET  /api/ai-control/settings            # Get configuration
POST /api/ai-control/settings            # Update configuration
GET  /api/ai-control/settings/history    # Configuration history
POST /api/ai-control/settings/rollback   # Rollback configuration
```

### Automation
```
GET    /api/ai-control/automation-rules       # List rules
POST   /api/ai-control/automation-rules       # Create rule
PUT    /api/ai-control/automation-rules/:id   # Update rule
DELETE /api/ai-control/automation-rules/:id   # Delete rule
POST   /api/ai-control/automation-rules/:id/test  # Test rule
```

### Diagnostics
```
POST /api/ai-control/diagnostics/test         # Run health check
GET  /api/ai-control/diagnostics/performance  # Performance metrics
```

### Cost Analytics
```
GET /api/ai-control/cost-analytics       # Cost breakdown
```

### Alerts
```
GET  /api/ai-control/alerts              # Get alerts
POST /api/ai-control/alerts/:id/acknowledge  # Acknowledge alert
```

## 🎨 Key Components

### 1. Floating Help Button ⭐
**Location**: Bottom-right corner (fixed position)
**File**: `components/ai-control/FloatingHelpButton.tsx`

```tsx
<FloatingHelpButton />
```

**Features**:
- Animated gradient button (blue to purple)
- Pulse animation ring
- Arabic tooltip on hover
- Opens comprehensive help modal
- Visible on all AI Control Center pages

### 2. Help Modal ⭐
**File**: `components/ai-control/HelpModal.tsx`

**Sections**:
1. **البدء السريع** (Getting Started) - Quick start guide
2. **إعداد النماذج** (Configuration) - Model setup
3. **الأمان والخصوصية** (Security) - Security policies
4. **قواعد الأتمتة** (Automation) - Automation rules
5. **حل المشكلات** (Troubleshooting) - Common issues
6. **مرجع API** (API Reference) - API documentation

**Features**:
- Full-screen modal with sidebar navigation
- RTL support for Arabic content
- Dark mode support
- PDF export button
- Responsive mobile layout
- ESC key and backdrop click to close

### 3. Dashboard Components

**ModelStatusCard**: Shows model health and status
```tsx
<ModelStatusCard 
  modelName="doc-classifier-v2"
  version="2.1.0"
  status="active"
  health="healthy"
  avgResponseTime={120}
  confidence={0.87}
/>
```

**ActivityMetrics**: Displays cumulative statistics
```tsx
<ActivityMetrics 
  period="24h"
  totalCalls={1247}
  avgConfidence={0.84}
  errorRate={0.02}
/>
```

**PerformanceCharts**: Interactive charts
```tsx
<PerformanceCharts 
  data={metricsData}
  chartType="response-time"
/>
```

## 🔐 Security & Roles

### Roles
1. **AI_ADMIN**: Full access to all features
2. **AI_OPERATOR**: View and execute operations (no config changes)
3. **AI_AUDITOR**: View and export logs only

### PHI Sanitization
All AI operations automatically sanitize PHI before external API calls:
- Names removed
- National IDs masked
- Dates generalized
- Addresses removed

### MFA Requirements
Critical operations require MFA:
- Disabling AI models
- Changing security settings
- Exporting audit logs
- Deleting automation rules
- Rolling back configuration

## 📊 Real-time Updates

### WebSocket Connection
```typescript
const ws = new WebSocket('wss://api.example.com/api/ai-control/live');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'status_update':
      updateModelStatus(data.data);
      break;
    case 'new_log':
      addLogEntry(data.data);
      break;
    case 'alert':
      showAlert(data.data);
      break;
  }
};
```

### Polling Fallback
If WebSocket unavailable, falls back to 60-second polling:
```typescript
setInterval(async () => {
  const status = await fetch('/api/ai-control/status');
  updateDashboard(await status.json());
}, 60000);
```

## 🎯 Quick Implementation Checklist

### Phase 1: Database & Core Services (Days 1-4)
- [ ] Create 6 database tables with Dexie.js
- [ ] Implement AIActivityLogger service
- [ ] Implement ConfigurationManager service
- [ ] Implement PHI sanitization service
- [ ] Create AlertManager service

### Phase 2: UI Components (Days 5-10)
- [ ] Create main dashboard page
- [ ] Build ModelStatusCard component
- [ ] Build ActivityMetrics component
- [ ] Build PerformanceCharts component
- [ ] **Create FloatingHelpButton component** ⭐
- [ ] **Create HelpModal with 6 sections** ⭐
- [ ] Build audit log viewer
- [ ] Build settings panel
- [ ] Build automation rule builder

### Phase 3: API Development (Days 11-13)
- [ ] Implement status endpoints
- [ ] Implement logs endpoints
- [ ] Implement settings endpoints
- [ ] Implement automation endpoints
- [ ] Implement WebSocket server
- [ ] Add authentication middleware
- [ ] Add rate limiting

### Phase 4: Integration (Days 14-16)
- [ ] Integrate with existing Gemini services
- [ ] Add activity logging to all AI calls
- [ ] Implement configuration enforcement
- [ ] Add cost tracking
- [ ] Test automation rules

### Phase 5: Testing & Documentation (Days 17-21)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Write E2E tests
- [ ] Create administrator guide
- [ ] Create API documentation
- [ ] Record video tutorials

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install recharts lucide-react @tanstack/react-virtual
```

### 2. Create Database Schema
```bash
# Run database migration
npm run db:migrate
```

### 3. Set Environment Variables
```env
NEXT_PUBLIC_AI_CONTROL_ENABLED=true
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3000/api/ai-control/live
AI_CONTROL_ADMIN_PASSWORD=your-secure-password
```

### 4. Start Development
```bash
npm run dev
```

### 5. Access Dashboard
Navigate to: `http://localhost:3000/ai-control-center`

## 📱 Responsive Design

### Desktop (1024px+)
- Full sidebar navigation
- Multi-column dashboard layout
- Large charts and tables
- Floating help button bottom-right

### Tablet (768px-1023px)
- Collapsible sidebar
- 2-column layout
- Medium-sized charts
- Floating help button bottom-right

### Mobile (< 768px)
- Hamburger menu
- Single column layout
- Simplified charts
- Floating help button bottom-right (smaller)
- Help modal full-screen with collapsible sidebar

## 🎨 Theme Support

### Light Mode
- Clean white backgrounds
- Subtle shadows
- Blue accent colors

### Dark Mode
- Dark gray backgrounds (#1a1a1a)
- Blue/purple accents
- High contrast text

### Auto Mode
Follows system preference automatically.

## 🌐 Internationalization

### Arabic Support (RTL)
- All help content in Arabic
- Proper RTL layout
- Arabic date formatting
- Arabic number formatting

### English Support (LTR)
- Technical terms in English
- API documentation in English
- Code examples in English

## 📈 Performance Targets

- **Initial Load**: < 2 seconds
- **Dashboard Refresh**: < 500ms
- **Chart Rendering**: < 200ms
- **Modal Open**: < 100ms
- **API Response**: < 300ms

## 🐛 Troubleshooting

### WebSocket Not Connecting
```typescript
// Check WebSocket URL in environment
console.log(process.env.NEXT_PUBLIC_WEBSOCKET_URL);

// Fallback to polling
if (!ws || ws.readyState !== WebSocket.OPEN) {
  startPolling();
}
```

### PHI Sanitization Not Working
```typescript
// Verify sanitizer is enabled
const config = await getAIConfig();
console.log(config.security.phi_sanitization_enabled);

// Test sanitization
const sanitized = await PHISanitizer.sanitize(testData);
console.log('Sanitized:', sanitized);
```

### Floating Help Button Not Visible
```typescript
// Check z-index conflicts
// FloatingHelpButton should have z-50
// Ensure no parent has overflow: hidden

// Verify component is rendered
console.log(document.querySelector('[aria-label="Open Help Guide"]'));
```

## 📞 Support

For issues or questions:
1. Check the Help Modal (click floating help button)
2. Review troubleshooting section
3. Check API documentation
4. Contact system administrator

---

**Last Updated**: October 31, 2025
**Version**: 1.0.0
**Status**: Ready for Implementation ✅
