'use client';

import type { Order, OrderStatus } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';

interface OrderTimelineProps {
  order: Order;
}

interface TimelineEvent {
  status: OrderStatus;
  label: string;
  icon: any;
  color: string;
  timestamp?: Date;
  completed: boolean;
}

export function OrderTimeline({ order }: OrderTimelineProps) {
  const getTimelineEvents = (): TimelineEvent[] => {
    const statuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed'];
    const currentIndex = statuses.indexOf(order.status);

    const events: TimelineEvent[] = statuses.map((status, index) => {
      const completed = index <= currentIndex && order.status !== 'cancelled';
      
      return {
        status,
        label: getStatusLabel(status),
        icon: getStatusIcon(status),
        color: getStatusColor(status, completed),
        timestamp: completed ? getEstimatedTimestamp(order, status) : undefined,
        completed,
      };
    });

    // Add cancelled status if order is cancelled
    if (order.status === 'cancelled') {
      events.push({
        status: 'cancelled',
        label: 'Cancelled',
        icon: XCircle,
        color: 'text-red-600',
        timestamp: order.updatedAt,
        completed: true,
      });
    }

    return events;
  };

  const getStatusLabel = (status: OrderStatus): string => {
    const labels: Record<OrderStatus, string> = {
      pending: 'Order Placed',
      confirmed: 'Order Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };

    return labels[status];
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

  const getStatusColor = (status: OrderStatus, completed: boolean): string => {
    if (!completed) return 'text-gray-400';

    const colors: Record<OrderStatus, string> = {
      pending: 'text-yellow-600',
      confirmed: 'text-blue-600',
      processing: 'text-purple-600',
      shipped: 'text-indigo-600',
      delivered: 'text-green-600',
      completed: 'text-green-600',
      cancelled: 'text-red-600',
    };

    return colors[status];
  };

  const getEstimatedTimestamp = (order: Order, status: OrderStatus): Date | undefined => {
    // For now, we'll use the order date and updated date
    // In a real implementation, you'd track each status change timestamp
    if (status === 'pending') {
      return order.orderDate;
    } else if (status === order.status) {
      return order.updatedAt;
    }
    return undefined;
  };

  const events = getTimelineEvents();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Timeline events */}
          <div className="space-y-6">
            {events.map((event, index) => {
              const Icon = event.icon;
              
              return (
                <div key={event.status} className="relative flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                      event.completed
                        ? 'bg-white border-2 border-current'
                        : 'bg-gray-100'
                    } ${event.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`font-medium ${
                          event.completed ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {event.label}
                      </h4>
                      {event.timestamp && (
                        <span className="text-sm text-gray-500">
                          {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm')}
                        </span>
                      )}
                    </div>

                    {/* Additional info based on status */}
                    {event.completed && (
                      <div className="mt-1 text-sm text-gray-600">
                        {event.status === 'pending' && 'Order has been placed and is awaiting confirmation'}
                        {event.status === 'confirmed' && 'Order confirmed by sales team'}
                        {event.status === 'processing' && 'Order is being prepared for shipment'}
                        {event.status === 'shipped' && order.deliveryDate && (
                          <>Expected delivery: {format(new Date(order.deliveryDate), 'MMM dd, yyyy')}</>
                        )}
                        {event.status === 'delivered' && 'Order successfully delivered to customer'}
                        {event.status === 'completed' && 'Order completed and invoice generated'}
                        {event.status === 'cancelled' && 'Order cancelled and inventory released'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
