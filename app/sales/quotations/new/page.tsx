'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuotationsService } from '@/services/database/quotations';
import { db } from '@/lib/db/schema';
import type { Customer, Product, OrderItem } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewQuotationPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [validityDays, setValidityDays] = useState(30);
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [customersData, productsData] = await Promise.all([
        db.customers.where({ isActive: 1 }).toArray(),
        db.products.where({ isActive: 1 }).toArray(),
      ]);

      setCustomers(customersData);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        productName: '',
        sku: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // If product changed, update product details
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].sku = product.sku;
        newItems[index].unitPrice = product.unitPrice;
      }
    }

    // Recalculate total
    const quantity = newItems[index].quantity;
    const unitPrice = newItems[index].unitPrice;
    const itemDiscount = newItems[index].discount || 0;
    newItems[index].total = quantity * unitPrice - itemDiscount;

    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal - discount + tax;
  };

  const handleSave = async (status: 'draft' | 'sent') => {
    try {
      // Validation
      if (!selectedCustomerId) {
        toast.error('Please select a customer');
        return;
      }

      if (items.length === 0) {
        toast.error('Please add at least one item');
        return;
      }

      if (items.some(item => !item.productId || item.quantity <= 0)) {
        toast.error('Please complete all item details');
        return;
      }

      setSaving(true);

      // Create quotation
      const quotation = await QuotationsService.createQuotation({
        customerId: selectedCustomerId,
        items,
        discount,
        tax,
        validityDays,
        termsAndConditions,
      });

      // Update status if sending
      if (status === 'sent') {
        await QuotationsService.updateQuotationStatus(quotation.id, 'sent');
      }

      toast.success(
        status === 'draft'
          ? 'Quotation saved as draft'
          : 'Quotation created and sent'
      );

      router.push(`/sales/quotations/${quotation.id}`);
    } catch (error) {
      console.error('Failed to create quotation:', error);
      toast.error('Failed to create quotation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Quotation</h1>
            <p className="text-gray-600 mt-1">Create a new sales quotation</p>
          </div>
        </div>

        {/* Customer Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer">Customer *</Label>
                <select
                  id="customer"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md mt-1"
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.customerId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validityDays">Validity Period (Days)</Label>
                  <Input
                    id="validityDays"
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                    min="1"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Items</CardTitle>
              <Button onClick={addItem} size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No items added. Click "Add Item" to start.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-4">
                        <Label>Product *</Label>
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(index, 'productId', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md mt-1"
                        >
                          <option value="">Select product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} (${product.unitPrice})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, 'quantity', parseInt(e.target.value) || 0)
                          }
                          min="1"
                          className="mt-1"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                          step="0.01"
                          className="mt-1"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Discount</Label>
                        <Input
                          type="number"
                          value={item.discount}
                          onChange={(e) =>
                            updateItem(index, 'discount', parseFloat(e.target.value) || 0)
                          }
                          step="0.01"
                          className="mt-1"
                        />
                      </div>

                      <div className="md:col-span-1">
                        <Label>Total</Label>
                        <div className="mt-1 px-3 py-2 bg-gray-50 rounded-md font-medium">
                          ${item.total.toFixed(2)}
                        </div>
                      </div>

                      <div className="md:col-span-1 flex items-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Totals */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount">Discount</Label>
                  <Input
                    id="discount"
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="tax">Tax</Label>
                  <Input
                    id="tax"
                    type="number"
                    value={tax}
                    onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms and Conditions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="Enter terms and conditions..."
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={() => router.back()} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSave('sent')}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? 'Creating...' : 'Create & Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
