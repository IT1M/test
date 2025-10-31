"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerService } from "@/services/database/customers";
import { db } from "@/lib/db/schema";
import type { Customer, CustomerSegment, Order } from "@/types/database";
import { formatCurrency, formatPercentage } from "@/lib/utils/formatters";
import { TrendingUp, Users, ShoppingCart, DollarSign, Package, Calendar } from "lucide-react";

interface CustomerAnalyticsProps {
  customerId: string;
}

interface PurchasePattern {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalAmount: number;
  orderCount: number;
}

interface RetentionMetrics {
  totalOrders: number;
  repeatOrders: number;
  repeatRate: number;
  averageOrderValue: number;
  averageOrderFrequency: number; // days between orders
  lastOrderDate: Date | null;
  daysSinceLastOrder: number;
}

export function CustomerAnalytics({ customerId }: CustomerAnalyticsProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [purchasePatterns, setPurchasePatterns] = useState<PurchasePattern[]>([]);
  const [retentionMetrics, setRetentionMetrics] = useState<RetentionMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [customerId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Load customer data
      const customerData = await CustomerService.getCustomerById(customerId);
      if (!customerData) return;
      setCustomer(customerData);

      // Load order history
      const orders = await CustomerService.getCustomerOrderHistory(customerId);
      const completedOrders = orders.filter(
        (o) => o.status === "completed" || o.status === "delivered"
      );

      // Calculate purchase patterns
      const patterns = calculatePurchasePatterns(completedOrders);
      setPurchasePatterns(patterns);

      // Calculate retention metrics
      const metrics = calculateRetentionMetrics(completedOrders);
      setRetentionMetrics(metrics);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePurchasePatterns = (orders: Order[]): PurchasePattern[] => {
    const productMap = new Map<string, PurchasePattern>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = productMap.get(item.productId);
        if (existing) {
          existing.totalQuantity += item.quantity;
          existing.totalAmount += item.total;
          existing.orderCount += 1;
        } else {
          productMap.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            totalQuantity: item.quantity,
            totalAmount: item.total,
            orderCount: 1,
          });
        }
      });
    });

    // Sort by total amount descending
    return Array.from(productMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  };

  const calculateRetentionMetrics = (orders: Order[]): RetentionMetrics => {
    const totalOrders = orders.length;
    const repeatOrders = totalOrders > 1 ? totalOrders - 1 : 0;
    const repeatRate = totalOrders > 0 ? repeatOrders / totalOrders : 0;

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate average order frequency
    let averageOrderFrequency = 0;
    let lastOrderDate: Date | null = null;
    let daysSinceLastOrder = 0;

    if (orders.length > 1) {
      const sortedOrders = [...orders].sort(
        (a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
      );

      const firstOrderDate = new Date(sortedOrders[0].orderDate);
      lastOrderDate = new Date(sortedOrders[sortedOrders.length - 1].orderDate);

      const daysBetween =
        (lastOrderDate.getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24);
      averageOrderFrequency = daysBetween / (orders.length - 1);

      daysSinceLastOrder = (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24);
    } else if (orders.length === 1) {
      lastOrderDate = new Date(orders[0].orderDate);
      daysSinceLastOrder = (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24);
    }

    return {
      totalOrders,
      repeatOrders,
      repeatRate,
      averageOrderValue,
      averageOrderFrequency,
      lastOrderDate,
      daysSinceLastOrder,
    };
  };

  const getSegmentColor = (segment: CustomerSegment) => {
    const colors: Record<CustomerSegment, string> = {
      VIP: "text-purple-600",
      Regular: "text-blue-600",
      New: "text-green-600",
      Inactive: "text-gray-600",
    };
    return colors[segment];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (!customer || !retentionMetrics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Customer Lifetime Value */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Customer Lifetime Value
          </CardTitle>
          <CardDescription>
            Total value and contribution to revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Lifetime Value</span>
              <span className="text-2xl font-bold">
                {formatCurrency(customer.lifetimeValue || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Average Order Value</span>
              <span className="text-lg font-medium">
                {formatCurrency(retentionMetrics.averageOrderValue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Orders</span>
              <span className="text-lg font-medium">{retentionMetrics.totalOrders}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Segmentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Segmentation
          </CardTitle>
          <CardDescription>
            Current segment and classification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Segment</span>
              <Badge
                variant={customer.segment === "VIP" ? "default" : "secondary"}
                className={
                  customer.segment === "VIP"
                    ? "bg-purple-500"
                    : customer.segment === "New"
                    ? "bg-green-500"
                    : customer.segment === "Inactive"
                    ? "bg-gray-500"
                    : "bg-blue-500"
                }
              >
                {customer.segment}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Customer Type</span>
              <Badge variant="outline">
                {customer.type.charAt(0).toUpperCase() + customer.type.slice(1)}
              </Badge>
            </div>
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground mb-2">Segment Criteria</div>
              <div className="text-xs space-y-1">
                {customer.segment === "VIP" && (
                  <div className="text-purple-600">
                    • Lifetime value exceeds $100,000
                  </div>
                )}
                {customer.segment === "Regular" && (
                  <div className="text-blue-600">
                    • Active customer with regular orders
                  </div>
                )}
                {customer.segment === "New" && (
                  <div className="text-green-600">
                    • Recently registered customer
                  </div>
                )}
                {customer.segment === "Inactive" && (
                  <div className="text-gray-600">
                    • No orders in the last 180 days
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Purchase Patterns
          </CardTitle>
          <CardDescription>
            Frequently bought products and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {purchasePatterns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No purchase history available
            </div>
          ) : (
            <div className="space-y-3">
              {purchasePatterns.slice(0, 5).map((pattern, index) => (
                <div
                  key={pattern.productId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="font-medium">{pattern.productName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {pattern.totalQuantity} units • {pattern.orderCount} orders
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(pattern.totalAmount)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Retention Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Customer Retention Metrics
          </CardTitle>
          <CardDescription>
            Order frequency and engagement patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Repeat Order Rate</span>
              <span className="text-lg font-medium">
                {formatPercentage(retentionMetrics.repeatRate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Average Order Frequency</span>
              <span className="text-lg font-medium">
                {retentionMetrics.averageOrderFrequency > 0
                  ? `Every ${Math.round(retentionMetrics.averageOrderFrequency)} days`
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Days Since Last Order</span>
              <span className="text-lg font-medium">
                {Math.round(retentionMetrics.daysSinceLastOrder)} days
              </span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Engagement Status</span>
                <Badge
                  variant={
                    retentionMetrics.daysSinceLastOrder < 30
                      ? "default"
                      : retentionMetrics.daysSinceLastOrder < 90
                      ? "secondary"
                      : "destructive"
                  }
                  className={
                    retentionMetrics.daysSinceLastOrder < 30
                      ? "bg-green-500"
                      : retentionMetrics.daysSinceLastOrder < 90
                      ? "bg-yellow-500"
                      : ""
                  }
                >
                  {retentionMetrics.daysSinceLastOrder < 30
                    ? "Highly Active"
                    : retentionMetrics.daysSinceLastOrder < 90
                    ? "Moderately Active"
                    : "At Risk"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
