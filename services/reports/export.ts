// Report Export Service
// Handles exporting reports to various formats (PDF, Excel, CSV)

import * as XLSX from 'xlsx';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils/formatters';

// ============================================================================
// CSV EXPORT
// ============================================================================

export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      
      if (value instanceof Date) {
        return formatDate(value);
      }
      
      return value;
    });
    
    csvContent += values.join(',') + '\n';
  });

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

// ============================================================================
// EXCEL EXPORT
// ============================================================================

export function exportToExcel(data: any[], filename: string, sheetName: string = 'Report'): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Auto-size columns
  const colWidths = Object.keys(data[0]).map(key => {
    const maxLength = Math.max(
      key.length,
      ...data.map(row => {
        const value = row[key];
        if (value === null || value === undefined) return 0;
        return String(value).length;
      })
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });
  ws['!cols'] = colWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Write file
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ============================================================================
// EXCEL EXPORT WITH MULTIPLE SHEETS
// ============================================================================

export function exportToExcelMultiSheet(
  sheets: Array<{ name: string; data: any[] }>,
  filename: string
): void {
  if (sheets.length === 0) {
    alert('No data to export');
    return;
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  
  sheets.forEach(sheet => {
    if (sheet.data.length > 0) {
      const ws = XLSX.utils.json_to_sheet(sheet.data);
      
      // Auto-size columns
      const colWidths = Object.keys(sheet.data[0]).map(key => {
        const maxLength = Math.max(
          key.length,
          ...sheet.data.map(row => {
            const value = row[key];
            if (value === null || value === undefined) return 0;
            return String(value).length;
          })
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    }
  });
  
  // Write file
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ============================================================================
// PDF EXPORT (PRINT-BASED)
// ============================================================================

export function exportToPDF(): void {
  // Use browser's print functionality for PDF export
  window.print();
}

// ============================================================================
// FORMATTED REPORT EXPORT
// ============================================================================

interface FormattedReportData {
  title: string;
  subtitle?: string;
  sections: Array<{
    title: string;
    data: any[];
    columns?: Array<{ key: string; label: string; format?: 'currency' | 'date' | 'percentage' | 'number' }>;
  }>;
}

export function exportFormattedReportToExcel(report: FormattedReportData, filename: string): void {
  const wb = XLSX.utils.book_new();
  
  report.sections.forEach((section, index) => {
    if (section.data.length === 0) return;
    
    // Format data based on column definitions
    const formattedData = section.data.map(row => {
      const formatted: any = {};
      
      if (section.columns) {
        section.columns.forEach(col => {
          const value = row[col.key];
          
          if (value === null || value === undefined) {
            formatted[col.label] = '';
          } else if (col.format === 'currency') {
            formatted[col.label] = formatCurrency(value);
          } else if (col.format === 'date') {
            formatted[col.label] = formatDate(value);
          } else if (col.format === 'percentage') {
            formatted[col.label] = formatPercentage(value);
          } else if (col.format === 'number') {
            formatted[col.label] = typeof value === 'number' ? value.toFixed(2) : value;
          } else {
            formatted[col.label] = value;
          }
        });
      } else {
        // No column definitions, use raw data
        Object.keys(row).forEach(key => {
          formatted[key] = row[key];
        });
      }
      
      return formatted;
    });
    
    const ws = XLSX.utils.json_to_sheet(formattedData);
    
    // Auto-size columns
    const headers = section.columns ? section.columns.map(c => c.label) : Object.keys(formattedData[0]);
    const colWidths = headers.map(header => {
      const maxLength = Math.max(
        header.length,
        ...formattedData.map(row => {
          const value = row[header];
          if (value === null || value === undefined) return 0;
          return String(value).length;
        })
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    ws['!cols'] = colWidths;
    
    const sheetName = section.title.substring(0, 31); // Excel sheet name limit
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });
  
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ============================================================================
// FORMATTED REPORT EXPORT TO CSV
// ============================================================================

export function exportFormattedReportToCSV(report: FormattedReportData, filename: string): void {
  let csvContent = '';
  
  // Add title
  csvContent += `${report.title}\n`;
  if (report.subtitle) {
    csvContent += `${report.subtitle}\n`;
  }
  csvContent += '\n';
  
  // Add each section
  report.sections.forEach((section, index) => {
    if (section.data.length === 0) return;
    
    // Section title
    csvContent += `${section.title}\n`;
    
    // Headers
    const headers = section.columns 
      ? section.columns.map(c => c.label)
      : Object.keys(section.data[0]);
    csvContent += headers.join(',') + '\n';
    
    // Data rows
    section.data.forEach(row => {
      const values = section.columns
        ? section.columns.map(col => {
            const value = row[col.key];
            
            if (value === null || value === undefined) {
              return '';
            }
            
            let formatted: any = value;
            
            if (col.format === 'currency') {
              formatted = formatCurrency(value);
            } else if (col.format === 'date') {
              formatted = formatDate(value);
            } else if (col.format === 'percentage') {
              formatted = formatPercentage(value);
            } else if (col.format === 'number') {
              formatted = typeof value === 'number' ? value.toFixed(2) : value;
            }
            
            // Escape commas
            if (typeof formatted === 'string' && formatted.includes(',')) {
              return `"${formatted}"`;
            }
            
            return formatted;
          })
        : Object.values(row).map(v => {
            if (v === null || v === undefined) return '';
            if (typeof v === 'string' && v.includes(',')) return `"${v}"`;
            if (v instanceof Date) return formatDate(v);
            return v;
          });
      
      csvContent += values.join(',') + '\n';
    });
    
    csvContent += '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// ============================================================================
// PRINT STYLES FOR PDF EXPORT
// ============================================================================

export function addPrintStyles(): void {
  // Add print-specific styles to the document
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      @page {
        size: A4;
        margin: 1cm;
      }
      
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .print\\:hidden {
        display: none !important;
      }
      
      .print\\:block {
        display: block !important;
      }
      
      .print\\:break-after {
        page-break-after: always;
      }
      
      .print\\:break-before {
        page-break-before: always;
      }
      
      .print\\:no-break {
        page-break-inside: avoid;
      }
      
      /* Ensure charts and images print correctly */
      canvas, img {
        max-width: 100%;
        page-break-inside: avoid;
      }
      
      /* Table styling for print */
      table {
        width: 100%;
        border-collapse: collapse;
      }
      
      table th,
      table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      
      table th {
        background-color: #f3f4f6;
        font-weight: bold;
      }
      
      /* Card styling for print */
      .card {
        border: 1px solid #ddd;
        margin-bottom: 1rem;
        page-break-inside: avoid;
      }
    }
  `;
  
  if (!document.getElementById('print-styles')) {
    style.id = 'print-styles';
    document.head.appendChild(style);
  }
}

// ============================================================================
// COMPANY BRANDING FOR EXPORTS
// ============================================================================

interface CompanyBranding {
  companyName: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export function addCompanyBrandingToExcel(
  wb: XLSX.WorkBook,
  branding: CompanyBranding
): void {
  // Add a cover sheet with company branding
  const coverData = [
    [branding.companyName],
    [''],
    branding.address ? ['Address:', branding.address] : [],
    branding.phone ? ['Phone:', branding.phone] : [],
    branding.email ? ['Email:', branding.email] : [],
    branding.website ? ['Website:', branding.website] : [],
    [''],
    ['Report Generated:', new Date().toLocaleString()],
  ].filter(row => row.length > 0);
  
  const ws = XLSX.utils.aoa_to_sheet(coverData);
  
  // Style the company name (first row)
  if (ws['A1']) {
    ws['A1'].s = {
      font: { bold: true, sz: 18 },
      alignment: { horizontal: 'center' }
    };
  }
  
  XLSX.utils.book_append_sheet(wb, ws, 'Cover', true);
}

// ============================================================================
// EXPORT REPORT WITH BRANDING
// ============================================================================

export function exportReportWithBranding(
  report: FormattedReportData,
  filename: string,
  branding: CompanyBranding,
  format: 'excel' | 'csv' | 'pdf' = 'excel'
): void {
  if (format === 'excel') {
    const wb = XLSX.utils.book_new();
    
    // Add company branding cover sheet
    addCompanyBrandingToExcel(wb, branding);
    
    // Add report sections
    report.sections.forEach(section => {
      if (section.data.length === 0) return;
      
      const formattedData = section.data.map(row => {
        const formatted: any = {};
        
        if (section.columns) {
          section.columns.forEach(col => {
            const value = row[col.key];
            formatted[col.label] = formatValue(value, col.format);
          });
        } else {
          Object.keys(row).forEach(key => {
            formatted[key] = row[key];
          });
        }
        
        return formatted;
      });
      
      const ws = XLSX.utils.json_to_sheet(formattedData);
      const sheetName = section.title.substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } else if (format === 'csv') {
    exportFormattedReportToCSV(report, filename);
  } else if (format === 'pdf') {
    addPrintStyles();
    exportToPDF();
  }
}

function formatValue(value: any, format?: string): any {
  if (value === null || value === undefined) return '';
  
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'date':
      return formatDate(value);
    case 'percentage':
      return formatPercentage(value);
    case 'number':
      return typeof value === 'number' ? value.toFixed(2) : value;
    default:
      return value;
  }
}
