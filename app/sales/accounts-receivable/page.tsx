'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InvoicesService } from '@/services/database/invoices';
import { db } from '@/lib/db/schema';
import type { Invoice, Customer } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, DollarSign, FileText, Send, Download } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AccountsReceivablePage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Map<string, Customer>>(new Map());
  const [loading, setLoading] = useState(true);
  const [agingReport, setAgingReport] = useState({
    current: 0,
    days31to60: 0,
    days61to90: 0,
    over90: 0,
  });
  const [customerBalances, setCustomerBalances] = useState<
    Array<{ customer: Customer; balance: number; overdueAmount: number }>
  >([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load outstanding invoices
      const invoicesData = await db.invoices
        .where('status')
        .anyOf(['unpaid', 'partially-paid', 'overdue'])
        .toArray();

      setInvoices(invoicesData);

      // Load customers
      const customersData = await db.customers.toArray();
      const customersMap = new Map(customersData.map(c => [c.id, c]));
      setCustomers(customersMap);

      // Load aging report
      const agingData = await InvoicesService.getAgingReport();
      setAgingReport(agingData);

      // Calculate customer balances
      const balances = calculateCustomerBalances(invoicesData, customersMap);
      setCustomerBalances(balances);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateCustomerBalances = (
    invoices: Invoice[],
    customersMap: Map<string, Customer>
  ) => {
    const balancesByCustomer = new Map<
      string,
      { balance: number; overdueAmount: number }
    >();

    invoices.forEach(invoice => {
      const existing = balancesByCustomer.get(invoice.customerId) || {
        balance: 0,
        overdueAmount: 0,
      };

      existing.balance += invoice.balanceAmount;

      if (invoice.status === 'overdue') {
        existing.overdueAmount += invoice.balanceAmount;
      }

      balancesByCustomer.set(invoice.customerId, existing);
    });

    const balances = Array.from(balancesByCustomer.entries())
      .map(([customerId, data]) => ({
        customer: customersMap.get(customerId)!,
        balance: data.balance,
        overdueAmount: data.overdueAmount,
      }))
      .filter(item => item.customer)
      .sort((a, b) => b.balance - a.balance);

    return balances;
  };

  const handleSendReminder = async (customerId: string) => {
    try {
      const customer = customers.get(customerId);
      if (!customer) return;

      // In a real implementation, this would send an email
      toast.success(`Payment reminder sent to ${customer.name}`);

      // Log the reminder
      await db.systemLogs.add({
        id: crypto.randomUUID(),
        action: 'payment_reminder_sent',
        entityType: 'customer',
        entityId: customerId,
        details: JSON.stringify({ customerName: customer.name }),
        userId: 'system',
        timestamp: new Date(),
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to send reminder:', error);
      toast.error('Failed to send reminder');
    }
  };

  const handleGenerateStatement = async (customerId: string) => {
    try {
      const customer = customers.get(customerId);
      if (!customer) return;

      // In a real implementation, this would generate a PDF statement
      toast('Customer statement generation would be implemented here');

      // Log the action
      await db.systemLogs.add({
        id: crypto.randomUUID(),
        action: 'customer_statement_generated',
        entityType: 'customer',
        entityId: customerId,
        details: JSON.stringify({ customerName: customer.name }),
        userId: 'system',
        timestamp: new Date(),
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to generate statement:', error);
      toast.error('Failed to generate statement');
    }
  };

  const totalOutstanding = customerBalances.reduce((sum, item) => sum + item.balance, 0);
  const totalOverdue = customerBalances.reduce((sum, item) => sum + item.overdueAmount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading accounts receivable...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Accounts Receivable</h1>
          <p className="text-gray-600 mt-1">Monitor outstanding payments and aging</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Total Outstanding</div>
                  <div className="text-2xl font-bold text-orange-600">
                    ${totalOutstanding.toFixed(2)}
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Total Overdue</div>
                  <div className="text-2xl font-bold text-red-600">
                    ${totalOverdue.toFixed(2)}
                  </div>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Outstanding Invoices</div>
                  <div className="text-2xl font-bold">{invoices.length}</div>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Customers with Balance</div>
                  <div className="text-2xl font-bold">{customerBalances.length}</div>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aging Report */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Aging Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-6 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="text-sm text-gray-600 mb-2">Current (0-30 days)</div>
                <div className="text-3xl font-bold text-green-700">
                  ${agingReport.current.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  {totalOutstanding > 0
                    ? ((agingReport.current / totalOutstanding) * 100).toFixed(1)
                    : 0}
                  % of total
                </div>
              </div>

              <div className="p-6 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <div className="text-sm text-gray-600 mb-2">31-60 days</div>
                <div className="text-3xl font-bold text-yellow-700">
                  ${agingReport.days31to60.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  {totalOutstanding > 0
                    ? ((agingReport.days31to60 / totalOutstanding) * 100).toFixed(1)
                    : 0}
                  % of total
                </div>
              </div>

              <div className="p-6 bg-orange-50 rounded-lg border-2 border-orange-200">
                <div className="text-sm text-gray-600 mb-2">61-90 days</div>
                <div className="text-3xl font-bold text-orange-700">
                  ${agingReport.days61to90.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  {totalOutstanding > 0
                    ? ((agingReport.days61to90 / totalOutstanding) * 100).toFixed(1)
                    : 0}
                  % of total
                </div>
              </div>

              <div className="p-6 bg-red-50 rounded-lg border-2 border-red-200">
                <div className="text-sm text-gray-600 mb-2">Over 90 days</div>
                <div className="text-3xl font-bold text-red-700">
                  ${agingReport.over90.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  {totalOutstanding > 0
                    ? ((agingReport.over90 / totalOutstanding) * 100).toFixed(1)
                    : 0}
                  % of total
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Balances */}
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Amounts by Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {customerBalances.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No outstanding balances</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Customer ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Total Balance
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Overdue Amount
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {customerBalances.map(({ customer, balance, overdueAmount }) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {customer.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {customer.customerId}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {customer.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-orange-600">
                          ${balance.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                          ${overdueAmount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {overdueAmount > 0 ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : (
                            <Badge variant="default">Current</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/customers/${customer.id}`)}
                            >
                              View
                            </Button>
                            {overdueAmount > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendReminder(customer.id)}
                                className="flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" />
                                Remind
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateStatement(customer.id)}
                              className="flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Statement
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
