'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Upload, Search, Barcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createRejection, getRejectionReasons } from '@/services/database/rejections';
import { getProducts } from '@/services/database/products';
import { getInventory } from '@/services/database/inventory';
import type { Product, RejectionReason, RejectionImage } from '@/types/database';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export default function NewRejectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<RejectionReason[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<RejectionImage[]>([]);
  
  const [formData, setFormData] = useState({
    itemCode: '',
    productId: '',
    machineName: '',
    lotNumber: '',
    batchNumber: '',
    quantity: 0,
    rejectionReason: '',
    rejectionType: 'cosmetic' as 'cosmetic' | 'functional' | 'safety' | 'documentation' | 'other',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    inspectorId: 'current-user', // TODO: Get from auth
    supplierId: '',
    costImpact: 0,
  });

  useEffect(() => {
    loadProducts();
    loadRejectionReasons();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    }
  };

  const loadRejectionReasons = async () => {
    try {
      const data = await getRejectionReasons();
      setRejectionReasons(data);
    } catch (error) {
      console.error('Error loading rejection reasons:', error);
    }
  };

  const handleProductSearch = (sku: string) => {
    const product = products.find(p => p.sku === sku);
    if (product) {
      setSelectedProduct(product);
      setFormData(prev => ({
        ...prev,
        itemCode: product.sku,
        productId: product.id,
        costImpact: product.costPrice * prev.quantity,
      }));
      toast.success(`Product found: ${product.name}`);
    } else {
      toast.error('Product not found');
    }
  };

  const handleBatchValidation = async (batchNumber: string) => {
    try {
      const inventory = await getInventory();
      const batchExists = inventory.some(inv => 
        inv.expiryTracking.some(batch => batch.batchNumber === batchNumber)
      );
      
      if (batchExists) {
        toast.success('Batch number validated');
      } else {
        toast.error('Batch number not found in inventory');
      }
    } catch (error) {
      console.error('Error validating batch:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage: RejectionImage = {
          id: uuidv4(),
          url: event.target?.result as string,
          fileName: file.name,
          capturedAt: new Date(),
        };
        setImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // TODO: Implement camera capture UI
      toast.info('Camera capture feature coming soon');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      toast.error('Camera access denied');
    }
  };

  const handleBarcodeScanner = () => {
    // TODO: Implement barcode scanner
    toast.info('Barcode scanner feature coming soon');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemCode || !formData.batchNumber || !formData.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      await createRejection({
        ...formData,
        images,
        correctionActions: [],
        status: 'pending',
        rejectionDate: new Date(),
      });

      toast.success('Rejection created successfully');
      router.push('/quality/rejections');
    } catch (error) {
      console.error('Error creating rejection:', error);
      toast.error('Failed to create rejection');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (quantity: number) => {
    setFormData(prev => ({
      ...prev,
      quantity,
      costImpact: selectedProduct ? selectedProduct.costPrice * quantity : 0,
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">New Rejection Entry</h1>
        <p className="text-gray-600 mt-1">Record a quality rejection</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Item Identification */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Item Identification</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="itemCode">Item Code / SKU *</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="itemCode"
                  value={formData.itemCode}
                  onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                  placeholder="Enter or scan item code"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBarcodeScanner}
                  title="Scan barcode"
                >
                  <Barcode className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleProductSearch(formData.itemCode)}
                  title="Search product"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {selectedProduct && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ {selectedProduct.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="machineName">Machine Name</Label>
              <Input
                id="machineName"
                value={formData.machineName}
                onChange={(e) => setFormData({ ...formData, machineName: e.target.value })}
                placeholder="Machine or equipment name"
              />
            </div>

            <div>
              <Label htmlFor="lotNumber">Lot Number</Label>
              <Input
                id="lotNumber"
                value={formData.lotNumber}
                onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                placeholder="Lot number"
              />
            </div>

            <div>
              <Label htmlFor="batchNumber">Batch Number *</Label>
              <Input
                id="batchNumber"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                onBlur={(e) => handleBatchValidation(e.target.value)}
                placeholder="Batch number"
                required
              />
            </div>

            <div>
              <Label htmlFor="quantity">Quantity Rejected *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity || ''}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                placeholder="Quantity"
                required
              />
            </div>

            <div>
              <Label htmlFor="costImpact">Cost Impact</Label>
              <Input
                id="costImpact"
                type="number"
                step="0.01"
                value={formData.costImpact}
                onChange={(e) => setFormData({ ...formData, costImpact: parseFloat(e.target.value) || 0 })}
                placeholder="Cost impact"
              />
            </div>
          </div>
        </Card>

        {/* Rejection Details */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Rejection Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rejectionType">Rejection Type *</Label>
              <Select
                value={formData.rejectionType}
                onValueChange={(value: any) => setFormData({ ...formData, rejectionType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cosmetic">Cosmetic</SelectItem>
                  <SelectItem value="functional">Functional</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="severity">Severity *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              {rejectionReasons.length > 0 ? (
                <Select
                  value={formData.rejectionReason}
                  onValueChange={(value) => setFormData({ ...formData, rejectionReason: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rejection reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {rejectionReasons.map(reason => (
                      <SelectItem key={reason.id} value={reason.description}>
                        {reason.code} - {reason.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Textarea
                  id="rejectionReason"
                  value={formData.rejectionReason}
                  onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                  placeholder="Describe the rejection reason"
                  rows={3}
                  required
                />
              )}
            </div>
          </div>
        </Card>

        {/* Image Upload */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Defect Documentation</h2>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image-upload')?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Images
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCameraCapture}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Capture Photo
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map(image => (
                  <div key={image.id} className="relative">
                    <img
                      src={image.url}
                      alt={image.fileName}
                      className="w-full h-32 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1"
                      onClick={() => setImages(images.filter(img => img.id !== image.id))}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Rejection'}
          </Button>
        </div>
      </form>
    </div>
  );
}
