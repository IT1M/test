// Database Operations Utilities
// Provides batch operations, pagination, and transaction helpers

import { db } from './schema';
import type { Table } from 'dexie';

/**
 * Batch operation options
 */
export interface BatchOperationOptions {
  batchSize?: number;
  onProgress?: (processed: number, total: number) => void;
  onError?: (error: Error, item: any) => void;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination result
 */
export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Batch insert items into a table
 */
export async function batchInsert<T>(
  table: Table<T, string>,
  items: T[],
  options: BatchOperationOptions = {}
): Promise<{ success: number; failed: number; errors: Error[] }> {
  const { batchSize = 100, onProgress, onError } = options;
  
  let success = 0;
  let failed = 0;
  const errors: Error[] = [];
  
  // Process in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    try {
      await db.transaction('rw', table, async () => {
        for (const item of batch) {
          try {
            await table.add(item);
            success++;
          } catch (error) {
            failed++;
            const err = error instanceof Error ? error : new Error(String(error));
            errors.push(err);
            onError?.(err, item);
          }
        }
      });
      
      onProgress?.(i + batch.length, items.length);
    } catch (error) {
      // Transaction failed
      failed += batch.length;
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push(err);
      batch.forEach(item => onError?.(err, item));
    }
  }
  
  return { success, failed, errors };
}

/**
 * Batch update items in a table
 */
export async function batchUpdate<T>(
  table: Table<T, string>,
  updates: Array<{ id: string; changes: Partial<T> }>,
  options: BatchOperationOptions = {}
): Promise<{ success: number; failed: number; errors: Error[] }> {
  const { batchSize = 100, onProgress, onError } = options;
  
  let success = 0;
  let failed = 0;
  const errors: Error[] = [];
  
  // Process in batches
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    try {
      await db.transaction('rw', table, async () => {
        for (const update of batch) {
          try {
            await table.update(update.id, update.changes as any);
            success++;
          } catch (error) {
            failed++;
            const err = error instanceof Error ? error : new Error(String(error));
            errors.push(err);
            onError?.(err, update);
          }
        }
      });
      
      onProgress?.(i + batch.length, updates.length);
    } catch (error) {
      // Transaction failed
      failed += batch.length;
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push(err);
      batch.forEach(update => onError?.(err, update));
    }
  }
  
  return { success, failed, errors };
}

/**
 * Batch delete items from a table
 */
export async function batchDelete<T>(
  table: Table<T, string>,
  ids: string[],
  options: BatchOperationOptions = {}
): Promise<{ success: number; failed: number; errors: Error[] }> {
  const { batchSize = 100, onProgress, onError } = options;
  
  let success = 0;
  let failed = 0;
  const errors: Error[] = [];
  
  // Process in batches
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    
    try {
      await db.transaction('rw', table, async () => {
        for (const id of batch) {
          try {
            await table.delete(id);
            success++;
          } catch (error) {
            failed++;
            const err = error instanceof Error ? error : new Error(String(error));
            errors.push(err);
            onError?.(err, id);
          }
        }
      });
      
      onProgress?.(i + batch.length, ids.length);
    } catch (error) {
      // Transaction failed
      failed += batch.length;
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push(err);
      batch.forEach(id => onError?.(err, id));
    }
  }
  
  return { success, failed, errors };
}

/**
 * Paginate query results
 */
export async function paginate<T>(
  collection: any,
  options: PaginationOptions
): Promise<PaginationResult<T>> {
  const { page, pageSize, sortBy, sortOrder = 'asc' } = options;
  
  // Get total count
  const total = await collection.count();
  
  // Calculate pagination
  const totalPages = Math.ceil(total / pageSize);
  const offset = (page - 1) * pageSize;
  
  // Apply sorting if specified
  let query = collection;
  if (sortBy) {
    query = sortOrder === 'desc' 
      ? query.reverse().sortBy(sortBy)
      : query.sortBy(sortBy);
  }
  
  // Get paginated data
  const allData = await query.toArray();
  const data = allData.slice(offset, offset + pageSize);
  
  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

/**
 * Execute multiple operations in a single transaction
 */
export async function executeTransaction<T>(
  tables: Table<any, string>[],
  operations: () => Promise<T>
): Promise<T> {
  return await db.transaction('rw', tables, operations);
}

/**
 * Bulk upsert (insert or update) items
 */
export async function bulkUpsert<T extends { id: string }>(
  table: Table<T, string>,
  items: T[],
  options: BatchOperationOptions = {}
): Promise<{ inserted: number; updated: number; failed: number; errors: Error[] }> {
  const { batchSize = 100, onProgress, onError } = options;
  
  let inserted = 0;
  let updated = 0;
  let failed = 0;
  const errors: Error[] = [];
  
  // Process in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    try {
      await db.transaction('rw', table, async () => {
        for (const item of batch) {
          try {
            const existing = await table.get(item.id);
            if (existing) {
              await table.update(item.id, item as any);
              updated++;
            } else {
              await table.add(item);
              inserted++;
            }
          } catch (error) {
            failed++;
            const err = error instanceof Error ? error : new Error(String(error));
            errors.push(err);
            onError?.(err, item);
          }
        }
      });
      
      onProgress?.(i + batch.length, items.length);
    } catch (error) {
      // Transaction failed
      failed += batch.length;
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push(err);
      batch.forEach(item => onError?.(err, item));
    }
  }
  
  return { inserted, updated, failed, errors };
}

/**
 * Get items by IDs in batches (optimized for large ID lists)
 */
export async function getByIds<T>(
  table: Table<T, string>,
  ids: string[],
  batchSize: number = 100
): Promise<T[]> {
  const results: T[] = [];
  
  // Process in batches to avoid memory issues
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const items = await table.where('id').anyOf(batch).toArray();
    results.push(...items);
  }
  
  return results;
}

/**
 * Count items matching a filter
 */
export async function countWhere<T>(
  table: Table<T, string>,
  filter: (item: T) => boolean
): Promise<number> {
  return await table.filter(filter).count();
}

/**
 * Check if any items match a filter
 */
export async function exists<T>(
  table: Table<T, string>,
  filter: (item: T) => boolean
): Promise<boolean> {
  const count = await table.filter(filter).limit(1).count();
  return count > 0;
}

/**
 * Get distinct values for a field
 */
export async function getDistinctValues<T>(
  table: Table<T, string>,
  field: keyof T
): Promise<any[]> {
  const items = await table.toArray();
  const values = items.map(item => item[field]);
  return Array.from(new Set(values)).filter(v => v !== undefined && v !== null);
}

/**
 * Clear all data from a table (with confirmation)
 */
export async function clearTable<T>(
  table: Table<T, string>
): Promise<number> {
  const count = await table.count();
  await table.clear();
  return count;
}

/**
 * Export table data to JSON
 */
export async function exportTableToJSON<T>(
  table: Table<T, string>
): Promise<string> {
  const data = await table.toArray();
  return JSON.stringify(data, null, 2);
}

/**
 * Import table data from JSON
 */
export async function importTableFromJSON<T>(
  table: Table<T, string>,
  jsonData: string,
  options: BatchOperationOptions = {}
): Promise<{ success: number; failed: number; errors: Error[] }> {
  const items = JSON.parse(jsonData) as T[];
  return await batchInsert(table, items, options);
}
