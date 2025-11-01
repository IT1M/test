# Automation Rule Management

## Overview

The Automation Rule Management system provides a visual interface for creating, managing, and monitoring automated workflows and AI operations. This feature enables users to define rules that automatically trigger actions based on events, schedules, or conditions.

## Components

### AutomationRuleBuilder

A comprehensive visual rule builder that allows users to configure automation rules with:

- **Rule Information**: Name and description
- **Trigger Configuration**: Event-based, schedule-based, or condition-based triggers
- **Action Definition**: Multiple action types including AI operations, database updates, notifications, and task creation
- **Testing Functionality**: Test rules with sample data before deployment
- **Validation**: Ensures rules are properly configured before saving

#### Trigger Types

1. **Event-Based Triggers**
   - Order Created
   - Product Low Stock
   - Product Expired
   - Payment Received
   - Customer Registered
   - AI Call Completed
   - AI Error

2. **Schedule-Based Triggers**
   - Uses cron expression format
   - Examples:
     - `0 9 * * *` - Daily at 9 AM
     - `0 */6 * * *` - Every 6 hours
     - `0 0 * * 1` - Every Monday at midnight

3. **Condition-Based Triggers**
   - Field-based conditions
   - Operators: equals, not-equals, greater-than, less-than, contains
   - Dynamic value comparison

#### Action Types

1. **AI Operation**
   - Model selection (Gemini Pro, Gemini Pro Vision)
   - Custom AI prompts with parameter mapping
   - Automatic result handling

2. **Update Database**
   - Entity selection (Products, Orders, Customers, Inventory)
   - Operation type (Create, Update, Delete)
   - Field mapping for updates

3. **Send Notification**
   - Custom title and message
   - Template variable support (e.g., {{productName}}, {{orderId}})
   - Real-time delivery

4. **Create Task**
   - Task title and description
   - Automatic assignment
   - Priority setting

### AutomationRuleList

A comprehensive list view for managing all automation rules with:

- **Rule Status Display**: Active, Paused, Ready, or Error states
- **Execution Metrics**: Total executions, success rate, failures
- **Performance Tracking**: Average execution time, last run timestamp
- **Quick Actions**: Pause/Resume, Edit, Delete
- **Visual Indicators**: Color-coded status badges and health indicators

#### Metrics Displayed

- **Total Executions**: Number of times the rule has been triggered
- **Success Rate**: Percentage of successful executions
- **Successful Executions**: Count of successful runs
- **Failed Executions**: Count of failed runs
- **Last Run**: Time since last execution
- **Average Execution Time**: Performance metric in milliseconds

### Automation Page

A full-featured page that combines both components with:

- **List View**: Browse and manage all automation rules
- **Create View**: Build new automation rules
- **Edit View**: Modify existing rules
- **State Management**: Local state with mock data for demonstration
- **Toast Notifications**: User feedback for all actions

## Usage Examples

### Example 1: Low Stock Alert

```typescript
{
  name: 'Low Stock Alert',
  description: 'Send notification when product stock falls below reorder level',
  trigger: {
    type: 'condition',
    conditionField: 'stockQuantity',
    conditionOperator: 'less-than',
    conditionValue: 'reorderLevel'
  },
  actions: [
    {
      type: 'send-notification',
      notificationTitle: 'Low Stock Alert',
      notificationMessage: 'Product {{productName}} is running low on stock'
    },
    {
      type: 'ai-operation',
      aiModel: 'gemini-pro',
      aiPrompt: 'Analyze historical sales data and recommend optimal reorder quantity'
    }
  ]
}
```

### Example 2: Daily Sales Summary

```typescript
{
  name: 'Daily Sales Summary',
  description: 'Generate AI-powered sales summary every morning',
  trigger: {
    type: 'schedule',
    scheduleExpression: '0 9 * * *'
  },
  actions: [
    {
      type: 'ai-operation',
      aiModel: 'gemini-pro',
      aiPrompt: 'Generate a comprehensive sales summary for yesterday'
    },
    {
      type: 'send-notification',
      notificationTitle: 'Daily Sales Summary',
      notificationMessage: 'Your daily sales summary is ready'
    }
  ]
}
```

### Example 3: Order Confirmation

