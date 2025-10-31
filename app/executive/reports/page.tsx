'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  BarChart3,
  PieChart,
  FileBarChart,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Report {
  id: string;
  name: string;
  description: string;
  category: 'board' | 'investor' | 'compliance' | 'operational' | 'esg';
  icon: React.ReactNode;
  lastGenerated?: Date;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
}

interface ScheduledReport {
  id: string;
  reportId: string;
  reportName: string;
  frequency: string;
  nextRun: Date;
  recipients: string[];
  status: 'active' | 'paused';
}

export default function ExecutiveReportsPage() {
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);

  const reports: Report[] = [
    {
      id: 'board-meeting',
      name: 'Board Meeting Report',
      description: 'Comprehensive quarterly report for board meetings with KPIs, financials, and strategic updates',
      category: 'board',
      icon: <FileText className="h-5 w-5" />,
      frequency: 'quarterly',
    },
    {
      id: 'investor-update',
      name: 'Investor Update',
      description: 'Financial highlights, growth metrics, and market positioning for investors',
      category: 'investor',
      icon: <TrendingUp className="h-5 w-5" />,
      frequency: 'quarterly',
    },
    {
      id: 'financial-statements',
      name: 'Financial Statements',
      description: 'Income statement, balance sheet, and cash flow statement',
      category: 'investor',
      icon: <DollarSign className="h-5 w-5" />,
      frequency: 'monthly',
    },
    {
      id: 'compliance-report',
      name: 'Regulatory Compliance Report',
      description: 'Medical device compliance, quality metrics, and regulatory status',
      category: 'compliance',
      icon: <CheckCircle className="h-5 w-5" />,
      frequency: 'quarterly',
    },
    {
      id: 'quality-metrics',
      name: 'Quality & Safety Metrics',
      description: 'Product quality indicators, rejection rates, and safety incidents',
      category: 'compliance',
      icon: <AlertCircle className="h-5 w-5" />,
      frequency: 'monthly',
    },
    {
      id: 'operational-dashboard',
      name: 'Operational Performance',
      description: 'Sales, inventory, fulfillment, and operational efficiency metrics',
      category: 'operational',
      icon: <BarChart3 className="h-5 w-5" />,
      frequency: 'weekly',
    },
    {
      id: 'customer-analytics',
      name: 'Customer Analytics Report',
      description: 'Customer segmentation, retention, satisfaction, and lifetime value analysis',
      category: 'operational',
      icon: <Users className="h-5 w-5" />,
      frequency: 'monthly',
    },
    {
      id: 'inventory-report',
      name: 'Inventory & Supply Chain',
      description: 'Stock levels, turnover rates, supplier performance, and procurement metrics',
      category: 'operational',
      icon: <Package className="h-5 w-5" />,
      frequency: 'weekly',
    },
    {
      id: 'esg-report',
      name: 'ESG & Sustainability Report',
      description: 'Environmental impact, social responsibility, and governance metrics',
      category: 'esg',
      icon: <PieChart className="h-5 w-5" />,
      frequency: 'annual',
    },
    {
      id: 'diversity-inclusion',
      name: 'Diversity & Inclusion Report',
      description: 'Workforce diversity metrics, inclusion initiatives, and progress tracking',
      category: 'esg',
      icon: <Users className="h-5 w-5" />,
      frequency: 'quarterly',
    },
  ];

  useEffect(() => {
    loadScheduledReports();
  }, []);

  const loadScheduledReports = () => {
    // Mock scheduled reports
    const mockScheduled: ScheduledReport[] = [
      {
        id: 'sched-1',
        reportId: 'board-meeting',
        reportName: 'Board Meeting Report',
        frequency: 'Quarterly',
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        recipients: ['board@company.com', 'ceo@company.com'],
        status: 'active',
      },
      {
        id: 'sched-2',
        reportId: 'operational-dashboard',
        reportName: 'Operational Performance',
        frequency: 'Weekly',
        nextRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        recipients: ['operations@company.com', 'coo@company.com'],
        status: 'active',
      },
    ];

    setScheduledReports(mockScheduled);
  };

  const handleGenerateReport = async (reportId: string) => {
    setLoading(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Report generated successfully');
      
      // Trigger download
      const report = reports.find(r => r.id === reportId);
      if (report) {
        // In a real implementation, this would download the actual report
        console.log(`Downloading report: ${report.name}`);
      }
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleReport = (reportId: string) => {
    toast.success('Report scheduling dialog would open here');
  };

  const filteredReports = selectedCategory === 'all' 
    ? reports 
    : reports.filter(r => r.category === selectedCategory);

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'board': return 'bg-purple-100 text-purple-800';
      case 'investor': return 'bg-blue-100 text-blue-800';
      case 'compliance': return 'bg-green-100 text-green-800';
      case 'operational': return 'bg-orange-100 text-orange-800';
      case 'esg': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Reports</h1>
          <p className="text-gray-600 mt-1">
            Generate and schedule comprehensive business reports
          </p>
        </div>
        <Button>
          <FileBarChart className="h-4 w-4 mr-2" />
          Custom Report Builder
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Category:</span>
        <div className="flex gap-2">
          {['all', 'board', 'investor', 'compliance', 'operational', 'esg'].map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="available" className="space-y-6">
        <TabsList>
          <TabsTrigger value="available">Available Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <Card key={report.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getCategoryBadgeColor(report.category)}`}>
                    {report.icon}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {report.frequency}
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {report.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {report.description}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleScheduleReport(report.id)}
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>

                {report.lastGenerated && (
                  <p className="text-xs text-gray-500 mt-3">
                    Last generated: {report.lastGenerated.toLocaleDateString()}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Scheduled Reports</h3>
            
            {scheduledReports.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scheduled reports</p>
                <p className="text-sm mt-2">Schedule reports to receive them automatically</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledReports.map((scheduled) => (
                  <div
                    key={scheduled.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {scheduled.reportName}
                        </h4>
                        <Badge
                          variant={scheduled.status === 'active' ? 'default' : 'secondary'}
                        >
                          {scheduled.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {scheduled.frequency}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Next: {scheduled.nextRun.toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {scheduled.recipients.length} recipients
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        {scheduled.status === 'active' ? 'Pause' : 'Resume'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Report History</h3>
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No report history available</p>
              <p className="text-sm mt-2">Generated reports will appear here</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">{scheduledReports.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Generated This Month</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recipients</p>
              <p className="text-2xl font-bold text-gray-900">
                {scheduledReports.reduce((sum, r) => sum + r.recipients.length, 0)}
              </p>
            </div>
            <Mail className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>
    </div>
  );
}
