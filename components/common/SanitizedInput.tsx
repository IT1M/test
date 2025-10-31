'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { InputSanitizer, XSSProtection } from '@/lib/security/sanitization';
import { useState, useEffect } from 'react';

interface SanitizedInputProps {
  id: string;
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'number' | 'tel' | 'url' | 'password';
  value: string | number;
  onChange: (name: string, value: any) => void;
  onBlur?: (name: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  multiline?: boolean;
  rows?: number;
}

/**
 * SanitizedInput component
 * Automatically sanitizes user input to prevent XSS attacks
 */
export function SanitizedInput({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  required,
  placeholder,
  disabled,
  className,
  multiline = false,
  rows = 3,
}: SanitizedInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const rawValue = e.target.value;
    let sanitizedValue: any = rawValue;

    // Sanitize based on type
    switch (type) {
      case 'email':
        sanitizedValue = InputSanitizer.sanitizeEmail(rawValue);
        break;
      case 'tel':
        sanitizedValue = InputSanitizer.sanitizePhone(rawValue);
        break;
      case 'url':
        sanitizedValue = InputSanitizer.sanitizeURL(rawValue);
        break;
      case 'number':
        sanitizedValue = InputSanitizer.sanitizeNumber(rawValue);
        break;
      case 'password':
        // Don't sanitize passwords, but remove dangerous characters
        sanitizedValue = InputSanitizer.removeDangerousChars(rawValue);
        break;
      default:
        // For text inputs, sanitize to prevent XSS
        sanitizedValue = InputSanitizer.sanitizeString(rawValue);
        break;
    }

    setLocalValue(sanitizedValue);
    onChange(name, sanitizedValue);
  };

  const handleBlur = () => {
    if (onBlur) {
      onBlur(name);
    }
  };

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} className="mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <InputComponent
        id={id}
        name={name}
        type={type}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={error ? 'border-red-500' : ''}
        {...(multiline ? { rows } : {})}
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
