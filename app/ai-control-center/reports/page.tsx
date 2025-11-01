'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  DollarSign,
  Clock,
  Mail,
  Plus,
  Play,
  Settings,
  Eye,
  Edit,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Target,
  Users,
  Zap,
  Shield,
  Database,
  TrendingDown,
  Filter,
  Search,
  MoreVertical,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export default function AIControlReportsPage() {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Reports & Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Generate insights and track AI performance metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setIsBuilderOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Custom Report
            </Button>
          </div>
        </div>

        {/* Executive Summary Dashboard */}
        <ExecutiveSummary period={selectedPeriod} />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="templates">Report Templates</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
            <TabsTrigger value="impact">AI Impact Metrics</TabsTrigger>
            <TabsTrigger value="comparative">Comparative Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <ReportTemplates />
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-6">
            <ScheduledReports />
          </TabsContent>

          <TabsContent value="impact" className="space-y-6">
            <AIImpactMetrics period={selectedPeriod} />
          </TabsContent>

          <TabsContent value="comparative" className="space-y-6">
            <ComparativeAnalytics period={selectedPeriod} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Custom Report Builder Modal */}
      <CustomReportBuilder isOpen={isBuilderOpen} onClose={() => setIsBuilderOpen(false)} />
    </div>
  );
}

// Executive Summary Component
function ExecutiveSummary({ period }: { period: string }) {
  const summaryData = {
    totalOperations: 15234,
    successRate: 96.8,
    avgConfidence: 0.847,
    costSavings: 12450,
    timeReduction: 78,
    errorReduction: 45,
    trend: {
      operations: 12.5,
      successRate: 2.3,
      confidence: 1.8,
      cost: -8.2,
    },
  };

  const keyActions = [
    {
      priority: 'high',
      title: 'Optimize doc-classifier-v2',
      description: 'Response time increased by 15% in last 7 days',
      impact: 'Performance',
    },
    {
      priority: 'medium',
      title: 'Review low-confidence cases',
      description: '234 operations below 0.6 confidence threshold',
      impact: 'Quality',
    },
    {
      priority: 'low',
      title: 'Update automation rules',
      description: '3 rules have not triggered in 30 days',
      impact: 'Efficiency',
    },
  ];

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Executive Summary</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered insights for {period}</p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<Activity className="w-5 h-5" />}
          label="Total Operations"
          value={summaryData.totalOperations.toLocaleString()}
          trend={summaryData.trend.operations}
          color="blue"
        />
        <MetricCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Success Rate"
          value={`${summaryData.successRate}%`}
          trend={summaryData.trend.successRate}
          color="green"
        />
        <MetricCard
          icon={<Target className="w-5 h-5" />}
          label="Avg Confidence"
          value={summaryData.avgConfidence.toFixed(3)}
          trend={summaryData.trend.confidence}
          color="purple"
        />
        <MetricCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Cost Savings"
          value={`$${summaryData.costSavings.toLocaleString()}`}
          trend={summaryData.trend.cost}
          color="emerald"
        />
        <MetricCard
          icon={<Clock className="w-5 h-5" />}
          label="Time Reduction"
          value={`${summaryData.timeReduction}%`}
          trend={5.2}
          color="orange"
        />
        <MetricCard
          icon={<Shield className="w-5 h-5" />}
          label="Error Reduction"
          value={`${summaryData.errorReduction}%`}
          trend={3.1}
          color="red"
        />
      </div>

      {/* Key Action Items */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Key Action Items
        </h3>
        <div className="space-y-2">
          {keyActions.map((action, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant={action.priority === 'high' ? 'destructive' : action.priority === 'medium' ? 'default' : 'secondary'}
                >
                  {action.priority.toUpperCase()}
                </Badge>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{action.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                </div>
              </div>
              <Badge variant="outline">{action.impact}</Badge>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// Metric Card Component
function MetricCard({
  icon,
  label,
  value,
  trend,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: number;
  color: string;
}) {
  const isPositive = trend > 0;
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

// Report Templates Component
function ReportTemplates() {
  const templates = [
    {
      id: 1,
      name: 'Daily Operations Summary',
      description: 'Overview of all AI operations, success rates, and key metrics',
      icon: <Activity className="w-5 h-5" />,
      category: 'Operations',
      frequency: 'Daily',
      lastGenerated: '2 hours ago',
      color: 'blue',
    },
    {
      id: 2,
      name: 'Model Performance Report',
      description: 'Detailed analysis of each model\'s performance and accuracy',
      icon: <BarChart3 className="w-5 h-5" />,
      category: 'Performance',
      frequency: 'Weekly',
      lastGenerated: '1 day ago',
      color: 'purple',
    },
    {
      id: 3,
      name: 'Cost Analysis Report',
      description: 'Breakdown of AI costs by model, operation type, and time period',
      icon: <DollarSign className="w-5 h-5" />,
      category: 'Financial',
      frequency: 'Monthly',
      lastGenerated: '3 days ago',
      color: 'green',
    },
    {
      id: 4,
      name: 'Security Audit Report',
      description: 'Comprehensive security audit with PHI handling and compliance',
      icon: <Shield className="w-5 h-5" />,
      category: 'Security',
      frequency: 'Weekly',
      lastGenerated: '5 hours ago',
      color: 'red',
    },
    {
      id: 5,
      name: 'Confidence Analysis',
      description: 'Distribution of confidence scores and low-confidence cases',
      icon: <Target className="w-5 h-5" />,
      category: 'Quality',
      frequency: 'Daily',
      lastGenerated: '1 hour ago',
      color: 'orange',
    },
    {
      id: 6,
      name: 'User Activity Report',
      description: 'AI usage patterns by user, department, and operation type',
      icon: <Users className="w-5 h-5" />,
      category: 'Usage',
      frequency: 'Weekly',
      lastGenerated: '2 days ago',
      color: 'indigo',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pre-built Report Templates</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search templates..." className="pl-9 w-64" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="security">Security</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <ReportTemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}

// Report Template Card Component
function ReportTemplateCard({ template }: { template: any }) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  };

  return (
    <Card className="p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[template.color as keyof typeof colorClasses]}`}>
          {template.icon}
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{template.name}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{template.description}</p>

      <div className="flex items-center gap-2 mb-4">
        <Badge variant="secondary">{template.category}</Badge>
        <Badge variant="outline">{template.frequency}</Badge>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Last generated: {template.lastGenerated}
      </div>

      <div className="flex gap-2">
        <Button className="flex-1 gap-2" size="sm">
          <Play className="w-4 h-4" />
          Generate
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}

// Scheduled Reports Component
function ScheduledReports() {
  const scheduledReports = [
    {
      id: 1,
      name: 'Weekly Performance Digest',
      template: 'Model Performance Report',
      schedule: 'Every Monday at 9:00 AM',
      recipients: ['admin@example.com', 'manager@example.com'],
      format: 'PDF',
      status: 'active',
      nextRun: '2025-11-04 09:00',
      lastRun: '2025-10-28 09:00',
    },
    {
      id: 2,
      name: 'Daily Operations Summary',
      template: 'Daily Operations Summary',
      schedule: 'Every day at 8:00 AM',
      recipients: ['operations@example.com'],
      format: 'Email + PDF',
      status: 'active',
      nextRun: '2025-11-02 08:00',
      lastRun: '2025-11-01 08:00',
    },
    {
      id: 3,
      name: 'Monthly Cost Report',
      template: 'Cost Analysis Report',
      schedule: 'First day of month at 10:00 AM',
      recipients: ['finance@example.com', 'cfo@example.com'],
      format: 'Excel',
      status: 'active',
      nextRun: '2025-12-01 10:00',
      lastRun: '2025-11-01 10:00',
    },
    {
      id: 4,
      name: 'Security Audit - Quarterly',
      template: 'Security Audit Report',
      schedule: 'Every 3 months',
      recipients: ['security@example.com', 'compliance@example.com'],
      format: 'PDF',
      status: 'paused',
      nextRun: '2026-01-01 09:00',
      lastRun: '2025-10-01 09:00',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Scheduled Reports</h2>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Schedule New Report
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Report Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Next Run
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {scheduledReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{report.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{report.template}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {report.schedule}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {report.recipients.length} recipient{report.recipients.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
                      {report.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {report.nextRun}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// AI Impact Metrics Component
function AIImpactMetrics({ period }: { period: string }) {
  const impactData = {
    businessOutcomes: [
      {
        metric: 'Processing Time Saved',
        value: '1,245 hours',
        impact: '$62,250',
        trend: 15.3,
        description: 'Automated document classification and data extraction',
      },
      {
        metric: 'Error Rate Reduction',
        value: '45%',
        impact: '$18,900',
        trend: 8.7,
        description: 'Fewer manual corrections and rework required',
      },
      {
        metric: 'Customer Satisfaction',
        value: '+23%',
        impact: 'High',
        trend: 12.1,
        description: 'Faster response times and improved accuracy',
      },
      {
        metric: 'Operational Efficiency',
        value: '78%',
        impact: '$45,600',
        trend: 6.4,
        description: 'Streamlined workflows and reduced bottlenecks',
      },
    ],
    modelContributions: [
      { model: 'doc-classifier-v2', contribution: 42, operations: 6420, savings: '$25,680' },
      { model: 'ocr-extractor', contribution: 28, operations: 4280, savings: '$17,120' },
      { model: 'medical-nlp', contribution: 18, operations: 2750, savings: '$11,000' },
      { model: 'sentiment-analyzer', contribution: 12, operations: 1834, savings: '$7,336' },
    ],
    roi: {
      totalInvestment: 15000,
      totalReturns: 62250,
      netBenefit: 47250,
      roiPercentage: 315,
      paybackPeriod: '2.4 months',
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">AI Impact on Business Outcomes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {impactData.businessOutcomes.map((outcome, index) => (
            <Card key={index} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{outcome.metric}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{outcome.value}</p>
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${outcome.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <ArrowUpRight className="w-4 h-4" />
                  {outcome.trend}%
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Financial Impact:</span>
                <span className="text-lg font-semibold text-green-600">{outcome.impact}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{outcome.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Model Contributions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Model Contributions to Impact</h3>
        <div className="space-y-4">
          {impactData.modelContributions.map((model, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">{model.model}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {model.operations.toLocaleString()} ops
                  </span>
                  <span className="text-sm font-semibold text-green-600">{model.savings}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{model.contribution}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${model.contribution}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ROI Analysis */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Return on Investment (ROI)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Investment</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${impactData.roi.totalInvestment.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Returns</p>
            <p className="text-2xl font-bold text-green-600">
              ${impactData.roi.totalReturns.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Benefit</p>
            <p className="text-2xl font-bold text-green-600">
              ${impactData.roi.netBenefit.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ROI</p>
            <p className="text-2xl font-bold text-green-600">{impactData.roi.roiPercentage}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Payback Period</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{impactData.roi.paybackPeriod}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Comparative Analytics Component
function ComparativeAnalytics({ period }: { period: string }) {
  const comparisonData = {
    periods: [
      { label: 'Current Period', value: 'current' },
      { label: 'Previous Period', value: 'previous' },
      { label: 'Same Period Last Year', value: 'year_ago' },
    ],
    metrics: [
      {
        name: 'Total Operations',
        current: 15234,
        previous: 13567,
        yearAgo: 9823,
        unit: '',
      },
      {
        name: 'Success Rate',
        current: 96.8,
        previous: 94.5,
        yearAgo: 89.2,
        unit: '%',
      },
      {
        name: 'Avg Confidence',
        current: 0.847,
        previous: 0.829,
        yearAgo: 0.765,
        unit: '',
      },
      {
        name: 'Avg Response Time',
        current: 245,
        previous: 312,
        yearAgo: 456,
        unit: 'ms',
      },
      {
        name: 'Total Cost',
        current: 387.45,
        previous: 421.23,
        yearAgo: 523.67,
        unit: '$',
      },
      {
        name: 'Error Rate',
        current: 3.2,
        previous: 5.5,
        yearAgo: 10.8,
        unit: '%',
      },
    ],
  };

  const calculateChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change > 0,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Period-over-Period Comparison</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Customize Metrics
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Comparison Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Current Period
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  vs Previous
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Previous Period
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  vs Year Ago
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Year Ago
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {comparisonData.metrics.map((metric, index) => {
                const vsPrevious = calculateChange(metric.current, metric.previous);
                const vsYearAgo = calculateChange(metric.current, metric.yearAgo);
                const isLowerBetter = metric.name.includes('Time') || metric.name.includes('Cost') || metric.name.includes('Error');

                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {metric.name}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {metric.unit === '$' && metric.unit}
                        {metric.current.toLocaleString()}
                        {metric.unit !== '$' && metric.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                        (vsPrevious.isPositive && !isLowerBetter) || (!vsPrevious.isPositive && isLowerBetter)
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {vsPrevious.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {vsPrevious.value}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                      {metric.unit === '$' && metric.unit}
                      {metric.previous.toLocaleString()}
                      {metric.unit !== '$' && metric.unit}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                        (vsYearAgo.isPositive && !isLowerBetter) || (!vsYearAgo.isPositive && isLowerBetter)
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {vsYearAgo.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {vsYearAgo.value}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                      {metric.unit === '$' && metric.unit}
                      {metric.yearAgo.toLocaleString()}
                      {metric.unit !== '$' && metric.unit}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Trend Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Trends</h3>
          <div className="space-y-4">
            <TrendIndicator
              label="Operations Volume"
              trend="increasing"
              percentage={12.3}
              description="Steady growth in AI usage across departments"
            />
            <TrendIndicator
              label="Success Rate"
              trend="increasing"
              percentage={2.4}
              description="Improved model accuracy and reliability"
            />
            <TrendIndicator
              label="Response Time"
              trend="decreasing"
              percentage={21.5}
              description="Optimizations reducing latency"
            />
            <TrendIndicator
              label="Cost Efficiency"
              trend="decreasing"
              percentage={8.0}
              description="Better resource utilization"
            />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Insights</h3>
          <div className="space-y-3">
            <InsightCard
              type="success"
              title="Exceptional Growth"
              description="Operations increased by 55% compared to last year, indicating strong adoption"
            />
            <InsightCard
              type="success"
              title="Quality Improvement"
              description="Success rate improved by 8.5% year-over-year through model refinements"
            />
            <InsightCard
              type="warning"
              title="Cost Monitoring"
              description="While costs decreased 8%, monitor usage to maintain efficiency gains"
            />
            <InsightCard
              type="info"
              title="Performance Optimization"
              description="Response time reduced by 46% compared to last year through infrastructure upgrades"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

// Trend Indicator Component
function TrendIndicator({
  label,
  trend,
  percentage,
  description,
}: {
  label: string;
  trend: 'increasing' | 'decreasing';
  percentage: number;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        trend === 'increasing'
          ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
      }`}>
        {trend === 'increasing' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-900 dark:text-white">{label}</span>
          <span className={`text-sm font-semibold ${
            trend === 'increasing' ? 'text-green-600' : 'text-blue-600'
          }`}>
            {trend === 'increasing' ? '+' : '-'}{percentage}%
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
}

// Insight Card Component
function InsightCard({
  type,
  title,
  description,
}: {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
}) {
  const styles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: <Sparkles className="w-5 h-5 text-blue-600" />,
    },
  };

  const style = styles[type];

  return (
    <div className={`p-3 rounded-lg border ${style.bg} ${style.border}`}>
      <div className="flex items-start gap-3">
        {style.icon}
        <div>
          <p className="font-medium text-gray-900 dark:text-white mb-1">{title}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

// Custom Report Builder Component
function CustomReportBuilder({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState('7d');
  const [groupBy, setGroupBy] = useState('day');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);

  const availableMetrics = [
    { id: 'operations', label: 'Total Operations', category: 'Volume' },
    { id: 'success_rate', label: 'Success Rate', category: 'Quality' },
    { id: 'confidence', label: 'Average Confidence', category: 'Quality' },
    { id: 'response_time', label: 'Response Time', category: 'Performance' },
    { id: 'error_rate', label: 'Error Rate', category: 'Quality' },
    { id: 'cost', label: 'Total Cost', category: 'Financial' },
    { id: 'cost_per_operation', label: 'Cost per Operation', category: 'Financial' },
    { id: 'throughput', label: 'Throughput', category: 'Performance' },
  ];

  const availableModels = [
    'doc-classifier-v2',
    'ocr-extractor',
    'medical-nlp',
    'sentiment-analyzer',
    'data-extractor',
  ];

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricId) ? prev.filter((id) => id !== metricId) : [...prev, metricId]
    );
  };

  const toggleModel = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Custom Report Builder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-name">Report Name</Label>
              <Input
                id="report-name"
                placeholder="e.g., Weekly AI Performance Summary"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="report-description">Description</Label>
              <Textarea
                id="report-description"
                placeholder="Describe what this report will track..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          {/* Date Range and Grouping */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Group By</Label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">Hour</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Metrics Selection */}
          <div>
            <Label className="mb-3 block">Select Metrics (Drag to reorder)</Label>
            <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {availableMetrics.map((metric) => (
                <div
                  key={metric.id}
                  onClick={() => toggleMetric(metric.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedMetrics.includes(metric.id)
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{metric.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{metric.category}</p>
                    </div>
                    {selectedMetrics.includes(metric.id) && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <Label className="mb-3 block">Filter by Models (Optional)</Label>
            <div className="flex flex-wrap gap-2">
              {availableModels.map((model) => (
                <Badge
                  key={model}
                  variant={selectedModels.includes(model) ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1"
                  onClick={() => toggleModel(model)}
                >
                  {model}
                  {selectedModels.includes(model) && <CheckCircle2 className="w-3 h-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label>Include Charts & Visualizations</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add graphs and charts to the report</p>
              </div>
              <Switch checked={includeCharts} onCheckedChange={setIncludeCharts} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Schedule Report</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Automatically generate and email this report</p>
              </div>
              <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
            </div>
          </div>

          {/* Schedule Configuration */}
          {scheduleEnabled && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Schedule Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Frequency</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Time</Label>
                  <Input type="time" defaultValue="09:00" className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Email Recipients</Label>
                  <Input placeholder="email1@example.com, email2@example.com" className="mt-1" />
                </div>
                <div>
                  <Label>Format</Label>
                  <Select defaultValue="pdf">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="email">Email Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button className="gap-2">
                <Play className="w-4 h-4" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
