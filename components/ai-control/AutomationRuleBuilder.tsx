'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Play, 
  Save,
  Zap,
  Clock,
  Filter,
  Database,
  Bell,
  CheckSquare
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// Types for automation rules
export type TriggerType = 'event' | 'schedule' | 'condition';
export type ActionType = 'update-db' | 'send-notification' | 'create-task' | 'ai-operation';
export type AIModel = 'gemini-pro' | 'gemini-pro-vision';

export interface AutomationTrigger {
  type: TriggerType;
  eventType?: string;
  scheduleExpression?: string;
  conditionField?: string;
  conditionOperator?: string;
  conditionValue?: string;
}

export interface AutomationAction {
  id: string;
  type: ActionType;
  aiModel?: AIModel;
  aiPrompt?: string;
  dbEntity?: string;
  dbOperation?: string;
  dbFields?: Record<string, any>;
  notificationTitle?: string;
  notificationMessage?: string;
  taskTitle?: string;
  taskDescription?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  createdAt: Date;
  updatedAt: Date;
}

interface AutomationRuleBuilderProps {
  rule?: AutomationRule;
  onSave: (rule: Partial<AutomationRule>) => void;
  onTest?: (rule: Partial<AutomationRule>) => Promise<void>;
  onCancel: () => void;
}

