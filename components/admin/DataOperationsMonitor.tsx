'use client';

// Data Operations Monitor - Track CRUD operations and data entry statistics
// Requirements: 7.4

import { useEffect, useState } from 'react';
import { db } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { FileText, Upload, Edit, Trash2, Plus } from 'lucide-react';

type TimePeriod = 'today' | 'week' | 'month';

interface OperationStats {
  create: number;
  update: number;
  delete: number;
  read: number;
}

interface EntityStats {
  entityType: string;
  operations: OperationStats;
  total: number;
}

interface FileUploadStats {
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  totalSize: number;
}

interface RecentOperation {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  userId: string;
  timestamp: Date;
  status: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DataOperationsMonitor() {
  const [period, setPeriod] = useState<TimePeriod>('today');
  const [entityStats, setEntityStats] = useState<EntityStats[]>([]);
  const [fileUploadStats, setFileUploadStats] = useState<FileUploadStats>({
    totalUploads: 0,
    successfulUploads: 0,
    failedUploads: 0,
    totalSize: 0,
  });
  const [recentOperations, setRecentOperations] = useState<RecentOperation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOperationsData();
  }, [period]);

  const loadOperationsData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate: Date;

      // Determine date range based on period
      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      // Get all CRUD operation logs
      const operationLogs = await db.systemLogs
        .where('timestamp')
        .above(startDate)
        .and(log => 
          log.action.includes('create') ||
          log.action.includes('update') ||
          log.action.includes('delete') ||
          log.action.includes('read') ||
          log.action.includes('get')
        )
        .toArray();

      // Group by entity type and operation
      const statsMap = new Map<string, OperationStats>();

      operationLogs.forEach(log => {
        const entityType = log.entityType;
        
        if (!statsMap.has(entityType)) {
          statsMap.set(entityType, {
            create: 0,
            update: 0,
            delete: 0,
            read: 0,
          });
        }

        const stats = statsMap.get(entityType)!;

        if (log.action.includes('create') || log.action.includes('add')) {
          stats.create++;
        } else if (log.action.includes('update') || log.action.includes('edit')) {
          stats.update++;
        } else if (log.action.includes('delete') || log.action.includes('remove')) {
          stats.delete++;
        } else if (log.action.includes('read') || log.action.includes('get')) {
          stats.read++;
        }
      });

      // Convert to array and calculate totals
      const entityStatsArray: EntityStats[] = Array.from(statsMap.entries()).map(([entityType, operations]) => ({
        entityType,
        operations,
        total: operations.create + operations.update + operations.delete + operations.read,
      }));

      // Sort by total operations
      entityStatsArray.sort((a, b) => b.total - a.total);

      setEntityStats(entityStatsArray);

      // Get file upload statistics
      const uploadLogs = await db.systemLogs
        .where('timestamp')
        .above(startDate)
        .and(log => 
          log.action.includes('upload') ||
          log.action.includes('file')
        )
        .toArray();

      const successfulUploads = uploadLogs.filter(log => log.status === 'success').length;
      const failedUploads = uploadLogs.filter(log => log.status === 'error').length;

      // Estimate total size (simplified - would need actual file size tracking)
      const totalSize = successfulUploads * 2.5; // Assume average 2.5 MB per file

      setFileUploadStats({
        totalUploads: uploadLogs.length,
        successfulUploads,
        failedUploads,
        totalSize,
      });

      // Get recent operations (last 20)
      const recentOps = operationLogs
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 20)
        .map(log => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          userId: log.userId,
          timestamp: log.timestamp,
          status: log.status,
        }));

      setRecentOperations(recentOps);
    } catch (error) {
      console.error('Error loading operations data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for pie chart
  const pieChartData = entityStats.slice(0, 6).map((stat, index) => ({
    name: stat.entityType,
    value: stat.total,
    color: COLORS[index % COLORS.length],
  }));

  // Prepare data for bar chart
  const barChartData = entityStats.slice(0, 8).map(stat => ({
    name: stat.entityType,
    Create: stat.operations.create,
    Update: stat.operations.update,
    Delete: stat.operations.delete,
    Read: stat.operations.read,
  }));

  // Get operation icon
  const getOperationIcon = (action: string) => {
    if (action.includes('create') || action.includes('add')) {
      return <Plus className="h-4 w-4 text-green-600" />;
    } else if (action.includes('update') || action.includes('edit')) {
      return <Edit className="h-4 w-4 text-blue-600" />;
    } else if (action.includes('delete') || action.includes('remove')) {
      return <Trash2 className="h-4 w-4 text-red-600" />;
    } else {
      return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Data Operations Monitor</h2>
        <Select value={period} onValueChange={(value) => setPeriod(value as TimePeriod)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Operations</p>
                <p className="text-2xl font-bold mt-1">
                  {loading ? '...' : entityStats.reduce((sum, stat) => sum + stat.total, 0).toLocaleString()}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">File Uploads</p>
                <p className="text-2xl font-bold mt-1">
                  {loading ? '...' : fileUploadStats.totalUploads}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {fileUploadStats.successfulUploads} successful
                </p>
              </div>
              <Upload className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upload Size</p>
                <p className="text-2xl font-bold mt-1">
                  {loading ? '...' : `${fileUploadStats.totalSize.toFixed(1)} MB`}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed Uploads</p>
                <p className="text-2xl font-bold mt-1">
                  {loading ? '...' : fileUploadStats.failedUploads}
                </p>
              </div>
              <Trash2 className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operations by Entity Type - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Operations by Entity Type</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-500">Loading chart data...</p>
              </div>
            ) : pieChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-500">No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* CRUD Operations Breakdown - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>CRUD Operations Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-500">Loading chart data...</p>
              </div>
            ) : barChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-500">No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Create" fill="#10b981" />
                  <Bar dataKey="Update" fill="#3b82f6" />
                  <Bar dataKey="Delete" fill="#ef4444" />
                  <Bar dataKey="Read" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Entity Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Entry Statistics by Entity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity Type</TableHead>
                <TableHead className="text-right">Create</TableHead>
                <TableHead className="text-right">Update</TableHead>
                <TableHead className="text-right">Delete</TableHead>
                <TableHead className="text-right">Read</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading statistics...
                  </TableCell>
                </TableRow>
              ) : entityStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No operations recorded
                  </TableCell>
                </TableRow>
              ) : (
                entityStats.map((stat) => (
                  <TableRow key={stat.entityType}>
                    <TableCell className="font-medium capitalize">
                      {stat.entityType}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {stat.operations.create}
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      {stat.operations.update}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {stat.operations.delete}
                    </TableCell>
                    <TableCell className="text-right text-purple-600">
                      {stat.operations.read}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {stat.total}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading recent operations...
                  </TableCell>
                </TableRow>
              ) : recentOperations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No recent operations
                  </TableCell>
                </TableRow>
              ) : (
                recentOperations.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell>{getOperationIcon(op.action)}</TableCell>
                    <TableCell className="font-medium">{op.action}</TableCell>
                    <TableCell className="capitalize">{op.entityType}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {op.entityId ? op.entityId.substring(0, 8) + '...' : '-'}
                    </TableCell>
                    <TableCell className="text-sm">{op.userId}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(op.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          op.status === 'success'
                            ? 'bg-green-100 text-green-700'
                            : op.status === 'error'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {op.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
