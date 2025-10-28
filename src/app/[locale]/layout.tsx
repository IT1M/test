import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { Toaster } from '@/components/ui/Toast';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { SessionTrackingProvider } from '@/components/providers/SessionTrackingProvider';
import { PerformanceProvider } from '@/components/providers/PerformanceProvider';
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
    // Try to load messages directly from the file system as a fallback
    const messageModule = await import(`../../../messages/${locale}.json`);
    messages = messageModule.default;
    console.log(`[Layout] Successfully loaded messages for: ${locale}`, messages ? Object.keys(messages).length + ' keys' : 'No messages');
    
    // Ensure messages is not undefined
    if (!messages) {
      console.warn(`[Layout] Messages is undefined for locale: ${locale}, using empty object`);
      messages = {};
    }
  } catch (error) {
    console.error(`[Layout] Failed to load messages for locale: ${locale}`, error);
    
    // Try fallback to English
    try {
      const fallbackModule = await import(`../../../messages/en.json`);
      messages = fallbackModule.default || {};
      console.log(`[Layout] Using fallback messages (en) for locale: ${locale}`);
    } catch (fallbackError) {
      console.error(`[Layout] Failed to load fallback messages:`, fallbackError);
      messages = {};
    }
  }

  // Determine text direction
  const dir = isRTL(locale as Locale) ? 'rtl' : 'ltr';

  console.log(`[Layout] Rendering with messages:`, typeof messages, messages ? Object.keys(messages).length : 'undefined');

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" />
        
        {/* DNS prefetch for better performance */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          as="style"
          onLoad="this.onload=null;this.rel='stylesheet'"
        />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap"
          as="style"
          onLoad="this.onload=null;this.rel='stylesheet'"
        />
        
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Service worker registration script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <SessionProvider>
          <NextIntlClientProvider messages={messages || {}}>
            <QueryProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <PerformanceProvider>
                  <SessionTrackingProvider>
                    {children}
                  </SessionTrackingProvider>
                </PerformanceProvider>
                <Toaster />
              </ThemeProvider>
            </QueryProvider>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
