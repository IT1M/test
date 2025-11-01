'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertManager } from '@/services/ai/alert-manager';
import { AIAlert } from '@/types/database';
import { Plus, Trash2, Save } from 'lucide-react';

interface AlertRuleBuilderProps {
  onSave?: () => void;
  onCancel?: () => void;
}

export function AlertRuleBuilder({ onSave, onCancel }: AlertRuleBuilderProps) {
  const [ruleName, setRuleName] = useState('');
  const [description, setDescription] = useState('');
  const [conditionType, setConditionType] = useState<'threshold' | 'pattern' | 'anomaly' | 'custom'>('threshold');
  const [alertType, setAlertType] = useState<AIAlert['alertType']>('other');
  const [severity, setSeverity] = useState<AIAlert['severity']>('medium');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [notificationChannels, setNotificationChannels] = useState<AIAlert['notificationChannels']>(['in-app']);
  const [aggregationWindow, setAggregationWindow] = useState(5);
  const [maxAlertsPerWindow, setMaxAlertsPerWindow] = useState(3);
  const [escalationEnabled, setEscalationEnabled] = useState(false);
  const [escalationDelay, setEscalationDelay] = useState(30);
  
  // Condition builder state
  const [conditions, setConditions] = useState<Array<{
    field: string;
    operator: string;
    value: string;
  }>>([{ field: '', operator: 'gt', value: '' }]);

  const handleAddCondition = () => {
    setConditions([...conditions, { field: '', operator: 'gt', value: '' }]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleConditionChange = (index: number, field: string, value: string) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const handleSave = async () => {
    try {
      // Build condition object
      const condition: Record<string, any> = {
        type: conditionType,
      };

      if (conditionType === 'threshold') {
        condition.field = conditions[0].field;
        condition.operator = conditions[0].operator;
        condition.value = parseFloat(conditions[0].value) || conditions[0].value;
      }

      await AlertManager.createAlertRule({
        ruleName,
        description,
        conditionType,
        condition,
        alertType,
        severity,
        messageTemplate,
        notificationChannels,
        aggregationWindow,
        maxAlertsPerWindow,
        escalationEnabled,
        escalationDelay: escalationEnabled ? escalationDelay : undefined,
      });

      onSave?.();
    } catch (error) {
      console.error('Failed to save alert rule:', error);
    }
  };

  const toggleChannel = (channel: AIAlert['notificationChannels'][0]) => {
    if (notificationChannels.includes(channel)) {
      setNotificationChannels(notificationChannels.filter(c => c !== channel));
    } else {
      setNotificationChannels([...notificationChannels, channel]);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Create Alert Rule</h2>
        <p className="text-gray-500">Define conditions that trigger automatic alerts</p>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="ruleName">Rule Name *</Label>
          <Input
            id="ruleName"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            placeholder="e.g., High Error Rate Alert"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe when this alert should trigger"
            rows={3}
          />
        </div>
      </div>

      {/* Condition Builder */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Conditions</Label>
          <Button size="sm" variant="outline" onClick={handleAddCondition}>
            <Plus className="w-4 h-4 mr-2" />
            Add Condition
          </Button>
        </div>

        <div>
          <Label htmlFor="conditionType">Condition Type</Label>
          <select
            id="conditionType"
            value={conditionType}
            onChange={(e) => setConditionType(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="threshold">Threshold</option>
            <option value="pattern">Pattern</option>
            <option value="anomaly">Anomaly</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {conditionType === 'threshold' && (
          <div className="space-y-3">
            {conditions.map((condition, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label>Field</Label>
                  <Input
                    value={condition.field}
                    onChange={(e) => handleConditionChange(index, 'field', e.target.value)}
                    placeholder="e.g., errorRate, responseTime"
                  />
                </div>
                <div className="w-32">
                  <Label>Operator</Label>
                  <select
                    value={condition.operator}
                    onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="gt">&gt;</option>
                    <option value="gte">&gt;=</option>
                    <option value="lt">&lt;</option>
                    <option value="lte">&lt;=</option>
                    <option value="eq">=</option>
                  </select>
                </div>
                <div className="flex-1">
                  <Label>Value</Label>
                  <Input
                    value={condition.value}
                    onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                    placeholder="e.g., 0.2, 1000"
                  />
                </div>
                {conditions.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveCondition(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert Configuration */}
      <div className="space-y-4">
        <h3 className="font-semibold">Alert Configuration</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="alertType">Alert Type</Label>
            <select
              id="alertType"
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="model-failure">Model Failure</option>
              <option value="high-error-rate">High Error Rate</option>
              <option value="budget-exceeded">Budget Exceeded</option>
              <option value="security-incident">Security Incident</option>
              <option value="performance-degradation">Performance Degradation</option>
              <option value="rate-limit-warning">Rate Limit Warning</option>
              <option value="anomaly-detected">Anomaly Detected</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="severity">Severity</Label>
            <select
              id="severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="messageTemplate">Message Template</Label>
          <Textarea
            id="messageTemplate"
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            placeholder="Use {{field}} for dynamic values, e.g., Error rate is {{errorRate}}%"
            rows={3}
          />
          <p className="text-sm text-gray-500 mt-1">
            Use {'{{'} and {'}'} to insert dynamic values from the condition context
          </p>
        </div>
      </div>

      {/* Notification Channels */}
      <div className="space-y-4">
        <h3 className="font-semibold">Notification Channels</h3>
        <div className="flex flex-wrap gap-2">
          {(['in-app', 'email', 'sms', 'webhook'] as const).map((channel) => (
            <Badge
              key={channel}
              variant={notificationChannels.includes(channel) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleChannel(channel)}
            >
              {channel}
            </Badge>
          ))}
        </div>
      </div>

      {/* Aggregation Settings */}
      <div className="space-y-4">
        <h3 className="font-semibold">Alert Aggregation (Prevent Notification Fatigue)</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="aggregationWindow">Aggregation Window (minutes)</Label>
            <Input
              id="aggregationWindow"
              type="number"
              value={aggregationWindow}
              onChange={(e) => setAggregationWindow(parseInt(e.target.value) || 5)}
              min={1}
            />
            <p className="text-sm text-gray-500 mt-1">
              Group similar alerts within this time window
            </p>
          </div>

          <div>
            <Label htmlFor="maxAlertsPerWindow">Max Alerts Per Window</Label>
            <Input
              id="maxAlertsPerWindow"
              type="number"
              value={maxAlertsPerWindow}
              onChange={(e) => setMaxAlertsPerWindow(parseInt(e.target.value) || 3)}
              min={1}
            />
            <p className="text-sm text-gray-500 mt-1">
              Maximum alerts to send in the window
            </p>
          </div>
        </div>
      </div>

      {/* Escalation Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Escalation</h3>
          <Switch
            checked={escalationEnabled}
            onCheckedChange={setEscalationEnabled}
          />
        </div>

        {escalationEnabled && (
          <div>
            <Label htmlFor="escalationDelay">Escalation Delay (minutes)</Label>
            <Input
              id="escalationDelay"
              type="number"
              value={escalationDelay}
              onChange={(e) => setEscalationDelay(parseInt(e.target.value) || 30)}
              min={1}
            />
            <p className="text-sm text-gray-500 mt-1">
              Escalate if not resolved within this time
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!ruleName || !messageTemplate}>
          <Save className="w-4 h-4 mr-2" />
          Save Rule
        </Button>
      </div>
    </Card>
  );
}
