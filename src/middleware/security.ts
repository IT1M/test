/**
 * Comprehensive Security Middleware
 * Combines rate limiting, sanitization, CORS, and other security features
 */

import { NextRequest } from 'next/server';
import { rateLimitedHandler } from './rateLimit';
import { withSanitization } from './sanitization';
import { withCORS } from '@/utils/cors';

interface CORSOptions {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

interface SecurityOptions {
  rateLimit?: {
    maxRequests?: number;
    windowMs?: number;
  };
  sanitize?: boolean;
  cors?: CORSOptions | boolean;
}

/**
 * Apply comprehensive security middleware to API route handler
 * @param handler - The API route handler
 * @param options - Security configuration options
 * @returns Secured handler
 */
export function withSecurity(
  handler: (req: NextRequest) => Promise<Response>,
  options: SecurityOptions = {}
) {
  const { rateLimit, sanitize = true, cors = true } = options;

  let securedHandler = handler;

  // Apply CORS if enabled
  if (cors) {
    const corsOptions = typeof cors === 'boolean' ? {} : cors;
    securedHandler = withCORS(securedHandler, corsOptions);
  }

  // Apply sanitization if enabled
  if (sanitize) {
    securedHandler = withSanitization(securedHandler);
  }

  // Apply rate limiting
  securedHandler = rateLimitedHandler(securedHandler, rateLimit);

  return securedHandler;
}

/**
 * CSRF Token validation (NextAuth provides this automatically)
 * This is a helper to verify CSRF tokens for custom forms
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  if (token.length !== expectedToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }

  return result === 0;
}
