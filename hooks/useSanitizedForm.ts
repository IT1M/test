import { useState, useCallback } from 'react';
import { InputSanitizer } from '@/lib/security/sanitization';

/**
 * Form field configuration
 */
export interface FormField {
  name: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'email' | 'phone' | 'url' | 'html';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => string | null;
}

/**
 * Form validation errors
 */
export interface FormErrors {
  [key: string]: string;
}

/**
 * Hook for sanitized form handling
 * Automatically sanitizes inputs and validates them
 */
export function useSanitizedForm<T extends Record<string, any>>(
  initialValues: T,
  fields: FormField[]
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * Sanitize a single value based on its type
   */
  const sanitizeValue = useCallback((value: any, type: FormField['type']): any => {
    if (value === null || value === undefined) {
      return value;
    }

    switch (type) {
      case 'string':
        return InputSanitizer.sanitizeString(value);
      case 'number':
        return InputSanitizer.sanitizeNumber(value);
      case 'integer':
        return InputSanitizer.sanitizeInteger(value);
      case 'boolean':
        return InputSanitizer.sanitizeBoolean(value);
      case 'date':
        return InputSanitizer.sanitizeDate(value);
      case 'email':
        return InputSanitizer.sanitizeEmail(value);
      case 'phone':
        return InputSanitizer.sanitizePhone(value);
      case 'url':
        return InputSanitizer.sanitizeURL(value);
      case 'html':
        return InputSanitizer.sanitizeHTML(value);
      default:
        return InputSanitizer.sanitizeString(value);
    }
  }, []);

  /**
   * Validate a single field
   */
  const validateField = useCallback((field: FormField, value: any): string | null => {
    // Required check
    if (field.required && (value === null || value === undefined || value === '')) {
      return `${field.name} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!field.required && (value === null || value === undefined || value === '')) {
      return null;
    }

    // Type-specific validations
    if (field.type === 'string' || field.type === 'html') {
      const strValue = String(value);
      
      if (field.minLength && strValue.length < field.minLength) {
        return `${field.name} must be at least ${field.minLength} characters`;
      }
      
      if (field.maxLength && strValue.length > field.maxLength) {
        return `${field.name} must be at most ${field.maxLength} characters`;
      }
      
      if (field.pattern && !field.pattern.test(strValue)) {
        return `${field.name} format is invalid`;
      }
    }

    if (field.type === 'number' || field.type === 'integer') {
      const numValue = Number(value);
      
      if (isNaN(numValue)) {
        return `${field.name} must be a valid number`;
      }
      
      if (field.min !== undefined && numValue < field.min) {
        return `${field.name} must be at least ${field.min}`;
      }
      
      if (field.max !== undefined && numValue > field.max) {
        return `${field.name} must be at most ${field.max}`;
      }
    }

    if (field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        return `${field.name} must be a valid email address`;
      }
    }

    if (field.type === 'url') {
      try {
        new URL(String(value));
      } catch {
        return `${field.name} must be a valid URL`;
      }
    }

    // Custom validator
    if (field.customValidator) {
      return field.customValidator(value);
    }

    return null;
  }, []);

  /**
   * Validate all fields
   */
  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    fields.forEach(field => {
      const value = values[field.name as keyof T];
      const error = validateField(field, value);
      
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [fields, values, validateField]);

  /**
   * Handle field change with sanitization and validation
   */
  const handleChange = useCallback((name: string, value: any) => {
    const field = fields.find(f => f.name === name);
    
    if (!field) {
      console.warn(`Field ${name} not found in form configuration`);
      return;
    }

    // Sanitize the value
    const sanitizedValue = sanitizeValue(value, field.type);

    // Update values
    setValues(prev => ({
      ...prev,
      [name]: sanitizedValue,
    }));

    // Validate if field has been touched
    if (touched[name]) {
      const error = validateField(field, sanitizedValue);
      setErrors(prev => ({
        ...prev,
        [name]: error || '',
      }));
    }
  }, [fields, touched, sanitizeValue, validateField]);

  /**
   * Handle field blur
   */
  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    // Validate on blur
    const field = fields.find(f => f.name === name);
    if (field) {
      const value = values[name as keyof T];
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [name]: error || '',
      }));
    }
  }, [fields, values, validateField]);

  /**
   * Reset form to initial values
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  /**
   * Set form values programmatically
   */
  const setFormValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({
      ...prev,
      ...newValues,
    }));
  }, []);

  /**
   * Get sanitized and validated values
   */
  const getSanitizedValues = useCallback((): T => {
    const sanitized = { ...values };
    
    fields.forEach(field => {
      const value = sanitized[field.name as keyof T];
      sanitized[field.name as keyof T] = sanitizeValue(value, field.type);
    });
    
    return sanitized;
  }, [values, fields, sanitizeValue]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setFormValues,
    getSanitizedValues,
    isValid: Object.keys(errors).length === 0,
  };
}
