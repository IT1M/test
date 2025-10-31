'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SupplierService } from '@/services/database/suppliers';
import type { Supplier } from '@/types/database';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewSupplierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: '',
    name: '',
    type: 'manufacturer' as const,
    contactPerson: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    country: '',
    paymentTerms: 'Net 30',
    leadTime: 30,
    minimumOrderQuantity: 0,
    currency: 'USD',
    certifications: '',
    licenses: '',
    isPreferred: false,
    status: 'active' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.supplierId || !formData.name || !formData.email || !formData.phone) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Prepare supplier data
      const supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'> = {
        supplierId: formData.supplierId,
        name: formData.name,
        type: formData.type,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        website: formData.website || undefined,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        paymentTerms: formData.paymentTerms,
        leadTime: formData.leadTime,
        minimumOrderQuantity: formData.minimumOrderQuantity || undefined,
        currency: formData.currency,
        rating: 0,
        qualityScore: 0,
        deliveryScore: 0,
        priceScore: 0,
        overallScore: 0,
        certifications: formData.certifications ? formData.certifications.split(',').map(c => c.trim()) : [],
        licenses: formData.licenses ? formData.licenses.split(',').map(l => l.trim()) : [],
        status: formData.status,
        isPreferred: formData.isPreferred,
        suppliedProducts: [],
      };

      const supplier = await SupplierService.createSupplier(supplierData);
      toast.success('Supplier created successfully');
      router.push(`/supply-chain/suppliers/${supplier.id}`);
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast.error('Failed to create supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/supply-chain/suppliers">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add New Supplier</h1>
          <p className="text-gray-600 mt-1">Register a new supplier in the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the supplier's basic details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierId">Supplier ID *</Label>
                <Input
                  id="supplierId"
                  value={formData.supplierId}
                  onChange={e => handleChange('supplierId', e.target.value)}
                  placeholder="SUP-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Supplier Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="ABC Medical Supplies"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Supplier Type *</Label>
                <Select value={formData.type} onValueChange={value => handleChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="wholesaler">Wholesaler</SelectItem>
                    <SelectItem value="service-provider">Service Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={value => handleChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPreferred"
                checked={formData.isPreferred}
                onCheckedChange={checked => handleChange('isPreferred', checked)}
              />
              <Label htmlFor="isPreferred">Mark as Preferred Supplier</Label>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>How to reach this supplier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={e => handleChange('contactPerson', e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="contact@supplier.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  placeholder="+1 234 567 8900"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={e => handleChange('website', e.target.value)}
                  placeholder="https://www.supplier.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={e => handleChange('address', e.target.value)}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={e => handleChange('city', e.target.value)}
                  placeholder="New York"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={e => handleChange('country', e.target.value)}
                  placeholder="United States"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Business Terms</CardTitle>
            <CardDescription>Payment and delivery terms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select value={formData.paymentTerms} onValueChange={value => handleChange('paymentTerms', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 45">Net 45</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="Net 90">Net 90</SelectItem>
                    <SelectItem value="COD">Cash on Delivery</SelectItem>
                    <SelectItem value="Prepaid">Prepaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leadTime">Lead Time (days)</Label>
                <Input
                  id="leadTime"
                  type="number"
                  value={formData.leadTime}
                  onChange={e => handleChange('leadTime', parseInt(e.target.value) || 0)}
                  placeholder="30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumOrderQuantity">Minimum Order Quantity</Label>
                <Input
                  id="minimumOrderQuantity"
                  type="number"
                  value={formData.minimumOrderQuantity}
                  onChange={e => handleChange('minimumOrderQuantity', parseInt(e.target.value) || 0)}
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={value => handleChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                    <SelectItem value="CNY">CNY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certifications and Licenses */}
        <Card>
          <CardHeader>
            <CardTitle>Certifications & Licenses</CardTitle>
            <CardDescription>Enter certifications and licenses (comma-separated)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certifications">Certifications</Label>
              <Textarea
                id="certifications"
                value={formData.certifications}
                onChange={e => handleChange('certifications', e.target.value)}
                placeholder="ISO 9001, ISO 13485, FDA Approved"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenses">Licenses</Label>
              <Textarea
                id="licenses"
                value={formData.licenses}
                onChange={e => handleChange('licenses', e.target.value)}
                placeholder="Medical Device License, Import License"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/supply-chain/suppliers">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Supplier'}
          </Button>
        </div>
      </form>
    </div>
  );
}
