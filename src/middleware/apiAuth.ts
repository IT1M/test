import { NextRequest, NextResponse } from 'next/server';
import { apiKeyService } from '@/services/apiKeyManagement';
import { rateLimit } from '@/utils/rateLimit';

export interface ApiContext {
  apiKey: {
    id: string;
    name: string;
    permissions: any[];
    rateLimit: number;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      isActive: boolean;
    };
  };
}

/**
 * Middleware to authenticate API requests using API keys
 */
export async function authenticateApiKey(
  request: NextRequest
): Promise<{ success: true; context: ApiContext } | { success: false; error: string; status: number }> {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    return {
      success: false,
      error: 'API key is required. Provide it in x-api-key header or Authorization: Bearer header',
      status: 401,
    };
  }

  const validation = await apiKeyService.validateApiKey(apiKey);

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || 'Invalid API key',
      status: 401,
    };
  }

  return {
    success: true,
    context: {
      apiKey: validation.apiKey!,
    },
  };
}

/**
 * Check if API key has required permission
 */
export function requirePermission(
  context: ApiContext,
  resource: string,
  action: 'read' | 'write' | 'delete'
): { success: true } | { success: false; error: string; status: number } {
  const hasPermission = apiKeyService.hasPermission(context.apiKey.permissions, resource, action);

  if (!hasPermission) {
    return {
      success: false,
      error: `Permission denied. Required: ${resource}:${action}`,
      status: 403,
    };
  }

  return { success: true };
}

/**
 * Apply rate limiting based on API key limits
 */
export async function applyApiRateLimit(
  request: NextRequest,
  context: ApiContext
): Promise<{ success: true } | { success: false; error: string; status: number; headers: Record<string, string> }> {
  const identifier = `api_key:${context.apiKey.id}`;
  const limit = context.apiKey.rateLimit;
  const window = 60 * 60 * 1000; // 1 hour

  const result = await rateLimit(identifier, limit, window);

  if (!result.success) {
    return {
      success: false,
      error: 'Rate limit exceeded',
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(result.resetTime!).toISOString(),
        'Retry-After': Math.ceil((result.resetTime! - Date.now()) / 1000).toString(),
      },
    };
  }

  return { success: true };
}

/**
 * Combined API authentication middleware
 */
export async function withApiAuth(
  request: NextRequest,
  handler: (request: NextRequest, context: ApiContext) => Promise<NextResponse>,
  options?: {
    requiredPermission?: { resource: string; action: 'read' | 'write' | 'delete' };
    skipRateLimit?: boolean;
  }
): Promise<NextResponse> {
  // Authenticate
  const authResult = await authenticateApiKey(request);
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const context = authResult.context;

  // Check permissions
  if (options?.requiredPermission) {
    const permResult = requirePermission(
      context,
      options.requiredPermission.resource,
      options.requiredPermission.action
    );
    if (!permResult.success) {
      return NextResponse.json(
        { error: permResult.error },
        { status: permResult.status }
      );
    }
  }

  // Apply rate limiting
  if (!options?.skipRateLimit) {
    const rateLimitResult = await applyApiRateLimit(request, context);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        {
          status: rateLimitResult.status,
          headers: rateLimitResult.headers,
        }
      );
    }
  }

  // Call the handler
  return handler(request, context);
}
