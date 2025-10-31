'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DataManagementSettings as DataManagementSettingsType, SystemSettings } from '@/types/settings';
import { SettingsService } from '@/services/database/settings';
import { db } from '@/lib/db/schema';
import { Save, RotateCcw, Download, Upload, Database, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';

interface DataManagementSettingsProps {
  settings: DataManagementSettingsType;
  onUpdate: (settings: SystemSettings) => void;
  userId: string;
}

export default function DataManagementSettings({ settings, onUpdate, userId }: DataManagementSettingsProps) {
  const [formData, setFormData] = useState<DataManagementSettingsType>(settings);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await SettingsService.updateDataManagementSettings(formData, userId);
      onUpdate(updated);
      toast.success('Data management settings saved successfully');
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

  const handleExportData = async () => {
    try {
      setExporting(true);
      const data = await db.exportAllData();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medical-products-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleImportData = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    // Confirmation for critical action
    const confirmed = window.confirm(
      'WARNING: This will replace ALL existing data in the database. This action cannot be undone. Are you sure you want to continue?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setImporting(true);
      const text = await importFile.text();
      const data = JSON.parse(text);
      
      await db.importAllData(data);
      
      setShowImportDialog(false);
      setImportFile(null);
      toast.success('Data imported successfully');
      
      // Reload the page to reflect imported data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Failed to import data. Please check the file format.');
    } finally {
      setImporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setImportFile(file);
      } else {
        toast.error('Please select a valid JSON file');
      }
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Data management settings affect how your data is stored and backed up. Changes to these
          settings may impact system performance and data retention.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Auto-Save</CardTitle>
          <CardDescription>
            Configure automatic data saving during data entry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="autoSaveInterval">Auto-Save Interval (seconds)</Label>
            <Input
              id="autoSaveInterval"
              type="number"
              min="10"
              max="300"
              value={formData.autoSaveInterval}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  autoSaveInterval: parseInt(e.target.value) || 30,
                })
              }
            />
            <p className="text-sm text-gray-500">
              How often to automatically save form data (default: 30 seconds)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup Configuration</CardTitle>
          <CardDescription>
            Set up automatic backups to protect your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Automatic Backups</Label>
              <p className="text-sm text-gray-500">
                Automatically create backups on a schedule
              </p>
            </div>
            <Switch
              checked={formData.enableAutoBackup}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enableAutoBackup: checked })
              }
            />
          </div>

          {formData.enableAutoBackup && (
            <>
              <div className="space-y-2">
                <Label htmlFor="backupSchedule">Backup Schedule</Label>
                <Select
                  value={formData.backupSchedule}
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'manual') =>
                    setFormData({ ...formData, backupSchedule: value })
                  }
                >
                  <SelectTrigger id="backupSchedule">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="manual">Manual Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backupTime">Backup Time</Label>
                <Input
                  id="backupTime"
                  type="time"
                  value={formData.backupTime}
                  onChange={(e) =>
                    setFormData({ ...formData, backupTime: e.target.value })
                  }
                />
                <p className="text-sm text-gray-500">
                  Time of day to run automatic backups (24-hour format)
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Retention</CardTitle>
          <CardDescription>
            Configure how long to keep historical data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dataRetentionDays">Data Retention Period (days)</Label>
            <Input
              id="dataRetentionDays"
              type="number"
              min="30"
              max="3650"
              value={formData.dataRetentionDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dataRetentionDays: parseInt(e.target.value) || 365,
                })
              }
            />
            <p className="text-sm text-gray-500">
              How long to keep historical records before archiving (default: 365 days)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Import/Export</CardTitle>
          <CardDescription>
            Backup and restore your entire database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={exporting}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export All Data'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(true)}
              disabled={importing}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Export creates a JSON backup file. Import will restore data from a backup file.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Statistics</CardTitle>
          <CardDescription>
            Current database information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-600">Database Size</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">~0 MB</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-600">Last Backup</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">Never</p>
            </div>
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

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              Select a backup file to import. This will replace all existing data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Warning: Importing data will replace all existing data in the database.
                Make sure to export your current data first if you want to keep it.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="importFile">Select Backup File</Label>
              <Input
                id="importFile"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
              />
              {importFile && (
                <p className="text-sm text-gray-500">
                  Selected: {importFile.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setImportFile(null);
              }}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportData}
              disabled={importing || !importFile}
            >
              {importing ? 'Importing...' : 'Import Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
