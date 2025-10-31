'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { NotificationSettings as NotificationSettingsType, SystemSettings } from '@/types/settings';
import { SettingsService } from '@/services/database/settings';
import { Save, RotateCcw, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationSettingsProps {
  settings: NotificationSettingsType;
  onUpdate: (settings: SystemSettings) => void;
  userId: string;
}

export default function NotificationSettings({ settings, onUpdate, userId }: NotificationSettingsProps) {
  const [formData, setFormData] = useState<NotificationSettingsType>(settings);
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await SettingsService.updateNotificationSettings(formData, userId);
      onUpdate(updated);
      toast.success('Notification settings saved successfully');
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

  const handleAddEmail = () => {
    if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      if (!formData.emailRecipients.includes(newEmail)) {
        setFormData({
          ...formData,
          emailRecipients: [...formData.emailRecipients, newEmail],
        });
        setNewEmail('');
        toast.success('Email added');
      } else {
        toast.error('Email already exists');
      }
    } else {
      toast.error('Please enter a valid email address');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setFormData({
      ...formData,
      emailRecipients: formData.emailRecipients.filter((e) => e !== email),
    });
    toast.success('Email removed');
  };

  const handleToggleNotification = (key: keyof NotificationSettingsType['emailNotifications']) => {
    setFormData({
      ...formData,
      emailNotifications: {
        ...formData.emailNotifications,
        [key]: !formData.emailNotifications[key],
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose which events trigger email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Low Stock Alerts</Label>
              <p className="text-sm text-gray-500">
                Notify when product stock falls below threshold
              </p>
            </div>
            <Switch
              checked={formData.emailNotifications.lowStock}
              onCheckedChange={() => handleToggleNotification('lowStock')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Order Status Changes</Label>
              <p className="text-sm text-gray-500">
                Notify when order status is updated
              </p>
            </div>
            <Switch
              checked={formData.emailNotifications.orderStatusChange}
              onCheckedChange={() => handleToggleNotification('orderStatusChange')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Payment Reminders</Label>
              <p className="text-sm text-gray-500">
                Send reminders for overdue invoices
              </p>
            </div>
            <Switch
              checked={formData.emailNotifications.paymentReminders}
              onCheckedChange={() => handleToggleNotification('paymentReminders')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Expiry Alerts</Label>
              <p className="text-sm text-gray-500">
                Notify when products are approaching expiry date
              </p>
            </div>
            <Switch
              checked={formData.emailNotifications.expiryAlerts}
              onCheckedChange={() => handleToggleNotification('expiryAlerts')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Customer Registration</Label>
              <p className="text-sm text-gray-500">
                Notify when a new customer is registered
              </p>
            </div>
            <Switch
              checked={formData.emailNotifications.newCustomer}
              onCheckedChange={() => handleToggleNotification('newCustomer')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>System Alerts</Label>
              <p className="text-sm text-gray-500">
                Notify about system errors and critical issues
              </p>
            </div>
            <Switch
              checked={formData.emailNotifications.systemAlerts}
              onCheckedChange={() => handleToggleNotification('systemAlerts')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Recipients</CardTitle>
          <CardDescription>
            Manage who receives email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter email address"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddEmail();
                }
              }}
            />
            <Button onClick={handleAddEmail} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {formData.emailRecipients.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No email recipients configured
              </p>
            ) : (
              formData.emailRecipients.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span className="text-sm">{email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEmail(email)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Frequency</CardTitle>
          <CardDescription>
            Control how often notifications are sent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notificationFrequency">Frequency</Label>
            <Select
              value={formData.notificationFrequency}
              onValueChange={(value: 'realtime' | 'hourly' | 'daily') =>
                setFormData({ ...formData, notificationFrequency: value })
              }
            >
              <SelectTrigger id="notificationFrequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real-time (Immediate)</SelectItem>
                <SelectItem value="hourly">Hourly Digest</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              {formData.notificationFrequency === 'realtime'
                ? 'Notifications are sent immediately when events occur'
                : formData.notificationFrequency === 'hourly'
                ? 'Notifications are batched and sent every hour'
                : 'Notifications are batched and sent once per day'}
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
