'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertManager } from '@/services/ai/alert-manager';
import { AIAlertRule } from '@/types/database';
import { Edit, Trash2, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AlertRuleListProps {
  onEdit?: (rule: AIAlertRule) => void;
}

export function AlertRuleList({ onEdit }: AlertRuleListProps) {
  const [rules, setRules] = useState<AIAlertRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const allRules = await AlertManager.getAlertRules();
      setRules(allRules);
    } catch (error) {
      console.error('Failed to load alert rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (ruleId: string, isActive: boolean) => {
    try {
      await AlertManager.updateAlertRule(ruleId, { isActive });
      await loadRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this alert rule?')) {
      return;
    }

    try {
      await AlertManager.deleteAlertRule(ruleId);
      await loadRules();
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">Loading alert rules...</p>
      </Card>
    );
  }

  if (rules.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No alert rules configured</p>
        <p className="text-sm text-gray-400 mt-2">Create your first alert rule to get started</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {rules.map((rule) => (
        <Card key={rule.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">{rule.ruleName}</h3>
                <Badge className={getSeverityColor(rule.severity)}>
                  {rule.severity}
                </Badge>
                <Badge variant="outline">{rule.alertType}</Badge>
                {rule.isActive ? (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                )}
              </div>

              {rule.description && (
                <p className="text-gray-600 text-sm mb-2">{rule.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Condition: {rule.conditionType}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Triggered {rule.triggerCount} times
                </span>
                {rule.lastTriggered && (
                  <>
                    <span>•</span>
                    <span>Last: {formatDistanceToNow(rule.lastTriggered, { addSuffix: true })}</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {rule.notificationChannels.map((channel) => (
                  <Badge key={channel} variant="outline" className="text-xs">
                    {channel}
                  </Badge>
                ))}
              </div>

              {rule.aggregationWindow && (
                <p className="text-xs text-gray-500 mt-2">
                  Aggregation: Max {rule.maxAlertsPerWindow} alerts per {rule.aggregationWindow} minutes
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={rule.isActive}
                onCheckedChange={(checked) => handleToggleActive(rule.id, checked)}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit?.(rule)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(rule.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
