// PHI/PII Detection and Sanitization Service
// Automatically detects and sanitizes Protected Health Information and Personally Identifiable Information

export interface PHIDetectionResult {
  containsPHI: boolean;
  containsPII: boolean;
  detectedTypes: string[];
  sanitizedData: any;
  redactedFields: string[];
}

export interface SanitizationOptions {
  redactNames: boolean;
  redactIds: boolean;
  redactDates: boolean;
  redactAddresses: boolean;
  redactPhones: boolean;
  redactEmails: boolean;
  replacementChar: string;
}

export class PHIPIIDetector {
  // Regex patterns for PHI/PII detection
  private static readonly PATTERNS = {
    // Names (simple pattern - can be enhanced)
    name: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
    
    // National ID patterns (various formats)
    nationalId: /\b\d{10,14}\b/g,
    
    // Email addresses
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    
    // Phone numbers (various formats)
    phone: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    
    // Dates (various formats)
    date: /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g,
    
    // Addresses (simplified)
    address: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/gi,
    
    // Medical Record Numbers
    mrn: /\b(?:MRN|Medical Record|Patient ID)[\s:]*\d+\b/gi,
    
    // Social Security Numbers (US format)
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    
    // Credit Card Numbers
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    
    // IP Addresses
    ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  };
  
  /**
   * Detect PHI/PII in data
   */
  static detectPHI(data: any): PHIDetectionResult {
    const detectedTypes: string[] = [];
    const redactedFields: string[] = [];
    
    // Convert data to string for pattern matching
    const dataString = JSON.stringify(data);
    
    // Check each pattern
    for (const [type, pattern] of Object.entries(this.PATTERNS)) {
      if (pattern.test(dataString)) {
        detectedTypes.push(type);
      }
    }
    
    // Determine if contains PHI or PII
    const phiTypes = ['mrn', 'nationalId', 'ssn', 'date'];
    const piiTypes = ['name', 'email', 'phone', 'address', 'creditCard', 'ipAddress'];
    
    const containsPHI = detectedTypes.some(t => phiTypes.includes(t));
    const containsPII = detectedTypes.some(t => piiTypes.includes(t));
    
    // Sanitize data
    const sanitizedData = this.sanitizeData(data, {
      redactNames: true,
      redactIds: true,
      redactDates: true,
      redactAddresses: true,
      redactPhones: true,
      redactEmails: true,
      replacementChar: '*',
    }, redactedFields);
    
    return {
      containsPHI,
      containsPII,
      detectedTypes,
      sanitizedData,
      redactedFields,
    };
  }
  
  /**
   * Sanitize data by redacting PHI/PII
   */
  static sanitizeData(
    data: any,
    options: SanitizationOptions,
    redactedFields: string[] = []
  ): any {
    if (typeof data === 'string') {
      return this.sanitizeString(data, options);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item, options, redactedFields));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        // Check if field name suggests sensitive data
        const isSensitiveField = this.isSensitiveFieldName(key);
        
        if (isSensitiveField) {
          redactedFields.push(key);
          sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'string') {
          const sanitizedValue = this.sanitizeString(value, options);
          sanitized[key] = sanitizedValue;
          
          if (sanitizedValue !== value) {
            redactedFields.push(key);
          }
        } else {
          sanitized[key] = this.sanitizeData(value, options, redactedFields);
        }
      }
      
      return sanitized;
    }
    
    return data;
  }
  
  /**
   * Sanitize a string value
   */
  private static sanitizeString(value: string, options: SanitizationOptions): string {
    let sanitized = value;
    
    if (options.redactEmails) {
      sanitized = sanitized.replace(this.PATTERNS.email, (match) => {
        const [local, domain] = match.split('@');
        return `${local.charAt(0)}${options.replacementChar.repeat(local.length - 1)}@${domain}`;
      });
    }
    
    if (options.redactPhones) {
      sanitized = sanitized.replace(this.PATTERNS.phone, (match) => {
        return options.replacementChar.repeat(match.length);
      });
    }
    
    if (options.redactIds) {
      sanitized = sanitized.replace(this.PATTERNS.nationalId, (match) => {
        return options.replacementChar.repeat(match.length);
      });
      
      sanitized = sanitized.replace(this.PATTERNS.ssn, (match) => {
        return options.replacementChar.repeat(match.length);
      });
      
      sanitized = sanitized.replace(this.PATTERNS.mrn, (match) => {
        return match.replace(/\d/g, options.replacementChar);
      });
    }
    
    if (options.redactDates) {
      sanitized = sanitized.replace(this.PATTERNS.date, (match) => {
        return options.replacementChar.repeat(match.length);
      });
    }
    
    if (options.redactAddresses) {
      sanitized = sanitized.replace(this.PATTERNS.address, (match) => {
        return '[ADDRESS REDACTED]';
      });
    }
    
    if (options.redactNames) {
      sanitized = sanitized.replace(this.PATTERNS.name, (match) => {
        return match.split(' ').map(part => 
          part.charAt(0) + options.replacementChar.repeat(part.length - 1)
        ).join(' ');
      });
    }
    
    return sanitized;
  }
  
  /**
   * Check if field name suggests sensitive data
   */
  private static isSensitiveFieldName(fieldName: string): boolean {
    const sensitiveKeywords = [
      'password',
      'secret',
      'token',
      'key',
      'ssn',
      'social_security',
      'credit_card',
      'cvv',
      'pin',
      'api_key',
      'private_key',
    ];
    
    const lowerFieldName = fieldName.toLowerCase();
    return sensitiveKeywords.some(keyword => lowerFieldName.includes(keyword));
  }
  
  /**
   * Validate if data is safe to process
   */
  static validateDataSafety(data: any): {
    isSafe: boolean;
    warnings: string[];
  } {
    const result = this.detectPHI(data);
    const warnings: string[] = [];
    
    if (result.containsPHI) {
      warnings.push('Data contains Protected Health Information (PHI)');
    }
    
    if (result.containsPII) {
      warnings.push('Data contains Personally Identifiable Information (PII)');
    }
    
    if (result.detectedTypes.length > 0) {
      warnings.push(`Detected sensitive data types: ${result.detectedTypes.join(', ')}`);
    }
    
    return {
      isSafe: warnings.length === 0,
      warnings,
    };
  }
  
  /**
   * Create anonymized version of data for analytics
   */
  static anonymizeForAnalytics(data: any): any {
    return this.sanitizeData(data, {
      redactNames: true,
      redactIds: true,
      redactDates: false, // Keep dates for time-series analysis
      redactAddresses: true,
      redactPhones: true,
      redactEmails: true,
      replacementChar: 'X',
    });
  }
  
  /**
   * Hash sensitive identifiers for tracking without exposing data
   */
  static hashIdentifier(identifier: string): string {
    // Simple hash function (in production, use crypto library)
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `HASH_${Math.abs(hash).toString(16)}`;
  }
}
