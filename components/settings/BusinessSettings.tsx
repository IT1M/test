'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BusinessSettings as BusinessSettingsType, SystemSettings, Currency, PaymentTermsTemplate } from '@/types/settings';
import { SettingsService } from '@/services/database/settings';
import { Save, RotateCcw, Upload, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';

interface BusinessSettingsProps {
  settings: BusinessSettingsType;
  paymentTerms: PaymentTermsTemplate[];
  onUpdate: (settings: SystemSettings) => void;
  userId: string;
}

export default function BusinessSettings({ settings, paymentTerms, onUpdate, userId }: BusinessSettingsProps) {
  const [formData, setFormData] = useState<BusinessSettingsType>(settings);
  const [paymentTermsList, setPaymentTermsList] = useState<PaymentTermsTemplate[]>(paymentTerms);
  const [saving, setSaving] = useState(false);
  const [showPaymentTermsDialog, setShowPaymentTermsDialog] = useState(false);
  const [editingPaymentTerm, setEditingPaymentTerm] = useState<PaymentTermsTemplate | null>(null);

  const handleSave = async () => {
    // Check for critical changes
    const criticalChanges = [];
    if (formData.taxRate !== settings.taxRate) {
      criticalChanges.push(`Tax rate: ${settings.taxRate}% → ${formData.taxRate}%`);
    }
    if (formData.currency !== settings.currency) {
      criticalChanges.push(`Currency: ${settings.currency} → ${formData.currency}`);
    }
    if (formData.invoicePrefix !== settings.invoicePrefix) {
      criticalChanges.push(`Invoice prefix: ${settings.invoicePrefix} → ${formData.invoicePrefix}`);
    }

    // Show confirmation for critical changes
    if (criticalChanges.length > 0) {
      const confirmed = window.confirm(
        `You are about to make critical changes that will affect all future transactions:\n\n${criticalChanges.join('\n')}\n\nAre you sure you want to continue?`
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      setSaving(true);
      let updated = await SettingsService.updateBusinessSettings(formData, userId);
      updated = await SettingsService.updatePaymentTerms(paymentTermsList, userId);
      onUpdate(updated);
      toast.success('Business settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(settings);
    setPaymentTermsList(paymentTerms);
    toast.success('Settings reset to last saved values');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, companyLogo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPaymentTerm = () => {
    setEditingPaymentTerm({
      id: Date.now().toString(),
      name: '',
      days: 30,
      description: '',
    });
    setShowPaymentTermsDialog(true);
  };

  const handleEditPaymentTerm = (term: PaymentTermsTemplate) => {
    setEditingPaymentTerm(term);
    setShowPaymentTermsDialog(true);
  };

  const handleSavePaymentTerm = () => {
    if (!editingPaymentTerm) return;

    const exists = paymentTermsList.find((t) => t.id === editingPaymentTerm.id);
    if (exists) {
      setPaymentTermsList(
        paymentTermsList.map((t) =>
          t.id === editingPaymentTerm.id ? editingPaymentTerm : t
        )
      );
    } else {
      setPaymentTermsList([...paymentTermsList, editingPaymentTerm]);
    }

    setShowPaymentTermsDialog(false);
    setEditingPaymentTerm(null);
  };

  const handleDeletePaymentTerm = (id: string) => {
    setPaymentTermsList(paymentTermsList.filter((t) => t.id !== id));
    toast.success('Payment term deleted');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Branding</CardTitle>
          <CardDescription>
            Customize your company information and branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              placeholder="Enter company name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyLogo">Company Logo</Label>
            <div className="flex items-center gap-4">
              {formData.companyLogo && (
                <img
                  src={formData.companyLogo}
                  alt="Company Logo"
                  className="h-16 w-16 object-contain border rounded"
                />
              )}
              <div className="flex-1">
                <Input
                  id="companyLogo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload your company logo (PNG, JPG, or SVG)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) =>
                    setFormData({ ...formData, primaryColor: e.target.value })
                  }
                  className="w-20"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) =>
                    setFormData({ ...formData, primaryColor: e.target.value })
                  }
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) =>
                    setFormData({ ...formData, secondaryColor: e.target.value })
                  }
                  className="w-20"
                />
                <Input
                  value={formData.secondaryColor}
                  onChange={(e) =>
                    setFormData({ ...formData, secondaryColor: e.target.value })
                  }
                  placeholder="#10b981"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Company contact details for invoices and documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) =>
                setFormData({ ...formData, contactEmail: e.target.value })
              }
              placeholder="info@company.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Phone</Label>
            <Input
              id="contactPhone"
              type="tel"
              value={formData.contactPhone}
              onChange={(e) =>
                setFormData({ ...formData, contactPhone: e.target.value })
              }
              placeholder="+1-234-567-8900"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Enter company address"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Settings</CardTitle>
          <CardDescription>
            Configure tax rates and currency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.taxRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    taxRate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value: Currency) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="SAR">SAR (﷼)</SelectItem>
                  <SelectItem value="AED">AED (د.إ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document Numbering</CardTitle>
          <CardDescription>
            Configure prefixes for invoices, orders, and quotations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
              <Input
                id="invoicePrefix"
                value={formData.invoicePrefix}
                onChange={(e) =>
                  setFormData({ ...formData, invoicePrefix: e.target.value })
                }
                placeholder="INV"
              />
              <p className="text-sm text-gray-500">e.g., INV-2024-001</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderPrefix">Order Prefix</Label>
              <Input
                id="orderPrefix"
                value={formData.orderPrefix}
                onChange={(e) =>
                  setFormData({ ...formData, orderPrefix: e.target.value })
                }
                placeholder="ORD"
              />
              <p className="text-sm text-gray-500">e.g., ORD-2024-001</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quotationPrefix">Quotation Prefix</Label>
              <Input
                id="quotationPrefix"
                value={formData.quotationPrefix}
                onChange={(e) =>
                  setFormData({ ...formData, quotationPrefix: e.target.value })
                }
                placeholder="QUO"
              />
              <p className="text-sm text-gray-500">e.g., QUO-2024-001</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Terms Templates</CardTitle>
              <CardDescription>
                Manage payment terms for invoices and quotations
              </CardDescription>
            </div>
            <Button onClick={handleAddPaymentTerm} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Term
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {paymentTermsList.map((term) => (
              <div
                key={term.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{term.name}</p>
                  <p className="text-sm text-gray-500">
                    {term.days} days - {term.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPaymentTerm(term)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePaymentTerm(term.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={saving}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Payment Terms Dialog */}
      <Dialog open={showPaymentTermsDialog} onOpenChange={setShowPaymentTermsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPaymentTerm?.name ? 'Edit' : 'Add'} Payment Term
            </DialogTitle>
            <DialogDescription>
              Configure payment term details
            </DialogDescription>
          </DialogHeader>
          {editingPaymentTerm && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="termName">Name</Label>
                <Input
                  id="termName"
                  value={editingPaymentTerm.name}
                  onChange={(e) =>
                    setEditingPaymentTerm({
                      ...editingPaymentTerm,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g., Net 30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="termDays">Days</Label>
                <Input
                  id="termDays"
                  type="number"
                  min="0"
                  value={editingPaymentTerm.days}
                  onChange={(e) =>
                    setEditingPaymentTerm({
                      ...editingPaymentTerm,
                      days: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="termDescription">Description</Label>
                <Textarea
                  id="termDescription"
                  value={editingPaymentTerm.description}
                  onChange={(e) =>
                    setEditingPaymentTerm({
                      ...editingPaymentTerm,
                      description: e.target.value,
                    })
                  }
                  placeholder="e.g., Payment due within 30 days"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentTermsDialog(false);
                setEditingPaymentTerm(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePaymentTerm}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
