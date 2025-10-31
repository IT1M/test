import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

// ============================================================================
// Currency Formatting
// ============================================================================

/**
 * Formats a number as currency with locale support
 * @param amount - The amount to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale code (default: 'en-US')
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats currency without symbol (for input fields)
 */
export function formatCurrencyValue(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Parses currency string to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Formats a date in standard format (MM/DD/YYYY)
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, 'MM/dd/yyyy');
}

/**
 * Formats a date with time (MM/DD/YYYY HH:mm)
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, 'MM/dd/yyyy HH:mm');
}

/**
 * Formats a date in long format (January 1, 2024)
 */
export function formatDateLong(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, 'MMMM d, yyyy');
}

/**
 * Formats a date in short format (Jan 1, 2024)
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, 'MMM d, yyyy');
}

/**
 * Formats time only (HH:mm:ss)
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, 'HH:mm:ss');
}

/**
 * Formats relative date (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Formats date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, 'yyyy-MM-dd');
}

/**
 * Formats date range
 */
export function formatDateRange(
  startDate: Date | string,
  endDate: Date | string
): string {
  const start = formatDateShort(startDate);
  const end = formatDateShort(endDate);
  return `${start} - ${end}`;
}

// ============================================================================
// Phone Number Formatting
// ============================================================================

/**
 * Formats phone number in standard format
 * @param phone - Phone number string
 * @param format - Format type ('us' | 'international')
 */
export function formatPhone(phone: string, format: 'us' | 'international' = 'us'): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  if (format === 'us') {
    // US format: (123) 456-7890
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
  } else if (format === 'international') {
    // International format: +1 123 456 7890
    if (cleaned.length >= 10) {
      const countryCode = cleaned.slice(0, cleaned.length - 10);
      const areaCode = cleaned.slice(-10, -7);
      const firstPart = cleaned.slice(-7, -4);
      const secondPart = cleaned.slice(-4);
      
      if (countryCode) {
        return `+${countryCode} ${areaCode} ${firstPart} ${secondPart}`;
      }
      return `${areaCode} ${firstPart} ${secondPart}`;
    }
  }
  
  // Return original if format doesn't match
  return phone;
}

/**
 * Formats phone number for display (removes formatting for storage)
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

// ============================================================================
// Percentage Formatting
// ============================================================================

/**
 * Formats a number as percentage
 * @param value - Value to format (0.15 = 15%)
 * @param decimals - Number of decimal places (default: 2)
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Formats percentage with sign (for changes)
 */
export function formatPercentageChange(value: number, decimals: number = 2): string {
  const formatted = formatPercentage(value, decimals);
  return value >= 0 ? `+${formatted}` : formatted;
}

/**
 * Parses percentage string to decimal
 */
export function parsePercentage(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) / 100 || 0;
}

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Formats a number with locale support
 * @param value - Number to format
 * @param decimals - Number of decimal places
 * @param locale - Locale code (default: 'en-US')
 */
export function formatNumber(
  value: number,
  decimals: number = 0,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats large numbers with abbreviations (1K, 1M, 1B)
 */
export function formatNumberCompact(value: number, decimals: number = 1): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(decimals)}B`;
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(decimals)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(decimals)}K`;
  }
  return value.toString();
}

/**
 * Formats number with ordinal suffix (1st, 2nd, 3rd)
 */
export function formatOrdinal(value: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = value % 100;
  return value + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

// ============================================================================
// Text Formatting
// ============================================================================

/**
 * Capitalizes first letter of each word
 */
export function formatTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formats text to sentence case
 */
export function formatSentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Truncates text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ============================================================================
// ID Formatting
// ============================================================================

/**
 * Formats SKU for display
 */
export function formatSKU(sku: string): string {
  return sku.toUpperCase();
}

/**
 * Formats order ID with prefix
 */
export function formatOrderId(id: string | number): string {
  if (typeof id === 'number') {
    return `ORD-${String(id).padStart(6, '0')}`;
  }
  return id.startsWith('ORD-') ? id : `ORD-${id}`;
}

/**
 * Formats customer ID with prefix
 */
export function formatCustomerId(id: string | number): string {
  if (typeof id === 'number') {
    return `CUST-${String(id).padStart(6, '0')}`;
  }
  return id.startsWith('CUST-') ? id : `CUST-${id}`;
}

/**
 * Formats invoice ID with prefix
 */
export function formatInvoiceId(id: string | number): string {
  if (typeof id === 'number') {
    return `INV-${String(id).padStart(6, '0')}`;
  }
  return id.startsWith('INV-') ? id : `INV-${id}`;
}

/**
 * Formats patient ID with prefix
 */
export function formatPatientId(id: string | number): string {
  if (typeof id === 'number') {
    return `PAT-${String(id).padStart(6, '0')}`;
  }
  return id.startsWith('PAT-') ? id : `PAT-${id}`;
}

// ============================================================================
// Status Formatting
// ============================================================================

/**
 * Formats order status for display
 */
export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
  };
  return statusMap[status] || formatTitleCase(status);
}

/**
 * Formats payment status for display
 */
export function formatPaymentStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'unpaid': 'Unpaid',
    'partially-paid': 'Partially Paid',
    'paid': 'Paid',
    'overdue': 'Overdue',
  };
  return statusMap[status] || formatTitleCase(status);
}

/**
 * Formats stock status for display
 */
export function formatStockStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'in-stock': 'In Stock',
    'low-stock': 'Low Stock',
    'out-of-stock': 'Out of Stock',
  };
  return statusMap[status] || formatTitleCase(status);
}

// ============================================================================
// Address Formatting
// ============================================================================

/**
 * Formats full address
 */
export function formatAddress(
  address: string,
  city?: string,
  state?: string,
  zipCode?: string,
  country?: string
): string {
  const parts = [address];
  
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (zipCode) parts.push(zipCode);
  if (country) parts.push(country);
  
  return parts.join(', ');
}

// ============================================================================
// Medical Formatting
// ============================================================================

/**
 * Formats blood type
 */
export function formatBloodType(bloodType: string): string {
  return bloodType.toUpperCase();
}

/**
 * Formats age from date of birth
 */
export function formatAge(dateOfBirth: Date | string): string {
  const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
  
  if (!isValid(dob)) return '';
  
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return `${age} years old`;
}

/**
 * Calculates age in years
 */
export function calculateAge(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
  
  if (!isValid(dob)) return 0;
  
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
}

// ============================================================================
// List Formatting
// ============================================================================

/**
 * Formats array as comma-separated list
 */
export function formatList(items: string[], conjunction: 'and' | 'or' = 'and'): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  
  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1);
  
  return `${otherItems.join(', ')}, ${conjunction} ${lastItem}`;
}

/**
 * Formats array as bulleted list
 */
export function formatBulletList(items: string[]): string {
  return items.map(item => `• ${item}`).join('\n');
}
