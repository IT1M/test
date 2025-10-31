'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { QuotationsService } from '@/services/database/quotations';
import { db } from '@/lib/db/schema';
import type { Quotation, Customer, QuotationStatus } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  ShoppingCart,
  FileText,
  Printer,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export default function QuotationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const quotationId = params.id as string;

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [quotationId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const quotationData = await QuotationsService.getQuotationById(quotationId);
      if (!quotationData) {
        toast.error('Quotation not found');
        router.push('/sales/quotations');
        return;
      }

      setQuotation(quotationData);

      const customerData = await db.customers.get(quotationData.customerId);
      setCustomer(customerData || null);
    } catch (error) {
      console.error('Failed to load quotation:', error);
      toast.error('Failed to load quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: QuotationStatus) => {
    if (!quotation) return;

    try {
      setProcessing(true);
      await QuotationsService.updateQuotationStatus(quotation.id, status);
      toast.success(`Quotation ${status}`);
      loadData();
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const handleConvertToOrder = async () => {
    if (!quotation || !customer) return;

    try {
      setProcessing(true);

      // Generate order ID
      const year = new Date().getFullYear();
      const orderId = `ORD-${year}-${uuidv4().slice(0, 8).toUpperCase()}`;

      // Create order
      const order = {
        id: uuidv4(),
        orderId,
        customerId: quotation.customerId,
        orderDate: new Date(),
        status: 'pending' as const,
        items: quotation.items,
        subtotal: quotation.subtotal,
        discount: quotation.discount,
        tax: quotation.tax,
        totalAmount: quotation.totalAmount,
        paymentStatus: 'unpaid' as const,
        salesPerson: 'system', // TODO: Get from auth context
        notes: `Converted from quotation ${quotation.quotationId}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.orders.add(order);

      // Update quotation
      await QuotationsService.convertToOrder(quotation.id, order.id);

      toast.success('Quotation converted to order successfully');
      router.push(`/orders/${order.id}`);
    } catch (error) {
      console.error('Failed to convert to order:', error);
      toast.error('Failed to convert to order');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: QuotationStatus) => {
    const variants: Record<QuotationStatus, { variant: any; label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      sent: { variant: 'default', label: 'Sent' },
      approved: { variant: 'default', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      expired: { variant: 'secondary', label: 'Expired' },
    };

    const { variant, label } = variants[status];

    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (!quotation || !customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Quotation not found</p>
          <Button onClick={() => router.push('/sales/quotations')} className="mt-4">
            Back to Quotations
          </Button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(quotation.validUntil) < new Date();
  const canConvert = quotation.status === 'approved' && !quotation.convertedToOrderId;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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
              <h1 className="text-3xl font-bold text-gray-900">
                {quotation.quotationId}
              </h1>
              <p className="text-gray-600 mt-1">Quotation Details</p>
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

            {quotation.status === 'draft' && (
              <Button
                onClick={() => handleUpdateStatus('sent')}
                disabled={processing}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send to Customer
              </Button>
            )}

            {quotation.status === 'sent' && (
              <>
                <Button
                  onClick={() => handleUpdateStatus('approved')}
                  disabled={processing}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleUpdateStatus('rejected')}
                  disabled={processing}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
              </>
            )}

            {canConvert && (
              <Button
                onClick={handleConvertToOrder}
                disabled={processing}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <ShoppingCart className="w-4 h-4" />
                Convert to Order
              </Button>
            )}
          </div>
        </div>

        {/* Status and Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Status</div>
                {getStatusBadge(quotation.status)}
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Created Date</div>
                <div className="font-medium">
                  {format(new Date(quotation.createdAt), 'MMM dd, yyyy')}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Valid Until</div>
                <div className={`font-medium ${isExpired ? 'text-red-600' : ''}`}>
                  {format(new Date(quotation.validUntil), 'MMM dd, yyyy')}
                  {isExpired && <span className="ml-2 text-xs">(Expired)</span>}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                <div className="text-2xl font-bold text-blue-600">
                  ${quotation.totalAmount.toFixed(2)}
                </div>
              </div>
            </div>

            {quotation.convertedToOrderId && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    This quotation has been converted to an order
                  </span>
                </div>
                <Button
                  variant="link"
                  onClick={() => router.push(`/orders/${quotation.convertedToOrderId}`)}
                  className="mt-2 text-green-700"
                >
                  View Order →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Customer Name</div>
                <div className="font-medium">{customer.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Customer ID</div>
                <div className="font-medium">{customer.customerId}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Contact Person</div>
                <div className="font-medium">{customer.contactPerson}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Email</div>
                <div className="font-medium">{customer.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Phone</div>
                <div className="font-medium">{customer.phone}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Address</div>
                <div className="font-medium">{customer.address}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quotation.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm">{item.productName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.sku}</td>
                      <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        ${item.discount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        ${item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 space-y-2 max-w-md ml-auto">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${quotation.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium">-${quotation.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">${quotation.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-bold text-blue-600">
                  ${quotation.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms and Conditions */}
        {quotation.termsAndConditions && (
          <Card>
            <CardHeader>
              <CardTitle>Terms and Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm text-gray-700">
                {quotation.termsAndConditions}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
