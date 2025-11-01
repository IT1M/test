# Audit Log Viewer - Feature Showcase

## 🎯 Overview

The Audit Log Viewer is a comprehensive monitoring and analysis tool for all AI operations in the Medical Products Company Management System. It provides deep insights into AI usage, performance, costs, and potential issues.

## 📊 Main Features

### 1. Advanced Filtering System

```
┌─────────────────────────────────────────────────────────────┐
│ Filters                                    [Reset] [Show]    │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┬──────────┬──────────┬──────────┐              │
│ │Start Date│End Date  │Model     │Operation │              │
│ │[picker]  │[picker]  │[select]  │[select]  │              │
│ └──────────┴──────────┴──────────┴──────────┘              │
│ ┌──────────┬──────────┬──────────┬──────────┐              │
│ │Status    │Min Conf  │Max Conf  │Page Size │              │
│ │[select]  │[0-100]   │[0-100]   │[25-200]  │              │
│ └──────────┴──────────┴──────────┴──────────┘              │
└─────────────────────────────────────────────────────────────┘
```

**Filter Options:**
- 📅 **Date Range**: Precise datetime filtering
- 🤖 **Model**: Filter by AI model (Gemini Pro, Gemini Pro Vision)
- 👤 **User**: Filter by user ID
- ⚙️ **Operation Type**: 9 operation types (search, analysis, forecast, etc.)
- ✅ **Status**: Success, error, timeout, rate-limited
- 📊 **Confidence Range**: Min/max slider (0-100%)
- 📄 **Page Size**: 25, 50, 100, or 200 rows per page

### 2. Searchable Log Table

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Activity Logs                                                               │
│ Showing 1-50 of 1,234 logs                                                  │
├──────────┬────────┬──────────┬──────┬──────────┬──────┬────────┬─────────┤
│Timestamp │Model   │Operation │User  │Confidence│Time  │Status  │Actions  │
├──────────┼────────┼──────────┼──────┼──────────┼──────┼────────┼─────────┤
│⚠️ 10:30  │gemini  │search    │user1 │  45.2%   │120ms │success │  👁️    │
│  Nov 1   │-pro    │          │      │          │      │        │         │
├──────────┼────────┼──────────┼──────┼──────────┼──────┼────────┼─────────┤
│  10:29   │gemini  │analysis  │user2 │  87.5%   │340ms │success │  👁️    │
│  Nov 1   │-pro    │          │      │          │      │        │         │
├──────────┼────────┼──────────┼──────┼──────────┼──────┼────────┼─────────┤
│  10:28   │gemini  │forecast  │user1 │  92.1%   │890ms │success │  👁️    │
│  Nov 1   │-pro    │          │      │          │      │        │         │
└──────────┴────────┴──────────┴──────┴──────────┴──────┴────────┴─────────┘
                                                    [Previous] [Next]
