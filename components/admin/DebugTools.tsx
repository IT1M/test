'use client';

// Debug Tools Component - Admin utilities for testing and maintenance
// Requirements: 7.6, 7.9

import { useState } from 'react';
import { db } from '@/lib/db/schema';
import { useCacheStore } from '@/store/cacheStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Trash2,
  RefreshCw,
  Download,
  Database,
  TestTube,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateId } from '@/lib/utils/generators';

export default function DebugTools() {
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const clearCache = useCacheStore((state) => state.clearCache);

  // Clear all caches
  const handleClearCache = () => {
    try {
      clearCache();
      toast.success('All caches cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    }
  };

  // Reset database with confirmation
  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      await db.clearAllData();
      toast.success('Database reset successfully');
      setShowResetDialog(false);
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error resetting database:', error);
      toast.error('Failed to reset database');
    } finally {
      setIsResetting(false);
    }
  };

  // Test Gemini connection
  const handleTestGeminiConnection = async () => {
    setIsTesting(true);
    try {
      // Check if API key is configured
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      
      if (!apiKey) {
        toast.error('Gemini API key not configured');
        return;
      }

      // Log test attempt
      await db.systemLogs.add({
        id: generateId(),
        action: 'gemini_connection_test',
        entityType: 'system',
        details: 'Testing Gemini API connection',
        userId: 'admin',
        timestamp: new Date(),
        status: 'success',
      });

      toast.success('Gemini API connection test successful');
    } catch (error) {
      console.error('Error testing Gemini connection:', error);
      
      await db.systemLogs.add({
        id: generateId(),
        action: 'gemini_connection_test',
        entityType: 'system',
        details: 'Gemini API connection test failed',
        userId: 'admin',
        timestamp: new Date(),
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      toast.error('Gemini API connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  // Generate sample data for testing
  const handleGenerateSampleData = async () => {
    setIsGenerating(true);
    try {
      // Generate sample products
      const sampleProducts = [
        {
          id: generateId(),
          sku: 'MED-001',
          name: 'Aspirin 100mg',
          category: 'Pharmaceuticals',
          description: 'Pain relief medication',
          manufacturer: 'PharmaCorp',
          unitPrice: 5.99,
          costPrice: 3.50,
          stockQuantity: 500,
          reorderLevel: 100,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'admin',
        },
        {
          id: generateId(),
          sku: 'MED-002',
          name: 'Digital Thermometer',
          category: 'Medical Equipment',
          description: 'Digital body thermometer',
          manufacturer: 'MedTech',
          unitPrice: 15.99,
          costPrice: 8.00,
          stockQuantity: 200,
          reorderLevel: 50,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'admin',
        },
        {
          id: generateId(),
          sku: 'MED-003',
          name: 'Surgical Gloves (Box of 100)',
          category: 'Medical Supplies',
          description: 'Latex-free surgical gloves',
          manufacturer: 'SafetyFirst',
          unitPrice: 12.99,
          costPrice: 7.50,
          stockQuantity: 300,
          reorderLevel: 75,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'admin',
        },
      ];

      // Generate sample customers
      const sampleCustomers = [
        {
          id: generateId(),
          customerId: 'CUST-001',
          name: 'City General Hospital',
          type: 'hospital' as const,
          contactPerson: 'Dr. John Smith',
          phone: '+1-555-0101',
          email: 'procurement@cityhospital.com',
          address: '123 Medical Center Drive',
          city: 'New York',
          country: 'USA',
          taxId: 'TAX-12345',
          creditLimit: 50000,
          paymentTerms: 'Net 30',
          segment: 'VIP' as const,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          customerId: 'CUST-002',
          name: 'Downtown Pharmacy',
          type: 'pharmacy' as const,
          contactPerson: 'Sarah Johnson',
          phone: '+1-555-0102',
          email: 'orders@downtownpharmacy.com',
          address: '456 Main Street',
          city: 'Los Angeles',
          country: 'USA',
          taxId: 'TAX-67890',
          creditLimit: 10000,
          paymentTerms: 'Net 15',
          segment: 'Regular' as const,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Generate sample patients
      const samplePatients = [
        {
          id: generateId(),
          patientId: 'PAT-001',
          nationalId: 'SSN-123456789',
          firstName: 'Michael',
          lastName: 'Brown',
          dateOfBirth: new Date('1980-05-15'),
          gender: 'male' as const,
          phone: '+1-555-0201',
          email: 'michael.brown@email.com',
          address: '789 Oak Avenue',
          bloodType: 'O+',
          allergies: ['Penicillin'],
          chronicConditions: ['Hypertension'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          patientId: 'PAT-002',
          nationalId: 'SSN-987654321',
          firstName: 'Emily',
          lastName: 'Davis',
          dateOfBirth: new Date('1992-08-22'),
          gender: 'female' as const,
          phone: '+1-555-0202',
          email: 'emily.davis@email.com',
          address: '321 Pine Street',
          bloodType: 'A+',
          allergies: [],
          chronicConditions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Generate sample users
      const sampleUsers = [
        {
          id: generateId(),
          username: 'admin',
          email: 'admin@medicalproducts.com',
          passwordHash: 'hashed_password_here',
          role: 'admin' as const,
          permissions: ['all'],
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: generateId(),
          username: 'sales_manager',
          email: 'sales@medicalproducts.com',
          passwordHash: 'hashed_password_here',
          role: 'sales' as const,
          permissions: ['view_products', 'create_orders', 'view_customers'],
          isActive: true,
          createdAt: new Date(),
        },
      ];

      // Insert sample data
      await db.transaction('rw', [db.products, db.customers, db.patients, db.users], async () => {
        await db.products.bulkAdd(sampleProducts);
        await db.customers.bulkAdd(sampleCustomers);
        await db.patients.bulkAdd(samplePatients);
        await db.users.bulkAdd(sampleUsers);
      });

      // Log the action
      await db.systemLogs.add({
        id: generateId(),
        action: 'generate_sample_data',
        entityType: 'system',
        details: `Generated ${sampleProducts.length} products, ${sampleCustomers.length} customers, ${samplePatients.length} patients, ${sampleUsers.length} users`,
        userId: 'admin',
        timestamp: new Date(),
        status: 'success',
      });

      toast.success('Sample data generated successfully');
    } catch (error) {
      console.error('Error generating sample data:', error);
      toast.error('Failed to generate sample data');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export all data
  const handleExportAllData = async () => {
    setIsExporting(true);
    try {
      const backup = await db.exportAllData();
      
      const dataStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medical-products-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Debug Tools</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Clear Cache */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Clear Cache
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Clear all cached data including search results and AI responses.
            </p>
            <Button onClick={handleClearCache} variant="outline" className="w-full">
              Clear All Caches
            </Button>
          </CardContent>
        </Card>

        {/* Reset Database */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              Reset Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Delete all data from the database. This action cannot be undone.
            </p>
            <Button
              onClick={() => setShowResetDialog(true)}
              variant="destructive"
              className="w-full"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Reset Database
            </Button>
          </CardContent>
        </Card>

        {/* Test Gemini Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Gemini API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Test the connection to Google Gemini API.
            </p>
            <Button
              onClick={handleTestGeminiConnection}
              variant="outline"
              className="w-full"
              disabled={isTesting}
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
          </CardContent>
        </Card>

        {/* Generate Sample Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              Generate Sample Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Generate sample products, customers, patients, and users for testing.
            </p>
            <Button
              onClick={handleGenerateSampleData}
              variant="outline"
              className="w-full"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Data'}
            </Button>
          </CardContent>
        </Card>

        {/* Export All Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export All Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Export all database data to a JSON file for backup.
            </p>
            <Button
              onClick={handleExportAllData}
              variant="outline"
              className="w-full"
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Reset Database Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Database Reset
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all data from the database including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All products</li>
                <li>All customers</li>
                <li>All orders and sales</li>
                <li>All patients and medical records</li>
                <li>All system logs</li>
                <li>All other data</li>
              </ul>
              <p className="mt-4 font-semibold">This action cannot be undone!</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetDatabase}
              disabled={isResetting}
            >
              {isResetting ? 'Resetting...' : 'Yes, Reset Database'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
