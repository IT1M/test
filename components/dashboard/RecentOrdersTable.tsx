'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db/schema";
import { format } from "date-fns";
import type { Order } from "@/types/database";

export function RecentOrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadRecentOrders();
  }, []);

  const loadRecentOrders = async () => {
    try {
      setLoading(true);
      
      // Get last 10 orders
      const recentOrders = await db.orders
        .orderBy('createdAt')
        .reverse()
        .limit(10)
        .toArray();

      setOrders(recentOrders);
    } catch (error) {
      console.error('Failed to load recent orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      pending: { variant: 'outline', className: 'bg-gray-100 text-gray-700' },
      confirmed: { variant: 'outline', className: 'bg-blue-100 text-blue-700' },
      processing: { variant: 'outline', className: 'bg-yellow-100 text-yellow-700' },
      shipped: { variant: 'outline', className: 'bg-purple-100 text-purple-700' },
      delivered: { variant: 'outline', className: 'bg-green-100 text-green-700' },
      completed: { variant: 'outline', className: 'bg-green-100 text-green-700' },
      cancelled: { variant: 'outline', className: 'bg-red-100 text-red-700' },
    };

    const config = variants[status] || variants.pending;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCustomerName = async (customerId: string) => {
    try {
      const customer = await db.customers.get(customerId);
      return customer?.name || 'Unknown Customer';
    } catch {
      return 'Unknown Customer';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No orders yet
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell className="font-medium">{order.orderId}</TableCell>
              <TableCell>
                <CustomerName customerId={order.customerId} />
              </TableCell>
              <TableCell>
                ${order.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell>{format(new Date(order.orderDate), 'MMM dd, yyyy')}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Helper component to load customer name
function CustomerName({ customerId }: { customerId: string }) {
  const [name, setName] = useState('Loading...');

  useEffect(() => {
    loadCustomerName();
  }, [customerId]);

  const loadCustomerName = async () => {
    try {
      const customer = await db.customers.get(customerId);
      setName(customer?.name || 'Unknown Customer');
    } catch {
      setName('Unknown Customer');
    }
  };

  return <span>{name}</span>;
}
