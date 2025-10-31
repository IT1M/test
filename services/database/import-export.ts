// Import/Export Service - Handles Excel/CSV import and export operations

import * as XLSX from 'xlsx';
import { db } from '@/lib/db/schema';
import type { Product, Customer, Patient } from '@/types/database';

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

/**
 * Import/Export Service
 * Handles bulk data import from Excel/CSV and export to various formats
 */
export class ImportExportService {
  /**
   * Validate product data
   */
  private static validateProduct(data: any, row: number): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.sku || typeof data.sku !== 'string') {
      errors.push({ row, field: 'sku', message: 'SKU is required and must be a string' });
    }

    if (!data.name || typeof data.name !== 'string') {
      errors.push({ row, field: 'name', message: 'Name is required and must be a string' });
    }

    if (data.unitPrice !== undefined && (isNaN(data.unitPrice) || data.unitPrice < 0)) {
      errors.push({ row, field: 'unitPrice', message: 'Unit price must be a positive number' });
    }

    if (data.costPrice !== undefined && (isNaN(data.costPrice) || data.costPrice < 0)) {
      errors.push({ row, field: 'costPrice', message: 'Cost price must be a positive number' });
    }

    if (data.stockQuantity !== undefined && (isNaN(data.stockQuantity) || data.stockQuantity < 0)) {
      errors.push({ row, field: 'stockQuantity', message: 'Stock quantity must be a non-negative number' });
    }

    if (data.reorderLevel !== undefined && (isNaN(data.reorderLevel) || data.reorderLevel < 0)) {
      errors.push({ row, field: 'reorderLevel', message: 'Reorder level must be a non-negative number' });
    }

    return errors;
  }

  /**
   * Validate customer data
   */
  private static validateCustomer(data: any, row: number): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.customerId || typeof data.customerId !== 'string') {
      errors.push({ row, field: 'customerId', message: 'Customer ID is required and must be a string' });
    }

    if (!data.name || typeof data.name !== 'string') {
      errors.push({ row, field: 'name', message: 'Name is required and must be a string' });
    }

    if (data.type && !['hospital', 'clinic', 'pharmacy', 'distributor'].includes(data.type)) {
      errors.push({ row, field: 'type', message: 'Type must be one of: hospital, clinic, pharmacy, distributor' });
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push({ row, field: 'email', message: 'Invalid email format' });
    }

    if (data.creditLimit !== undefined && (isNaN(data.creditLimit) || data.creditLimit < 0)) {
      errors.push({ row, field: 'creditLimit', message: 'Credit limit must be a non-negative number' });
    }

    return errors;
  }

  /**
   * Validate patient data
   */
  private static validatePatient(data: any, row: number): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.nationalId || typeof data.nationalId !== 'string') {
      errors.push({ row, field: 'nationalId', message: 'National ID is required and must be a string' });
    }

    if (!data.firstName || typeof data.firstName !== 'string') {
      errors.push({ row, field: 'firstName', message: 'First name is required and must be a string' });
    }

    if (!data.lastName || typeof data.lastName !== 'string') {
      errors.push({ row, field: 'lastName', message: 'Last name is required and must be a string' });
    }

    if (data.gender && !['male', 'female', 'other'].includes(data.gender)) {
      errors.push({ row, field: 'gender', message: 'Gender must be one of: male, female, other' });
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push({ row, field: 'email', message: 'Invalid email format' });
    }

    return errors;
  }

  /**
   * Import products from Excel/CSV file
   */
  static async importProducts(file: File): Promise<ImportResult> {
    try {
      const data = await this.readFile(file);
      const products: Product[] = [];
      const errors: string[] = [];
      let imported = 0;
      let failed = 0;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have a header

        // Validate row
        const validationErrors = this.validateProduct(row, rowNumber);
        if (validationErrors.length > 0) {
          failed++;
          errors.push(...validationErrors.map(e => `Row ${e.row}, ${e.field}: ${e.message}`));
          continue;
        }

        // Check for duplicate SKU
        const existing = await db.products.where('sku').equals(row.sku).first();
        if (existing) {
          failed++;
          errors.push(`Row ${rowNumber}: Product with SKU '${row.sku}' already exists`);
          continue;
        }

        // Create product object
        const product: Product = {
          id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sku: row.sku,
          name: row.name,
          category: row.category || 'Uncategorized',
          description: row.description || '',
          manufacturer: row.manufacturer || '',
          unitPrice: parseFloat(row.unitPrice) || 0,
          costPrice: parseFloat(row.costPrice) || 0,
          stockQuantity: parseInt(row.stockQuantity) || 0,
          reorderLevel: parseInt(row.reorderLevel) || 10,
          expiryDate: row.expiryDate ? new Date(row.expiryDate) : undefined,
          batchNumber: row.batchNumber || undefined,
          regulatoryInfo: row.regulatoryInfo || undefined,
          imageUrl: row.imageUrl || undefined,
          isActive: row.isActive !== false,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'import',
        };

        products.push(product);
        imported++;
      }

      // Bulk insert products
      if (products.length > 0) {
        await db.products.bulkAdd(products);
      }

      // Log import
      await db.systemLogs.add({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action: 'import_products',
        entityType: 'product',
        details: `Imported ${imported} products, ${failed} failed`,
        userId: 'import',
        timestamp: new Date(),
        status: failed > 0 ? 'warning' : 'success',
      });

      return {
        success: true,
        imported,
        failed,
        errors,
      };
    } catch (error) {
      console.error('Error importing products:', error);
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Import customers from Excel/CSV file
   */
  static async importCustomers(file: File): Promise<ImportResult> {
    try {
      const data = await this.readFile(file);
      const customers: Customer[] = [];
      const errors: string[] = [];
      let imported = 0;
      let failed = 0;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;

        // Validate row
        const validationErrors = this.validateCustomer(row, rowNumber);
        if (validationErrors.length > 0) {
          failed++;
          errors.push(...validationErrors.map(e => `Row ${e.row}, ${e.field}: ${e.message}`));
          continue;
        }

        // Check for duplicate customer ID
        const existing = await db.customers.where('customerId').equals(row.customerId).first();
        if (existing) {
          failed++;
          errors.push(`Row ${rowNumber}: Customer with ID '${row.customerId}' already exists`);
          continue;
        }

        // Create customer object
        const customer: Customer = {
          id: `cust-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          customerId: row.customerId,
          name: row.name,
          type: row.type || 'clinic',
          contactPerson: row.contactPerson || '',
          phone: row.phone || '',
          email: row.email || '',
          address: row.address || '',
          city: row.city || '',
          country: row.country || '',
          taxId: row.taxId || '',
          creditLimit: parseFloat(row.creditLimit) || 0,
          paymentTerms: row.paymentTerms || 'Net 30',
          segment: row.segment || 'Regular',
          lifetimeValue: 0,
          isActive: row.isActive !== false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        customers.push(customer);
        imported++;
      }

      // Bulk insert customers
      if (customers.length > 0) {
        await db.customers.bulkAdd(customers);
      }

      // Log import
      await db.systemLogs.add({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action: 'import_customers',
        entityType: 'customer',
        details: `Imported ${imported} customers, ${failed} failed`,
        userId: 'import',
        timestamp: new Date(),
        status: failed > 0 ? 'warning' : 'success',
      });

      return {
        success: true,
        imported,
        failed,
        errors,
      };
    } catch (error) {
      console.error('Error importing customers:', error);
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Import patients from Excel/CSV file
   */
  static async importPatients(file: File): Promise<ImportResult> {
    try {
      const data = await this.readFile(file);
      const patients: Patient[] = [];
      const errors: string[] = [];
      let imported = 0;
      let failed = 0;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;

        // Validate row
        const validationErrors = this.validatePatient(row, rowNumber);
        if (validationErrors.length > 0) {
          failed++;
          errors.push(...validationErrors.map(e => `Row ${e.row}, ${e.field}: ${e.message}`));
          continue;
        }

        // Check for duplicate national ID
        const existing = await db.patients.where('nationalId').equals(row.nationalId).first();
        if (existing) {
          failed++;
          errors.push(`Row ${rowNumber}: Patient with National ID '${row.nationalId}' already exists`);
          continue;
        }

        // Create patient object
        const patient: Patient = {
          id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          patientId: `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          nationalId: row.nationalId,
          firstName: row.firstName,
          lastName: row.lastName,
          dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : new Date(),
          gender: row.gender || 'other',
          phone: row.phone || '',
          email: row.email || undefined,
          address: row.address || '',
          bloodType: row.bloodType || undefined,
          allergies: row.allergies ? row.allergies.split(',').map((a: string) => a.trim()) : undefined,
          chronicConditions: row.chronicConditions ? row.chronicConditions.split(',').map((c: string) => c.trim()) : undefined,
          linkedCustomerId: row.linkedCustomerId || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        patients.push(patient);
        imported++;
      }

      // Bulk insert patients
      if (patients.length > 0) {
        await db.patients.bulkAdd(patients);
      }

      // Log import
      await db.systemLogs.add({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action: 'import_patients',
        entityType: 'patient',
        details: `Imported ${imported} patients, ${failed} failed`,
        userId: 'import',
        timestamp: new Date(),
        status: failed > 0 ? 'warning' : 'success',
      });

      return {
        success: true,
        imported,
        failed,
        errors,
      };
    } catch (error) {
      console.error('Error importing patients:', error);
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Read Excel/CSV file and convert to JSON
   */
  private static async readFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsBinaryString(file);
    });
  }

  /**
   * Export products to Excel
   */
  static async exportProducts(): Promise<void> {
    try {
      const products = await db.products.toArray();
      
      const data = products.map(p => ({
        SKU: p.sku,
        Name: p.name,
        Category: p.category,
        Description: p.description,
        Manufacturer: p.manufacturer,
        'Unit Price': p.unitPrice,
        'Cost Price': p.costPrice,
        'Stock Quantity': p.stockQuantity,
        'Reorder Level': p.reorderLevel,
        'Expiry Date': p.expiryDate ? p.expiryDate.toISOString().split('T')[0] : '',
        'Batch Number': p.batchNumber || '',
        'Regulatory Info': p.regulatoryInfo || '',
        Active: p.isActive ? 'Yes' : 'No',
      }));

      this.downloadExcel(data, 'products');
    } catch (error) {
      console.error('Error exporting products:', error);
      throw error;
    }
  }

  /**
   * Export customers to Excel
   */
  static async exportCustomers(): Promise<void> {
    try {
      const customers = await db.customers.toArray();
      
      const data = customers.map(c => ({
        'Customer ID': c.customerId,
        Name: c.name,
        Type: c.type,
        'Contact Person': c.contactPerson,
        Phone: c.phone,
        Email: c.email,
        Address: c.address,
        City: c.city,
        Country: c.country,
        'Tax ID': c.taxId,
        'Credit Limit': c.creditLimit,
        'Payment Terms': c.paymentTerms,
        Segment: c.segment,
        Active: c.isActive ? 'Yes' : 'No',
      }));

      this.downloadExcel(data, 'customers');
    } catch (error) {
      console.error('Error exporting customers:', error);
      throw error;
    }
  }

  /**
   * Export patients to Excel
   */
  static async exportPatients(): Promise<void> {
    try {
      const patients = await db.patients.toArray();
      
      const data = patients.map(p => ({
        'Patient ID': p.patientId,
        'National ID': p.nationalId,
        'First Name': p.firstName,
        'Last Name': p.lastName,
        'Date of Birth': p.dateOfBirth.toISOString().split('T')[0],
        Gender: p.gender,
        Phone: p.phone,
        Email: p.email || '',
        Address: p.address,
        'Blood Type': p.bloodType || '',
        Allergies: p.allergies?.join(', ') || '',
        'Chronic Conditions': p.chronicConditions?.join(', ') || '',
        'Linked Customer ID': p.linkedCustomerId || '',
      }));

      this.downloadExcel(data, 'patients');
    } catch (error) {
      console.error('Error exporting patients:', error);
      throw error;
    }
  }

  /**
   * Download data as Excel file
   */
  private static downloadExcel(data: any[], filename: string): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `${filename}-${timestamp}.xlsx`);
  }

  /**
   * Export data to CSV
   */
  static async exportToCSV(entityType: 'products' | 'customers' | 'patients'): Promise<void> {
    try {
      let data: any[];
      let headers: string[];

      switch (entityType) {
        case 'products':
          const products = await db.products.toArray();
          headers = ['SKU', 'Name', 'Category', 'Unit Price', 'Stock Quantity'];
          data = products.map(p => [p.sku, p.name, p.category, p.unitPrice, p.stockQuantity]);
          break;
        case 'customers':
          const customers = await db.customers.toArray();
          headers = ['Customer ID', 'Name', 'Type', 'Email', 'Phone'];
          data = customers.map(c => [c.customerId, c.name, c.type, c.email, c.phone]);
          break;
        case 'patients':
          const patients = await db.patients.toArray();
          headers = ['Patient ID', 'First Name', 'Last Name', 'National ID', 'Phone'];
          data = patients.map(p => [p.patientId, p.firstName, p.lastName, p.nationalId, p.phone]);
          break;
      }

      const csv = [headers, ...data].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${entityType}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }
}
