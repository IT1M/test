'use client';

import { useEffect, useState } from "react";
import { AlertTriangle, Package, TrendingUp, Sparkles, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db/schema";
import { format, differenceInDays, addDays } from "date-fns";
import { useRouter } from "next/navigation";

interface Alert {
  id: string;
  type: 'expiry' | 'low-stock' | 'recommendation';
  icon: React.ReactNode;
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  action?: {
    label: string;
    href: string;
  };
}

export function AIInsightsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const newAlerts: Alert[] = [];

      // Get products expiring within 90 days
      const now = new Date();
      const ninetyDaysFromNow = addDays(now, 90);
      
      const products = await db.products.where('isActive').equals(1).toArray();
      
      const expiringProducts = products.filter(
        p => p.expiryDate && new Date(p.expiryDate) <= ninetyDaysFromNow && new Date(p.expiryDate) > now
      );

      for (const product of expiringProducts.slice(0, 3)) {
        const daysUntilExpiry = differenceInDays(new Date(product.expiryDate!), now);
        newAlerts.push({
          id: `expiry-${product.id}`,
          type: 'expiry',
          icon: <Calendar className="h-4 w-4" />,
          title: 'Product Expiring Soon',
          message: `${product.name} expires in ${daysUntilExpiry} days`,
          severity: daysUntilExpiry <= 30 ? 'high' : 'medium',
          action: {
            label: 'View Product',
            href: `/products/${product.id}`,
          },
        });
      }

      // Get low stock products
      const lowStockProducts = products.filter(
        p => p.stockQuantity <= p.reorderLevel && p.stockQuantity > 0
      );

      for (const product of lowStockProducts.slice(0, 3)) {
        newAlerts.push({
          id: `low-stock-${product.id}`,
          type: 'low-stock',
          icon: <AlertTriangle className="h-4 w-4" />,
          title: 'Low Stock Alert',
          message: `${product.name} - Only ${product.stockQuantity} units left (reorder at ${product.reorderLevel})`,
          severity: product.stockQuantity <= product.reorderLevel / 2 ? 'high' : 'medium',
          action: {
            label: 'Reorder',
            href: `/inventory?product=${product.id}`,
          },
        });
      }

      // Get out of stock products
      const outOfStockProducts = products.filter(p => p.stockQuantity === 0);

      for (const product of outOfStockProducts.slice(0, 2)) {
        newAlerts.push({
          id: `out-of-stock-${product.id}`,
          type: 'low-stock',
          icon: <Package className="h-4 w-4" />,
          title: 'Out of Stock',
          message: `${product.name} is out of stock`,
          severity: 'high',
          action: {
            label: 'Restock',
            href: `/inventory?product=${product.id}`,
          },
        });
      }

      // Add AI recommendation (placeholder)
      if (newAlerts.length < 5) {
        newAlerts.push({
          id: 'ai-recommendation',
          type: 'recommendation',
          icon: <Sparkles className="h-4 w-4" />,
          title: 'AI Recommendation',
          message: 'Consider reviewing your inventory levels. Several products are approaching reorder points.',
          severity: 'low',
          action: {
            label: 'View Inventory',
            href: '/inventory',
          },
        });
      }

      // Sort by severity
      const severityOrder = { high: 0, medium: 1, low: 2 };
      newAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      setAlerts(newAlerts.slice(0, 5)); // Show top 5 alerts
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="h-12 w-12 mx-auto text-green-500 mb-3" />
        <p className="text-muted-foreground">All systems running smoothly!</p>
        <p className="text-sm text-muted-foreground mt-1">No alerts at this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="mt-0.5">{alert.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{alert.title}</p>
                <p className="text-sm mt-1 opacity-90">{alert.message}</p>
                {alert.action && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 mt-2"
                    onClick={() => router.push(alert.action!.href)}
                  >
                    {alert.action.label} →
                  </Button>
                )}
              </div>
            </div>
            <Badge variant="outline" className="ml-2 capitalize">
              {alert.severity}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
