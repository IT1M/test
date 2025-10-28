import { prisma } from './prisma';
import crypto from 'crypto';

export interface ApiKeyPermission {
  resource: string;
  actions: ('read' | 'write' | 'delete')[];
}

export interface CreateApiKeyParams {
  name: string;
  userId: string;
  permissions: ApiKeyPermission[];
  rateLimit?: number;
  expiresAt?: Date;
}

export class ApiKeyManagementService {
  /**
   * Generate a secure API key
   */
  private generateApiKey(): string {
    const prefix = 'sk_live_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}${randomBytes}`;
  }

  /**
   * Create a new API key
   */
  async createApiKey(params: CreateApiKeyParams) {
    const key = this.generateApiKey();
    
    const apiKey = await prisma.apiKey.create({
      data: {
        name: params.name,
        key,
        userId: params.userId,
        permissions: params.permissions,
        rateLimit: params.rateLimit || 1000,
        expiresAt: params.expiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return apiKey;
  }

  /**
   * Validate an API key
   */
  async validateApiKey(key: string) {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!apiKey) {
      return { valid: false, error: 'Invalid API key' };
    }

    if (!apiKey.isActive) {
      return { valid: false, error: 'API key is inactive' };
    }

    if (!apiKey.user.isActive) {
      return { valid: false, error: 'User account is inactive' };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false, error: 'API key has expired' };
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      valid: true,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        permissions: apiKey.permissions as ApiKeyPermission[],
        rateLimit: apiKey.rateLimit,
        user: apiKey.user,
      },
    };
  }

  /**
   * Check if API key has permission for a resource and action
   */
  hasPermission(
    permissions: ApiKeyPermission[],
    resource: string,
    action: 'read' | 'write' | 'delete'
  ): boolean {
    return permissions.some(
      (perm) =>
        (perm.resource === resource || perm.resource === '*') &&
        (perm.actions.includes(action) || perm.actions.includes('*' as any))
    );
  }

  /**
   * List API keys for a user
   */
  async listApiKeys(userId: string) {
    return prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        key: true,
        permissions: true,
        rateLimit: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(id: string, userId: string) {
    return prisma.apiKey.update({
      where: { id, userId },
      data: { isActive: false },
    });
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(id: string, userId: string) {
    return prisma.apiKey.delete({
      where: { id, userId },
    });
  }

  /**
   * Update API key
   */
  async updateApiKey(
    id: string,
    userId: string,
    data: {
      name?: string;
      permissions?: ApiKeyPermission[];
      rateLimit?: number;
      expiresAt?: Date;
    }
  ) {
    return prisma.apiKey.update({
      where: { id, userId },
      data,
    });
  }
}

export const apiKeyService = new ApiKeyManagementService();