export function AutomationRuleBuilder({ 
  rule, 
  onSave, 
  onTest,
  onCancel 
}: AutomationRuleBuilderProps) {
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [trigger, setTrigger] = useState<AutomationTrigger>(
    rule?.trigger || { type: 'event' }
  );
  const [actions, setActions] = useState<AutomationAction[]>(
    rule?.actions || []
  );
  const [isTesting, setIsTesting] = useState(false);

  const addAction = () => {
    const newAction: AutomationAction = {
      id: `action-${Date.now()}`,
      type: 'send-notification'
    };
    setActions([...actions, newAction]);
  };

  const removeAction = (actionId: string) => {
    setActions(actions.filter(a => a.id !== actionId));
  };

  const updateAction = (actionId: string, updates: Partial<AutomationAction>) => {
    setActions(actions.map(a => 
      a.id === actionId ? { ...a, ...updates } : a
    ));
  };

  const handleSave = () => {
    onSave({
      name,
      description,
      trigger,
      actions,
      enabled: rule?.enabled ?? true
    });
  };

  const handleTest = async () => {
    if (!onTest) return;
    
    setIsTesting(true);
    try {
      await onTest({
        name,
        description,
        trigger,
        actions
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getTriggerIcon = () => {
    switch (trigger.type) {
      case 'event': return <Zap className="w-4 h-4" />;
      case 'schedule': return <Clock className="w-4 h-4" />;
      case 'condition': return <Filter className="w-4 h-4" />;
    }
  };

  const getActionIcon = (type: ActionType) => {
    switch (type) {
      case 'update-db': return <Database className="w-4 h-4" />;
      case 'send-notification': return <Bell className="w-4 h-4" />;
      case 'create-task': return <CheckSquare className="w-4 h-4" />;
      case 'ai-operation': return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Rule Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Auto-notify on low stock"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this rule does..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Trigger Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {getTriggerIcon()}
            <CardTitle>Trigger</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Trigger Type</Label>
            <Select
              value={trigger.type}
              onValueChange={(value: TriggerType) => 
                setTrigger({ type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">Event-Based</SelectItem>
                <SelectItem value="schedule">Schedule-Based</SelectItem>
                <SelectItem value="condition">Condition-Based</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {trigger.type === 'event' && (
            <div>
              <Label>Event Type</Label>
              <Select
                value={trigger.eventType}
                onValueChange={(value) => 
                  setTrigger({ ...trigger, eventType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order-created">Order Created</SelectItem>
                  <SelectItem value="product-low-stock">Product Low Stock</SelectItem>
                  <SelectItem value="product-expired">Product Expired</SelectItem>
                  <SelectItem value="payment-received">Payment Received</SelectItem>
                  <SelectItem value="customer-registered">Customer Registered</SelectItem>
                  <SelectItem value="ai-call-completed">AI Call Completed</SelectItem>
                  <SelectItem value="ai-error">AI Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {trigger.type === 'schedule' && (
            <div>
              <Label>Schedule Expression</Label>
              <Input
                value={trigger.scheduleExpression || ''}
                onChange={(e) => 
                  setTrigger({ ...trigger, scheduleExpression: e.target.value })
                }
                placeholder="e.g., 0 9 * * * (daily at 9 AM)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use cron expression format
              </p>
            </div>
          )}

          {trigger.type === 'condition' && (
            <div className="space-y-3">
              <div>
                <Label>Field</Label>
                <Input
                  value={trigger.conditionField || ''}
                  onChange={(e) => 
                    setTrigger({ ...trigger, conditionField: e.target.value })
                  }
                  placeholder="e.g., stockQuantity"
                />
              </div>
              <div>
                <Label>Operator</Label>
                <Select
                  value={trigger.conditionOperator}
                  onValueChange={(value) => 
                    setTrigger({ ...trigger, conditionOperator: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not-equals">Not Equals</SelectItem>
                    <SelectItem value="greater-than">Greater Than</SelectItem>
                    <SelectItem value="less-than">Less Than</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value</Label>
                <Input
                  value={trigger.conditionValue || ''}
                  onChange={(e) => 
                    setTrigger({ ...trigger, conditionValue: e.target.value })
                  }
                  placeholder="e.g., 10"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Actions</CardTitle>
            <Button onClick={addAction} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Action
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {actions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No actions configured. Click "Add Action" to get started.
            </div>
          ) : (
            actions.map((action, index) => (
              <Card key={action.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getActionIcon(action.type)}
                      <span className="font-medium">Action {index + 1}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAction(action.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Action Type</Label>
                    <Select
                      value={action.type}
                      onValueChange={(value: ActionType) => 
                        updateAction(action.id, { type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ai-operation">AI Operation</SelectItem>
                        <SelectItem value="update-db">Update Database</SelectItem>
                        <SelectItem value="send-notification">Send Notification</SelectItem>
                        <SelectItem value="create-task">Create Task</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {action.type === 'ai-operation' && (
                    <>
                      <div>
                        <Label>AI Model</Label>
                        <Select
                          value={action.aiModel}
                          onValueChange={(value: AIModel) => 
                            updateAction(action.id, { aiModel: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select model..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                            <SelectItem value="gemini-pro-vision">Gemini Pro Vision</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>AI Prompt</Label>
                        <Textarea
                          value={action.aiPrompt || ''}
                          onChange={(e) => 
                            updateAction(action.id, { aiPrompt: e.target.value })
                          }
                          placeholder="Enter prompt for AI..."
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  {action.type === 'update-db' && (
                    <>
                      <div>
                        <Label>Entity</Label>
                        <Select
                          value={action.dbEntity}
                          onValueChange={(value) => 
                            updateAction(action.id, { dbEntity: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select entity..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="products">Products</SelectItem>
                            <SelectItem value="orders">Orders</SelectItem>
                            <SelectItem value="customers">Customers</SelectItem>
                            <SelectItem value="inventory">Inventory</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Operation</Label>
                        <Select
                          value={action.dbOperation}
                          onValueChange={(value) => 
                            updateAction(action.id, { dbOperation: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select operation..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="create">Create</SelectItem>
                            <SelectItem value="update">Update</SelectItem>
                            <SelectItem value="delete">Delete</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {action.type === 'send-notification' && (
                    <>
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={action.notificationTitle || ''}
                          onChange={(e) => 
                            updateAction(action.id, { notificationTitle: e.target.value })
                          }
                          placeholder="Notification title..."
                        />
                      </div>
                      <div>
                        <Label>Message</Label>
                        <Textarea
                          value={action.notificationMessage || ''}
                          onChange={(e) => 
                            updateAction(action.id, { notificationMessage: e.target.value })
                          }
                          placeholder="Notification message..."
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {action.type === 'create-task' && (
                    <>
                      <div>
                        <Label>Task Title</Label>
                        <Input
                          value={action.taskTitle || ''}
                          onChange={(e) => 
                            updateAction(action.id, { taskTitle: e.target.value })
                          }
                          placeholder="Task title..."
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={action.taskDescription || ''}
                          onChange={(e) => 
                            updateAction(action.id, { taskDescription: e.target.value })
                          }
                          placeholder="Task description..."
                          rows={2}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        {onTest && (
          <Button 
            variant="outline" 
            onClick={handleTest}
            disabled={isTesting || !name || actions.length === 0}
          >
            <Play className="w-4 h-4 mr-2" />
            {isTesting ? 'Testing...' : 'Test Rule'}
          </Button>
        )}
        <Button 
          onClick={handleSave}
          disabled={!name || actions.length === 0}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Rule
        </Button>
      </div>
    </div>
  );
}
