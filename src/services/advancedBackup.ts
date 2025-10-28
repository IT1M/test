import { prisma } from "@/services/prisma";
import { BackupType, BackupStatus } from "@prisma/client";
import { writeFile, mkdir, readFile, stat, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { createHash, createCipher, createDecipher } from "crypto";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface BackupConfig {
  enabled: boolean;
  schedule: string; // Cron expression
  retention: {
    daily: number; // Days to keep daily backups
    weekly: number; // Weeks to keep weekly backups
    monthly: number; // Months to keep monthly backups
  };
  encryption: {
    enabled: boolean;
    algorithm: string;
    key?: string;
  };
  compression: {
    enabled: boolean;
    level: number; // 1-9
  };
  incremental: {
    enabled: boolean;
    baselineFrequency: number; // Days between full backups
  };
  storage: {
    local: boolean;
    cloud?: {
      provider: 'aws' | 'gcp' | 'azure';
      bucket: string;
      region: string;
    };
  };
  testing: {
    enabled: boolean;
    frequency: number; // Hours between tests
  };
}

export interface BackupMetadata {
  id: string;
  type: 'full' | 'incremental';
  timestamp: Date;
  recordCount: number;
  fileSize: number;
  checksum: string;
  encrypted: boolean;
  compressed: boolean;
  baselineId?: string; // For incremental backups
  dependencies?: string[]; // Other backup IDs needed for restore
}

export interface IncrementalBackupData {
  baselineId: string;
  changes: {
    created: any[];
    updated: any[];
    deleted: string[];
  };
  metadata: {
    fromTimestamp: Date;
    toTimestamp: Date;
    changeCount: number;
  };
}

export class AdvancedBackupService {
  private config: BackupConfig;
  private backupDir: string;

  constructor(config?: Partial<BackupConfig>) {
    this.config = {
      enabled: true,
      schedule: '0 2 * * *', // Daily at 2 AM
      retention: {
        daily: 30,
        weekly: 12,
        monthly: 12
      },
      encryption: {
        enabled: true,
        algorithm: 'aes-256-cbc'
      },
      compression: {
        enabled: true,
        level: 6
      },
      incremental: {
        enabled: true,
        baselineFrequency: 7 // Weekly full backups
      },
      storage: {
        local: true
      },
      testing: {
        enabled: true,
        frequency: 24 // Test every 24 hours
      },
      ...config
    };

    this.backupDir = join(process.cwd(), 'backups', 'advanced');
  }

  /**
   * Create a full backup of all inventory data
   */
  async createFullBackup(userId: string, fileType: BackupType = 'JSON'): Promise<BackupMetadata> {
    try {
      await this.ensureBackupDirectory();

      // Fetch all inventory items with related data
      const items = await prisma.inventoryItem.findMany({
        include: {
          enteredBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const timestamp = new Date();
      const backupId = `full_${timestamp.toISOString().replace(/[:.]/g, '-')}`;
      
      // Generate backup content
      const content = this.generateBackupContent(items, fileType, {
        type: 'full',
        timestamp,
        recordCount: items.length
      });

      // Create backup file
      const fileName = `${backupId}.${fileType.toLowerCase()}`;
      let filePath = join(this.backupDir, fileName);

      // Compress if enabled
      if (this.config.compression.enabled) {
        const compressedContent = await this.compressData(content);
        await writeFile(filePath + '.gz', compressedContent);
        filePath = filePath + '.gz';
      } else {
        await writeFile(filePath, content);
      }

      // Encrypt if enabled
      if (this.config.encryption.enabled) {
        const encryptedContent = await this.encryptFile(filePath);
        await unlink(filePath); // Remove unencrypted file
        filePath = filePath + '.enc';
        await writeFile(filePath, encryptedContent);
      }

      // Calculate file size and checksum
      const stats = await stat(filePath);
      const checksum = await this.calculateChecksum(filePath);

      // Create backup record in database
      const backup = await prisma.backup.create({
        data: {
          fileName,
          fileSize: stats.size,
          fileType,
          recordCount: items.length,
          storagePath: filePath,
          status: BackupStatus.COMPLETED,
          createdById: userId,
        },
      });

      const metadata: BackupMetadata = {
        id: backup.id,
        type: 'full',
        timestamp,
        recordCount: items.length,
        fileSize: stats.size,
        checksum,
        encrypted: this.config.encryption.enabled,
        compressed: this.config.compression.enabled,
      };

      // Store metadata
      await this.storeBackupMetadata(backup.id, metadata);

      // Upload to cloud if configured
      if (this.config.storage.cloud) {
        await this.uploadToCloud(filePath, fileName);
      }

      return metadata;
    } catch (error) {
      console.error('Error creating full backup:', error);
      throw new Error(`Failed to create full backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create an incremental backup containing only changes since the last backup
   */
  async createIncrementalBackup(userId: string, fileType: BackupType = 'JSON'): Promise<BackupMetadata> {
    try {
      if (!this.config.incremental.enabled) {
        throw new Error('Incremental backups are disabled');
      }

      // Find the most recent baseline (full backup)
      const baseline = await this.findMostRecentBaseline();
      if (!baseline) {
        // No baseline found, create a full backup instead
        return this.createFullBackup(userId, fileType);
      }

      const baselineMetadata = await this.getBackupMetadata(baseline.id);
      const lastBackupTime = baselineMetadata.timestamp;

      // Get changes since last backup
      const changes = await this.getChangesSince(lastBackupTime);
      
      if (changes.created.length === 0 && changes.updated.length === 0 && changes.deleted.length === 0) {
        throw new Error('No changes found since last backup');
      }

      const timestamp = new Date();
      const backupId = `incr_${timestamp.toISOString().replace(/[:.]/g, '-')}`;

      // Create incremental backup data
      const incrementalData: IncrementalBackupData = {
        baselineId: baseline.id,
        changes,
        metadata: {
          fromTimestamp: lastBackupTime,
          toTimestamp: timestamp,
          changeCount: changes.created.length + changes.updated.length + changes.deleted.length
        }
      };

      const content = JSON.stringify(incrementalData, null, 2);
      const fileName = `${backupId}.json`;
      let filePath = join(this.backupDir, fileName);

      // Compress and encrypt as configured
      if (this.config.compression.enabled) {
        const compressedContent = await this.compressData(content);
        await writeFile(filePath + '.gz', compressedContent);
        filePath = filePath + '.gz';
      } else {
        await writeFile(filePath, content);
      }

      if (this.config.encryption.enabled) {
        const encryptedContent = await this.encryptFile(filePath);
        await unlink(filePath);
        filePath = filePath + '.enc';
        await writeFile(filePath, encryptedContent);
      }

      const stats = await stat(filePath);
      const checksum = await this.calculateChecksum(filePath);

      // Create backup record
      const backup = await prisma.backup.create({
        data: {
          fileName,
          fileSize: stats.size,
          fileType,
          recordCount: incrementalData.metadata.changeCount,
          storagePath: filePath,
          status: BackupStatus.COMPLETED,
          createdById: userId,
        },
      });

      const metadata: BackupMetadata = {
        id: backup.id,
        type: 'incremental',
        timestamp,
        recordCount: incrementalData.metadata.changeCount,
        fileSize: stats.size,
        checksum,
        encrypted: this.config.encryption.enabled,
        compressed: this.config.compression.enabled,
        baselineId: baseline.id,
        dependencies: [baseline.id]
      };

      await this.storeBackupMetadata(backup.id, metadata);

      if (this.config.storage.cloud) {
        await this.uploadToCloud(filePath, fileName);
      }

      return metadata;
    } catch (error) {
      console.error('Error creating incremental backup:', error);
      throw new Error(`Failed to create incremental backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test backup integrity and restorability
   */
  async testBackup(backupId: string): Promise<{
    success: boolean;
    tests: {
      fileExists: boolean;
      checksumValid: boolean;
      decryptable: boolean;
      decompressible: boolean;
      parseable: boolean;
      restorable: boolean;
    };
    errors: string[];
  }> {
    const errors: string[] = [];
    const tests = {
      fileExists: false,
      checksumValid: false,
      decryptable: false,
      decompressible: false,
      parseable: false,
      restorable: false
    };

    try {
      // Get backup metadata
      const metadata = await this.getBackupMetadata(backupId);
      const backup = await prisma.backup.findUnique({
        where: { id: backupId }
      });

      if (!backup) {
        errors.push('Backup record not found in database');
        return { success: false, tests, errors };
      }

      // Test 1: File exists
      tests.fileExists = existsSync(backup.storagePath);
      if (!tests.fileExists) {
        errors.push('Backup file does not exist on disk');
        return { success: false, tests, errors };
      }

      // Test 2: Checksum validation
      const currentChecksum = await this.calculateChecksum(backup.storagePath);
      tests.checksumValid = currentChecksum === metadata.checksum;
      if (!tests.checksumValid) {
        errors.push('Backup file checksum mismatch - file may be corrupted');
      }

      // Test 3: Decryption (if encrypted)
      let testFilePath = backup.storagePath;
      if (metadata.encrypted) {
        try {
          const decryptedContent = await this.decryptFile(backup.storagePath);
          const tempPath = join(this.backupDir, `test_${backupId}_decrypted`);
          await writeFile(tempPath, decryptedContent);
          testFilePath = tempPath;
          tests.decryptable = true;
        } catch (error) {
          errors.push(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        tests.decryptable = true;
      }

      // Test 4: Decompression (if compressed)
      if (metadata.compressed && tests.decryptable) {
        try {
          const decompressedContent = await this.decompressData(await readFile(testFilePath));
          const tempPath = join(this.backupDir, `test_${backupId}_decompressed`);
          await writeFile(tempPath, decompressedContent);
          testFilePath = tempPath;
          tests.decompressible = true;
        } catch (error) {
          errors.push(`Decompression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        tests.decompressible = true;
      }

      // Test 5: Parse content
      if (tests.decryptable && tests.decompressible) {
        try {
          const content = await readFile(testFilePath, 'utf-8');
          
          if (metadata.type === 'incremental') {
            const incrementalData = JSON.parse(content) as IncrementalBackupData;
            if (!incrementalData.baselineId || !incrementalData.changes) {
              throw new Error('Invalid incremental backup structure');
            }
          } else {
            // For full backups, try to parse based on file type
            if (backup.fileType === 'JSON') {
              const data = JSON.parse(content);
              if (!data.data || !Array.isArray(data.data)) {
                throw new Error('Invalid JSON backup structure');
              }
            }
          }
          
          tests.parseable = true;
        } catch (error) {
          errors.push(`Content parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Test 6: Restore simulation (dry run)
      if (tests.parseable) {
        try {
          await this.simulateRestore(backupId);
          tests.restorable = true;
        } catch (error) {
          errors.push(`Restore simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Clean up temporary files
      const tempFiles = [
        join(this.backupDir, `test_${backupId}_decrypted`),
        join(this.backupDir, `test_${backupId}_decompressed`)
      ];
      
      for (const tempFile of tempFiles) {
        if (existsSync(tempFile)) {
          await unlink(tempFile);
        }
      }

      const success = Object.values(tests).every(test => test === true);
      return { success, tests, errors };

    } catch (error) {
      errors.push(`Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, tests, errors };
    }
  }

  /**
   * Schedule automated backups
   */
  async scheduleBackups(): Promise<void> {
    if (!this.config.enabled) {
      console.log('Automated backups are disabled');
      return;
    }

    // This would typically integrate with a job scheduler like Bull or node-cron
    // For now, we'll create a method that can be called by external schedulers
    console.log(`Backup scheduling configured: ${this.config.schedule}`);
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<{
    deleted: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let deleted = 0;

    try {
      const now = new Date();
      const retention = this.config.retention;

      // Calculate cutoff dates
      const dailyCutoff = new Date(now.getTime() - retention.daily * 24 * 60 * 60 * 1000);
      const weeklyCutoff = new Date(now.getTime() - retention.weekly * 7 * 24 * 60 * 60 * 1000);
      const monthlyCutoff = new Date(now.getTime() - retention.monthly * 30 * 24 * 60 * 60 * 1000);

      // Get all backups older than daily retention
      const oldBackups = await prisma.backup.findMany({
        where: {
          createdAt: {
            lt: dailyCutoff
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      for (const backup of oldBackups) {
        const backupDate = new Date(backup.createdAt);
        const dayOfWeek = backupDate.getDay();
        const dayOfMonth = backupDate.getDate();

        let shouldKeep = false;

        // Keep weekly backups (Sunday backups)
        if (dayOfWeek === 0 && backupDate >= weeklyCutoff) {
          shouldKeep = true;
        }

        // Keep monthly backups (first of month)
        if (dayOfMonth === 1 && backupDate >= monthlyCutoff) {
          shouldKeep = true;
        }

        if (!shouldKeep) {
          try {
            // Delete physical file
            if (existsSync(backup.storagePath)) {
              await unlink(backup.storagePath);
            }

            // Delete metadata file
            const metadataPath = join(this.backupDir, 'metadata', `${backup.id}.json`);
            if (existsSync(metadataPath)) {
              await unlink(metadataPath);
            }

            // Delete database record
            await prisma.backup.delete({
              where: { id: backup.id }
            });

            deleted++;
          } catch (error) {
            errors.push(`Failed to delete backup ${backup.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      return { deleted, errors };
    } catch (error) {
      errors.push(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { deleted, errors };
    }
  }

  // Private helper methods

  private async ensureBackupDirectory(): Promise<void> {
    if (!existsSync(this.backupDir)) {
      await mkdir(this.backupDir, { recursive: true });
    }

    const metadataDir = join(this.backupDir, 'metadata');
    if (!existsSync(metadataDir)) {
      await mkdir(metadataDir, { recursive: true });
    }
  }

  private generateBackupContent(items: any[], fileType: BackupType, metadata: any): string {
    switch (fileType) {
      case 'JSON':
        return JSON.stringify({
          version: '2.0',
          timestamp: metadata.timestamp.toISOString(),
          type: metadata.type,
          recordCount: metadata.recordCount,
          data: items.map(item => ({
            id: item.id,
            itemName: item.itemName,
            batch: item.batch,
            quantity: item.quantity,
            reject: item.reject,
            destination: item.destination,
            category: item.category,
            notes: item.notes,
            enteredBy: {
              id: item.enteredBy.id,
              name: item.enteredBy.name,
              email: item.enteredBy.email,
            },
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
          }))
        }, null, 2);

      case 'CSV':
        const headers = [
          'ID', 'Item Name', 'Batch', 'Quantity', 'Reject',
          'Destination', 'Category', 'Notes', 'Entered By',
          'Created At', 'Updated At'
        ];

        const rows = items.map(item => [
          item.id,
          `"${item.itemName.replace(/"/g, '""')}"`,
          item.batch,
          item.quantity,
          item.reject,
          item.destination,
          item.category || '',
          item.notes ? `"${item.notes.replace(/"/g, '""')}"` : '',
          item.enteredBy.name,
          item.createdAt.toISOString(),
          item.updatedAt.toISOString(),
        ]);

        return '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

      case 'SQL':
        const sqlStatements = [
          '-- Advanced Backup System Export',
          `-- Generated: ${metadata.timestamp.toISOString()}`,
          `-- Type: ${metadata.type}`,
          `-- Record Count: ${metadata.recordCount}`,
          '',
          'BEGIN TRANSACTION;',
          ''
        ];

        items.forEach(item => {
          const values = [
            `'${item.id}'`,
            `'${item.itemName.replace(/'/g, "''")}'`,
            `'${item.batch}'`,
            item.quantity,
            item.reject,
            `'${item.destination}'`,
            item.category ? `'${item.category.replace(/'/g, "''")}'` : 'NULL',
            item.notes ? `'${item.notes.replace(/'/g, "''")}'` : 'NULL',
            `'${item.enteredById}'`,
            `'${item.createdAt.toISOString()}'`,
            `'${item.updatedAt.toISOString()}'`
          ];

          sqlStatements.push(
            `INSERT INTO "InventoryItem" ("id", "itemName", "batch", "quantity", "reject", "destination", "category", "notes", "enteredById", "createdAt", "updatedAt") VALUES (${values.join(', ')});`
          );
        });

        sqlStatements.push('', 'COMMIT;');
        return sqlStatements.join('\n');

      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private async compressData(data: string): Promise<Buffer> {
    const zlib = await import('zlib');
    return new Promise((resolve, reject) => {
      zlib.gzip(Buffer.from(data), { level: this.config.compression.level }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  private async decompressData(data: Buffer): Promise<string> {
    const zlib = await import('zlib');
    return new Promise((resolve, reject) => {
      zlib.gunzip(data, (err, result) => {
        if (err) reject(err);
        else resolve(result.toString());
      });
    });
  }

  private async encryptFile(filePath: string): Promise<Buffer> {
    const content = await readFile(filePath);
    const key = this.config.encryption.key || process.env.BACKUP_ENCRYPTION_KEY || 'default-key-change-in-production';
    const cipher = createCipher(this.config.encryption.algorithm, key);
    
    return Buffer.concat([
      cipher.update(content),
      cipher.final()
    ]);
  }

  private async decryptFile(filePath: string): Promise<Buffer> {
    const content = await readFile(filePath);
    const key = this.config.encryption.key || process.env.BACKUP_ENCRYPTION_KEY || 'default-key-change-in-production';
    const decipher = createDecipher(this.config.encryption.algorithm, key);
    
    return Buffer.concat([
      decipher.update(content),
      decipher.final()
    ]);
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const content = await readFile(filePath);
    return createHash('sha256').update(content).digest('hex');
  }

  private async storeBackupMetadata(backupId: string, metadata: BackupMetadata): Promise<void> {
    const metadataPath = join(this.backupDir, 'metadata', `${backupId}.json`);
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  private async getBackupMetadata(backupId: string): Promise<BackupMetadata> {
    const metadataPath = join(this.backupDir, 'metadata', `${backupId}.json`);
    const content = await readFile(metadataPath, 'utf-8');
    return JSON.parse(content);
  }

  private async findMostRecentBaseline(): Promise<any> {
    return prisma.backup.findFirst({
      where: {
        status: BackupStatus.COMPLETED
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  private async getChangesSince(timestamp: Date): Promise<{
    created: any[];
    updated: any[];
    deleted: string[];
  }> {
    // Get items created since timestamp
    const created = await prisma.inventoryItem.findMany({
      where: {
        createdAt: {
          gt: timestamp
        }
      },
      include: {
        enteredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Get items updated since timestamp (but not created)
    const updated = await prisma.inventoryItem.findMany({
      where: {
        updatedAt: {
          gt: timestamp
        },
        createdAt: {
          lte: timestamp
        }
      },
      include: {
        enteredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // For deleted items, we would need to track deletions in an audit log
    // For now, return empty array
    const deleted: string[] = [];

    return { created, updated, deleted };
  }

  private async simulateRestore(backupId: string): Promise<void> {
    // This would perform a dry-run restore to validate the backup
    // For now, we'll just validate that we can read and parse the backup
    const metadata = await this.getBackupMetadata(backupId);
    const backup = await prisma.backup.findUnique({
      where: { id: backupId }
    });

    if (!backup) {
      throw new Error('Backup not found');
    }

    // Read and validate backup content without actually restoring
    let content = await readFile(backup.storagePath);
    
    if (metadata.encrypted) {
      content = await this.decryptFile(backup.storagePath);
    }

    if (metadata.compressed) {
      const contentStr = await this.decompressData(content);
      content = Buffer.from(contentStr);
    }

    // Parse content to ensure it's valid
    const contentStr = content.toString();
    
    if (metadata.type === 'incremental') {
      const incrementalData = JSON.parse(contentStr) as IncrementalBackupData;
      if (!incrementalData.baselineId || !incrementalData.changes) {
        throw new Error('Invalid incremental backup structure');
      }
    } else {
      if (backup.fileType === 'JSON') {
        const data = JSON.parse(contentStr);
        if (!data.data || !Array.isArray(data.data)) {
          throw new Error('Invalid JSON backup structure');
        }
      }
    }
  }

  private async uploadToCloud(filePath: string, fileName: string): Promise<void> {
    // This would implement cloud storage upload
    // Implementation depends on the cloud provider
    console.log(`Would upload ${fileName} to cloud storage`);
  }
}

// Export singleton instance
export const advancedBackupService = new AdvancedBackupService();