# Internationalization (i18n) Guide

This guide explains how to use internationalization features in the Saudi Mais Inventory System.

## Overview

The application supports two languages:
- **English (en)** - Default language
- **Arabic (ar)** - RTL support enabled

## Technology Stack

- **next-intl**: Main i18n library for Next.js
- **tailwindcss-rtl**: RTL support for Tailwind CSS
- **Intl API**: Native browser API for formatting

## Project Structure

```
├── messages/
│   ├── en.json          # English translations
│   └── ar.json          # Arabic translations
├── src/
│   ├── i18n.ts          # i18n configuration and utilities
│   ├── i18n/
│   │   └── request.ts   # Request configuration for next-intl
│   ├── hooks/
│   │   └── useLocaleFormatting.ts  # Client-side formatting hook
│   ├── utils/
│   │   └── formatting.ts           # Server-side formatting utilities
│   ├── components/ui/
│   │   └── LocaleSwitcher.tsx      # Language switcher component
│   └── app/
│       └── [locale]/    # Locale-based routing
```

## Usage

### 1. Using Translations in Client Components

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('common');

  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('save')}</button>
    </div>
  );
}
```

### 2. Using Translations in Server Components

```tsx
import { useTranslations } from 'next-intl';

export default function MyPage() {
  const t = useTranslations('inventory');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
    </div>
  );
}
```

### 3. Using Locale-Aware Formatting (Client)

```tsx
'use client';

import { useLocaleFormatting } from '@/hooks/useLocaleFormatting';

export function MyComponent() {
  const { formatDate, formatNumber, formatCurrency } = useLocaleFormatting();

  return (
    <div>
      <p>Date: {formatDate(new Date())}</p>
      <p>Number: {formatNumber(1234567.89)}</p>
      <p>Price: {formatCurrency(99.99, 'SAR')}</p>
    </div>
  );
}
```

### 4. Using Locale-Aware Formatting (Server)

```tsx
import { getLocale } from 'next-intl/server';
import { formatDate, formatNumber } from '@/utils/formatting';

export default async function MyPage() {
  const locale = await getLocale();

  return (
    <div>
      <p>Date: {formatDate(new Date(), locale)}</p>
      <p>Number: {formatNumber(1234567.89, locale)}</p>
    </div>
  );
}
```

### 5. Adding the Language Switcher

```tsx
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';

export function Header() {
  return (
    <header>
      <nav>
        {/* Other nav items */}
        <LocaleSwitcher />
      </nav>
    </header>
  );
}
```

### 6. Getting Current Locale

```tsx
// Client component
'use client';
import { useLocale } from 'next-intl';

export function MyComponent() {
  const locale = useLocale(); // 'en' or 'ar'
  // ...
}

// Server component
import { getLocale } from 'next-intl/server';

export default async function MyPage() {
  const locale = await getLocale(); // 'en' or 'ar'
  // ...
}
```

### 7. Creating Links with Locale

```tsx
import { Link } from 'next-intl';

export function Navigation() {
  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/settings">Settings</Link>
    </nav>
  );
}
```

Or using Next.js Link with locale:

```tsx
'use client';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export function Navigation() {
  const locale = useLocale();

  return (
    <nav>
      <Link href={`/${locale}/dashboard`}>Dashboard</Link>
      <Link href={`/${locale}/settings`}>Settings</Link>
    </nav>
  );
}
```

## RTL Support

RTL (Right-to-Left) is automatically enabled for Arabic. The `dir` attribute is set on the `<html>` tag based on the current locale.

### Using RTL-Aware Styles

The `tailwindcss-rtl` plugin provides utilities for RTL-aware styling:

```tsx
<div className="ms-4">  {/* margin-start: works for both LTR and RTL */}
  <p className="text-start">Text aligned to start</p>
</div>
```

Common RTL-aware utilities:
- `ms-*` / `me-*` - margin-start / margin-end
- `ps-*` / `pe-*` - padding-start / padding-end
- `start-*` / `end-*` - positioning
- `text-start` / `text-end` - text alignment
- `border-s-*` / `border-e-*` - borders

## Adding New Translations

1. Add the key-value pair to `messages/en.json`
2. Add the corresponding translation to `messages/ar.json`
3. Use the translation in your component with `useTranslations()`

Example:

```json
// messages/en.json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my feature"
  }
}

// messages/ar.json
{
  "myFeature": {
    "title": "ميزتي",
    "description": "هذه هي ميزتي"
  }
}
```

```tsx
// Component
const t = useTranslations('myFeature');
<h1>{t('title')}</h1>
```

## Formatting Functions

### Date Formatting

```tsx
formatDate(new Date(), locale)
// English: "January 15, 2024"
// Arabic: "١٥ يناير ٢٠٢٤"

formatDateTime(new Date(), locale)
// English: "January 15, 2024, 10:30 AM"
// Arabic: "١٥ يناير ٢٠٢٤، ١٠:٣٠ ص"
```

### Number Formatting

```tsx
formatNumber(1234567.89, locale)
// English: "1,234,567.89"
// Arabic: "١٬٢٣٤٬٥٦٧٫٨٩"
```

### Currency Formatting

```tsx
formatCurrency(99.99, locale, 'SAR')
// English: "SAR 99.99"
// Arabic: "٩٩٫٩٩ ر.س."
```

### Percentage Formatting

```tsx
formatPercent(0.1234, locale)
// English: "12%"
// Arabic: "١٢٪"
```

### Relative Time Formatting

```tsx
formatRelativeTime(yesterday, locale)
// English: "yesterday"
// Arabic: "أمس"
```

## Best Practices

1. **Always use translation keys**: Never hardcode text in components
2. **Organize translations**: Group related translations under namespaces
3. **Use RTL-aware utilities**: Use `ms-*`, `me-*`, etc. instead of `ml-*`, `mr-*`
4. **Test in both languages**: Always test your UI in both English and Arabic
5. **Use locale-aware formatting**: Always format dates, numbers, and currencies using the provided utilities
6. **Keep translations in sync**: When adding a key to one language file, add it to all language files

## Troubleshooting

### Translations not showing

- Check that the translation key exists in both `en.json` and `ar.json`
- Verify the namespace is correct in `useTranslations()`
- Ensure the component is within the `NextIntlClientProvider`

### RTL not working

- Verify the `dir` attribute is set on the `<html>` tag
- Check that you're using RTL-aware Tailwind utilities
- Ensure `tailwindcss-rtl` plugin is installed and configured

### Formatting not working

- Verify the locale is being passed correctly
- Check browser console for errors
- Ensure the date/number is valid

## Configuration Files

### next.config.js
```js
const withNextIntl = require('next-intl/plugin')();
module.exports = withNextIntl(nextConfig);
```

### src/i18n/request.ts
```ts
export default getRequestConfig(async ({ locale }) => {
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

### src/middleware.ts
Handles locale routing and authentication with i18n support.

## Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Intl API Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [tailwindcss-rtl Documentation](https://github.com/20lives/tailwindcss-rtl)
