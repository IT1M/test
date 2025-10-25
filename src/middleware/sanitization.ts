/**
 * Input Sanitization Middleware for API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { sanitizeObject } from '@/utils/sanitize';

/**
 * Middleware to sanitize request body
 * Applies XSS prevention to all string inputs
 * @param handler - The API route handler
 * @returns Wrapped handler with input sanitization
 */
export function withSanitization(
  handler: (req: NextRequest) => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    // Only sanitize for methods that have a body
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      try {
        // Clone the request to read the body
        const clonedReq = req.clone();
        const contentType = req.headers.get('content-type');

        // Only process JSON requests
        if (contentType?.includes('application/json')) {
          const body = await clonedReq.json();
          
          // Sanitize the body
          const sanitizedBody = sanitizeObject(body);

          // Create a new request with sanitized body
          const sanitizedReq = new NextRequest(req.url, {
            method: req.method,
            headers: req.headers,
            body: JSON.stringify(sanitizedBody),
          });

          // Copy over any additional properties
          Object.defineProperty(sanitizedReq, 'auth', {
            value: (req as any).auth,
            writable: true,
          });

          return handler(sanitizedReq);
        }
      } catch (error) {
        // If body parsing fails, continue with original request
        console.error('Error sanitizing request body:', error);
      }
    }

    // For GET, DELETE, or if sanitization fails, use original request
    return handler(req);
  };
}

/**
 * Sanitize query parameters
 * @param searchParams - URLSearchParams to sanitize
 * @returns Sanitized query parameters object
 */
export function sanitizeQueryParams(
  searchParams: URLSearchParams
): Record<string, string> {
  const params: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    // Basic sanitization for query params
    const sanitizedKey = key.replace(/[<>]/g, '');
    const sanitizedValue = value.replace(/[<>]/g, '');
    params[sanitizedKey] = sanitizedValue;
  });

  return params;
}