```typescript
{
  name: 'Order Confirmation',
  description: 'Automatically send confirmation when new order is created',
  trigger: {
    type: 'event',
    eventType: 'order-created'
  },
  actions: [
    {
      type: 'send-notification',
      notificationTitle: 'Order Confirmed',
      notificationMessage: 'Order {{orderId}} has been confirmed'
    },
    {
      type: 'update-db',
      dbEntity: 'orders',
      dbOperation: 'update',
      dbFields: { status: 'confirmed' }
    }
  ]
}
```

## Features

### Visual Rule Builder

- Intuitive drag-and-drop interface (conceptual)
- Step-by-step configuration
- Real-time validation
- Preview functionality

### Rule Testing

- Test rules with sample data
- Simulate execution without affecting production
- View test results and logs
- Identify configuration issues before deployment

### Execution Monitoring

- Real-time execution tracking
- Success/failure metrics
- Performance monitoring
- Error logging and alerts

### Rule Management

- Pause/Resume rules without deletion
- Edit rules while preserving history
- Delete rules with confirmation
- Bulk operations support (future enhancement)

## Integration Points

### Database Integration

Rules can interact with the following entities:
- Products
- Orders
- Customers
- Inventory
- Patients
- Medical Records

### AI Integration

Rules can trigger AI operations using:
- Gemini Pro for text generation and analysis
- Gemini Pro Vision for image analysis
- Custom prompts with parameter mapping
- Automatic result processing

### Notification System

Rules can send notifications through:
- In-app notifications
- Email (future enhancement)
- SMS (future enhancement)
- Push notifications (future enhancement)

## Best Practices

1. **Naming Conventions**
   - Use descriptive names that clearly indicate the rule's purpose
   - Include the trigger type in the name (e.g., "Daily...", "On Order...")

2. **Testing**
   - Always test rules before enabling them
   - Use sample data that represents real scenarios
   - Monitor initial executions closely

3. **Performance**
   - Avoid creating too many condition-based rules
   - Use schedule-based triggers for batch operations
   - Monitor execution times and optimize as needed

4. **Error Handling**
   - Configure fallback actions for critical rules
   - Set up alerts for failed executions
   - Review error logs regularly

5. **Maintenance**
   - Regularly review rule performance metrics
   - Disable unused rules
   - Update rules when business logic changes
   - Document complex rule configurations

## Future Enhancements

- Rule templates for common scenarios
- Advanced condition builder with AND/OR logic
- Rule dependencies and chaining
- Execution history and audit trail
- Rule versioning and rollback
- A/B testing for rules
- Rule performance optimization suggestions
- Export/import rule configurations
- Rule scheduling with time windows
- Advanced filtering and search in rule list

## Technical Details

### Type Definitions

```typescript
type TriggerType = 'event' | 'schedule' | 'condition';
type ActionType = 'update-db' | 'send-notification' | 'create-task' | 'ai-operation';
type AIModel = 'gemini-pro' | 'gemini-pro-vision';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Component Props

```typescript
// AutomationRuleBuilder
interface AutomationRuleBuilderProps {
  rule?: AutomationRule;
  onSave: (rule: Partial<AutomationRule>) => void;
  onTest?: (rule: Partial<AutomationRule>) => Promise<void>;
  onCancel: () => void;
}

// AutomationRuleList
interface AutomationRuleListProps {
  rules: AutomationRuleWithMetrics[];
  onToggle: (ruleId: string, enabled: boolean) => void;
  onEdit: (rule: AutomationRuleWithMetrics) => void;
  onDelete: (ruleId: string) => void;
  onCreate: () => void;
}
```

## Requirements Satisfied

This implementation satisfies the following requirements:

- **23.26**: Visual rule builder with intuitive interface
- **23.27**: Trigger selection UI supporting event-based, schedule-based, and condition-based triggers
- **23.28**: AI operation configuration interface with model selection and parameter mapping
- **23.29**: Action definition UI with multiple action types
- **23.30**: Rule testing functionality with sample data simulation
- **23.31**: Rule list showing all rules with status and metrics
- **23.32**: Rule execution monitoring with success/failure tracking
- **23.33**: Pause/resume controls for rules
- **23.34**: Edit functionality with confirmation
- **23.35**: Delete controls with confirmation dialogs

## Conclusion

The Automation Rule Management system provides a powerful and flexible way to automate workflows and AI operations. With its visual interface, comprehensive monitoring, and extensive configuration options, it enables users to streamline their processes and improve operational efficiency.
