'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  RefreshCw,
  Download,
  Settings,
  Zap,
  Target,
  Activity,
} from 'lucide-react';
import { FinancialAnalyticsService } from '@/services/analytics/financial';
import { InsightsService } from '@/services/gemini/insights';
import { GeminiService } from '@/services/gemini/client';
import { db } from '@/lib/db/schema';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/formatters';
import { toast } from 'react-hot-toast';

interface ExecutiveKPI {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

export default function ExecutiveDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [comparison, setComparison] = useState<'YoY' | 'MoM' | 'QoQ'>('MoM');
  const [kpis, setKpis] = useState<ExecutiveKPI[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [briefing, setBriefing] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, [period, comparison]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Calculate date range based on period
      const { startDate, endDate, previousStart, previousEnd } = getDateRange(period);

      // Load financial metrics
      const [currentMetrics, previousMetrics] = await Promise.all([
        FinancialAnalyticsService.getFinancialMetrics(startDate, endDate),
        FinancialAnalyticsService.getFinancialMetrics(previousStart, previousEnd),
      ]);

      // Load operational data
      const [orders, customers, products, inventory] = await Promise.all([
        db.orders.where('orderDate').between(startDate, endDate, true, true).toArray(),
        db.customers.toArray(),
        db.products.toArray(),
        db.inventory.toArray(),
      ]);

      const previousOrders = await db.orders
        .where('orderDate')
        .between(previousStart, previousEnd, true, true)
        .toArray();

      // Calculate KPIs
      const calculatedKPIs: ExecutiveKPI[] = [
        {
          label: 'Total Revenue',
          value: formatCurrency(currentMetrics.revenue),
          change: calculateChange(currentMetrics.revenue, previousMetrics.revenue),
          trend: currentMetrics.revenue >= previousMetrics.revenue ? 'up' : 'down',
          icon: <DollarSign className="h-5 w-5" />,
          color: 'text-green-600',
        },
        {
          label: 'Net Profit',
          value: formatCurrency(currentMetrics.netProfit),
          change: calculateChange(currentMetrics.netProfit, previousMetrics.netProfit),
          trend: currentMetrics.netProfit >= previousMetrics.netProfit ? 'up' : 'down',
          icon: <TrendingUp className="h-5 w-5" />,
          color: 'text-blue-600',
        },
        {
          label: 'Total Orders',
          value: formatNumber(orders.length),
          change: calculateChange(orders.length, previousOrders.length),
          trend: orders.length >= previousOrders.length ? 'up' : 'down',
          icon: <ShoppingCart className="h-5 w-5" />,
          color: 'text-purple-600',
        },
        {
          label: 'Active Customers',
          value: formatNumber(customers.filter(c => c.isActive).length),
          change: 0,
          trend: 'neutral',
          icon: <Users className="h-5 w-5" />,
          color: 'text-orange-600',
        },
        {
          label: 'Inventory Value',
          value: formatCurrency(calculateInventoryValue(inventory, products)),
          change: 0,
          trend: 'neutral',
          icon: <Package className="h-5 w-5" />,
          color: 'text-indigo-600',
        },
        {
          label: 'Profit Margin',
          value: formatPercentage(currentMetrics.profitMargin),
          change: currentMetrics.profitMargin - previousMetrics.profitMargin,
          trend: currentMetrics.profitMargin >= previousMetrics.profitMargin ? 'up' : 'down',
          icon: <Target className="h-5 w-5" />,
          color: 'text-teal-600',
        },
      ];

      setKpis(calculatedKPIs);

      // Load alerts
      await loadAlerts();

      // Load AI insights
      await loadAIInsights();

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const criticalAlerts: Alert[] = [];

      // Check low stock
      const lowStock = await db.products
        .where('isActive')
        .equals(1)
        .and(p => p.stockQuantity <= p.reorderLevel)
        .toArray();

      if (lowStock.length > 0) {
        criticalAlerts.push({
          id: 'low-stock',
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${lowStock.length} products are below reorder level`,
          timestamp: new Date(),
        });
      }

      // Check overdue invoices
      const today = new Date();
      const overdueInvoices = await db.invoices
        .where('status')
        .anyOf(['unpaid', 'partially-paid'])
        .and(inv => inv.dueDate < today)
        .toArray();

      if (overdueInvoices.length > 0) {
        const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
        criticalAlerts.push({
          id: 'overdue-invoices',
          type: 'critical',
          title: 'Overdue Payments',
          message: `${overdueInvoices.length} invoices overdue totaling ${formatCurrency(totalOverdue)}`,
          timestamp: new Date(),
        });
      }

      // Check expiring products
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const expiringProducts = await db.products
        .where('isActive')
        .equals(1)
        .and(p => p.expiryDate !== undefined && p.expiryDate <= futureDate)
        .toArray();

      if (expiringProducts.length > 0) {
        criticalAlerts.push({
          id: 'expiring-products',
          type: 'warning',
          title: 'Products Expiring Soon',
          message: `${expiringProducts.length} products expiring within 30 days`,
          timestamp: new Date(),
        });
      }

      setAlerts(criticalAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadAIInsights = async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('Gemini API key not configured');
        return;
      }

      const gemini = new GeminiService({ apiKey });
      const insightsService = new InsightsService(gemini);

      // Generate morning briefing
      const dailyBriefing = await insightsService.generateMorningBriefing();
      setBriefing(dailyBriefing);

      // Set insights from briefing
      setAiInsights([
        ...dailyBriefing.highlights,
        ...dailyBriefing.opportunities,
      ]);
    } catch (error) {
      console.error('Error loading AI insights:', error);
    }
  };

  const getDateRange = (period: string) => {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'daily':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'yearly':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    const periodLength = endDate.getTime() - startDate.getTime();
    const previousEnd = new Date(startDate);
    const previousStart = new Date(startDate.getTime() - periodLength);

    return { startDate, endDate, previousStart, previousEnd };
  };

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const calculateInventoryValue = (inventory: any[], products: any[]): number => {
    return inventory.reduce((sum, inv) => {
      const product = products.find(p => p.id === inv.productId);
      return sum + (product ? product.costPrice * inv.quantity : 0);
    }, 0);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const handleExport = () => {
    toast.success('Exporting dashboard data...');
    // Implementation for export functionality
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive business overview and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Period:</span>
          <div className="flex gap-1">
            {(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Compare:</span>
          <div className="flex gap-1">
            {(['YoY', 'MoM', 'QoQ'] as const).map((c) => (
              <Button
                key={c}
                variant={comparison === c ? 'default' : 'outline'}
                size="sm"
                onClick={() => setComparison(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <Card className="p-4 border-l-4 border-l-red-500 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">Critical Alerts</h3>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-800">{alert.title}</p>
                      <p className="text-sm text-red-700">{alert.message}</p>
                    </div>
                    <Badge variant={alert.type === 'critical' ? 'destructive' : 'default'}>
                      {alert.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-gray-100 ${kpi.color}`}>
                {kpi.icon}
              </div>
              <div className="flex items-center gap-1">
                {kpi.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : kpi.trend === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : (
                  <Activity className="h-4 w-4 text-gray-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    kpi.trend === 'up'
                      ? 'text-green-600'
                      : kpi.trend === 'down'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {kpi.change > 0 ? '+' : ''}
                  {kpi.change.toFixed(1)}%
                </span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</h3>
            <p className="text-sm text-gray-600">{kpi.label}</p>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="briefing">Daily Briefing</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <BarChart3 className="h-12 w-12 mb-2" />
                <p>Chart visualization will be rendered here</p>
              </div>
            </Card>

            {/* Top Products */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Performing Products</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <BarChart3 className="h-12 w-12 mb-2" />
                <p>Chart visualization will be rendered here</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-purple-100">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
                <p className="text-sm text-gray-600">
                  Intelligent recommendations based on your business data
                </p>
              </div>
            </div>

            {aiInsights.length > 0 ? (
              <div className="space-y-4">
                {aiInsights.map((insight, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200"
                  >
                    <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>AI insights will appear here</p>
                <p className="text-sm mt-2">Configure your Gemini API key to enable AI features</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="briefing" className="space-y-6">
          {briefing ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Highlights */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Key Highlights
                </h3>
                <ul className="space-y-2">
                  {briefing.highlights.map((highlight: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Actions Needed */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Actions Needed Today
                </h3>
                <ul className="space-y-2">
                  {briefing.actionsNeeded.map((action: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-orange-600 mt-1">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Opportunities */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Opportunities
                </h3>
                <ul className="space-y-2">
                  {briefing.opportunities.map((opportunity: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      {opportunity}
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Risks */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Risks & Concerns
                </h3>
                <ul className="space-y-2">
                  {briefing.risks.map((risk: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Daily briefing will be generated here</p>
              <p className="text-sm text-gray-500 mt-2">
                Configure your Gemini API key to enable AI briefings
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="h-96 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Performance charts will be rendered here</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
