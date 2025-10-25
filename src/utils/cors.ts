/**
 * CORS Configuration Utility
 */

import { NextRequest, NextResponse } from 'next/server';

interface CORSOptions {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const defaultOptions: CORSOptions = {
  origin: process.env.NEXT_PUBLIC_APP_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string, allowedOrigin: string | string[]): boolean {
  if (allowedOrigin === '*') {
    return true;
  }

  if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.includes(origin);
  }

  return allowedOrigin === origin;
}

/**
 * Add CORS headers to response
 */
export function setCORSHeaders(
  response: NextResponse,
  request: NextRequest,
  options: CORSOptions = {}
): NextResponse {
  const opts = { ...defaultOptions, ...options };
  const origin = request.headers.get('origin') || '';

  // Check if origin is allowed
  if (opts.origin && isOriginAllowed(origin, opts.origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (opts.origin === '*') {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  // Set other CORS headers
  if (opts.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  if (opts.methods) {
    response.headers.set('Access-Control-Allow-Methods', opts.methods.join(', '));
  }

  if (opts.allowedHeaders) {
    response.headers.set('Access-Control-Allow-Headers', opts.allowedHeaders.join(', '));
  }

  if (opts.exposedHeaders) {
    response.headers.set('Access-Control-Expose-Headers', opts.exposedHeaders.join(', '));
  }

  if (opts.maxAge) {
    response.headers.set('Access-Control-Max-Age', opts.maxAge.toString());
  }

  return response;
}

/**
 * Handle CORS preflight request
 */
export function handleCORSPreflight(
  request: NextRequest,
  options: CORSOptions = {}
): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return setCORSHeaders(response, request, options);
}

/**
 * Middleware wrapper to add CORS support
 */
export function withCORS(
  handler: (req: NextRequest) => Promise<Response>,
  options: CORSOptions = {}
) {
  return async (req: NextRequest): Promise<Response> => {
    // Handle preflight request
    if (req.method === 'OPTIONS') {
      return handleCORSPreflight(req, options);
    }

    // Process request
    const response = await handler(req);
    const nextResponse = new NextResponse(response.body, response);

    // Add CORS headers
    return setCORSHeaders(nextResponse, req, options);
  };
}
