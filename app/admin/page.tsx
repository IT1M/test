'use client';

// Admin Dashboard - System overview with real-time monitoring
// Requirements: 7.1, 7.3, 7.10

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db/schema';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Activity,
  Database,
  Users,
  TrendingUp,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  HardDrive,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import GeminiAPIAnalytics from '@/components/admin/GeminiAPIAnalytics';
import DataOperationsMonitor from '@/components/admin/DataOperationsMonitor';
import DebugTools from '@/components/admin/DebugTools';

interface SystemStatus {
  apiHealth: 'healthy' | 'degraded' | 'down';
  databaseSize: number;
  activeUsers: number;
  uptime: string;
}

interface BusinessAnalytics {
  totalRevenue: number;
  profitMargin: number;
  salesTrend: 'up' | 'down' | 'stable';
  orderCount: number;
  customerCount: number;
  productCount: number;
}

interface PerformanceMetrics {
  avgResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  dbQueryTime: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    apiHealth: 'healthy',
    databaseSize: 0,
    activeUsers: 0,
    uptime: '0h 0m',
  });
  const [businessAnalytics, setBusinessAnalytics] = useState<BusinessAnalytics>({
    totalRevenue: 0,
    profitMargin: 0,
    salesTrend: 'stable',
    orderCount: 0,
    customerCount: 0,
    productCount: 0,
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    avgResponseTime: 0,
    errorRate: 0,
    cacheHitRate: 0,
    dbQueryTime: 0,
  });
  const [loading, setLoading] = useState(true);

  // Check authentication and admin role
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  // Password verification for admin dashboard access
  const handlePasswordVerification = () => {
    // In production, this should verify against a secure hash
    // For now, using a simple check (should be replaced with proper authentication)
    if (password === 'admin123' || user?.role === 'admin') {
      setIsPasswordVerified(true);
      toast.success('Access granted');
      loadDashboardData();
    } else {
      toast.error('Invalid password');
    }
  };

  // Load all dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSystemStatus(),
        loadBusinessAnalytics(),
        loadPerformanceMetrics(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load system status
  const loadSystemStatus = async () => {
    try {
      // Get database statistics
      const stats = await db.getStats();
      
      // Get active users (users who logged in within last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeUsers = await db.users
        .where('lastLogin')
        .above(oneDayAgo)
        .count();

      // Calculate uptime (time since app started)
      const uptimeMs = Date.now() - (performance.timeOrigin || Date.now());
      const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
      const uptimeMinutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));

      // Check API health by looking at recent error logs
      const recentErrors = await db.systemLogs
        .where('status')
        .equals('error')
        .and(log => log.timestamp > new Date(Date.now() - 5 * 60 * 1000))
        .count();

      const apiHealth = recentErrors > 10 ? 'degraded' : recentErrors > 0 ? 'healthy' : 'healthy';

      setSystemStatus({
        apiHealth,
        databaseSize: stats.totalSize,
        activeUsers,
        uptime: `${uptimeHours}h ${uptimeMinutes}m`,
      });
    } catch (error) {
      console.error('Error loading system status:', error);
    }
  };

  // Load business analytics
  const loadBusinessAnalytics = async () => {
    try {
      // Get total revenue from sales
      const sales = await db.sales.toArray();
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      
      // Calculate profit margin
      const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      // Get sales trend (compare last 7 days with previous 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      
      const recentSales = await db.sales
        .where('saleDate')
        .above(sevenDaysAgo)
        .toArray();
      
      const previousSales = await db.sales
        .where('saleDate')
        .between(fourteenDaysAgo, sevenDaysAgo)
        .toArray();

      const recentTotal = recentSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const previousTotal = previousSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      
      let salesTrend: 'up' | 'down' | 'stable' = 'stable';
      if (recentTotal > previousTotal * 1.05) salesTrend = 'up';
      else if (recentTotal < previousTotal * 0.95) salesTrend = 'down';

      // Get counts
      const orderCount = await db.orders.count();
      const customerCount = await db.customers.count();
      const productCount = await db.products.count();

      setBusinessAnalytics({
        totalRevenue,
        profitMargin,
        salesTrend,
        orderCount,
        customerCount,
        productCount,
      });
    } catch (error) {
      console.error('Error loading business analytics:', error);
    }
  };

  // Load performance metrics
  const loadPerformanceMetrics = async () => {
    try {
      // Get performance logs from system logs
      const perfLogs = await db.systemLogs
        .where('action')
        .equals('performance_metric')
        .and(log => log.timestamp > new Date(Date.now() - 60 * 60 * 1000)) // Last hour
        .toArray();

      // Calculate average response time
      const responseTimes = perfLogs
        .filter(log => log.details.includes('api_'))
        .map(log => {
          try {
            const details = JSON.parse(log.details);
            return details.value || 0;
          } catch {
            return 0;
          }
        });

      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

      // Calculate error rate
      const totalLogs = await db.systemLogs
        .where('timestamp')
        .above(new Date(Date.now() - 60 * 60 * 1000))
        .count();
      
      const errorLogs = await db.systemLogs
        .where('status')
        .equals('error')
        .and(log => log.timestamp > new Date(Date.now() - 60 * 60 * 1000))
        .count();

      const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;

      // Estimate cache hit rate (simplified)
      const cacheHitRate = 75; // Placeholder - would need actual cache metrics

      // Estimate DB query time (simplified)
      const dbQueryTime = 50; // Placeholder - would need actual query metrics

      setPerformanceMetrics({
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        cacheHitRate,
        dbQueryTime,
      });
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    }
  };

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (isPasswordVerified) {
      const interval = setInterval(() => {
        loadDashboardData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isPasswordVerified]);

  // Password verification screen
  if (!isPasswordVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Admin Dashboard Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Enter Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordVerification()}
                  placeholder="Enter password"
                />
              </div>
              <Button
                onClick={handlePasswordVerification}
                className="w-full"
              >
                Verify Access
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">System monitoring and management</p>
          </div>
          <Button onClick={loadDashboardData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        {/* System Status Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">API Health</p>
                    <p className="text-2xl font-bold mt-1 capitalize">{systemStatus.apiHealth}</p>
                  </div>
                  {systemStatus.apiHealth === 'healthy' ? (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-yellow-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Database Size</p>
                    <p className="text-2xl font-bold mt-1">
                      {(systemStatus.databaseSize / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <HardDrive className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold mt-1">{systemStatus.activeUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">System Uptime</p>
                    <p className="text-2xl font-bold mt-1">{systemStatus.uptime}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Business Analytics Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Business Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold mt-1">
                      ${businessAnalytics.totalRevenue.toLocaleString()}
                    </p>
                    <div className="flex items-center mt-2">
                      <TrendingUp
                        className={`h-4 w-4 mr-1 ${
                          businessAnalytics.salesTrend === 'up'
                            ? 'text-green-500'
                            : businessAnalytics.salesTrend === 'down'
                            ? 'text-red-500'
                            : 'text-gray-500'
                        }`}
                      />
                      <span className="text-sm text-gray-600 capitalize">
                        {businessAnalytics.salesTrend}
                      </span>
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Profit Margin</p>
                    <p className="text-2xl font-bold mt-1">
                      {businessAnalytics.profitMargin.toFixed(1)}%
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold mt-1">
                      {businessAnalytics.orderCount.toLocaleString()}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold mt-1">
                    {businessAnalytics.customerCount.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold mt-1">
                    {businessAnalytics.productCount.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-gray-600">Sales Trend</p>
                  <p className="text-2xl font-bold mt-1 capitalize">
                    {businessAnalytics.salesTrend}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Performance Metrics Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold mt-1">
                    {performanceMetrics.avgResponseTime}ms
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-gray-600">Error Rate</p>
                  <p className="text-2xl font-bold mt-1">
                    {performanceMetrics.errorRate}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-gray-600">Cache Hit Rate</p>
                  <p className="text-2xl font-bold mt-1">
                    {performanceMetrics.cacheHitRate}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-gray-600">DB Query Time</p>
                  <p className="text-2xl font-bold mt-1">
                    {performanceMetrics.dbQueryTime}ms
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20"
              onClick={() => router.push('/admin/logs')}
            >
              <Database className="mr-2 h-5 w-5" />
              View System Logs
            </Button>
            <Button
              variant="outline"
              className="h-20"
              onClick={() => router.push('/admin/users')}
            >
              <Users className="mr-2 h-5 w-5" />
              Manage Users
            </Button>
            <Button
              variant="outline"
              className="h-20"
              onClick={() => router.push('/settings')}
            >
              <Activity className="mr-2 h-5 w-5" />
              System Settings
            </Button>
          </div>
        </div>

        {/* Gemini API Analytics */}
        <GeminiAPIAnalytics />

        {/* Data Operations Monitor */}
        <DataOperationsMonitor />

        {/* Debug Tools */}
        <DebugTools />
      </div>
    </div>
  );
}
