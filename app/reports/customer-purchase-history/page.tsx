'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Download, Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { generateCustomerPurchaseHistoryReport, type CustomerPurchaseHistoryReport } from '@/services/reports/predefined';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { db } from '@/lib/db/schema';
import type { Customer } from '@/types/database';

export default function CustomerPurchaseHistoryReportPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [report, setReport] = useState<CustomerPurchaseHistoryReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const allCustomers = await db.customers.toArray();
    setCustomers(allCustomers);
    if (allCustomers.length > 0) {
      setSelectedCustomerId(allCustomers[0].id);
    }
  };

  useEffect(() => {
    if (selectedCustomerId) {
      loadReport();
    }
  }, [selectedCustomerId]);

  const loadReport = async () => {
    if (!selectedCustomerId) return;
    
    setLoading(true);
    try {
      const data = await generateCustomerPurchaseHistoryReport(selectedCustomerId);
      setReport(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !report) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/reports">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Customer Purchase History</h1>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{report.customerName}</CardTitle>
            <p className="text-sm text-gray-600">{report.customerType}</p>
          </CardHeader>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{report.summary.totalOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(report.summary.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Order Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(report.summary.averageOrderValue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">First Order</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{formatDate(report.summary.firstOrderDate)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Last Order</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{formatDate(report.summary.lastOrderDate)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Days Since Last</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{report.summary.daysSinceLastOrder}</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Top Products Purchased</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Product Name</th>
                  <th className="text-right py-2 px-4">Quantity</th>
                  <th className="text-right py-2 px-4">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {report.topProducts.map((product, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{product.productName}</td>
                    <td className="text-right py-2 px-4">{product.quantityPurchased}</td>
                    <td className="text-right py-2 px-4">{formatCurrency(product.totalSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Order History */}
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Order ID</th>
                  <th className="text-left py-2 px-4">Date</th>
                  <th className="text-left py-2 px-4">Status</th>
                  <th className="text-right py-2 px-4">Items</th>
                  <th className="text-right py-2 px-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {report.orders.map((order, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{order.orderId}</td>
                    <td className="py-2 px-4">{formatDate(order.orderDate)}</td>
                    <td className="py-2 px-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {order.status}
                      </span>
                    </td>
                    <td className="text-right py-2 px-4">{order.itemCount}</td>
                    <td className="text-right py-2 px-4">{formatCurrency(order.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
