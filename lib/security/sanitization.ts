import DOMPurify from 'isomorphic-dompurify';

// ============================================================================
// Input Sanitizer Class
// ============================================================================

export class InputSanitizer {
  /**
   * Sanitizes string by removing HTML tags and scripts
   */
  static sanitizeString(input: string): string {
    if (!input) return '';

    // Remove HTML tags and scripts
    const sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });

    return sanitized.trim();
  }

  /**
   * Sanitizes HTML content (allows safe HTML tags)
   */
  static sanitizeHTML(html: string): string {
    if (!html) return '';

    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'a',
        'blockquote',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    });
  }

  /**
   * Sanitizes object recursively
   */
  static sanitizeObject<T extends Record<string, any>>(obj: T): T {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = {} as T;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key as keyof T] = this.sanitizeString(value) as any;
      } else if (Array.isArray(value)) {
        sanitized[key as keyof T] = value.map((item) =>
          typeof item === 'string'
            ? this.sanitizeString(item)
            : typeof item === 'object'
            ? this.sanitizeObject(item)
            : item
        ) as any;
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key as keyof T] = this.sanitizeObject(value);
      } else {
        sanitized[key as keyof T] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitizes array of strings
   */
  static sanitizeArray(arr: string[]): string[] {
    return arr.map((item) => this.sanitizeString(item));
  }

  /**
   * Escapes special characters for SQL (basic protection)
   */
  static escapeSQLString(input: string): string {
    if (!input) return '';

    return input
      .replace(/'/g, "''")
      .replace(/\\/g, '\\\\')
      .replace(/\0/g, '\\0')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\x1a/g, '\\Z');
  }

  /**
   * Removes potentially dangerous characters
   */
  static removeDangerousChars(input: string): string {
    if (!input) return '';

    // Remove null bytes, control characters, and other dangerous chars
    return input
      .replace(/\0/g, '')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim();
  }

  /**
   * Sanitizes filename
   */
  static sanitizeFilename(filename: string): string {
    if (!filename) return '';

    // Remove path traversal attempts and dangerous characters
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .replace(/^\.+/, '')
      .substring(0, 255);
  }

  /**
   * Sanitizes URL
   */
  static sanitizeURL(url: string): string {
    if (!url) return '';

    try {
      const parsed = new URL(url);

      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return '';
      }

      return parsed.toString();
    } catch (error) {
      return '';
    }
  }

  /**
   * Sanitizes email address
   */
  static sanitizeEmail(email: string): string {
    if (!email) return '';

    // Remove whitespace and convert to lowercase
    const sanitized = email.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      return '';
    }

    return sanitized;
  }

  /**
   * Sanitizes phone number
   */
  static sanitizePhone(phone: string): string {
    if (!phone) return '';

    // Remove all non-numeric characters except + at the start
    return phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  }

  /**
   * Sanitizes numeric input
   */
  static sanitizeNumber(input: string | number): number {
    if (typeof input === 'number') return input;

    const cleaned = input.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);

    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Sanitizes integer input
   */
  static sanitizeInteger(input: string | number): number {
    if (typeof input === 'number') return Math.floor(input);

    const cleaned = input.replace(/[^0-9-]/g, '');
    const parsed = parseInt(cleaned, 10);

    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Sanitizes boolean input
   */
  static sanitizeBoolean(input: any): boolean {
    if (typeof input === 'boolean') return input;

    const truthyValues = ['true', '1', 'yes', 'on'];
    return truthyValues.includes(String(input).toLowerCase());
  }

  /**
   * Sanitizes date input
   */
  static sanitizeDate(input: string | Date): Date | null {
    if (input instanceof Date) return input;

    try {
      const date = new Date(input);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      return null;
    }
  }
}

// ============================================================================
// XSS Protection
// ============================================================================

export class XSSProtection {
  /**
   * Encodes HTML entities
   */
  static encodeHTML(str: string): string {
    if (!str) return '';

    const entityMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
    };

