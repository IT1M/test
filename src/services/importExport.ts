import * as XLSX from 'xlsx';
import { prisma } from './prisma';
import { Destination } from '@prisma/client';
import { z } from 'zod';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  data?: any[];
}

export interface ExportOptions {
  format: 'excel' | 'csv' | 'json' | 'pdf';
  filters?: any;
  columns?: string[];
  includeMetadata?: boolean;
}

const inventoryItemSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  batch: z.string().min(1, 'Batch is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  reject: z.number().int().min(0, 'Reject cannot be negative').default(0),
  destination: z.enum(['MAIS', 'FOZAN'], { errorMap: () => ({ message: 'Destination must be MAIS or FOZAN' }) }),
  category: z.string().optional(),
  notes: z.string().optional(),
});

export class ImportExportService {
  /**
   * Parse Excel/CSV file for import
   */
  async parseFile(buffer: Buffer, fileType: 'excel' | 'csv'): Promise<any[]> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const data = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: null,
      });

      return data;
    } catch (error: any) {
      throw new Error(`Failed to parse file: ${error.message}`);
    }
  }

  /**
   * Validate and transform import data
   */
  validateImportData(data: any[]): {
    valid: any[];
    invalid: Array<{ row: number; error: string; data: any }>;
  } {
    const valid: any[] = [];
    const invalid: Array<{ row: number; error: string; data: any }> = [];

    data.forEach((row, index) => {
      try {
        // Normalize column names (handle different cases and Arabic)
        const normalized: any = {};
        Object.keys(row).forEach(key => {
          const lowerKey = key.toLowerCase().trim();
          if (lowerKey.includes('item') || lowerKey.includes('اسم')) {
            normalized.itemName = row[key];
          } else if (lowerKey.includes('batch') || lowerKey.includes('دفعة')) {
            normalized.batch = row[key];
          } else if (lowerKey.includes('quantity') || lowerKey.includes('كمية')) {
            normalized.quantity = parseInt(row[key]);
          } else if (lowerKey.includes('reject') || lowerKey.includes('مرفوض')) {
            normalized.reject = parseInt(row[key]) || 0;
          } else if (lowerKey.includes('destination') || lowerKey.includes('وجهة')) {
            const dest = row[key]?.toString().toUpperCase();
            normalized.destination = dest === 'MAIS' || dest === 'ميس' ? 'MAIS' : 'FOZAN';
          } else if (lowerKey.includes('category') || lowerKey.includes('فئة')) {
            normalized.category = row[key];
          } else if (lowerKey.includes('notes') || lowerKey.includes('ملاحظات')) {
            normalized.notes = row[key];
          }
        });

        const validated = inventoryItemSchema.parse(normalized);
        valid.push(validated);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          invalid.push({
            row: index + 2, // +2 because Excel rows start at 1 and we have header
            error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
            data: row,
          });
        } else {
          invalid.push({
            row: index + 2,
            error: error.message,
            data: row,
          });
        }
      }
    });

    return { valid, invalid };
  }

  /**
   * Import inventory items in batches
   */
  async importInventoryItems(
    data: any[],
    userId: string,
    batchSize: number = 100
  ): Promise<ImportResult> {
    const { valid, invalid } = this.validateImportData(data);
    
    let imported = 0;
    const errors = [...invalid];

    // Process in batches
    for (let i = 0; i < valid.length; i += batchSize) {
      const batch = valid.slice(i, i + batchSize);
      
      try {
        await prisma.$transaction(async (tx) => {
          const items = await tx.inventoryItem.createMany({
            data: batch.map(item => ({
              ...item,
              enteredById: userId,
            })),
            skipDuplicates: false,
          });

          imported += items.count;

          // Create audit log for bulk import
          await tx.auditLog.create({
            data: {
              userId,
              action: 'BULK_IMPORT',
              entityType: 'InventoryItem',
              newValue: { count: items.count, batch: i / batchSize + 1 },
            },
          });
        });
      } catch (error: any) {
        // If batch fails, try items individually
        for (let j = 0; j < batch.length; j++) {
          try {
            await prisma.inventoryItem.create({
              data: {
                ...batch[j],
                enteredById: userId,
              },
            });
            imported++;
          } catch (itemError: any) {
            errors.push({
              row: i + j + 2,
              error: itemError.message,
              data: batch[j],
            });
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      imported,
      failed: errors.length,
      errors,
    };
  }

  /**
   * Export inventory items to Excel
   */
  async exportToExcel(filters?: any, columns?: string[]): Promise<Buffer> {
    const items = await this.fetchInventoryItems(filters);
    
    const data = items.map(item => ({
      'Item Name': item.itemName,
      'Batch': item.batch,
      'Quantity': item.quantity,
      'Reject': item.reject,
      'Destination': item.destination,
      'Category': item.category || '',
      'Notes': item.notes || '',
      'Entered By': item.enteredBy.name,
      'Created At': new Date(item.createdAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

    // Add column widths
    worksheet['!cols'] = [
      { wch: 30 }, // Item Name
      { wch: 15 }, // Batch
      { wch: 10 }, // Quantity
      { wch: 10 }, // Reject
      { wch: 12 }, // Destination
      { wch: 15 }, // Category
      { wch: 30 }, // Notes
      { wch: 20 }, // Entered By
      { wch: 20 }, // Created At
    ];

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Export inventory items to CSV
   */
  async exportToCSV(filters?: any): Promise<string> {
    const items = await this.fetchInventoryItems(filters);
    
    const data = items.map(item => ({
      'Item Name': item.itemName,
      'Batch': item.batch,
      'Quantity': item.quantity,
      'Reject': item.reject,
      'Destination': item.destination,
      'Category': item.category || '',
      'Notes': item.notes || '',
      'Entered By': item.enteredBy.name,
      'Created At': new Date(item.createdAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    return XLSX.utils.sheet_to_csv(worksheet);
  }

  /**
   * Export inventory items to JSON
   */
  async exportToJSON(filters?: any, includeMetadata: boolean = false): Promise<any> {
    const items = await this.fetchInventoryItems(filters);
    
    if (includeMetadata) {
      return {
        metadata: {
          exportDate: new Date().toISOString(),
          totalItems: items.length,
          filters,
        },
        data: items,
      };
    }

    return items;
  }

  /**
   * Export inventory items to PDF
   */
  async exportToPDF(filters?: any): Promise<Buffer> {
    const items = await this.fetchInventoryItems(filters);
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Inventory Report', 14, 20);
    
    // Add metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Items: ${items.length}`, 14, 36);
    
    // Add table
    autoTable(doc, {
      startY: 45,
      head: [['Item Name', 'Batch', 'Qty', 'Reject', 'Destination', 'Category']],
      body: items.map(item => [
        item.itemName,
        item.batch,
        item.quantity.toString(),
        item.reject.toString(),
        item.destination,
        item.category || '',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [14, 165, 233] }, // Primary blue
    });

    return Buffer.from(doc.output('arraybuffer'));
  }

  /**
   * Fetch inventory items with filters
   */
  private async fetchInventoryItems(filters?: any) {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { itemName: { contains: filters.search, mode: 'insensitive' } },
        { batch: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.destination) {
      where.destination = filters.destination;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    return prisma.inventoryItem.findMany({
      where,
      include: {
        enteredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Generate import template
   */
  generateImportTemplate(): Buffer {
    const template = [
      {
        'Item Name': 'Example Item',
        'Batch': 'BATCH001',
        'Quantity': 100,
        'Reject': 5,
        'Destination': 'MAIS',
        'Category': 'Medical Supplies',
        'Notes': 'Optional notes',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    // Add instructions sheet
    const instructions = [
      { Field: 'Item Name', Required: 'Yes', Description: 'Name of the inventory item' },
      { Field: 'Batch', Required: 'Yes', Description: 'Batch number' },
      { Field: 'Quantity', Required: 'Yes', Description: 'Quantity (positive integer)' },
      { Field: 'Reject', Required: 'No', Description: 'Rejected quantity (default: 0)' },
      { Field: 'Destination', Required: 'Yes', Description: 'MAIS or FOZAN' },
      { Field: 'Category', Required: 'No', Description: 'Item category' },
      { Field: 'Notes', Required: 'No', Description: 'Additional notes' },
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

export const importExportService = new ImportExportService();
