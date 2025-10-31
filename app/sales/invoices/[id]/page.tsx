'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { InvoicesService } from '@/services/database/invoices';
import { db } from '@/lib/db/schema';
import type { Invoice, Customer, Order } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer, Download, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [invoiceId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const invoiceData = await InvoicesService.getInvoiceById(invoiceId);
      if (!invoiceData) {
        toast.error('Invoice not found');
        router.push('/sales/invoices');
        return;
      }

      setInvoice(invoiceData);

      const [customerData, orderData] = await Promise.all([
        db.customers.get(invoiceData.customerId),
        db.orders.get(invoiceData.orderId),
      ]);

      setCustomer(customerData || null);
      setOrder(orderData || null);
    } catch (error) {
      console.error('Failed to load invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // In a real implementation, this would generate a PDF
    toast('PDF download functionality would be implemented here');
  };

  const handleRecordPayment = () => {
    router.push(`/sales/payments/new?invoiceId=${invoiceId}`);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      unpaid: 'secondary',
      'partially-paid': 'default',
      paid: 'default',
      overdue: 'destructive',
    };

    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice || !customer || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Invoice not found</p>
          <Button onClick={() => router.push('/sales/invoices')} className="mt-4">
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  const isOverdue = invoice.status !== 'paid' && new Date(invoice.dueDate) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header - Hidden when printing */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{invoice.invoiceId}</h1>
              <p className="text-gray-600 mt-1">Invoice Details</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            {invoice.status !== 'paid' && (
              <Button
                onClick={handleRecordPayment}
                className="flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Record Payment
              </Button>
            )}
          </div>
        </div>

        {/* Invoice Document */}
        <Card className="print:shadow-none print:border-0">
          <CardContent className="p-8">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h2>
                <div className="text-sm text-gray-600">
                  <div>Invoice #: {invoice.invoiceId}</div>
                  <div>Issue Date: {format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</div>
                  <div>Due Date: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  Medical Products Management System
                </div>
                <div className="text-sm text-gray-600">
                  <div>123 Medical Plaza</div>
                  <div>Healthcare City, HC 12345</div>
                  <div>Phone: (555) 123-4567</div>
                  <div>Email: info@medicalproducts.com</div>
                </div>
              </div>
            </div>

            {/* Status Badge - Hidden when printing */}
            <div className="mb-6 print:hidden">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-sm text-gray-600">Status: </span>
                  {getStatusBadge(invoice.status)}
                </div>
                {isOverdue && (
                  <Badge variant="destructive">Overdue</Badge>
                )}
              </div>
            </div>

            {/* Bill To / Ship To */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
                <div className="text-sm text-gray-700">
                  <div className="font-medium">{customer.name}</div>
                  <div>{customer.contactPerson}</div>
                  <div>{customer.address}</div>
                  <div>{customer.city}, {customer.country}</div>
                  <div>Phone: {customer.phone}</div>
                  <div>Email: {customer.email}</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Payment Terms:</h3>
                <div className="text-sm text-gray-700">
                  <div>{invoice.paymentTerms}</div>
                  <div className="mt-2">
                    <span className="font-medium">Order Reference:</span> {order.orderId}
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm">{item.productName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.sku}</td>
                      <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        ${item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-80">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium">-${order.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">${order.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="text-xl font-bold">${invoice.totalAmount.toFixed(2)}</span>
                  </div>
                  {invoice.paidAmount > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Paid Amount:</span>
                        <span className="font-medium">-${invoice.paidAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-semibold text-orange-600">Balance Due:</span>
                        <span className="text-xl font-bold text-orange-600">
                          ${invoice.balanceAmount.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-2">Payment Instructions:</h3>
              <div className="text-sm text-gray-700">
                <p>Please make payment by the due date to avoid late fees.</p>
                <p className="mt-2">
                  Bank Transfer: Account #123456789, Routing #987654321
                </p>
                <p>Check: Make payable to "Medical Products Management System"</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t text-center text-sm text-gray-600">
              <p>Thank you for your business!</p>
              <p className="mt-1">
                For questions about this invoice, please contact us at billing@medicalproducts.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
