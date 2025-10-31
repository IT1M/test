'use client';

import { useEffect, useState } from "react";
import { 
  DollarSign, 
  ShoppingCart, 
  AlertTriangle, 
  Users, 
  Package, 
  Truck 
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { db } from "@/lib/db/schema";
import { startOfMonth, startOfDay, subMonths } from "date-fns";

interface DashboardMetrics {
  totalRevenue: number;
  revenueChange: number;
  activeOrders: number;
  ordersChange: number;
  lowStockAlerts: number;
  stockChange: number;
  totalCustomers: number;
  customersChange: number;
  totalProducts: number;
  productsChange: number;
  pendingDeliveries: number;
  deliveriesChange: number;
}

export function DashboardStats() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    revenueChange: 0,
    activeOrders: 0,
    ordersChange: 0,
    lowStockAlerts: 0,
    stockChange: 0,
    totalCustomers: 0,
    customersChange: 0,
    totalProducts: 0,
    productsChange: 0,
    pendingDeliveries: 0,
    deliveriesChange: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = startOfMonth(now);

      // Get current month revenue
      const currentMonthOrders = await db.orders
        .where('orderDate')
        .between(currentMonthStart, now)
        .and(order => order.status !== 'cancelled')
        .toArray();
      
      const totalRevenue = currentMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0);

      // Get last month revenue for comparison
      const lastMonthOrders = await db.orders
        .where('orderDate')
        .between(lastMonthStart, lastMonthEnd)
        .and(order => order.status !== 'cancelled')
        .toArray();
      
      const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const revenueChange = lastMonthRevenue > 0 
        ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      // Get active orders (not completed or cancelled)
      const activeOrders = await db.orders
        .where('status')
        .anyOf(['pending', 'confirmed', 'processing', 'shipped'])
        .count();

      const lastMonthActiveOrders = lastMonthOrders.filter(
        o => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)
      ).length;
      const ordersChange = lastMonthActiveOrders > 0
        ? ((activeOrders - lastMonthActiveOrders) / lastMonthActiveOrders) * 100
        : 0;

      // Get low stock alerts
      const allProducts = await db.products.toArray();
      const lowStockProducts = allProducts.filter(
        p => p.isActive && p.stockQuantity <= p.reorderLevel
      );
      const lowStockAlerts = lowStockProducts.length;

      // Get total customers
      const totalCustomers = await db.customers.where('isActive').equals(1).count();
      const lastMonthCustomers = await db.customers
        .where('createdAt')
        .below(lastMonthEnd)
        .and(c => c.isActive)
        .count();
      const customersChange = lastMonthCustomers > 0
        ? ((totalCustomers - lastMonthCustomers) / lastMonthCustomers) * 100
        : 0;

      // Get total products
      const totalProducts = await db.products.where('isActive').equals(1).count();

      // Get pending deliveries
      const pendingDeliveries = await db.orders
        .where('status')
        .anyOf(['confirmed', 'processing', 'shipped'])
        .count();

      setMetrics({
        totalRevenue,
        revenueChange,
        activeOrders,
        ordersChange,
        lowStockAlerts,
        stockChange: 0, // Can be calculated based on historical data
        totalCustomers,
        customersChange,
        totalProducts,
        productsChange: 0, // Can be calculated based on historical data
        pendingDeliveries,
        deliveriesChange: 0, // Can be calculated based on historical data
      });
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Total Revenue"
        value={`$${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        change={metrics.revenueChange}
        trend={metrics.revenueChange >= 0 ? 'up' : 'down'}
        icon={<DollarSign className="h-6 w-6" />}
        subtitle="This month"
      />
      
      <StatCard
        title="Active Orders"
        value={metrics.activeOrders.toString()}
        change={metrics.ordersChange}
        trend={metrics.ordersChange >= 0 ? 'up' : 'down'}
        icon={<ShoppingCart className="h-6 w-6" />}
        subtitle="In progress"
      />
      
      <StatCard
        title="Low Stock Alerts"
        value={metrics.lowStockAlerts.toString()}
        change={metrics.stockChange}
        trend={metrics.stockChange <= 0 ? 'up' : 'down'}
        icon={<AlertTriangle className="h-6 w-6" />}
        subtitle="Needs reorder"
        variant="warning"
      />
      
      <StatCard
        title="Total Customers"
        value={metrics.totalCustomers.toString()}
        change={metrics.customersChange}
        trend={metrics.customersChange >= 0 ? 'up' : 'down'}
        icon={<Users className="h-6 w-6" />}
        subtitle="Active accounts"
      />
      
      <StatCard
        title="Total Products"
        value={metrics.totalProducts.toString()}
        change={metrics.productsChange}
        trend={metrics.productsChange >= 0 ? 'up' : 'down'}
        icon={<Package className="h-6 w-6" />}
        subtitle="In catalog"
      />
      
      <StatCard
        title="Pending Deliveries"
        value={metrics.pendingDeliveries.toString()}
        change={metrics.deliveriesChange}
        trend={metrics.deliveriesChange <= 0 ? 'up' : 'down'}
        icon={<Truck className="h-6 w-6" />}
        subtitle="To be delivered"
      />
    </div>
  );
}
