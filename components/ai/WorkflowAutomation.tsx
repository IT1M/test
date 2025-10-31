'use client';

// Workflow Automation Component
// Manage and monitor automated workflows

import React, { useState, useEffect } from 'react';
import { Zap, Play, Pause, Trash2, Plus, TrendingUp, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getWorkflowAutomationService,
  WorkflowRule,
  TaskPattern,
  ProcessImprovement,
} from '@/services/gemini/workflow-automation';
import { toast } from 'react-hot-toast';

export function WorkflowAutomation() {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [patterns, setPatterns] = useState<TaskPattern[]>([]);
  const [improvements, setImprovements] = useState<ProcessImprovement[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const workflowService = getWorkflowAutomationService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rulesData, analyticsData] = await Promise.all([
        Promise.resolve(workflowService.getRules()),
        workflowService.getAnalytics(30),
      ]);

      setRules(rulesData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load workflow data:', error);
      toast.error('Failed to load workflow data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      workflowService.updateRule(ruleId, { isActive });
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, isActive } : r));
      toast.success(isActive ? 'Workflow activated' : 'Workflow deactivated');
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      toast.error('Failed to update workflow');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      workflowService.deleteRule(ruleId);
      setRules(prev => prev.filter(r => r.id !== ruleId));
      toast.success('Workflow deleted');
    } catch (error) {
      console.error('Failed to delete rule:', error);
      toast.error('Failed to delete workflow');
    }
  };

  const handleIdentifyPatterns = async () => {
    setIsLoading(true);
    try {
      const patternsData = await workflowService.identifyRepetitiveTasks(30);
      setPatterns(patternsData);
      toast.success(`Found ${patternsData.length} automation opportunities`);
    } catch (error) {
      console.error('Failed to identify patterns:', error);
      toast.error('Failed to identify patterns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestImprovements = async () => {
    setIsLoading(true);
    try {
      const improvementsData = await workflowService.suggestProcessImprovements();
      setImprovements(improvementsData);
      toast.success(`Generated ${improvementsData.length} improvement suggestions`);
    } catch (error) {
      console.error('Failed to suggest improvements:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: number): string => {
    if (priority === 1) return 'bg-red-500';
    if (priority === 2) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getTriggerLabel = (trigger: any): string => {
    if (trigger.type === 'event') return `Event: ${trigger.event}`;
    if (trigger.type === 'schedule') return `Schedule: ${trigger.schedule}`;
    if (trigger.type === 'condition') return 'Condition-based';
    return 'Manual';
  };

  if (isLoading && rules.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Workflow Automation
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Automate repetitive tasks and optimize business processes
          </p>
        </div>
        <Button onClick={() => toast('Create workflow feature coming soon')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Executions</span>
            <Zap className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold">{analytics?.totalExecutions || 0}</div>
          <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Success Rate</span>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-green-500">
            {(analytics?.successRate || 0).toFixed(1)}%
          </div>
          <p className="text-xs text-gray-500 mt-1">Successful executions</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Time Saved</span>
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-blue-500">
            {(analytics?.timeSaved || 0).toFixed(1)}h
          </div>
          <p className="text-xs text-gray-500 mt-1">Estimated hours</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Active Rules</span>
          </div>
          <div className="text-3xl font-bold">
            {rules.filter(r => r.isActive).length}
          </div>
          <p className="text-xs text-gray-500 mt-1">Out of {rules.length} total</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Active Workflows</TabsTrigger>
          <TabsTrigger value="patterns">Automation Opportunities</TabsTrigger>
          <TabsTrigger value="improvements">Process Improvements</TabsTrigger>
        </TabsList>

        {/* Active Workflows */}
        <TabsContent value="rules" className="space-y-4">
          {rules.map(rule => (
            <Card key={rule.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{rule.name}</h3>
                    <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <div
                      className={`w-2 h-2 rounded-full ${getPriorityColor(rule.priority)}`}
                      title={`Priority: ${rule.priority}`}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {rule.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline">{getTriggerLabel(rule.trigger)}</Badge>
                    <span className="text-gray-500">
                      {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-gray-500">
                      Executed {rule.executionCount} times
                    </span>
                    {rule.lastExecuted && (
                      <span className="text-gray-500">
                        Last: {new Date(rule.lastExecuted).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {rules.length === 0 && (
            <Card className="p-12 text-center">
              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first workflow to automate repetitive tasks
              </p>
              <Button>Create Workflow</Button>
            </Card>
          )}
        </TabsContent>

        {/* Automation Opportunities */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={handleIdentifyPatterns} disabled={isLoading}>
              {isLoading ? 'Analyzing...' : 'Identify Patterns'}
            </Button>
          </div>

          {patterns.map(pattern => (
            <Card key={pattern.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{pattern.pattern}</h3>
                    <Badge variant="secondary">
                      {(pattern.automationPotential * 100).toFixed(0)}% automation potential
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Frequency:</span>
                      <span className="ml-2 font-semibold">{pattern.frequency}/month</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Avg Time:</span>
                      <span className="ml-2 font-semibold">{pattern.averageTime} min</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Time Savings:</span>
                      <span className="ml-2 font-semibold text-green-500">
                        {pattern.estimatedTimeSavings}h/month
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Create Workflow
                </Button>
              </div>
            </Card>
          ))}

          {patterns.length === 0 && (
            <Card className="p-12 text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No patterns identified yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Click "Identify Patterns" to analyze your system usage and find automation opportunities
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Process Improvements */}
        <TabsContent value="improvements" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={handleSuggestImprovements} disabled={isLoading}>
              {isLoading ? 'Analyzing...' : 'Generate Suggestions'}
            </Button>
          </div>

          {improvements.map(improvement => (
            <Card key={improvement.id} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{improvement.area}</h3>
                    <Badge
                      variant={
                        improvement.priority === 'critical'
                          ? 'destructive'
                          : improvement.priority === 'high'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {improvement.priority}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">Current:</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {improvement.currentProcess}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold">Suggested:</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {improvement.suggestedImprovement}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold">Expected Benefit:</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {improvement.expectedBenefit}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-500">
                    {improvement.estimatedROI}%
                  </div>
                  <p className="text-xs text-gray-500">Est. ROI</p>
                  <Badge variant="outline" className="mt-2">
                    {improvement.implementationEffort} effort
                  </Badge>
                </div>
              </div>
            </Card>
          ))}

          {improvements.length === 0 && (
            <Card className="p-12 text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No suggestions yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Click "Generate Suggestions" to get AI-powered process improvement recommendations
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
