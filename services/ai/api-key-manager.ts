// Secure API Key Management Service
// Handles encrypted storage and rotation reminders for API keys

import { DataEncryption } from '@/lib/security/encryption';
import { db } from '@/lib/db/schema';
import { generateId } from '@/lib/utils/generators';

export interface APIKey {
  id: string;
  name: string;
  service: string;
  encryptedKey: string;
  createdAt: Date;
  lastRotated: Date;
  rotationIntervalDays: number;
  nextRotationDue: Date;
  isActive: boolean;
  lastUsed?: Date;
  usageCount: number;
  createdBy: string;
  metadata?: Record<string, any>;
}

export interface APIKeyRotationReminder {
  keyId: string;
  keyName: string;
  service: string;
  daysUntilRotation: number;
  severity: 'info' | 'warning' | 'critical';
}

export class APIKeyManager {
  private static readonly DEFAULT_ROTATION_DAYS = 90;
  private static readonly WARNING_THRESHOLD_DAYS = 14;
  private static readonly CRITICAL_THRESHOLD_DAYS = 7;
  
  /**
   * Store API key securely
   */
  static async storeAPIKey(
    name: string,
    service: string,
    apiKey: string,
    rotationIntervalDays: number = this.DEFAULT_ROTATION_DAYS,
    createdBy: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const id = generateId();
    const now = new Date();
    const nextRotationDue = new Date(now.getTime() + rotationIntervalDays * 24 * 60 * 60 * 1000);
    
    // Encrypt the API key
    const encryptedKey = DataEncryption.encryptString(apiKey);
    
    const keyRecord: APIKey = {
      id,
      name,
      service,
      encryptedKey,
      createdAt: now,
      lastRotated: now,
      rotationIntervalDays,
      nextRotationDue,
      isActive: true,
      usageCount: 0,
      createdBy,
      metadata,
    };
    
    // Store in database (using systemLogs as placeholder - in production use dedicated table)
    await db.systemLogs.add({
      id,
      timestamp: now,
      level: 'info',
      category: 'api_key_management',
      message: `API key stored: ${name}`,
      details: keyRecord,
      userId: createdBy,
      createdAt: now,
    });
    
    return id;
  }
  
  /**
   * Retrieve and decrypt API key
   */
  static async getAPIKey(keyId: string): Promise<string | null> {
    try {
      const record = await db.systemLogs.get(keyId);
      
      if (!record || record.category !== 'api_key_management') {
        return null;
      }
      
      const keyData = record.details as APIKey;
      
      if (!keyData.isActive) {
        throw new Error('API key is inactive');
      }
      
      // Update usage tracking
      await this.trackKeyUsage(keyId);
      
      // Decrypt and return
      return DataEncryption.decryptString(keyData.encryptedKey);
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      return null;
    }
  }
  
  /**
   * Rotate API key
   */
  static async rotateAPIKey(
    keyId: string,
    newApiKey: string,
    rotatedBy: string
  ): Promise<void> {
    const record = await db.systemLogs.get(keyId);
    
    if (!record || record.category !== 'api_key_management') {
      throw new Error('API key not found');
    }
    
    const keyData = record.details as APIKey;
    const now = new Date();
    const nextRotationDue = new Date(now.getTime() + keyData.rotationIntervalDays * 24 * 60 * 60 * 1000);
    
    // Encrypt new key
    const encryptedKey = DataEncryption.encryptString(newApiKey);
    
    // Update record
    const updatedKeyData: APIKey = {
      ...keyData,
      encryptedKey,
      lastRotated: now,
      nextRotationDue,
    };
    
    await db.systemLogs.update(keyId, {
      details: updatedKeyData,
      message: `API key rotated: ${keyData.name}`,
    });
    
    // Log rotation event
    await db.systemLogs.add({
      id: generateId(),
      timestamp: now,
      level: 'info',
      category: 'api_key_rotation',
      message: `API key rotated: ${keyData.name}`,
      details: {
        keyId,
        keyName: keyData.name,
        service: keyData.service,
        rotatedBy,
      },
      userId: rotatedBy,
      createdAt: now,
    });
  }
  
