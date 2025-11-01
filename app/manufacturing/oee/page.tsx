'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  RefreshCw,
  Download,
  Sparkles
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import { manufacturingAnalytics } from '@/services/analytics/manufacturing';
import type { OEEResult, OEEBreakdown, OEETrendPoint, OEEAlert } from '@/services/analytics/manufacturing';
import { db } from '@/lib/db/schema';
import type { Machine } from '@/types/database';
import { formatDate, formatDateShort } from '@/lib/utils/formatters';
import toast from 'react-hot-toast';

export default function OEEMonitoringPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [oeeData, setOeeData] = useState<OEEResult | null>(null);
  const [machineBreakdown, setMachineBreakdown] = useState<OEEBreakdown[]>([]);
  const [productBreakdown, setProductBreakdown] = useState<OEEBreakdown[]>([]);
  const [trendData, setTrendData] = useState<OEETrendPoint[]>([]);
  const [alerts, setAlerts] = useState<OEEAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [generatingInsights, setGeneratingInsights] = useState(false);

  const OEE_TARGET = 85; // Default OEE target

  useEffect(() => {
    loadMachines();
    loadData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedMachine, timeRange]);

  const loadMachines = async () => {
    try {
      const machineList = await db.machines.toArray();
      setMachines(machineList);
    } catch (error) {
      console.error('Error loading machines:', error);
      toast.error('Failed to load machines');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      // Load OEE data for selected machine or all machines
      if (selectedMachine !== 'all') {
        const oee = await manufacturingAnalytics.calculateOEE(
          selectedMachine,
          startDate,
          endDate
        );
        setOeeData(oee);

        // Load trend data
        const trend = await manufacturingAnalytics.getOEETrend(
          selectedMachine,
          startDate,
          endDate,
          timeRange === 'today' ? 'hour' : 'day',
          OEE_TARGET
        );
        setTrendData(trend);
      } else {
        setOeeData(null);
        setTrendData([]);
      }

      // Load breakdowns
      const machineBreak = await manufacturingAnalytics.getOEEByMachine(startDate, endDate);
      setMachineBreakdown(machineBreak);

      const productBreak = await manufacturingAnalytics.getOEEByProduct(startDate, endDate);
      setProductBreakdown(productBreak);

      // Load alerts
      const alertList = await manufacturingAnalytics.getOEEAlerts(OEE_TARGET, startDate, endDate);
      setAlerts(alertList);

    } catch (error) {
      console.error('Error loading OEE data:', error);
      toast.error('Failed to load OEE data');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const endDate = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        break;
    }

    return { startDate, endDate };
  };

  const generateAIInsights = async () => {
    setGeneratingInsights(true);
    try {
      // Prepare data summary for AI analysis
      const summary = {
        timeRange,
        machineCount: machineBreakdown.length,
        avgOEE: machineBreakdown.reduce((sum, m) => sum + m.oee.oee, 0) / machineBreakdown.length,
        alertCount: alerts.length,
        topPerformer: machineBreakdown[0],
        bottomPerformer: machineBreakdown[machineBreakdown.length - 1],
        productBreakdown: productBreakdown.slice(0, 5),
      };

      const prompt = `Analyze this manufacturing OEE data and provide actionable insights:

Time Range: ${timeRange}
Machines: ${summary.machineCount}
Average OEE: ${summary.avgOEE.toFixed(1)}%
Target OEE: ${OEE_TARGET}%
Active Alerts: ${summary.alertCount}

Top Performer: ${summary.topPerformer?.value} (${summary.topPerformer?.oee.oee.toFixed(1)}%)
- Availability: ${summary.topPerformer?.oee.availability.toFixed(1)}%
- Performance: ${summary.topPerformer?.oee.performance.toFixed(1)}%
- Quality: ${summary.topPerformer?.oee.quality.toFixed(1)}%

Bottom Performer: ${summary.bottomPerformer?.value} (${summary.bottomPerformer?.oee.oee.toFixed(1)}%)
- Availability: ${summary.bottomPerformer?.oee.availability.toFixed(1)}%
- Performance: ${summary.bottomPerformer?.oee.performance.toFixed(1)}%
- Quality: ${summary.bottomPerformer?.oee.quality.toFixed(1)}%

Provide:
1. Key observations about OEE performance
2. Specific recommendations to improve OEE
3. Priority actions for underperforming machines
4. Best practices from top performers that can be replicated`;

      // Import Gemini service
      const { GeminiService } = await import('@/services/gemini/client');
      const gemini = new GeminiService({
        apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
      });
      const insights = await gemini.generateContent(prompt);
      
      setAiInsights(insights);
      toast.success('AI insights generated');
    } catch (error) {
      console.error('Error generating AI insights:', error);
      toast.error('Failed to generate AI insights');
    } finally {
      setGeneratingInsights(false);
    }
  };

  const getOEEColor = (oee: number) => {
    if (oee >= OEE_TARGET) return 'text-green-600';
    if (oee >= OEE_TARGET * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOEEBadge = (oee: number) => {
    if (oee >= OEE_TARGET) return <Badge className="bg-green-500">Excellent</Badge>;
    if (oee >= OEE_TARGET * 0.8) return <Badge className="bg-yellow-500">Good</Badge>;
    return <Badge className="bg-red-500">Needs Improvement</Badge>;
  };

  if (loading && !oeeData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OEE Monitoring</h1>
          <p className="text-gray-500 mt-1">
            Overall Equipment Effectiveness tracking and analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Machine</label>
              <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Machines</SelectItem>
                  {machines.map(machine => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Time Range</label>
              <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <span className="font-semibold">{alerts.length} machine(s)</span> have OEE below target threshold
          </AlertDescription>
        </Alert>
      )}

      {/* OEE Summary Cards */}
      {oeeData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Overall OEE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-3xl font-bold ${getOEEColor(oeeData.oee)}`}>
                    {oeeData.oee.toFixed(1)}%
                  </div>
                  <div className="mt-2">
                    {getOEEBadge(oeeData.oee)}
                  </div>
                </div>
                <Target className="h-12 w-12 text-gray-300" />
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Target: {OEE_TARGET}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-3xl font-bold ${getOEEColor(oeeData.availability)}`}>
                    {oeeData.availability.toFixed(1)}%
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Uptime vs Planned
                  </div>
                </div>
                <Clock className="h-12 w-12 text-gray-300" />
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Downtime: {oeeData.downtime.toFixed(0)} min
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-3xl font-bold ${getOEEColor(oeeData.performance)}`}>
                    {oeeData.performance.toFixed(1)}%
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Speed vs Target
                  </div>
                </div>
                <Zap className="h-12 w-12 text-gray-300" />
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Output: {oeeData.totalUnitsProduced} units
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-3xl font-bold ${getOEEColor(oeeData.quality)}`}>
                    {oeeData.quality.toFixed(1)}%
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Good vs Total
                  </div>
                </div>
                <CheckCircle2 className="h-12 w-12 text-gray-300" />
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Rejected: {oeeData.rejectedUnits} units
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* OEE Trend Chart */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>OEE Trend</CardTitle>
            <CardDescription>
              OEE components over time with target comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => formatDateShort(value)}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Legend />
                <ReferenceLine 
                  y={OEE_TARGET} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3" 
                  label="Target"
                />
                <Area 
                  type="monotone" 
                  dataKey="oee" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  name="OEE"
                />
                <Line 
                  type="monotone" 
                  dataKey="availability" 
                  stroke="#10b981" 
                  name="Availability"
                />
                <Line 
                  type="monotone" 
                  dataKey="performance" 
                  stroke="#f59e0b" 
                  name="Performance"
                />
                <Line 
                  type="monotone" 
                  dataKey="quality" 
                  stroke="#8b5cf6" 
                  name="Quality"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Breakdowns */}
      <Tabs defaultValue="machines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="machines">By Machine</TabsTrigger>
          <TabsTrigger value="products">By Product</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="machines">
          <Card>
            <CardHeader>
              <CardTitle>OEE by Machine</CardTitle>
              <CardDescription>
                Performance comparison across all machines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={machineBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="value" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <ReferenceLine y={OEE_TARGET} stroke="#ef4444" strokeDasharray="3 3" />
                  <Bar dataKey="oee.oee" fill="#3b82f6" name="OEE" />
                  <Bar dataKey="oee.availability" fill="#10b981" name="Availability" />
                  <Bar dataKey="oee.performance" fill="#f59e0b" name="Performance" />
                  <Bar dataKey="oee.quality" fill="#8b5cf6" name="Quality" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>OEE by Product</CardTitle>
              <CardDescription>
                Performance comparison across products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={productBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="value" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <ReferenceLine y={OEE_TARGET} stroke="#ef4444" strokeDasharray="3 3" />
                  <Bar dataKey="oee.oee" fill="#3b82f6" name="OEE" />
                  <Bar dataKey="oee.quality" fill="#8b5cf6" name="Quality" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>OEE Alerts</CardTitle>
              <CardDescription>
                Machines with OEE below threshold ({OEE_TARGET}%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>All machines are performing above target OEE</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map(alert => (
                    <div 
                      key={alert.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <AlertTriangle 
                        className={`h-5 w-5 mt-0.5 ${
                          alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{alert.machineName}</span>
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(alert.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI-Powered Insights</CardTitle>
                  <CardDescription>
                    Gemini AI analysis and recommendations
                  </CardDescription>
                </div>
                <Button
                  onClick={generateAIInsights}
                  disabled={generatingInsights}
                >
                  <Sparkles className={`h-4 w-4 mr-2 ${generatingInsights ? 'animate-spin' : ''}`} />
                  Generate Insights
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {aiInsights ? (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-sm">{aiInsights}</div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Click "Generate Insights" to get AI-powered recommendations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