    return str.replace(/[&<>"'/]/g, (char) => entityMap[char]);
  }

  /**
   * Decodes HTML entities
   */
  static decodeHTML(str: string): string {
    if (!str) return '';

    const entityMap: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&#x2F;': '/',
    };

    return str.replace(/&[^;]+;/g, (entity) => entityMap[entity] || entity);
  }

  /**
   * Strips script tags
   */
  static stripScripts(str: string): string {
    if (!str) return '';

    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  /**
   * Strips event handlers
   */
  static stripEventHandlers(str: string): string {
    if (!str) return '';

    return str.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  }

  /**
   * Validates and sanitizes user input for display
   */
  static sanitizeForDisplay(input: string): string {
    if (!input) return '';

    // Remove scripts and event handlers
    let sanitized = this.stripScripts(input);
    sanitized = this.stripEventHandlers(sanitized);

    // Encode HTML entities
    sanitized = this.encodeHTML(sanitized);

    return sanitized;
  }
}

// ============================================================================
// SQL Injection Protection
// ============================================================================

export class SQLInjectionProtection {
  /**
   * Escapes SQL string
   */
  static escape(value: any): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }

    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }

    if (typeof value === 'string') {
      return `'${InputSanitizer.escapeSQLString(value)}'`;
    }

    return `'${String(value)}'`;
  }

  /**
   * Validates table/column name
   */
  static validateIdentifier(identifier: string): boolean {
    // Only allow alphanumeric characters and underscores
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
  }

  /**
   * Sanitizes ORDER BY clause
   */
  static sanitizeOrderBy(orderBy: string): string {
    // Only allow alphanumeric, underscore, and ASC/DESC
    const sanitized = orderBy.replace(/[^a-zA-Z0-9_\s]/g, '');

    // Validate direction
    const parts = sanitized.split(/\s+/);
    if (parts.length > 2) return '';

    const [column, direction] = parts;

    if (!this.validateIdentifier(column)) return '';

    if (direction && !['ASC', 'DESC'].includes(direction.toUpperCase())) {
      return column;
    }

    return direction ? `${column} ${direction.toUpperCase()}` : column;
  }
}

// ============================================================================
// CSRF Protection
// ============================================================================

export class CSRFProtection {
  private static TOKEN_KEY = 'csrf_token';

  /**
   * Generates CSRF token
   */
  static generateToken(): string {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.TOKEN_KEY, token);
    }

    return token;
  }

  /**
   * Gets current CSRF token
   */
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Validates CSRF token
   */
  static validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken !== null && storedToken === token;
  }

  /**
   * Clears CSRF token
   */
  static clearToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.TOKEN_KEY);
    }
  }
}

// ============================================================================
// Content Security Policy Helpers
// ============================================================================

export class CSPHelper {
  /**
   * Generates nonce for inline scripts
   */
  static generateNonce(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Creates CSP header value
   */
  static createCSPHeader(options: {
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    connectSrc?: string[];
  }): string {
    const directives: string[] = [];

    if (options.scriptSrc) {
      directives.push(`script-src ${options.scriptSrc.join(' ')}`);
    }

    if (options.styleSrc) {
      directives.push(`style-src ${options.styleSrc.join(' ')}`);
    }

    if (options.imgSrc) {
      directives.push(`img-src ${options.imgSrc.join(' ')}`);
    }

    if (options.connectSrc) {
      directives.push(`connect-src ${options.connectSrc.join(' ')}`);
    }

    return directives.join('; ');
  }
}

// ============================================================================
// Rate Limiting Helpers
// ============================================================================

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  /**
   * Checks if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter((time) => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }

  /**
   * Gets remaining requests
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter((time) => now - time < this.windowMs);

    return Math.max(0, this.maxRequests - validRequests.length);
  }

  /**
   * Resets rate limit for key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clears all rate limits
   */
  clear(): void {
    this.requests.clear();
  }
}
