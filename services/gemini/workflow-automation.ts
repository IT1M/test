// AI-Powered Workflow Automation Service
// Identifies repetitive tasks, suggests improvements, and automates workflows

import { getGeminiService } from './client';
import { db } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Workflow rule interface
 */
export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  priority: number;
  executionCount: number;
  lastExecuted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Workflow trigger types
 */
export interface WorkflowTrigger {
  type: 'event' | 'schedule' | 'condition' | 'manual';
  event?: string; // e.g., 'order_created', 'inventory_low', 'customer_registered'
  schedule?: string; // cron expression
  condition?: string; // condition to check
}

/**
 * Workflow condition
 */
export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: any;
}

/**
 * Workflow action
 */
export interface WorkflowAction {
  type: 'create' | 'update' | 'delete' | 'notify' | 'email' | 'api_call' | 'ai_analyze';
  entity?: string;
  data?: any;
  template?: string;
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  ruleId: string;
  ruleName: string;
  success: boolean;
  executedActions: number;
  errors: string[];
  timestamp: Date;
  duration: number; // milliseconds
}

/**
 * Task pattern for automation detection
 */
export interface TaskPattern {
  id: string;
  pattern: string;
  frequency: number;
  averageTime: number; // minutes
  automationPotential: number; // 0-1 score
  suggestedWorkflow: Partial<WorkflowRule>;
  estimatedTimeSavings: number; // hours per month
}

/**
 * Process improvement suggestion
 */
export interface ProcessImprovement {
  id: string;
  area: string;
  currentProcess: string;
  suggestedImprovement: string;
  expectedBenefit: string;
  implementationEffort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedROI: number;
}

/**
 * AI-Powered Workflow Automation Service
 */