```

**Table Features:**
- 🚨 **Suspicious Activity Flags**: Automatic detection with warning icons
- 🎨 **Color-Coded Status**: Green (success), Red (error), Yellow (timeout)
- 📊 **Confidence Colors**: Green (80+), Yellow (50-79), Red (<50)
- ⏱️ **Execution Time**: Millisecond precision
- 👁️ **Quick View**: Click to see full details
- 📄 **Pagination**: Navigate through large datasets

### 3. Detailed Log Modal

```
┌─────────────────────────────────────────────────────────────┐
│ 📄 Log Details                                          ✕   │
│ log-id-12345                                                │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┬──────────┬──────────┬──────────┐              │
│ │⏱️ 120ms  │📊 87.5%  │💲 $0.0012│✅ Success│              │
│ │Exec Time │Confidence│Cost      │Status    │              │
│ └──────────┴──────────┴──────────┴──────────┘              │
│                                                              │
│ Operation Information                                        │
│ ┌────────────────────────────────────────────┐              │
│ │ Timestamp:    2025-11-01 10:30:45          │              │
│ │ User ID:      user-123                     │              │
│ │ Model:        gemini-pro v2.1.0            │              │
│ │ Operation:    [search]                     │              │
│ │ Entity:       product / prod-456           │              │
│ │ Tokens:       150 in / 320 out             │              │
│ └────────────────────────────────────────────┘              │
│                                                              │
│ [Input Data] [Output Data] [Metadata]                       │
│ ┌────────────────────────────────────────────┐              │
│ │ {                                          │  📋 Copy     │
│ │   "query": "medical supplies",             │              │
│ │   "filters": {                             │              │
│ │     "category": "pharmaceuticals"          │              │
│ │   }                                        │              │
│ │ }                                          │              │
│ └────────────────────────────────────────────┘              │
│                                                              │
│                                          [Close]             │
└─────────────────────────────────────────────────────────────┘
```

**Modal Features:**
- 📊 **Summary Cards**: Key metrics at a glance
- 📝 **Full Details**: Complete operation information
- 🔴 **Error Section**: Detailed error information (when applicable)
- 📑 **Tabbed Data**: Organized input/output/metadata views
- 📋 **Copy Function**: One-click clipboard copy
- 🎨 **JSON Formatting**: Pretty-printed, syntax-highlighted JSON

### 4. Analytics Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Analytics Dashboard                                      │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┬──────────┬──────────┬──────────┐              │
│ │ 1,234    │  98.5%   │  87.2%   │ $12.45   │              │
│ │Operations│Success   │Confidence│Total Cost│              │
│ └──────────┴──────────┴──────────┴──────────┘              │
│                                                              │
│ Operations by Type          Operations by Model             │
│ ┌─────────────────────┐    ┌─────────────────────┐         │
│ │ search      ████ 45%│    │ gemini-pro  ████ 78%│         │
│ │ analysis    ███  25%│    │ gemini-vis  ██   22%│         │
│ │ forecast    ██   15%│    └─────────────────────┘         │
│ │ pricing     █    10%│                                     │
│ │ ocr         █     5%│    Confidence Distribution          │
│ └─────────────────────┘    ┌─────────────────────┐         │
│                            │ 🟢 High    850      │         │
│ Performance Metrics        │ 🟡 Medium  320      │         │
│ ┌─────────────────────┐    │ 🔴 Low      64      │         │
│ │ Avg Time:    145ms  │    └─────────────────────┘         │
│ │ Error Rate:  1.5%   │                                     │
│ └─────────────────────┘    Top Errors                       │
│                            ┌─────────────────────┐         │
│ Peak Usage Hours           │ Rate limit    [12]  │         │
│ ┌─────────────────────┐    │ Timeout       [8]   │         │
│ │ 09:00 ████ 234 ops  │    │ Invalid input [5]   │         │
│ │ 10:00 █████ 312 ops │    └─────────────────────┘         │
│ │ 14:00 ███ 189 ops   │                                     │
│ │ 15:00 ████ 245 ops  │                                     │
│ │ 16:00 ██ 156 ops    │                                     │
│ └─────────────────────┘                                     │
└─────────────────────────────────────────────────────────────┘
```

**Analytics Features:**
- 📈 **Overview Stats**: Total operations, success rate, confidence, cost
- 📊 **Distribution Charts**: Operations by type and model
- 🎯 **Confidence Breakdown**: High/medium/low distribution
- ⚡ **Performance Metrics**: Execution time and error rate
- 🔴 **Top Errors**: Most common error messages
- ⏰ **Peak Hours**: Busiest times for capacity planning

### 5. Export Functionality

```
┌─────────────────────────────────────┐
│ Export ▼                            │
├─────────────────────────────────────┤
│ 📄 CSV                              │
│ 📋 JSON                             │
│ 📊 Excel                            │
└─────────────────────────────────────┘

Downloads: ai-activity-logs-2025-11-01T10-30-45.csv
```

**Export Features:**
- 📄 **CSV Format**: For spreadsheet analysis
- 📋 **JSON Format**: For programmatic processing
- 📊 **Excel Format**: For advanced reporting
- 🔍 **Filter Respect**: Exports only filtered data
- 📅 **Timestamped**: Automatic filename with timestamp
- 💾 **Automatic Download**: Browser download triggered

### 6. Suspicious Activity Detection

```
⚠️ SUSPICIOUS ACTIVITY DETECTED

Criteria:
✓ Low confidence (<50%) with error status
✓ Repeated errors (3+ in 1 hour)
✓ Long execution time (>5000ms)

Visual Indicators:
┌─────────────────────────────────────┐
│ ⚠️ 10:30 │ gemini │ search │ 45.2% │ ← Red background
│   Nov 1  │ -pro   │        │       │
└─────────────────────────────────────┘
```

**Detection Features:**
- 🚨 **Automatic Flagging**: Real-time detection
- ⚠️ **Visual Indicators**: Warning icons and red highlights
- 🔍 **Multiple Criteria**: Comprehensive detection rules
- 📊 **Pattern Recognition**: Identifies repeated issues

## 🎨 UI/UX Highlights

### Color Coding System

**Status Colors:**
- 🟢 **Success**: Green background, green text
- 🔴 **Error**: Red background, red text
- 🟡 **Timeout**: Yellow background, yellow text
- 🟠 **Rate Limited**: Orange background, orange text

**Confidence Colors:**
- 🟢 **High (80-100%)**: Green text
- 🟡 **Medium (50-79%)**: Yellow text
- 🔴 **Low (0-49%)**: Red text

