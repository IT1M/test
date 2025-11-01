# Alert System Flow Diagram

## Alert Creation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Alert Creation Trigger                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Manual Creation │
                    │        OR        │
                    │  Rule Evaluation │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Check Aggregation│
                    │   (5 min window) │
                    └──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  Aggregate   │    │ Create Alert │
            │  (Skip Send) │    │   in DB      │
            └──────────────┘    └──────────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │ Route to Channels│
                              └──────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
            ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
            │   In-App     │    │    Email     │    │  SMS/Webhook │
            │ Notification │    │ (if enabled) │    │ (if enabled) │
            └──────────────┘    └──────────────┘    └──────────────┘
                    │                   │                   │
                    └───────────────────┼───────────────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │  Log to Activity │
                              │     Logger       │
                              └──────────────────┘
```

## Alert Lifecycle Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Alert States                             │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  ACTIVE  │ ◄─────────────────────────────┐
    └──────────┘                                │
         │                                      │
         │ User Action: Acknowledge             │
         ▼                                      │
    ┌──────────┐                                │
    │ACKNOWLEDGED│                              │
    └──────────┘                                │
         │                                      │
         │ User Action: Resolve                 │
         ▼                                      │
    ┌──────────┐                                │
    │ RESOLVED │                                │
    └──────────┘                                │
                                                │
    ┌──────────┐                                │
    │  ACTIVE  │                                │
    └──────────┘                                │
         │                                      │
         │ User Action: Snooze (30m)            │
         ▼                                      │
    ┌──────────┐                                │
    │ SNOOZED  │                                │
    └──────────┘                                │
         │                                      │
         │ Auto: After snooze period            │
         └──────────────────────────────────────┘
```

## Alert Rule Evaluation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Rule Evaluation Trigger                       │
│              (Called from AI operations)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Get Active Rules│
                    │   from Database  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  For Each Rule   │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Evaluate Condition│
                    │   Against Context│
                    └──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  Condition   │    │  Condition   │
            │    FALSE     │    │     TRUE     │
            │  (Skip)      │    │  (Trigger)   │
            └──────────────┘    └──────────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │ Interpolate      │
                              │ Message Template │
                              └──────────────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │  Create Alert    │
                              │  (See Above)     │
                              └──────────────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │ Update Rule Stats│
                              │ (trigger count)  │
                              └──────────────────┘
```

## Notification Channel Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Notification Routing                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Get Configured  │
                    │    Channels      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  For Each Channel│
                    └──────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   IN-APP     │      │    EMAIL     │      │  SMS/WEBHOOK │
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Notification │      │ Send via     │      │ HTTP POST to │
│    Store     │      │ Email Service│      │   Endpoint   │
│  (Zustand)   │      │ (SendGrid)   │      │  (Webhook)   │
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Show Toast   │      │ Email Sent   │      │ SMS/Webhook  │
│ Notification │      │   ✓ or ✗     │      │   Sent ✓/✗   │
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Update Alert DB  │
                    │ (notifications   │
                    │  sent count)     │
                    └──────────────────┘
```

## Alert Aggregation Logic

```
┌─────────────────────────────────────────────────────────────────┐
│                    Alert Aggregation Check                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Get Alert Rules │
                    │  for Alert Type  │
                    └──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  No Rules    │    │  Rules Found │
            │  (Don't      │    │              │
            │  Aggregate)  │    │              │
            └──────────────┘    └──────────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │ Get Aggregation  │
                              │ Window (5 min)   │
                              └──────────────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │ Count Similar    │
                              │ Alerts in Window │
                              └──────────────────┘
                                        │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │ Count < Max  │    │ Count >= Max │
            │ (Send Alert) │    │ (Aggregate)  │
            └──────────────┘    └──────────────┘
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │ Create Alert │    │ Skip Creation│
            │ & Notify     │    │ Log Event    │
            └──────────────┘    └──────────────┘
```

## Alert Analytics Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Analytics Request                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Query Alerts DB │
                    │  (with filters)  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Calculate Stats │
                    └──────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Counts     │      │  Resolution  │      │ Aggregations │
│ (total,      │      │    Times     │      │ (by type,    │
│  active,     │      │  (avg, MTTR) │      │  severity,   │
│  resolved)   │      │              │      │  model)      │
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Build Analytics │
                    │     Object       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Return to UI    │
                    │  for Display     │
                    └──────────────────┘
```

## User Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Opens Alerts Page                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Load Active     │
                    │  Alerts          │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Display Alerts  │
                    │  with Actions    │
                    └──────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Acknowledge  │      │   Snooze     │      │   Resolve    │
│   Button     │      │   Button     │      │   Button     │
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Update Alert │      │ Update Alert │      │ Update Alert │
│ Status to    │      │ Status to    │      │ Status to    │
│ Acknowledged │      │ Snoozed      │      │ Resolved     │
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Log Action to   │
                    │ Activity Logger  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Refresh Alert   │
                    │     List         │
                    └──────────────────┘
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                      Alert Manager                               │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Database   │      │ Notification │      │   Activity   │
│   (Dexie)    │      │    Store     │      │   Logger     │
│              │      │  (Zustand)   │      │              │
│ - aiAlerts   │      │              │      │ - Log all    │
│ - aiAlertRules│     │ - In-app     │      │   actions    │
│              │      │   toasts     │      │ - Audit trail│
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  External        │
                    │  Services        │
                    │                  │
                    │ - Email (future) │
                    │ - SMS (future)   │
                    │ - Webhook        │
                    └──────────────────┘
```

## Key Design Decisions

### 1. Aggregation Window
- **Default**: 5 minutes
- **Rationale**: Balance between responsiveness and spam prevention
- **Configurable**: Per alert rule

### 2. Severity-Based Auto-Dismiss
- **Critical**: Never auto-dismiss
- **High**: 7 seconds
- **Medium**: 5 seconds
- **Low**: 3 seconds

### 3. Notification Channels
- **In-app**: Always enabled
- **Email**: High/Critical only by default
- **SMS**: Critical only by default
- **Webhook**: Configurable per rule

### 4. Alert Status Transitions
```
Active → Acknowledged → Resolved (normal flow)
Active → Snoozed → Active (temporary hide)
Active → Resolved (quick resolution)
```

### 5. Data Retention
- **Active/Acknowledged**: Indefinite
- **Resolved**: 90 days (configurable)
- **Snoozed**: Until reactivation or resolution
