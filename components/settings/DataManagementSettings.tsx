'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DataManagementSettings as DataManagementSettingsType, SystemSettings } from '@/types/settings';
import { SettingsService } from '@/services/database/settings';
import { BackupService } from '@/services/database/backup';
import { ImportExportService } from '@/services/database/import-export';
import { db } from '@/lib/db/schema';
import { Save, RotateCcw, Download, Upload, Database, AlertTriangle, Clock, FileSpreadsheet, Users, Package, UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

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
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [bulkImportType, setBulkImportType] = useState<'products' | 'customers' | 'patients'>('products');
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [backupStats, setBackupStats] = useState<{
    lastBackup: Date | null;
    autoBackupEnabled: boolean;
    databaseSize: number;
    recordCount: number;
  } | null>(null);

  // Load backup stats on mount
  useEffect(() => {
    loadBackupStats();
  }, []);

  const loadBackupStats = async () => {
    try {
      const stats = await BackupService.getBackupStats();
      setBackupStats(stats);
    } catch (error) {
      console.error('Error loading backup stats:', error);
    }
  };

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
      await BackupService.downloadBackup(true);
      await loadBackupStats();
      toast.success('Backup created and downloaded successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to create backup');
    } finally {
      setExporting(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setExporting(true);
      await BackupService.createBackup(true);
      await loadBackupStats();
      toast.success('Backup created successfully');
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setExporting(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreFile) {
      toast.error('Please select a backup file to restore');
      return;
    }

    try {
      setImporting(true);
      setRestoreProgress(10);

      // Read and validate file
      const text = await restoreFile.text();
      const backup = JSON.parse(text);
      setRestoreProgress(30);

      // Validate backup format
      const validation = BackupService.validateBackup(backup);
      if (!validation.valid) {
        toast.error(`Invalid backup file: ${validation.errors.join(', ')}`);
        return;
      }
      setRestoreProgress(50);

      // Restore backup
      await BackupService.restoreBackup(backup, {
        clearExisting: true,
        restoreSettings: true,
        userId,
      });
      setRestoreProgress(90);

      setShowRestoreDialog(false);
      setRestoreFile(null);
      setRestoreProgress(100);
      
      toast.success('Backup restored successfully. Reloading...');
      
      // Reload the page to reflect restored data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Failed to restore backup. Please check the file format.');
    } finally {
      setImporting(false);
      setRestoreProgress(0);
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

  const handleRestoreFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setRestoreFile(file);
      } else {
        toast.error('Please select a valid JSON backup file');
      }
    }
  };

  const toggleAutoBackup = async (enabled: boolean) => {
    BackupService.setAutoBackupEnabled(enabled);
    await loadBackupStats();
    toast.success(`Automatic backups ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleBulkImport = async () => {
    if (!bulkImportFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      setBulkImporting(true);
      let result;

      switch (bulkImportType) {
        case 'products':
          result = await ImportExportService.importProducts(bulkImportFile);
          break;
        case 'customers':
          result = await ImportExportService.importCustomers(bulkImportFile);
          break;
        case 'patients':
          result = await ImportExportService.importPatients(bulkImportFile);
          break;
      }

      if (result.success) {
        toast.success(`Imported ${result.imported} ${bulkImportType}. ${result.failed} failed.`);
        if (result.errors.length > 0) {
          console.error('Import errors:', result.errors);
        }
      } else {
        toast.error('Import failed. Check console for details.');
        console.error('Import errors:', result.errors);
      }

      setShowBulkImportDialog(false);
      setBulkImportFile(null);
    } catch (error) {
      console.error('Error during bulk import:', error);
      toast.error('Failed to import data');
    } finally {
      setBulkImporting(false);
    }
  };

  const handleBulkExport = async (type: 'products' | 'customers' | 'patients') => {
    try {
      switch (type) {
        case 'products':
          await ImportExportService.exportProducts();
          break;
        case 'customers':
          await ImportExportService.exportCustomers();
          break;
        case 'patients':
          await ImportExportService.exportPatients();
          break;
      }
      toast.success(`${type} exported successfully`);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export data');
    }
  };

  const handleBulkImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (isValid) {
        setBulkImportFile(file);
      } else {
        toast.error('Please select a valid Excel or CSV file');
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
          <CardTitle>Backup & Restore</CardTitle>
          <CardDescription>
            Create backups and restore your entire database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="space-y-0.5">
              <Label>Enable Automatic Backups</Label>
              <p className="text-sm text-gray-500">
                System will create backups automatically
              </p>
            </div>
            <Switch
              checked={backupStats?.autoBackupEnabled || false}
              onCheckedChange={toggleAutoBackup}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleCreateBackup}
              disabled={exporting}
              className="w-full"
            >
              <Database className="h-4 w-4 mr-2" />
              {exporting ? 'Creating...' : 'Create Backup'}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={exporting}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Downloading...' : 'Download Backup'}
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowRestoreDialog(true)}
            disabled={importing}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Restore from Backup
          </Button>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Restoring from backup will replace all existing data. Always create a backup before restoring.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Import/Export</CardTitle>
          <CardDescription>
            Import and export data in Excel/CSV format for products, customers, and patients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Export Data</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => handleBulkExport('products')}
                className="w-full"
              >
                <Package className="h-4 w-4 mr-2" />
                Export Products
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkExport('customers')}
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                Export Customers
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkExport('patients')}
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Export Patients
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Import Data</Label>
            <Button
              variant="outline"
              onClick={() => setShowBulkImportDialog(true)}
              disabled={bulkImporting}
              className="w-full"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Import from Excel/CSV
            </Button>
            <p className="text-sm text-gray-500">
              Import products, customers, or patients from Excel or CSV files. Data will be validated before import.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legacy Import/Export</CardTitle>
          <CardDescription>
            Import/export raw database data (advanced users only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={() => setShowImportDialog(true)}
            disabled={importing}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Raw Data
          </Button>
          <p className="text-sm text-gray-500">
            Use the Backup & Restore section above for normal backup operations.
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-600">Database Size</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {backupStats ? `~${(backupStats.databaseSize / (1024 * 1024)).toFixed(2)} MB` : 'Loading...'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-600">Total Records</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {backupStats ? backupStats.recordCount.toLocaleString() : 'Loading...'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-600">Last Backup</p>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {backupStats?.lastBackup 
                  ? formatDistanceToNow(backupStats.lastBackup, { addSuffix: true })
                  : 'Never'}
              </p>
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

      {/* Restore Backup Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore from Backup</DialogTitle>
            <DialogDescription>
              Select a backup file to restore. This will replace all existing data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Critical Warning:</strong> Restoring from backup will permanently delete all current data
                and replace it with the backup data. This action cannot be undone.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="restoreFile">Select Backup File</Label>
              <Input
                id="restoreFile"
                type="file"
                accept=".json"
                onChange={handleRestoreFileSelect}
              />
              {restoreFile && (
                <p className="text-sm text-gray-500">
                  Selected: {restoreFile.name}
                </p>
              )}
            </div>
            {restoreProgress > 0 && (
              <div className="space-y-2">
                <Label>Restore Progress</Label>
                <Progress value={restoreProgress} />
                <p className="text-sm text-gray-500 text-center">
                  {restoreProgress}% complete
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRestoreDialog(false);
                setRestoreFile(null);
                setRestoreProgress(0);
              }}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestoreBackup}
              disabled={importing || !restoreFile}
              variant="destructive"
            >
              {importing ? 'Restoring...' : 'Restore Backup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImportDialog} onOpenChange={setShowBulkImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Import from Excel/CSV</DialogTitle>
            <DialogDescription>
              Import products, customers, or patients from an Excel or CSV file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="importType">Data Type</Label>
              <Select
                value={bulkImportType}
                onValueChange={(value: 'products' | 'customers' | 'patients') =>
                  setBulkImportType(value)
                }
              >
                <SelectTrigger id="importType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="patients">Patients</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulkImportFile">Select File</Label>
              <Input
                id="bulkImportFile"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleBulkImportFileSelect}
              />
              {bulkImportFile && (
                <p className="text-sm text-gray-500">
                  Selected: {bulkImportFile.name}
                </p>
              )}
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Make sure your file has the correct column headers. Duplicate entries will be skipped.
                Any validation errors will be reported after import.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkImportDialog(false);
                setBulkImportFile(null);
              }}
              disabled={bulkImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkImport}
              disabled={bulkImporting || !bulkImportFile}
            >
              {bulkImporting ? 'Importing...' : 'Import Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog (Legacy) */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Raw Data</DialogTitle>
            <DialogDescription>
              Import raw database data. Use Restore from Backup for normal operations.
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
              <Label htmlFor="importFile">Select Data File</Label>
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