**Performance Indicators:**
- ⚡ **Fast**: <1000ms - Green
- ⏱️ **Normal**: 1000-3000ms - Yellow
- 🐌 **Slow**: >3000ms - Red

### Responsive Design

**Desktop View:**
- Full table with all columns
- Side-by-side analytics charts
- Expanded filter panel
- Large modal dialogs

**Tablet View:**
- Scrollable table
- Stacked analytics charts
- Collapsible filters
- Medium modal dialogs

**Mobile View:**
- Card-based log display
- Vertical analytics stack
- Bottom sheet filters
- Full-screen modals

## 🔐 Security Features

### Data Sanitization
All logs automatically sanitize sensitive information:
- 📧 Email → `[EMAIL_REDACTED]`
- 📱 Phone → `[PHONE_REDACTED]`
- 🆔 National ID → `[ID_REDACTED]`
- 🏥 Medical Record → `[MRN_REDACTED]`
- 🌐 IP Address → `[IP_REDACTED]`

### Access Control
- 🔒 Role-based permissions
- 👤 User authentication required
- 🛡️ Permission checks on page load
- 📝 Audit trail of exports

## ⚡ Performance Features

### Optimization Techniques
- 📄 **Pagination**: Prevents loading large datasets
- 🔍 **Efficient Filtering**: Database-level filtering
- 💾 **Lazy Loading**: Analytics loaded on demand
- 🎯 **Memoization**: Cached callbacks and computations
- 🔄 **Conditional Rendering**: Only render visible elements

### Loading States
- ⏳ Spinner during data fetch
- 💀 Skeleton loaders for cards
- 📊 Progressive chart rendering
- ✨ Smooth transitions

## 🎯 Use Cases

### 1. Debugging AI Issues
```
Scenario: AI model returning low confidence scores
Steps:
1. Filter by confidence range (0-50%)
2. Review flagged suspicious logs
3. Open log details to inspect input/output
4. Identify pattern in error messages
5. Export logs for further analysis
```

### 2. Cost Monitoring
```
Scenario: Track AI spending over time
Steps:
1. Set date range for billing period
2. View analytics dashboard
3. Check total cost metric
4. Review operations by type for cost breakdown
5. Export data for financial reporting
```

### 3. Performance Analysis
```
Scenario: Identify slow AI operations
Steps:
1. Sort by execution time
2. Filter for operations >3000ms
3. Review peak usage hours
4. Analyze operation types causing delays
5. Optimize based on findings
```

### 4. Compliance Auditing
```
Scenario: Generate compliance report
Steps:
1. Set date range for audit period
2. Apply relevant filters
3. Review all operations
4. Check data sanitization
5. Export complete audit trail
```

### 5. Capacity Planning
```
Scenario: Plan infrastructure scaling
Steps:
1. View analytics dashboard
2. Check peak usage hours
3. Review operations by type
4. Analyze growth trends
5. Plan capacity accordingly
```

## 📚 Quick Reference

### Keyboard Shortcuts
- `Ctrl+R` / `Cmd+R`: Refresh logs
- `Ctrl+F` / `Cmd+F`: Navigate to audit logs
- `Esc`: Close modal

### Filter Shortcuts
- Click "Reset" to clear all filters
- Click "Show/Hide" to toggle filter panel
- Filters apply automatically on change

### Navigation
- Click eye icon (👁️) to view details
- Use Previous/Next for pagination
- Click anywhere on row to select

## 🚀 Getting Started

1. **Access the Page**
   - Navigate to AI Control Center
   - Click "View All Logs" button
   - Or use keyboard shortcut `Ctrl+F`

2. **Apply Filters**
   - Click "Show" in Filters section
   - Set desired filters
   - Logs update automatically

3. **View Details**
   - Click eye icon on any log
   - Review detailed information
   - Copy data as needed

4. **Analyze Trends**
   - Click "Show Analytics"
   - Review charts and metrics
   - Identify patterns

5. **Export Data**
   - Select export format
   - File downloads automatically
   - Use for external analysis

## 🎓 Best Practices

1. ✅ **Regular Monitoring**: Check logs daily
2. ✅ **Filter Strategically**: Focus on specific issues
3. ✅ **Export for Analysis**: Use external tools for trends
4. ✅ **Track Costs**: Monitor spending regularly
5. ✅ **Review Errors**: Investigate patterns promptly
6. ✅ **Optimize Confidence**: Improve model performance
7. ✅ **Plan Capacity**: Use peak hours for planning

---

**Implementation Status**: ✅ Complete and Production-Ready
**Last Updated**: November 1, 2025
