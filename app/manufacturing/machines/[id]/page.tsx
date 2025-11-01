'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/db/schema';
import { Machine, ProductionRun, MachineDowntime, MaintenanceSchedule, MachineMetrics } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit, 
  Activity, 
  Clock, 
  Wrench, 
  TrendingUp,
  AlertCircle,
  Play,
  Pause,
  Square,
  BarChart3
} from 'lucide-react';

export default function MachineDetailPage() {
  const router = useRouter();
  const params = useParams();
  const machineId = params.id as string;

  const [machine, setMachine] = useState<Machine | null>(null);
  const [currentRun, setCurrentRun] = useState<ProductionRun | null>(null);
  const [recentRuns, setRecentRuns] = useState<ProductionRun[]>([]);
  const [downtimeHistory, setDowntimeHistory] = useState<MachineDowntime[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceSchedule[]>([]);
  const [metrics, setMetrics] = useState<MachineMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMachineData();
  }, [machineId]);

  const loadMachineData = async () => {
    try {
      setLoading(true);
      
      // Load machine
      const machineData = await db.machines.get(machineId);
      if (!machineData) {
        router.push('/manufacturing/machines');
        return;
      }
      setMachine(machineData);

      // Load current production run
      const currentRunData = await db.productionRuns
        .where('machineId')
        .equals(machineData.machineId)
        .and(run => run.status === 'in-progress')
        .first();
      setCurrentRun(currentRunData || null);

      // Load recent production runs
      const runsData = await db.productionRuns
        .where('machineId')
        .equals(machineData.machineId)
        .reverse()
        .limit(10)
        .toArray();
      setRecentRuns(runsData);

      // Load downtime history
      const downtimeData = await db.machineDowntime
        .where('machineId')
        .equals(machineData.machineId)
        .reverse()
        .limit(20)
        .toArray();
      setDowntimeHistory(downtimeData);

      // Load maintenance history
      const maintenanceData = await db.maintenanceSchedule
        .where('machineId')
        .equals(machineData.machineId)
        .reverse()
        .limit(10)
        .toArray();
      setMaintenanceHistory(maintenanceData);

      // Load metrics
      const metricsData = await db.machineMetrics
        .where('machineId')
        .equals(machineData.machineId)
        .reverse()
        .limit(24)
        .toArray();
      setMetrics(metricsData);

    } catch (error) {
      console.error('Error loading machine data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'maintenance': return 'bg-blue-500';
      case 'down': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateUptime = () => {
    if (downtimeHistory.length === 0) return 100;
    
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const recentDowntime = downtimeHistory.filter(d => 
      new Date(d.startTime) >= last30Days
    );
    
    const totalDowntimeMinutes = recentDowntime.reduce((sum, d) => {
      const start = new Date(d.startTime).getTime();
      const end = d.endTime ? new Date(d.endTime).getTime() : Date.now();
      return sum + (end - start) / (1000 * 60);
    }, 0);
    
    const totalMinutesIn30Days = 30 * 24 * 60;
    return Math.max(0, 100 - (totalDowntimeMinutes / totalMinutesIn30Days * 100));
  };

  const averageOEE = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.oee, 0) / metrics.length
    : 0;

  if (loading || !machine) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold">{machine.name}</h1>
              <Badge variant={machine.status === 'running' ? 'default' : 'secondary'}>
                {machine.status}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">{machine.machineId} • {machine.location}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push(`/manufacturing/machines/${machineId}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Status</p>
              <p className="text-2xl font-bold capitalize">{machine.status}</p>
            </div>
            <div className={`w-12 h-12 rounded-full ${getStatusColor(machine.status)} flex items-center justify-center text-white`}>
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Uptime (30d)</p>
              <p className="text-2xl font-bold">{calculateUptime().toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average OEE</p>
              <p className="text-2xl font-bold">{averageOEE.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Performance</p>
              <p className="text-2xl font-bold">{Math.round((machine.currentSpeed / machine.targetSpeed) * 100)}%</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Current Production Run */}
      {currentRun && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Current Production Run</h2>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
              <Button size="sm" variant="destructive">
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Run ID</p>
              <p className="font-semibold">{currentRun.runId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Product ID</p>
              <p className="font-semibold">{currentRun.productId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Target Quantity</p>
              <p className="font-semibold">{currentRun.targetQuantity} units</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Actual Quantity</p>
              <p className="font-semibold">{currentRun.actualQuantity} units</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round((currentRun.actualQuantity / currentRun.targetQuantity) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min((currentRun.actualQuantity / currentRun.targetQuantity) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="specifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="production">Production History</TabsTrigger>
          <TabsTrigger value="downtime">Downtime</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="specifications">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Machine Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Manufacturer</p>
                  <p className="font-semibold">{machine.manufacturer}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Model</p>
                  <p className="font-semibold">{machine.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Serial Number</p>
                  <p className="font-semibold">{machine.serialNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-semibold capitalize">{machine.type}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Capacity</p>
                  <p className="font-semibold">{machine.capacity} units/hour</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Target Speed</p>
                  <p className="font-semibold">{machine.targetSpeed} units/hour</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Install Date</p>
                  <p className="font-semibold">{new Date(machine.installDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold">{machine.location}</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="production">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Production Runs</h3>
            {recentRuns.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No production runs recorded</p>
            ) : (
              <div className="space-y-3">
                {recentRuns.map(run => (
                  <div key={run.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Badge variant={run.status === 'completed' ? 'default' : 'secondary'}>
                          {run.status}
                        </Badge>
                        <span className="font-semibold">{run.runId}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(run.startTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Product</p>
                        <p className="font-medium">{run.productId}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Target</p>
                        <p className="font-medium">{run.targetQuantity}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Actual</p>
                        <p className="font-medium">{run.actualQuantity}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Good</p>
                        <p className="font-medium text-green-600">{run.goodQuantity}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="downtime">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Downtime History</h3>
            {downtimeHistory.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No downtime recorded</p>
            ) : (
              <div className="space-y-3">
                {downtimeHistory.map(downtime => (
                  <div key={downtime.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="destructive">{downtime.category}</Badge>
                      <span className="text-sm text-gray-600">
                        {new Date(downtime.startTime).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{downtime.reason}</p>
                    <p className="text-sm text-gray-600">{downtime.impact}</p>
                    {downtime.endTime && (
                      <p className="text-xs text-gray-500 mt-2">
                        Duration: {Math.round((new Date(downtime.endTime).getTime() - new Date(downtime.startTime).getTime()) / (1000 * 60))} minutes
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Maintenance History</h3>
            {maintenanceHistory.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No maintenance records</p>
            ) : (
              <div className="space-y-3">
                {maintenanceHistory.map(maintenance => (
                  <div key={maintenance.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Badge variant={maintenance.status === 'completed' ? 'default' : 'outline'}>
                          {maintenance.status}
                        </Badge>
                        <span className="font-semibold capitalize">{maintenance.maintenanceType}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(maintenance.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      {maintenance.technician && (
                        <p className="text-gray-600">Technician: {maintenance.technician}</p>
                      )}
                      {maintenance.tasks && maintenance.tasks.length > 0 && (
                        <div>
                          <p className="text-gray-600">Tasks:</p>
                          <ul className="list-disc list-inside ml-2">
                            {maintenance.tasks.map((task, idx) => (
                              <li key={idx}>{task}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {maintenance.cost && (
                        <p className="text-gray-600">Cost: ${maintenance.cost.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics (Last 24 Hours)</h3>
            {metrics.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No metrics recorded</p>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Average OEE</p>
                    <p className="text-3xl font-bold">{averageOEE.toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Availability</p>
                    <p className="text-3xl font-bold">
                      {(metrics.reduce((sum, m) => sum + m.availability, 0) / metrics.length).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Performance</p>
                    <p className="text-3xl font-bold">
                      {(metrics.reduce((sum, m) => sum + m.performance, 0) / metrics.length).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Quality</p>
                    <p className="text-3xl font-bold">
                      {(metrics.reduce((sum, m) => sum + m.quality, 0) / metrics.length).toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Recent Metrics</p>
                  <div className="space-y-2">
                    {metrics.slice(0, 10).map(metric => (
                      <div key={metric.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {new Date(metric.timestamp).toLocaleString()}
                        </span>
                        <div className="flex space-x-4">
                          <span>OEE: {metric.oee.toFixed(1)}%</span>
                          <span>Output: {metric.output} units</span>
                          <span>Downtime: {metric.downtime} min</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
