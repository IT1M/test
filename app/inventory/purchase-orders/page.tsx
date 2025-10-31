'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  RefreshCw,
  Search,
  Download,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  FileText
} from 'lucide-react';
import { PurchaseOrderService } from '@/services/database/purchase-orders';
import { ProductService } from '@/services/database/products';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/formatters';
import type { PurchaseOrder, Product, OrderItem } from '@/types/database';
import toast from 'react-hot-toast';

export default function PurchaseOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state for creating PO
  const [poForm, setPoForm] = useState<{
    supplierId: string;
    supplierName: string;
    expectedDeliveryDate: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
    }>;
  }>({
    supplierId: '',
    supplierName: '',
    expectedDeliveryDate: '',
    items: [],
  });

  // Form state for receiving goods
  const [receiveForm, setReceiveForm] = useState<Array<{
    productId: string;
    productName: string;
    orderedQuantity: number;
    receivedQuantity: number;
    batchNumber: string;
    expiryDate: string;
  }>>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [orders, allProducts] = await Promise.all([
        PurchaseOrderService.getPurchaseOrders(),
        ProductService.getProducts({ isActive: true }),
      ]);

      setPurchaseOrders(orders);
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!poForm.supplierName.trim()) {
      toast.error('Please enter supplier name');
      return;
    }

    if (poForm.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (!poForm.expectedDeliveryDate) {
      toast.error('Please select expected delivery date');
      return;
    }

    try {
      // Build order items
      const items: OrderItem[] = await Promise.all(
        poForm.items.map(async (item) => {
          const product = products.find(p => p.id === item.productId);
          if (!product) throw new Error('Product not found');

          return {
            productId: item.productId,
            productName: product.name,
            sku: product.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: 0,
            total: item.quantity * item.unitPrice,
          };
        })
      );

      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.1; // 10% tax
      const totalAmount = subtotal + tax;

      await PurchaseOrderService.createPurchaseOrder({
        poId: '', // Will be auto-generated
        supplierId: poForm.supplierId || `SUP-${Date.now()}`,
        items,
        subtotal,
        tax,
        totalAmount,
        orderDate: new Date(),
        expectedDeliveryDate: new Date(poForm.expectedDeliveryDate),
        status: 'draft',
      });

      toast.success('Purchase order created successfully');
      setShowCreateDialog(false);
      resetPoForm();
      loadData();
    } catch (error: any) {
      console.error('Error creating purchase order:', error);
      toast.error(error.message || 'Failed to create purchase order');
    }
  };

  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPO) return;

    try {
      const receivedItems = receiveForm
        .filter(item => item.receivedQuantity > 0)
        .map(item => ({
          productId: item.productId,
          quantity: item.receivedQuantity,
          batchNumber: item.batchNumber || undefined,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
        }));

      if (receivedItems.length === 0) {
        toast.error('Please enter received quantities');
        return;
      }

      await PurchaseOrderService.receiveGoods(selectedPO.id, receivedItems);

      toast.success('Goods received successfully');
      setShowReceiveDialog(false);
      setSelectedPO(null);
      setReceiveForm([]);
      loadData();
    } catch (error: any) {
      console.error('Error receiving goods:', error);
      toast.error(error.message || 'Failed to receive goods');
    }
  };

  const handleUpdateStatus = async (id: string, status: any) => {
    try {
      await PurchaseOrderService.updateStatus(id, status);
      toast.success('Status updated successfully');
      loadData();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const openReceiveDialog = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setReceiveForm(
      po.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        orderedQuantity: item.quantity,
        receivedQuantity: item.quantity,
        batchNumber: '',
        expiryDate: '',
      }))
    );
    setShowReceiveDialog(true);
  };

  const addItemToPoForm = () => {
    setPoForm({
      ...poForm,
      items: [
        ...poForm.items,
        { productId: '', quantity: 1, unitPrice: 0 },
      ],
    });
  };

  const removeItemFromPoForm = (index: number) => {
    setPoForm({
      ...poForm,
      items: poForm.items.filter((_, i) => i !== index),
    });
  };

  const updatePoFormItem = (index: number, field: string, value: any) => {
    const updatedItems = [...poForm.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Auto-fill unit price when product is selected
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].unitPrice = product.costPrice;
      }
    }

    setPoForm({ ...poForm, items: updatedItems });
  };

  const resetPoForm = () => {
    setPoForm({
      supplierId: '',
      supplierName: '',
      expectedDeliveryDate: '',
      items: [],
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-yellow-100 text-yellow-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch =
      po.poId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const calculatePoTotal = () => {
    return poForm.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600 mt-1">Manage procurement and goods receipt</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New PO
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by PO ID or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-md bg-white"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="confirmed">Confirmed</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders List */}
      <div className="grid gap-4">
        {filteredPOs.map((po) => (
          <Card key={po.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{po.poId}</h3>
                    {getStatusBadge(po.status)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Supplier</p>
                      <p className="font-medium">{po.supplierId}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Order Date</p>
                      <p className="font-medium">{formatDate(po.orderDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Expected Delivery</p>
                      <p className="font-medium">{formatDate(po.expectedDeliveryDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Amount</p>
                      <p className="font-medium text-lg">{formatCurrency(po.totalAmount)}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Items ({po.items.length})</p>
                    <div className="space-y-1">
                      {po.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="text-sm flex justify-between">
                          <span>{item.productName} ({item.sku})</span>
                          <span className="text-gray-600">
                            {item.quantity} × {formatCurrency(item.unitPrice)}
                          </span>
                        </div>
                      ))}
                      {po.items.length > 3 && (
                        <p className="text-sm text-gray-500">+{po.items.length - 3} more items</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {po.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(po.id, 'sent')}
                    >
                      Send to Supplier
                    </Button>
                  )}
                  {po.status === 'sent' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(po.id, 'confirmed')}
                    >
                      Mark Confirmed
                    </Button>
                  )}
                  {po.status === 'confirmed' && (
                    <Button
                      size="sm"
                      onClick={() => openReceiveDialog(po)}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Receive Goods
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPOs.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No purchase orders found</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create PO Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create Purchase Order</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePO} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplierName">Supplier Name *</Label>
                    <Input
                      id="supplierName"
                      value={poForm.supplierName}
                      onChange={(e) => setPoForm({ ...poForm, supplierName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="expectedDeliveryDate">Expected Delivery *</Label>
                    <Input
                      id="expectedDeliveryDate"
                      type="date"
                      value={poForm.expectedDeliveryDate}
                      onChange={(e) => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Items</Label>
                    <Button type="button" size="sm" onClick={addItemToPoForm}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {poForm.items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label>Product</Label>
                          <select
                            value={item.productId}
                            onChange={(e) => updatePoFormItem(index, 'productId', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                            required
                          >
                            <option value="">Select product...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updatePoFormItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            required
                          />
                        </div>
                        <div className="w-32">
                          <Label>Unit Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updatePoFormItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItemFromPoForm(index)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {poForm.items.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(calculatePoTotal())}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Tax (10%):</span>
                      <span>{formatCurrency(calculatePoTotal() * 0.1)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(calculatePoTotal() * 1.1)}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      resetPoForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Purchase Order
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Receive Goods Dialog */}
      {showReceiveDialog && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Receive Goods - {selectedPO.poId}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReceiveGoods} className="space-y-4">
                <div className="space-y-4">
                  {receiveForm.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">{item.productName}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <Label>Ordered</Label>
                          <Input value={item.orderedQuantity} disabled />
                        </div>
                        <div>
                          <Label>Received *</Label>
                          <Input
                            type="number"
                            min="0"
                            max={item.orderedQuantity}
                            value={item.receivedQuantity}
                            onChange={(e) => {
                              const updated = [...receiveForm];
                              updated[index].receivedQuantity = parseInt(e.target.value) || 0;
                              setReceiveForm(updated);
                            }}
                            required
                          />
                        </div>
                        <div>
                          <Label>Batch Number</Label>
                          <Input
                            value={item.batchNumber}
                            onChange={(e) => {
                              const updated = [...receiveForm];
                              updated[index].batchNumber = e.target.value;
                              setReceiveForm(updated);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Expiry Date</Label>
                          <Input
                            type="date"
                            value={item.expiryDate}
                            onChange={(e) => {
                              const updated = [...receiveForm];
                              updated[index].expiryDate = e.target.value;
                              setReceiveForm(updated);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowReceiveDialog(false);
                      setSelectedPO(null);
                      setReceiveForm([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Receipt
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
