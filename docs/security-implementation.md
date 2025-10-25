# Security Implementation Guide

This document describes the security features implemented in the Saudi Mais Medical Inventory System.

## Overview

The system implements comprehensive security measures including:
- Rate limiting
- Input sanitization and XSS prevention
- CSRF protection
- Security headers
- Secure session management
- CORS configuration

## 1. Rate Limiting

### Implementation
- **Location**: `src/utils/rateLimit.ts`, `src/middleware/rateLimit.ts`
- **Algorithm**: Token bucket algorithm
- **Default Limit**: 100 requests per minute per user
- **Identifier**: User ID (authenticated) or IP address (unauthenticated)

### Usage

```typescript
import { withSecurity } from '@/middleware/security';

export const GET = withSecurity(async (req) => {
  // Your handler code
}, {
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000
  }
});
```

### Response Headers
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait before retrying (when limit exceeded)

### HTTP Status
- **429 Too Many Requests**: Returned when rate limit is exceeded

## 2. Input Sanitization

### Implementation
- **Location**: `src/utils/sanitize.ts`, `src/middleware/sanitization.ts`
- **Protection**: XSS prevention, HTML tag removal, script injection prevention

### Features

#### String Sanitization
```typescript
import { sanitizeString } from '@/utils/sanitize';

const clean = sanitizeString(userInput);
```

Removes:
- HTML tags
- Script tags and content
- Event handlers (onclick, onload, etc.)
- javascript: protocol
- data:text/html protocol

#### Object Sanitization
```typescript
import { sanitizeObject } from '@/utils/sanitize';

const cleanData = sanitizeObject(requestBody);
```

Recursively sanitizes all string values in objects and arrays.

#### File Upload Validation
```typescript
import { validateFile } from '@/utils/sanitize';

const result = validateFile(file, {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png'],
  allowedExtensions: ['jpg', 'jpeg', 'png']
});
```

### Automatic Sanitization
All POST, PUT, and PATCH requests are automatically sanitized when using the `withSecurity` middleware.

## 3. CSRF Protection

### Implementation
- **Provider**: NextAuth v5 (built-in)
- **Method**: Double-submit cookie pattern
- **Automatic**: All NextAuth endpoints are protected

### Custom CSRF Validation
For custom forms outside NextAuth:

```typescript
import { validateCSRFToken } from '@/middleware/security';

const isValid = validateCSRFToken(token, expectedToken);
```

## 4. Security Headers

### Implementation
- **Location**: `next.config.js`
- **Applied to**: All routes

### Headers Configured

#### Strict-Transport-Security (HSTS)
```
max-age=63072000; includeSubDomains; preload
```
Forces HTTPS for 2 years, including subdomains.

#### X-Frame-Options
```
SAMEORIGIN
```
Prevents clickjacking by disallowing iframe embedding from other origins.

#### X-Content-Type-Options
```
nosniff
```
Prevents MIME type sniffing.

#### X-XSS-Protection
```
1; mode=block
```
Enables browser XSS filtering.

#### Content-Security-Policy (CSP)
```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self' https://generativelanguage.googleapis.com;
frame-ancestors 'self';
base-uri 'self';
form-action 'self'
```

Restricts resource loading to trusted sources.

#### Referrer-Policy
```
strict-origin-when-cross-origin
```
Controls referrer information sent with requests.

#### Permissions-Policy
```
camera=(), microphone=(), geolocation=(), interest-cohort=()
```
Disables unnecessary browser features.

## 5. CORS Configuration

### Implementation
- **Location**: `src/utils/cors.ts`
- **Default Origin**: Environment-based (production domain)
- **Credentials**: Enabled for same-origin requests

### Usage

```typescript
import { withCORS } from '@/utils/cors';

export const GET = withCORS(async (req) => {
  // Your handler code
}, {
  origin: 'https://yourdomain.com',
  methods: ['GET', 'POST'],
  credentials: true
});
```

### Preflight Requests
OPTIONS requests are automatically handled for CORS preflight.

## 6. Session Security

### Implementation
- **Location**: `src/services/auth.ts`, `src/utils/session.ts`
- **Strategy**: JWT with secure cookies
- **Timeout**: 30 minutes of inactivity

### Features

