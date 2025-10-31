'use client';

import dynamic from 'next/dynamic';
import { PageLoadingSkeleton } from '@/components/common/LoadingSkeleton';

// Lazy load the reports dashboard component
const ReportsDashboard = dynamic(() => import('@/components/reports/ReportsDashboard'), {
  loading: () => <PageLoadingSkeleton />,
  ssr: false
});

export default function ReportsPage() {
  return <ReportsDashboard />;
}
  const [recentReports, setRecentReports] = useState<GeneratedReport[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);

  const predefinedReports: PredefinedReport[] = [
    {
      id: 'monthly-sales',
      name: 'Monthly Sales Report',
      description: 'Comprehensive sales analysis with revenue, orders, and top products',
      icon: TrendingUp,
      category: 'Sales',
      path: '/reports/monthly-sales'
    },
    {
      id: 'inventory-valuation',
      name: 'Inventory Valuation Report',
      description: 'Stock valuation using FIFO method with aging analysis',
      icon: Package,
      category: 'Inventory',
      path: '/reports/inventory-valuation'
    },
    {
      id: 'customer-purchase-history',
      name: 'Customer Purchase History',
      description: 'Detailed customer transaction history and buying patterns',
      icon: Users,
      category: 'Customers',
      path: '/reports/customer-purchase-history'
    },
    {
      id: 'profit-loss',
      name: 'Profit & Loss Statement',
      description: 'Financial performance with revenue, costs, and profitability',
      icon: DollarSign,
      category: 'Financial',
      path: '/reports/profit-loss'
    },
    {
      id: 'medical-records-summary',
      name: 'Medical Records Summary',
      description: 'Patient demographics, diagnoses, and treatment patterns',
      icon: Activity,
      category: 'Medical',
      path: '/reports/medical-records-summary'
    }
  ];

  useEffect(() => {
    loadRecentReports();
    loadScheduledReports();
  }, []);

  const loadRecentReports = async () => {
    try {
      // Load recent reports from system logs
      const logs = await db.systemLogs
        .where('action')
        .equals('report_generated')
        .reverse()
        .limit(10)
        .toArray();

      const reports: GeneratedReport[] = logs.map(log => {
        const details = JSON.parse(log.details);
        return {
          id: log.id,
          name: details.reportName || 'Unknown Report',
          type: details.reportType || 'general',
          generatedAt: log.timestamp,
          generatedBy: log.userId,
          fileSize: details.fileSize || 'N/A'
        };
      });

      setRecentReports(reports);
    } catch (error) {
      console.error('Error loading recent reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScheduledReports = async () => {
    // In a real implementation, this would load from a scheduled reports table
    // For now, we'll use mock data
    const mockScheduled: ScheduledReport[] = [
      {
        id: '1',
        name: 'Weekly Sales Summary',
        frequency: 'Weekly',
        nextRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        recipients: ['manager@company.com'],
        isActive: true
      },
      {
        id: '2',
        name: 'Monthly Inventory Report',
        frequency: 'Monthly',
        nextRun: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        recipients: ['inventory@company.com', 'manager@company.com'],
        isActive: true
      }
    ];

    setScheduledReports(mockScheduled);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Sales': 'bg-blue-100 text-blue-800',
      'Inventory': 'bg-green-100 text-green-800',
      'Customers': 'bg-purple-100 text-purple-800',
      'Financial': 'bg-yellow-100 text-yellow-800',
      'Medical': 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600 mt-1">
                Generate, view, and schedule business reports
              </p>
            </div>
            <Link href="/reports/builder">
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Custom Report
              </Button>
            </Link>
          </div>
        </div>

        {/* Predefined Reports */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Predefined Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {predefinedReports.map((report) => {
              const Icon = report.icon;
              return (
                <Card key={report.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{report.name}</CardTitle>
                          <Badge className={`mt-1 ${getCategoryColor(report.category)}`}>
                            {report.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {report.description}
                    </CardDescription>
                    <Link href={report.path}>
                      <Button variant="outline" className="w-full">
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Report
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recently Generated Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recently Generated
              </CardTitle>
              <CardDescription>
                Your most recent report generations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading reports...
                </div>
              ) : recentReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No reports generated yet
                </div>
              ) : (
                <div className="space-y-3">
                  {recentReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">{report.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(report.generatedAt)} • {report.fileSize}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scheduled Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Scheduled Reports
              </CardTitle>
              <CardDescription>
                Automated report generation schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No scheduled reports
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">{report.name}</p>
                          <p className="text-sm text-gray-500">
                            {report.frequency} • Next: {formatDate(report.nextRun)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {report.recipients.length} recipient(s)
                          </p>
                        </div>
                      </div>
                      <Badge variant={report.isActive ? 'default' : 'secondary'}>
                        {report.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Schedule New Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
