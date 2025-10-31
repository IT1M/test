// Export Utilities
// Functions for exporting data to various formats (CSV, Excel, PDF)

import * as XLSX from 'xlsx';
import type { Product, Customer, Order, Patient, MedicalRecord } from '@/types/database';

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          // Handle special characters and quotes
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data to Excel format
 */
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1'): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export multiple sheets to Excel
 */
export function exportMultipleSheetsToExcel(
  sheets: Array<{ name: string; data: any[] }>,
  filename: string
): void {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(sheet => {
    if (sheet.data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    }
  });

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export data to PDF format (simplified version)
 * For a full PDF implementation, consider using jsPDF or pdfmake
 */
export function exportToPDF(data: any[], filename: string, title: string): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Create HTML table
  const headers = Object.keys(data[0]);
  const tableHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        h1 {
          color: #333;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #4CAF50;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f2f2f2;
        }
        tr:hover {
          background-color: #ddd;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              row => `
            <tr>
              ${headers.map(h => `<td>${row[h] !== null && row[h] !== undefined ? row[h] : ''}</td>`).join('')}
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <div class="footer">
        <p>Medical Products Management System - Search Results Export</p>
      </div>
    </body>
    </html>
  `;

  // Create blob and open in new window for printing
  const blob = new Blob([tableHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');

  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
      URL.revokeObjectURL(url);
    };
  }
}

/**
 * Helper function to download blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format search results for export
 */
export function formatProductsForExport(products: Product[]): any[] {
  return products.map(p => ({
    SKU: p.sku,
    Name: p.name,
    Category: p.category,
    Manufacturer: p.manufacturer,
    'Unit Price': p.unitPrice,
    'Cost Price': p.costPrice,
    'Stock Quantity': p.stockQuantity,
    'Reorder Level': p.reorderLevel,
    'Expiry Date': p.expiryDate ? p.expiryDate.toLocaleDateString() : '',
    'Batch Number': p.batchNumber || '',
    Active: p.isActive ? 'Yes' : 'No',
  }));
}

export function formatCustomersForExport(customers: Customer[]): any[] {
  return customers.map(c => ({
    'Customer ID': c.customerId,
    Name: c.name,
    Type: c.type,
    'Contact Person': c.contactPerson,
    Phone: c.phone,
    Email: c.email,
    City: c.city,
    Country: c.country,
    'Tax ID': c.taxId,
    'Credit Limit': c.creditLimit,
    'Payment Terms': c.paymentTerms,
    Segment: c.segment || '',
    Active: c.isActive ? 'Yes' : 'No',
  }));
}

export function formatOrdersForExport(orders: Order[]): any[] {
  return orders.map(o => ({
    'Order ID': o.orderId,
    'Order Date': o.orderDate.toLocaleDateString(),
    'Delivery Date': o.deliveryDate ? o.deliveryDate.toLocaleDateString() : '',
    Status: o.status,
    'Total Amount': o.totalAmount,
    'Payment Status': o.paymentStatus,
    'Sales Person': o.salesPerson,
    'Items Count': o.items.length,
  }));
}

export function formatPatientsForExport(patients: Patient[]): any[] {
  return patients.map(p => ({
    'Patient ID': p.patientId,
    'First Name': p.firstName,
    'Last Name': p.lastName,
    'National ID': p.nationalId,
    'Date of Birth': p.dateOfBirth.toLocaleDateString(),
    Gender: p.gender,
    Phone: p.phone,
    Email: p.email || '',
    'Blood Type': p.bloodType || '',
    Allergies: p.allergies?.join(', ') || '',
  }));
}

export function formatMedicalRecordsForExport(records: MedicalRecord[]): any[] {
  return records.map(r => ({
    'Record ID': r.recordId,
    Title: r.title,
    'Record Type': r.recordType,
    'Visit Date': r.visitDate.toLocaleDateString(),
    Diagnosis: r.diagnosis || '',
    'Doctor Name': r.doctorName || '',
    'Hospital Name': r.hospitalName || '',
  }));
}

/**
 * Export search results with all entity types
 */
export function exportSearchResults(
  results: {
    products: Product[];
    customers: Customer[];
    orders: Order[];
    patients: Patient[];
    medicalRecords: MedicalRecord[];
  },
  format: 'csv' | 'excel' | 'pdf',
  filename: string = 'search-results'
): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}-${timestamp}`;

  if (format === 'excel') {
    // Export all entity types to separate sheets
    const sheets = [];

    if (results.products.length > 0) {
      sheets.push({
        name: 'Products',
        data: formatProductsForExport(results.products),
      });
    }

    if (results.customers.length > 0) {
      sheets.push({
        name: 'Customers',
        data: formatCustomersForExport(results.customers),
      });
    }

    if (results.orders.length > 0) {
      sheets.push({
        name: 'Orders',
        data: formatOrdersForExport(results.orders),
      });
    }

    if (results.patients.length > 0) {
      sheets.push({
        name: 'Patients',
        data: formatPatientsForExport(results.patients),
      });
    }

    if (results.medicalRecords.length > 0) {
      sheets.push({
        name: 'Medical Records',
        data: formatMedicalRecordsForExport(results.medicalRecords),
      });
    }

    if (sheets.length > 0) {
      exportMultipleSheetsToExcel(sheets, fullFilename);
    } else {
      throw new Error('No data to export');
    }
  } else if (format === 'csv') {
    // For CSV, combine all results into one file
    const allData: any[] = [];

    results.products.forEach(p => {
      allData.push({
        Type: 'Product',
        ...formatProductsForExport([p])[0],
      });
    });

    results.customers.forEach(c => {
      allData.push({
        Type: 'Customer',
        ...formatCustomersForExport([c])[0],
      });
    });

    results.orders.forEach(o => {
      allData.push({
        Type: 'Order',
        ...formatOrdersForExport([o])[0],
      });
    });

    results.patients.forEach(p => {
      allData.push({
        Type: 'Patient',
        ...formatPatientsForExport([p])[0],
      });
    });

    results.medicalRecords.forEach(r => {
      allData.push({
        Type: 'Medical Record',
        ...formatMedicalRecordsForExport([r])[0],
      });
    });

    if (allData.length > 0) {
      exportToCSV(allData, fullFilename);
    } else {
      throw new Error('No data to export');
    }
  } else if (format === 'pdf') {
    // For PDF, create a summary report
    const allData: any[] = [];

    results.products.forEach(p => {
      allData.push({
        Type: 'Product',
        Name: p.name,
        Details: `${p.sku} - ${p.category}`,
        Value: `$${p.unitPrice}`,
      });
    });

    results.customers.forEach(c => {
      allData.push({
        Type: 'Customer',
        Name: c.name,
        Details: `${c.type} - ${c.city}`,
        Value: c.email,
      });
    });

    results.orders.forEach(o => {
      allData.push({
        Type: 'Order',
        Name: o.orderId,
        Details: `${o.status} - ${o.orderDate.toLocaleDateString()}`,
        Value: `$${o.totalAmount}`,
      });
    });

    results.patients.forEach(p => {
      allData.push({
        Type: 'Patient',
        Name: `${p.firstName} ${p.lastName}`,
        Details: `${p.gender} - ${p.nationalId}`,
        Value: p.phone,
      });
    });

    if (allData.length > 0) {
      exportToPDF(allData, fullFilename, 'Search Results');
    } else {
      throw new Error('No data to export');
    }
  }
}
