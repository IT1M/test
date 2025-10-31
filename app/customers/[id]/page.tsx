"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit, Mail, Phone, MapPin, CreditCard, TrendingUp, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerService } from "@/services/database/customers";
import { CustomerAnalytics } from "@/components/customers/CustomerAnalytics";
import { CustomerCommunication } from "@/components/customers/CustomerCommunication";
import type { Customer, CustomerSegment, Order, Payment } from "@/types/database";
import { formatCurrency, formatDate, formatPhone, formatRelativeDate } from "@/lib/utils/formatters";

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [outstandingBalance, setOutstandingBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerId) {
      loadCustomerData();
    }
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const [customerData, orders, payments, balance] = await Promise.all([
        CustomerService.getCustomerById(customerId),
        CustomerService.getCustomerOrderHistory(customerId),
        CustomerService.getCustomerPaymentHistory(customerId),
        CustomerService.getCustomerOutstandingBalance(customerId),
      ]);

      if (!customerData) {
        router.push("/customers");
        return;
      }

      setCustomer(customerData);
      setOrderHistory(orders);
      setPaymentHistory(payments);
      setOutstandingBalance(balance);
    } catch (error) {
      console.error("Error loading customer data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentBadge = (segment: CustomerSegment) => {
    const variants: Record<CustomerSegment, { variant: "default" | "secondary" | "destructive"; className: string }> = {
      "VIP": { variant: "default", className: "bg-purple-500 hover:bg-purple-600" },
      "Regular": { variant: "default", className: "bg-blue-500 hover:bg-blue-600" },
      "New": { variant: "secondary", className: "bg-green-500 hover:bg-green-600" },
      "Inactive": { variant: "destructive", className: "" },
    };
    
    const config = variants[segment];
    return (
      <Badge variant={config.variant} className={config.className}>
        {segment}
      </Badge>
    );
  };

  const getOrderStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      confirmed: "default",
      processing: "default",
      shipped: "default",
      delivered: "default",
      completed: "default",
      cancelled: "destructive",
    };
    
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCreditStatus = () => {
    if (!customer) return null;
    
    const usedCredit = outstandingBalance;
    const availableCredit = customer.creditLimit - usedCredit;
    const usagePercentage = (usedCredit / customer.creditLimit) * 100;
    
    let status: "good" | "warning" | "critical" = "good";
    let statusColor = "text-green-600";
    
    if (usagePercentage >= 90) {
      status = "critical";
      statusColor = "text-red-600";
    } else if (usagePercentage >= 70) {
      status = "warning";
      statusColor = "text-yellow-600";
    }
    
    return {
      status,
      statusColor,
      usedCredit,
      availableCredit,
      usagePercentage,
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading customer details...</div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const creditStatus = getCreditStatus();
  const totalRevenue = orderHistory
    .filter(o => o.status === "completed" || o.status === "delivered")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/customers")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{customer.name}</h1>
              {customer.segment && getSegmentBadge(customer.segment)}
            </div>
            <p className="text-muted-foreground">
              {customer.customerId} • {customer.type.charAt(0).toUpperCase() + customer.type.slice(1)}
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/customers/${customer.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Customer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{formatCurrency(totalRevenue)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lifetime Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{formatCurrency(customer.lifetimeValue || 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-orange-600" />
              <span className="text-2xl font-bold">{formatCurrency(outstandingBalance)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-2xl font-bold">{orderHistory.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact & Credit Info */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Email</div>
                  <div className="text-sm text-muted-foreground">{customer.email}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Phone</div>
                  <div className="text-sm text-muted-foreground">{formatPhone(customer.phone)}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Address</div>
                  <div className="text-sm text-muted-foreground">
                    {customer.address}<br />
                    {customer.city}, {customer.country}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-1">Contact Person</div>
                <div className="text-sm text-muted-foreground">{customer.contactPerson}</div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Tax ID</div>
                <div className="text-sm text-muted-foreground font-mono">{customer.taxId}</div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Status */}
          <Card>
            <CardHeader>
              <CardTitle>Credit Status</CardTitle>
              <CardDescription>
                {creditStatus && (
                  <span className={creditStatus.statusColor}>
                    {creditStatus.status === "good" && "Good Standing"}
                    {creditStatus.status === "warning" && "Approaching Limit"}
                    {creditStatus.status === "critical" && "Critical - Near Limit"}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Credit Limit</span>
                  <span className="font-medium">{formatCurrency(customer.creditLimit)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Used Credit</span>
                  <span className="font-medium">{formatCurrency(creditStatus?.usedCredit || 0)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Available Credit</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(creditStatus?.availableCredit || 0)}
                  </span>
                </div>
              </div>

              {creditStatus && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Usage</span>
                    <span className="font-medium">{creditStatus.usagePercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        creditStatus.status === "critical"
                          ? "bg-red-600"
                          : creditStatus.status === "warning"
                          ? "bg-yellow-600"
                          : "bg-green-600"
                      }`}
                      style={{ width: `${Math.min(creditStatus.usagePercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-1">Payment Terms</div>
                <div className="text-sm text-muted-foreground">{customer.paymentTerms}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="communication">Communication</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>
                    {orderHistory.length} total orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orderHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No orders yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orderHistory.slice(0, 10).map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => router.push(`/orders/${order.id}`)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm font-medium">{order.orderId}</span>
                              {getOrderStatusBadge(order.status)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(order.orderDate)} • {order.items.length} items
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>
                    {paymentHistory.length} total payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No payments yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentHistory.slice(0, 10).map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-mono text-sm font-medium mb-1">
                              {payment.paymentId}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(payment.paymentDate)} • {payment.paymentMethod}
                            </div>
                            {payment.referenceNumber && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Ref: {payment.referenceNumber}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-green-600">
                              {formatCurrency(payment.amount)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <CustomerAnalytics customerId={customerId} />
            </TabsContent>

            <TabsContent value="communication" className="space-y-4">
              <CustomerCommunication customer={customer} />
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Interaction Timeline</CardTitle>
                  <CardDescription>
                    Recent activity and interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Customer Created */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        <div className="w-0.5 h-full bg-gray-200" />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="font-medium">Customer Created</div>
                        <div className="text-sm text-muted-foreground">
                          {formatRelativeDate(customer.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Recent Orders */}
                    {orderHistory.slice(0, 5).map((order, index) => (
                      <div key={order.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-green-600" />
                          {index < 4 && <div className="w-0.5 h-full bg-gray-200" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="font-medium">Order Placed</div>
                          <div className="text-sm text-muted-foreground">
                            {order.orderId} • {formatCurrency(order.totalAmount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatRelativeDate(order.orderDate)}
                          </div>
                        </div>
                      </div>
                    ))}

                    {orderHistory.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No activity yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
