'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  DollarSign,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { InventoryService } from '@/services/database/inventory';
import { ProductService } from '@/services/database/products';
import { ForecastingService } from '@/services/gemini/forecasting';
import { GeminiService } from '@/services/gemini/client';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import type { Inventory, Product, ExpiryBatch } from '@/types/database';
import toast from 'react-hot-toast';

interface InventoryWithProduct {
  inventory: Inventory;
  product: Product;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
}

interface ExpiringBatchWithDetails {
  inventory: Inventory;
  batch: ExpiryBatch;
  product: Product;
  daysUntilExpiry: number;
  severity: 'critical' | 'warning' | 'info';
}

export default function InventoryDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<InventoryWithProduct[]>([]);
  const [expiringBatches, setExpiringBatches] = useState<ExpiringBatchWithDetails[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryWithProduct[]>([]);
  const [inventoryStats, setInventoryStats] = useState({
    totalProducts: 0,
    totalQuantity: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    expiringBatchesCount: 0,
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);

      // Load inventory statistics
      const stats = await InventoryService.getInventoryStats();
      setInventoryStats(stats);

      // Load all inventory with products
      const allInventory = await InventoryService.getInventory();
      const inventoryWithProducts = await Promise.all(
        allInventory.map(async (inv) => {
          const product = await ProductService.getProductById(inv.productId);
          if (!product) return null;

          const stockStatus = 
            inv.quantity === 0 ? 'out-of-stock' :
            inv.quantity <= product.reorderLevel ? 'low-stock' :
            'in-stock';

          return {
            inventory: inv,
            product,
            stockStatus,
          };
        })
      );

      const validInventory = inventoryWithProducts.filter(
        (item): item is InventoryWithProduct => item !== null
      );

      setInventoryData(validInventory);

      // Load low stock items
      const lowStock = validInventory.filter(item => item.stockStatus === 'low-stock');
      setLowStockItems(lowStock);

      // Load expiring batches
      const expiring = await InventoryService.getExpiringBatches(90);
      const expiringWithDetails = expiring.map(item => {
        const daysUntilExpiry = Math.floor(
          (item.batch.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        const severity = 
          daysUntilExpiry <= 30 ? 'critical' :
          daysUntilExpiry <= 60 ? 'warning' :
          'info';

        return {
          ...item,
          daysUntilExpiry,
          severity,
        };
      });

      setExpiringBatches(expiringWithDetails);

      // Load warehouse locations
      const locs = await InventoryService.getWarehouseLocations();
      setLocations(locs);

    } catch (error) {
      console.error('Error loading inventory data:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-100 text-green-800';
      case 'low-stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredInventory = inventoryData.filter(item => {
    const matchesSearch = 
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation = 
      locationFilter === 'all' || item.inventory.warehouseLocation === locationFilter;

    const matchesStatus = 
      statusFilter === 'all' || item.stockStatus === statusFilter;

    return matchesSearch && matchesLocation && matchesStatus;
  });

  const exportInventoryData = () => {
    // Simple CSV export
    const headers = ['SKU', 'Product Name', 'Location', 'Quantity', 'Reserved', 'Available', 'Status'];
    const rows = filteredInventory.map(item => [
      item.product.sku,
      item.product.name,
      item.inventory.warehouseLocation,
      item.inventory.quantity,
      item.inventory.reservedQuantity,
      item.inventory.availableQuantity,
      item.stockStatus,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Inventory data exported');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor stock levels and manage inventory</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadInventoryData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportInventoryData} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Products
            </CardTitle>
            <Package className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryStats.totalProducts}</div>
            <p className="text-xs text-gray-600 mt-1">
              {inventoryStats.totalQuantity.toLocaleString()} total units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Inventory Value
            </CardTitle>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(inventoryStats.totalValue)}
            </div>
            <p className="text-xs text-gray-600 mt-1">FIFO valuation method</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Low Stock Alerts
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {inventoryStats.lowStockCount}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {inventoryStats.outOfStockCount} out of stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Expiring Soon
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inventoryStats.expiringBatchesCount}
            </div>
            <p className="text-xs text-gray-600 mt-1">Within 90 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Products Alert */}
      {expiringBatches.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Products Near Expiry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiringBatches.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${getSeverityColor(item.severity)}`}
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-600">
                      Batch: {item.batch.batchNumber} • Location: {item.inventory.warehouseLocation}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{item.batch.quantity} units</p>
                    <p className="text-sm">
                      Expires in {item.daysUntilExpiry} days
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatDate(item.batch.expiryDate)}
                    </p>
                  </div>
                </div>
              ))}
              {expiringBatches.length > 5 && (
                <p className="text-sm text-gray-600 text-center">
                  +{expiringBatches.length - 5} more expiring batches
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alerts & Reorder Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-600">
                      SKU: {item.product.sku} • Location: {item.inventory.warehouseLocation}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-yellow-700">
                      {item.inventory.quantity} / {item.product.reorderLevel} units
                    </p>
                    <p className="text-sm text-gray-600">
                      Reorder recommended
                    </p>
                  </div>
                </div>
              ))}
              {lowStockItems.length > 5 && (
                <p className="text-sm text-gray-600 text-center">
                  +{lowStockItems.length - 5} more low stock items
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by product name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-4 py-2 border rounded-md bg-white"
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-md bg-white"
            >
              <option value="all">All Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>

          {/* Inventory Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Reserved
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Available
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Value
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInventory.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{item.product.name}</p>
                        <p className="text-sm text-gray-500">{item.product.category}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.product.sku}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.inventory.warehouseLocation}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      {item.inventory.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {item.inventory.reservedQuantity}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">
                      {item.inventory.availableQuantity}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(item.product.costPrice * item.inventory.quantity)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={getStockStatusColor(item.stockStatus)}>
                        {item.stockStatus.replace('-', ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredInventory.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No inventory items found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
