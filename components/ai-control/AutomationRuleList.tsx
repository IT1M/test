'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { 
  Play, 
  Pause, 
  Edit, 
  Trash2,
  Zap,
  Clock,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { AutomationRule, TriggerType } from './AutomationRuleBuilder';

interface RuleMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastExecutionTime?: Date;
  lastExecutionStatus?: 'success' | 'failure';
  averageExecutionTime?: number;
}

interface AutomationRuleWithMetrics extends AutomationRule {
  metrics: RuleMetrics;
}

interface AutomationRuleListProps {
  rules: AutomationRuleWithMetrics[];
  onToggle: (ruleId: string, enabled: boolean) => void;
  onEdit: (rule: AutomationRuleWithMetrics) => void;
  onDelete: (ruleId: string) => void;
  onCreate: () => void;
}

export function AutomationRuleList({
  rules,
  onToggle,
  onEdit,
  onDelete,
  onCreate
}: AutomationRuleListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  const handleDeleteClick = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (ruleToDelete) {
      onDelete(ruleToDelete);
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    }
  };

  const getTriggerIcon = (type: TriggerType) => {
    switch (type) {
      case 'event': return <Zap className="w-4 h-4" />;
      case 'schedule': return <Clock className="w-4 h-4" />;
      case 'condition': return <Filter className="w-4 h-4" />;
    }
  };

  const getTriggerLabel = (type: TriggerType) => {
    switch (type) {
      case 'event': return 'Event';
      case 'schedule': return 'Schedule';
      case 'condition': return 'Condition';
    }
  };

  const getStatusBadge = (rule: AutomationRuleWithMetrics) => {
    if (!rule.enabled) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Pause className="w-3 h-3" />
          Paused
        </Badge>
      );
    }

    if (!rule.metrics.lastExecutionStatus) {
      return (
        <Badge className="gap-1 bg-blue-500">
          <Clock className="w-3 h-3" />
          Ready
        </Badge>
      );
    }

    if (rule.metrics.lastExecutionStatus === 'success') {
      return (
        <Badge className="gap-1 bg-green-500">
          <CheckCircle className="w-3 h-3" />
          Active
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="w-3 h-3" />
        Error
      </Badge>
    );
  };

  const formatLastExecution = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const calculateSuccessRate = (metrics: RuleMetrics) => {
    if (metrics.totalExecutions === 0) return 0;
    return (metrics.successfulExecutions / metrics.totalExecutions) * 100;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automation Rules</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Manage automated workflows and AI operations
          </p>
        </div>
        <Button onClick={onCreate}>
          <Zap className="w-4 h-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Zap className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No automation rules yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first automation rule to streamline your workflows
              </p>
              <Button onClick={onCreate}>
                <Zap className="w-4 h-4 mr-2" />
                Create First Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      {getStatusBadge(rule)}
                      <Badge variant="outline" className="gap-1">
                        {getTriggerIcon(rule.trigger.type)}
                        {getTriggerLabel(rule.trigger.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {rule.description}
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggle(rule.id, !rule.enabled)}
                      title={rule.enabled ? 'Pause rule' : 'Resume rule'}
                    >
                      {rule.enabled ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(rule)}
                      title="Edit rule"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(rule.id)}
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {/* Total Executions */}
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Executions
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {rule.metrics.totalExecutions.toLocaleString()}
                    </div>
                  </div>

                  {/* Success Rate */}
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Success Rate
                    </div>
                    <div className={cn(
                      'text-lg font-bold',
                      calculateSuccessRate(rule.metrics) >= 95 ? 'text-green-600 dark:text-green-400' :
                      calculateSuccessRate(rule.metrics) >= 80 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    )}>
                      {calculateSuccessRate(rule.metrics).toFixed(1)}%
                    </div>
                  </div>

                  {/* Successful */}
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Successful
                    </div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {rule.metrics.successfulExecutions.toLocaleString()}
                    </div>
                  </div>

                  {/* Failed */}
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Failed
                    </div>
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      {rule.metrics.failedExecutions.toLocaleString()}
                    </div>
                  </div>

                  {/* Last Execution */}
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Last Run
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatLastExecution(rule.metrics.lastExecutionTime)}
                    </div>
                  </div>
                </div>

                {/* Actions Summary */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">{rule.actions.length}</span>
                    <span>action{rule.actions.length !== 1 ? 's' : ''} configured</span>
                    {rule.metrics.averageExecutionTime && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Avg. {rule.metrics.averageExecutionTime}ms</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Warning for failed executions */}
                {rule.metrics.failedExecutions > 0 && 
                 rule.metrics.lastExecutionStatus === 'failure' && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                      <div className="text-sm text-red-600 dark:text-red-400">
                        Last execution failed. Check logs for details.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Automation Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this automation rule? This action cannot be undone.
              All execution history will be preserved but the rule will no longer run.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
