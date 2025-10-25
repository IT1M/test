// Supported locales
export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// Locale labels
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
};

// RTL locales
export const rtlLocales: Locale[] = ['ar'];

export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}
