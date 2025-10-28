'use client';

import { useLocale } from 'next-intl';

export function useLocaleFormatting() {
  const locale = useLocale();

  /**
   * Format a date according to the current locale
   */
  const formatDate = (
    date: Date | string | number,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  };

  /**
   * Format a date and time according to the current locale
   */
  const formatDateTime = (
    date: Date | string | number,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  };

  /**
   * Format a number according to the current locale
   */
  const formatNumber = (
    value: number,
    options?: Intl.NumberFormatOptions
  ): string => {
    return new Intl.NumberFormat(locale, options).format(value);
  };

  /**
   * Format a currency value according to the current locale
   */
  const formatCurrency = (
    value: number,
    currency: string = 'SAR',
    options?: Intl.NumberFormatOptions
  ): string => {
    const defaultOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency,
      ...options,
    };

    return new Intl.NumberFormat(locale, defaultOptions).format(value);
  };

  /**
   * Format a percentage according to the current locale
   */
  const formatPercent = (
    value: number,
    options?: Intl.NumberFormatOptions
  ): string => {
    const defaultOptions: Intl.NumberFormatOptions = {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options,
    };

    return new Intl.NumberFormat(locale, defaultOptions).format(value);
  };

  /**
   * Format a relative time (e.g., "2 days ago")
   */
  const formatRelativeTime = (
    date: Date | string | number,
    options?: Intl.RelativeTimeFormatOptions
  ): string => {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
      { unit: 'year', seconds: 31536000 },
      { unit: 'month', seconds: 2592000 },
      { unit: 'week', seconds: 604800 },
      { unit: 'day', seconds: 86400 },
      { unit: 'hour', seconds: 3600 },
      { unit: 'minute', seconds: 60 },
      { unit: 'second', seconds: 1 },
    ];

    for (const { unit, seconds } of units) {
      const value = Math.floor(diffInSeconds / seconds);
      if (Math.abs(value) >= 1) {
        return new Intl.RelativeTimeFormat(locale, {
          numeric: 'auto',
          ...options,
        }).format(-value, unit);
      }
    }

    return new Intl.RelativeTimeFormat(locale, {
      numeric: 'auto',
      ...options,
    }).format(0, 'second');
  };

  return {
    formatDate,
    formatDateTime,
    formatNumber,
    formatCurrency,
    formatPercent,
    formatRelativeTime,
    locale,
  };
}