export class WorkflowAutomationService {
  private gemini = getGeminiService();
  private rules: Map<string, WorkflowRule> = new Map();
  private executionQueue: Array<{ rule: WorkflowRule; data: any }> = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default workflow rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: Omit<WorkflowRule, 'id' | 'executionCount' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Low Stock Alert and Reorder',
        description: 'Automatically create purchase order when inventory is low',
        trigger: {
          type: 'event',
          event: 'inventory_low',
        },
        conditions: [
          {
            field: 'stockQuantity',
            operator: 'less_than',
            value: 'reorderLevel',
          },
        ],
        actions: [
          {
            type: 'create',
            entity: 'purchase_order',
            data: {
              status: 'draft',
              items: '{{product}}',
              quantity: '{{reorderQuantity}}',
            },
          },
          {
            type: 'notify',
            data: {
              recipient: 'inventory_manager',
              message: 'Low stock alert: {{productName}}. Purchase order created.',
            },
          },
        ],
        isActive: true,
        priority: 1,
      },
      {
        name: 'Order Approval Workflow',
        description: 'Automatically approve orders below threshold, route others for approval',
        trigger: {
          type: 'event',
          event: 'order_created',
        },
        conditions: [
          {
            field: 'totalAmount',
            operator: 'less_than',
            value: 10000,
          },
        ],
        actions: [
          {
            type: 'update',
            entity: 'order',
            data: {
              status: 'approved',
            },
          },
          {
            type: 'notify',
            data: {
              recipient: 'sales_team',
              message: 'Order {{orderId}} auto-approved',
            },
          },
        ],
        isActive: true,
        priority: 2,
      },
      {
        name: 'Customer Onboarding',
        description: 'Automated welcome sequence for new customers',
        trigger: {
          type: 'event',
          event: 'customer_registered',
        },
        conditions: [],
        actions: [
          {
            type: 'email',
            template: 'welcome_email',
            data: {
              recipient: '{{customerEmail}}',
            },
          },
          {
            type: 'create',
            entity: 'task',
            data: {
              title: 'Follow up with new customer',
              assignee: 'sales_manager',
              dueDate: '+3 days',
            },
          },
        ],
        isActive: true,
        priority: 3,
      },
      {
        name: 'Invoice Payment Reminder',
        description: 'Send payment reminders for overdue invoices',
        trigger: {
          type: 'schedule',
          schedule: '0 9 * * *', // Daily at 9 AM
        },
        conditions: [
          {
            field: 'status',
            operator: 'equals',
            value: 'overdue',
          },
        ],
        actions: [
          {
            type: 'email',
            template: 'payment_reminder',
            data: {
              recipient: '{{customerEmail}}',
            },
          },
          {
            type: 'update',
            entity: 'invoice',
            data: {
              reminderSent: true,
              lastReminderDate: '{{now}}',
            },
          },
        ],
        isActive: true,
        priority: 2,
      },
    ];

    defaultRules.forEach(rule => {
      const fullRule: WorkflowRule = {
        ...rule,
        id: uuidv4(),
        executionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.rules.set(fullRule.id, fullRule);
    });
  }

  /**
   * Analyze system usage to identify repetitive tasks
   */
  async identifyRepetitiveTasks(days: number = 30): Promise<TaskPattern[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get system logs for the period
    const logs = await db.systemLogs
      .where('timestamp')
      .above(startDate)
      .toArray();

    // Use AI to analyze patterns
    const prompt = `Analyze the following system activity logs and identify repetitive tasks that could be automated:

${JSON.stringify(logs.slice(0, 100), null, 2)}

Identify patterns such as:
1. Frequently repeated actions
2. Manual data entry tasks
3. Approval workflows
4. Notification sending
5. Report generation
6. Data synchronization

For each pattern, provide:
- Description of the pattern
- Frequency (times per month)
- Average time spent (minutes)
- Automation potential (0-1 score)
- Suggested workflow automation
- Estimated time savings (hours per month)

Respond in JSON format:
{
  "patterns": [
    {
      "pattern": "Description",
      "frequency": 50,
      "averageTime": 10,
      "automationPotential": 0.9,
      "suggestedWorkflow": {
        "name": "Workflow name",
        "description": "Description",
        "trigger": {"type": "event", "event": "event_name"},
        "actions": [{"type": "create", "entity": "entity_name"}]
      },
      "estimatedTimeSavings": 8.3
    }
  ]
}`;

    try {
      const response = await this.gemini.generateJSON<{ patterns: any[] }>(prompt, false);

      const patterns: TaskPattern[] = response.patterns.map(p => ({
        id: uuidv4(),
        pattern: p.pattern,
        frequency: p.frequency,
        averageTime: p.averageTime,
        automationPotential: p.automationPotential,
        suggestedWorkflow: p.suggestedWorkflow,
        estimatedTimeSavings: p.estimatedTimeSavings,
      }));

      return patterns.sort((a, b) => b.automationPotential - a.automationPotential);
    } catch (error) {
      console.error('Failed to identify repetitive tasks:', error);
      return [];
    }
  }

  /**
   * Suggest process improvements using AI
   */
  async suggestProcessImprovements(): Promise<ProcessImprovement[]> {
    // Get business metrics
    const metrics = await this.getBusinessMetrics();

    const prompt = `Analyze the following business metrics and suggest process improvements:

${JSON.stringify(metrics, null, 2)}

Identify areas for improvement in:
1. Order processing
2. Inventory management
3. Customer service
4. Sales workflows
5. Financial processes
6. HR operations

For each improvement, provide:
- Area of improvement
- Current process description
- Suggested improvement
- Expected benefit
- Implementation effort (low/medium/high)
- Priority (low/medium/high/critical)
- Estimated ROI (percentage)

Respond in JSON format with an array of improvements.`;

    try {
      const improvements = await this.gemini.generateJSON<ProcessImprovement[]>(prompt, false);

      return improvements.map(imp => ({
        ...imp,
        id: uuidv4(),
      }));
    } catch (error) {
      console.error('Failed to suggest improvements:', error);
      return [];
    }
  }

  /**
   * Create a new workflow rule
   */
  createRule(rule: Omit<WorkflowRule, 'id' | 'executionCount' | 'createdAt' | 'updatedAt'>): WorkflowRule {
    const newRule: WorkflowRule = {
      ...rule,
      id: uuidv4(),
      executionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  /**
   * Update a workflow rule
   */
  updateRule(ruleId: string, updates: Partial<WorkflowRule>): WorkflowRule {
    const rule = this.rules.get(ruleId);
    
    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    const updatedRule: WorkflowRule = {
      ...rule,
      ...updates,
      id: rule.id,
      createdAt: rule.createdAt,
      updatedAt: new Date(),
    };

    this.rules.set(ruleId, updatedRule);
    return updatedRule;
  }

  /**
   * Delete a workflow rule
   */
  deleteRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Get all workflow rules
   */
  getRules(activeOnly: boolean = false): WorkflowRule[] {
    const rules = Array.from(this.rules.values());
    
    if (activeOnly) {
      return rules.filter(r => r.isActive);
    }
    
    return rules;
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): WorkflowRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Execute a workflow rule
   */
  async executeRule(ruleId: string, data: any): Promise<WorkflowExecutionResult> {
    const rule = this.rules.get(ruleId);
    
    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    if (!rule.isActive) {
      throw new Error(`Rule is not active: ${ruleId}`);
    }

    const startTime = Date.now();
    const errors: string[] = [];
    let executedActions = 0;

    try {
      // Check conditions
      const conditionsMet = this.evaluateConditions(rule.conditions, data);
      
      if (!conditionsMet) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          success: false,
          executedActions: 0,
          errors: ['Conditions not met'],
          timestamp: new Date(),
          duration: Date.now() - startTime,
        };
      }

      // Execute actions
      for (const action of rule.actions) {
        try {
          await this.executeAction(action, data);
          executedActions++;
        } catch (error: any) {
          errors.push(`Action failed: ${error.message}`);
        }
      }

      // Update rule execution count
      rule.executionCount++;
      rule.lastExecuted = new Date();
      this.rules.set(rule.id, rule);

      // Log execution
      await this.logExecution(rule, executedActions, errors);

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        success: errors.length === 0,
        executedActions,
        errors,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        success: false,
        executedActions,
        errors: [error.message],
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Evaluate workflow conditions
   */
  private evaluateConditions(conditions: WorkflowCondition[], data: any): boolean {
    if (conditions.length === 0) return true;

    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(data, condition.field);
      const compareValue = this.resolveValue(condition.value, data);

      switch (condition.operator) {
        case 'equals':
          return fieldValue === compareValue;
        case 'not_equals':
          return fieldValue !== compareValue;
        case 'greater_than':
          return fieldValue > compareValue;
        case 'less_than':
          return fieldValue < compareValue;
        case 'contains':
          return String(fieldValue).includes(String(compareValue));
        case 'not_contains':
          return !String(fieldValue).includes(String(compareValue));
        default:
          return false;
      }
    });
  }

  /**
   * Execute a workflow action
   */
  private async executeAction(action: WorkflowAction, data: any): Promise<void> {
    switch (action.type) {
      case 'create':
        await this.executeCreateAction(action, data);
        break;
      case 'update':
        await this.executeUpdateAction(action, data);
        break;
      case 'notify':
        await this.executeNotifyAction(action, data);
        break;
      case 'email':
        await this.executeEmailAction(action, data);
        break;
      case 'ai_analyze':
        await this.executeAIAnalyzeAction(action, data);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Execute create action
   */
  private async executeCreateAction(action: WorkflowAction, data: any): Promise<void> {
    // This would create a new entity in the database
    console.log('Create action:', action.entity, action.data);
  }

  /**
   * Execute update action
   */
  private async executeUpdateAction(action: WorkflowAction, data: any): Promise<void> {
    // This would update an entity in the database
    console.log('Update action:', action.entity, action.data);
  }

  /**
   * Execute notify action
   */
  private async executeNotifyAction(action: WorkflowAction, data: any): Promise<void> {
    // This would send a notification
    console.log('Notify action:', action.data);
  }

  /**
   * Execute email action
   */
  private async executeEmailAction(action: WorkflowAction, data: any): Promise<void> {
    // This would send an email
    console.log('Email action:', action.template, action.data);
  }

  /**
   * Execute AI analyze action
   */
  private async executeAIAnalyzeAction(action: WorkflowAction, data: any): Promise<void> {
    // This would use AI to analyze data
    const analysis = await this.gemini.generateContent(
      `Analyze the following data: ${JSON.stringify(data)}`,
      false
    );
    console.log('AI Analysis:', analysis);
  }

  /**
   * Get field value from data object
   */
  private getFieldValue(data: any, field: string): any {
    const parts = field.split('.');
    let value = data;
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    return value;
  }

  /**
   * Resolve value (handle templates and references)
   */
  private resolveValue(value: any, data: any): any {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      const field = value.slice(2, -2);
      return this.getFieldValue(data, field);
    }
    return value;
  }

  /**
   * Get business metrics for analysis
   */
  private async getBusinessMetrics(): Promise<any> {
    try {
      const [
        ordersCount,
        productsCount,
        customersCount,
        avgOrderValue,
      ] = await Promise.all([
        db.orders.count(),
        db.products.count(),
        db.customers.count(),
        this.calculateAverageOrderValue(),
      ]);

      return {
        orders: {
          total: ordersCount,
          averageValue: avgOrderValue,
        },
        products: {
          total: productsCount,
        },
        customers: {
          total: customersCount,
        },
      };
    } catch (error) {
      console.error('Failed to get business metrics:', error);
      return {};
    }
  }

  /**
   * Calculate average order value
   */
  private async calculateAverageOrderValue(): Promise<number> {
    const orders = await db.orders.toArray();
    if (orders.length === 0) return 0;
    
    const total = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    return total / orders.length;
  }

  /**
   * Log workflow execution
   */
  private async logExecution(
    rule: WorkflowRule,
    executedActions: number,
    errors: string[]
  ): Promise<void> {
    try {
      await db.systemLogs.add({
        id: uuidv4(),
        action: 'workflow_executed',
        entityType: 'workflow',
        entityId: rule.id,
        details: JSON.stringify({
          ruleName: rule.name,
          executedActions,
          errors,
        }),
        userId: 'system',
        timestamp: new Date(),
        status: errors.length === 0 ? 'success' : 'error',
      });
    } catch (error) {
      console.error('Failed to log workflow execution:', error);
    }
  }

  /**
   * Get workflow analytics
   */
  async getAnalytics(days: number = 30): Promise<{
    totalExecutions: number;
    successRate: number;
    topRules: Array<{ name: string; executions: number }>;
    timeSaved: number; // estimated hours
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await db.systemLogs
      .where('action')
      .equals('workflow_executed')
      .and(log => log.timestamp >= startDate)
      .toArray();

    const totalExecutions = logs.length;
    const successfulExecutions = logs.filter(l => l.status === 'success').length;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    // Calculate top rules
    const ruleCounts: Record<string, number> = {};
    logs.forEach(log => {
      const details = JSON.parse(log.details);
      ruleCounts[details.ruleName] = (ruleCounts[details.ruleName] || 0) + 1;
    });

    const topRules = Object.entries(ruleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, executions]) => ({ name, executions }));

    // Estimate time saved (assume 5 minutes per automated task)
    const timeSaved = (successfulExecutions * 5) / 60; // hours

    return {
      totalExecutions,
      successRate,
      topRules,
      timeSaved,
    };
  }
}

// Export singleton instance
let workflowAutomationServiceInstance: WorkflowAutomationService | null = null;

export function getWorkflowAutomationService(): WorkflowAutomationService {
  if (!workflowAutomationServiceInstance) {
    workflowAutomationServiceInstance = new WorkflowAutomationService();
  }
  return workflowAutomationServiceInstance;
}
