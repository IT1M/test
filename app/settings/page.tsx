'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Settings, Database, Zap, Building2, Package, Bell, Sliders, FileText } from 'lucide-react';
import { SystemSettings } from '@/types/settings';
import { SettingsService } from '@/services/database/settings';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

// Import settings components (to be created)
import GeneralSettings from '@/components/settings/GeneralSettings';
import GeminiAPISettings from '@/components/settings/GeminiAPISettings';
import DataManagementSettings from '@/components/settings/DataManagementSettings';
import BusinessSettings from '@/components/settings/BusinessSettings';
import InventorySettings from '@/components/settings/InventorySettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import CustomFieldsSettings from '@/components/settings/CustomFieldsSettings';
import ReportTemplatesSettings from '@/components/settings/ReportTemplatesSettings';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await SettingsService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (updatedSettings: SystemSettings) => {
    setSettings(updatedSettings);
    toast.success('Settings updated successfully');
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-8 w-8" />
          System Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure system preferences, integrations, and business rules
        </p>
      </div>

      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Business</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="custom-fields" className="flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              <span className="hidden sm:inline">Custom Fields</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <GeneralSettings
              settings={settings.general}
              onUpdate={handleSettingsUpdate}
              userId={currentUser?.id || 'system'}
            />
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <GeminiAPISettings
              settings={settings.geminiAPI}
              onUpdate={handleSettingsUpdate}
              userId={currentUser?.id || 'system'}
            />
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <DataManagementSettings
              settings={settings.dataManagement}
              onUpdate={handleSettingsUpdate}
              userId={currentUser?.id || 'system'}
            />
          </TabsContent>

          <TabsContent value="business" className="space-y-4">
            <BusinessSettings
              settings={settings.business}
              paymentTerms={settings.paymentTerms}
              onUpdate={handleSettingsUpdate}
              userId={currentUser?.id || 'system'}
            />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <InventorySettings
              settings={settings.inventory}
              onUpdate={handleSettingsUpdate}
              userId={currentUser?.id || 'system'}
            />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <NotificationSettings
              settings={settings.notifications}
              onUpdate={handleSettingsUpdate}
              userId={currentUser?.id || 'system'}
            />
          </TabsContent>

          <TabsContent value="custom-fields" className="space-y-4">
            <CustomFieldsSettings
              settings={settings.customFields}
              onUpdate={handleSettingsUpdate}
              userId={currentUser?.id || 'system'}
            />
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <ReportTemplatesSettings
              settings={settings.reportTemplates}
              onUpdate={handleSettingsUpdate}
              userId={currentUser?.id || 'system'}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
