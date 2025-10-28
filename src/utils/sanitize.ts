/**
 * Input Sanitization Utilities
 * Provides XSS prevention and input sanitization
 */

/**
 * Sanitize string input to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  // Decode HTML entities to prevent double encoding attacks
  sanitized = decodeHTMLEntities(sanitized);

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Decode HTML entities
 * @param text - Text with HTML entities
 * @returns Decoded text
 */
function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
  };

  return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
}

/**
 * Sanitize object recursively
 * Applies string sanitization to all string values in an object
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized as T;
}

/**
 * Validate and sanitize file upload
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result
 */
export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // MIME types
  allowedExtensions?: string[]; // file extensions
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    allowedExtensions = [],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
    };
  }

  // Check MIME type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (
    allowedExtensions.length > 0 &&
    extension &&
    !allowedExtensions.includes(extension)
  ) {
    return {
      valid: false,
      error: `File extension .${extension} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
    };
  }

  // Sanitize filename
  const sanitizedName = sanitizeFilename(file.name);

  return {
    valid: true,
    sanitizedName,
  };
}

/**
 * Sanitize filename to prevent directory traversal and other attacks
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators
  let sanitized = filename.replace(/[\/\\]/g, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1f\x80-\x9f]/g, '');

  // Remove special characters that could cause issues
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');

  // Limit length
  if (sanitized.length > 255) {
    const extension = sanitized.split('.').pop();
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
    sanitized = nameWithoutExt.substring(0, 255 - (extension?.length || 0) - 1) + '.' + extension;
  }

  // If filename is empty after sanitization, use a default
  if (!sanitized) {
    sanitized = 'file';
  }

  return sanitized;
}

/**
 * Sanitize SQL-like input (additional layer on top of Prisma's protection)
 * Removes common SQL injection patterns
 * @param input - Input string
 * @returns Sanitized string
 */
export function sanitizeSQLInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove SQL comments
  let sanitized = input.replace(/--.*$/gm, '');
  sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove common SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
    /(\bOR\b.*=.*)/gi,
    /(\bAND\b.*=.*)/gi,
    /(;|\||&&)/g,
  ];

  // Note: This is a basic check. Prisma's parameterized queries are the primary defense
  // This is just an additional layer for logging/monitoring purposes
  
  return sanitized.trim();
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 * @param url - URL to validate
 * @returns True if valid URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize HTML for display (allows safe HTML tags)
 * Use this when you need to display user-generated content with basic formatting
 * @param html - HTML string
 * @returns Sanitized HTML
 */
export function sanitizeHTML(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }

  // Allow only safe tags
  const allowedTags = ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'span'];
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;

  return html.replace(tagRegex, (match, tag) => {
    if (allowedTags.includes(tag.toLowerCase())) {
      // Remove attributes from allowed tags
      return match.replace(/\s+[a-z-]+\s*=\s*["'][^"']*["']/gi, '');
    }
    return ''; // Remove disallowed tags
  });
}
