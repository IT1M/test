'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Filter,
  Download,
  Settings,
  Plus
} from 'lucide-react';
import { AlertManager } from '@/services/ai/alert-manager';
import { AIAlert } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { FloatingHelpButton } from '@/components/ai-control';

export default function AlertsPage() {
  const [activeAlerts, setActiveAlerts] = useState<AIAlert[]>([]);
  const [alertHistory, setAlertHistory] = useState<AIAlert[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('active');
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [active, history, stats] = await Promise.all([
        AlertManager.getActiveAlerts(),
        AlertManager.getAlertHistory({ limit: 50 }),
        AlertManager.getAlertAnalytics(),
      ]);

      setActiveAlerts(active);
      setAlertHistory(history);
      setAnalytics(stats);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await AlertManager.acknowledgeAlert(alertId, 'current-user', 'Current User');
      await loadData();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await AlertManager.resolveAlert(alertId, 'current-user', 'Current User');
      await loadData();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleSnooze = async (alertId: string, minutes: number) => {
    try {
      await AlertManager.snoozeAlert(alertId, 'current-user', 'Current User', minutes);
      await loadData();
    } catch (error) {
      console.error('Failed to snooze alert:', error);
    }
  };

  const getSeverityColor = (severity: AIAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: AIAlert['status']) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'snoozed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Alerts & Notifications</h1>
          <p className="text-gray-500 mt-1">Monitor and manage AI system alerts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowRuleBuilder(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Alert Rules
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Alert
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Alerts</p>
                <p className="text-2xl font-bold">{analytics.activeAlerts}</p>
              </div>
              <Bell className="w-8 h-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Resolved Today</p>
                <p className="text-2xl font-bold">{analytics.resolvedAlerts}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Resolution Time</p>
                <p className="text-2xl font-bold">{Math.round(analytics.averageResolutionTime)}m</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">MTTR</p>
                <p className="text-2xl font-bold">{Math.round(analytics.mttr)}m</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Alerts Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History
          </TabsTrigger>
          <TabsTrigger value="analytics">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">Loading alerts...</p>
            </Card>
          ) : activeAlerts.length === 0 ? (
            <Card className="p-8 text-center">
              <BellOff className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No active alerts</p>
            </Card>
          ) : (
            activeAlerts.map((alert) => (
              <Card key={alert.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`} />
                      <h3 className="font-semibold">{alert.title}</h3>
                      <Badge className={getStatusColor(alert.status)}>
                        {alert.status}
                      </Badge>
                      {alert.modelName && (
                        <Badge variant="outline">{alert.modelName}</Badge>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{alert.message}</p>
                    <p className="text-sm text-gray-400">
                      {formatDistanceToNow(alert.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {alert.status === 'active' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledge(alert.alertId)}
                        >
                          Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSnooze(alert.alertId, 30)}
                        >
                          Snooze 30m
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleResolve(alert.alertId)}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {alertHistory.map((alert) => (
            <Card key={alert.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`} />
                    <h3 className="font-semibold">{alert.title}</h3>
                    <Badge className={getStatusColor(alert.status)}>
                      {alert.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-2">{alert.message}</p>
                  <div className="flex gap-4 text-sm text-gray-400">
                    <span>Created: {formatDistanceToNow(alert.createdAt, { addSuffix: true })}</span>
                    {alert.resolvedAt && (
                      <span>Resolved: {formatDistanceToNow(alert.resolvedAt, { addSuffix: true })}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Alert Analytics</h3>
            {analytics && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Alerts by Type</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.alertsByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm">{type}</span>
                        <Badge>{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Alerts by Severity</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.alertsBySeverity).map(([severity, count]) => (
                      <div key={severity} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{severity}</span>
                        <Badge>{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Alerts by Model</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.alertsByModel).map(([model, count]) => (
                      <div key={model} className="flex items-center justify-between">
                        <span className="text-sm">{model}</span>
                        <Badge>{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Help Button */}
      <FloatingHelpButton />
    </div>
  );
}
