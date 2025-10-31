'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import {
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Repeat,
  Edit3
} from 'lucide-react';
import { InventoryService, StockAdjustmentData } from '@/services/database/inventory';
import { ProductService } from '@/services/database/products';
import { formatDate, formatDateTime } from '@/lib/utils/formatters';
import type { StockMovement, Product } from '@/types/database';
import toast from 'react-hot-toast';

interface StockMovementWithProduct extends StockMovement {
  productName: string;
  productSKU: string;
}

export default function StockMovementsPage() {
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<StockMovementWithProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Form state for stock adjustment
  const [adjustmentForm, setAdjustmentForm] = useState<{
    productId: string;
    type: 'in' | 'out' | 'adjustment' | 'transfer';
    quantity: number;
    reason: string;
    fromLocation: string;
    toLocation: string;
    batchNumber: string;
    expiryDate: string;
  }>({
    productId: '',
    type: 'in',
    quantity: 0,
    reason: '',
    fromLocation: '',
    toLocation: '',
    batchNumber: '',
    expiryDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load products
      const allProducts = await ProductService.getProducts({ isActive: true });
      setProducts(allProducts);

      // Load stock movements (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const stockMovements = await InventoryService.getStockMovementsByDateRange(
        startDate,
        endDate
      );

      // Enrich with product details
      const enrichedMovements = await Promise.all(
        stockMovements.map(async (movement) => {
          const product = await ProductService.getProductById(movement.productId);
          return {
            ...movement,
            productName: product?.name || 'Unknown Product',
            productSKU: product?.sku || 'N/A',
          };
        })
      );

      setMovements(enrichedMovements);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adjustmentForm.productId) {
      toast.error('Please select a product');
      return;
    }

    if (adjustmentForm.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (!adjustmentForm.reason.trim()) {
      toast.error('Please provide a reason for the adjustment');
      return;
    }

    if (adjustmentForm.type === 'transfer' && !adjustmentForm.toLocation) {
      toast.error('Please specify destination location for transfer');
      return;
    }

    try {
      const product = products.find(p => p.id === adjustmentForm.productId);
      if (!product) {
        toast.error('Product not found');
        return;
      }

      // Get current inventory to determine location
      const inventory = await InventoryService.getInventoryByProduct(adjustmentForm.productId);
      const fromLocation = adjustmentForm.fromLocation || inventory?.warehouseLocation || 'Main Warehouse';

      const adjustmentData: StockAdjustmentData = {
        productId: adjustmentForm.productId,
        quantity: adjustmentForm.quantity,
        type: adjustmentForm.type,
        reason: adjustmentForm.reason,
        fromLocation,
        toLocation: adjustmentForm.toLocation || undefined,
        performedBy: 'current-user', // In real app, get from auth context
        batchNumber: adjustmentForm.batchNumber || undefined,
        expiryDate: adjustmentForm.expiryDate ? new Date(adjustmentForm.expiryDate) : undefined,
      };

      await InventoryService.adjustStock(adjustmentData);

      toast.success('Stock adjustment recorded successfully');
      setShowAdjustmentDialog(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error adjusting stock:', error);
      toast.error(error.message || 'Failed to adjust stock');
    }
  };

  const resetForm = () => {
    setAdjustmentForm({
      productId: '',
      type: 'in',
      quantity: 0,
      reason: '',
      fromLocation: '',
      toLocation: '',
      batchNumber: '',
      expiryDate: '',
    });
  };

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowDown className="w-4 h-4 text-green-600" />;
      case 'out':
        return <ArrowUp className="w-4 h-4 text-red-600" />;
      case 'transfer':
        return <Repeat className="w-4 h-4 text-blue-600" />;
      case 'adjustment':
        return <Edit3 className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getMovementTypeBadge = (type: string) => {
    const colors = {
      in: 'bg-green-100 text-green-800',
      out: 'bg-red-100 text-red-800',
      transfer: 'bg-blue-100 text-blue-800',
      adjustment: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  const filteredMovements = movements.filter(movement => {
    const matchesSearch =
      movement.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.productSKU.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || movement.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const exportMovements = () => {
    const headers = ['Date', 'Product', 'SKU', 'Type', 'Quantity', 'From', 'To', 'Reason', 'Performed By'];
    const rows = filteredMovements.map(m => [
      formatDateTime(m.timestamp),
      m.productName,
      m.productSKU,
      m.type,
      m.quantity,
      m.fromLocation || '',
      m.toLocation || '',
      m.reason,
      m.performedBy,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-movements-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Stock movements exported');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading stock movements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Movements</h1>
          <p className="text-gray-600 mt-1">Track and manage inventory adjustments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportMovements} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAdjustmentDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Adjustment
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
                  placeholder="Search by product, SKU, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border rounded-md bg-white"
            >
              <option value="all">All Types</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="transfer">Transfer</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Stock Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movement History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    From
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    To
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Performed By
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDateTime(movement.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{movement.productName}</p>
                        <p className="text-sm text-gray-500">{movement.productSKU}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getMovementTypeIcon(movement.type)}
                        {getMovementTypeBadge(movement.type)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${
                        movement.type === 'in' ? 'text-green-600' : 
                        movement.type === 'out' ? 'text-red-600' : 
                        'text-gray-900'
                      }`}>
                        {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : ''}
                        {movement.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {movement.fromLocation || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {movement.toLocation || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {movement.reason}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {movement.performedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredMovements.length === 0 && (
              <div className="text-center py-12">
                <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No stock movements found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      {showAdjustmentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Stock Adjustment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
                {/* Product Selection */}
                <div>
                  <Label htmlFor="product">Product *</Label>
                  <select
                    id="product"
                    value={adjustmentForm.productId}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, productId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select a product...</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Movement Type */}
                <div>
                  <Label htmlFor="type">Movement Type *</Label>
                  <select
                    id="type"
                    value={adjustmentForm.type}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="in">Stock In (Receive)</option>
                    <option value="out">Stock Out (Remove)</option>
                    <option value="adjustment">Adjustment (Correct)</option>
                    <option value="transfer">Transfer (Move)</option>
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={adjustmentForm.quantity || ''}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                {/* Reason */}
                <div>
                  <Label htmlFor="reason">Reason *</Label>
                  <select
                    id="reason"
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select a reason...</option>
                    <option value="Purchase Order Received">Purchase Order Received</option>
                    <option value="Customer Return">Customer Return</option>
                    <option value="Damaged Goods">Damaged Goods</option>
                    <option value="Expired Products">Expired Products</option>
                    <option value="Inventory Count Correction">Inventory Count Correction</option>
                    <option value="Theft/Loss">Theft/Loss</option>
                    <option value="Sample/Demo">Sample/Demo</option>
                    <option value="Warehouse Transfer">Warehouse Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* From Location */}
                <div>
                  <Label htmlFor="fromLocation">From Location</Label>
                  <Input
                    id="fromLocation"
                    value={adjustmentForm.fromLocation}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, fromLocation: e.target.value })}
                    placeholder="e.g., Main Warehouse"
                  />
                </div>

                {/* To Location (for transfers) */}
                {adjustmentForm.type === 'transfer' && (
                  <div>
                    <Label htmlFor="toLocation">To Location *</Label>
                    <Input
                      id="toLocation"
                      value={adjustmentForm.toLocation}
                      onChange={(e) => setAdjustmentForm({ ...adjustmentForm, toLocation: e.target.value })}
                      placeholder="e.g., Secondary Warehouse"
                      required
                    />
                  </div>
                )}

                {/* Batch Number (for stock in) */}
                {adjustmentForm.type === 'in' && (
                  <>
                    <div>
                      <Label htmlFor="batchNumber">Batch Number</Label>
                      <Input
                        id="batchNumber"
                        value={adjustmentForm.batchNumber}
                        onChange={(e) => setAdjustmentForm({ ...adjustmentForm, batchNumber: e.target.value })}
                        placeholder="e.g., BATCH-2024-001"
                      />
                    </div>

                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={adjustmentForm.expiryDate}
                        onChange={(e) => setAdjustmentForm({ ...adjustmentForm, expiryDate: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAdjustmentDialog(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Record Adjustment
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
