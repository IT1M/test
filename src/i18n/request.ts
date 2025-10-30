import { getRequestConfig } from 'next-intl/server';

// Supported locales
export const locales = ['en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// Locale labels
export const localeLabels: Record<Locale, string> = {
  en: 'English',
};

// RTL locales
export const rtlLocales: Locale[] = [];

export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming locale is valid
  if (!locale || !locales.includes(locale as Locale)) {
    console.warn(`[i18n] Invalid locale received: ${locale}, using default: ${defaultLocale}`);
    locale = defaultLocale;
  }

  console.log(`[i18n] Loading messages for locale: ${locale}`);

  try {
    const messages = (await import(`../../messages/${locale}.json`)).default;
    
    console.log(`[i18n] Successfully loaded messages for: ${locale}`, typeof messages, Object.keys(messages || {}).length);
    
    return {
      locale,
      messages: messages || {},
    };
  } catch (error) {
    console.error(`[i18n] Failed to load messages for locale: ${locale}`, error);
    
    // Fallback to English
    try {
      const fallbackMessages = (await import(`../../messages/en.json`)).default;
      console.log(`[i18n] Using fallback messages (en) for failed locale: ${locale}`);
      
      return {
        locale: 'en',
        messages: fallbackMessages || {},
      };
    } catch (fallbackError) {
      console.error(`[i18n] Failed to load fallback messages:`, fallbackError);
      
      // Return empty messages as last resort
      return {
        locale: 'en',
        messages: {},
      };
    }
  }
});