#### Secure Cookies
- **HTTP-only**: Prevents JavaScript access
- **SameSite**: Set to 'lax' for CSRF protection
- **Secure**: HTTPS-only in production
- **Prefix**: `__Secure-` in production

#### Session Timeout
- **Max Age**: 30 minutes
- **Update Age**: Session refreshed every 5 minutes
- **Warning**: User warned 5 minutes before expiry

#### Session Validation
```typescript
import { getValidatedSession } from '@/utils/session';

const session = await getValidatedSession();
if (!session) {
  // Session invalid or user inactive
}
```

Validates:
- User account is still active
- Session hasn't expired
- User hasn't been deactivated

#### Password Change Invalidation
When a user changes their password:
1. Password is updated in database
2. `updatedAt` timestamp changes
3. JWT callback detects the change
4. Session is invalidated on next request
5. User must re-authenticate

#### Client-Side Session Monitor
```tsx
import { SessionMonitor } from '@/components/ui/SessionMonitor';

<SessionMonitor locale={locale} />
```

Features:
- Monitors user activity
- Shows warning before expiry
- Allows session extension
- Automatic logout on expiry

## 7. Comprehensive Security Middleware

### Usage
The `withSecurity` middleware combines all security features:

```typescript
import { withSecurity } from '@/middleware/security';

export const GET = withSecurity(async (req) => {
  // Your handler code
}, {
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000
  },
  sanitize: true,
  cors: {
    origin: 'https://yourdomain.com',
    credentials: true
  }
});
```

### Options
- `rateLimit`: Rate limiting configuration
- `sanitize`: Enable/disable input sanitization (default: true)
- `cors`: CORS configuration or boolean to enable/disable

## 8. Additional Security Measures

### Password Security
- **Hashing**: bcrypt with 12 rounds
- **Minimum Length**: 8 characters
- **Validation**: Enforced on registration and password change

### Database Security
- **ORM**: Prisma (prevents SQL injection)
- **Parameterized Queries**: All queries use parameters
- **Connection Pooling**: Limited to 10 connections

### API Security
- **Authentication**: Required for all protected endpoints
- **Authorization**: Role-based access control
- **Audit Logging**: All sensitive operations logged

## 9. Environment Variables

Required security-related environment variables:

```env
# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://...

# Node Environment
NODE_ENV=production
```

## 10. Security Best Practices

### For Developers

1. **Always use the security middleware** for API routes
2. **Never expose sensitive data** in client-side code
3. **Validate all inputs** on both client and server
4. **Use environment variables** for secrets
5. **Keep dependencies updated** regularly
6. **Review audit logs** for suspicious activity

### For Administrators

1. **Use strong passwords** for all accounts
2. **Enable HTTPS** in production
3. **Monitor rate limit violations**
4. **Review security headers** regularly
5. **Keep backups** of audit logs
6. **Rotate secrets** periodically

## 11. Testing Security

### Rate Limiting Test
```bash
# Send multiple requests rapidly
for i in {1..150}; do
  curl -X GET https://yourdomain.com/api/inventory
done
```

Expected: 429 status after 100 requests

### XSS Prevention Test
```bash
curl -X POST https://yourdomain.com/api/inventory \
  -H "Content-Type: application/json" \
  -d '{"itemName": "<script>alert(\"XSS\")</script>"}'
```

Expected: Script tags removed from stored data

### Session Timeout Test
1. Login to the application
2. Wait 30 minutes without activity
3. Try to access a protected page

Expected: Redirect to login page

## 12. Incident Response

If a security incident is detected:

1. **Identify**: Check audit logs for suspicious activity
2. **Contain**: Disable affected user accounts
3. **Investigate**: Review logs and system access
4. **Remediate**: Fix vulnerabilities and update code
5. **Document**: Record incident details and response
6. **Notify**: Inform affected users if necessary

## 13. Compliance

The implemented security measures help meet:
- **OWASP Top 10** protection
- **GDPR** data protection requirements
- **HIPAA** security standards (for medical data)
- **ISO 27001** information security standards

## 14. Future Enhancements

Planned security improvements:
- Two-factor authentication (2FA)
- IP whitelisting for admin accounts
- Advanced threat detection
- Security information and event management (SIEM)
- Penetration testing automation
