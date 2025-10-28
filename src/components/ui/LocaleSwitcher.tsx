'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { locales, localeLabels, type Locale } from '@/i18n/request';

export function LocaleSwitcher() {
  const t = useTranslations('settings.appearance');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    // Replace the locale in the pathname
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPathname = segments.join('/');
    
    router.push(newPathname);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="locale-select" className="text-sm font-medium">
        {t('language')}
      </label>
      <select
        id="locale-select"
        value={locale}
        onChange={(e) => handleLocaleChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeLabels[loc as Locale]}
          </option>
        ))}
      </select>
    </div>
  );
}
