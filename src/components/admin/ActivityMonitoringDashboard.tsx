'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  RefreshCw, 
  Users, 
  Activity, 
  Shield, 
  AlertTriangle,
  Clock,
  Monitor,
  Globe,
  Smartphone,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SessionInfo {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  device?: string;
  browser?: string;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  duration: number;
}

interface ActivitySummary {
  totalActiveSessions: number;
  totalUsers: number;
  recentActivities: Array<{
    id: string;
    userId: string;
    userName: string;
    action: string;
    resource?: string;
    timestamp: Date;
    ipAddress: string;
  }>;
  topActions: Array<{
    action: string;
    count: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    count: number;
  }>;
}

interface SecurityAlert {
  id: string;
  userId?: string;
  userName?: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  metadata?: any;
  ipAddress?: string;
  isResolved: boolean;
  createdAt: Date;
}

export default function ActivityMonitoringDashboard() {
  const t = useTranslations();
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>([]);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState(24);

  const fetchData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const [sessionsRes, summaryRes, alertsRes] = await Promise.all([
        fetch('/api/admin/activity/sessions'),
        fetch(`/api/admin/activity/summary?hours=${selectedTimeRange}`),
        fetch('/api/admin/security/alerts?unresolved=true&limit=20'),
      ]);

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setActiveSessions(sessionsData.data || []);
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setActivitySummary(summaryData.data);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setSecurityAlerts(alertsData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/security/alerts/${alertId}/resolve`, {
        method: 'POST',
      });

      if (response.ok) {
        setSecurityAlerts(prev => prev.filter(alert => alert.id !== alertId));
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedTimeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive';
      case 'MANAGER': return 'warning';
      case 'SUPERVISOR': return 'info';
      default: return 'secondary';
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.toLowerCase().includes('mobile')) {
      return <Smartphone className="w-4 h-4" />;
    }
    return <Monitor className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">مراقبة النشاط</h1>
          <p className="text-muted-foreground">مراقبة نشاط المستخدمين والأمان في الوقت الفعلي</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(Number(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            <option value={1}>آخر ساعة</option>
            <option value={6}>آخر 6 ساعات</option>
            <option value={24}>آخر 24 ساعة</option>
            <option value={168}>آخر أسبوع</option>
          </select>
          <Button onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {activitySummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الجلسات النشطة</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activitySummary.totalActiveSessions}</div>
              <p className="text-xs text-muted-foreground">
                {activitySummary.totalUsers} مستخدم نشط
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الأنشطة الحديثة</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activitySummary.recentActivities.length}</div>
              <p className="text-xs text-muted-foreground">
                في آخر {selectedTimeRange} ساعة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">التنبيهات الأمنية</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{securityAlerts.length}</div>
              <p className="text-xs text-muted-foreground">
                تنبيهات غير محلولة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">أكثر الأنشطة</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activitySummary.topActions[0]?.action || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {activitySummary.topActions[0]?.count || 0} مرة
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              الجلسات النشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {activeSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(session.userAgent)}
                    <div>
                      <div className="font-medium">{session.user.name}</div>
                      <div className="text-sm text-muted-foreground">{session.user.email}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Globe className="w-3 h-3" />
                        {session.ipAddress}
                        <Clock className="w-3 h-3 ml-2" />
                        {formatDuration(session.duration)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={getRoleColor(session.user.role)}>
                      {session.user.role}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(session.lastActivity).toLocaleTimeString('ar-SA')}
                    </div>
                  </div>
                </div>
              ))}
              {activeSessions.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  لا توجد جلسات نشطة حالياً
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              التنبيهات الأمنية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {securityAlerts.map((alert) => (
                <div key={alert.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {alert.alertType}
                        </span>
                      </div>
                      <div className="font-medium mb-1">{alert.title}</div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {alert.description}
                      </div>
                      {alert.userName && (
                        <div className="text-xs text-muted-foreground">
                          المستخدم: {alert.userName}
                        </div>
                      )}
                      {alert.ipAddress && (
                        <div className="text-xs text-muted-foreground">
                          IP: {alert.ipAddress}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleString('ar-SA')}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveAlert(alert.id)}
                      className="ml-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {securityAlerts.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  لا توجد تنبيهات أمنية
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      {activitySummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              الأنشطة الحديثة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activitySummary.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <span className="font-medium">{activity.userName}</span>
                      <span className="text-muted-foreground mx-2">قام بـ</span>
                      <span className="font-medium">{activity.action}</span>
                      {activity.resource && (
                        <>
                          <span className="text-muted-foreground mx-2">على</span>
                          <span className="text-sm">{activity.resource}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{new Date(activity.timestamp).toLocaleTimeString('ar-SA')}</div>
                    <div className="text-xs">{activity.ipAddress}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Actions Chart */}
      {activitySummary && activitySummary.topActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>أكثر الأنشطة تكراراً</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activitySummary.topActions.slice(0, 10).map((action, index) => (
                <div key={action.action} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <span className="font-medium">{action.action}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(action.count / activitySummary.topActions[0].count) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{action.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}