'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InvoicesService } from '@/services/database/invoices';
import { db } from '@/lib/db/schema';
import type { Invoice, Customer, InvoiceStatus } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, FileText, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Map<string, Customer>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [stats, setStats] = useState({
    total: 0,
    unpaid: 0,
    partiallyPaid: 0,
    paid: 0,
    overdue: 0,
    totalOutstanding: 0,
    totalOverdue: 0,
  });
  const [agingReport, setAgingReport] = useState({
    current: 0,
    days31to60: 0,
    days61to90: 0,
    over90: 0,
  });

  useEffect(() => {
    loadData();
    checkOverdueInvoices();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load invoices
      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const invoicesData = await InvoicesService.getInvoices(filters);
      setInvoices(invoicesData);

      // Load customers
      const customersData = await db.customers.toArray();
      const customersMap = new Map(customersData.map(c => [c.id, c]));
      setCustomers(customersMap);

      // Load stats
      const statsData = await InvoicesService.getInvoiceStats();
      setStats(statsData);

      // Load aging report
      const agingData = await InvoicesService.getAgingReport();
      setAgingReport(agingData);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const checkOverdueInvoices = async () => {
    try {
      const overdueCount = await InvoicesService.checkOverdueInvoices();
      if (overdueCount > 0) {
        toast.error(`${overdueCount} invoice(s) marked as overdue`);
        loadData();
      }
    } catch (error) {
      console.error('Failed to check overdue invoices:', error);
    }
  };

  const handleViewInvoice = (id: string) => {
    router.push(`/sales/invoices/${id}`);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const variants: Record<InvoiceStatus, { variant: any; icon: any }> = {
      unpaid: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      'partially-paid': { variant: 'default', icon: <DollarSign className="w-3 h-3" /> },
      paid: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      overdue: { variant: 'destructive', icon: <AlertCircle className="w-3 h-3" /> },
    };

    const { variant, icon } = variants[status];

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {icon}
        {status === 'partially-paid' ? 'Partially Paid' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredInvoices = invoices.filter(invoice => {
    const customer = customers.get(invoice.customerId);
    const searchLower = searchQuery.toLowerCase();

    return (
      invoice.invoiceId.toLowerCase().includes(searchLower) ||
      customer?.name.toLowerCase().includes(searchLower) ||
      invoice.totalAmount.toString().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoices...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600 mt-1">Manage customer invoices and payments</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Invoices</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Unpaid</div>
              <div className="text-2xl font-bold text-gray-500">{stats.unpaid}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Overdue</div>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Outstanding</div>
              <div className="text-2xl font-bold text-orange-600">
                ${stats.totalOutstanding.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aging Report */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Accounts Receivable Aging</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Current (0-30 days)</div>
                <div className="text-xl font-bold text-green-700">
                  ${agingReport.current.toFixed(2)}
                </div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">31-60 days</div>
                <div className="text-xl font-bold text-yellow-700">
                  ${agingReport.days31to60.toFixed(2)}
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">61-90 days</div>
                <div className="text-xl font-bold text-orange-700">
                  ${agingReport.days61to90.toFixed(2)}
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Over 90 days</div>
                <div className="text-xl font-bold text-red-700">
                  ${agingReport.over90.toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by invoice ID, customer, or amount..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
                className="px-4 py-2 border rounded-md bg-white"
              >
                <option value="all">All Status</option>
                <option value="unpaid">Unpaid</option>
                <option value="partially-paid">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Invoices List</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No invoices found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Invoice ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Total Amount
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Paid Amount
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Balance
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredInvoices.map((invoice) => {
                      const customer = customers.get(invoice.customerId);
                      const isOverdue =
                        invoice.status !== 'paid' &&
                        new Date(invoice.dueDate) < new Date();

                      return (
                        <tr
                          key={invoice.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleViewInvoice(invoice.id)}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-blue-600">
                            {invoice.invoiceId}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {customer?.name || 'Unknown Customer'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            ${invoice.totalAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-green-600">
                            ${invoice.paidAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-orange-600">
                            ${invoice.balanceAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {getStatusBadge(invoice.status)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                              {isOverdue && (
                                <span className="ml-2 text-xs">(Overdue)</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewInvoice(invoice.id);
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
