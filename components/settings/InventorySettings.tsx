'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { InventorySettings as InventorySettingsType, SystemSettings } from '@/types/settings';
import { SettingsService } from '@/services/database/settings';
import { Save, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

interface InventorySettingsProps {
  settings: InventorySettingsType;
  onUpdate: (settings: SystemSettings) => void;
  userId: string;
}

export default function InventorySettings({ settings, onUpdate, userId }: InventorySettingsProps) {
  const [formData, setFormData] = useState<InventorySettingsType>(settings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await SettingsService.updateInventorySettings(formData, userId);
      onUpdate(updated);
      toast.success('Inventory settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(settings);
    toast.success('Settings reset to last saved values');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stock Alerts</CardTitle>
          <CardDescription>
            Configure when to receive low stock alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
            <Input
              id="lowStockThreshold"
              type="number"
              min="0"
              value={formData.lowStockThreshold}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  lowStockThreshold: parseInt(e.target.value) || 10,
                })
              }
            />
            <p className="text-sm text-gray-500">
              Alert when product quantity falls below this number (default: 10)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expiry Management</CardTitle>
          <CardDescription>
            Configure expiry date alerts and tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expiryAlertDays">Expiry Alert Period (days)</Label>
            <Input
              id="expiryAlertDays"
              type="number"
              min="1"
              max="365"
              value={formData.expiryAlertDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  expiryAlertDays: parseInt(e.target.value) || 90,
                })
              }
            />
            <p className="text-sm text-gray-500">
              Alert when products will expire within this many days (default: 90)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automatic Reordering</CardTitle>
          <CardDescription>
            Configure automatic purchase order generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Auto-Reorder</Label>
              <p className="text-sm text-gray-500">
                Automatically create draft purchase orders when stock is low
              </p>
            </div>
            <Switch
              checked={formData.enableAutoReorder}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enableAutoReorder: checked })
              }
            />
          </div>

          {formData.enableAutoReorder && (
            <div className="space-y-2">
              <Label htmlFor="autoReorderThreshold">Auto-Reorder Threshold</Label>
              <Input
                id="autoReorderThreshold"
                type="number"
                min="0"
                value={formData.autoReorderThreshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    autoReorderThreshold: parseInt(e.target.value) || 5,
                  })
                }
              />
              <p className="text-sm text-gray-500">
                Create purchase order when quantity falls below this number (default: 5)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Warehouse Configuration</CardTitle>
          <CardDescription>
            Set default warehouse location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultWarehouseLocation">Default Warehouse Location</Label>
            <Input
              id="defaultWarehouseLocation"
              value={formData.defaultWarehouseLocation}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultWarehouseLocation: e.target.value,
                })
              }
              placeholder="Main Warehouse"
            />
            <p className="text-sm text-gray-500">
              Default location for new inventory items
            </p>
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
    </div>
  );
}
