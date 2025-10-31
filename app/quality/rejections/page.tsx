'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter,
  Download,
  Eye,
  TrendingUp,
  Package,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/common/DataTable';
import { getRejections, getRejectionStats } from '@/services/database/rejections';
import { getProductById } from '@/services/database/products';
import type { Rejection } from '@/types/database';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';

export default function RejectionsPage() {
  const router = useRouter();
  const [rejections, setRejections] = useState<Rejection[]>([]);
  const [filteredRejections, setFilteredRejections] = useState<Rejection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadRejections();
    loadStats();
  }, []);

  useEffect(() => {
    filterRejections();
  }, [rejections, searchQuery, statusFilter, severityFilter]);

  const loadRejections = async () => {
    try {
      setLoading(true);
      const data = await getRejections();
      setRejections(data);
    } catch (error) {
      console.error('Error loading rejections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getRejectionStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filterRejections = () => {
    let filtered = [...rejections];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        r =>
          r.rejectionId.toLowerCase().includes(query) ||
          r.itemCode.toLowerCase().includes(query) ||
          r.batchNumber.toLowerCase().includes(query) ||
          r.lotNumber.toLowerCase().includes(query) ||
          r.rejectionReason.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(r => r.severity === severityFilter);
    }

    setFilteredRejections(filtered);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under-review':
        return 'bg-blue-100 text-blue-800';
      case 'corrective-action':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns: ColumnDef<Rejection>[] = [
    {
      accessorKey: 'rejectionId',
      header: 'Rejection ID',
      cell: ({ row }) => (
        <Link
          href={`/quality/rejections/${row.original.id}`}
          className="text-blue-600 hover:underline font-medium"
        >
          {row.original.rejectionId}
        </Link>
      ),
    },
    {
      accessorKey: 'rejectionDate',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.original.rejectionDate), 'MMM dd, yyyy'),
    },
    {
      accessorKey: 'itemCode',
      header: 'Item Code',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.itemCode}</span>
      ),
    },
    {
      accessorKey: 'batchNumber',
      header: 'Batch',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.batchNumber}</span>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => (
        <span className="font-semibold">{row.original.quantity}</span>
      ),
    },
    {
      accessorKey: 'rejectionType',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.rejectionType}
        </Badge>
      ),
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }) => (
        <Badge className={`capitalize ${getSeverityColor(row.original.severity)}`}>
          {row.original.severity}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={`capitalize ${getStatusColor(row.original.status)}`}>
          {row.original.status.replace('-', ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'costImpact',
      header: 'Cost Impact',
      cell: ({ row }) => (
        <span className="font-semibold text-red-600">
          ${row.original.costImpact.toFixed(2)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/quality/rejections/${row.original.id}`)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading rejections...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quality Rejections</h1>
          <p className="text-gray-600 mt-1">Track and manage product rejections</p>
        </div>
        <Link href="/quality/rejections/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Rejection
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Rejections</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRejections}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected Quantity</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalQuantity}</p>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cost Impact</p>
                <p className="text-2xl font-bold text-red-600">
                  ${stats.totalCostImpact.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejection Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.rejectionRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by ID, item code, batch, lot, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under-review">Under Review</SelectItem>
              <SelectItem value="corrective-action">Corrective Action</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Rejections Table */}
      <Card>
        <DataTable
          data={filteredRejections}
          columns={columns}
        />
      </Card>
    </div>
  );
}
