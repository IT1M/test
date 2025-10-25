/**
 * Rate Limiting Middleware for API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/utils/rateLimit';
import { getToken } from 'next-auth/jwt';

interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
}

/**
 * Rate limit middleware wrapper for API routes
 * @param handler - The API route handler
 * @param options - Rate limit configuration
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: RateLimitOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const { maxRequests = 100, windowMs = 60000 } = options;

    // Get identifier (user ID or IP address)
    let identifier: string;

    try {
      // Try to get user from session
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (token?.sub) {
        identifier = `user:${token.sub}`;
      } else {
        // Fall back to IP address for unauthenticated requests
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
        identifier = `ip:${ip}`;
      }
    } catch (error) {
      // Fall back to IP if token parsing fails
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
      identifier = `ip:${ip}`;
    }

    // Check rate limit
    const rateLimitResult = checkRateLimit(identifier, {
      maxRequests,
      windowMs,
    });

    // Create response
    let response: NextResponse;

    if (!rateLimitResult.success) {
      // Rate limit exceeded
      response = NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
          },
        },
        { status: 429 }
      );
    } else {
      // Process request
      response = await handler(req);
    }

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set(
      'X-RateLimit-Remaining',
      rateLimitResult.remaining.toString()
    );
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());

    if (!rateLimitResult.success) {
      response.headers.set(
        'Retry-After',
        Math.ceil((rateLimitResult.reset - Date.now() / 1000)).toString()
      );
    }

    return response;
  };
}

/**
 * Higher-order function to wrap API route handlers with rate limiting
 * Usage: export const GET = rateLimitedHandler(async (req) => { ... });
 */
export function rateLimitedHandler(
  handler: (req: NextRequest) => Promise<Response>,
  options: RateLimitOptions = {}
) {
  return async (req: NextRequest): Promise<Response> => {
    const { maxRequests = 100, windowMs = 60000 } = options;

    // Get identifier (user ID or IP address)
    let identifier: string;

    try {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (token?.sub) {
        identifier = `user:${token.sub}`;
      } else {
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
        identifier = `ip:${ip}`;
      }
    } catch (error) {
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
      identifier = `ip:${ip}`;
    }

    // Check rate limit
    const rateLimitResult = checkRateLimit(identifier, {
      maxRequests,
      windowMs,
    });

    // Create headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());

    if (!rateLimitResult.success) {
      headers.set(
        'Retry-After',
        Math.ceil((rateLimitResult.reset - Date.now() / 1000)).toString()
      );

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(headers.entries()),
          },
        }
      );
    }

    // Process request and add headers to response
    const response = await handler(req);
    
    // Clone response to add headers
    const newResponse = new Response(response.body, response);
    headers.forEach((value, key) => {
      newResponse.headers.set(key, value);
    });

    return newResponse;
  };
}
