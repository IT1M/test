'use client';

import { useState } from 'react';
import { 
  AutomationRuleBuilder, 
  AutomationRuleList
} from '@/components/ai-control';
import type { AutomationRule } from '@/components/ai-control';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

// Extended type with metrics
interface AutomationRuleWithMetrics extends AutomationRule {
  metrics: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    lastExecutionTime?: Date;
    lastExecutionStatus?: 'success' | 'failure';
    averageExecutionTime?: number;
  };
}

// Mock data for demonstration
const mockRules: AutomationRuleWithMetrics[] = [
  {
    id: '1',
    name: 'Low Stock Alert',
    description: 'Send notification when product stock falls below reorder level',
    enabled: true,
    trigger: {
      type: 'condition',
      conditionField: 'stockQuantity',
      conditionOperator: 'less-than',
      conditionValue: 'reorderLevel'
    },
    actions: [
      {
        id: 'a1',
        type: 'send-notification',
        notificationTitle: 'Low Stock Alert',
        notificationMessage: 'Product {{productName}} is running low on stock'
      },
      {
        id: 'a2',
        type: 'ai-operation',
        aiModel: 'gemini-pro',
        aiPrompt: 'Analyze historical sales data and recommend optimal reorder quantity for {{productName}}'
      }
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    metrics: {
      totalExecutions: 156,
      successfulExecutions: 152,
      failedExecutions: 4,
      lastExecutionTime: new Date(Date.now() - 3600000),
      lastExecutionStatus: 'success',
      averageExecutionTime: 245
    }
  },
  {
    id: '2',
    name: 'Daily Sales Summary',
    description: 'Generate AI-powered sales summary every morning',
    enabled: true,
    trigger: {
      type: 'schedule',
      scheduleExpression: '0 9 * * *'
    },
    actions: [
      {
        id: 'a3',
        type: 'ai-operation',
        aiModel: 'gemini-pro',
        aiPrompt: 'Generate a comprehensive sales summary for yesterday including top products, revenue trends, and recommendations'
      },
      {
        id: 'a4',
        type: 'send-notification',
        notificationTitle: 'Daily Sales Summary',
        notificationMessage: 'Your daily sales summary is ready'
      }
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    metrics: {
      totalExecutions: 45,
      successfulExecutions: 45,
      failedExecutions: 0,
      lastExecutionTime: new Date(Date.now() - 86400000),
      lastExecutionStatus: 'success',
      averageExecutionTime: 1850
    }
  },
  {
    id: '3',
    name: 'Order Confirmation',
    description: 'Automatically send confirmation when new order is created',
    enabled: true,
    trigger: {
      type: 'event',
      eventType: 'order-created'
    },
    actions: [
      {
        id: 'a5',
        type: 'send-notification',
        notificationTitle: 'Order Confirmed',
        notificationMessage: 'Order {{orderId}} has been confirmed'
      },
      {
        id: 'a6',
        type: 'update-db',
        dbEntity: 'orders',
        dbOperation: 'update',
        dbFields: { status: 'confirmed' }
      }
    ],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-18'),
    metrics: {
      totalExecutions: 342,
      successfulExecutions: 340,
      failedExecutions: 2,
      lastExecutionTime: new Date(Date.now() - 1800000),
      lastExecutionStatus: 'success',
      averageExecutionTime: 120
    }
  },
  {
    id: '4',
    name: 'AI Error Recovery',
    description: 'Retry failed AI operations automatically',
    enabled: false,
    trigger: {
      type: 'event',
      eventType: 'ai-error'
    },
    actions: [
      {
        id: 'a7',
        type: 'ai-operation',
        aiModel: 'gemini-pro',
        aiPrompt: 'Retry the failed operation with adjusted parameters'
      },
      {
        id: 'a8',
        type: 'create-task',
        taskTitle: 'Review AI Error',
        taskDescription: 'Manual review required for failed AI operation'
      }
    ],
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-23'),
    metrics: {
      totalExecutions: 12,
      successfulExecutions: 8,
      failedExecutions: 4,
      lastExecutionTime: new Date(Date.now() - 7200000),
      lastExecutionStatus: 'failure',
      averageExecutionTime: 890
    }
  }
];

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRuleWithMetrics[]>(mockRules);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingRule, setEditingRule] = useState<AutomationRuleWithMetrics | null>(null);

  const handleCreate = () => {
    setEditingRule(null);
    setView('create');
  };

  const handleEdit = (rule: AutomationRuleWithMetrics) => {
    setEditingRule(rule);
    setView('edit');
  };

  const handleSave = (ruleData: Partial<AutomationRule>) => {
    if (view === 'edit' && editingRule) {
      // Update existing rule
      setRules(rules.map(r => 
        r.id === editingRule.id 
          ? { ...r, ...ruleData, updatedAt: new Date() }
          : r
      ));
      toast.success('Rule updated successfully');
    } else {
      // Create new rule
      const newRule: AutomationRuleWithMetrics = {
        ...ruleData as AutomationRule,
        id: `rule-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        metrics: {
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0
        }
      };
      setRules([...rules, newRule]);
      toast.success('Rule created successfully');
    }
    setView('list');
  };

  const handleTest = async (ruleData: Partial<AutomationRule>) => {
    // Simulate testing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Randomly succeed or fail for demo
    const success = Math.random() > 0.3;
    
    if (success) {
      toast.success('Rule test completed successfully!');
    } else {
      toast.error('Rule test failed. Check your configuration.');
    }
  };

  const handleToggle = (ruleId: string, enabled: boolean) => {
    setRules(rules.map(r => 
      r.id === ruleId ? { ...r, enabled } : r
    ));
    toast.success(enabled ? 'Rule resumed' : 'Rule paused');
  };

  const handleDelete = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
    toast.success('Rule deleted successfully');
  };

  const handleCancel = () => {
    setView('list');
    setEditingRule(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {view === 'list' ? (
        <AutomationRuleList
          rules={rules}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreate={handleCreate}
        />
      ) : (
        <div className="space-y-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Rules
          </Button>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {view === 'edit' ? 'Edit Automation Rule' : 'Create Automation Rule'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {view === 'edit' 
                ? 'Modify the automation rule configuration' 
                : 'Configure a new automation rule for your workflows'}
            </p>
          </div>

          {/* Rule Builder */}
          <AutomationRuleBuilder
            rule={editingRule || undefined}
            onSave={handleSave}
            onTest={handleTest}
            onCancel={handleCancel}
          />
        </div>
      )}
    </div>
  );
}