  /**
   * Deactivate API key
   */
  static async deactivateAPIKey(keyId: string, deactivatedBy: string): Promise<void> {
    const record = await db.systemLogs.get(keyId);
    
    if (!record || record.category !== 'api_key_management') {
      throw new Error('API key not found');
    }
    
    const keyData = record.details as APIKey;
    
    await db.systemLogs.update(keyId, {
      details: {
        ...keyData,
        isActive: false,
      },
      message: `API key deactivated: ${keyData.name}`,
    });
    
    // Log deactivation
    await db.systemLogs.add({
      id: generateId(),
      timestamp: new Date(),
      level: 'warning',
      category: 'api_key_deactivation',
      message: `API key deactivated: ${keyData.name}`,
      details: {
        keyId,
        keyName: keyData.name,
        service: keyData.service,
        deactivatedBy,
      },
      userId: deactivatedBy,
      createdAt: new Date(),
    });
  }
  
  /**
   * Get rotation reminders
   */
  static async getRotationReminders(): Promise<APIKeyRotationReminder[]> {
    const now = new Date();
    const reminders: APIKeyRotationReminder[] = [];
    
    // Get all API key records
    const records = await db.systemLogs
      .where('category')
      .equals('api_key_management')
      .toArray();
    
    for (const record of records) {
      const keyData = record.details as APIKey;
      
      if (!keyData.isActive) continue;
      
      const daysUntilRotation = Math.ceil(
        (keyData.nextRotationDue.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );
      
      let severity: 'info' | 'warning' | 'critical' = 'info';
      
      if (daysUntilRotation <= 0) {
        severity = 'critical';
      } else if (daysUntilRotation <= this.CRITICAL_THRESHOLD_DAYS) {
        severity = 'critical';
      } else if (daysUntilRotation <= this.WARNING_THRESHOLD_DAYS) {
        severity = 'warning';
      }
      
      if (severity !== 'info' || daysUntilRotation <= 30) {
        reminders.push({
          keyId: keyData.id,
          keyName: keyData.name,
          service: keyData.service,
          daysUntilRotation,
          severity,
        });
      }
    }
    
    return reminders.sort((a, b) => a.daysUntilRotation - b.daysUntilRotation);
  }
  
  /**
   * List all API keys (without decrypting)
   */
  static async listAPIKeys(): Promise<Omit<APIKey, 'encryptedKey'>[]> {
    const records = await db.systemLogs
      .where('category')
      .equals('api_key_management')
      .toArray();
    
    return records.map(record => {
      const keyData = record.details as APIKey;
      const { encryptedKey, ...safeData } = keyData;
      return safeData;
    });
  }
  
  /**
   * Track API key usage
   */
  private static async trackKeyUsage(keyId: string): Promise<void> {
    const record = await db.systemLogs.get(keyId);
    
    if (!record || record.category !== 'api_key_management') {
      return;
    }
    
    const keyData = record.details as APIKey;
    
    await db.systemLogs.update(keyId, {
      details: {
        ...keyData,
        lastUsed: new Date(),
        usageCount: keyData.usageCount + 1,
      },
    });
  }
  
  /**
   * Get API key statistics
   */
  static async getKeyStatistics(keyId: string): Promise<{
    usageCount: number;
    lastUsed?: Date;
    daysUntilRotation: number;
    isOverdue: boolean;
  } | null> {
    const record = await db.systemLogs.get(keyId);
    
    if (!record || record.category !== 'api_key_management') {
      return null;
    }
    
    const keyData = record.details as APIKey;
    const now = new Date();
    const daysUntilRotation = Math.ceil(
      (keyData.nextRotationDue.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );
    
    return {
      usageCount: keyData.usageCount,
      lastUsed: keyData.lastUsed,
      daysUntilRotation,
      isOverdue: daysUntilRotation <= 0,
    };
  }
  
  /**
   * Validate API key format
   */
  static validateKeyFormat(apiKey: string, service: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!apiKey || apiKey.trim().length === 0) {
      errors.push('API key cannot be empty');
    }
    
    if (apiKey.length < 20) {
      errors.push('API key seems too short');
    }
    
    // Service-specific validation
    if (service === 'gemini' && !apiKey.startsWith('AI')) {
      errors.push('Gemini API keys typically start with "AI"');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
