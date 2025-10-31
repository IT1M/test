'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { GeneralSettings as GeneralSettingsType, SystemSettings, ThemeMode, DateFormat } from '@/types/settings';
import { SettingsService } from '@/services/database/settings';
import { Save, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

interface GeneralSettingsProps {
  settings: GeneralSettingsType;
  onUpdate: (settings: SystemSettings) => void;
  userId: string;
}

export default function GeneralSettings({ settings, onUpdate, userId }: GeneralSettingsProps) {
  const [formData, setFormData] = useState<GeneralSettingsType>(settings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await SettingsService.updateGeneralSettings(formData, userId);
      onUpdate(updated);
      
      // Apply theme immediately
      if (formData.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (formData.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // Auto mode - check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      toast.success('General settings saved successfully');
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
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={formData.theme}
              onValueChange={(value: ThemeMode) =>
                setFormData({ ...formData, theme: value })
              }
            >
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">Auto (System)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Choose your preferred color theme
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
          <CardDescription>
            Configure date, time, and language preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select
              value={formData.dateFormat}
              onValueChange={(value: DateFormat) =>
                setFormData({ ...formData, dateFormat: value })
              }
            >
              <SelectTrigger id="dateFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (UK)</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Select how dates should be displayed throughout the system
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={formData.language}
              onValueChange={(value) =>
                setFormData({ ...formData, language: value })
              }
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">Arabic (العربية)</SelectItem>
                <SelectItem value="es">Spanish (Español)</SelectItem>
                <SelectItem value="fr">French (Français)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Select your preferred language
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) =>
                setFormData({ ...formData, timezone: value })
              }
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                <SelectItem value="Asia/Riyadh">Riyadh (AST)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Select your timezone for accurate timestamps
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Control how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Notifications</Label>
              <p className="text-sm text-gray-500">
                Receive system notifications and alerts
              </p>
            </div>
            <Switch
              checked={formData.notificationsEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, notificationsEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sound Effects</Label>
              <p className="text-sm text-gray-500">
                Play sounds for notifications and alerts
              </p>
            </div>
            <Switch
              checked={formData.soundEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, soundEnabled: checked })
              }
            />
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
