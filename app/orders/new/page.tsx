'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OrderService, type CreateOrderData } from '@/services/database/orders';
import { db } from '@/lib/db/schema';
import type { Customer, Product, OrderItem } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  AlertCircle,
  ShoppingCart,
  User,
  Package,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface OrderItemForm extends OrderItem {
  availableQuantity?: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  
  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [salesPerson, setSalesPerson] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0.1); // 10% default

  // Search state
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Loading state
  const [loading, setLoading] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  useEffect(() => {
    if (customerSearch) {
      filterCustomers();
    }
  }, [customerSearch]);

  useEffect(() => {
    if (productSearch) {
      filterProducts();
    }
  }, [productSearch]);

  const loadCustomers = async () => {
    try {
      const data = await db.customers.where({ isActive: 1 }).toArray();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const loadProducts = async () => {
    try {
      const data = await db.products.where({ isActive: 1 }).toArray();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    }
  };

  const filterCustomers = () => {
    const searchLower = customerSearch.toLowerCase();
    const filtered = customers.filter(
      c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.customerId.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower)
    );
    setCustomers(filtered);
  };

  const filterProducts = () => {
    const searchLower = productSearch.toLowerCase();
    const filtered = products.filter(
      p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower)
    );
    setProducts(filtered);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  };

  const handleAddProduct = async (product: Product) => {
    try {
      // Check if product already in order
      if (orderItems.some(item => item.productId === product.id)) {
        toast.error('Product already added to order');
        return;
      }

      setLoadingInventory(prev => ({ ...prev, [product.id]: true }));

      // Get inventory availability
      const inventory = await db.inventory.where({ productId: product.id }).first();
      const availableQuantity = inventory?.availableQuantity || 0;

      if (availableQuantity === 0) {
        toast.error(`${product.name} is out of stock`);
        return;
      }

      const newItem: OrderItemForm = {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.unitPrice,
        discount: 0,
        total: product.unitPrice,
        availableQuantity,
      };

      setOrderItems(prev => [...prev, newItem]);
      setProductSearch('');
      setShowProductDropdown(false);
      toast.success(`${product.name} added to order`);
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    } finally {
      setLoadingInventory(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setOrderItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setOrderItems(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          const newQuantity = Math.max(1, Math.min(quantity, item.availableQuantity || 999));
          const total = (item.unitPrice * newQuantity) - item.discount;
          return { ...item, quantity: newQuantity, total };
        }
        return item;
      })
    );
  };

  const handleItemDiscountChange = (productId: string, discount: number) => {
    setOrderItems(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          const newDiscount = Math.max(0, discount);
          const total = (item.unitPrice * item.quantity) - newDiscount;
          return { ...item, discount: newDiscount, total };
        }
        return item;
      })
    );
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * taxRate;
    const total = afterDiscount + tax;

    return { subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    if (orderItems.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    if (!salesPerson.trim()) {
      toast.error('Please enter sales person name');
      return;
    }

    try {
      setLoading(true);

      const orderData: CreateOrderData = {
        customerId: selectedCustomer.id,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          discount: item.discount,
        })),
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        salesPerson: salesPerson.trim(),
        notes: notes.trim() || undefined,
        discount,
        tax: calculateTotals().tax,
      };

      const order = await OrderService.createOrder(orderData);
      toast.success('Order created successfully!');
      router.push(`/orders/${order.id}`);
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

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

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
          <p className="text-gray-600 mt-1">Fill in the order details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Customer *
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by name, ID, or email..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className="pl-10"
                      required
                    />
                  </div>

                  {/* Customer Dropdown */}
                  {showCustomerDropdown && customerSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {customers.length === 0 ? (
                        <div className="p-4 text-center text-gray-600">
                          No customers found
                        </div>
                      ) : (
                        customers.slice(0, 10).map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => handleCustomerSelect(customer)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-600">
                              {customer.customerId} • {customer.email}
                            </div>
                            <Badge variant="secondary" className="mt-1 capitalize">
                              {customer.type}
                            </Badge>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {selectedCustomer && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedCustomer.name}</h4>
                        <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                        <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                        <Badge variant="secondary" className="mt-2 capitalize">
                          {selectedCustomer.type}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(null);
                          setCustomerSearch('');
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Products
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search products by name, SKU, or category..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      className="pl-10"
                    />
                  </div>

                  {/* Product Dropdown */}
                  {showProductDropdown && productSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {products.length === 0 ? (
                        <div className="p-4 text-center text-gray-600">
                          No products found
                        </div>
                      ) : (
                        products.slice(0, 10).map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleAddProduct(product)}
                            disabled={loadingInventory[product.id]}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 disabled:opacity-50"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-600">
                                  SKU: {product.sku} • ${product.unitPrice.toFixed(2)}
                                </div>
                                <Badge variant="secondary" className="mt-1">
                                  {product.category}
                                </Badge>
                              </div>
                              {loadingInventory[product.id] ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              ) : (
                                <Plus className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Order Items List */}
                {orderItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p>No items added yet</p>
                    <p className="text-sm">Search and add products above</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderItems.map((item) => (
                      <div
                        key={item.productId}
                        className="p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.productName}</h4>
                            <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                            <p className="text-sm text-gray-600">
                              ${item.unitPrice.toFixed(2)} per unit
                            </p>
                            {item.availableQuantity !== undefined && (
                              <p className="text-sm text-green-600 mt-1">
                                {item.availableQuantity} available in stock
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProduct(item.productId)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantity
                            </label>
                            <Input
                              type="number"
                              min="1"
                              max={item.availableQuantity}
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(item.productId, parseInt(e.target.value) || 1)
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Discount ($)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.discount}
                              onChange={(e) =>
                                handleItemDiscountChange(item.productId, parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Total
                            </label>
                            <div className="px-3 py-2 bg-white border border-gray-300 rounded-md font-medium">
                              ${item.total.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {item.quantity > (item.availableQuantity || 0) && (
                          <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>Insufficient inventory</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Date
                    </label>
                    <Input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sales Person *
                    </label>
                    <Input
                      placeholder="Enter sales person name"
                      value={salesPerson}
                      onChange={(e) => setSalesPerson(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Notes
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Add any special instructions or notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${totals.subtotal.toFixed(2)}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order Discount ($)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Rate (%)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={taxRate * 100}
                      onChange={(e) => setTaxRate((parseFloat(e.target.value) || 0) / 100)}
                    />
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
                    <span>${totals.tax.toFixed(2)}</span>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total</span>
                      <span>${totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Total Items</span>
                    <span>{orderItems.length}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Total Quantity</span>
                    <span>
                      {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || orderItems.length === 0 || !selectedCustomer}
                >
                  {loading ? 'Creating Order...' : 'Create Order'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/orders')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Select a customer before adding products</li>
                  <li>• Check inventory availability for each product</li>
                  <li>• Adjust quantities and discounts as needed</li>
                  <li>• Set delivery date for tracking</li>
                  <li>• Add notes for special instructions</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
