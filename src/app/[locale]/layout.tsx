import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { Toaster } from '@/components/ui/Toast';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { routing } from '@/i18n/routing';
import { locales, type Locale, isRTL } from '@/i18n/request';

export const metadata: Metadata = {
  title: 'Saudi Mais Inventory System',
  description: 'Medical inventory management system for Saudi Mais Co.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  console.log(`[Layout] Rendering layout for locale: ${locale}`);

  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    console.error(`[Layout] Invalid locale: ${locale}`);
    notFound();
  }

  // Get messages for the locale
  let messages;
  try {
    messages = await getMessages({ locale });
    console.log(`[Layout] Successfully loaded messages for: ${locale}`, messages ? 'Messages loaded' : 'No messages');
    
    // Ensure messages is not undefined
    if (!messages) {
      console.warn(`[Layout] Messages is undefined for locale: ${locale}, using empty object`);
      messages = {};
    }
  } catch (error) {
    console.error(`[Layout] Failed to load messages for locale: ${locale}`, error);
    // Use empty messages object instead of throwing
    messages = {};
  }

  // Determine text direction
  const dir = isRTL(locale as Locale) ? 'rtl' : 'ltr';

  console.log(`[Layout] Rendering with messages:`, typeof messages, messages ? Object.keys(messages).length : 'undefined');

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages || {}}>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
