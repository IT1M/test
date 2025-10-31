'use client';

import { useState } from 'react';
import { OrderService } from '@/services/database/orders';
import type { Order, OrderStatus } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Truck,
  FileText,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface OrderWorkflowProps {
  order: Order;
  onUpdate: () => void;
}

export function OrderWorkflow({ order, onUpdate }: OrderWorkflowProps) {
  const [updating, setUpdating] = useState(false);
  const [generatingDocument, setGeneratingDocument] = useState(false);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    try {
      setUpdating(true);
      await OrderService.updateOrderStatus(order.id, newStatus);
      
      // Show appropriate message based on status
      if (newStatus === 'shipped') {
        toast.success('Order marked as shipped. Delivery note generated.');
      } else if (newStatus === 'delivered') {
        toast.success('Order marked as delivered. Invoice generated automatically.');
      } else {
        toast.success(`Order status updated to ${newStatus}`);
      }
      
      onUpdate();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order? Inventory will be released.')) {
      return;
    }

    try {
      setUpdating(true);
      await OrderService.cancelOrder(order.id, 'Cancelled by user');
      toast.success('Order cancelled successfully. Inventory has been released.');
      onUpdate();
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast.error(error.message || 'Failed to cancel order');
    } finally {
      setUpdating(false);
    }
  };

  const generateDeliveryNote = () => {
    setGeneratingDocument(true);
    
    try {
      const deliveryNote = `
DELIVERY NOTE
=============

Order ID: ${order.orderId}
Date: ${format(new Date(), 'MMMM dd, yyyy')}
Delivery Date: ${order.deliveryDate ? format(new Date(order.deliveryDate), 'MMMM dd, yyyy') : 'Not specified'}

ITEMS TO DELIVER:
${order.items.map((item, index) => `
${index + 1}. ${item.productName}
   SKU: ${item.sku}
   Quantity: ${item.quantity}
   Unit Price: $${item.unitPrice.toFixed(2)}
`).join('\n')}

DELIVERY INSTRUCTIONS:
${order.notes || 'No special instructions'}

Total Items: ${order.items.length}
Total Quantity: ${order.items.reduce((sum, item) => sum + item.quantity, 0)}

Prepared by: ${order.salesPerson}
Date: ${format(new Date(), 'yyyy-MM-dd HH:mm')}

_______________________
Signature of Receiver

_______________________
Date Received
`;

      const blob = new Blob([deliveryNote], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `delivery-note-${order.orderId}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Delivery note generated successfully');
    } catch (error) {
      toast.error('Failed to generate delivery note');
    } finally {
      setGeneratingDocument(false);
    }
  };

  const getNextStatus = (): OrderStatus | null => {
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

  const getStatusIcon = (status: OrderStatus) => {
    const icons: Record<OrderStatus, any> = {
      pending: Clock,
      confirmed: CheckCircle,
      processing: Package,
      shipped: Truck,
      delivered: CheckCircle,
      completed: CheckCircle,
      cancelled: XCircle,
    };

    return icons[status];
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pending: 'text-yellow-600 bg-yellow-100',
      confirmed: 'text-blue-600 bg-blue-100',
      processing: 'text-purple-600 bg-purple-100',
      shipped: 'text-indigo-600 bg-indigo-100',
      delivered: 'text-green-600 bg-green-100',
      completed: 'text-green-600 bg-green-100',
      cancelled: 'text-red-600 bg-red-100',
    };

    return colors[status];
  };

  const nextStatus = getNextStatus();
  const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status);
  const canGenerateDeliveryNote = ['processing', 'shipped', 'delivered', 'completed'].includes(order.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Workflow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Current Status</p>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${getStatusColor(order.status)}`}>
            {(() => {
              const Icon = getStatusIcon(order.status);
              return <Icon className="w-5 h-5" />;
            })()}
            <span className="font-medium capitalize">{order.status}</span>
          </div>
        </div>

        {/* Status Timeline */}
        {order.status !== 'cancelled' && (
          <div>
            <p className="text-sm text-gray-600 mb-3">Progress</p>
            <div className="space-y-2">
              {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed'].map((status, index) => {
                const statuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed'];
                const currentIndex = statuses.indexOf(order.status);
                const isCompleted = index <= currentIndex;
                const isCurrent = status === order.status;
                const Icon = getStatusIcon(status as OrderStatus);

                return (
                  <div key={status} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-600 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span className={`text-sm capitalize ${isCompleted ? 'font-medium' : 'text-gray-600'}`}>
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t space-y-2">
          {nextStatus && (
            <Button
              onClick={() => handleStatusUpdate(nextStatus)}
              disabled={updating}
              className="w-full"
            >
              {updating ? 'Updating...' : `Mark as ${nextStatus}`}
            </Button>
          )}

          {canGenerateDeliveryNote && (
            <Button
              variant="outline"
              onClick={generateDeliveryNote}
              disabled={generatingDocument}
              className="w-full flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {generatingDocument ? 'Generating...' : 'Generate Delivery Note'}
            </Button>
          )}

          {canCancel && (
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={updating}
              className="w-full"
            >
              Cancel Order
            </Button>
          )}
        </div>

        {/* Workflow Information */}
        <div className="pt-4 border-t">
          <p className="text-xs text-gray-600">
            {order.status === 'pending' && 'Order is awaiting confirmation'}
            {order.status === 'confirmed' && 'Order confirmed, ready for processing'}
            {order.status === 'processing' && 'Order is being prepared for shipment'}
            {order.status === 'shipped' && 'Order has been shipped, awaiting delivery confirmation'}
            {order.status === 'delivered' && 'Order delivered, ready to be marked as completed'}
            {order.status === 'completed' && 'Order completed successfully'}
            {order.status === 'cancelled' && 'Order has been cancelled'}
          </p>
        </div>

        {/* Automatic Actions Info */}
        {(order.status === 'processing' || order.status === 'shipped') && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> When marked as "shipped", a delivery note will be automatically generated. 
              When marked as "delivered", an invoice will be created automatically.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
