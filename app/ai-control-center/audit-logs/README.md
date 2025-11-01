# AI Control Center - Audit Logs

## Overview

The Audit Logs page provides comprehensive monitoring, filtering, and analysis of all AI operations in the system. This feature is essential for compliance, debugging, and optimization of AI usage.

## Features

### 1. Advanced Filtering
- **Date Range**: Filter logs by start and end date/time
- **Model Selection**: Filter by specific AI models (Gemini Pro, Gemini Pro Vision)
- **Operation Type**: Filter by operation type (search, analysis, forecast, pricing, OCR, etc.)
- **Status**: Filter by operation status (success, error, timeout, rate-limited)
- **Confidence Range**: Filter by confidence score (0-100%)
- **User Filter**: Filter by user ID
- **Page Size**: Configurable pagination (25, 50, 100, 200 rows)

### 2. Searchable Log Table
- Real-time log display with pagination
- Sortable columns
- Color-coded status indicators
- Confidence score visualization
- Execution time tracking
- Automatic flagging of suspicious activities

### 3. Suspicious Activity Detection
Logs are automatically flagged as suspicious if they meet any of these criteria:
- Low confidence (<50%) with error status
- Repeated errors from the same model within 1 hour (3+ errors)
- Unusually long execution times (>5000ms)

Visual indicators:
- ⚠️ Warning icon for suspicious logs
- Red background highlight for flagged entries

### 4. Log Detail Modal
Click the eye icon on any log entry to view detailed information:
- **Summary Cards**: Quick metrics (execution time, confidence, cost, status)
- **Operation Information**: Complete metadata about the operation
- **Error Details**: Full error messages and codes (if applicable)
- **Data Tabs**:
  - Input Data: Sanitized input sent to the AI model
  - Output Data: Response from the AI model
  - Metadata: Additional context and tracking information
- **Copy to Clipboard**: Easy copying of data for debugging

### 5. Export Functionality
Export logs in multiple formats:
- **CSV**: For spreadsheet analysis
- **JSON**: For programmatic processing
- **Excel**: For advanced reporting

Export respects all active filters, allowing targeted data extraction.

### 6. Analytics Dashboard
Toggle the analytics view to see:

#### Overview Stats
- Total operations count
- Success rate percentage
- Average confidence score
- Total estimated cost

#### Operations by Type
- Visual breakdown of operation types
- Percentage distribution
- Count for each operation type

#### Operations by Model
- Usage distribution across AI models
- Percentage and count per model

#### Confidence Distribution
- High confidence (80-100%)
- Medium confidence (50-79%)
- Low confidence (0-49%)

#### Performance Metrics
- Average execution time
- Error rate percentage
- Performance indicators (Fast/Normal/Slow)

#### Top Errors
- Most common error messages
- Error frequency counts

#### Peak Usage Hours
- Busiest times for AI operations
- Visual representation of usage patterns

## Usage

### Accessing the Page
1. Navigate to AI Control Center
2. Click "View All Logs" button in the Activity Feed section
3. Or use keyboard shortcut: `Ctrl+F` (or `Cmd+F` on Mac)

### Filtering Logs
1. Click "Show" in the Filters section
2. Set your desired filters:
   - Date range for time-based filtering
   - Model and operation type for specific AI operations
   - Status for success/error analysis
   - Confidence range for quality assessment
3. Logs update automatically when filters change
4. Click "Reset" to clear all filters

### Viewing Log Details
1. Find the log entry you want to inspect
2. Click the eye icon (👁️) in the Actions column
3. Review the detailed information in the modal
4. Use tabs to switch between Input, Output, and Metadata
5. Click copy icons to copy data to clipboard
6. Click "Close" to return to the log list

### Exporting Logs
1. Set filters to narrow down the logs you want to export
2. Click the "Export" dropdown in the header
3. Select format: CSV, JSON, or Excel
4. File will download automatically with timestamp in filename

### Analyzing Trends
1. Click "Show Analytics" to display the analytics dashboard
2. Review overview metrics for quick insights
3. Examine operation distribution charts
4. Check confidence distribution for quality assessment
5. Review peak usage hours for capacity planning
6. Identify top errors for troubleshooting

## Permissions

Access to the Audit Logs page requires:
- `ACCESS_AI_CONTROL_CENTER` permission
- User roles: `AI_ADMIN`, `AI_OPERATOR`, or `AI_AUDITOR`

## Technical Details

### Data Sanitization
All logs automatically sanitize PHI/PII before storage:
- Email addresses → `[EMAIL_REDACTED]`
- Phone numbers → `[PHONE_REDACTED]`
- National IDs → `[ID_REDACTED]`
- Medical record numbers → `[MRN_REDACTED]`
- IP addresses → `[IP_REDACTED]`

### Performance
- Pagination prevents loading large datasets
- Configurable page sizes (25-200 rows)
- Efficient filtering at the database level
- Lazy loading of analytics data

### Keyboard Shortcuts
- `Ctrl+R` (or `Cmd+R`): Refresh logs
- `Ctrl+F` (or `Cmd+F`): Navigate to audit logs (from main page)
- `Ctrl+E` (or `Cmd+E`): Export logs (planned)

## Compliance Features

### Audit Trail
Every AI operation is logged with:
- Timestamp (precise to milliseconds)
- User identification
- Model and version used
- Input/output data (sanitized)
- Performance metrics
- Cost tracking

### Retention
Logs are retained according to the configured retention policy:
- Default: 365 days
- Configurable per operation type
- Archive before delete option available

### Security
- All sensitive data is sanitized before logging
- Access controlled by role-based permissions
- Audit logs themselves are immutable
- Export functionality tracks who exported what data

## Troubleshooting

### No Logs Displayed
- Check if filters are too restrictive
- Verify date range includes recent activity
- Ensure AI operations have been performed
- Click "Reset" to clear all filters

### Suspicious Activity Flags
If you see many flagged logs:
1. Review the specific logs for patterns
2. Check error messages for common issues
3. Verify API connectivity and rate limits
4. Review model configuration settings
5. Consider adjusting confidence thresholds

### Export Issues
- Ensure you have sufficient permissions
- Check browser's download settings
- Verify disk space for large exports
- Try smaller date ranges for very large datasets

### Performance Issues
- Reduce page size for faster loading
- Use more specific filters to narrow results
- Consider exporting data for offline analysis
- Check network connectivity

## Best Practices

1. **Regular Monitoring**: Review logs daily for anomalies
2. **Filter Strategically**: Use filters to focus on specific issues
3. **Export for Analysis**: Export data for trend analysis in external tools
4. **Track Costs**: Monitor estimated costs to stay within budget
5. **Review Errors**: Investigate error patterns to improve reliability
6. **Optimize Confidence**: Track confidence scores to improve model performance
7. **Capacity Planning**: Use peak usage hours to plan infrastructure

## Related Documentation

- [AI Control Center Overview](../README.md)
- [Activity Logger Service](../../../services/ai/activity-logger.ts)
- [AI Configuration Management](../../../docs/AI_CONFIGURATION.md)
- [Security and Compliance](../../../docs/SECURITY.md)
