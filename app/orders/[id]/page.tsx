'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { OrderService } from '@/services/database/orders';
import { db } from '@/lib/db/schema';
import type { Order, Customer, OrderStatus } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Printer,
  Download,
  Package,
  User,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const orderData = await OrderService.getOrderById(orderId);
      
      if (!orderData) {
        toast.error('Order not found');
        router.push('/orders');
        return;
      }

      setOrder(orderData);

      // Load customer details
      const customerData = await db.customers.get(orderData.customerId);
      if (customerData) {
        setCustomer(customerData);
      }
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return;

    try {
      setUpdating(true);
      await OrderService.updateOrderStatus(order.id, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      await loadOrderDetails();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      setUpdating(true);
      await OrderService.cancelOrder(order.id, 'Cancelled by user');
      toast.success('Order cancelled successfully');
      await loadOrderDetails();
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast.error(error.message || 'Failed to cancel order');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const handleDownloadInvoice = () => {
    if (!order) return;

    const invoiceData = generateInvoiceData(order, customer);
    const blob = new Blob([invoiceData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${order.orderId}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Invoice downloaded');
  };

  const generateInvoiceData = (order: Order, customer: Customer | null): string => {
    let invoice = `INVOICE\n\n`;
    invoice += `Order ID: ${order.orderId}\n`;
    invoice += `Date: ${format(new Date(order.orderDate), 'MMMM dd, yyyy')}\n\n`;
    
    if (customer) {
      invoice += `CUSTOMER INFORMATION\n`;
      invoice += `Name: ${customer.name}\n`;
      invoice += `Contact: ${customer.contactPerson}\n`;
      invoice += `Email: ${customer.email}\n`;
      invoice += `Phone: ${customer.phone}\n\n`;
    }

    invoice += `ORDER ITEMS\n`;
    invoice += `${'Item'.padEnd(30)} ${'Qty'.padEnd(10)} ${'Price'.padEnd(15)} ${'Total'.padEnd(15)}\n`;
    invoice += `${'-'.repeat(70)}\n`;
    
    order.items.forEach(item => {
      invoice += `${item.productName.padEnd(30)} ${item.quantity.toString().padEnd(10)} $${item.unitPrice.toFixed(2).padEnd(13)} $${item.total.toFixed(2).padEnd(13)}\n`;
    });

    invoice += `\n`;
    invoice += `Subtotal: $${order.subtotal.toFixed(2)}\n`;
    invoice += `Discount: $${order.discount.toFixed(2)}\n`;
    invoice += `Tax: $${order.tax.toFixed(2)}\n`;
    invoice += `TOTAL: $${order.totalAmount.toFixed(2)}\n`;

    return invoice;
  };

  const getStatusBadge = (status: OrderStatus) => {
    const variants: Record<OrderStatus, { color: string; label: string; icon: any }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock },
      confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed', icon: CheckCircle },
      processing: { color: 'bg-purple-100 text-purple-800', label: 'Processing', icon: Package },
      shipped: { color: 'bg-indigo-100 text-indigo-800', label: 'Shipped', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered', icon: CheckCircle },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: XCircle },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.color}`}>
        <Icon className="w-4 h-4" />
        <span className="font-medium">{config.label}</span>
      </div>
    );
  };

  const getStatusTimeline = () => {
    if (!order) return [];

    const statuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed'];
    const currentIndex = statuses.indexOf(order.status);

    return statuses.map((status, index) => ({
      status,
      completed: index <= currentIndex && order.status !== 'cancelled',
      current: status === order.status,
    }));
  };

  const getNextStatus = (): OrderStatus | null => {
    if (!order) return null;

    const transitions: Record<OrderStatus, OrderStatus | null> = {
      pending: 'confirmed',
      confirmed: 'processing',
      processing: 'shipped',
      shipped: 'delivered',
      delivered: 'completed',
      completed: null,
      cancelled: null,
    };

    return transitions[order.status];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/orders')}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const nextStatus = getNextStatus();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/orders')}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-600 mt-1">Order ID: {order.orderId}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePrintInvoice}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadInvoice}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                {getStatusBadge(order.status)}
              </div>

              {order.status !== 'cancelled' && (
                <div className="relative">
                  <div className="flex items-center justify-between">
                    {getStatusTimeline().map((item, index) => (
                      <div key={item.status} className="flex flex-col items-center flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            item.completed
                              ? 'bg-green-600 text-white'
                              : item.current
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {item.completed ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                          )}
                        </div>
                        <span className="text-xs mt-2 capitalize">{item.status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
                </div>
              )}

              {order.status !== 'cancelled' && order.status !== 'completed' && nextStatus && (
                <div className="mt-6 flex items-center gap-2">
                  <Button
                    onClick={() => handleStatusUpdate(nextStatus)}
                    disabled={updating}
                    className="flex-1"
                  >
                    {updating ? 'Updating...' : `Mark as ${nextStatus}`}
                  </Button>
                  {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing') && (
                    <Button
                      variant="destructive"
                      onClick={handleCancelOrder}
                      disabled={updating}
                    >
                      Cancel Order
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.productName}</h4>
                      <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                      <p className="text-sm text-gray-600">
                        ${item.unitPrice.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${item.total.toFixed(2)}
                      </p>
                      {item.discount > 0 && (
                        <p className="text-sm text-green-600">
                          -${item.discount.toFixed(2)} discount
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                  <span>Total</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          {order.deliveryDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Expected Delivery:</span>
                    <span className="font-medium">
                      {format(new Date(order.deliveryDate), 'MMMM dd, yyyy')}
                    </span>
                  </div>
                  {customer && (
                    <div className="flex items-start gap-2 mt-4">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                      <div>
                        <p className="text-gray-600">Delivery Address:</p>
                        <p className="font-medium">{customer.address}</p>
                        <p className="text-sm text-gray-600">
                          {customer.city}, {customer.country}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          {customer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact Person</p>
                  <p className="font-medium">{customer.contactPerson}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <Badge variant="secondary" className="capitalize">
                    {customer.type}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => router.push(`/customers/${customer.id}`)}
                >
                  View Customer Profile
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="font-medium">
                  {format(new Date(order.orderDate), 'MMMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sales Person</p>
                <p className="font-medium">{order.salesPerson}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <Badge
                  variant={order.paymentStatus === 'paid' ? 'default' : 'destructive'}
                  className="capitalize"
                >
                  {order.paymentStatus}
                </Badge>
              </div>
              {order.paymentMethod && (
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium capitalize">{order.paymentMethod}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="font-medium">{order.items.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Quantity</p>
                <p className="font-medium">
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <Badge
                    variant={order.paymentStatus === 'paid' ? 'default' : 'destructive'}
                    className="capitalize"
                  >
                    {order.paymentStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-medium">${order.totalAmount.toFixed(2)}</span>
                </div>
                {order.paymentStatus !== 'paid' && (
                  <Button className="w-full mt-4">
                    Record Payment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
