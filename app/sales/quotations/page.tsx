'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuotationsService } from '@/services/database/quotations';
import { db } from '@/lib/db/schema';
import type { Quotation, Customer, QuotationStatus } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Plus, Search, FileText, CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function QuotationsPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Map<string, Customer>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | 'all'>('all');
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    loadData();
    checkExpiredQuotations();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load quotations
      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const quotationsData = await QuotationsService.getQuotations(filters);
      setQuotations(quotationsData);

      // Load customers
      const customersData = await db.customers.toArray();
      const customersMap = new Map(customersData.map(c => [c.id, c]));
      setCustomers(customersMap);

      // Load stats
      const statsData = await QuotationsService.getQuotationStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load quotations:', error);
      toast.error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  const checkExpiredQuotations = async () => {
    try {
      const expiredCount = await QuotationsService.checkExpiredQuotations();
      if (expiredCount > 0) {
        toast.success(`${expiredCount} quotation(s) marked as expired`);
        loadData();
      }
    } catch (error) {
      console.error('Failed to check expired quotations:', error);
    }
  };

  const handleCreateQuotation = () => {
    router.push('/sales/quotations/new');
  };

  const handleViewQuotation = (id: string) => {
    router.push(`/sales/quotations/${id}`);
  };

  const getStatusBadge = (status: QuotationStatus) => {
    const variants: Record<QuotationStatus, { variant: any; icon: any }> = {
      draft: { variant: 'secondary', icon: <FileText className="w-3 h-3" /> },
      sent: { variant: 'default', icon: <Send className="w-3 h-3" /> },
      approved: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      rejected: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
      expired: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
    };

    const { variant, icon } = variants[status];

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredQuotations = quotations.filter(quotation => {
    const customer = customers.get(quotation.customerId);
    const searchLower = searchQuery.toLowerCase();

    return (
      quotation.quotationId.toLowerCase().includes(searchLower) ||
      customer?.name.toLowerCase().includes(searchLower) ||
      quotation.totalAmount.toString().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
            <p className="text-gray-600 mt-1">Manage sales quotations and proposals</p>
          </div>
          <Button onClick={handleCreateQuotation} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Quotation
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Draft</div>
              <div className="text-2xl font-bold text-gray-500">{stats.draft}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Sent</div>
              <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Approved</div>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Rejected</div>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Conversion</div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.conversionRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by quotation ID, customer, or amount..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as QuotationStatus | 'all')}
                className="px-4 py-2 border rounded-md bg-white"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Quotations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Quotations List</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredQuotations.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No quotations found</p>
                <Button onClick={handleCreateQuotation} className="mt-4">
                  Create First Quotation
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Quotation ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Valid Until
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredQuotations.map((quotation) => {
                      const customer = customers.get(quotation.customerId);
                      const isExpiringSoon =
                        quotation.status === 'sent' &&
                        new Date(quotation.validUntil).getTime() - Date.now() <
                          7 * 24 * 60 * 60 * 1000;

                      return (
                        <tr
                          key={quotation.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleViewQuotation(quotation.id)}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-blue-600">
                            {quotation.quotationId}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {customer?.name || 'Unknown Customer'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            ${quotation.totalAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {getStatusBadge(quotation.status)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className={isExpiringSoon ? 'text-orange-600 font-medium' : ''}>
                              {format(new Date(quotation.validUntil), 'MMM dd, yyyy')}
                              {isExpiringSoon && (
                                <span className="ml-2 text-xs">(Expiring Soon)</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {format(new Date(quotation.createdAt), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewQuotation(quotation.id);
                              }}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
