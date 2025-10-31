'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db/schema';
import type { Product, Customer, Order, OrderItem } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  TrendingUp,
  ShoppingCart,
  Package,
  Plus,
  Lightbulb,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderAIRecommendationsProps {
  customerId?: string;
  currentItems: OrderItem[];
  onAddProduct?: (product: Product) => void;
}

interface Recommendation {
  product: Product;
  reason: string;
  confidence: number;
  type: 'cross-sell' | 'frequently-bought' | 'similar-order' | 'trending';
}

export function OrderAIRecommendations({
  customerId,
  currentItems,
  onAddProduct,
}: OrderAIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [similarOrders, setSimilarOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (customerId || currentItems.length > 0) {
      generateRecommendations();
    }
  }, [customerId, currentItems]);

  useEffect(() => {
    if (customerId) {
      loadSimilarOrders();
    }
  }, [customerId]);

  const generateRecommendations = async () => {
    try {
      setLoading(true);
      const recs: Recommendation[] = [];

      // Get all products
      const allProducts = await db.products.where({ isActive: 1 }).toArray();
      const currentProductIds = currentItems.map(item => item.productId);

      // 1. Cross-sell recommendations based on current items
      if (currentItems.length > 0) {
        const crossSellProducts = await findCrossSellProducts(currentItems, allProducts);
        recs.push(...crossSellProducts);
      }

      // 2. Frequently bought together by this customer
      if (customerId) {
        const frequentProducts = await findFrequentlyBoughtProducts(customerId, allProducts, currentProductIds);
        recs.push(...frequentProducts);
      }

      // 3. Trending products
      const trendingProducts = await findTrendingProducts(allProducts, currentProductIds);
      recs.push(...trendingProducts);

      // Remove duplicates and limit to top 6
      const uniqueRecs = recs.filter(
        (rec, index, self) =>
          index === self.findIndex(r => r.product.id === rec.product.id)
      );

      setRecommendations(uniqueRecs.slice(0, 6));
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const findCrossSellProducts = async (
    items: OrderItem[],
    allProducts: Product[]
  ): Promise<Recommendation[]> => {
    const recommendations: Recommendation[] = [];

    // Get all orders to analyze patterns
    const allOrders = await db.orders.toArray();
    const currentProductIds = items.map(item => item.productId);
    const currentCategories = new Set<string>();

    // Get categories of current items
    for (const item of items) {
      const product = allProducts.find(p => p.id === item.productId);
      if (product) {
        currentCategories.add(product.category);
      }
    }

    // Find products frequently bought with current items
    const productFrequency: Record<string, number> = {};

    for (const order of allOrders) {
      const orderProductIds = order.items.map(item => item.productId);
      const hasCurrentProduct = currentProductIds.some(id => orderProductIds.includes(id));

      if (hasCurrentProduct) {
        for (const item of order.items) {
          if (!currentProductIds.includes(item.productId)) {
            productFrequency[item.productId] = (productFrequency[item.productId] || 0) + 1;
          }
        }
      }
    }

    // Sort by frequency and get top products
    const sortedProducts = Object.entries(productFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    for (const [productId, frequency] of sortedProducts) {
      const product = allProducts.find(p => p.id === productId);
      if (product) {
        recommendations.push({
          product,
          reason: `Frequently bought with ${items[0].productName}`,
          confidence: Math.min(frequency / 10, 0.95),
          type: 'cross-sell',
        });
      }
    }

    // Add complementary products from same category
    for (const category of currentCategories) {
      const categoryProducts = allProducts
        .filter(p => p.category === category && !currentProductIds.includes(p.id))
        .slice(0, 2);

      for (const product of categoryProducts) {
        if (!recommendations.find(r => r.product.id === product.id)) {
          recommendations.push({
            product,
            reason: `Complementary ${category} product`,
            confidence: 0.7,
            type: 'cross-sell',
          });
        }
      }
    }

    return recommendations;
  };

  const findFrequentlyBoughtProducts = async (
    customerId: string,
    allProducts: Product[],
    excludeIds: string[]
  ): Promise<Recommendation[]> => {
    const recommendations: Recommendation[] = [];

    // Get customer's order history
    const customerOrders = await db.orders
      .where({ customerId })
      .and(order => order.status === 'completed' || order.status === 'delivered')
      .toArray();

    if (customerOrders.length === 0) return recommendations;

    // Count product frequency
    const productFrequency: Record<string, number> = {};

    for (const order of customerOrders) {
      for (const item of order.items) {
        if (!excludeIds.includes(item.productId)) {
          productFrequency[item.productId] = (productFrequency[item.productId] || 0) + 1;
        }
      }
    }

    // Get top 2 frequently bought products
    const sortedProducts = Object.entries(productFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    for (const [productId, frequency] of sortedProducts) {
      const product = allProducts.find(p => p.id === productId);
      if (product) {
        recommendations.push({
          product,
          reason: `Customer ordered ${frequency} time${frequency > 1 ? 's' : ''} before`,
          confidence: Math.min(frequency / customerOrders.length, 0.9),
          type: 'frequently-bought',
        });
      }
    }

    return recommendations;
  };

  const findTrendingProducts = async (
    allProducts: Product[],
    excludeIds: string[]
  ): Promise<Recommendation[]> => {
    const recommendations: Recommendation[] = [];

    // Get recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = await db.orders
      .where('orderDate')
      .above(thirtyDaysAgo)
      .toArray();

    // Count product sales
    const productSales: Record<string, number> = {};

    for (const order of recentOrders) {
      for (const item of order.items) {
        if (!excludeIds.includes(item.productId)) {
          productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
        }
      }
    }

    // Get top 2 trending products
    const sortedProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    for (const [productId, sales] of sortedProducts) {
      const product = allProducts.find(p => p.id === productId);
      if (product) {
        recommendations.push({
          product,
          reason: `Trending: ${sales} units sold recently`,
          confidence: 0.8,
          type: 'trending',
        });
      }
    }

    return recommendations;
  };

  const loadSimilarOrders = async () => {
    try {
      const orders = await db.orders
        .where({ customerId })
        .and(order => order.status === 'completed' || order.status === 'delivered')
        .reverse()
        .limit(5)
        .toArray();

      setSimilarOrders(orders);
    } catch (error) {
      console.error('Error loading similar orders:', error);
    }
  };

  const handleAddProduct = (product: Product) => {
    if (onAddProduct) {
      onAddProduct(product);
      toast.success(`${product.name} added to order`);
    }
  };

  const getTypeIcon = (type: Recommendation['type']) => {
    const icons = {
      'cross-sell': ShoppingCart,
      'frequently-bought': TrendingUp,
      'similar-order': Package,
      'trending': Sparkles,
    };

    return icons[type];
  };

  const getTypeBadge = (type: Recommendation['type']) => {
    const labels = {
      'cross-sell': 'Cross-sell',
      'frequently-bought': 'Frequently Bought',
      'similar-order': 'Similar Order',
      'trending': 'Trending',
    };

    return labels[type];
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Product Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI-Powered Product Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec) => {
                const Icon = getTypeIcon(rec.type);
                
                return (
                  <div
                    key={rec.product.id}
                    className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4 text-purple-600" />
                          <Badge variant="secondary" className="text-xs">
                            {getTypeBadge(rec.type)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {(rec.confidence * 100).toFixed(0)}% match
                          </Badge>
                        </div>
                        <h4 className="font-medium text-gray-900">{rec.product.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-gray-600">
                            SKU: {rec.product.sku}
                          </span>
                          <span className="text-sm font-medium text-green-600">
                            ${rec.product.unitPrice.toFixed(2)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {rec.product.category}
                          </Badge>
                        </div>
                      </div>
                      {onAddProduct && (
                        <Button
                          size="sm"
                          onClick={() => handleAddProduct(rec.product)}
                          className="ml-4 flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-800">
                  These recommendations are based on purchase patterns, customer history, and trending products.
                  Adding these items may increase order value and customer satisfaction.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Similar Orders from Customer */}
      {similarOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Similar Orders from This Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {similarOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600">
                      {order.orderId}
                    </span>
                    <span className="text-xs text-gray-600">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        • {item.productName} (×{item.quantity})
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{order.items.length - 3} more items
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-sm font-medium text-gray-900">
                    Total: ${order.totalAmount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recommendations.length === 0 && similarOrders.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-600">
              <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p>Add products or select a customer to see AI-powered recommendations</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
