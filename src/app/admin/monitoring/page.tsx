'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Server, Database, HardDrive, Cpu } from 'lucide-react';

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  responseTime: string;
  database: {
    status: string;
    responseTime: string;
  };
  memory: {
    used: number;
    total: number;
    external: number;
  };
  diskSpace?: {
    free: number;
    total: number;
  };
  version: string;
  nodeVersion: string;
}

export default function MonitoringPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/health/detailed');
      const data = await response.json();
      setHealthData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    return status === 'healthy' || status === 'connected' ? 'success' : 'destructive';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <Button onClick={fetchHealthData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* System Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge variant={getStatusColor(healthData.status)}>
                  {healthData.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Response Time: {healthData.responseTime}
              </p>
              <p className="text-xs text-muted-foreground">
                Uptime: {formatUptime(healthData.uptime)}
              </p>
            </CardContent>
          </Card>

          {/* Database Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge variant={getStatusColor(healthData.database.status)}>
                  {healthData.database.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Response Time: {healthData.database.responseTime}
              </p>
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {healthData.memory.used}MB
              </div>
              <p className="text-xs text-muted-foreground">
                of {healthData.memory.total}MB total
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(healthData.memory.used / healthData.memory.total) * 100}%`,
                  }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Disk Space */}
          {healthData.diskSpace && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disk Space</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(healthData.diskSpace.free / 1024 / 1024 / 1024)}GB
                </div>
                <p className="text-xs text-muted-foreground">
                  of {Math.round(healthData.diskSpace.total / 1024 / 1024 / 1024)}GB free
                </p>
              </CardContent>
            </Card>
          )}

          {/* Version Info */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Version Info</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">App: v{healthData.version}</p>
              <p className="text-xs text-muted-foreground">
                Node: {healthData.nodeVersion}
              </p>
              <p className="text-xs text-muted-foreground">
                Last Update: {lastUpdate.toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
